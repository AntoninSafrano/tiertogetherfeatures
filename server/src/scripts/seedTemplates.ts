import mongoose from 'mongoose'
import { env } from '../config/env'
import { TierListModel } from '../models/TierList'
import { randomUUID } from 'crypto'
import { DEFAULT_TIERS } from '@tiertogether/shared'

interface Template {
  title: string
  category: string
  query: string
}

const TEMPLATES: Template[] = [
  { title: 'Best Anime Characters', category: 'Anime', query: 'popular anime characters' },
  { title: 'Best Fast Food Chains', category: 'Food', query: 'fast food restaurant logos' },
  { title: 'Best Video Games of All Time', category: 'Gaming', query: 'best video games covers' },
  { title: 'Best Movies of All Time', category: 'Movies', query: 'iconic movies posters' },
  { title: 'Best Music Artists', category: 'Music', query: 'famous music artists' },
]

async function searchImages(query: string): Promise<{ title: string; imageUrl: string }[]> {
  if (!env.GOOGLE_API_KEY || !env.GOOGLE_CSE_ID) {
    console.warn('[Seed] Google API not configured, using placeholder images')
    return Array.from({ length: 10 }, (_, i) => ({
      title: `${query} ${i + 1}`,
      imageUrl: '',
    }))
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', env.GOOGLE_API_KEY)
  url.searchParams.set('cx', env.GOOGLE_CSE_ID)
  url.searchParams.set('q', query)
  url.searchParams.set('searchType', 'image')
  url.searchParams.set('num', '10')

  const response = await fetch(url.toString())
  const data = await response.json()

  if (!response.ok) {
    console.error('[Seed] Google API error:', data)
    return []
  }

  return (data.items || []).map((item: any) => ({
    title: item.title || query,
    imageUrl: item.link,
  }))
}

async function seed() {
  console.log('[Seed] Connecting to MongoDB...')
  await mongoose.connect(env.MONGODB_URI)
  console.log('[Seed] Connected.')

  for (const template of TEMPLATES) {
    // Anti-duplicate check
    const existing = await TierListModel.findOne({ title: template.title, isFeatured: true })
    if (existing) {
      console.log(`[Seed] Skipping "${template.title}" — already exists`)
      continue
    }

    console.log(`[Seed] Creating "${template.title}"...`)

    const images = await searchImages(template.query)
    if (images.length === 0) {
      console.warn(`[Seed] No images found for "${template.title}", skipping`)
      continue
    }

    const pool = images.map((img) => ({
      id: randomUUID(),
      label: img.title,
      imageUrl: img.imageUrl,
    }))

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()

    await TierListModel.create({
      roomId,
      title: template.title,
      rows: DEFAULT_TIERS.map((t) => ({ ...t, items: [] })),
      pool,
      ownerId: 'system',
      isPublic: true,
      isFeatured: true,
      downloads: 0,
      category: template.category,
      coverImage: pool[0]?.imageUrl || '',
    })

    console.log(`[Seed] ✓ "${template.title}" created (roomId: ${roomId})`)
  }

  console.log('[Seed] Done!')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('[Seed] Fatal error:', err)
  process.exit(1)
})
