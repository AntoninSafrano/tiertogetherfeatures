import fs from 'fs'
import path from 'path'
import { TierListModel } from '../models/TierList'
import { UserModel } from '../models/User'
import { env } from '../config/env'

const SITE = env.CLIENT_URL.replace(/\/$/, '')
const DEFAULT_OG_IMAGE = `${SITE}/og-default.png?v=2`

let baseHtml = ''

export function loadIndexHtml(clientDist: string): void {
  baseHtml = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8')
}

function htmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface Meta {
  title: string
  description: string
  canonical: string
  ogType?: string
  image?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown>
}

function buildHead(meta: Meta): string {
  const parts: string[] = []
  parts.push(`<title>${htmlEsc(meta.title)}</title>`)
  parts.push(`<meta name="description" content="${htmlEsc(meta.description)}">`)
  parts.push(`<link rel="canonical" href="${htmlEsc(meta.canonical)}">`)
  if (meta.noindex) {
    parts.push(`<meta name="robots" content="noindex, nofollow">`)
  }
  parts.push(`<meta property="og:title" content="${htmlEsc(meta.title)}">`)
  parts.push(`<meta property="og:description" content="${htmlEsc(meta.description)}">`)
  parts.push(`<meta property="og:type" content="${htmlEsc(meta.ogType || 'website')}">`)
  parts.push(`<meta property="og:url" content="${htmlEsc(meta.canonical)}">`)
  parts.push(`<meta property="og:site_name" content="TierTogether">`)
  parts.push(`<meta property="og:locale" content="fr_FR">`)
  const image = meta.image || DEFAULT_OG_IMAGE
  parts.push(`<meta property="og:image" content="${htmlEsc(image)}">`)
  parts.push(`<meta property="og:image:width" content="1200">`)
  parts.push(`<meta property="og:image:height" content="630">`)
  parts.push(`<meta name="twitter:card" content="summary_large_image">`)
  parts.push(`<meta name="twitter:image" content="${htmlEsc(image)}">`)
  parts.push(`<meta name="twitter:title" content="${htmlEsc(meta.title)}">`)
  parts.push(`<meta name="twitter:description" content="${htmlEsc(meta.description)}">`)
  if (meta.jsonLd) {
    parts.push(
      `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`,
    )
  }
  return parts.join('\n    ')
}

function stripAndInject(html: string, meta: Meta): string {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, '')
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '')

  return cleaned.replace('</head>', `    ${buildHead(meta)}\n  </head>`)
}

const CATEGORY_FR: Record<string, string> = {
  Gaming: 'Jeux vidéo',
  Food: 'Cuisine',
  Anime: 'Anime',
  Music: 'Musique',
  Movies: 'Films',
  Sports: 'Sport',
  Other: 'Autre',
}

const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/

async function metaForPath(rawPath: string): Promise<Meta> {
  const p = (rawPath.split('?')[0] || '/').replace(/\/+$/, '') || '/'

  const tlMatch = p.match(/^\/tierlist\/([A-Za-z0-9]+)$/)
  if (tlMatch) {
    const id = tlMatch[1]!
    if (OBJECT_ID_RE.test(id)) {
      const tl = await TierListModel.findById(id).lean().catch(() => null)
      if (tl && (tl as any).isPublic) {
        const title = String((tl as any).title || 'Tier List')
        const cat = CATEGORY_FR[(tl as any).category as string] || ''
        const desc = cat
          ? `Tier list ${cat} sur TierTogether — ${title}. Classez, débattez, partagez cette liste avec la communauté.`
          : `Tier list « ${title} » sur TierTogether. Classez, débattez, partagez cette liste avec la communauté.`
        return {
          title: `${title} — TierTogether`,
          description: desc,
          canonical: `${SITE}/tierlist/${id}`,
          ogType: 'article',
          image: (tl as any).coverImage || undefined,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: title,
            url: `${SITE}/tierlist/${id}`,
            inLanguage: 'fr',
            dateModified: new Date((tl as any).updatedAt).toISOString(),
            datePublished: new Date((tl as any).createdAt).toISOString(),
            ...(cat ? { genre: cat } : {}),
            ...((tl as any).coverImage ? { image: (tl as any).coverImage } : {}),
          },
        }
      }
    }
    return {
      title: 'Tier list introuvable — TierTogether',
      description: 'Cette tier list est introuvable ou privée.',
      canonical: `${SITE}${p}`,
      noindex: true,
    }
  }

  const uMatch = p.match(/^\/user\/([A-Za-z0-9]+)$/)
  if (uMatch) {
    const id = uMatch[1]!
    if (OBJECT_ID_RE.test(id)) {
      const u = await UserModel.findById(id).select('displayName avatar').lean().catch(() => null)
      if (u) {
        const name = String((u as any).displayName)
        return {
          title: `${name} — Profil TierTogether`,
          description: `Découvrez les tier lists publiées par ${name} sur TierTogether.`,
          canonical: `${SITE}/user/${id}`,
          ogType: 'profile',
          image: (u as any).avatar || undefined,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            mainEntity: {
              '@type': 'Person',
              name,
              url: `${SITE}/user/${id}`,
              ...((u as any).avatar ? { image: (u as any).avatar } : {}),
            },
          },
        }
      }
    }
    return {
      title: 'Profil introuvable — TierTogether',
      description: 'Ce profil est introuvable.',
      canonical: `${SITE}${p}`,
      noindex: true,
    }
  }

  if (p === '/') {
    return {
      title: 'TierTogether — Tier lists collaboratives en temps réel',
      description:
        'Créez des tier lists en temps réel avec vos amis. Classez, débattez, partagez, explorez les listes de la communauté.',
      canonical: `${SITE}/`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'TierTogether',
        url: SITE,
        inLanguage: 'fr',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    }
  }
  if (p === '/create') {
    return {
      title: 'Créer une tier list — TierTogether',
      description:
        'Créez une tier list collaborative en quelques secondes, invitez vos amis et classez ensemble en temps réel.',
      canonical: `${SITE}/create`,
    }
  }
  if (p === '/legal') {
    return {
      title: 'Mentions légales — TierTogether',
      description: 'Mentions légales et informations juridiques de TierTogether.',
      canonical: `${SITE}/legal`,
    }
  }
  if (p === '/auth') {
    return {
      title: 'Connexion — TierTogether',
      description: 'Connectez-vous à TierTogether.',
      canonical: `${SITE}/auth`,
      noindex: true,
    }
  }
  if (p === '/stats' || p === '/me' || p.startsWith('/room/') || p.startsWith('/admin/')) {
    const titles: Record<string, string> = {
      '/me': 'Mon profil — TierTogether',
      '/admin/import': 'Import TierMaker — TierTogether',
      '/admin/bookmarklet': 'Outils import — TierTogether',
    }
    return {
      title: titles[p] ?? 'TierTogether',
      description: 'TierTogether — tier lists collaboratives.',
      canonical: `${SITE}${p}`,
      noindex: true,
    }
  }

  return {
    title: 'Page introuvable — TierTogether',
    description: 'La page demandée est introuvable.',
    canonical: `${SITE}${p}`,
    noindex: true,
  }
}

interface CacheEntry {
  at: number
  html: string
}

const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX = 2000
const cache = new Map<string, CacheEntry>()

export async function renderHtmlForPath(reqPath: string): Promise<string> {
  if (!baseHtml) throw new Error('baseHtml not loaded')

  const key = reqPath.split('?')[0] || '/'
  const entry = cache.get(key)
  if (entry && Date.now() - entry.at < CACHE_TTL_MS) return entry.html

  const meta = await metaForPath(reqPath)
  const html = stripAndInject(baseHtml, meta)

  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, { at: Date.now(), html })

  return html
}
