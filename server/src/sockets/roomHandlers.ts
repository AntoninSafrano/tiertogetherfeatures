import type { Server, Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  Room,
  RoomUser,
} from '@tiertogether/shared'
import {
  createRoomSchema,
  joinRoomSchema,
  moveItemSchema,
  createItemSchema,
  DEFAULT_TIERS,
} from '@tiertogether/shared'
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import { TierListModel } from '../models/TierList'
import { env } from '../config/env'

// A03: Sanitize user inputs — prevent NoSQL injection and XSS
function sanitize(str: string, maxLen: number = 500): string {
  return str.replace(/[${}]/g, '').trim().slice(0, maxLen)
}

// Validate hex color format
function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(color)
}

function getAuthUserId(socket: TypedSocket): string | null {
  try {
    const cookieHeader = socket.handshake.headers.cookie || ''
    const match = cookieHeader.match(/token=([^;]+)/)
    if (!match) return null
    const decoded = jwt.verify(match[1], env.JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

// ─── Vote Mode State ────────────────────────────────────────────────
const activeVotes = new Map<string, {
  itemId: string
  votes: Map<string, string>  // userId -> rowId
  voters: Set<string>         // userIds who can vote
}>()

// Store vote timers per room
const voteTimers = new Map<string, NodeJS.Timeout>()

async function startNextVote(roomId: string, io: TypedServer): Promise<void> {
  const tierList = await TierListModel.findOne({ roomId })
  if (!tierList || !tierList.isVoteMode) return

  if (tierList.pool.length === 0) {
    // No more items — disable vote mode
    tierList.isVoteMode = false
    await tierList.save()
    activeVotes.delete(roomId)
    io.in(roomId).emit('room:vote-toggled', false)
    return
  }

  const item = tierList.pool[0]
  const sockets = await io.in(roomId).fetchSockets()
  const voterIds = new Set(sockets.map((s) => s.id))

  activeVotes.set(roomId, {
    itemId: item.id,
    votes: new Map(),
    voters: voterIds,
  })

  io.in(roomId).emit('vote:started', {
    itemId: item.id,
    totalVoters: voterIds.size,
    timeLimit: 30,
  })

  // Clear any existing timer
  if (voteTimers.has(roomId)) clearTimeout(voteTimers.get(roomId)!)

  // Set 30s auto-resolve timer
  const timer = setTimeout(() => {
    const activeVote = activeVotes.get(roomId)
    if (activeVote && activeVote.votes.size > 0) {
      resolveVote(roomId, io)
    } else {
      // No votes at all, skip item
      startNextVote(roomId, io)
    }
    voteTimers.delete(roomId)
  }, 30000)
  voteTimers.set(roomId, timer)
}

async function resolveVote(roomId: string, io: TypedServer): Promise<void> {
  // Clear the vote timer when resolving
  if (voteTimers.has(roomId)) {
    clearTimeout(voteTimers.get(roomId)!)
    voteTimers.delete(roomId)
  }

  const vote = activeVotes.get(roomId)
  if (!vote) return

  const tierList = await TierListModel.findOne({ roomId })
  if (!tierList) return

  // Count votes per row
  const tally = new Map<string, number>()
  for (const rowId of vote.votes.values()) {
    tally.set(rowId, (tally.get(rowId) || 0) + 1)
  }

  const votesRecord: Record<string, number> = {}
  for (const [rowId, count] of tally.entries()) {
    votesRecord[rowId] = count
  }

  // Find the winner (most votes)
  let maxCount = 0
  let winners: string[] = []
  for (const [rowId, count] of tally.entries()) {
    if (count > maxCount) {
      maxCount = count
      winners = [rowId]
    } else if (count === maxCount) {
      winners.push(rowId)
    }
  }

  let winnerRowId: string
  if (winners.length === 1) {
    winnerRowId = winners[0]
  } else {
    // Tie — host breaks it
    const hostVote = vote.votes.get(tierList.ownerId)
    if (hostVote && winners.includes(hostVote)) {
      winnerRowId = hostVote
    } else {
      // Host didn't vote for any of the tied rows — pick first
      winnerRowId = winners[0]
    }
  }

  // Move item from pool to the winning row
  const poolIdx = tierList.pool.findIndex((i) => i.id === vote.itemId)
  if (poolIdx !== -1) {
    const movedItem = tierList.pool.splice(poolIdx, 1)[0]
    const targetRow = tierList.rows.find((r) => r.id === winnerRowId)
    if (targetRow) {
      targetRow.items.push(movedItem)
    }
    tierList.markModified('rows')
    tierList.markModified('pool')
    await tierList.save()
  }

  // Broadcast the result
  io.in(roomId).emit('vote:result', {
    itemId: vote.itemId,
    winnerRowId,
    votes: votesRecord,
  })

  // Clear active vote
  activeVotes.delete(roomId)

  // Auto-start next vote after 2 seconds
  setTimeout(() => {
    startNextVote(roomId, io)
  }, 2000)
}

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {

  // ─── room:create ────────────────────────────────────────────────
  socket.on('room:create', async (data, callback) => {
    const parsed = createRoomSchema.safeParse(data)
    if (!parsed.success) {
      callback({ success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' })
      return
    }

    try {
      const roomId = generateRoomId()
      const color = generateUserColor()

      // A03: Sanitize user inputs
      const safeTierListName = sanitize(parsed.data.tierListName, 100)
      const safeUsername = sanitize(parsed.data.username, 50)

      // Persist in MongoDB
      const authUserId = getAuthUserId(socket)
      await TierListModel.create({
        roomId,
        title: safeTierListName,
        rows: DEFAULT_TIERS.map((t) => ({ ...t, items: [] })),
        pool: [],
        ownerId: socket.id,
        ...(authUserId && { authorId: authUserId }),
      })

      // Join Socket.io room
      socket.join(roomId)
      socket.data.userId = socket.id
      socket.data.username = safeUsername
      socket.data.roomId = roomId
      socket.data.color = color

      console.log(`[Room] Created room ${roomId} by ${parsed.data.username}`)

      // Send initial state
      const roomState = await buildRoomState(io, roomId)
      if (roomState) socket.emit('room:state', roomState)

      callback({ success: true, roomId })
    } catch (err) {
      console.error('[Room] Create failed:', err)
      callback({ success: false, error: 'Échec de la création de la room' })
    }
  })

  // ─── room:join ──────────────────────────────────────────────────
  socket.on('room:join', async (data, callback) => {
    const parsed = joinRoomSchema.safeParse(data)
    if (!parsed.success) {
      callback({ success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' })
      return
    }

    const { roomId } = parsed.data
    const username = sanitize(parsed.data.username, 50)

    try {
      // Find the tier list in MongoDB
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        callback({ success: false, error: 'Room introuvable' })
        return
      }

      // Check if this is a rejoin (same username already in room)
      const existingSockets = await io.in(roomId).fetchSockets()
      const oldSocket = existingSockets.find((s) => s.data.username === username && s.id !== socket.id)
      const isRejoin = !!oldSocket
      const color = oldSocket?.data.color || generateUserColor()

      // Link authenticated user to tier list if not yet linked
      const authUserId = getAuthUserId(socket)
      if (authUserId && !tierList.authorId) {
        tierList.authorId = authUserId
      }

      // If rejoining, clean up old socket
      if (oldSocket) {
        oldSocket.leave(roomId)
        oldSocket.data.roomId = null
        // Transfer host if the old socket was host
        if (tierList.ownerId === oldSocket.id) {
          tierList.ownerId = socket.id
        }
      }

      // Save if modified
      if (tierList.isModified()) {
        await tierList.save()
      }

      // Join Socket.io room
      socket.join(roomId)
      socket.data.userId = socket.id
      socket.data.username = username
      socket.data.roomId = roomId
      socket.data.color = color

      // Send full room state to ALL users in the room (ensures sync)
      const roomState = await buildRoomState(io, roomId)
      if (roomState) io.in(roomId).emit('room:state', roomState)

      console.log(`[Room] ${username} ${isRejoin ? 'rejoined' : 'joined'} room ${roomId}`)
      callback({ success: true, roomId })
    } catch (err) {
      console.error('[Room] Join failed:', err)
      callback({ success: false, error: 'Échec de la connexion à la room' })
    }
  })

  // ─── room:leave ─────────────────────────────────────────────────
  socket.on('room:leave', () => {
    leaveCurrentRoom(io, socket)
  })

  // ─── item:move ──────────────────────────────────────────────────
  socket.on('item:move', async (data) => {
    const parsed = moveItemSchema.safeParse(data)
    if (!parsed.success) {
      socket.emit('error', 'Données de déplacement invalides')
      return
    }

    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Pas dans une room')
      return
    }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        socket.emit('error', 'Room introuvable en base de données')
        return
      }

      // Reject moves from non-hosts when room is locked
      if (tierList.isLocked && tierList.ownerId !== socket.id) {
        socket.emit('error', 'Room verrouillée — seul l\'hôte peut déplacer les éléments')
        return
      }

      const { itemId, fromRowId, toRowId, toIndex } = parsed.data

      // 1. Remove item from source container
      let movedItem: { id: string; imageUrl: string; label: string } | undefined

      if (fromRowId === null) {
        const idx = tierList.pool.findIndex((i) => i.id === itemId)
        if (idx !== -1) {
          movedItem = tierList.pool.splice(idx, 1)[0]
        }
      } else {
        const sourceRow = tierList.rows.find((r) => r.id === fromRowId)
        if (sourceRow) {
          const idx = sourceRow.items.findIndex((i) => i.id === itemId)
          if (idx !== -1) {
            movedItem = sourceRow.items.splice(idx, 1)[0]
          }
        }
      }

      // Fallback: search all containers if item wasn't in the specified source
      if (!movedItem) {
        const poolIdx = tierList.pool.findIndex((i) => i.id === itemId)
        if (poolIdx !== -1) {
          movedItem = tierList.pool.splice(poolIdx, 1)[0]
        } else {
          for (const row of tierList.rows) {
            const idx = row.items.findIndex((i) => i.id === itemId)
            if (idx !== -1) {
              movedItem = row.items.splice(idx, 1)[0]
              break
            }
          }
        }
      }

      if (!movedItem) {
        socket.emit('error', 'Élément introuvable dans la source')
        return
      }

      // 2. Insert item into target container
      if (toRowId === null) {
        // To pool
        const maxIndex = tierList.pool.length
        const safeIndex = Math.max(0, Math.min(toIndex, maxIndex))
        tierList.pool.splice(safeIndex, 0, movedItem)
      } else {
        // To a tier row
        const targetRow = tierList.rows.find((r) => r.id === toRowId)
        if (!targetRow) {
          socket.emit('error', 'Ligne cible introuvable')
          return
        }
        const maxIndex = targetRow.items.length
        const safeIndex = Math.max(0, Math.min(toIndex, maxIndex))
        targetRow.items.splice(safeIndex, 0, movedItem)
      }

      // 3. Save to MongoDB
      tierList.markModified('rows')
      tierList.markModified('pool')
      await tierList.save()

      // 4. Broadcast to all OTHER users in the room
      socket.to(roomId).emit('item:moved', parsed.data)
    } catch (err) {
      console.error('[Room] Move failed:', err)
      socket.emit('error', 'Échec du déplacement de l\'élément')
    }
  })

  // ─── item:create ────────────────────────────────────────────────
  socket.on('item:create', async (data) => {
    const parsed = createItemSchema.safeParse(data)
    if (!parsed.success) {
      socket.emit('error', 'Données d\'élément invalides')
      return
    }

    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Pas dans une room')
      return
    }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        socket.emit('error', 'Room introuvable en base de données')
        return
      }

      const newItem = {
        id: randomUUID(),
        imageUrl: parsed.data.imageUrl,
        label: sanitize(parsed.data.label, 100),
      }

      tierList.pool.push(newItem)
      tierList.markModified('pool')
      await tierList.save()

      // Broadcast to ALL users in the room (including sender)
      io.in(roomId).emit('item:created', newItem)

      console.log(`[Room] Item "${newItem.label}" created in room ${roomId}`)
    } catch (err) {
      console.error('[Room] Create item failed:', err)
      socket.emit('error', 'Échec de la création de l\'élément')
    }
  })

  // ─── room:lock ─────────────────────────────────────────────────
  socket.on('room:lock', async () => {
    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Pas dans une room')
      return
    }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        socket.emit('error', 'Room introuvable')
        return
      }

      if (tierList.ownerId !== socket.id) {
        socket.emit('error', 'Seul l\'hôte peut verrouiller/déverrouiller la room')
        return
      }

      tierList.isLocked = !tierList.isLocked
      await tierList.save()

      io.in(roomId).emit('room:locked', tierList.isLocked)
      console.log(`[Room] Room ${roomId} ${tierList.isLocked ? 'locked' : 'unlocked'} by host`)
    } catch (err) {
      console.error('[Room] Lock toggle failed:', err)
      socket.emit('error', 'Échec du verrouillage/déverrouillage')
    }
  })

  // ─── room:toggle-focus ─────────────────────────────────────────
  socket.on('room:toggle-focus', async () => {
    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Pas dans une room')
      return
    }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        socket.emit('error', 'Room introuvable')
        return
      }

      if (tierList.ownerId !== socket.id) {
        socket.emit('error', 'Seul l\'hôte peut activer/désactiver le mode focus')
        return
      }

      tierList.isFocusMode = !tierList.isFocusMode
      await tierList.save()

      io.in(roomId).emit('room:focus-toggled', tierList.isFocusMode)
      console.log(`[Room] Room ${roomId} focus mode ${tierList.isFocusMode ? 'enabled' : 'disabled'} by host`)
    } catch (err) {
      console.error('[Room] Focus toggle failed:', err)
      socket.emit('error', 'Échec de l\'activation/désactivation du mode focus')
    }
  })

  // ─── room:toggle-vote ───────────────────────────────────────────
  socket.on('room:toggle-vote', async () => {
    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Pas dans une room')
      return
    }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        socket.emit('error', 'Room introuvable')
        return
      }

      if (tierList.ownerId !== socket.id) {
        socket.emit('error', 'Seul l\'hôte peut activer/désactiver le mode vote')
        return
      }

      tierList.isVoteMode = !tierList.isVoteMode
      await tierList.save()

      io.in(roomId).emit('room:vote-toggled', tierList.isVoteMode)
      console.log(`[Room] Room ${roomId} vote mode ${tierList.isVoteMode ? 'enabled' : 'disabled'} by host`)

      if (tierList.isVoteMode) {
        // Start first vote
        await startNextVote(roomId, io)
      } else {
        // Clear active vote
        activeVotes.delete(roomId)
      }
    } catch (err) {
      console.error('[Room] Vote toggle failed:', err)
      socket.emit('error', 'Échec de l\'activation/désactivation du mode vote')
    }
  })

  // ─── vote:cast ──────────────────────────────────────────────────
  socket.on('vote:cast', async (data) => {
    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Pas dans une room')
      return
    }

    const vote = activeVotes.get(roomId)
    if (!vote) {
      socket.emit('error', 'Aucun vote en cours')
      return
    }

    if (data.itemId !== vote.itemId) {
      socket.emit('error', 'Vote invalide — élément incorrect')
      return
    }

    // Record the vote (overwrite if already voted)
    vote.votes.set(socket.id, data.rowId)

    // Build vote counts per row
    const tally: Record<string, number> = {}
    for (const rowId of vote.votes.values()) {
      tally[rowId] = (tally[rowId] || 0) + 1
    }

    // Broadcast update
    io.in(roomId).emit('vote:update', {
      itemId: vote.itemId,
      votes: tally,
      votedCount: vote.votes.size,
      totalVoters: vote.voters.size,
    })

    // Check if all voters have voted
    if (vote.votes.size >= vote.voters.size) {
      await resolveVote(roomId, io)
    }
  })

  // ─── item:skip ────────────────────────────────────────────────
  socket.on('item:skip', async () => {
    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Pas dans une room')
      return
    }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        socket.emit('error', 'Room introuvable')
        return
      }

      if (tierList.pool.length === 0) {
        socket.emit('error', 'Aucun élément dans le pool à passer')
        return
      }

      // Move first item to end of pool
      const skipped = tierList.pool.shift()!
      tierList.pool.push(skipped)
      tierList.markModified('pool')
      await tierList.save()

      io.in(roomId).emit('item:skipped')
      console.log(`[Room] Item "${skipped.label}" skipped in room ${roomId}`)
    } catch (err) {
      console.error('[Room] Skip item failed:', err)
      socket.emit('error', 'Échec du passage de l\'élément')
    }
  })

  // ─── room:reset ────────────────────────────────────────────────
  socket.on('room:reset', async () => {
    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Pas dans une room')
      return
    }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        socket.emit('error', 'Room introuvable')
        return
      }

      if (tierList.ownerId !== socket.id) {
        socket.emit('error', 'Seul l\'hôte peut réinitialiser la room')
        return
      }

      for (const row of tierList.rows) {
        tierList.pool.push(...row.items)
        row.items = []
      }
      tierList.markModified('rows')
      tierList.markModified('pool')
      await tierList.save()

      const roomState = await buildRoomState(io, roomId)
      if (roomState) {
        io.in(roomId).emit('room:reset', roomState)
      }

      console.log(`[Room] Room ${roomId} reset by host`)
    } catch (err) {
      console.error('[Room] Reset failed:', err)
      socket.emit('error', 'Échec de la réinitialisation de la room')
    }
  })

  // ─── row:update ──────────────────────────────────────────────────
  socket.on('row:update', async (data) => {
    const roomId = socket.data.roomId
    if (!roomId) { socket.emit('error', 'Pas dans une room'); return }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) { socket.emit('error', 'Room introuvable'); return }

      const row = tierList.rows.find((r) => r.id === data.rowId)
      if (!row) { socket.emit('error', 'Ligne introuvable'); return }

      if (data.label !== undefined) row.label = sanitize(data.label, 50)
      if (data.color !== undefined) {
        const colorStr = String(data.color)
        row.color = isValidHexColor(colorStr) ? colorStr : row.color
      }

      tierList.markModified('rows')
      await tierList.save()

      io.in(roomId).emit('row:updated', { rowId: data.rowId, label: row.label, color: row.color })
    } catch (err) {
      console.error('[Room] Row update failed:', err)
      socket.emit('error', 'Échec de la mise à jour de la ligne')
    }
  })

  // ─── row:delete ──────────────────────────────────────────────────
  socket.on('row:delete', async (data) => {
    const roomId = socket.data.roomId
    if (!roomId) { socket.emit('error', 'Pas dans une room'); return }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) { socket.emit('error', 'Room introuvable'); return }

      const rowIndex = tierList.rows.findIndex((r) => r.id === data.rowId)
      if (rowIndex === -1) { socket.emit('error', 'Ligne introuvable'); return }

      // Move items back to pool
      const removedRow = tierList.rows[rowIndex]
      tierList.pool.push(...removedRow.items)
      tierList.rows.splice(rowIndex, 1)

      tierList.markModified('rows')
      tierList.markModified('pool')
      await tierList.save()

      io.in(roomId).emit('row:deleted', { rowId: data.rowId })
    } catch (err) {
      console.error('[Room] Row delete failed:', err)
      socket.emit('error', 'Échec de la suppression de la ligne')
    }
  })

  // ─── row:reorder ────────────────────────────────────────────────
  socket.on('row:reorder', async (data) => {
    const roomId = socket.data.roomId
    if (!roomId) { socket.emit('error', 'Pas dans une room'); return }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) { socket.emit('error', 'Room introuvable'); return }

      const idx = tierList.rows.findIndex((r) => r.id === data.rowId)
      if (idx === -1) { socket.emit('error', 'Ligne introuvable'); return }

      const newIdx = data.direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= tierList.rows.length) return

      // Swap
      const temp = tierList.rows[idx]
      tierList.rows[idx] = tierList.rows[newIdx]
      tierList.rows[newIdx] = temp

      tierList.markModified('rows')
      await tierList.save()

      io.in(roomId).emit('row:reordered', data)
    } catch (err) {
      console.error('[Room] Row reorder failed:', err)
      socket.emit('error', 'Échec du réordonnancement de la ligne')
    }
  })

  // ─── row:add ────────────────────────────────────────────────────
  socket.on('row:add', async (data) => {
    const roomId = socket.data.roomId
    if (!roomId) { socket.emit('error', 'Pas dans une room'); return }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) { socket.emit('error', 'Room introuvable'); return }

      const safeLabel = data.label ? sanitize(data.label, 50) : 'New'
      const safeColor = (data.color && isValidHexColor(String(data.color))) ? String(data.color) : '#9147ff'

      const newRow = {
        id: `tier-${randomUUID().substring(0, 8)}`,
        label: safeLabel,
        color: safeColor,
        items: [] as { id: string; imageUrl: string; label: string }[],
      }

      tierList.rows.push(newRow)
      tierList.markModified('rows')
      await tierList.save()

      io.in(roomId).emit('row:added', { ...newRow, items: [] })
    } catch (err) {
      console.error('[Room] Row add failed:', err)
      socket.emit('error', 'Échec de l\'ajout de la ligne')
    }
  })

  // ─── chat:send ─────────────────────────────────────────────────
  socket.on('chat:send', async (data) => {
    const roomId = socket.data.roomId
    if (!roomId) return

    const text = sanitize(data?.text ?? '', 500)
    if (!text) return

    if (containsBannedWord(text)) {
      socket.emit('error', 'Message bloqué : langage inapproprié')
      return
    }

    const tierList = await TierListModel.findOne({ roomId })

    const message = {
      id: randomUUID(),
      userId: socket.id,
      username: socket.data.username || 'Anonymous',
      color: socket.data.color || '#9147ff',
      text,
      isHost: tierList?.ownerId === socket.id,
      timestamp: Date.now(),
    }

    io.in(roomId).emit('chat:message', message)
  })

  // ─── disconnect ─────────────────────────────────────────────────
  socket.on('disconnect', () => {
    leaveCurrentRoom(io, socket)
  })
}

// ─── Helpers ──────────────────────────────────────────────────────

function leaveCurrentRoom(io: TypedServer, socket: TypedSocket): void {
  const roomId = socket.data.roomId
  if (!roomId) return

  socket.leave(roomId)
  socket.to(roomId).emit('room:user-left', socket.id)
  socket.data.roomId = null
  console.log(`[Room] ${socket.data.username ?? socket.id} left room ${roomId}`)
}

async function buildRoomState(io: TypedServer, roomId: string): Promise<Room | null> {
  const tierList = await TierListModel.findOne({ roomId })
  if (!tierList) return null

  // Get connected users in this room (deduplicate by username)
  const connectedSockets = await io.in(roomId).fetchSockets()
  const seen = new Set<string>()
  const users: RoomUser[] = []
  for (const s of connectedSockets) {
    const username = s.data.username || 'Anonymous'
    if (!seen.has(username)) {
      seen.add(username)
      users.push({ id: s.id, username, color: s.data.color || '#9147ff' })
    }
  }

  return {
    id: roomId,
    tierList: {
      id: tierList._id!.toString(),
      title: tierList.title,
      rows: tierList.rows.map((r) => ({
        id: r.id,
        label: r.label,
        color: r.color,
        items: r.items.map((i) => ({ id: i.id, imageUrl: i.imageUrl, label: i.label })),
      })),
      pool: tierList.pool.map((i) => ({ id: i.id, imageUrl: i.imageUrl, label: i.label })),
      ownerId: tierList.ownerId,
      createdAt: tierList.createdAt.toISOString(),
      updatedAt: tierList.updatedAt.toISOString(),
    },
    users,
    hostId: tierList.ownerId,
    isLocked: tierList.isLocked ?? false,
    isFocusMode: tierList.isFocusMode ?? false,
    isVoteMode: tierList.isVoteMode ?? false,
  }
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateUserColor(): string {
  const colors = ['#9147ff', '#00c853', '#ff9800', '#eb0400', '#2196f3', '#e91e63', '#00bcd4']
  return colors[Math.floor(Math.random() * colors.length)]!
}

// ─── Chat Moderation ───────────────────────────────────────────────

const BANNED_WORDS = [
  // English slurs & hate speech
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'tranny',
  'kike', 'spic', 'chink', 'gook', 'wetback', 'beaner', 'coon',
  'dyke', 'paki', 'towelhead', 'raghead', 'cracker',
  // English profanity
  'fuck', 'shit', 'ass', 'asshole', 'bitch', 'dick', 'cock', 'pussy',
  'whore', 'slut', 'cunt', 'bastard', 'motherfucker', 'stfu', 'wtf',
  // French slurs & hate speech
  'nègre', 'negre', 'bougnoule', 'bougnoul', 'youpin', 'youpine',
  'bamboula', 'bicot', 'raton', 'chinetoque', 'bridé', 'bride',
  'tapette', 'pédé', 'pede', 'gouine', 'tarlouze', 'enculé', 'encule',
  'fils de pute', 'fdp', 'ntm', 'nique ta mere', 'nique ta mère',
  // French profanity
  'pute', 'putain', 'salope', 'salaud', 'connard', 'connasse',
  'merde', 'bordel', 'bite', 'couille', 'branleur', 'branleuse',
  'nique', 'niquer', 'baiser', 'sexe', 'porn', 'porno',
  'pd', 'tg', 'ta gueule', 'ferme ta gueule', 'ftg',
  'batard', 'bâtard', 'abruti', 'débile', 'debile',
  'con', 'conne', 'connerie',
  // Violence & threats
  'kill yourself', 'kys', 'suicide', 'gas the', 'heil hitler',
  'nazi', 'white power', 'white supremacy',
]

const bannedRegex = new RegExp(
  BANNED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i',
)

function containsBannedWord(text: string): boolean {
  // Normalize: remove accents, leetspeak basics
  const normalized = text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/\$/g, 's')
    .replace(/@/g, 'a')
  return bannedRegex.test(normalized) || bannedRegex.test(text)
}
