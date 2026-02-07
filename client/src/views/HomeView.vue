<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket } from '@/composables/useSocket'
import { useRoomStore } from '@/stores/room'
import { User, Type, Hash } from 'lucide-vue-next'

const router = useRouter()
const store = useRoomStore()
const { isConnected, connect } = useSocket()

const usernameInput = ref('')
const tierListName = ref('')
const roomIdInput = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)

// Connect on mount
connect()

async function createRoom() {
  if (!usernameInput.value.trim() || !tierListName.value.trim()) {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  error.value = null
  store.username = usernameInput.value.trim()

  const res = await store.createRoom(tierListName.value.trim(), store.username)

  isLoading.value = false
  if (res.success && res.roomId) {
    router.push({ name: 'room', params: { id: res.roomId } })
  } else {
    error.value = res.error ?? 'Failed to create room'
  }
}

async function joinRoom() {
  if (!usernameInput.value.trim() || !roomIdInput.value.trim()) {
    error.value = 'Please enter your name and room code'
    return
  }

  isLoading.value = true
  error.value = null
  store.username = usernameInput.value.trim()

  const res = await store.joinRoom(roomIdInput.value.trim(), store.username)

  isLoading.value = false
  if (res.success && res.roomId) {
    router.push({ name: 'room', params: { id: res.roomId } })
  } else {
    error.value = res.error ?? 'Failed to join room'
  }
}

function tryDemo() {
  router.push({ name: 'room', params: { id: 'demo' } })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-lg space-y-8">
      <!-- Connection indicator -->
      <div class="flex items-center justify-end gap-2 text-xs text-foreground-subtle">
        <span
          class="h-1.5 w-1.5 rounded-full"
          :class="isConnected ? 'bg-success' : 'bg-destructive'"
        />
        {{ isConnected ? 'Connected' : 'Connecting...' }}
      </div>

      <!-- Hero -->
      <div class="text-center">
        <h1 class="text-5xl font-extrabold tracking-tight text-foreground">
          Tier<span class="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Together</span>
        </h1>
        <p class="mt-3 text-lg text-foreground-muted">
          Rank everything. Together.
        </p>
      </div>

      <!-- Error -->
      <div v-if="error" class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
        {{ error }}
      </div>

      <!-- Username -->
      <div>
        <label for="username" class="mb-1.5 block text-sm font-medium text-foreground-muted">
          Your name
        </label>
        <div class="relative">
          <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
          <input
            id="username"
            v-model="usernameInput"
            type="text"
            placeholder="Enter your name"
            maxlength="20"
            class="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <!-- Cards Grid -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Create Room Card -->
        <div class="glass rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <h2 class="text-base font-bold text-foreground">Create</h2>
          </div>

          <div class="relative">
            <Type class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <input
              v-model="tierListName"
              type="text"
              placeholder="Tier list name"
              maxlength="100"
              class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            :disabled="!isConnected || isLoading"
            class="w-full rounded-lg bg-gradient-to-r from-primary to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            @click="createRoom"
          >
            {{ isLoading ? 'Creating...' : 'Create Room' }}
          </button>
        </div>

        <!-- Join Room Card -->
        <div class="glass rounded-xl p-5 space-y-4">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <h2 class="text-base font-bold text-foreground">Join</h2>
          </div>

          <div class="relative">
            <Hash class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <input
              v-model="roomIdInput"
              type="text"
              placeholder="Room code"
              maxlength="50"
              class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            :disabled="!isConnected || isLoading"
            class="w-full rounded-lg border border-primary bg-transparent px-4 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            @click="joinRoom"
          >
            {{ isLoading ? 'Joining...' : 'Join Room' }}
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <div class="h-px flex-1 bg-white/5" />
        <span class="text-xs text-foreground-subtle">OR</span>
        <div class="h-px flex-1 bg-white/5" />
      </div>

      <!-- Demo -->
      <button
        class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-foreground-muted transition-all duration-200 hover:bg-white/[0.06] hover:text-foreground"
        @click="tryDemo"
      >
        Try Demo (offline)
      </button>
    </div>
  </div>
</template>
