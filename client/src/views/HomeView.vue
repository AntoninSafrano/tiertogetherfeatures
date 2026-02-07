<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket } from '@/composables/useSocket'
import { useRoomStore } from '@/stores/room'
import { User, Type, Hash, Github, Layers, LogIn } from 'lucide-vue-next'

const router = useRouter()
const store = useRoomStore()
const { isConnected, connect } = useSocket()

const usernameInput = ref('')
const tierListName = ref('')
const roomIdInput = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)
const mounted = ref(false)

// Connect on mount
connect()

onMounted(() => {
  // Trigger entry animations after mount
  requestAnimationFrame(() => {
    mounted.value = true
  })
})

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
  <div class="flex min-h-screen flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-4">
      <span class="text-lg font-bold tracking-tight text-foreground">
        Tier<span class="text-primary">Together</span>
      </span>
      <a
        href="https://github.com/AntoninSafrano/TierTogether"
        target="_blank"
        rel="noopener noreferrer"
        class="text-foreground-subtle transition-colors hover:text-foreground"
      >
        <Github class="h-5 w-5" />
      </a>
    </header>

    <!-- Main content -->
    <main class="flex flex-1 items-center justify-center px-4 pb-16">
      <div class="w-full max-w-2xl space-y-12">
        <!-- Hero -->
        <div
          class="text-center transition-all duration-700 ease-out"
          :class="mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
        >
          <h1 class="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Rank Everything.
            <br />
            <span class="bg-gradient-to-r from-primary via-purple-400 to-purple-600 bg-clip-text text-transparent">Together.</span>
          </h1>
          <p class="mx-auto mt-5 max-w-md text-lg text-foreground-muted">
            The real-time collaborative tier list maker for streamers and friends. No signup required.
          </p>
        </div>

        <!-- Error -->
        <div v-if="error" class="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
          {{ error }}
        </div>

        <!-- Username (shared) -->
        <div
          class="mx-auto max-w-sm transition-all delay-100 duration-700 ease-out"
          :class="mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
        >
          <label for="username" class="mb-1.5 block text-center text-sm font-medium text-foreground-muted">
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
              class="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-center text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <!-- Cards with glow -->
        <div
          class="relative transition-all delay-200 duration-700 ease-out"
          :class="mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
        >
          <!-- Spotlight glow -->
          <div class="pointer-events-none absolute -inset-8 -z-10">
            <div class="absolute inset-0 m-auto h-64 w-96 rounded-full bg-primary/15 blur-3xl" />
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Create Room Card -->
            <div class="glass rounded-xl p-6 space-y-4">
              <div class="flex items-center gap-2">
                <Layers class="h-5 w-5 text-primary" />
                <h2 class="text-base font-bold text-foreground">Create a Room</h2>
              </div>

              <div class="relative">
                <Type class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                <input
                  v-model="tierListName"
                  type="text"
                  placeholder="Tier list name"
                  maxlength="100"
                  class="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            <div class="glass rounded-xl p-6 space-y-4">
              <div class="flex items-center gap-2">
                <LogIn class="h-5 w-5 text-primary" />
                <h2 class="text-base font-bold text-foreground">Join a Room</h2>
              </div>

              <div class="relative">
                <Hash class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                <input
                  v-model="roomIdInput"
                  type="text"
                  placeholder="Room code"
                  maxlength="50"
                  class="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
        </div>

        <!-- Demo -->
        <div
          class="text-center transition-all delay-300 duration-700 ease-out"
          :class="mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
        >
          <button
            class="text-sm font-medium text-foreground-subtle transition-colors hover:text-foreground"
            @click="tryDemo"
          >
            or try the demo (offline)
          </button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/5 px-6 py-4">
      <div class="flex items-center justify-between text-xs text-foreground-subtle">
        <span>Built with Vue & Socket.io</span>
        <span>&copy; {{ new Date().getFullYear() }} TierTogether</span>
      </div>
    </footer>
  </div>
</template>
