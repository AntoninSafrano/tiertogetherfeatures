<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSocket } from '@/composables/useSocket'
import { useRoomStore } from '@/stores/room'
import { useAuth } from '@/composables/useAuth'
import { User, Type, Hash, Crown, Terminal } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useRoomStore()
const { isConnected, connect } = useSocket()
const { user, fetchUser } = useAuth()

const usernameInput = ref('')
const tierListName = ref('')
const roomIdInput = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)
const mode = ref<'create' | 'join'>(route.query.mode === 'join' ? 'join' : 'create')

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
  targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
  targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2
}

function animateParallax() {
  mouseX.value += (targetX - mouseX.value) * 0.08
  mouseY.value += (targetY - mouseY.value) * 0.08
  rafId = requestAnimationFrame(animateParallax)
}

connect()

onMounted(async () => {
  rafId = requestAnimationFrame(animateParallax)

  // Fetch user and pre-fill display name
  await fetchUser()
  if (user.value) {
    usernameInput.value = user.value.displayName
  }

  setTimeout(() => { step.value = 1 }, 100)
  setTimeout(() => { step.value = 2 }, 400)
  setTimeout(() => { step.value = 3 }, 700)
  setTimeout(() => { step.value = 4 }, 1000)
  setTimeout(() => { step.value = 5 }, 1300)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
})

async function createRoom() {
  if (!usernameInput.value.trim() || !tierListName.value.trim()) {
    error.value = 'Veuillez remplir tous les champs'
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
    error.value = res.error ?? 'Échec de la création'
  }
}

async function joinRoom() {
  if (!usernameInput.value.trim() || !roomIdInput.value.trim()) {
    error.value = 'Veuillez entrer votre nom et le code de la room'
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
    error.value = res.error ?? 'Échec de la connexion'
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
    <!-- Top bar -->
    <div class="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
      <router-link to="/" class="flex items-center gap-2 group">
        <Crown class="h-5 w-5 text-primary transition-transform group-hover:rotate-12" :stroke-width="2.5" />
        <span class="text-lg font-bold tracking-tight text-foreground">TierTogether</span>
      </router-link>
      <div class="flex items-center gap-2">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span class="font-mono text-xs text-foreground-subtle">EN LIGNE</span>
      </div>
    </div>

    <!-- Main content -->
    <main class="flex flex-1 items-center justify-center px-4 py-6 sm:py-12">
      <div class="relative z-10 w-full max-w-lg">
        <!-- Lobby Card -->
        <div
          class="rounded-2xl border border-border-hover bg-surface/50 p-5 sm:p-8 shadow-2xl shadow-black/50 transition-all duration-700 ease-out"
          :class="step >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'"
        >
          <!-- Tabs -->
          <div
            class="mb-6 flex gap-1 border-b border-border pb-px transition-all duration-500 ease-out"
            :class="step >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
          >
            <button
              :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', mode === 'create' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']"
              @click="mode = 'create'; error = null"
            >
              Cr&eacute;er
            </button>
            <button
              :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', mode === 'join' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']"
              @click="mode = 'join'; error = null"
            >
              Rejoindre
            </button>
          </div>

          <!-- Error -->
          <div v-if="error" class="mb-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {{ error }}
          </div>

          <!-- Display Name -->
          <div
            class="mb-5 transition-all duration-500 ease-out"
            :class="step >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
          >
            <label for="username" class="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-wider text-foreground-muted uppercase">
              <Terminal class="h-3 w-3" />
              Pseudo
            </label>
            <div class="relative">
              <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
              <input
                id="username"
                v-model="usernameInput"
                type="text"
                placeholder="Votre pseudo"
                maxlength="20"
                class="home-input w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
              />
            </div>
          </div>

          <!-- Create mode: Room name -->
          <div
            v-if="mode === 'create'"
            class="space-y-4 transition-all duration-500 ease-out"
            :class="step >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
          >
            <div>
              <label class="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-wider text-foreground-muted uppercase">
                <Type class="h-3 w-3" />
                Nom de la Room
              </label>
              <div class="relative">
                <Type class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                <input
                  v-model="tierListName"
                  type="text"
                  placeholder="Ma Tier List"
                  maxlength="100"
                  class="home-input w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                />
              </div>
            </div>
            <button
              :disabled="!isConnected || isLoading"
              class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              @click="createRoom"
            >
              {{ isLoading ? 'Cr\u00e9ation...' : 'Cr\u00e9er la Room' }}
            </button>
          </div>

          <!-- Join mode: Room code -->
          <div
            v-else
            class="space-y-4 transition-all duration-500 ease-out"
            :class="step >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
          >
            <div>
              <label class="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-wider text-foreground-muted uppercase">
                <Hash class="h-3 w-3" />
                Code de la Room
              </label>
              <div class="relative">
                <Hash class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
                <input
                  v-model="roomIdInput"
                  type="text"
                  placeholder="Entrez le code"
                  maxlength="50"
                  class="home-input w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                />
              </div>
            </div>
            <button
              :disabled="!isConnected || isLoading"
              class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all duration-300 ease-out hover:scale-[1.03] hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              @click="joinRoom"
            >
              {{ isLoading ? 'Connexion...' : 'Rejoindre la Room' }}
            </button>
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
            Mode Solo (Hors ligne)
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
        <span>Construit avec Vue & Socket.io</span>
        <span>&copy; {{ new Date().getFullYear() }} TierTogether</span>
      </div>
    </footer>
  </div>
</template>
