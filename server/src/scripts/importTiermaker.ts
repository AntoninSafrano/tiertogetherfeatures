import mongoose from 'mongoose'
import crypto from 'crypto'
import { readFileSync } from 'fs'
import { env } from '../config/env'
import { TierListModel } from '../models/TierList'
import { randomUUID } from 'crypto'
import { DEFAULT_TIERS } from '@tiertogether/shared'

// ─── Cloudinary ─────────────────────────────────────────────────
// Unsigned preset — Cloudinary fetches each remote URL itself and hosts
// the image on our cloud, so we never touch the bytes and we stay well
// inside TierMaker's rate limits (they never see our server IP).

const CLOUDINARY_CLOUD = 'dnbnhjbyy'
const CLOUDINARY_PRESET = 'tiertogether_preset'

async function uploadRemoteToCloudinary(sourceUrl: string): Promise<string> {
  const form = new FormData()
  form.append('file', sourceUrl)
  form.append('upload_preset', CLOUDINARY_PRESET)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: 'POST', body: form },
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Cloudinary ${res.status}: ${body.slice(0, 180)}`)
  }
  const data = await res.json() as { secure_url?: string; error?: { message?: string } }
  if (!data.secure_url) throw new Error('Cloudinary: no secure_url returned')
  return data.secure_url
}

// ─── Input shape (from the browser-side snippet) ────────────────

interface ScrapedItem {
  id: string
  src: string
  label?: string
}

interface ScrapedPayload {
  title: string
  cover?: string | null
  items: ScrapedItem[]
}

function prettifyLabel(rawLabel: string, src: string): string {
  // If the browser couldn't pick up a label, derive from the filename.
  // TierMaker filenames look like `zz1557261948bonefish-grill-logo-logo-black-and-whitepng`
  // (numeric prefix + slug + extension WITHOUT a dot).
  let label = (rawLabel || '').trim()
  if (label) return label.slice(0, 60)

  const fname = (src.split('/').pop() || '').toLowerCase()
  label = fname
    .replace(/^(zz+|zzz+-?)\d*/, '')      // numeric timestamp prefix
    .replace(/(png|jpg|jpeg|gif|webp)$/, '')
    .replace(/-+/g, ' ')
    .trim()
  if (!label) return 'Item'
  return label.replace(/\b\w/g, c => c.toUpperCase()).slice(0, 60)
}

function roomIdFromTitle(title: string, salt = 'tm'): string {
  const hash = crypto.createHash('sha1').update(`${salt}:${title}`).digest('hex').toUpperCase()
  return 'T' + hash.slice(0, 7)
}

async function run() {
  // Usage: node importTiermaker.js --file=payload.json --category=Food [--force]
  //    or: node importTiermaker.js --category=Food < payload.json
  const force = process.argv.includes('--force')
  const categoryArg = process.argv.find(a => a.startsWith('--category='))
  const category = categoryArg?.split('=')[1] ?? 'Other'
  const fileArg = process.argv.find(a => a.startsWith('--file='))
  const titleArg = process.argv.find(a => a.startsWith('--title='))?.split('=')[1]

  let raw: string
  if (fileArg) {
    raw = readFileSync(fileArg.slice('--file='.length), 'utf-8')
  } else {
    raw = await new Promise<string>((resolve, reject) => {
      let buf = ''
      process.stdin.setEncoding('utf-8')
      process.stdin.on('data', chunk => { buf += chunk })
      process.stdin.on('end', () => resolve(buf))
      process.stdin.on('error', reject)
    })
  }

  let payload: ScrapedPayload
  try {
    payload = JSON.parse(raw)
  } catch (err) {
    throw new Error(`Invalid JSON input: ${(err as Error).message}`)
  }

  if (!payload.items || payload.items.length === 0) {
    throw new Error('Payload has no items')
  }

  // Strip TierMaker title suffixes so we don't seed "... Tier List Maker" lists.
  const cleanTitle = (t: string) =>
    t.replace(/\s*Tier\s*List(\s*Maker)?\s*$/i, '').trim()
  const finalTitle = (titleArg || cleanTitle(payload.title) || 'Imported Template').trim().slice(0, 100)

  // Absolutize relative src URLs (TierMaker returns paths like /images/...).
  const absolutize = (src: string) =>
    src.startsWith('http') ? src : `https://tiermaker.com${src.startsWith('/') ? '' : '/'}${src}`

  console.log(`[Import] "${finalTitle}" — ${payload.items.length} items, category=${category}`)

  await mongoose.connect(env.MONGODB_URI)

  const roomId = roomIdFromTitle(finalTitle)
  const existing = await TierListModel.findOne({ roomId })
  if (existing && !force) {
    console.log(`[Import] Template "${finalTitle}" already exists (${roomId}). Use --force to overwrite.`)
    await mongoose.disconnect()
    return
  }

  const pool: Array<{ id: string; label: string; imageUrl: string }> = []
  for (let i = 0; i < payload.items.length; i++) {
    const it = payload.items[i]!
    const absSrc = absolutize(it.src)
    const label = prettifyLabel(it.label ?? '', absSrc)
    try {
      const cloudUrl = await uploadRemoteToCloudinary(absSrc)
      pool.push({ id: randomUUID(), label, imageUrl: cloudUrl })
      console.log(`[Import] ${String(i + 1).padStart(3)}/${payload.items.length} ✓ ${label}`)
    } catch (err) {
      console.warn(`[Import] ${String(i + 1).padStart(3)}/${payload.items.length} ✗ ${label}: ${(err as Error).message}`)
    }
  }

  if (pool.length === 0) {
    console.error('[Import] No item uploaded successfully, aborting.')
    await mongoose.disconnect()
    process.exit(2)
  }

  let coverImage = ''
  if (payload.cover) {
    try {
      coverImage = await uploadRemoteToCloudinary(absolutize(payload.cover))
      console.log(`[Import] cover ✓`)
    } catch (err) {
      console.warn(`[Import] cover upload failed: ${(err as Error).message}`)
    }
  }
  if (!coverImage) coverImage = pool[0]!.imageUrl

  const doc = {
    roomId,
    title: finalTitle,
    rows: DEFAULT_TIERS.map(t => ({ ...t, items: [] })),
    pool,
    ownerId: 'system',
    authorId: '',
    isPublic: true,
    downloads: 0,
    category,
    coverImage,
  }

  if (existing) {
    await TierListModel.updateOne({ _id: existing._id }, doc)
    console.log(`[Import] ✎ replaced "${finalTitle}" (${roomId}, ${pool.length} items)`)
  } else {
    await TierListModel.create(doc)
    console.log(`[Import] ✓ created "${finalTitle}" (${roomId}, ${pool.length} items)`)
  }

  await mongoose.disconnect()
}

run().catch(err => {
  console.error('[Import] Fatal:', err)
  process.exit(1)
})
