import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Room, RoomUser, TierItem, TierRow, TierList } from '@tiertogether/shared'
import { DEFAULT_TIERS } from '@tiertogether/shared'

export const useRoomStore = defineStore('room', () => {
  // ─── Room State ─────────────────────────────────────────────────
  const currentRoom = ref<Room | null>(null)
  const isInRoom = computed(() => currentRoom.value !== null)
  const users = computed(() => currentRoom.value?.users ?? [])

  // ─── TierList State (local, drives the UI) ─────────────────────
  const title = ref('')
  const rows = ref<TierRow[]>([])
  const pool = ref<TierItem[]>([])

  // ─── TierList Actions ───────────────────────────────────────────

  /**
   * Move an item programmatically between containers.
   * fromContainerId / toContainerId: row id, or null for the pool.
   */
  function moveItem(
    itemId: string,
    fromContainerId: string | null,
    toContainerId: string | null,
    newIndex: number,
  ) {
    // 1. Remove item from source
    let item: TierItem | undefined

    if (fromContainerId === null) {
      const idx = pool.value.findIndex((i) => i.id === itemId)
      if (idx !== -1) item = pool.value.splice(idx, 1)[0]
    } else {
      const row = rows.value.find((r) => r.id === fromContainerId)
      if (row) {
        const idx = row.items.findIndex((i) => i.id === itemId)
        if (idx !== -1) item = row.items.splice(idx, 1)[0]
      }
    }

    if (!item) return

    // 2. Insert item into target
    if (toContainerId === null) {
      pool.value.splice(newIndex, 0, item)
    } else {
      const row = rows.value.find((r) => r.id === toContainerId)
      if (row) {
        row.items.splice(newIndex, 0, item)
      }
    }
  }

  /** Load a full tier list from server data */
  function loadTierList(tierList: TierList) {
    title.value = tierList.title
    rows.value = tierList.rows
    pool.value = tierList.pool
  }

  /** Initialize with demo data for local testing */
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

  // ─── Room Actions ───────────────────────────────────────────────

  function setRoom(room: Room) {
    currentRoom.value = room
    loadTierList(room.tierList)
  }

  function addUser(user: RoomUser) {
    currentRoom.value?.users.push(user)
  }

  function removeUser(userId: string) {
    if (!currentRoom.value) return
    currentRoom.value.users = currentRoom.value.users.filter((u) => u.id !== userId)
  }

  function clearRoom() {
    currentRoom.value = null
    title.value = ''
    rows.value = []
    pool.value = []
  }

  return {
    // Room
    currentRoom,
    isInRoom,
    users,
    setRoom,
    addUser,
    removeUser,
    clearRoom,
    // TierList
    title,
    rows,
    pool,
    moveItem,
    loadTierList,
    initDemo,
  }
})
