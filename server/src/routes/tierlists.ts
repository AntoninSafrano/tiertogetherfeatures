import { Router } from 'express'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { TierListModel } from '../models/TierList'
import { UserModel } from '../models/User'
import { ReportModel } from '../models/Report'
import { containsBannedWord } from '../middleware/moderation'
import { env } from '../config/env'

const router = Router()

// Admin allowlist — shared by /api/tierlists/stats and /api/admin/import-tiermaker.
const ADMIN_EMAILS = new Set([
  'antonin.safrano@gmail.com',
  'wingsoffeed95@gmail.com',
])

// A03: Input sanitization — strip NoSQL injection characters
function sanitize(str: string, maxLen: number = 500): string {
  return str.replace(/[${}]/g, '').trim().slice(0, maxLen)
}

const ALLOWED_CATEGORIES = new Set(['Gaming', 'Food', 'Anime', 'Music', 'Movies', 'Sports', 'Other'])

const IMAGE_URL_RE = /^https:\/\/res\.cloudinary\.com\/dnbnhjbyy\//

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

async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId) return false
  const user = await UserModel.findById(userId).select('email').lean().catch(() => null)
  return !!user && ADMIN_EMAILS.has((user as any).email.toLowerCase())
}

const REPORT_REASONS = new Set(['inappropriate', 'spam', 'copyright', 'duplicate', 'other'])
const PUBLISH_LIMIT_PER_DAY = 5

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
    if (sort === 'recent' || sort === 'newest') sortObj = { createdAt: -1 }
    else if (sort === 'popular') sortObj = { downloads: -1 }

    const tierlists = await TierListModel.find(filter)
      .sort(sortObj)
      .limit(200)
      .lean()

    // If sorting by popular, sort by (upvotes - downvotes) in memory
    if (sort === 'popular') {
      tierlists.sort((a: any, b: any) => {
        const scoreA = (a.upvotes || 0) - (a.downvotes || 0)
        const scoreB = (b.upvotes || 0) - (b.downvotes || 0)
        return scoreB - scoreA
      })
    }

    // Resolve author display names
    const authorIds = [...new Set(tierlists.map((tl: any) => tl.authorId).filter(Boolean))]
    const authors = authorIds.length > 0
      ? await UserModel.find({ _id: { $in: authorIds } }).select('displayName').lean()
      : []
    const authorMap = new Map(authors.map((a: any) => [a._id.toString(), a.displayName]))

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
        authorDisplayName: authorMap.get(tl.authorId) || null,
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

// GET /api/tierlists/stats (admin-only)
router.get('/api/tierlists/stats', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    if (!userId) {
      res.status(401).json({ error: 'Authentification requise' })
      return
    }

    const user = await UserModel.findById(userId)
    if (!user || !ADMIN_EMAILS.has(user.email.toLowerCase())) {
      res.status(403).json({ error: 'Accès réservé aux administrateurs' })
      return
    }

    const totalTierlists = await TierListModel.countDocuments()
    const publicTierlists = await TierListModel.countDocuments({ isPublic: true })
    const privateTierlists = totalTierlists - publicTierlists
    const totalUsers = await UserModel.countDocuments()
    const googleUsers = await UserModel.countDocuments({ authProvider: 'google' })
    const emailUsers = await UserModel.countDocuments({ authProvider: 'email' })
    const verifiedUsers = await UserModel.countDocuments({ emailVerified: true })

    // Users registered in last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const newUsersWeek = await UserModel.countDocuments({ createdAt: { $gte: oneWeekAgo } })
    const newUsersToday = await UserModel.countDocuments({ createdAt: { $gte: oneDayAgo } })

    // Tierlists created in last 7 days
    const newTierlistsWeek = await TierListModel.countDocuments({ createdAt: { $gte: oneWeekAgo } })
    const newTierlistsToday = await TierListModel.countDocuments({ createdAt: { $gte: oneDayAgo } })

    // Total downloads
    const downloadAgg = await TierListModel.aggregate([
      { $group: { _id: null, total: { $sum: '$downloads' } } }
    ])
    const totalDownloads = downloadAgg[0]?.total || 0

    // Total votes cast
    const voteAgg = await TierListModel.aggregate([
      { $project: { voterCount: { $size: { $ifNull: ['$voters', []] } } } },
      { $group: { _id: null, total: { $sum: '$voterCount' } } }
    ])
    const totalVotes = voteAgg[0]?.total || 0

    // Trending this week
    const trending = await TierListModel.find({ isPublic: true, createdAt: { $gte: oneWeekAgo } })
      .sort({ downloads: -1 })
      .limit(10)
      .select('title category coverImage upvotes downvotes downloads roomId authorId createdAt')
      .lean()

    // Top downloaded all time
    const topDownloaded = await TierListModel.find({ isPublic: true })
      .sort({ downloads: -1 })
      .limit(10)
      .select('title category coverImage upvotes downvotes downloads roomId authorId createdAt')
      .lean()

    // Top voted all time (by upvotes)
    const topVoted = await TierListModel.find({ isPublic: true })
      .sort({ upvotes: -1 })
      .limit(10)
      .select('title category coverImage upvotes downvotes downloads roomId authorId createdAt')
      .lean()

    // Categories breakdown
    const categories = await TierListModel.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalDownloads: { $sum: '$downloads' } } },
      { $sort: { count: -1 } },
    ])

    // Recent users (last 20)
    const recentUsers = await UserModel.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('displayName email avatar authProvider emailVerified createdAt')
      .lean()

    // Users by registration date (last 30 days, daily counts)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const userGrowth = await UserModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ])

    // Tierlists by creation date (last 30 days)
    const tierlistGrowth = await TierListModel.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ])

    // Most active authors (excludes system-seeded lists with empty authorId)
    const topAuthors = await TierListModel.aggregate([
      { $match: { isPublic: true, authorId: { $exists: true, $nin: [null, ''] } } },
      { $group: { _id: '$authorId', count: { $sum: 1 }, totalDownloads: { $sum: '$downloads' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    // Resolve author names — keep only valid 24-hex ObjectId strings
    const OBJECT_ID_RE = /^[a-f0-9]{24}$/i
    const authorIds = topAuthors
      .map(a => a._id)
      .filter((id): id is string => typeof id === 'string' && OBJECT_ID_RE.test(id))
    const authorUsers = authorIds.length
      ? await UserModel.find({ _id: { $in: authorIds } }).select('displayName').lean()
      : []
    const authorNameMap = new Map(authorUsers.map((u: any) => [u._id.toString(), u.displayName]))

    res.json({
      overview: {
        totalTierlists,
        publicTierlists,
        privateTierlists,
        totalUsers,
        googleUsers,
        emailUsers,
        verifiedUsers,
        totalDownloads,
        totalVotes,
        newUsersToday,
        newUsersWeek,
        newTierlistsToday,
        newTierlistsWeek,
      },
      trending: trending.map(tl => ({ ...tl, upvotes: (tl as any).upvotes || 0, downvotes: (tl as any).downvotes || 0 })),
      topDownloaded: topDownloaded.map(tl => ({ ...tl, upvotes: (tl as any).upvotes || 0, downvotes: (tl as any).downvotes || 0 })),
      topVoted: topVoted.map(tl => ({ ...tl, upvotes: (tl as any).upvotes || 0, downvotes: (tl as any).downvotes || 0 })),
      categories,
      recentUsers: recentUsers.map((u: any) => ({ ...u, _id: u._id.toString() })),
      userGrowth,
      tierlistGrowth,
      topAuthors: topAuthors.map(a => ({
        ...a,
        displayName: authorNameMap.get(a._id) || 'Inconnu',
      })),
    })
  } catch (err) {
    console.error('[API] Failed to fetch stats:', err)
    res.status(500).json({ error: 'Échec du chargement des stats' })
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
    const wantsPublic = isPublic !== false

    // Publishing validations — skip when the user is just unpublishing.
    if (wantsPublic) {
      // 1) Title length (trim + 3-80 chars). We don't change the title
      //    here — just reject if it looks unusable.
      const title = (tierList.title || '').trim()
      if (title.length < 3 || title.length > 80) {
        res.status(400).json({ error: 'Le titre doit faire entre 3 et 80 caractères.' })
        return
      }

      // 2) Banned words filter on title.
      if (containsBannedWord(title)) {
        res.status(400).json({ error: 'Le titre contient des mots interdits.' })
        return
      }

      // 3) Minimum 5 items in the pool/rows combined.
      const totalItems =
        (tierList.pool?.length || 0) +
        (tierList.rows || []).reduce((sum: number, r: any) => sum + (r.items?.length || 0), 0)
      if (totalItems < 5) {
        res.status(400).json({ error: 'Au moins 5 éléments sont requis pour publier.' })
        return
      }

      // 4) Rate limit: max N publishes per 24h per user (skip for admins).
      const admin = await isAdmin(userId)
      if (!admin) {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const recent = await TierListModel.countDocuments({
          authorId: userId,
          isPublic: true,
          updatedAt: { $gte: dayAgo },
          _id: { $ne: tierList._id }, // don't count the current one
        })
        if (recent >= PUBLISH_LIMIT_PER_DAY) {
          res.status(429).json({
            error: `Limite atteinte : ${PUBLISH_LIMIT_PER_DAY} publications max par 24h. Réessaie plus tard.`,
          })
          return
        }
      }
    }

    const validCategories = ['Gaming', 'Food', 'Anime', 'Music', 'Movies', 'Sports', 'Other']
    const safeCategory = validCategories.includes(category) ? category : 'Other'

    tierList.isPublic = wantsPublic
    tierList.category = safeCategory
    tierList.authorId = userId

    // Pick the cover BEFORE we move items around (so a placed item can still
    // act as the cover). Falls back to the first pool item.
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

    // Publishing = turning the list into a TEMPLATE: keep row structure
    // (labels, colors, any added/removed rows) but move every placed item
    // back to the pool so viewers and cloners start from a blank ranking.
    if (wantsPublic) {
      const placed = tierList.rows.flatMap((r) => r.items)
      tierList.pool = [...placed, ...tierList.pool]
      tierList.rows = tierList.rows.map((r) => ({
        id: r.id,
        label: r.label,
        color: r.color,
        items: [],
      })) as typeof tierList.rows
    }

    await tierList.save()
    res.json({ success: true, tierList })
  } catch (err) {
    console.error('[API] Publish failed:', err)
    res.status(500).json({ error: 'Échec de la publication' })
  }
})

// POST /api/tierlists/:id/report — user flags a public tierlist for moderation
router.post('/api/tierlists/:id/report', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Authentification requise pour signaler.' })
    return
  }

  try {
    const tl = await TierListModel.findById(req.params.id).select('_id isPublic authorId ownerId')
    if (!tl) {
      res.status(404).json({ error: 'Tier list introuvable' })
      return
    }
    if (!tl.isPublic) {
      res.status(400).json({ error: 'Seules les tierlists publiques peuvent être signalées.' })
      return
    }
    if (tl.authorId === userId || tl.ownerId === userId) {
      res.status(400).json({ error: 'Tu ne peux pas signaler ta propre tier list.' })
      return
    }

    const { reason, details } = req.body as { reason?: unknown; details?: unknown }
    if (typeof reason !== 'string' || !REPORT_REASONS.has(reason)) {
      res.status(400).json({ error: 'Raison invalide.' })
      return
    }

    // Anti-abuse: one report per (user, tierlist) — ever. Whether it's
    // still pending or already resolved/dismissed, the user cannot file
    // another one on the same list.
    const dup = await ReportModel.findOne({
      tierListId: tl._id.toString(),
      reporterId: userId,
    })
    if (dup) {
      res.status(409).json({ error: 'Tu as déjà signalé cette tier list.' })
      return
    }

    await ReportModel.create({
      tierListId: tl._id.toString(),
      reporterId: userId,
      reason,
      details: typeof details === 'string' ? details.trim().slice(0, 500) : '',
      status: 'pending',
    })

    res.json({ success: true })
  } catch (err) {
    console.error('[API] Report failed:', err)
    res.status(500).json({ error: 'Échec du signalement' })
  }
})

// ─── Admin moderation ──────────────────────────────────────────────

// GET /api/admin/reports — pending + resolved reports, with joined tierlist data
router.get('/api/admin/reports', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!await isAdmin(userId)) {
    res.status(403).json({ error: 'Accès réservé aux administrateurs' })
    return
  }

  try {
    const statusFilter = String(req.query.status || 'pending')
    const filter: any = statusFilter === 'all' ? {} : { status: statusFilter }

    const reports = await ReportModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()

    const tlIds = [...new Set(reports.map(r => r.tierListId))]
    const tierlists = await TierListModel.find({ _id: { $in: tlIds } })
      .select('_id title category coverImage isPublic authorId ownerId roomId')
      .lean()
    const tlMap = new Map(tierlists.map(t => [t._id.toString(), t]))

    const reporterIds = [...new Set(reports.map(r => r.reporterId).filter(Boolean))] as string[]
    const reporters = reporterIds.length
      ? await UserModel.find({ _id: { $in: reporterIds } }).select('displayName email').lean()
      : []
    const reporterMap = new Map(reporters.map((u: any) => [u._id.toString(), u]))

    res.json({
      reports: reports.map(r => ({
        ...r,
        tierList: tlMap.get(r.tierListId) || null,
        reporter: r.reporterId ? reporterMap.get(r.reporterId) || null : null,
      })),
    })
  } catch (err) {
    console.error('[API] Failed to fetch reports:', err)
    res.status(500).json({ error: 'Échec de la récupération des signalements' })
  }
})

// POST /api/admin/reports/:id/resolve — action: 'dismiss' | 'unpublish' | 'delete'
router.post('/api/admin/reports/:id/resolve', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!await isAdmin(userId)) {
    res.status(403).json({ error: 'Accès réservé aux administrateurs' })
    return
  }

  try {
    const action = String(req.body?.action || '')
    if (!['dismiss', 'unpublish', 'delete'].includes(action)) {
      res.status(400).json({ error: 'Action invalide' })
      return
    }

    const report = await ReportModel.findById(req.params.id)
    if (!report) {
      res.status(404).json({ error: 'Signalement introuvable' })
      return
    }

    if (action === 'delete') {
      await TierListModel.findByIdAndDelete(report.tierListId).catch(() => null)
      // Resolve every pending report for this tierlist in one shot.
      await ReportModel.updateMany(
        { tierListId: report.tierListId, status: 'pending' },
        { status: 'resolved', resolvedBy: userId!, resolvedAt: new Date() },
      )
    } else if (action === 'unpublish') {
      await TierListModel.findByIdAndUpdate(report.tierListId, { isPublic: false }).catch(() => null)
      await ReportModel.updateMany(
        { tierListId: report.tierListId, status: 'pending' },
        { status: 'resolved', resolvedBy: userId!, resolvedAt: new Date() },
      )
    } else {
      report.status = 'dismissed'
      report.resolvedBy = userId!
      report.resolvedAt = new Date()
      await report.save()
    }

    res.json({ success: true })
  } catch (err) {
    console.error('[API] Resolve report failed:', err)
    res.status(500).json({ error: 'Échec du traitement du signalement' })
  }
})

// GET /api/admin/tierlists — browse all public tierlists for moderation
router.get('/api/admin/tierlists', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!await isAdmin(userId)) {
    res.status(403).json({ error: 'Accès réservé aux administrateurs' })
    return
  }
  try {
    const { scope = 'public', search } = req.query
    const filter: any = {}
    if (scope === 'public') filter.isPublic = true
    else if (scope === 'private') filter.isPublic = false
    if (typeof search === 'string' && search.trim()) {
      const s = sanitize(search, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.title = { $regex: s, $options: 'i' }
    }
    const tierlists = await TierListModel.find(filter)
      .sort({ updatedAt: -1 })
      .limit(200)
      .select('_id title category coverImage isPublic authorId ownerId downloads upvotes downvotes createdAt updatedAt roomId')
      .lean()

    const authorIds = [...new Set(tierlists.map(t => t.authorId).filter(Boolean))] as string[]
    const authors = authorIds.length
      ? await UserModel.find({ _id: { $in: authorIds } }).select('displayName email').lean()
      : []
    const authorMap = new Map(authors.map((u: any) => [u._id.toString(), u]))

    res.json({
      tierlists: tierlists.map(t => ({
        ...t,
        authorDisplayName: t.authorId ? (authorMap.get(t.authorId) as any)?.displayName || null : null,
        authorEmail: t.authorId ? (authorMap.get(t.authorId) as any)?.email || null : null,
      })),
    })
  } catch (err) {
    console.error('[API] Admin tierlists list failed:', err)
    res.status(500).json({ error: 'Échec de la récupération' })
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

    // Ensure voters array exists
    if (!tierlist.voters) tierlist.voters = []

    // Remove any existing vote from this user
    tierlist.voters = tierlist.voters.filter(v => v.userId !== userId)

    // Add new vote if not removing (vote !== 0)
    if (vote !== 0) {
      tierlist.voters.push({ userId, vote })
    }

    // Always recalculate from voters array — single source of truth
    tierlist.upvotes = tierlist.voters.filter(v => v.vote === 1).length
    tierlist.downvotes = tierlist.voters.filter(v => v.vote === -1).length

    await tierlist.save()

    const userVoter = tierlist.voters.find(v => v.userId === userId)
    res.json({ upvotes: tierlist.upvotes, downvotes: tierlist.downvotes, userVote: userVoter ? userVoter.vote : null })
  } catch (err) {
    console.error('[Tierlists] Vote failed:', err)
    res.status(500).json({ error: 'Échec du vote' })
  }
})

// DELETE /api/tierlists/:id — owner or admin
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
    const admin = await isAdmin(userId)
    if (!admin && tierList.authorId !== userId && tierList.ownerId !== userId) {
      res.status(403).json({ error: 'Non autorisé' })
      return
    }

    await TierListModel.findByIdAndDelete(req.params.id)
    // Clean up any reports that referenced this tierlist.
    await ReportModel.updateMany(
      { tierListId: tierList._id.toString(), status: 'pending' },
      { status: 'resolved', resolvedBy: userId, resolvedAt: new Date() },
    )
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
    const admin = await isAdmin(userId)
    if (!admin && tierList.authorId !== userId && tierList.ownerId !== userId) {
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

// POST /api/admin/import-tiermaker — create a system template from a
// browser-side TierMaker import (bookmarklet). Admin-only.
// Body: { title, cover?, category, items: [{ src, label? }] }
router.post('/api/admin/import-tiermaker', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    if (!userId) {
      res.status(401).json({ error: 'Authentification requise' })
      return
    }
    const user = await UserModel.findById(userId)
    if (!user || !ADMIN_EMAILS.has(user.email.toLowerCase())) {
      res.status(403).json({ error: 'Accès réservé aux administrateurs' })
      return
    }

    const { title, cover, category, items } = req.body as {
      title?: unknown; cover?: unknown; category?: unknown
      items?: unknown
    }

    if (typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Titre manquant' })
      return
    }
    if (typeof category !== 'string' || !ALLOWED_CATEGORIES.has(category)) {
      res.status(400).json({ error: 'Catégorie invalide' })
      return
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Liste d\'items vide' })
      return
    }

    // Validate each item URL belongs to our Cloudinary (no hotlinking of
    // arbitrary third-party URLs as that would make us a re-distributor
    // liable for broken/copyrighted content we never hosted).
    const pool: Array<{ id: string; label: string; imageUrl: string }> = []
    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue
      const rec = raw as { src?: unknown; label?: unknown; id?: unknown }
      if (typeof rec.src !== 'string' || !IMAGE_URL_RE.test(rec.src)) continue
      const label = typeof rec.label === 'string' ? rec.label.trim().slice(0, 60) : ''
      pool.push({
        id: (typeof rec.id === 'string' && rec.id) ? `tm-${rec.id}` : `tm-${pool.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
        label: label || `Item ${pool.length + 1}`,
        imageUrl: rec.src,
      })
    }
    if (pool.length === 0) {
      res.status(400).json({ error: 'Aucun item valide (les URLs doivent être sur notre Cloudinary)' })
      return
    }

    let coverImage = ''
    if (typeof cover === 'string' && IMAGE_URL_RE.test(cover)) {
      coverImage = cover
    }
    if (!coverImage) coverImage = pool[0]!.imageUrl

    // Strip TierMaker-style title suffix.
    const cleanTitle = (title as string)
      .replace(/\s*Tier\s*List(\s*Maker)?\s*$/i, '')
      .trim()
      .slice(0, 100)

    // Stable roomId by title so re-importing overwrites.
    const { DEFAULT_TIERS } = await import('@tiertogether/shared')
    const crypto = await import('crypto')
    const roomId = 'T' + crypto.createHash('sha1').update('tm:' + cleanTitle).digest('hex').toUpperCase().slice(0, 7)

    const payload = {
      roomId,
      title: cleanTitle,
      rows: DEFAULT_TIERS.map(t => ({ ...t, items: [] })),
      pool,
      ownerId: 'system',
      authorId: '',
      isPublic: true,
      downloads: 0,
      category,
      coverImage,
    }

    const existing = await TierListModel.findOne({ roomId })
    let doc: any
    if (existing) {
      await TierListModel.updateOne({ _id: existing._id }, payload)
      doc = await TierListModel.findById(existing._id).lean()
    } else {
      doc = await TierListModel.create(payload)
      doc = doc.toObject()
    }

    res.json({
      success: true,
      tierlist: {
        _id: (doc._id || existing?._id).toString(),
        roomId,
        title: cleanTitle,
        poolSize: pool.length,
      },
    })
  } catch (err) {
    console.error('[Admin] TierMaker import failed:', err)
    res.status(500).json({ error: 'Échec de l\'import' })
  }
})

// GET /api/users/:id/profile
router.get('/api/users/:id/profile', async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id).select('displayName avatar createdAt')
    if (!user) {
      res.status(404).json({ error: 'Utilisateur introuvable' })
      return
    }

    const tierlists = await TierListModel.find({ authorId: req.params.id, isPublic: true })
      .sort({ createdAt: -1 })
      .select('title category coverImage upvotes downvotes downloads createdAt roomId')
      .lean()

    const totalUpvotes = tierlists.reduce((sum, tl) => sum + ((tl as any).upvotes || 0), 0)
    const totalDownvotes = tierlists.reduce((sum, tl) => sum + ((tl as any).downvotes || 0), 0)

    res.json({
      user: {
        id: user._id,
        displayName: user.displayName,
        avatar: user.avatar,
        joinedAt: user.createdAt,
      },
      stats: {
        tierlistCount: tierlists.length,
        totalScore: totalUpvotes - totalDownvotes,
        totalDownloads: tierlists.reduce((sum, tl) => sum + (tl.downloads || 0), 0),
      },
      tierlists: tierlists.map(tl => ({
        ...tl,
        _id: (tl as any)._id.toString(),
        upvotes: (tl as any).upvotes || 0,
        downvotes: (tl as any).downvotes || 0,
      })),
    })
  } catch (err) {
    console.error('[Users] Profile fetch failed:', err)
    res.status(500).json({ error: 'Échec du chargement du profil' })
  }
})

export default router
