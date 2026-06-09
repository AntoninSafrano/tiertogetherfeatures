/**
 * Import the tierlists produced by scrapeTiermaker.ts into MongoDB.
 *
 * Usage:
 *   node importScraped.js --file=data/scraped-tiermaker.json [--purge]
 *
 * --purge : delete ALL existing tierlists first (make a mongodump before!)
 *
 * Idempotent: each template gets a stable roomId derived from its title,
 * so re-running replaces instead of duplicating.
 */
import mongoose from 'mongoose'
import crypto from 'crypto'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { env } from '../config/env'
import { TierListModel } from '../models/TierList'
import { DEFAULT_TIERS } from '@tiertogether/shared'

interface ScrapedList {
  slug: string
  title: string
  category: string
  coverImage: string
  items: Array<{ label: string; imageUrl: string }>
}

async function run() {
  const fileArg = process.argv.find((a) => a.startsWith('--file='))
  if (!fileArg) throw new Error('Usage: importScraped --file=<json> [--purge]')
  const purge = process.argv.includes('--purge')

  const lists = JSON.parse(readFileSync(fileArg.slice('--file='.length), 'utf-8')) as ScrapedList[]
  if (!Array.isArray(lists) || lists.length === 0) throw new Error('JSON vide')

  await mongoose.connect(env.MONGODB_URI)

  if (purge) {
    const { deletedCount } = await TierListModel.deleteMany({})
    console.log(`[Import] --purge : ${deletedCount} tierlists supprimées`)
  }

  let created = 0
  let replaced = 0
  for (const list of lists) {
    const roomId = 'T' + crypto.createHash('sha1').update(`tm:${list.title}`).digest('hex').toUpperCase().slice(0, 7)
    const doc = {
      roomId,
      title: list.title,
      rows: DEFAULT_TIERS.map((t) => ({ ...t, items: [] })),
      pool: list.items.map((it) => ({ id: randomUUID(), label: it.label, imageUrl: it.imageUrl })),
      ownerId: 'system',
      authorId: '',
      isPublic: true,
      downloads: 0,
      category: list.category,
      coverImage: list.coverImage,
    }
    const existing = await TierListModel.findOne({ roomId }).select('_id').lean()
    if (existing) {
      await TierListModel.updateOne({ _id: existing._id }, doc)
      replaced++
    } else {
      await TierListModel.create(doc)
      created++
    }
  }

  console.log(`[Import] ✓ ${created} créées, ${replaced} remplacées (${lists.length} au total)`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error('[Import] Fatal:', err)
  process.exit(1)
})
