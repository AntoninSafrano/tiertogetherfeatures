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

    // If sorting by popular, sort by (upvotes - downvotes) in memory
    if (sort === 'popular') {
      tierlists.sort((a: any, b: any) => {
        const scoreA = (a.upvotes || 0) - (a.downvotes || 0)
        const scoreB = (b.upvotes || 0) - (b.downvotes || 0)
        return scoreB - scoreA
      })
    }

    // Include the user's vote if authenticated
    const userId = getUserId(req)
    const results = tierlists.map((tl: any) => {
      const voters = tl.voters || []
      const userVoter = userId ? voters.find((v: any) => v.userId === userId) : null
      return {
        ...tl,
        upvotes: tl.upvotes || 0,
        downvotes: tl.downvotes || 0,
        userVote: userVoter ? userVoter.vote : null,
        voters: undefined, // Don't expose full voters array to client
      }
    })

    res.json({ tierlists: results })
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

    // Include user's vote if authenticated
    const voters = (tierlist as any).voters || []
    const userVoter = userId ? voters.find((v: any) => v.userId === userId) : null
    const result = {
      ...tierlist,
      upvotes: (tierlist as any).upvotes || 0,
      downvotes: (tierlist as any).downvotes || 0,
      userVote: userVoter ? userVoter.vote : null,
      voters: undefined, // Don't expose full voters array
    }

    res.json({ tierlist: result })
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

// POST /api/tierlists/:id/vote
router.post('/api/tierlists/:id/vote', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    if (!userId) {
      res.status(401).json({ error: 'Authentification requise' })
      return
    }

    const { vote } = req.body // 1 for upvote, -1 for downvote, 0 to remove vote
    if (![1, -1, 0].includes(vote)) {
      res.status(400).json({ error: 'Vote invalide' })
      return
    }

    const tierlist = await TierListModel.findById(req.params.id)
    if (!tierlist) {
      res.status(404).json({ error: 'Tier list introuvable' })
      return
    }

    // Ensure fields exist (for old documents)
    if (!tierlist.voters) tierlist.voters = []
    if (typeof tierlist.upvotes !== 'number' || isNaN(tierlist.upvotes)) tierlist.upvotes = 0
    if (typeof tierlist.downvotes !== 'number' || isNaN(tierlist.downvotes)) tierlist.downvotes = 0

    // Recalculate from voters array to ensure consistency
    tierlist.upvotes = tierlist.voters.filter(v => v.vote === 1).length
    tierlist.downvotes = tierlist.voters.filter(v => v.vote === -1).length

    // Find existing vote
    const existingVoteIdx = tierlist.voters.findIndex(v => v.userId === userId)

    if (vote === 0) {
      // Remove vote
      if (existingVoteIdx !== -1) {
        const oldVote = tierlist.voters[existingVoteIdx].vote
        if (oldVote === 1) tierlist.upvotes--
        else tierlist.downvotes--
        tierlist.voters.splice(existingVoteIdx, 1)
      }
    } else {
      if (existingVoteIdx !== -1) {
        // Change existing vote
        const oldVote = tierlist.voters[existingVoteIdx].vote
        if (oldVote !== vote) {
          if (oldVote === 1) { tierlist.upvotes--; tierlist.downvotes++ }
          else { tierlist.downvotes--; tierlist.upvotes++ }
          tierlist.voters[existingVoteIdx].vote = vote
        }
      } else {
        // New vote
        tierlist.voters.push({ userId, vote })
        if (vote === 1) tierlist.upvotes++
        else tierlist.downvotes++
      }
    }

    await tierlist.save()
    res.json({ upvotes: tierlist.upvotes, downvotes: tierlist.downvotes, userVote: vote === 0 ? null : vote })
  } catch (err) {
    console.error('[Tierlists] Vote failed:', err)
    res.status(500).json({ error: 'Échec du vote' })
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
