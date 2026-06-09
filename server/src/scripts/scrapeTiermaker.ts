/**
 * Bulk TierMaker template scraper.
 *
 * Scrapes the most popular templates of selected TierMaker categories,
 * re-hosts every image on our Cloudinary (Cloudinary fetches the remote
 * URL itself), and writes the result to data/scraped-tiermaker.json.
 * That JSON is then imported in MongoDB with importScraped.ts.
 *
 * Run:  npx tsx server/src/scripts/scrapeTiermaker.ts
 * Resume-safe: already-scraped templates (data/scraped/<slug>.json) are skipped.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
const BASE = 'https://tiermaker.com'

const CLOUDINARY_CLOUD = 'dnbnhjbyy'
const CLOUDINARY_PRESET = 'tiertogether_preset'

// TierMaker category slug → { app category, how many templates to keep }
const SOURCES: Array<{ slug: string; category: string; take: number }> = [
  { slug: 'video-games', category: 'Gaming', take: 14 },
  { slug: 'pokemon', category: 'Gaming', take: 4 },
  { slug: 'league-of-legends', category: 'Gaming', take: 3 },
  { slug: 'food-and-drink', category: 'Food', take: 10 },
  { slug: 'fast-food', category: 'Food', take: 6 },
  { slug: 'anime-and-manga', category: 'Anime', take: 10 },
  { slug: 'anime', category: 'Anime', take: 6 },
  { slug: 'music', category: 'Music', take: 10 },
  { slug: 'albums', category: 'Music', take: 4 },
  { slug: 'movies', category: 'Movies', take: 8 },
  { slug: 'tv-and-movies', category: 'Movies', take: 5 },
  { slug: 'netflix', category: 'Movies', take: 3 },
  { slug: 'sports', category: 'Sports', take: 6 },
  { slug: 'football-soccer', category: 'Sports', take: 5 },
  { slug: 'nfl', category: 'Sports', take: 3 },
  { slug: 'animals', category: 'Other', take: 4 },
  { slug: 'cartoons', category: 'Other', take: 4 },
  { slug: 'disney', category: 'Other', take: 4 },
  { slug: 'celebrities', category: 'Other', take: 3 },
  { slug: 'board-games', category: 'Other', take: 3 },
]

const MIN_ITEMS = 8
const MAX_ITEMS = 100          // cap per template (Cloudinary quota)
const MAX_LISTED_COUNT = 400   // skip giant templates entirely
const REQUEST_DELAY_MS = 1200  // politeness delay between TierMaker requests
const UPLOAD_CONCURRENCY = 4

const OUT_DIR = join(process.cwd(), 'data')
const PER_TEMPLATE_DIR = join(OUT_DIR, 'scraped')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Cloudflare rejects Node's fetch (undici TLS fingerprint) with a 403,
// while plain curl goes through — so TierMaker requests shell out to curl.
const COOKIE_JAR = join(process.cwd(), 'data', '.tm-cookies.txt')

async function tmFetch(path: string, referer?: string): Promise<{ status: number; text: string }> {
  const args = [
    '-s', '-w', '\n__HTTP__%{http_code}',
    '-A', UA,
    '-H', 'Accept: text/html,application/json;q=0.9,*/*;q=0.8',
    '-H', 'Accept-Language: en-US,en;q=0.8,fr;q=0.6',
    '-b', COOKIE_JAR, '-c', COOKIE_JAR,
    '--compressed',
  ]
  if (referer) args.push('-H', `Referer: ${referer}`, '-H', 'X-Requested-With: XMLHttpRequest')
  args.push(`${BASE}${path}`)
  const { stdout } = await execFileAsync('curl', args, { maxBuffer: 64 * 1024 * 1024 })
  await sleep(REQUEST_DELAY_MS)
  const idx = stdout.lastIndexOf('__HTTP__')
  return {
    status: parseInt(stdout.slice(idx + '__HTTP__'.length), 10) || 0,
    text: stdout.slice(0, Math.max(0, idx - 1)),
  }
}

interface ListedTemplate {
  slug: string
  title: string
  thumb: string
  count: number
  category: string
}

function parseListing(html: string, category: string): ListedTemplate[] {
  const out: ListedTemplate[] = []
  const itemRe = /<a href='\/create\/([^']+)'><div class='image-count-container'>([^<]*)<\/div><div class='category-carousel-item'><img class='image lazy' data-src='([^']*)' \/><div class='cat-header'>([^<]*)<\/div>/g
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(html))) {
    const count = parseInt(m[2]!.replace(/[^0-9]/g, ''), 10) || 0
    out.push({
      slug: m[1]!,
      title: decodeEntities(m[4]!.trim()),
      thumb: m[3]!.startsWith('http') ? m[3]! : `${BASE}${m[3]!}`,
      count,
      category,
    })
  }
  return out
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
}

function cleanTitle(t: string): string {
  return t.replace(/\s*Tier\s*List(\s*Maker)?\s*$/i, '').trim().slice(0, 100)
}

function prettifyLabel(filename: string): string {
  let label = filename
    .toLowerCase()
    .replace(/\.(png|jpg|jpeg|gif|webp)$/i, '')
    .replace(/^(zz+-?|zzz+-?)\d*/, '')   // zzzzz-<timestamp> prefix
    .replace(/^\d+/, '')                 // numeric position prefix
    .replace(/(png|jpg|jpeg|gif|webp)$/, '') // extension glued without dot
    .replace(/[-_]+/g, ' ')
    .trim()
  if (!label) return 'Item'
  return label.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 60)
}

async function uploadToCloudinary(sourceUrl: string): Promise<string> {
  const form = new FormData()
  form.append('file', sourceUrl)
  form.append('upload_preset', CLOUDINARY_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Cloudinary ${res.status}: ${body.slice(0, 150)}`)
  }
  const data = (await res.json()) as { secure_url?: string }
  if (!data.secure_url) throw new Error('Cloudinary: no secure_url')
  return data.secure_url
}

async function uploadPool(
  urls: Array<{ src: string; label: string }>,
): Promise<Array<{ label: string; imageUrl: string }>> {
  const results: Array<{ label: string; imageUrl: string } | null> = new Array(urls.length).fill(null)
  let cursor = 0
  let done = 0
  async function worker() {
    while (cursor < urls.length) {
      const i = cursor++
      const u = urls[i]!
      try {
        const cloudUrl = await uploadToCloudinary(u.src)
        results[i] = { label: u.label, imageUrl: cloudUrl }
      } catch (err) {
        console.warn(`    ✗ ${u.label}: ${(err as Error).message}`)
      }
      done++
      if (done % 20 === 0) console.log(`    … ${done}/${urls.length} images`)
    }
  }
  await Promise.all(Array.from({ length: UPLOAD_CONCURRENCY }, worker))
  return results.filter((r): r is { label: string; imageUrl: string } => r !== null)
}

async function scrapeTemplate(tpl: ListedTemplate): Promise<void> {
  const safeSlug = tpl.slug.replace(/[^a-zA-Z0-9-_]/g, '_')
  const doneFile = join(PER_TEMPLATE_DIR, `${safeSlug}.json`)
  if (existsSync(doneFile)) {
    console.log(`  ⏭  ${tpl.title} (déjà scrapé)`)
    return
  }

  console.log(`  ▶ ${tpl.title} [${tpl.category}] (${tpl.count} items annoncés)`)

  // 1. The create page gives baseTierImagePath + dateLastEdited
  const pageRes = await tmFetch(`/create/${tpl.slug}`)
  if (pageRes.status !== 200) { console.warn(`    page HTTP ${pageRes.status}, skip`); return }
  const html = pageRes.text
  const baseMatch = html.match(/baseTierImagePath = "([^"]+)"/)
  const dateMatch = html.match(/dateLastEdited = "([^"]+)"/)
  if (!baseMatch) { console.warn('    pas de baseTierImagePath, skip'); return }
  const basePath = baseMatch[1]!
  const lastEdited = dateMatch?.[1] ?? ''

  // 2. The JSON API lists the image filenames (index 0 = base path)
  const apiRes = await tmFetch(
    `/api/?type=templates-v2&id=${encodeURIComponent(tpl.slug)}&lastEdited=${encodeURIComponent(lastEdited)}&variation=`,
    `${BASE}/create/${tpl.slug}`,
  )
  if (apiRes.status !== 200) { console.warn(`    api HTTP ${apiRes.status}, skip`); return }
  let images: Array<string | { id: string; src: string }>
  try {
    images = JSON.parse(apiRes.text)
  } catch {
    console.warn('    api non-JSON (challenge?), skip')
    return
  }
  if (!Array.isArray(images) || images.length < 2) { console.warn('    api vide, skip'); return }

  const entries = images.slice(1, MAX_ITEMS + 1).map((img) => {
    const src = typeof img === 'object' ? img.src : img
    const abs = src.includes('tiermaker.com/')
      ? src
      : `${BASE}/images${basePath}/${src}`
    return { src: abs, label: prettifyLabel(typeof img === 'object' ? img.src : img) }
  })

  if (entries.length < MIN_ITEMS) { console.warn(`    seulement ${entries.length} items, skip`); return }

  // 3. Re-host every image on our Cloudinary
  const pool = await uploadPool(entries)
  if (pool.length < MIN_ITEMS) { console.warn(`    seulement ${pool.length} uploads OK, skip`); return }

  // 4. Cover
  let coverImage = ''
  try {
    coverImage = await uploadToCloudinary(tpl.thumb)
  } catch {
    coverImage = pool[0]!.imageUrl
  }

  const doc = {
    slug: tpl.slug,
    title: cleanTitle(tpl.title),
    category: tpl.category,
    coverImage,
    items: pool,
  }
  writeFileSync(doneFile, JSON.stringify(doc, null, 2))
  console.log(`    ✓ ${pool.length} items uploadés`)
}

async function run() {
  mkdirSync(PER_TEMPLATE_DIR, { recursive: true })

  // Warm up the cookie jar (Cloudflare)
  await tmFetch('/')

  // 1. Collect template listings
  const listed: ListedTemplate[] = []
  const seen = new Set<string>()
  for (const src of SOURCES) {
    console.log(`\n── Catégorie ${src.slug} → ${src.category}`)
    const res = await tmFetch(`/categories/${src.slug}`)
    if (res.status !== 200) { console.warn(`  listing HTTP ${res.status}, skip`); continue }
    const all = parseListing(res.text, src.category)
    const kept = all
      .filter((t) => t.count >= MIN_ITEMS && t.count <= MAX_LISTED_COUNT)
      .filter((t) => !seen.has(t.slug))
      .slice(0, src.take)
    kept.forEach((t) => seen.add(t.slug))
    console.log(`  ${all.length} templates trouvés, ${kept.length} retenus`)
    listed.push(...kept)
  }

  console.log(`\n══ ${listed.length} templates à scraper ══`)

  // 2. Scrape each template (sequential to stay polite with TierMaker)
  for (const tpl of listed) {
    try {
      await scrapeTemplate(tpl)
    } catch (err) {
      console.warn(`  ✗ ${tpl.slug}: ${(err as Error).message}`)
    }
  }

  // 3. Merge per-template files into the final JSON
  const merged = readdirSync(PER_TEMPLATE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(PER_TEMPLATE_DIR, f), 'utf-8')))
  writeFileSync(join(OUT_DIR, 'scraped-tiermaker.json'), JSON.stringify(merged, null, 2))
  console.log(`\n✓ ${merged.length} tierlists écrites dans data/scraped-tiermaker.json`)
}

run().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
