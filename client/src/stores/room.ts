import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Room,
  RoomUser,
  TierItem,
  TierRow,
  TierList,
  MoveItemPayload,
  RoomResponse,
} from '@tiertogether/shared'
import { DEFAULT_TIERS } from '@tiertogether/shared'
import { useSocket } from '@/composables/useSocket'

export const useRoomStore = defineStore('room', () => {
  // ─── Room State ─────────────────────────────────────────────────
  const currentRoom = ref<Room | null>(null)
  const isInRoom = computed(() => currentRoom.value !== null)
  const users = ref<RoomUser[]>([])
  const username = ref('')

  // ─── TierList State (local, drives the UI) ─────────────────────
  const title = ref('')
  const rows = ref<TierRow[]>([])
  const pool = ref<TierItem[]>([])

  // ─── Drag Source Tracking ───────────────────────────────────────
  // vuedraggable fires "removed" then "added" synchronously on cross-container drag.
  // We track the source container so "added" knows where the item came from.
  const _lastDragSource = ref<{ itemId: string; containerId: string | null } | null>(null)

  function trackDragSource(itemId: string, containerId: string | null) {
    _lastDragSource.value = { itemId, containerId }
  }

  function getDragSource(itemId: string): string | null {
    if (_lastDragSource.value?.itemId === itemId) {
      const src = _lastDragSource.value.containerId
      _lastDragSource.value = null
      return src
    }
    return null
  }

  // ─── Socket Event Binding ───────────────────────────────────────
  let eventsBound = false

  function bindEvents() {
    if (eventsBound) return
    const { socket } = useSocket()
    if (!socket.value) return
    eventsBound = true

    socket.value.on('room:state', (room: Room) => {
      currentRoom.value = room
      users.value = room.users
      title.value = room.tierList.title
      rows.value = room.tierList.rows
      pool.value = room.tierList.pool
    })

    socket.value.on('item:moved', (data: MoveItemPayload) => {
      applyRemoteMove(data)
    })

    socket.value.on('room:user-joined', (user: RoomUser) => {
      users.value.push(user)
    })

    socket.value.on('room:user-left', (userId: string) => {
      users.value = users.value.filter((u) => u.id !== userId)
    })

    socket.value.on('error', (msg: string) => {
      console.error('[Socket] Server error:', msg)
    })
  }

  // ─── Socket Emitters ────────────────────────────────────────────

  function emitMove(payload: MoveItemPayload) {
    const { socket } = useSocket()
    if (socket.value?.connected) {
      socket.value.emit('item:move', payload)
    }
  }

  function createRoom(tierListName: string, user: string): Promise<RoomResponse> {
    const { socket, connect } = useSocket()
    connect()
    bindEvents()

    return new Promise((resolve) => {
      // socket.io buffers emits until connected
      socket.value!.emit('room:create', { username: user, tierListName }, resolve)
    })
  }

  function joinRoom(roomId: string, user: string): Promise<RoomResponse> {
    const { socket, connect } = useSocket()
    connect()
    bindEvents()

    return new Promise((resolve) => {
      socket.value!.emit('room:join', { username: user, roomId }, resolve)
    })
  }

  // ─── Local TierList Mutations ───────────────────────────────────

  /** Apply a move from a remote user (no socket emit) */
  function applyRemoteMove(data: MoveItemPayload) {
    const { itemId, fromRowId, toRowId, toIndex } = data

    // Remove from source
    let item: TierItem | undefined

    if (fromRowId === null) {
      const idx = pool.value.findIndex((i) => i.id === itemId)
      if (idx !== -1) item = pool.value.splice(idx, 1)[0]
    } else {
      const row = rows.value.find((r) => r.id === fromRowId)
      if (row) {
        const idx = row.items.findIndex((i) => i.id === itemId)
        if (idx !== -1) item = row.items.splice(idx, 1)[0]
      }
    }

    if (!item) return

    // Insert into target
    if (toRowId === null) {
      pool.value.splice(toIndex, 0, item)
    } else {
      const row = rows.value.find((r) => r.id === toRowId)
      if (row) {
        row.items.splice(toIndex, 0, item)
      }
    }
  }

  /**
   * Programmatic move (local update + socket emit).
   * Used if we need to move items from code. Drag-and-drop moves
   * are handled by vuedraggable + emitMove directly from components.
   */
  function moveItem(
    itemId: string,
    fromContainerId: string | null,
    toContainerId: string | null,
    newIndex: number,
  ) {
    applyRemoteMove({ itemId, fromRowId: fromContainerId, toRowId: toContainerId, toIndex: newIndex })
    emitMove({ itemId, fromRowId: fromContainerId, toRowId: toContainerId, toIndex: newIndex })
  }

  /** Load a full tier list from server data */
  function loadTierList(tierList: TierList) {
    title.value = tierList.title
    rows.value = tierList.rows
    pool.value = tierList.pool
  }

  /** Initialize with demo data for offline testing */
  function initDemo() {
    title.value = 'Best Anime Characters'
    rows.value = DEFAULT_TIERS.map((tier) => ({ ...tier, items: [] }))
    pool.value = [
      { id: 'item-1', imageUrl: '', label: 'Naruto' },
      { id: 'item-2', imageUrl: '', label: 'Goku' },
      { id: 'item-3', imageUrl: '', label: 'Luffy' },
      { id: 'item-4', imageUrl: '', label: 'Ichigo' },
      { id: 'item-5', imageUrl: '', label: 'Eren' },
      { id: 'item-6', imageUrl: '', label: 'Saitama' },
      { id: 'item-7', imageUrl: '', label: 'Light' },
      { id: 'item-8', imageUrl: '', label: 'Zoro' },
      { id: 'item-9', imageUrl: '', label: 'Vegeta' },
      { id: 'item-10', imageUrl: '', label: 'Kakashi' },
      { id: 'item-11', imageUrl: '', label: 'All Might' },
      { id: 'item-12', imageUrl: '', label: 'Levi' },
    ]
  }

  // ─── Room Management ────────────────────────────────────────────

  function setRoom(room: Room) {
    currentRoom.value = room
    loadTierList(room.tierList)
  }

  function clearRoom() {
    const { socket } = useSocket()
    if (socket.value?.connected && currentRoom.value) {
      socket.value.emit('room:leave')
    }
    currentRoom.value = null
    users.value = []
    title.value = ''
    rows.value = []
    pool.value = []
    eventsBound = false
  }

  return {
    // Room
    currentRoom,
    isInRoom,
    users,
    username,
    setRoom,
    clearRoom,
    createRoom,
    joinRoom,
    // TierList
    title,
    rows,
    pool,
    moveItem,
    emitMove,
    loadTierList,
    initDemo,
    // Drag tracking
    trackDragSource,
    getDragSource,
    // Events
    bindEvents,
  }
})
