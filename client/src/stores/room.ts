import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Room, RoomUser, TierList } from '@tiertogether/shared'

export const useRoomStore = defineStore('room', () => {
  const currentRoom = ref<Room | null>(null)
  const isInRoom = computed(() => currentRoom.value !== null)
  const users = computed(() => currentRoom.value?.users ?? [])
  const tierList = computed(() => currentRoom.value?.tierList ?? null)

  function setRoom(room: Room) {
    currentRoom.value = room
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
  }

  return {
    currentRoom,
    isInRoom,
    users,
    tierList,
    setRoom,
    addUser,
    removeUser,
    clearRoom,
  }
})
