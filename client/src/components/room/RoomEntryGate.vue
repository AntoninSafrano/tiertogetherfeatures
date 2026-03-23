<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { Crown, UserCircle, LogIn } from 'lucide-vue-next'

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
  }
})

function continueAsGuest() {
  const name = guestName.value.trim()
  if (name.length < 2) {
    guestError.value = 'Le pseudo doit contenir au moins 2 caractères'
    return
  }
  guestError.value = ''
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
  <div v-else class="noise-bg flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-md">
      <div class="rounded-2xl border border-border-hover bg-surface/50 p-5 sm:p-8 shadow-2xl shadow-black/50">
        <!-- Header -->
        <div class="mb-2 flex items-center gap-3">
          <Crown class="h-6 w-6 text-primary" :stroke-width="2.5" />
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Rejoindre la Room
          </h1>
          <span class="ml-auto rounded border border-border-hover bg-surface-hover px-2 py-0.5 font-mono text-xs text-foreground-muted">
            {{ roomId }}
          </span>
        </div>

        <p class="mb-6 text-sm text-foreground-muted">
          Choisissez comment rejoindre cette session.
        </p>

        <!-- Separator -->
        <div class="mb-6 flex items-center gap-2">
          <div class="h-px flex-1 border-b border-dashed border-border-hover" />
          <span class="text-[8px] text-foreground-subtle">&bull;</span>
          <div class="h-px flex-1 border-b border-dashed border-border-hover" />
        </div>

        <!-- Google Sign In -->
        <button
          class="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border-hover bg-surface-hover px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-surface-active hover:border-border-hover"
          @click="signInWithGoogle"
        >
          <LogIn class="h-4 w-4" />
          Se connecter avec Google
        </button>

        <!-- Or separator -->
        <div class="mb-4 flex items-center gap-3">
          <div class="h-px flex-1 bg-border-hover" />
          <span class="text-xs text-foreground-subtle">ou</span>
          <div class="h-px flex-1 bg-border-hover" />
        </div>

        <!-- Guest Name -->
        <div class="space-y-3">
          <div class="relative">
            <UserCircle class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <input
              v-model="guestName"
              type="text"
              placeholder="Pseudo invité"
              maxlength="20"
              class="w-full rounded-lg border border-border bg-surface-hover/80 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle transition-all duration-300 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              @keyup.enter="continueAsGuest"
            />
          </div>

          <p v-if="guestError" class="text-xs text-red-400">{{ guestError }}</p>

          <button
            class="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 transition-all duration-300 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!guestName.trim()"
            @click="continueAsGuest"
          >
            Continuer en tant qu'invité
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
