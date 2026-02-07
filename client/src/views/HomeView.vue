<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket } from '@/composables/useSocket'
import type { RoomResponse } from '@tiertogether/shared'

const router = useRouter()
const { socket, isConnected, connect } = useSocket()

const username = ref('')
const tierListName = ref('')
const roomIdInput = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)

// Connect on mount
connect()

function tryDemo() {
  router.push({ name: 'room', params: { id: 'demo' } })
}

function createRoom() {
  if (!socket.value || !isConnected.value) return
  if (!username.value.trim() || !tierListName.value.trim()) {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  error.value = null

  socket.value.emit(
    'room:create',
    { username: username.value, tierListName: tierListName.value },
    (res: RoomResponse) => {
      isLoading.value = false
      if (res.success && res.roomId) {
        router.push({ name: 'room', params: { id: res.roomId } })
      } else {
        error.value = res.error ?? 'Failed to create room'
      }
    },
  )
}

function joinRoom() {
  if (!socket.value || !isConnected.value) return
  if (!username.value.trim() || !roomIdInput.value.trim()) {
    error.value = 'Please enter your name and room code'
    return
  }

  isLoading.value = true
  error.value = null

  socket.value.emit(
    'room:join',
    { username: username.value, roomId: roomIdInput.value },
    (res: RoomResponse) => {
      isLoading.value = false
      if (res.success && res.roomId) {
        router.push({ name: 'room', params: { id: res.roomId } })
      } else {
        error.value = res.error ?? 'Failed to join room'
      }
    },
  )
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <div class="w-full max-w-md space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold tracking-tight text-foreground">
          Tier<span class="text-primary">Together</span>
        </h1>
        <p class="mt-2 text-foreground-muted">
          Create and rank tier lists together in real time
        </p>
      </div>

      <!-- Connection status -->
      <div class="flex items-center justify-center gap-2 text-sm">
        <span
          class="h-2 w-2 rounded-full"
          :class="isConnected ? 'bg-success' : 'bg-destructive'"
        />
        <span class="text-foreground-subtle">
          {{ isConnected ? 'Connected' : 'Connecting...' }}
        </span>
      </div>

      <!-- Error -->
      <div v-if="error" class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        {{ error }}
      </div>

      <!-- Username -->
      <div>
        <label for="username" class="mb-1 block text-sm font-medium text-foreground-muted">
          Your name
        </label>
        <input
          id="username"
          v-model="username"
          type="text"
          placeholder="Enter your name"
          maxlength="20"
          class="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <!-- Create Room -->
      <div class="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 class="text-lg font-semibold text-foreground">Create a Room</h2>
        <input
          v-model="tierListName"
          type="text"
          placeholder="Tier list name (e.g. Best Anime)"
          maxlength="100"
          class="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          :disabled="!isConnected || isLoading"
          class="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          @click="createRoom"
        >
          {{ isLoading ? 'Creating...' : 'Create Room' }}
        </button>
      </div>

      <!-- Join Room -->
      <div class="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 class="text-lg font-semibold text-foreground">Join a Room</h2>
        <input
          v-model="roomIdInput"
          type="text"
          placeholder="Room code (e.g. A1B2C3)"
          maxlength="50"
          class="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          :disabled="!isConnected || isLoading"
          class="w-full rounded-md border border-primary bg-transparent px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          @click="joinRoom"
        >
          {{ isLoading ? 'Joining...' : 'Join Room' }}
        </button>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <div class="h-px flex-1 bg-border" />
        <span class="text-xs text-foreground-subtle">OR</span>
        <div class="h-px flex-1 bg-border" />
      </div>

      <!-- Demo -->
      <button
        class="w-full rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        @click="tryDemo"
      >
        Try Demo (offline)
      </button>
    </div>
  </div>
</template>
