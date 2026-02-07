import type { Server, Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@tiertogether/shared'
import {
  createRoomSchema,
  joinRoomSchema,
  moveItemSchema,
} from '@tiertogether/shared'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('room:create', (data, callback) => {
    const parsed = createRoomSchema.safeParse(data)
    if (!parsed.success) {
      callback({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' })
      return
    }

    // TODO: Implement room creation logic with MongoDB
    const roomId = generateRoomId()
    console.log(`[Room] Created room ${roomId} by ${parsed.data.username}`)

    socket.join(roomId)
    socket.data.roomId = roomId
    socket.data.username = parsed.data.username
    socket.data.userId = socket.id

    callback({ success: true, roomId })
  })

  socket.on('room:join', (data, callback) => {
    const parsed = joinRoomSchema.safeParse(data)
    if (!parsed.success) {
      callback({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data' })
      return
    }

    const { roomId, username } = parsed.data

    // Check room exists (Socket.io rooms)
    const room = io.sockets.adapter.rooms.get(roomId)
    if (!room) {
      callback({ success: false, error: 'Room not found' })
      return
    }

    socket.join(roomId)
    socket.data.roomId = roomId
    socket.data.username = username
    socket.data.userId = socket.id

    // Notify other users
    socket.to(roomId).emit('room:user-joined', {
      id: socket.id,
      username,
      color: generateUserColor(),
    })

    console.log(`[Room] ${username} joined room ${roomId}`)
    callback({ success: true, roomId })
  })

  socket.on('room:leave', () => {
    leaveCurrentRoom(io, socket)
  })

  socket.on('item:move', (data) => {
    const parsed = moveItemSchema.safeParse(data)
    if (!parsed.success) {
      socket.emit('error', 'Invalid move data')
      return
    }

    if (!socket.data.roomId) {
      socket.emit('error', 'Not in a room')
      return
    }

    // Broadcast the move to all other users in the room
    socket.to(socket.data.roomId).emit('item:moved', parsed.data)
  })

  socket.on('disconnect', () => {
    leaveCurrentRoom(io, socket)
  })
}

function leaveCurrentRoom(io: TypedServer, socket: TypedSocket): void {
  const roomId = socket.data.roomId
  if (!roomId) return

  socket.leave(roomId)
  socket.to(roomId).emit('room:user-left', socket.id)
  socket.data.roomId = null
  console.log(`[Room] ${socket.data.username ?? socket.id} left room ${roomId}`)
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateUserColor(): string {
  const colors = ['#9147ff', '#00c853', '#ff9800', '#eb0400', '#2196f3', '#e91e63', '#00bcd4']
  return colors[Math.floor(Math.random() * colors.length)]!
}
