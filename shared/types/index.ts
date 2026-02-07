import { z } from 'zod'

// ─── Tier List Models ───────────────────────────────────────────────

export interface TierItem {
  id: string
  imageUrl: string
  label: string
}

export interface TierRow {
  id: string
  label: string
  color: string
  items: TierItem[]
}

export interface TierList {
  id: string
  name: string
  rows: TierRow[]
  unrankedItems: TierItem[]
  createdAt: string
  updatedAt: string
}

// ─── Room / User ────────────────────────────────────────────────────

export interface RoomUser {
  id: string
  username: string
  color: string
}

export interface Room {
  id: string
  tierList: TierList
  users: RoomUser[]
  hostId: string
}

// ─── Socket Events ──────────────────────────────────────────────────

/** Client -> Server events */
export interface ClientToServerEvents {
  'room:create': (data: CreateRoomPayload, callback: (res: RoomResponse) => void) => void
  'room:join': (data: JoinRoomPayload, callback: (res: RoomResponse) => void) => void
  'room:leave': () => void
  'item:move': (data: MoveItemPayload) => void
}

/** Server -> Client events */
export interface ServerToClientEvents {
  'room:state': (room: Room) => void
  'room:user-joined': (user: RoomUser) => void
  'room:user-left': (userId: string) => void
  'item:moved': (data: MoveItemPayload) => void
  'error': (message: string) => void
}

/** Inter-server events (unused for now) */
export interface InterServerEvents {}

/** Socket data attached to each socket */
export interface SocketData {
  userId: string
  username: string
  roomId: string | null
}

// ─── Payloads ───────────────────────────────────────────────────────

export interface CreateRoomPayload {
  username: string
  tierListName: string
}

export interface JoinRoomPayload {
  username: string
  roomId: string
}

export interface MoveItemPayload {
  itemId: string
  fromRowId: string | null  // null = unranked pool
  toRowId: string | null    // null = unranked pool
  toIndex: number
}

export interface RoomResponse {
  success: boolean
  roomId?: string
  error?: string
}

// ─── Zod Schemas (shared validation) ────────────────────────────────

export const createRoomSchema = z.object({
  username: z.string().min(1).max(20).trim(),
  tierListName: z.string().min(1).max(100).trim(),
})

export const joinRoomSchema = z.object({
  username: z.string().min(1).max(20).trim(),
  roomId: z.string().min(1).max(50).trim(),
})

export const moveItemSchema = z.object({
  itemId: z.string().min(1),
  fromRowId: z.string().nullable(),
  toRowId: z.string().nullable(),
  toIndex: z.number().int().min(0),
})
