import { Router, type Request, type Response } from 'express'
import { TierListModel } from '../models/TierList'
import { env } from '../config/env'

const router = Router()

const SITE = env.CLIENT_URL.replace(/\/$/, '')

function xmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function iso(d: Date | string | undefined): string {
  return d ? new Date(d).toISOString() : new Date().toISOString()
}

router.get('/sitemap.xml', async (_req: Request, res: Response) => {
  try {
    const now = new Date().toISOString()
    const urls: string[] = [
      `  <url><loc>${SITE}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${now}</lastmod></url>`,
      `  <url><loc>${SITE}/create</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
      `  <url><loc>${SITE}/legal</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>`,
    ]

    const tierlists = await TierListModel.find({ isPublic: true })
      .select('_id updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10000)
      .lean()

    for (const tl of tierlists) {
      urls.push(
        `  <url><loc>${SITE}/tierlist/${xmlEsc(String(tl._id))}</loc><lastmod>${iso(tl.updatedAt)}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      )
    }

    const authorIds = (await TierListModel.distinct('authorId', {
      isPublic: true,
      authorId: { $nin: ['', null] },
    })) as string[]

    for (const id of authorIds) {
      urls.push(
        `  <url><loc>${SITE}/user/${xmlEsc(id)}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
      )
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.join('\n') +
      `\n</urlset>\n`

    res.set('Content-Type', 'application/xml; charset=utf-8')
    res.set('Cache-Control', 'public, max-age=3600')
    res.send(xml)
  } catch (err) {
    console.error('[Sitemap] Failed to generate sitemap:', err)
    res.status(500).send('Error')
  }
})

export default router
