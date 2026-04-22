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
  | { kind: 'lol-champs'; names?: string[]; all?: boolean }
  | { kind: 'royale-cards'; slugs: string[] }
  | { kind: 'steam'; games: Array<{ label: string; appId: number }> }
  | { kind: 'wiki-fr-pages'; pages: Array<{ label: string; page: string; imageUrl?: string }>; thumbSize?: number }
  | { kind: 'curated'; items: Array<{ label: string; imageUrl: string }> }

interface TierRowSpec {
  id: string
  label: string
  color: string
}

interface Template {
  title: string
  category: string
  source: SourceSpec
  rows?: TierRowSpec[] // override DEFAULT_TIERS when the template needs custom labels
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

async function fetchLolChamps(
  opts: { names?: string[]; all?: boolean },
): Promise<Array<{ label: string; imageUrl: string }>> {
  const versions = await fetchJson<string[]>('https://ddragon.leagueoflegends.com/api/versions.json')
  const version = versions[0] || '14.1.1'
  const d = await fetchJson<{ data: Record<string, { id: string; name: string }> }>(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
  )
  const all = Object.values(d.data)
  if (opts.all) {
    return all
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({
        label: c.name,
        // Square 120×120 icon scales well at 80px display (vs wide splash arts).
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.id}.png`,
      }))
  }
  const picked: Array<{ label: string; imageUrl: string }> = []
  for (const n of opts.names ?? []) {
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

function fetchRoyaleCards(slugs: string[]): Array<{ label: string; imageUrl: string }> {
  return slugs.map(slug => ({
    label: slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    imageUrl: `https://cdn.royaleapi.com/static/img/cards-150/${slug}.png`,
  }))
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function fetchSteamCovers(
  games: Array<{ label: string; appId: number }>,
): Promise<Array<{ label: string; imageUrl: string }>> {
  // Preflight each appId: prefer library_600x900_2x (vertical box art);
  // fall back to header.jpg for older/delisted games that lack the newer
  // asset. Drop entries where both are missing.
  const out: Array<{ label: string; imageUrl: string }> = []
  for (const g of games) {
    const boxArt = `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appId}/library_600x900_2x.jpg`
    const header = `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appId}/header.jpg`
    if (await checkUrl(boxArt)) {
      out.push({ label: g.label, imageUrl: boxArt })
    } else if (await checkUrl(header)) {
      out.push({ label: g.label, imageUrl: header })
    } else {
      console.warn(`[Seed] steam appId ${g.appId} ("${g.label}") has no usable cover, skipped`)
    }
  }
  return out
}

async function fetchWikipediaFrPages(
  pages: Array<{ label: string; page: string; imageUrl?: string }>,
  thumbSize = 400,
): Promise<Array<{ label: string; imageUrl: string }>> {
  const out: Array<{ label: string; imageUrl: string }> = []
  for (const p of pages) {
    if (p.imageUrl) {
      out.push({ label: p.label, imageUrl: p.imageUrl })
      continue
    }
    try {
      const url = new URL('https://fr.wikipedia.org/w/api.php')
      url.searchParams.set('action', 'query')
      url.searchParams.set('prop', 'pageimages')
      url.searchParams.set('format', 'json')
      url.searchParams.set('pithumbsize', String(thumbSize))
      url.searchParams.set('titles', p.page)
      url.searchParams.set('redirects', '1')
      const d = await fetchJson<any>(url.toString())
      const pageEntry = Object.values(d?.query?.pages || {})[0] as any
      const src = pageEntry?.thumbnail?.source as string | undefined
      if (src) {
        out.push({ label: p.label, imageUrl: src })
      } else {
        console.warn(`[Seed] wiki-fr "${p.page}": no thumbnail, skipped`)
      }
    } catch (err) {
      console.warn(`[Seed] wiki-fr "${p.page}" failed:`, (err as Error).message)
    }
    await sleep(150)
  }
  return out
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
      return fetchLolChamps({ names: src.names, all: src.all })
    case 'royale-cards':
      return fetchRoyaleCards(src.slugs)
    case 'steam':
      return fetchSteamCovers(src.games)
    case 'wiki-fr-pages':
      return fetchWikipediaFrPages(src.pages, src.thumbSize)
    case 'curated':
      return src.items
  }
}

// ─── Template catalog ───────────────────────────────────────────

const TEMPLATES: Template[] = [
  // ── Anime — characters via Jikan ──────────────────────────────
  { title: 'Personnages de One Piece', category: 'Anime', source: { kind: 'jikan-chars', malId: 21, limit: 50 } },
  { title: 'Personnages de Naruto Shippuden', category: 'Anime', source: { kind: 'jikan-chars', malId: 1735, limit: 30 } },
  { title: 'Personnages de Dragon Ball Z', category: 'Anime', source: { kind: 'jikan-chars', malId: 813, limit: 30 } },
  { title: "Personnages d'Attack on Titan", category: 'Anime', source: { kind: 'jikan-chars', malId: 16498, limit: 30 } },
  { title: 'Personnages de Demon Slayer', category: 'Anime', source: { kind: 'jikan-chars', malId: 38000, limit: 30 } },
  { title: 'Personnages de My Hero Academia', category: 'Anime', source: { kind: 'jikan-chars', malId: 31964, limit: 30 } },
  { title: 'Personnages de Jujutsu Kaisen', category: 'Anime', source: { kind: 'jikan-chars', malId: 40748, limit: 30 } },
  { title: 'Personnages de Death Note', category: 'Anime', source: { kind: 'jikan-chars', malId: 1535, limit: 15 } },
  { title: 'Personnages de Hunter x Hunter', category: 'Anime', source: { kind: 'jikan-chars', malId: 11061, limit: 30 } },
  { title: 'Personnages de Fullmetal Alchemist Brotherhood', category: 'Anime', source: { kind: 'jikan-chars', malId: 5114, limit: 25 } },
  { title: 'Personnages de Bleach', category: 'Anime', source: { kind: 'jikan-chars', malId: 269, limit: 30 } },
  { title: 'Personnages de One Punch Man', category: 'Anime', source: { kind: 'jikan-chars', malId: 30276, limit: 15 } },
  { title: 'Personnages de Chainsaw Man', category: 'Anime', source: { kind: 'jikan-chars', malId: 44511, limit: 15 } },
  { title: "Personnages de JoJo's Bizarre Adventure", category: 'Anime', source: { kind: 'jikan-chars', malId: 14719, limit: 25 } },
  { title: 'Personnages de Code Geass', category: 'Anime', source: { kind: 'jikan-chars', malId: 1575, limit: 15 } },
  { title: 'Personnages de Vinland Saga', category: 'Anime', source: { kind: 'jikan-chars', malId: 37521, limit: 15 } },
  { title: 'Personnages de Spy x Family', category: 'Anime', source: { kind: 'jikan-chars', malId: 50265, limit: 15 } },
  { title: 'Personnages de Steins;Gate', category: 'Anime', source: { kind: 'jikan-chars', malId: 9253, limit: 12 } },
  { title: 'Personnages de Cowboy Bebop', category: 'Anime', source: { kind: 'jikan-chars', malId: 1, limit: 12 } },
  { title: 'Personnages de Haikyuu', category: 'Anime', source: { kind: 'jikan-chars', malId: 20583, limit: 25 } },
  { title: 'Personnages de Tokyo Ghoul', category: 'Anime', source: { kind: 'jikan-chars', malId: 22319, limit: 15 } },
  { title: 'Personnages de Mob Psycho 100', category: 'Anime', source: { kind: 'jikan-chars', malId: 32182, limit: 12 } },

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
    title: 'Champions League of Legends (tous)',
    category: 'Gaming',
    source: { kind: 'lol-champs', all: true },
  },

  {
    title: 'Cartes Clash Royale',
    category: 'Gaming',
    source: {
      kind: 'royale-cards',
      slugs: [
        // Troupes — communes & rares
        'knight', 'archers', 'bomber', 'goblins', 'spear-goblins', 'skeletons',
        'minions', 'minion-horde', 'barbarians', 'elite-barbarians', 'fire-spirit',
        'ice-spirits', 'electro-spirits', 'heal-spirit', 'bats', 'royal-recruits',
        'guards', 'three-musketeers', 'valkyrie', 'musketeer', 'wizard',
        'mini-pekka', 'giant', 'witch', 'baby-dragon', 'prince', 'dark-prince',
        'hog-rider', 'goblin-gang', 'dart-goblin', 'mega-minion', 'ice-golem',
        'royal-giant', 'royal-hogs', 'zappies', 'rascals', 'flying-machine',
        'skeleton-barrel', 'firecracker', 'elixir-golem', 'battle-ram',
        'hunter', 'executioner', 'electro-dragon', 'cannon-cart', 'bowler',
        // Épiques
        'pekka', 'golem', 'balloon', 'giant-skeleton', 'lava-hound',
        'mega-knight', 'electro-giant', 'wall-breakers',
        // Légendaires
        'princess', 'ice-wizard', 'lumberjack', 'sparky', 'miner', 'the-log',
        'bandit', 'night-witch', 'magic-archer', 'ram-rider', 'fisherman',
        'electro-wizard', 'battle-healer', 'royal-ghost', 'inferno-dragon',
        'goblin-drill', 'mother-witch', 'phoenix', 'goblin-machine',
        // Champions
        'skeleton-king', 'mighty-miner', 'archer-queen', 'monk',
        'golden-knight', 'little-prince', 'goblinstein', 'boss-bandit',
        // Sorts
        'fireball', 'arrows', 'rocket', 'zap', 'tornado', 'poison',
        'earthquake', 'lightning', 'freeze', 'mirror', 'rage', 'clone',
        'graveyard', 'giant-snowball', 'royal-delivery', 'goblin-barrel',
        'barbarian-barrel', 'void',
        // Bâtiments
        'cannon', 'tesla', 'bomb-tower', 'inferno-tower', 'x-bow', 'mortar',
        'elixir-collector', 'furnace', 'goblin-hut', 'barbarian-hut', 'tombstone',
        'goblin-cage', 'goblin-curse',
      ],
    },
  },

  // ── Gaming — franchise covers via Steam CDN ───────────────────
  {
    title: "Jeux Assassin's Creed",
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        // AC1 and Revelations were delisted from Steam — no cover available.
        { label: "Assassin's Creed II",           appId: 33230 },
        { label: "Assassin's Creed Brotherhood",  appId: 48190 },
        { label: "Assassin's Creed III",          appId: 208480 },
        { label: "Assassin's Creed IV Black Flag", appId: 242050 },
        { label: "Assassin's Creed Rogue",        appId: 311560 },
        { label: "Assassin's Creed Unity",        appId: 289650 },
        { label: "Assassin's Creed Syndicate",    appId: 368500 },
        { label: "Assassin's Creed Origins",      appId: 582160 },
        { label: "Assassin's Creed Odyssey",      appId: 812140 },
        { label: "Assassin's Creed Valhalla",     appId: 2208920 },
        // Mirage released on Steam only in Oct 2024; appId TBD.
      ],
    },
  },
  {
    title: 'Jeux Grand Theft Auto',
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        { label: 'GTA III',          appId: 12100 },
        { label: 'GTA Vice City',    appId: 12110 },
        { label: 'GTA San Andreas',  appId: 12120 },
        { label: 'GTA IV',           appId: 12210 },
        { label: 'GTA V',            appId: 271590 },
      ],
    },
  },
  {
    title: 'Jeux Resident Evil',
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        { label: 'Resident Evil HD',        appId: 304240 },
        { label: 'Resident Evil 0',         appId: 339340 },
        { label: 'Resident Evil 4 (2005)',  appId: 254700 },
        { label: 'Resident Evil 5',         appId: 21690 },
        { label: 'Resident Evil 6',         appId: 221040 },
        { label: 'Resident Evil 7',         appId: 418370 },
        { label: 'Resident Evil 2 Remake',  appId: 883710 },
        { label: 'Resident Evil 3 Remake',  appId: 952060 },
        { label: 'Resident Evil Village',   appId: 1196590 },
        { label: 'Resident Evil 4 Remake',  appId: 2050650 },
      ],
    },
  },
  {
    title: 'Jeux Final Fantasy',
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        { label: 'Final Fantasy VII',           appId: 39140 },
        { label: 'Final Fantasy VIII Remastered', appId: 1026680 },
        { label: 'Final Fantasy IX',            appId: 377840 },
        { label: 'Final Fantasy X/X-2 HD',      appId: 359870 },
        { label: 'Final Fantasy XII',           appId: 595520 },
        { label: 'Final Fantasy XIII',          appId: 292120 },
        { label: 'Final Fantasy XIV',           appId: 39210 },
        { label: 'Final Fantasy XV',            appId: 637650 },
        { label: 'Final Fantasy VII Remake',    appId: 1462040 },
      ],
    },
  },
  {
    title: 'Jeux FromSoftware',
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        { label: 'Dark Souls: Prepare to Die', appId: 211420 },
        { label: 'Dark Souls II',              appId: 236430 },
        { label: 'Dark Souls III',             appId: 374320 },
        { label: 'Sekiro',                     appId: 814380 },
        { label: 'Elden Ring',                 appId: 1245620 },
        { label: 'Armored Core VI',            appId: 1888160 },
      ],
    },
  },
  {
    title: 'Jeux Far Cry',
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        // Far Cry 1 was delisted; skipped.
        { label: 'Far Cry 2', appId: 19900 },
        { label: 'Far Cry 3', appId: 220240 },
        { label: 'Far Cry 4', appId: 298110 },
        { label: 'Far Cry 5', appId: 552520 },
        { label: 'Far Cry 6', appId: 2369390 },
      ],
    },
  },
  {
    title: 'Jeux Battlefield',
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        { label: 'Battlefield 1942',  appId: 1608900 },
        { label: 'Battlefield: Bad Company 2', appId: 24960 },
        { label: 'Battlefield 3',     appId: 1238820 },
        { label: 'Battlefield 4',     appId: 1238860 },
        { label: 'Battlefield 1',     appId: 1238840 },
        { label: 'Battlefield V',     appId: 1238810 },
        { label: 'Battlefield 2042',  appId: 1517290 },
      ],
    },
  },
  {
    title: 'Jeux Metal Gear',
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        { label: 'Metal Gear Solid V: The Phantom Pain', appId: 287700 },
        { label: 'Metal Gear Rising: Revengeance',       appId: 235460 },
      ],
    },
  },
  {
    title: 'Jeux indé cultes',
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        { label: 'Hollow Knight',   appId: 367520 },
        { label: 'Celeste',         appId: 504230 },
        { label: 'Undertale',       appId: 391540 },
        { label: 'Stardew Valley',  appId: 413150 },
        { label: 'Hades',           appId: 1145360 },
        { label: 'Cuphead',         appId: 268910 },
        { label: 'Terraria',        appId: 105600 },
        { label: 'Dead Cells',      appId: 588650 },
        { label: 'Ori and the Blind Forest', appId: 261570 },
        { label: 'Inscryption',     appId: 1092790 },
        { label: 'Disco Elysium',   appId: 632470 },
        { label: 'Papers, Please',  appId: 239030 },
      ],
    },
  },
  {
    title: 'Jeux compétitifs en ligne',
    category: 'Gaming',
    source: {
      kind: 'steam',
      games: [
        { label: 'Counter-Strike 2', appId: 730 },
        { label: 'Dota 2',           appId: 570 },
        { label: 'Team Fortress 2',  appId: 440 },
        { label: 'Rocket League',    appId: 252950 },
        { label: 'Apex Legends',     appId: 1172470 },
        { label: 'Rainbow Six Siege', appId: 359550 },
        { label: 'Overwatch 2',      appId: 2357570 },
        { label: 'PUBG',             appId: 578080 },
      ],
    },
  },

  // ── Curated lists (Simple Icons CDN, SVG, brand colors) ──────
  // Each icon comes from https://cdn.simpleicons.org/{slug}. The slug list
  // is pre-verified — every entry returns HTTP 200 and the brand color
  // makes the logo recognizable on our dark surface.
  {
    title: 'Chaînes de fast-food',
    category: 'Food',
    source: {
      kind: 'curated',
      items: [
        { label: "McDonald's",  imageUrl: 'https://cdn.simpleicons.org/mcdonalds' },
        { label: 'Burger King', imageUrl: 'https://cdn.simpleicons.org/burgerking' },
        { label: 'KFC',         imageUrl: 'https://cdn.simpleicons.org/kfc' },
        { label: 'Starbucks',   imageUrl: 'https://cdn.simpleicons.org/starbucks' },
        { label: 'Taco Bell',   imageUrl: 'https://cdn.simpleicons.org/tacobell' },
        { label: 'Uber Eats',   imageUrl: 'https://cdn.simpleicons.org/ubereats' },
      ],
    },
  },
  {
    title: 'Plateformes vidéo & musique',
    category: 'Other',
    source: {
      kind: 'curated',
      items: [
        { label: 'Netflix',       imageUrl: 'https://cdn.simpleicons.org/netflix' },
        { label: 'YouTube',       imageUrl: 'https://cdn.simpleicons.org/youtube' },
        { label: 'Twitch',        imageUrl: 'https://cdn.simpleicons.org/twitch' },
        { label: 'HBO Max',       imageUrl: 'https://cdn.simpleicons.org/hbomax' },
        { label: 'Paramount+',    imageUrl: 'https://cdn.simpleicons.org/paramountplus' },
        { label: 'Crunchyroll',   imageUrl: 'https://cdn.simpleicons.org/crunchyroll' },
        { label: 'Dailymotion',   imageUrl: 'https://cdn.simpleicons.org/dailymotion' },
        { label: 'Vimeo',         imageUrl: 'https://cdn.simpleicons.org/vimeo' },
        { label: 'Spotify',       imageUrl: 'https://cdn.simpleicons.org/spotify' },
        { label: 'Apple Music',   imageUrl: 'https://cdn.simpleicons.org/applemusic' },
        { label: 'SoundCloud',    imageUrl: 'https://cdn.simpleicons.org/soundcloud' },
        { label: 'Tidal',         imageUrl: 'https://cdn.simpleicons.org/tidal' },
        { label: 'YouTube Music', imageUrl: 'https://cdn.simpleicons.org/youtubemusic' },
        { label: 'Pandora',       imageUrl: 'https://cdn.simpleicons.org/pandora' },
      ],
    },
  },
  {
    title: 'Marques de smartphones',
    category: 'Other',
    source: {
      kind: 'curated',
      items: [
        { label: 'Apple',   imageUrl: 'https://cdn.simpleicons.org/apple/FFFFFF' },
        { label: 'Samsung', imageUrl: 'https://cdn.simpleicons.org/samsung' },
        { label: 'Google',  imageUrl: 'https://cdn.simpleicons.org/google' },
        { label: 'Xiaomi',  imageUrl: 'https://cdn.simpleicons.org/xiaomi' },
        { label: 'Huawei',  imageUrl: 'https://cdn.simpleicons.org/huawei' },
        { label: 'OnePlus', imageUrl: 'https://cdn.simpleicons.org/oneplus' },
        { label: 'Oppo',    imageUrl: 'https://cdn.simpleicons.org/oppo' },
        { label: 'Sony',    imageUrl: 'https://cdn.simpleicons.org/sony/FFFFFF' },
        { label: 'Motorola', imageUrl: 'https://cdn.simpleicons.org/motorola' },
      ],
    },
  },
  {
    title: 'Plateformes de jeu',
    category: 'Gaming',
    source: {
      kind: 'curated',
      items: [
        { label: 'PlayStation',      imageUrl: 'https://cdn.simpleicons.org/playstation' },
        { label: 'Xbox',             imageUrl: 'https://cdn.simpleicons.org/xbox' },
        { label: 'Nintendo Switch',  imageUrl: 'https://cdn.simpleicons.org/nintendoswitch' },
        { label: 'Steam',            imageUrl: 'https://cdn.simpleicons.org/steam/FFFFFF' },
        { label: 'Epic Games',       imageUrl: 'https://cdn.simpleicons.org/epicgames/FFFFFF' },
        { label: 'GOG.com',          imageUrl: 'https://cdn.simpleicons.org/gogdotcom/FFFFFF' },
        { label: 'Ubisoft',          imageUrl: 'https://cdn.simpleicons.org/ubisoft/FFFFFF' },
        { label: 'EA',               imageUrl: 'https://cdn.simpleicons.org/ea' },
        { label: 'Rockstar Games',   imageUrl: 'https://cdn.simpleicons.org/rockstargames/FFFFFF' },
        { label: 'Sega',             imageUrl: 'https://cdn.simpleicons.org/sega' },
        { label: 'Square Enix',      imageUrl: 'https://cdn.simpleicons.org/squareenix' },
      ],
    },
  },
  {
    title: 'Navigateurs web',
    category: 'Other',
    source: {
      kind: 'curated',
      items: [
        { label: 'Google Chrome', imageUrl: 'https://cdn.simpleicons.org/googlechrome' },
        { label: 'Safari',        imageUrl: 'https://cdn.simpleicons.org/safari' },
        { label: 'Firefox',       imageUrl: 'https://cdn.simpleicons.org/firefox' },
        { label: 'Opera',         imageUrl: 'https://cdn.simpleicons.org/opera' },
        { label: 'Brave',         imageUrl: 'https://cdn.simpleicons.org/brave' },
        { label: 'Arc',           imageUrl: 'https://cdn.simpleicons.org/arc' },
        { label: 'Vivaldi',       imageUrl: 'https://cdn.simpleicons.org/vivaldi' },
        { label: 'DuckDuckGo',    imageUrl: 'https://cdn.simpleicons.org/duckduckgo' },
        { label: 'Tor',           imageUrl: 'https://cdn.simpleicons.org/torproject' },
      ],
    },
  },
  {
    title: 'Marques de voitures',
    category: 'Other',
    source: {
      kind: 'curated',
      items: [
        { label: 'Ferrari',     imageUrl: 'https://cdn.simpleicons.org/ferrari' },
        { label: 'Lamborghini', imageUrl: 'https://cdn.simpleicons.org/lamborghini' },
        { label: 'Porsche',     imageUrl: 'https://cdn.simpleicons.org/porsche/FFFFFF' },
        { label: 'BMW',         imageUrl: 'https://cdn.simpleicons.org/bmw' },
        { label: 'Mercedes-AMG', imageUrl: 'https://cdn.simpleicons.org/amg' },
        { label: 'Maserati',    imageUrl: 'https://cdn.simpleicons.org/maserati' },
        { label: 'Bentley',     imageUrl: 'https://cdn.simpleicons.org/bentley' },
        { label: 'Rolls-Royce', imageUrl: 'https://cdn.simpleicons.org/rollsroyce' },
        { label: 'Audi',        imageUrl: 'https://cdn.simpleicons.org/audi/FFFFFF' },
        { label: 'Volkswagen',  imageUrl: 'https://cdn.simpleicons.org/volkswagen' },
        { label: 'Toyota',      imageUrl: 'https://cdn.simpleicons.org/toyota' },
        { label: 'Honda',       imageUrl: 'https://cdn.simpleicons.org/honda/FFFFFF' },
        { label: 'Nissan',      imageUrl: 'https://cdn.simpleicons.org/nissan' },
        { label: 'Mazda',       imageUrl: 'https://cdn.simpleicons.org/mazda' },
        { label: 'Subaru',      imageUrl: 'https://cdn.simpleicons.org/subaru' },
        { label: 'Ford',        imageUrl: 'https://cdn.simpleicons.org/ford' },
        { label: 'Chevrolet',   imageUrl: 'https://cdn.simpleicons.org/chevrolet' },
        { label: 'Cadillac',    imageUrl: 'https://cdn.simpleicons.org/cadillac' },
        { label: 'Jeep',        imageUrl: 'https://cdn.simpleicons.org/jeep/FFFFFF' },
        { label: 'Tesla',       imageUrl: 'https://cdn.simpleicons.org/tesla/FFFFFF' },
        { label: 'Renault',     imageUrl: 'https://cdn.simpleicons.org/renault' },
        { label: 'Peugeot',     imageUrl: 'https://cdn.simpleicons.org/peugeot/FFFFFF' },
        { label: 'Citroën',     imageUrl: 'https://cdn.simpleicons.org/citroen' },
        { label: 'Hyundai',     imageUrl: 'https://cdn.simpleicons.org/hyundai' },
        { label: 'Kia',         imageUrl: 'https://cdn.simpleicons.org/kia' },
        { label: 'Fiat',        imageUrl: 'https://cdn.simpleicons.org/fiat' },
        { label: 'Mini',        imageUrl: 'https://cdn.simpleicons.org/mini/FFFFFF' },
        { label: 'Škoda',       imageUrl: 'https://cdn.simpleicons.org/skoda' },
      ],
    },
  },
  {
    title: 'Marques de sneakers',
    category: 'Other',
    source: {
      kind: 'curated',
      items: [
        { label: 'Nike',   imageUrl: 'https://cdn.simpleicons.org/nike/FFFFFF' },
        { label: 'Adidas', imageUrl: 'https://cdn.simpleicons.org/adidas/FFFFFF' },
        { label: 'Jordan', imageUrl: 'https://cdn.simpleicons.org/jordan/FFFFFF' },
        { label: 'Puma',   imageUrl: 'https://cdn.simpleicons.org/puma' },
        { label: 'Reebok', imageUrl: 'https://cdn.simpleicons.org/reebok/FFFFFF' },
      ],
    },
  },
  {
    title: 'Sodas et boissons',
    category: 'Food',
    source: {
      kind: 'wiki-fr-pages',
      thumbSize: 300,
      pages: [
        { label: 'Coca-Cola', page: 'Coca-Cola', imageUrl: 'https://cdn.simpleicons.org/cocacola' },
        { label: 'Pepsi',     page: 'Pepsi' },
        { label: 'Fanta',     page: 'Fanta' },
        { label: 'Orangina',  page: 'Orangina' },
        { label: 'Red Bull',  page: 'Red Bull (boisson)', imageUrl: 'https://cdn.simpleicons.org/redbull' },
        { label: 'Monster',   page: 'Monster (boisson)',  imageUrl: 'https://cdn.simpleicons.org/monster/FFFFFF' },
        { label: 'Sprite',    page: 'Sprite (soda)' },
        { label: 'Dr Pepper', page: 'Dr Pepper' },
        { label: 'Schweppes', page: 'Schweppes' },
        { label: '7 Up',      page: '7 Up' },
        { label: 'Oasis',     page: 'Oasis (boisson)' },
        { label: 'Ice Tea',   page: 'Lipton Ice Tea' },
        { label: 'Capri-Sun', page: 'Capri-Sun' },
        { label: 'Perrier',   page: 'Perrier (eau)' },
        { label: 'Gatorade',  page: 'Gatorade' },
        { label: 'Powerade',  page: 'Powerade' },
      ],
    },
  },

  {
    title: 'Confiseries & chocolats',
    category: 'Food',
    source: {
      kind: 'wiki-fr-pages',
      thumbSize: 300,
      pages: [
        { label: 'Haribo',         page: 'Haribo' },
        { label: 'Kinder Surprise', page: 'Kinder Surprise' },
        { label: 'KitKat',         page: 'Kit Kat' },
        { label: 'Snickers',       page: 'Snickers' },
        { label: 'Mars',           page: 'Mars (barre chocolatée)' },
        { label: 'Twix',           page: 'Twix' },
        { label: 'Bounty',         page: 'Bounty (confiserie)' },
        { label: "M&M's",          page: "M&M's" },
        { label: 'Skittles',       page: 'Skittles' },
        { label: 'Milka',          page: 'Milka' },
        { label: 'Toblerone',      page: 'Toblerone' },
        { label: 'Ferrero Rocher', page: 'Ferrero Rocher' },
        { label: 'Nutella',        page: 'Nutella' },
        { label: 'Oreo',           page: 'Oreo' },
        { label: 'Chupa Chups',    page: 'Chupa Chups' },
        { label: 'Dragibus',       page: 'Dragibus' },
        { label: 'Carambar',       page: 'Carambar' },
        { label: 'Malabar',        page: 'Malabar (confiserie)' },
        { label: 'Tic Tac',        page: 'Tic Tac' },
        { label: 'Reese\'s',       page: "Reese's Peanut Butter Cups" },
        { label: 'Lindt',          page: 'Lindt & Sprüngli' },
      ],
    },
  },
  {
    title: 'Langages de programmation',
    category: 'Other',
    source: {
      kind: 'curated',
      items: [
        { label: 'JavaScript',   imageUrl: 'https://cdn.simpleicons.org/javascript' },
        { label: 'TypeScript',   imageUrl: 'https://cdn.simpleicons.org/typescript' },
        { label: 'Python',       imageUrl: 'https://cdn.simpleicons.org/python' },
        { label: 'Rust',         imageUrl: 'https://cdn.simpleicons.org/rust/FFFFFF' },
        { label: 'Go',           imageUrl: 'https://cdn.simpleicons.org/go' },
        { label: 'Ruby',         imageUrl: 'https://cdn.simpleicons.org/ruby' },
        { label: 'PHP',          imageUrl: 'https://cdn.simpleicons.org/php' },
        { label: 'Swift',        imageUrl: 'https://cdn.simpleicons.org/swift' },
        { label: 'Kotlin',       imageUrl: 'https://cdn.simpleicons.org/kotlin' },
        { label: '.NET (C#)',    imageUrl: 'https://cdn.simpleicons.org/dotnet' },
        { label: 'C',            imageUrl: 'https://cdn.simpleicons.org/c' },
        { label: 'Dart',         imageUrl: 'https://cdn.simpleicons.org/dart' },
        { label: 'Scala',        imageUrl: 'https://cdn.simpleicons.org/scala' },
        { label: 'Elixir',       imageUrl: 'https://cdn.simpleicons.org/elixir/FFFFFF' },
        { label: 'Haskell',      imageUrl: 'https://cdn.simpleicons.org/haskell' },
        { label: 'Lua',          imageUrl: 'https://cdn.simpleicons.org/lua/FFFFFF' },
        { label: 'R',            imageUrl: 'https://cdn.simpleicons.org/r' },
        { label: 'HTML5',        imageUrl: 'https://cdn.simpleicons.org/html5' },
      ],
    },
  },
  {
    title: 'Réseaux sociaux',
    category: 'Other',
    source: {
      kind: 'curated',
      items: [
        { label: 'Instagram', imageUrl: 'https://cdn.simpleicons.org/instagram' },
        { label: 'X',         imageUrl: 'https://cdn.simpleicons.org/x/FFFFFF' },
        { label: 'Facebook',  imageUrl: 'https://cdn.simpleicons.org/facebook' },
        { label: 'YouTube',   imageUrl: 'https://cdn.simpleicons.org/youtube' },
        { label: 'Reddit',    imageUrl: 'https://cdn.simpleicons.org/reddit' },
        { label: 'Discord',   imageUrl: 'https://cdn.simpleicons.org/discord' },
        { label: 'Twitch',    imageUrl: 'https://cdn.simpleicons.org/twitch' },
        { label: 'WhatsApp',  imageUrl: 'https://cdn.simpleicons.org/whatsapp' },
        { label: 'Telegram',  imageUrl: 'https://cdn.simpleicons.org/telegram' },
        { label: 'Meta',      imageUrl: 'https://cdn.simpleicons.org/meta' },
      ],
    },
  },

  // ── Culturel — Villes du 93 (text-only panels, no photo) ──────
  {
    title: 'Villes du 93',
    category: 'Other',
    rows: [
      { id: 'tier-s',        label: 'ça tire',        color: '#FF4D4D' },
      { id: 'tier-vient-ou', label: "ça vient d'où",  color: '#FFA347' },
      { id: 'tier-rue',      label: 'la rue',         color: '#FFD24D' },
      { id: 'tier-chill',    label: 'chill',          color: '#8FE37A' },
      { id: 'tier-campagne', label: 'la campagne',    color: '#7FD4FF' },
      { id: 'tier-pas-buzz', label: 'pas de buzz',    color: '#9CA3AF' },
    ],
    source: {
      kind: 'curated',
      items: [
        'Aubervilliers', 'Aulnay-sous-Bois', 'Bagnolet', 'Le Blanc-Mesnil',
        'Bobigny', 'Bondy', 'Le Bourget', 'Clichy-sous-Bois', 'Coubron',
        'La Courneuve', 'Drancy', 'Dugny', 'Épinay-sur-Seine', 'Gagny',
        'Gournay-sur-Marne', "L'Île-Saint-Denis", 'Les Lilas', 'Livry-Gargan',
        'Montfermeil', 'Montreuil', 'Neuilly-Plaisance', 'Neuilly-sur-Marne',
        'Noisy-le-Grand', 'Noisy-le-Sec', 'Pantin', 'Les Pavillons-sous-Bois',
        'Pierrefitte-sur-Seine', 'Le Pré-Saint-Gervais', 'Le Raincy',
        'Romainville', 'Rosny-sous-Bois', 'Saint-Denis', 'Saint-Ouen-sur-Seine',
        'Sevran', 'Stains', 'Tremblay-en-France', 'Vaujours', 'Villemomble',
        'Villepinte', 'Villetaneuse',
      ].map(label => ({ label, imageUrl: '' })),
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

    const rowsTemplate = template.rows ?? DEFAULT_TIERS
    const payload = {
      roomId,
      title: template.title,
      rows: rowsTemplate.map(t => ({ ...t, items: [] })),
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
