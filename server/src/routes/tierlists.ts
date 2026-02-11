import { Router } from 'express'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { TierListModel } from '../models/TierList'
import { env } from '../config/env'
import { randomUUID } from 'crypto'

const router = Router()

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
      filter.title = { $regex: search, $options: 'i' }
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
    res.status(500).json({ error: 'Failed to fetch tierlists' })
  }
})

// GET /api/tierlists/mine
router.get('/api/tierlists/mine', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const tierlists = await TierListModel.find({ authorId: userId })
      .sort({ updatedAt: -1 })
      .lean()
    res.json({ tierlists })
  } catch (err) {
    console.error('[API] Failed to fetch user tierlists:', err)
    res.status(500).json({ error: 'Failed to fetch tierlists' })
  }
})

// POST /api/tierlists/:id/publish
router.post('/api/tierlists/:id/publish', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const tierList = await TierListModel.findById(req.params.id)
    if (!tierList) {
      res.status(404).json({ error: 'Tier list not found' })
      return
    }

    const { isPublic, category } = req.body

    tierList.isPublic = isPublic ?? true
    tierList.category = category || 'Other'
    tierList.authorId = userId

    // Auto-generate cover image from first item
    const firstRow = tierList.rows.find((r) => r.items.length > 0)
    if (firstRow && firstRow.items[0]) {
      tierList.coverImage = firstRow.items[0].imageUrl
    }

    await tierList.save()
    res.json({ success: true, tierList })
  } catch (err) {
    console.error('[API] Publish failed:', err)
    res.status(500).json({ error: 'Failed to publish' })
  }
})

// POST /api/tierlists/:id/clone
router.post('/api/tierlists/:id/clone', async (req: Request, res: Response) => {
  try {
    const source = await TierListModel.findById(req.params.id)
    if (!source) {
      res.status(404).json({ error: 'Tier list not found' })
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
    res.status(500).json({ error: 'Failed to clone' })
  }
})

export default router
