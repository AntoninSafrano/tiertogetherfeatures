<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSocket } from '@/composables/useSocket'
import { useRoomStore } from '@/stores/room'
import { User, Type, Hash, Crown, Terminal, SlidersHorizontal } from 'lucide-vue-next'

const router = useRouter()
const store = useRoomStore()
const { isConnected, connect } = useSocket()

const usernameInput = ref('')
const tierListName = ref('')
const roomIdInput = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)

// Boot-up sequence steps
const step = ref(0)

// Parallax
const parallaxRef = ref<HTMLElement | null>(null)
const mouseX = ref(0)
const mouseY = ref(0)
let rafId = 0
let targetX = 0
let targetY = 0

function onMouseMove(e: MouseEvent) {
  const el = parallaxRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  // Normalize to -1..1 from center
  targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
  targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2
}

function animateParallax() {
  // Lerp for smoothness
  mouseX.value += (targetX - mouseX.value) * 0.08
  mouseY.value += (targetY - mouseY.value) * 0.08
  rafId = requestAnimationFrame(animateParallax)
}

connect()

onMounted(() => {
  // Start parallax loop
  rafId = requestAnimationFrame(animateParallax)

  // Staggered entrance sequence
  setTimeout(() => { step.value = 1 }, 100)   // Card shell
  setTimeout(() => { step.value = 2 }, 400)   // Logo + subtitle
  setTimeout(() => { step.value = 3 }, 700)   // Display Name
  setTimeout(() => { step.value = 4 }, 1000)  // Session Config
  setTimeout(() => { step.value = 5 }, 1300)  // Below card
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
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
  <div
    ref="parallaxRef"
    class="noise-bg flex min-h-screen flex-col bg-background"
    :style="{
      '--px': `${mouseX * -12}px`,
      '--py': `${mouseY * -12}px`,
    } as any"
    @mousemove="onMouseMove"
  >
    <!-- System Status Badge -->
    <div class="fixed top-4 right-4 z-20 flex items-center gap-2">
      <span class="relative flex h-2 w-2">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span class="font-mono text-xs text-foreground-subtle">SYSTEM ONLINE</span>
    </div>

    <!-- Main content -->
    <main class="flex flex-1 items-center justify-center px-4 py-6 sm:py-12">
      <div class="relative z-10 w-full max-w-lg">
        <!-- Lobby Card -->
        <div
          class="rounded-2xl border border-border-hover bg-surface/50 p-5 sm:p-8 shadow-2xl shadow-black/50 transition-all duration-700 ease-out"
          :class="step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
        >
          <!-- Header -->
          <div
            class="mb-2 flex items-center gap-3 transition-all duration-500 ease-out"
            :class="step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
          >
            <Crown class="h-6 w-6 text-primary" :stroke-width="2.5" />
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              TierTogether
            </h1>
            <span class="border border-primary/40 bg-primary/5 px-1.5 py-px font-mono text-[9px] font-bold tracking-widest text-primary/80 uppercase">
              Beta
            </span>
          </div>

          <!-- Subtitle -->
          <p
            class="mb-6 text-sm text-foreground-muted transition-all duration-500 ease-out"
            :class="step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
          >
            Instant Multiplayer Ranking.
          </p>

          <!-- Separator -->
          <div class="mb-6 flex items-center gap-2">
            <div class="h-px flex-1 border-b border-dashed border-border-hover" />
            <span class="text-[8px] text-foreground-subtle">&bull;</span>
            <div class="h-px flex-1 border-b border-dashed border-border-hover" />
          </div>

          <!-- Error -->
          <div v-if="error" class="mb-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {{ error }}
          </div>

          <!-- Display Name -->
          <div
            class="mb-6 transition-all duration-500 ease-out"
            :class="step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
          >
            <label for="username" class="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-wider text-foreground-muted uppercase">
              <Terminal class="h-3 w-3" />
              Display Name
            </label>
            <div class="relative">
              <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
              <input
                id="username"
                v-model="usernameInput"
                type="text"
                placeholder="Your name"
                maxlength="20"
                class="home-input w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
              />
            </div>
          </div>

          <!-- Separator -->
          <div class="mb-6 flex items-center gap-2">
            <div class="h-px flex-1 border-b border-dashed border-border-hover" />
            <span class="text-[8px] text-foreground-subtle">&bull;</span>
            <div class="h-px flex-1 border-b border-dashed border-border-hover" />
          </div>

          <!-- Session Config -->
          <div
            class="transition-all duration-500 ease-out"
            :class="step >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
          >
            <p class="mb-4 flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-wider text-foreground-muted uppercase">
              <SlidersHorizontal class="h-3 w-3" />
              Session Config
            </p>

            <!-- Create / Join Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Create -->
              <div class="space-y-3">
                <div class="relative">
                  <Type class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                  <input
                    v-model="tierListName"
                    type="text"
                    placeholder="Room name"
                    maxlength="100"
                    class="home-input w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                  />
                </div>
                <button
                  :disabled="!isConnected || isLoading"
                  class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  @click="createRoom"
                >
                  {{ isLoading ? 'Creating...' : 'Create' }}
                </button>
              </div>

              <!-- Join -->
              <div class="space-y-3">
                <div class="relative">
                  <Hash class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                  <input
                    v-model="roomIdInput"
                    type="text"
                    placeholder="Room code"
                    maxlength="50"
                    class="home-input w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                  />
                </div>
                <button
                  :disabled="!isConnected || isLoading"
                  class="w-full rounded-lg border border-border-hover bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 ease-out hover:scale-[1.03] hover:border-foreground hover:bg-surface-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  @click="joinRoom"
                >
                  {{ isLoading ? 'Joining...' : 'Join' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Below card -->
        <div
          class="mt-6 flex items-center justify-between transition-all duration-500 ease-out"
          :class="step >= 5 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
        >
          <button
            class="text-sm text-foreground-muted transition-colors hover:text-foreground hover:underline"
            @click="tryDemo"
          >
            Solo Mode (Offline)
          </button>
          <span class="flex items-center gap-1.5 font-mono text-[10px] text-foreground-subtle">
            <span class="h-1.5 w-1.5 rounded-full" :class="isConnected ? 'bg-emerald-500' : 'bg-foreground-subtle'" />
            v1.0.0
          </span>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 px-6 py-4">
      <div class="flex items-center justify-between text-xs text-foreground-subtle">
        <span>Built with Vue & Socket.io</span>
        <span>&copy; {{ new Date().getFullYear() }} TierTogether</span>
      </div>
    </footer>
  </div>
</template>
