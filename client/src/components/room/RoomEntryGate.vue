<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { UserCircle, LogIn } from 'lucide-vue-next'

const props = defineProps<{ roomId: string }>()
const emit = defineEmits<{
  ready: [payload: { username: string; avatar: string; isGuest: boolean }]
}>()

const { user, fetchUser, loginWithGoogle, isLoading: authLoading } = useAuth()

const guestName = ref('')
const guestError = ref('')
const checking = ref(true)

onMounted(async () => {
  await fetchUser()
  checking.value = false

  // Auto-skip if already logged in via Google
  if (user.value) {
    emit('ready', {
      username: user.value.displayName,
      avatar: user.value.avatar,
      isGuest: false,
    })
    return
  }

  // Auto-rejoin if guest name is saved for this room
  const saved = localStorage.getItem('tt-guest-name')
  if (saved) {
    guestName.value = saved
    emit('ready', { username: saved, avatar: '', isGuest: true })
  }
})

function continueAsGuest() {
  const name = guestName.value.trim()
  if (name.length < 2) {
    guestError.value = 'Le pseudo doit contenir au moins 2 caractères'
    return
  }
  guestError.value = ''
  localStorage.setItem('tt-guest-name', name)
  emit('ready', { username: name, avatar: '', isGuest: true })
}

function signInWithGoogle() {
  // Save current room URL so App.vue can redirect back after OAuth
  localStorage.setItem('tt-redirect-after-login', `/room/${props.roomId}`)
  loginWithGoogle()
}
</script>

<template>
  <!-- Loading check -->
  <div v-if="checking || authLoading" class="flex min-h-screen items-center justify-center bg-background">
    <p class="text-sm text-foreground-muted">Vérification de l'identité...</p>
  </div>

  <!-- Gate UI -->
  <div v-else class="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
    <!-- Purple radial glow -->
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="h-[500px] w-[500px] rounded-full bg-primary/15 blur-[150px]" />
    </div>

    <div class="relative z-10 w-full max-w-md">
      <div class="rounded-2xl border border-border-hover bg-surface/80 backdrop-blur-xl p-5 sm:p-8 shadow-2xl shadow-black/60">
        <!-- Header -->
        <div class="mb-1 flex items-center justify-between">
          <h1 class="text-xl font-bold tracking-tight text-foreground">Rejoindre la room</h1>
          <span class="rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono text-xs text-foreground-muted">
            {{ roomId }}
          </span>
        </div>

        <p class="mb-6 text-sm text-foreground-muted">
          Connectez-vous ou entrez un pseudo pour rejoindre.
        </p>

        <!-- Google Sign In -->
        <button
          class="mb-4 flex w-full items-center justify-center gap-2.5 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#0A0A0A] transition-all hover:bg-gray-100"
          @click="signInWithGoogle"
        >
          <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <!-- Or separator -->
        <div class="mb-4 flex items-center gap-4">
          <div class="h-px flex-1 bg-border" />
          <span class="text-xs text-foreground-subtle">or join as guest</span>
          <div class="h-px flex-1 bg-border" />
        </div>

        <!-- Guest Name -->
        <div class="space-y-3">
          <div class="relative">
            <UserCircle class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <input
              v-model="guestName"
              type="text"
              placeholder="Guest nickname"
              maxlength="20"
              class="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              @keyup.enter="continueAsGuest"
            />
          </div>

          <p v-if="guestError" class="text-xs text-destructive">{{ guestError }}</p>

          <button
            class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!guestName.trim()"
            @click="continueAsGuest"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
