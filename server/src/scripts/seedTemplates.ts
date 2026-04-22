import mongoose from 'mongoose'
import crypto from 'crypto'
import { env } from '../config/env'
import { TierListModel } from '../models/TierList'
import { randomUUID } from 'crypto'
import { DEFAULT_TIERS } from '@tiertogether/shared'

// ─── Source adapters ────────────────────────────────────────────
// Each template declares where its pool items come from. No Google
// Custom Search — we use specialized, free, no-auth APIs that give
// high-quality, on-topic images.

type SourceSpec =
  | { kind: 'jikan-chars'; malId: number; limit?: number }
  | { kind: 'jikan-top-anime'; limit?: number }
  | { kind: 'jikan-top-chars'; limit?: number }
  | { kind: 'pokeapi'; ids: number[] }
  | { kind: 'lol-champs'; names: string[] }
  | { kind: 'curated'; items: Array<{ label: string; imageUrl: string }> }

interface Template {
  title: string
  category: string
  source: SourceSpec
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'TierTogether-Seeder/1.0 (+https://tiertogether.fr)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json() as Promise<T>
}

async function fetchJikanCharacters(
  malId: number,
  limit = 20,
): Promise<Array<{ label: string; imageUrl: string }>> {
  type Resp = {
    data: Array<{
      character: { name: string; images?: { jpg?: { image_url?: string } } }
      favorites?: number
      role?: string
    }>
  }
  const d = await fetchJson<Resp>(`https://api.jikan.moe/v4/anime/${malId}/characters`)
  return (d.data || [])
    .filter(c => !!c.character?.images?.jpg?.image_url)
    .sort((a, b) => (b.favorites || 0) - (a.favorites || 0))
    .slice(0, limit)
    .map(c => ({
      label: c.character.name,
      imageUrl: c.character.images!.jpg!.image_url!,
    }))
}

async function fetchJikanTopAnime(limit = 20): Promise<Array<{ label: string; imageUrl: string }>> {
  type Resp = { data: Array<{ title: string; images?: { jpg?: { large_image_url?: string; image_url?: string } } }> }
  const d = await fetchJson<Resp>(`https://api.jikan.moe/v4/top/anime?limit=${Math.min(limit, 25)}`)
  return (d.data || [])
    .map(a => ({
      label: a.title,
      imageUrl: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '',
    }))
    .filter(x => !!x.imageUrl)
    .slice(0, limit)
}

async function fetchJikanTopChars(limit = 20): Promise<Array<{ label: string; imageUrl: string }>> {
  type Resp = { data: Array<{ name: string; images?: { jpg?: { image_url?: string } } }> }
  const d = await fetchJson<Resp>(`https://api.jikan.moe/v4/top/characters?limit=${Math.min(limit, 25)}`)
  return (d.data || [])
    .map(c => ({
      label: c.name,
      imageUrl: c.images?.jpg?.image_url || '',
    }))
    .filter(x => !!x.imageUrl)
    .slice(0, limit)
}

async function fetchPokemon(ids: number[]): Promise<Array<{ label: string; imageUrl: string }>> {
  const items: Array<{ label: string; imageUrl: string }> = []
  for (const id of ids) {
    try {
      const d = await fetchJson<any>(`https://pokeapi.co/api/v2/pokemon/${id}`)
      const art: string | undefined = d.sprites?.other?.['official-artwork']?.front_default
      if (art) {
        items.push({
          label: String(d.name).charAt(0).toUpperCase() + String(d.name).slice(1),
          imageUrl: art,
        })
      }
    } catch (err) {
      console.warn(`[Seed] pokeapi #${id} failed:`, (err as Error).message)
    }
    await sleep(80)
  }
  return items
}

async function fetchLolChamps(names: string[]): Promise<Array<{ label: string; imageUrl: string }>> {
  const versions = await fetchJson<string[]>('https://ddragon.leagueoflegends.com/api/versions.json')
  const version = versions[0] || '14.1.1'
  const d = await fetchJson<{ data: Record<string, { id: string; name: string }> }>(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  )
  const all = Object.values(d.data)
  const picked: Array<{ label: string; imageUrl: string }> = []
  for (const n of names) {
    const c = all.find(ch => ch.name === n || ch.id === n)
    if (c) {
      picked.push({
        label: c.name,
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${c.id}_0.jpg`,
      })
    } else {
      console.warn(`[Seed] LoL champion "${n}" not found in Data Dragon`)
    }
  }
  return picked
}

async function fetchSource(src: SourceSpec): Promise<Array<{ label: string; imageUrl: string }>> {
  switch (src.kind) {
    case 'jikan-chars':
      return fetchJikanCharacters(src.malId, src.limit ?? 20)
    case 'jikan-top-anime':
      return fetchJikanTopAnime(src.limit ?? 20)
    case 'jikan-top-chars':
      return fetchJikanTopChars(src.limit ?? 20)
    case 'pokeapi':
      return fetchPokemon(src.ids)
    case 'lol-champs':
      return fetchLolChamps(src.names)
    case 'curated':
      return src.items
  }
}

// ─── Template catalog ───────────────────────────────────────────

const TEMPLATES: Template[] = [
  // ── Anime — characters via Jikan ──────────────────────────────
  { title: 'Personnages de One Piece', category: 'Anime', source: { kind: 'jikan-chars', malId: 21, limit: 20 } },
  { title: 'Personnages de Naruto Shippuden', category: 'Anime', source: { kind: 'jikan-chars', malId: 1735, limit: 20 } },
  { title: 'Personnages de Dragon Ball Z', category: 'Anime', source: { kind: 'jikan-chars', malId: 813, limit: 20 } },
  { title: "Personnages d'Attack on Titan", category: 'Anime', source: { kind: 'jikan-chars', malId: 16498, limit: 20 } },
  { title: 'Personnages de Demon Slayer', category: 'Anime', source: { kind: 'jikan-chars', malId: 38000, limit: 20 } },
  { title: 'Personnages de My Hero Academia', category: 'Anime', source: { kind: 'jikan-chars', malId: 31964, limit: 20 } },
  { title: 'Personnages de Jujutsu Kaisen', category: 'Anime', source: { kind: 'jikan-chars', malId: 40748, limit: 20 } },
  { title: 'Personnages de Death Note', category: 'Anime', source: { kind: 'jikan-chars', malId: 1535, limit: 15 } },
  { title: 'Personnages de Hunter x Hunter', category: 'Anime', source: { kind: 'jikan-chars', malId: 11061, limit: 20 } },
  { title: 'Personnages de Fullmetal Alchemist Brotherhood', category: 'Anime', source: { kind: 'jikan-chars', malId: 5114, limit: 20 } },
  { title: 'Personnages de Bleach', category: 'Anime', source: { kind: 'jikan-chars', malId: 269, limit: 20 } },
  { title: 'Personnages de One Punch Man', category: 'Anime', source: { kind: 'jikan-chars', malId: 30276, limit: 15 } },
  { title: 'Personnages de Chainsaw Man', category: 'Anime', source: { kind: 'jikan-chars', malId: 44511, limit: 15 } },

  // ── Anime — meta ──────────────────────────────────────────────
  { title: 'Top animes de tous les temps', category: 'Anime', source: { kind: 'jikan-top-anime', limit: 25 } },
  { title: "Top personnages d'animes", category: 'Anime', source: { kind: 'jikan-top-chars', limit: 25 } },

  // ── Gaming ────────────────────────────────────────────────────
  {
    title: 'Starters Pokémon (toutes générations)',
    category: 'Gaming',
    source: {
      kind: 'pokeapi',
      ids: [
        1, 4, 7,           // Gen 1
        152, 155, 158,     // Gen 2
        252, 255, 258,     // Gen 3
        387, 390, 393,     // Gen 4
        495, 498, 501,     // Gen 5
        650, 653, 656,     // Gen 6
        722, 725, 728,     // Gen 7
        810, 813, 816,     // Gen 8
        906, 909, 912,     // Gen 9
      ],
    },
  },
  {
    title: 'Champions League of Legends',
    category: 'Gaming',
    source: {
      kind: 'lol-champs',
      names: [
        'Ahri', 'Akali', 'Ashe', 'Caitlyn', 'Darius', 'Draven', 'Ezreal', 'Fiora',
        'Garen', 'Jhin', 'Jinx', 'Kayn', 'Lee Sin', 'Lux', 'Malphite', 'Master Yi',
        'Mordekaiser', 'Riven', 'Senna', 'Sett', 'Teemo', 'Thresh', 'Vayne',
        'Viktor', 'Yasuo', 'Zed',
      ],
    },
  },

  // ── Curated lists (stable Wikimedia assets) ───────────────────
  {
    title: 'Chaînes de fast-food',
    category: 'Food',
    source: {
      kind: 'curated',
      items: [
        { label: "McDonald's",     imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg' },
        { label: 'Burger King',    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Burger_King_2020.svg' },
        { label: 'KFC',            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/KFC_logo.svg' },
        { label: 'Subway',         imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Subway_2016_logo.svg' },
        { label: 'Starbucks',      imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg' },
        { label: 'Pizza Hut',      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Pizza_Hut_Logo.svg' },
        { label: "Domino's Pizza", imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Dominos_pizza_logo.svg' },
        { label: 'Taco Bell',      imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b3/Taco_Bell_2016.svg' },
        { label: "Wendy's",        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Wendy%27s_logo.svg' },
        { label: 'Quick',          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Quick_Logo.svg' },
        { label: 'Chipotle',       imageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/98/Chipotle_Mexican_Grill_logo.svg' },
        { label: 'Five Guys',      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Five_Guys_logo.svg' },
      ],
    },
  },
  {
    title: 'Plateformes de streaming',
    category: 'Other',
    source: {
      kind: 'curated',
      items: [
        { label: 'Netflix',              imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
        { label: 'Disney+',              imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
        { label: 'Amazon Prime Video',   imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png' },
        { label: 'HBO Max',              imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg' },
        { label: 'Apple TV+',            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg' },
        { label: 'Crunchyroll',          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Crunchyroll_Logo.svg' },
        { label: 'YouTube',              imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg' },
        { label: 'Twitch',               imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Twitch_logo.svg' },
        { label: 'Paramount+',           imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount%2B_logo.svg' },
        { label: 'Canal+',               imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Canal%2B_logo_%28yellow%29.svg' },
        { label: 'Spotify',              imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg' },
        { label: 'Deezer',               imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Deezer_logo%2C_2023.svg' },
      ],
    },
  },
  {
    title: 'Marques de smartphones',
    category: 'Other',
    source: {
      kind: 'curated',
      items: [
        { label: 'Apple',     imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
        { label: 'Samsung',   imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
        { label: 'Google Pixel', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Pixel_logo_%282023%29.svg' },
        { label: 'Xiaomi',    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo_%282021-%29.svg' },
        { label: 'Huawei',    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Huawei_Standard_logo.svg' },
        { label: 'OnePlus',   imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/OnePlus_logo.svg' },
        { label: 'Oppo',      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/OPPO_LOGO_2019.svg' },
        { label: 'Sony',      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg' },
        { label: 'Motorola',  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Motorola_wordmark.svg' },
        { label: 'Nothing',   imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Nothing_Logo.svg' },
      ],
    },
  },
]

// Stable roomId per template title — idempotent re-runs.
function templateRoomId(title: string): string {
  const hash = crypto.createHash('sha1').update('tpl:' + title).digest('hex').toUpperCase()
  return 'T' + hash.slice(0, 7)
}

async function seed() {
  const forceReplace = process.argv.includes('--force')

  console.log('[Seed] Connecting to MongoDB...')
  await mongoose.connect(env.MONGODB_URI)
  console.log('[Seed] Connected.')

  let created = 0
  let replaced = 0
  let skipped = 0
  let failed = 0

  for (const template of TEMPLATES) {
    const roomId = templateRoomId(template.title)
    const existing = await TierListModel.findOne({ roomId })

    if (existing && !forceReplace) {
      console.log(`[Seed] · skip "${template.title}" — already exists (${roomId})`)
      skipped++
      continue
    }

    console.log(`[Seed] ↻ fetching items for "${template.title}" [${template.source.kind}]...`)
    let items: Array<{ label: string; imageUrl: string }> = []
    try {
      items = await fetchSource(template.source)
    } catch (err) {
      console.warn(`[Seed] ✗ fetch failed for "${template.title}":`, (err as Error).message)
      failed++
      continue
    }

    if (items.length === 0) {
      console.warn(`[Seed] ✗ no items for "${template.title}", skipped`)
      failed++
      continue
    }

    const pool = items.map(i => ({
      id: randomUUID(),
      label: i.label.slice(0, 80),
      imageUrl: i.imageUrl,
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

    // Respect Jikan rate limits (3 req/sec, 60 req/min).
    await sleep(1500)
  }

  console.log(`\n[Seed] Done. created=${created} replaced=${replaced} skipped=${skipped} failed=${failed}`)
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('[Seed] Fatal error:', err)
  process.exit(1)
})
