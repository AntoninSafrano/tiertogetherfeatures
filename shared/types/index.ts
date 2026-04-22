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
  title: string
  rows: TierRow[]
  pool: TierItem[]
  ownerId: string
  createdAt: string
  updatedAt: string
}

// ─── Default Tiers ──────────────────────────────────────────────────

export const DEFAULT_TIERS: Omit<TierRow, 'items'>[] = [
  { id: 'tier-s', label: 'S', color: '#FF7F7F' },
  { id: 'tier-a', label: 'A', color: '#FFBF7F' },
  { id: 'tier-b', label: 'B', color: '#FFDF7F' },
  { id: 'tier-c', label: 'C', color: '#FFFF7F' },
  { id: 'tier-d', label: 'D', color: '#7FFFFF' },
]

// ─── Room / User ────────────────────────────────────────────────────

export interface RoomUser {
  id: string
  username: string
  color: string
  avatar?: string
  isGuest?: boolean
}

export interface Room {
  id: string
  tierList: TierList
  users: RoomUser[]
  hostId: string
  isLocked: boolean
  isFocusMode: boolean
  isVoteMode: boolean
}

// ─── Socket Events ──────────────────────────────────────────────────

/** Row management payloads */
export interface RowUpdatePayload {
  rowId: string
  label?: string
  color?: string
}

export interface RowDeletePayload {
  rowId: string
}

export interface RowReorderPayload {
  rowId: string
  direction: 'up' | 'down'
}

export interface RowAddPayload {
  label: string
  color: string
}

/** Client -> Server events */
export interface ClientToServerEvents {
  'room:create': (data: CreateRoomPayload, callback: (res: RoomResponse) => void) => void
  'room:join': (data: JoinRoomPayload, callback: (res: RoomResponse) => void) => void
  'room:leave': () => void
  'item:move': (data: MoveItemPayload) => void
  'item:create': (data: CreateItemPayload) => void
  'room:reset': () => void
  'room:lock': () => void
  'room:toggle-focus': () => void
  'room:toggle-vote': () => void
  'vote:cast': (data: { itemId: string; rowId: string }) => void
  'item:skip': () => void
  'chat:send': (data: { text: string }) => void
  'row:update': (data: RowUpdatePayload) => void
  'row:delete': (data: RowDeletePayload) => void
  'row:reorder': (data: RowReorderPayload) => void
  'row:add': (data: RowAddPayload) => void
}

/** Server -> Client events */
export interface ServerToClientEvents {
  'room:state': (room: Room) => void
  'room:user-joined': (user: RoomUser) => void
  'room:user-left': (userId: string) => void
  'item:moved': (data: MoveItemPayload) => void
  'item:created': (item: TierItem) => void
  'room:reset': (room: Room) => void
  'room:locked': (isLocked: boolean) => void
  'room:focus-toggled': (isFocusMode: boolean) => void
  'room:vote-toggled': (isVoteMode: boolean) => void
  'vote:started': (data: { itemId: string; totalVoters: number; timeLimit: number }) => void
  'vote:update': (data: { itemId: string; votes: Record<string, number>; votedCount: number; totalVoters: number }) => void
  'vote:result': (data: { itemId: string; winnerRowId: string; votes: Record<string, number> }) => void
  'item:skipped': () => void
  'chat:message': (message: ChatMessage) => void
  'error': (message: string) => void
  'row:updated': (data: RowUpdatePayload & { rowId: string }) => void
  'row:deleted': (data: RowDeletePayload) => void
  'row:reordered': (data: RowReorderPayload) => void
  'row:added': (row: TierRow) => void
}

/** Inter-server events (unused for now) */
export interface InterServerEvents {}

/** Socket data attached to each socket */
export interface SocketData {
  userId: string
  username: string
  roomId: string | null
  color: string
}

// ─── Chat ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  userId: string
  username: string
  color: string
  avatar?: string
  text: string
  isHost: boolean
  timestamp: number
}

// ─── Payloads ───────────────────────────────────────────────────────

export interface CreateRoomPayload {
  username: string
  tierListName: string
  avatar?: string
  isGuest?: boolean
}

export interface JoinRoomPayload {
  username: string
  roomId: string
  avatar?: string
  isGuest?: boolean
}

export interface MoveItemPayload {
  itemId: string
  fromRowId: string | null  // null = pool
  toRowId: string | null    // null = pool
  toIndex: number
}

export interface CreateItemPayload {
  imageUrl: string
  label: string
}

export interface RoomResponse {
  success: boolean
  roomId?: string
  error?: string
}

// ─── Zod Schemas (shared validation) ────────────────────────────────

export const tierItemSchema = z.object({
  id: z.string().min(1),
  imageUrl: z.string().default(''),
  label: z.string().min(1).max(50),
})

export const tierRowSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(10),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  items: z.array(tierItemSchema),
})

export const tierListSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  rows: z.array(tierRowSchema),
  pool: z.array(tierItemSchema),
  ownerId: z.string().min(1),
})

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

export const createItemSchema = z.object({
  imageUrl: z.string().url(),
  label: z.string().min(1).max(50).trim(),
})
