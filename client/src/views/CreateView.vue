<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSocket } from '@/composables/useSocket'
import { useRoomStore } from '@/stores/room'
import { useAuth } from '@/composables/useAuth'
import NavBar from '@/components/NavBar.vue'
import ErrorPopup from '@/components/ErrorPopup.vue'
import { Plus, Users, LogIn, Gamepad2 } from 'lucide-vue-next'

const router = useRouter()
const { t } = useI18n()
const store = useRoomStore()
const { isConnected, connect } = useSocket()
const { user, fetchUser } = useAuth()

const usernameInput = ref('')
const tierListName = ref('')
const roomIdInput = ref('')
const createError = ref('')
const joinError = ref('')
const errorPopup = ref<{ title: string; description: string; retry?: () => void } | null>(null)
const isLoading = ref(false)

connect()

onMounted(async () => {
  await fetchUser()
  if (user.value) {
    usernameInput.value = user.value.displayName
  }
})

async function createRoom() {
  createError.value = ''
  if (!user.value && !usernameInput.value.trim()) {
    createError.value = t('create.nameRequired')
    return
  }
  if (!tierListName.value.trim()) {
    createError.value = t('create.roomNameRequired')
    return
  }
  isLoading.value = true
  store.username = usernameInput.value.trim()
  localStorage.setItem('tt-guest-name', store.username)
  const res = await store.createRoom(tierListName.value.trim(), store.username)
  isLoading.value = false
  if (res.success && res.roomId) {
    router.push({ name: 'room', params: { id: res.roomId } })
  } else {
    errorPopup.value = {
      title: t('create.createFailedTitle'),
      description: t('create.createFailedDesc'),
      retry: createRoom,
    }
  }
}

async function joinRoom() {
  joinError.value = ''
  if (!user.value && !usernameInput.value.trim()) {
    joinError.value = t('create.nameRequired')
    return
  }
  if (!roomIdInput.value.trim()) {
    joinError.value = t('create.codeRequired')
    return
  }
  isLoading.value = true
  store.username = usernameInput.value.trim()
  const res = await store.joinRoom(roomIdInput.value.trim(), store.username)
  isLoading.value = false
  if (res.success && res.roomId) {
    router.push({ name: 'room', params: { id: res.roomId } })
  } else {
    const isNotFound = res.error === 'Room introuvable'
    errorPopup.value = {
      title: isNotFound ? t('create.notFoundTitle') : t('create.joinFailedTitle'),
      description: isNotFound ? t('create.notFoundDesc') : t('create.joinFailedDesc'),
      retry: joinRoom,
    }
  }
}

function trySolo() {
  router.push({ name: 'room', params: { id: 'solo' } })
}
</script>

<template>
  <div class="relative min-h-screen bg-background overflow-hidden">
    <NavBar />

    <!-- Floating tier badges (decorative) -->
    <div class="absolute left-[8%] top-[22%] w-[52px] h-[52px] rounded-xl bg-tier-s flex items-center justify-center rotate-12 opacity-15 pointer-events-none">
      <span class="text-[28px] font-bold text-black">S</span>
    </div>
    <div class="absolute right-[8%] top-[28%] w-[44px] h-[44px] rounded-[10px] bg-tier-a flex items-center justify-center -rotate-[8deg] opacity-12 pointer-events-none">
      <span class="text-2xl font-bold text-black">A</span>
    </div>
    <div class="absolute left-[10%] bottom-[20%] w-[40px] h-[40px] rounded-[10px] bg-tier-b flex items-center justify-center -rotate-[15deg] opacity-10 pointer-events-none">
      <span class="text-[22px] font-bold text-black">B</span>
    </div>
    <div class="absolute right-[10%] bottom-[25%] w-[36px] h-[36px] rounded-lg bg-tier-e flex items-center justify-center rotate-[20deg] opacity-10 pointer-events-none">
      <span class="text-xl font-bold text-black">D</span>
    </div>

    <!-- Hero -->
    <main class="relative z-10 flex flex-col items-center justify-center px-4 pt-6 sm:pt-10">
      <div class="flex flex-col items-center gap-6 max-w-4xl">
        <!-- Top section -->
        <div class="flex flex-col items-center gap-3">
          <!-- Hero title -->
          <h1 class="text-3xl sm:text-5xl font-bold text-center text-foreground leading-[1.1] tracking-tight">
            {{ $t('create.heroTitle') }}
          </h1>

          <!-- Subtitle -->
          <p class="text-foreground-muted text-sm sm:text-base text-center max-w-lg leading-relaxed">
            {{ $t('create.heroSubtitle') }}
          </p>
        </div>

        <!-- Error Popup -->
        <ErrorPopup
          v-if="errorPopup"
          :title="errorPopup.title"
          :description="errorPopup.description"
          :retry-label="errorPopup.retry ? $t('common.retry') : undefined"
          @close="errorPopup = null"
          @retry="errorPopup.retry?.()"
        />

        <!-- Username input (shared) -->
        <div class="w-full max-w-[704px]" v-if="!user">
          <input
            v-model="usernameInput"
            type="text"
            :placeholder="$t('create.usernamePlaceholder')"
            maxlength="20"
            class="w-full rounded-lg border border-border bg-background h-11 px-4 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <!-- Action Cards -->
        <div class="flex flex-col sm:flex-row gap-5 w-full max-w-[704px]">
          <!-- Create Card -->
          <div class="flex-1 rounded-2xl border border-border bg-surface p-6 flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                <Plus class="h-5 w-5 text-primary" />
              </div>
              <h2 class="text-lg font-bold text-foreground">{{ $t('create.createCard') }}</h2>
            </div>
            <input
              v-model="tierListName"
              type="text"
              :placeholder="$t('create.roomNamePlaceholder')"
              maxlength="100"
              class="w-full rounded-lg border border-border bg-background h-11 px-3.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              :disabled="!isConnected || isLoading"
              class="w-full h-11 rounded-lg bg-primary flex items-center justify-center gap-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="createRoom"
            >
              <Plus class="h-4 w-4" />
              {{ isLoading ? $t('create.creating') : $t('create.createBtn') }}
            </button>
            <p v-if="createError" class="text-xs text-destructive">{{ createError }}</p>
          </div>

          <!-- Join Card -->
          <div class="flex-1 rounded-2xl border border-border bg-surface p-6 flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Users class="h-5 w-5 text-success" />
              </div>
              <h2 class="text-lg font-bold text-foreground">{{ $t('create.joinCard') }}</h2>
            </div>
            <input
              v-model="roomIdInput"
              type="text"
              :placeholder="$t('create.roomCodePlaceholder')"
              maxlength="50"
              class="w-full rounded-lg border border-border bg-background h-11 px-3.5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <button
              :disabled="!isConnected || isLoading"
              class="w-full h-11 rounded-lg bg-success flex items-center justify-center gap-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="joinRoom"
            >
              <LogIn class="h-4 w-4" />
              {{ isLoading ? $t('create.joining') : $t('create.joinBtn') }}
            </button>
            <p v-if="joinError" class="text-xs text-destructive">{{ joinError }}</p>
          </div>
        </div>

        <!-- Bottom row -->
        <div class="flex items-center gap-8 text-sm">
          <button class="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors" @click="trySolo">
            <Gamepad2 class="h-4 w-4" />
            {{ $t('create.solo') }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
