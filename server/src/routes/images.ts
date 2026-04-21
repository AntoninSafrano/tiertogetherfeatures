import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env'

const router = Router()

const imageSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Trop de recherches, réessayez dans 1 minute.' },
})

interface GoogleSearchItem {
  title: string
  link: string
  image?: {
    thumbnailLink?: string
  }
}

router.get('/api/images/search', imageSearchLimiter, async (req, res) => {
  const query = req.query.q as string | undefined

  if (!env.GOOGLE_API_KEY || !env.GOOGLE_CSE_ID) {
    return res.status(503).json({ error: 'Image search not configured' })
  }

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'Missing search query' })
  }

  if (query.length > 200) {
    return res.status(400).json({ error: 'Search query too long (max 200 characters)' })
  }

  // A10: SSRF — reject queries containing URLs or path traversal attempts
  const ssrfPattern = /https?:\/\/|ftp:\/\/|file:\/\/|\/\.\.\//i
  if (ssrfPattern.test(query)) {
    return res.status(400).json({ error: 'Invalid search query' })
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', env.GOOGLE_API_KEY)
    url.searchParams.set('cx', env.GOOGLE_CSE_ID)
    url.searchParams.set('q', query)
    url.searchParams.set('searchType', 'image')
    url.searchParams.set('num', '12')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (!response.ok) {
      console.error('[ImageSearch] Google API error:', data)
      return res.status(502).json({ error: 'Image search failed' })
    }

    const results = (data.items || []).map((item: GoogleSearchItem) => ({
      title: item.title || '',
      imageUrl: item.link,
      thumbnail: item.image?.thumbnailLink || item.link,
    }))

    return res.json(results)
  } catch (err) {
    console.error('[ImageSearch] Error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
