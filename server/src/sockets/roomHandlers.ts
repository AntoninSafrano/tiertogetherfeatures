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
import { UserModel } from '../models/User'
import { env } from '../config/env'
import { containsBannedWord } from '../middleware/moderation'
import { connectTwitchChat, disconnectTwitchChat, getTwitchChannel } from '../twitch/chatBridge'

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

// Free-tier room size limit (future premium: unlimited)
const MAX_USERS_PER_ROOM = 5

// ─── Vote Mode State ────────────────────────────────────────────────
const activeVotes = new Map<string, {
  itemId: string
  votes: Map<string, string>        // socketId -> rowId
  voters: Set<string>               // socketIds who can vote
  twitchVotes: Map<string, string>  // twitch username -> rowId
  labelToRow: Map<string, string>   // lowercase row label -> rowId (for chat votes)
}>()

/** Combined tally: room votes + Twitch chat votes */
function buildTally(vote: { votes: Map<string, string>; twitchVotes: Map<string, string> }): Record<string, number> {
  const tally: Record<string, number> = {}
  for (const rowId of vote.votes.values()) tally[rowId] = (tally[rowId] || 0) + 1
  for (const rowId of vote.twitchVotes.values()) tally[rowId] = (tally[rowId] || 0) + 1
  return tally
}

// Throttle Twitch-driven vote:update broadcasts (chat can spam)
const twitchUpdateTimers = new Map<string, NodeJS.Timeout>()

function broadcastVoteUpdate(io: TypedServer, roomId: string): void {
  const vote = activeVotes.get(roomId)
  if (!vote) return
  io.in(roomId).emit('vote:update', {
    itemId: vote.itemId,
    votes: buildTally(vote),
    votedCount: vote.votes.size,
    totalVoters: vote.voters.size,
    twitchVotedCount: vote.twitchVotes.size,
  })
}

function handleTwitchMessage(io: TypedServer, roomId: string, username: string, message: string): void {
  const vote = activeVotes.get(roomId)
  if (!vote) return
  const label = message.trim().toLowerCase()
  const rowId = vote.labelToRow.get(label)
  if (!rowId) return
  if (vote.twitchVotes.get(username) === rowId) return
  vote.twitchVotes.set(username, rowId)

  if (!twitchUpdateTimers.has(roomId)) {
    twitchUpdateTimers.set(roomId, setTimeout(() => {
      twitchUpdateTimers.delete(roomId)
      broadcastVoteUpdate(io, roomId)
    }, 400))
  }
}

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
    twitchVotes: new Map(),
    labelToRow: new Map(tierList.rows.map((r) => [r.label.trim().toLowerCase(), r.id])),
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
    if (activeVote && (activeVote.votes.size > 0 || activeVote.twitchVotes.size > 0)) {
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

  // Count votes per row (room players + Twitch chat)
  const votesRecord = buildTally(vote)
  const tally = new Map<string, number>(Object.entries(votesRecord))

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

      // Free tier: rooms are capped (rejoins are always allowed back in)
      if (!isRejoin && existingSockets.length >= MAX_USERS_PER_ROOM) {
        callback({ success: false, error: `Room pleine — ${MAX_USERS_PER_ROOM} joueurs maximum.` })
        return
      }

      // Link authenticated user to tier list if not yet linked
      const authUserId = getAuthUserId(socket)
      if (authUserId && !tierList.authorId) {
        tierList.authorId = authUserId
      }

      // Host identity survives reconnects for authenticated authors:
      // whenever the list has an authorId and THIS socket is that author,
      // they get (or keep) host rights — even after a tab close / network blip.
      if (authUserId && tierList.authorId === authUserId) {
        tierList.ownerId = socket.id
      }
      // Legacy case: ownerId was stored as a user ID (clone flow). Promote.
      else if (authUserId && tierList.ownerId === authUserId) {
        tierList.ownerId = socket.id
      }

      // If room has no valid host (ownerId doesn't match any connected socket), first joiner becomes host
      const connectedIds = new Set((await io.in(roomId).fetchSockets()).map(s => s.id))
      if (!connectedIds.has(tierList.ownerId) && !connectedIds.has(socket.id)) {
        tierList.ownerId = socket.id
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

      // If a vote is in progress, send the current vote state to the joining user
      const activeVote = activeVotes.get(roomId)
      if (activeVote) {
        // Add this user to eligible voters
        activeVote.voters.add(socket.id)

        // Send vote:started so the new user sees the current vote
        socket.emit('vote:started', {
          itemId: activeVote.itemId,
          totalVoters: activeVote.voters.size,
          timeLimit: 30, // approximate — timer already running on server
        })

        // Send current vote progress to everyone (totalVoters changed)
        broadcastVoteUpdate(io, roomId)
      }

      // Tell the new joiner whether a Twitch chat is plugged in
      const twitchChannel = getTwitchChannel(roomId)
      if (twitchChannel) {
        socket.emit('twitch:status', { connected: true, channel: twitchChannel })
      }

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

    // Broadcast update (includes Twitch chat votes)
    broadcastVoteUpdate(io, roomId)

    // Check if all room voters have voted (Twitch votes don't end the round
    // early — chat keeps voting until the timer or the players are done)
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

  // ─── twitch:connect (host only) ────────────────────────────────
  socket.on('twitch:connect', async (data) => {
    const roomId = socket.data.roomId
    if (!roomId) { socket.emit('error', 'Pas dans une room'); return }

    try {
      const tierList = await TierListModel.findOne({ roomId }).select('ownerId').lean()
      if (!tierList || tierList.ownerId !== socket.id) {
        socket.emit('error', 'Seul l\'hôte peut connecter un chat Twitch')
        return
      }

      const channel = String(data?.channel ?? '').trim().replace(/^#/, '')
      const result = connectTwitchChat(roomId, channel, {
        onMessage: (username, message) => handleTwitchMessage(io, roomId, username, message),
        onStatus: (connected, error) => {
          io.in(roomId).emit('twitch:status', { connected, channel: channel.toLowerCase(), ...(error ? { error } : {}) })
        },
      })
      if (!result.ok) {
        socket.emit('twitch:status', { connected: false, channel, error: result.error })
        return
      }
      console.log(`[Twitch] Room ${roomId} connecting to #${channel.toLowerCase()}`)
    } catch (err) {
      console.error('[Twitch] Connect failed:', err)
      socket.emit('error', 'Échec de la connexion au chat Twitch')
    }
  })

  // ─── twitch:disconnect (host only) ─────────────────────────────
  socket.on('twitch:disconnect', async () => {
    const roomId = socket.data.roomId
    if (!roomId) return
    try {
      const tierList = await TierListModel.findOne({ roomId }).select('ownerId').lean()
      if (!tierList || tierList.ownerId !== socket.id) return
      disconnectTwitchChat(roomId)
      io.in(roomId).emit('twitch:status', { connected: false, channel: '' })
      console.log(`[Twitch] Room ${roomId} disconnected from Twitch chat`)
    } catch (err) {
      console.error('[Twitch] Disconnect failed:', err)
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

    try {
      const tierList = await TierListModel.findOne({ roomId }).select('ownerId').lean()

      // Resolve avatar once per connection, then reuse it for every message
      if (socket.data.avatar === undefined) {
        const authUserId = getAuthUserId(socket)
        let avatar = ''
        if (authUserId) {
          const u = await UserModel.findById(authUserId).select('avatar').lean().catch(() => null)
          if (u && (u as any).avatar) avatar = (u as any).avatar
        }
        socket.data.avatar = avatar
      }

      const message = {
        id: randomUUID(),
        userId: socket.id,
        username: socket.data.username || 'Anonymous',
        color: socket.data.color || '#9147ff',
        ...(socket.data.avatar ? { avatar: socket.data.avatar } : {}),
        text,
        isHost: tierList?.ownerId === socket.id,
        timestamp: Date.now(),
      }

      io.in(roomId).emit('chat:message', message)
    } catch (err) {
      console.error('[Room] Chat send failed:', err)
    }
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

  // Tear down the Twitch bridge once the room is empty
  setImmediate(async () => {
    try {
      const remaining = await io.in(roomId).fetchSockets()
      if (remaining.length === 0) disconnectTwitchChat(roomId)
    } catch { /* room already gone */ }
  })
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

