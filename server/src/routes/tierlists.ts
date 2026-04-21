import { Router } from 'express'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { TierListModel } from '../models/TierList'
import { env } from '../config/env'

const router = Router()

// A03: Input sanitization — strip NoSQL injection characters
function sanitize(str: string, maxLen: number = 500): string {
  return str.replace(/[${}]/g, '').trim().slice(0, maxLen)
}

// Auth middleware helper
function getUserId(req: Request): string | null {
  const token = req.cookies?.token
  if (!token) return null
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

// GET /api/tierlists/public
router.get('/api/tierlists/public', async (req: Request, res: Response) => {
  try {
    const { sort = 'downloads', category, search } = req.query
    const filter: any = { isPublic: true }

    if (category && category !== 'All') {
      filter.category = category
    }
    if (search) {
      const sanitizedSearch = sanitize(String(search), 100)
      const escapedSearch = sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.title = { $regex: escapedSearch, $options: 'i' }
    }

    let sortObj: any = { downloads: -1 }
    if (sort === 'recent') sortObj = { createdAt: -1 }
    else if (sort === 'popular') sortObj = { downloads: -1 }

    const tierlists = await TierListModel.find(filter)
      .sort(sortObj)
      .limit(50)
      .lean()

    res.json({ tierlists })
  } catch (err) {
    console.error('[API] Failed to fetch public tierlists:', err)
    res.status(500).json({ error: 'Échec de la récupération des tier lists' })
  }
})

// GET /api/tierlists/featured
router.get('/api/tierlists/featured', async (_req: Request, res: Response) => {
  try {
    const tierlists = await TierListModel.find({ isPublic: true })
      .sort({ downloads: -1 })
      .limit(6)
      .lean()
    res.json({ tierlists })
  } catch (err) {
    console.error('[API] Failed to fetch featured tierlists:', err)
    res.status(500).json({ error: 'Échec de la récupération des tier lists en vedette' })
  }
})

// GET /api/tierlists/mine
router.get('/api/tierlists/mine', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Authentification requise' })
    return
  }

  try {
    const tierlists = await TierListModel.find({ authorId: userId })
      .sort({ updatedAt: -1 })
      .lean()
    res.json({ tierlists })
  } catch (err) {
    console.error('[API] Failed to fetch user tierlists:', err)
    res.status(500).json({ error: 'Échec de la récupération des tier lists' })
  }
})

// GET /api/tierlists/:id
router.get('/api/tierlists/:id', async (req: Request, res: Response) => {
  try {
    const tierlist = await TierListModel.findById(req.params.id).lean()
    if (!tierlist) {
      res.status(404).json({ error: 'Tier list introuvable' })
      return
    }

    const userId = getUserId(req)
    const isOwner = userId && (tierlist.authorId === userId || tierlist.ownerId === userId)
    if (!tierlist.isPublic && !isOwner) {
      res.status(404).json({ error: 'Tier list introuvable' })
      return
    }

    res.json({ tierlist })
  } catch (err) {
    console.error('[API] Failed to fetch tierlist:', err)
    res.status(500).json({ error: 'Échec de la récupération de la tier list' })
  }
})

// POST /api/tierlists/:id/publish
router.post('/api/tierlists/:id/publish', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Authentification requise' })
    return
  }

  try {
    const tierList = await TierListModel.findById(req.params.id)
    if (!tierList) {
      res.status(404).json({ error: 'Tier list introuvable' })
      return
    }

    // Allow publish if user is the author, or if no author is set yet (claim ownership)
    if (tierList.authorId && tierList.authorId !== userId) {
      res.status(403).json({ error: 'Non autorisé à publier cette tier list' })
      return
    }

    const { isPublic, category, coverImage } = req.body

    const validCategories = ['Gaming', 'Food', 'Anime', 'Music', 'Movies', 'Sports', 'Other']
    const safeCategory = validCategories.includes(category) ? category : 'Other'

    tierList.isPublic = isPublic ?? true
    tierList.category = safeCategory
    tierList.authorId = userId

    // Use provided cover or auto-generate from first item
    if (coverImage && typeof coverImage === 'string') {
      tierList.coverImage = coverImage
    } else {
      let coverUrl = ''
      for (const row of tierList.rows) {
        const item = row.items.find((i) => i.imageUrl)
        if (item) { coverUrl = item.imageUrl; break }
      }
      if (!coverUrl) {
        const poolItem = tierList.pool.find((i) => i.imageUrl)
        if (poolItem) coverUrl = poolItem.imageUrl
      }
      if (coverUrl) tierList.coverImage = coverUrl
    }

    await tierList.save()
    res.json({ success: true, tierList })
  } catch (err) {
    console.error('[API] Publish failed:', err)
    res.status(500).json({ error: 'Échec de la publication' })
  }
})

// POST /api/tierlists/:id/clone
router.post('/api/tierlists/:id/clone', async (req: Request, res: Response) => {
  try {
    const source = await TierListModel.findById(req.params.id)
    if (!source) {
      res.status(404).json({ error: 'Tier list introuvable' })
      return
    }

    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const userId = getUserId(req)

    const cloned = await TierListModel.create({
      roomId: newRoomId,
      title: source.title,
      rows: source.rows.map((r) => ({ ...r, items: [] })),
      pool: [...source.rows.flatMap((r) => r.items), ...source.pool],
      ownerId: userId || 'guest',
      isPublic: false,
    })

    // Increment download count
    source.downloads = (source.downloads || 0) + 1
    await source.save()

    res.json({ success: true, roomId: newRoomId, tierListId: cloned._id })
  } catch (err) {
    console.error('[API] Clone failed:', err)
    res.status(500).json({ error: 'Échec du clonage' })
  }
})

// DELETE /api/tierlists/:id
router.delete('/api/tierlists/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Authentification requise' })
    return
  }

  try {
    const tierList = await TierListModel.findById(req.params.id)
    if (!tierList) {
      res.status(404).json({ error: 'Tier list introuvable' })
      return
    }
    if (tierList.authorId !== userId && tierList.ownerId !== userId) {
      res.status(403).json({ error: 'Non autorisé' })
      return
    }

    await TierListModel.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    console.error('[API] Delete failed:', err)
    res.status(500).json({ error: 'Échec de la suppression' })
  }
})

// PATCH /api/tierlists/:id — update metadata (title, category, coverImage, isPublic)
router.patch('/api/tierlists/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Authentification requise' })
    return
  }

  try {
    const tierList = await TierListModel.findById(req.params.id)
    if (!tierList) {
      res.status(404).json({ error: 'Tier list introuvable' })
      return
    }
    if (tierList.authorId !== userId && tierList.ownerId !== userId) {
      res.status(403).json({ error: 'Non autorisé' })
      return
    }

    const { title, category, coverImage, isPublic } = req.body
    const validCategories = ['Gaming', 'Food', 'Anime', 'Music', 'Movies', 'Sports', 'Other']

    if (title && typeof title === 'string') tierList.title = sanitize(title, 100)
    if (category && validCategories.includes(category)) tierList.category = category
    if (coverImage && typeof coverImage === 'string') tierList.coverImage = coverImage
    if (typeof isPublic === 'boolean') tierList.isPublic = isPublic

    await tierList.save()
    res.json({ success: true, tierList })
  } catch (err) {
    console.error('[API] Update failed:', err)
    res.status(500).json({ error: 'Échec de la mise à jour' })
  }
})

export default router
