<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket } from '@/composables/useSocket'
import { useRoomStore } from '@/stores/room'
import { User, Type, Hash, Github } from 'lucide-vue-next'

const router = useRouter()
const store = useRoomStore()
const { isConnected, connect } = useSocket()

const usernameInput = ref('')
const tierListName = ref('')
const roomIdInput = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)
const mounted = ref(false)

connect()

onMounted(() => {
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
  <div class="noise-bg flex min-h-screen flex-col bg-zinc-950">
    <!-- Main content -->
    <main class="flex flex-1 items-center justify-center px-4 py-12">
      <div class="relative z-10 w-full max-w-lg">
        <!-- Lobby Card -->
        <div
          class="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 shadow-2xl shadow-black/50 transition-all duration-700 ease-out"
          :class="mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
        >
          <!-- Header -->
          <div class="mb-2 flex items-center gap-3">
            <h1 class="text-2xl font-bold tracking-tight text-white">
              TierTogether
            </h1>
            <span class="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
              Beta
            </span>
          </div>

          <!-- Subtitle -->
          <p class="mb-6 text-sm text-zinc-400">
            Instant Multiplayer Ranking.
          </p>

          <!-- Separator -->
          <div class="mb-6 border-b border-white/5" />

          <!-- Error -->
          <div v-if="error" class="mb-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {{ error }}
          </div>

          <!-- Display Name -->
          <div class="mb-6">
            <label for="username" class="mb-1.5 block font-mono text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
              Display Name
            </label>
            <div class="relative">
              <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                id="username"
                v-model="usernameInput"
                type="text"
                placeholder="Your name"
                maxlength="20"
                class="w-full rounded-lg border border-white/5 bg-zinc-800/80 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-zinc-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <!-- Separator -->
          <div class="mb-6 border-b border-white/5" />

          <!-- Session Config Label -->
          <p class="mb-4 font-mono text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
            Session Config
          </p>

          <!-- Create / Join Grid -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Create -->
            <div class="space-y-3">
              <div class="relative">
                <Type class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <input
                  v-model="tierListName"
                  type="text"
                  placeholder="Room name"
                  maxlength="100"
                  class="w-full rounded-lg border border-white/5 bg-zinc-800/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-zinc-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <button
                :disabled="!isConnected || isLoading"
                class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                @click="createRoom"
              >
                {{ isLoading ? 'Creating...' : 'Create' }}
              </button>
            </div>

            <!-- Join -->
            <div class="space-y-3">
              <div class="relative">
                <Hash class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <input
                  v-model="roomIdInput"
                  type="text"
                  placeholder="Room code"
                  maxlength="50"
                  class="w-full rounded-lg border border-white/5 bg-zinc-800/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-zinc-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <button
                :disabled="!isConnected || isLoading"
                class="w-full rounded-lg border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors duration-150 hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                @click="joinRoom"
              >
                {{ isLoading ? 'Joining...' : 'Join' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Solo Mode (outside the card) -->
        <div
          class="mt-6 text-center transition-all delay-200 duration-700 ease-out"
          :class="mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
        >
          <button
            class="text-sm text-zinc-500 transition-colors hover:text-zinc-300 hover:underline"
            @click="tryDemo"
          >
            Solo Mode (Offline)
          </button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 px-6 py-4">
      <div class="flex items-center justify-between text-xs text-zinc-600">
        <span>Built with Vue & Socket.io</span>
        <div class="flex items-center gap-3">
          <a
            href="https://github.com/AntoninSafrano/TierTogether"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-colors hover:text-zinc-400"
          >
            <Github class="h-3.5 w-3.5" />
          </a>
          <span>&copy; {{ new Date().getFullYear() }} TierTogether</span>
        </div>
      </div>
    </footer>
  </div>
</template>
