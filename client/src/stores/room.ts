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
  RowUpdatePayload,
  RowDeletePayload,
  RowReorderPayload,
  RowAddPayload,
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
  const isLocked = ref(false)
  const isFocusMode = ref(false)

  // ─── Vote Mode ──────────────────────────────────────────────────
  const isVoteMode = ref(false)
  const currentVoteItem = ref<string | null>(null)
  const voteResults = ref<Record<string, number>>({})
  const votedCount = ref(0)
  const totalVoters = ref(0)
  const hasVoted = ref(false)
  const voteWinner = ref<{ itemId: string; winnerRowId: string; votes: Record<string, number> } | null>(null)
  const voteTimeLeft = ref(0)
  let voteTimerInterval: number | null = null

  // ─── Focus Mode ───────────────────────────────────────────────
  const currentFocusItem = computed(() => pool.value[0] ?? null)

  // ─── Host Detection ───────────────────────────────────────────
  const isHost = computed(() => {
    if (!currentRoom.value) return false
    const { socket } = useSocket()
    return currentRoom.value.hostId === socket.value?.id
  })

  // ─── Drag Source Tracking ───────────────────────────────────────
  // vuedraggable fires "added" on the TARGET before "removed" on the SOURCE.
  // So we store the pending add and only emit when "removed" provides the source.
  const _pendingAdd = ref<{ itemId: string; toRowId: string | null; toIndex: number } | null>(null)

  function handleDragAdded(itemId: string, toRowId: string | null, toIndex: number) {
    _pendingAdd.value = { itemId, toRowId, toIndex }
  }

  function handleDragRemoved(itemId: string, fromRowId: string | null) {
    if (_pendingAdd.value?.itemId === itemId) {
      emitMove({
        itemId,
        fromRowId,
        toRowId: _pendingAdd.value.toRowId,
        toIndex: _pendingAdd.value.toIndex,
      })
      _pendingAdd.value = null
    }
  }

  // ─── Auto-rejoin on reconnect ───────────────────────────────────
  let reconnectRegistered = false

  function setupReconnect() {
    if (reconnectRegistered) return
    reconnectRegistered = true
    const { onReconnect } = useSocket()
    onReconnect(() => {
      const roomId = currentRoom.value?.id
      if (roomId && username.value) {
        console.log('[Room] Reconnecting to room', roomId)
        const { socket } = useSocket()
        socket.value?.emit('room:join', { username: username.value, roomId }, (res: RoomResponse) => {
          if (res.success) {
            console.log('[Room] Rejoined room', roomId)
          } else {
            console.error('[Room] Failed to rejoin:', res.error)
          }
        })
      }
    })
  }

  // ─── Socket Event Binding ───────────────────────────────────────
  let boundSocket: object | null = null

  function bindEvents() {
    const { socket } = useSocket()
    if (!socket.value || socket.value === boundSocket) return
    boundSocket = socket.value
    setupReconnect()

    socket.value.on('room:state', (room: Room) => {
      currentRoom.value = room
      users.value = room.users
      title.value = room.tierList.title
      rows.value = room.tierList.rows
      pool.value = room.tierList.pool
      isLocked.value = room.isLocked ?? false
      isFocusMode.value = room.isFocusMode ?? false
      isVoteMode.value = room.isVoteMode ?? false
    })

    socket.value.on('item:moved', (data: MoveItemPayload) => {
      applyRemoteMove(data)
    })

    socket.value.on('room:user-joined', (user: RoomUser) => {
      // Avoid duplicates (room:state already includes the full user list)
      if (!users.value.some(u => u.id === user.id)) {
        users.value.push(user)
      }
    })

    socket.value.on('room:user-left', (userId: string) => {
      users.value = users.value.filter((u) => u.id !== userId)
    })

    socket.value.on('item:created', (item: TierItem) => {
      // Avoid duplicates (e.g. from reconnect + room:state race)
      if (!pool.value.some((i) => i.id === item.id)) {
        pool.value.push(item)
      }
    })

    socket.value.on('error', (msg: string) => {
      console.error('[Socket] Server error:', msg)
    })

    socket.value.on('room:locked', (locked: boolean) => {
      isLocked.value = locked
    })

    socket.value.on('room:focus-toggled', (focused: boolean) => {
      isFocusMode.value = focused
    })

    socket.value.on('room:vote-toggled', (voteMode: boolean) => {
      isVoteMode.value = voteMode
      if (!voteMode) {
        currentVoteItem.value = null
        voteResults.value = {}
        votedCount.value = 0
        totalVoters.value = 0
        hasVoted.value = false
        voteWinner.value = null
        // Clear countdown timer
        if (voteTimerInterval) {
          clearInterval(voteTimerInterval)
          voteTimerInterval = null
        }
        voteTimeLeft.value = 0
      }
    })

    socket.value.on('vote:started', (data) => {
      currentVoteItem.value = data.itemId
      totalVoters.value = data.totalVoters
      votedCount.value = 0
      voteResults.value = {}
      hasVoted.value = false
      voteWinner.value = null

      // Start countdown timer
      if (voteTimerInterval) clearInterval(voteTimerInterval)
      voteTimeLeft.value = data.timeLimit || 30
      voteTimerInterval = window.setInterval(() => {
        voteTimeLeft.value--
        if (voteTimeLeft.value <= 0 && voteTimerInterval) {
          clearInterval(voteTimerInterval)
          voteTimerInterval = null
        }
      }, 1000)
    })

    socket.value.on('vote:update', (data) => {
      voteResults.value = data.votes
      votedCount.value = data.votedCount
      totalVoters.value = data.totalVoters
    })

    socket.value.on('vote:result', (data) => {
      // Clear countdown timer
      if (voteTimerInterval) {
        clearInterval(voteTimerInterval)
        voteTimerInterval = null
      }
      voteTimeLeft.value = 0

      voteWinner.value = data
      voteResults.value = data.votes

      // Move item locally from pool to winning row
      const poolIdx = pool.value.findIndex((i) => i.id === data.itemId)
      if (poolIdx !== -1) {
        const item = pool.value.splice(poolIdx, 1)[0]
        const row = rows.value.find((r) => r.id === data.winnerRowId)
        if (row) {
          row.items.push(item)
        }
      }
    })

    socket.value.on('item:skipped', () => {
      // Rotate first pool item to end
      if (pool.value.length > 0) {
        const skipped = pool.value.shift()!
        pool.value.push(skipped)
      }
    })

    socket.value.on('room:reset', (room: Room) => {
      currentRoom.value = room
      users.value = room.users
      title.value = room.tierList.title
      rows.value = room.tierList.rows
      pool.value = room.tierList.pool
      isLocked.value = room.isLocked ?? false
      isFocusMode.value = room.isFocusMode ?? false
      isVoteMode.value = room.isVoteMode ?? false
    })

    socket.value.on('row:updated', (data) => {
      const row = rows.value.find((r) => r.id === data.rowId)
      if (row) {
        if (data.label !== undefined) row.label = data.label
        if (data.color !== undefined) row.color = data.color
      }
    })

    socket.value.on('row:deleted', (data) => {
      const idx = rows.value.findIndex((r) => r.id === data.rowId)
      if (idx !== -1) {
        const removed = rows.value.splice(idx, 1)[0]
        pool.value.push(...removed.items)
      }
    })

    socket.value.on('row:reordered', (data) => {
      const idx = rows.value.findIndex((r) => r.id === data.rowId)
      if (idx === -1) return
      const newIdx = data.direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= rows.value.length) return
      const temp = rows.value[idx]
      rows.value[idx] = rows.value[newIdx]
      rows.value[newIdx] = temp
    })

    socket.value.on('row:added', (row) => {
      if (!rows.value.some((r) => r.id === row.id)) {
        rows.value.push(row)
      }
    })
  }

  // ─── Socket Emitters ────────────────────────────────────────────

  function emitMove(payload: MoveItemPayload) {
    const { socket } = useSocket()
    if (socket.value?.connected) {
      socket.value.emit('item:move', payload)
    }
  }

  function updateRow(data: RowUpdatePayload) {
    const { socket } = useSocket()
    if (socket.value?.connected) socket.value.emit('row:update', data)
    // Optimistic update
    const row = rows.value.find((r) => r.id === data.rowId)
    if (row) {
      if (data.label !== undefined) row.label = data.label
      if (data.color !== undefined) row.color = data.color
    }
  }

  function deleteRow(data: RowDeletePayload) {
    const { socket } = useSocket()
    if (socket.value?.connected) socket.value.emit('row:delete', data)
    const idx = rows.value.findIndex((r) => r.id === data.rowId)
    if (idx !== -1) {
      const removed = rows.value.splice(idx, 1)[0]
      pool.value.push(...removed.items)
    }
  }

  function reorderRow(data: RowReorderPayload) {
    const { socket } = useSocket()
    if (socket.value?.connected) socket.value.emit('row:reorder', data)
    const idx = rows.value.findIndex((r) => r.id === data.rowId)
    if (idx === -1) return
    const newIdx = data.direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= rows.value.length) return
    const temp = rows.value[idx]
    rows.value[idx] = rows.value[newIdx]
    rows.value[newIdx] = temp
  }

  function addRow(data?: RowAddPayload) {
    const { socket } = useSocket()
    const payload = data || { label: 'New', color: '#6366f1' }
    if (socket.value?.connected) socket.value.emit('row:add', payload)
  }

  function resetRoom() {
    const { socket } = useSocket()
    if (socket.value?.connected) {
      socket.value.emit('room:reset')
    }
  }

  function toggleLock() {
    const { socket } = useSocket()
    if (socket.value?.connected) {
      socket.value.emit('room:lock')
    }
  }

  function toggleFocusMode() {
    const { socket } = useSocket()
    if (socket.value?.connected) {
      socket.value.emit('room:toggle-focus')
    }
  }

  function toggleVoteMode() {
    const { socket } = useSocket()
    if (socket.value?.connected) {
      socket.value.emit('room:toggle-vote')
    }
  }

  function castVote(rowId: string) {
    if (!currentVoteItem.value || hasVoted.value) return
    const { socket } = useSocket()
    if (socket.value?.connected) {
      socket.value.emit('vote:cast', { itemId: currentVoteItem.value, rowId })
      hasVoted.value = true
    }
  }

  function skipCurrentItem() {
    const { socket } = useSocket()
    if (socket.value?.connected) {
      socket.value.emit('item:skip')
    }
  }

  function saveRoomToHistory(roomId: string, titleName: string) {
    const history = JSON.parse(localStorage.getItem('tt-my-rooms') || '[]')
    if (!history.some((r: any) => r.roomId === roomId)) {
      history.unshift({ roomId, title: titleName, createdAt: new Date().toISOString() })
      localStorage.setItem('tt-my-rooms', JSON.stringify(history.slice(0, 50)))
    }
  }

  function createRoom(tierListName: string, user: string, avatar = '', isGuest = true): Promise<RoomResponse> {
    const { socket, connect } = useSocket()
    connect()
    bindEvents()
    localStorage.setItem('tt-guest-name', user)

    return new Promise((resolve) => {
      socket.value!.emit('room:create', { username: user, tierListName, avatar, isGuest }, (res: RoomResponse) => {
        if (res.success && res.roomId) {
          saveRoomToHistory(res.roomId, tierListName)
        }
        resolve(res)
      })
    })
  }

  function joinRoom(roomId: string, user: string, avatar = '', isGuest = true): Promise<RoomResponse> {
    const { socket, connect } = useSocket()
    connect()
    bindEvents()
    localStorage.setItem('tt-guest-name', user)

    return new Promise((resolve) => {
      socket.value!.emit('room:join', { username: user, roomId, avatar, isGuest }, resolve)
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
    title.value = 'Meilleurs personnages Anime'
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
    isLocked.value = false
    isFocusMode.value = false
    isVoteMode.value = false
    currentVoteItem.value = null
    voteResults.value = {}
    votedCount.value = 0
    totalVoters.value = 0
    hasVoted.value = false
    voteWinner.value = null
    // Clear countdown timer
    if (voteTimerInterval) {
      clearInterval(voteTimerInterval)
      voteTimerInterval = null
    }
    voteTimeLeft.value = 0
    boundSocket = null
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
    isHost,
    isLocked,
    isFocusMode,
    isVoteMode,
    currentVoteItem,
    voteResults,
    votedCount,
    totalVoters,
    hasVoted,
    voteWinner,
    voteTimeLeft,
    currentFocusItem,
    moveItem,
    emitMove,
    resetRoom,
    toggleLock,
    toggleFocusMode,
    toggleVoteMode,
    castVote,
    skipCurrentItem,
    loadTierList,
    initDemo,
    // Drag tracking
    handleDragAdded,
    handleDragRemoved,
    // Row management
    updateRow,
    deleteRow,
    reorderRow,
    addRow,
    // Events
    bindEvents,
    // History
    saveRoomToHistory,
  }
})
