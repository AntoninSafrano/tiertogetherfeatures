import mongoose from 'mongoose'
import crypto from 'crypto'
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
  // ─── Anime ──────────────────────────────────────────────────────
  { title: 'Personnages de One Piece', category: 'Anime', query: 'one piece anime characters' },
  { title: 'Personnages de Naruto', category: 'Anime', query: 'naruto shippuden characters anime' },
  { title: 'Personnages de Dragon Ball', category: 'Anime', query: 'dragon ball z characters anime' },
  { title: "Personnages d'Attack on Titan", category: 'Anime', query: 'attack on titan characters anime' },
  { title: 'Personnages de Demon Slayer', category: 'Anime', query: 'demon slayer kimetsu no yaiba characters' },
  { title: 'Personnages de My Hero Academia', category: 'Anime', query: 'my hero academia characters anime' },
  { title: 'Personnages de Jujutsu Kaisen', category: 'Anime', query: 'jujutsu kaisen characters anime' },
  { title: 'Films Studio Ghibli', category: 'Anime', query: 'studio ghibli movie posters' },

  // ─── Gaming ─────────────────────────────────────────────────────
  { title: 'Jeux Nintendo Switch', category: 'Gaming', query: 'nintendo switch games cover art' },
  { title: 'Personnages Super Smash Bros', category: 'Gaming', query: 'super smash bros ultimate fighters' },
  { title: 'Starters Pokémon', category: 'Gaming', query: 'pokemon starter evolution official art' },
  { title: 'Champions League of Legends', category: 'Gaming', query: 'league of legends champions splash art portraits' },
  { title: 'Agents Valorant', category: 'Gaming', query: 'valorant agents portraits' },
  { title: 'Jeux FromSoftware', category: 'Gaming', query: 'fromsoftware games dark souls elden ring cover' },
  { title: 'Jeux PlayStation exclusifs', category: 'Gaming', query: 'playstation exclusive games cover art' },

  // ─── Movies ─────────────────────────────────────────────────────
  { title: 'Films Marvel MCU', category: 'Movies', query: 'marvel cinematic universe movie posters' },
  { title: 'Films Pixar', category: 'Movies', query: 'pixar movie posters' },
  { title: 'Films Harry Potter', category: 'Movies', query: 'harry potter movie posters' },
  { title: 'Films Star Wars', category: 'Movies', query: 'star wars saga movie posters' },

  // ─── Music ──────────────────────────────────────────────────────
  { title: 'Rappeurs français', category: 'Music', query: 'french rappers album covers pnl damso orelsan' },
  { title: 'Rappeurs américains', category: 'Music', query: 'american rappers portraits kendrick drake eminem' },

  // ─── Sports ─────────────────────────────────────────────────────
  { title: 'Clubs de Ligue 1', category: 'Sports', query: 'ligue 1 football clubs logos psg marseille lyon' },
  { title: 'Clubs de Premier League', category: 'Sports', query: 'premier league football clubs logos' },
  { title: 'Équipes NBA', category: 'Sports', query: 'nba basketball team logos' },

  // ─── Food ───────────────────────────────────────────────────────
  { title: 'Chaînes de fast-food', category: 'Food', query: 'fast food restaurant brand logos' },
  { title: 'Bonbons et chocolats', category: 'Food', query: 'candy chocolate bar brands' },
  { title: 'Parfums de glace', category: 'Food', query: 'ice cream flavors scoops' },

  // ─── Other ──────────────────────────────────────────────────────
  { title: 'Plateformes de streaming', category: 'Other', query: 'streaming platforms logos netflix disney prime' },
  { title: 'Marques de smartphones', category: 'Other', query: 'smartphone brands logos apple samsung' },
]

// Stable roomId per template — prevents duplicates on re-run.
function templateRoomId(title: string): string {
  const hash = crypto
    .createHash('sha1')
    .update('tpl:' + title)
    .digest('hex')
    .toUpperCase()
  return 'T' + hash.slice(0, 7)
}

async function searchImages(query: string): Promise<{ title: string; imageUrl: string }[]> {
  if (!env.GOOGLE_API_KEY || !env.GOOGLE_CSE_ID) {
    console.warn('[Seed] Google API not configured, using placeholder items')
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
  url.searchParams.set('safe', 'active')

  const response = await fetch(url.toString())
  const data = await response.json() as { items?: Array<{ title?: string; link?: string }>; error?: { message?: string } }

  if (!response.ok) {
    console.error('[Seed] Google API error:', data.error?.message || data)
    return []
  }

  return (data.items || [])
    .filter(item => !!item.link)
    .map(item => ({
      title: (item.title || query).slice(0, 80),
      imageUrl: item.link!,
    }))
}

async function seed() {
  const forceReplace = process.argv.includes('--force')

  console.log('[Seed] Connecting to MongoDB...')
  await mongoose.connect(env.MONGODB_URI)
  console.log('[Seed] Connected.')

  let created = 0
  let skipped = 0
  let replaced = 0
  let failed = 0

  for (const template of TEMPLATES) {
    const roomId = templateRoomId(template.title)
    const existing = await TierListModel.findOne({ roomId })

    if (existing && !forceReplace) {
      console.log(`[Seed] · skip "${template.title}" — already exists (${roomId})`)
      skipped++
      continue
    }

    console.log(`[Seed] ↻ fetching images for "${template.title}"...`)
    const images = await searchImages(template.query)
    if (images.length === 0) {
      console.warn(`[Seed] ✗ no images for "${template.title}", skipped`)
      failed++
      continue
    }

    const pool = images.map(img => ({
      id: randomUUID(),
      label: img.title,
      imageUrl: img.imageUrl,
    }))

    const payload = {
      roomId,
      title: template.title,
      rows: DEFAULT_TIERS.map(t => ({ ...t, items: [] })),
      pool,
      ownerId: 'system',
      authorId: '',
      isPublic: true,
      downloads: 0,
      category: template.category,
      coverImage: pool[0]?.imageUrl || '',
    }

    if (existing) {
      await TierListModel.updateOne({ _id: existing._id }, payload)
      console.log(`[Seed] ✎ replaced "${template.title}" (${roomId}, ${pool.length} items)`)
      replaced++
    } else {
      await TierListModel.create(payload)
      console.log(`[Seed] ✓ created "${template.title}" (${roomId}, ${pool.length} items)`)
      created++
    }
  }

  console.log(`\n[Seed] Done. created=${created} replaced=${replaced} skipped=${skipped} failed=${failed}`)
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('[Seed] Fatal error:', err)
  process.exit(1)
})
