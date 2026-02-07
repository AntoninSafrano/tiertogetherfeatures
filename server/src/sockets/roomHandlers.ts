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
import { TierListModel } from '../models/TierList'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {

  // ─── room:create ────────────────────────────────────────────────
  socket.on('room:create', async (data, callback) => {
    const parsed = createRoomSchema.safeParse(data)
    if (!parsed.success) {
      callback({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' })
      return
    }

    try {
      const roomId = generateRoomId()
      const color = generateUserColor()

      // Persist in MongoDB
      await TierListModel.create({
        roomId,
        title: parsed.data.tierListName,
        rows: DEFAULT_TIERS.map((t) => ({ ...t, items: [] })),
        pool: [],
        ownerId: socket.id,
      })

      // Join Socket.io room
      socket.join(roomId)
      socket.data.userId = socket.id
      socket.data.username = parsed.data.username
      socket.data.roomId = roomId
      socket.data.color = color

      console.log(`[Room] Created room ${roomId} by ${parsed.data.username}`)

      // Send initial state
      const roomState = await buildRoomState(io, roomId)
      if (roomState) socket.emit('room:state', roomState)

      callback({ success: true, roomId })
    } catch (err) {
      console.error('[Room] Create failed:', err)
      callback({ success: false, error: 'Failed to create room' })
    }
  })

  // ─── room:join ──────────────────────────────────────────────────
  socket.on('room:join', async (data, callback) => {
    const parsed = joinRoomSchema.safeParse(data)
    if (!parsed.success) {
      callback({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' })
      return
    }

    const { roomId, username } = parsed.data

    try {
      // Find or create the tier list in MongoDB
      let tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        tierList = await TierListModel.create({
          roomId,
          title: 'Untitled Tier List',
          rows: DEFAULT_TIERS.map((t) => ({ ...t, items: [] })),
          pool: [],
          ownerId: socket.id,
        })
        console.log(`[Room] Room ${roomId} not found, created with defaults`)
      }

      const color = generateUserColor()

      // Join Socket.io room
      socket.join(roomId)
      socket.data.userId = socket.id
      socket.data.username = username
      socket.data.roomId = roomId
      socket.data.color = color

      // Send full room state to the joining user
      const roomState = await buildRoomState(io, roomId)
      if (roomState) socket.emit('room:state', roomState)

      // Notify other users
      socket.to(roomId).emit('room:user-joined', {
        id: socket.id,
        username,
        color,
      })

      console.log(`[Room] ${username} joined room ${roomId}`)
      callback({ success: true, roomId })
    } catch (err) {
      console.error('[Room] Join failed:', err)
      callback({ success: false, error: 'Failed to join room' })
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
      socket.emit('error', 'Invalid move data')
      return
    }

    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Not in a room')
      return
    }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        socket.emit('error', 'Room not found in database')
        return
      }

      const { itemId, fromRowId, toRowId, toIndex } = parsed.data

      // 1. Remove item from source container
      let movedItem: { id: string; imageUrl: string; label: string } | undefined

      if (fromRowId === null) {
        // From pool
        const idx = tierList.pool.findIndex((i) => i.id === itemId)
        if (idx !== -1) {
          movedItem = tierList.pool.splice(idx, 1)[0]
        }
      } else {
        // From a tier row
        const sourceRow = tierList.rows.find((r) => r.id === fromRowId)
        if (sourceRow) {
          const idx = sourceRow.items.findIndex((i) => i.id === itemId)
          if (idx !== -1) {
            movedItem = sourceRow.items.splice(idx, 1)[0]
          }
        }
      }

      if (!movedItem) {
        socket.emit('error', 'Item not found in source')
        return
      }

      // 2. Insert item into target container
      if (toRowId === null) {
        // To pool
        tierList.pool.splice(toIndex, 0, movedItem)
      } else {
        // To a tier row
        const targetRow = tierList.rows.find((r) => r.id === toRowId)
        if (!targetRow) {
          socket.emit('error', 'Target row not found')
          return
        }
        targetRow.items.splice(toIndex, 0, movedItem)
      }

      // 3. Save to MongoDB
      tierList.markModified('rows')
      tierList.markModified('pool')
      await tierList.save()

      // 4. Broadcast to all OTHER users in the room
      socket.to(roomId).emit('item:moved', parsed.data)
    } catch (err) {
      console.error('[Room] Move failed:', err)
      socket.emit('error', 'Failed to move item')
    }
  })

  // ─── item:create ────────────────────────────────────────────────
  socket.on('item:create', async (data) => {
    const parsed = createItemSchema.safeParse(data)
    if (!parsed.success) {
      socket.emit('error', 'Invalid item data')
      return
    }

    const roomId = socket.data.roomId
    if (!roomId) {
      socket.emit('error', 'Not in a room')
      return
    }

    try {
      const tierList = await TierListModel.findOne({ roomId })
      if (!tierList) {
        socket.emit('error', 'Room not found in database')
        return
      }

      const newItem = {
        id: randomUUID(),
        imageUrl: parsed.data.imageUrl,
        label: parsed.data.label,
      }

      tierList.pool.push(newItem)
      tierList.markModified('pool')
      await tierList.save()

      // Broadcast to ALL users in the room (including sender)
      io.in(roomId).emit('item:created', newItem)

      console.log(`[Room] Item "${newItem.label}" created in room ${roomId}`)
    } catch (err) {
      console.error('[Room] Create item failed:', err)
      socket.emit('error', 'Failed to create item')
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
}

async function buildRoomState(io: TypedServer, roomId: string): Promise<Room | null> {
  const tierList = await TierListModel.findOne({ roomId })
  if (!tierList) return null

  // Get connected users in this room
  const connectedSockets = await io.in(roomId).fetchSockets()
  const users: RoomUser[] = connectedSockets.map((s) => ({
    id: s.id,
    username: s.data.username || 'Anonymous',
    color: s.data.color || '#9147ff',
  }))

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
  }
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateUserColor(): string {
  const colors = ['#9147ff', '#00c853', '#ff9800', '#eb0400', '#2196f3', '#e91e63', '#00bcd4']
  return colors[Math.floor(Math.random() * colors.length)]!
}
