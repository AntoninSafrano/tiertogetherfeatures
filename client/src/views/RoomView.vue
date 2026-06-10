<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRoomStore } from '@/stores/room'
import { useSocket } from '@/composables/useSocket'
import { TierBoard } from '@/components/tierlist'
import RoomEntryGate from '@/components/room/RoomEntryGate.vue'
import type { ChatMessage } from '@tiertogether/shared'
import { useAutoScroll } from '@/composables/useAutoScroll'
import { ArrowLeft, Crown, Users, MessageCircle, Send, PanelRightClose, PanelRightOpen, Copy, Check, UserPlus, Share2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const store = useRoomStore()
const { socket } = useSocket()

const roomId = route.params.id as string
const error = ref<string | null>(null)
const isLoading = ref(false)
const isSolo = roomId === 'solo' || roomId === 'demo' // 'demo' kept for old bookmarks
const gateResolved = ref(false)

// Auto-scroll on drag
const boardContainer = ref<HTMLElement | null>(null)
useAutoScroll(boardContainer)

// Side panel
const panelOpen = ref(window.innerWidth >= 640)
const activeTab = ref<'chat' | 'players'>('chat')
const chatInput = ref('')
const chatMessages = ref<ChatMessage[]>([])
const unreadCount = ref(0)
const messagesEnd = ref<HTMLElement | null>(null)

// Invite popover
const showInvite = ref(false)
const linkCopied = ref(false)
const codeCopied = ref(false)
const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

async function copyRoomLink() {
  await navigator.clipboard.writeText(window.location.href)
  linkCopied.value = true
  setTimeout(() => (linkCopied.value = false), 2000)
}

async function copyRoomCode() {
  await navigator.clipboard.writeText(roomId)
  codeCopied.value = true
  setTimeout(() => (codeCopied.value = false), 2000)
}

async function nativeShare() {
  try {
    await navigator.share({
      title: store.title || 'TierTogether',
      text: t('room.shareText', { title: store.title }),
      url: window.location.href,
    })
  } catch { /* user cancelled */ }
}

const sortedUsers = computed(() => {
  const hostId = store.currentRoom?.hostId
  return [...store.users].sort((a, b) => {
    if (a.id === hostId) return -1
    if (b.id === hostId) return 1
    return a.username.localeCompare(b.username)
  })
})

function scrollToBottom() {
  nextTick(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth' }))
}

const blockedError = ref<string | null>(null)

function onChatMessage(msg: ChatMessage) {
  chatMessages.value.push(msg)
  if (!panelOpen.value || activeTab.value !== 'chat') unreadCount.value++
  scrollToBottom()
}

function onSocketError(serverMsg: string) {
  if (typeof serverMsg === 'string' && serverMsg.startsWith('Message bloqué')) {
    blockedError.value = t('room.blockedMessage')
    if (!panelOpen.value || activeTab.value !== 'chat') switchToChat()
    setTimeout(() => { blockedError.value = null }, 4500)
  }
}

// Bound AFTER the store's bindEvents() ran: bindEvents() calls off() on
// chat:message/error when (re)binding a socket, which would silently drop
// listeners registered earlier (e.g. via an immediate watch).
function bindChatListeners() {
  const sock = socket.value
  if (!sock) return
  sock.off('chat:message', onChatMessage)
  sock.off('error', onSocketError)
  sock.on('chat:message', onChatMessage)
  sock.on('error', onSocketError)
}

function sendMessage() {
  const text = chatInput.value.trim()
  if (!text || !socket.value?.connected) return
  socket.value.emit('chat:send', { text })
  chatInput.value = ''
  scrollToBottom()
}

function switchToChat() {
  activeTab.value = 'chat'
  panelOpen.value = true
  unreadCount.value = 0
  scrollToBottom()
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  if (isSolo) {
    store.initSolo()
    gateResolved.value = true
    return
  }

  // If we already joined this room (e.g. after createRoom navigated here), skip gate
  if (store.currentRoom?.id === roomId) {
    gateResolved.value = true
    bindChatListeners()
    return
  }
})

onUnmounted(() => {
  socket.value?.off('chat:message', onChatMessage)
  socket.value?.off('error', onSocketError)
  if (!isSolo) {
    store.clearRoom()
  }
})

async function onGateReady(payload: { username: string; avatar: string; isGuest: boolean }) {
  isLoading.value = true
  error.value = null
  store.username = payload.username

  const res = await store.joinRoom(roomId, payload.username, payload.avatar, payload.isGuest)

  isLoading.value = false

  if (res.success) {
    gateResolved.value = true
    bindChatListeners()
  } else {
    if (res.error === 'Room introuvable') {
      error.value = t('room.notFoundError')
    } else if (res.error) {
      error.value = res.error
    } else {
      error.value = t('room.joinError')
    }
    gateResolved.value = true
  }
}

function goHome() {
  store.clearRoom()
  router.push({ name: 'explore' })
}
</script>

<template>
  <!-- Gate: shown before joining the room -->
  <RoomEntryGate
    v-if="!isSolo && !gateResolved"
    :room-id="roomId"
    @ready="onGateReady"
  />

  <!-- Main Room UI -->
  <div v-else class="flex h-screen flex-col bg-background overflow-hidden">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-border/50 bg-[#0D0D0D] px-4 sm:px-6 h-12 shrink-0">
      <!-- Left: Back + Room info -->
      <div class="flex items-center gap-3">
        <button
          class="flex items-center justify-center h-8 w-8 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          @click="goHome"
        >
          <ArrowLeft class="h-4 w-4" />
        </button>
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-foreground truncate max-w-[110px] sm:max-w-[200px]">{{ store.title || 'Tier List' }}</span>

          <!-- Invite button + popover -->
          <div v-if="!isSolo" class="relative">
            <button
              class="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm shadow-primary/30"
              @click.stop="showInvite = !showInvite"
            >
              <UserPlus class="h-3.5 w-3.5" />
              {{ $t('room.invite') }}
            </button>

            <div
              v-if="showInvite"
              class="absolute left-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border-hover bg-surface p-4 shadow-2xl"
              @click.stop
            >
              <p class="text-sm font-semibold text-foreground mb-1">{{ $t('room.inviteTitle') }}</p>
              <p class="text-[11px] text-foreground-muted mb-3">{{ $t('room.inviteHint') }}</p>

              <!-- Room code -->
              <button
                class="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 mb-2 hover:border-primary/40 transition-colors group"
                :title="$t('room.copyCode')"
                @click="copyRoomCode"
              >
                <div class="text-left">
                  <p class="text-[10px] uppercase tracking-wider text-foreground-subtle">{{ $t('room.roomCode') }}</p>
                  <p class="font-mono text-lg font-bold tracking-[0.2em] text-foreground">{{ roomId }}</p>
                </div>
                <Check v-if="codeCopied" class="h-4 w-4 text-emerald-400" />
                <Copy v-else class="h-4 w-4 text-foreground-subtle group-hover:text-foreground" />
              </button>

              <!-- Link -->
              <button
                class="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
                @click="copyRoomLink"
              >
                <Check v-if="linkCopied" class="h-3.5 w-3.5" />
                <Copy v-else class="h-3.5 w-3.5" />
                {{ linkCopied ? $t('common.linkCopied') : $t('room.copyInviteLink') }}
              </button>

              <button
                v-if="canNativeShare"
                class="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-border-hover px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                @click="nativeShare"
              >
                <Share2 class="h-3.5 w-3.5" />
                {{ $t('room.shareNative') }}
              </button>
            </div>
          </div>
          <!-- Click-away backdrop -->
          <div v-if="showInvite" class="fixed inset-0 z-40" @click="showInvite = false" />
        </div>
        <div v-if="isSolo" class="rounded-full bg-primary/10 px-2.5 py-0.5">
          <span class="text-[11px] font-medium text-primary">{{ $t('room.solo') }}</span>
        </div>
      </div>

      <!-- Right: Toggle panel -->
      <button
        v-if="!isSolo"
        class="flex items-center gap-2 h-8 px-3 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        @click="panelOpen = !panelOpen"
      >
        <span class="text-xs font-medium">{{ $t('room.onlineCount', { n: store.users.length }) }}</span>
        <PanelRightOpen v-if="!panelOpen" class="h-4 w-4" />
        <PanelRightClose v-else class="h-4 w-4" />
      </button>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <p class="text-foreground-muted">{{ $t('room.connecting') }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-1 flex-col items-center justify-center gap-4">
      <p class="text-destructive">{{ error }}</p>
      <button
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        @click="goHome"
      >
        {{ $t('room.backHome') }}
      </button>
    </div>

    <!-- Content: Board + Side panel -->
    <div v-else class="flex flex-1 overflow-hidden relative">
      <!-- Tier Board -->
      <main ref="boardContainer" class="flex-1 overflow-auto p-3 sm:p-6">
        <TierBoard />
      </main>

      <!-- Side Panel (Joueurs / Chat) -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 max-sm:translate-x-full sm:w-0"
        enter-to-class="opacity-100 max-sm:translate-x-0 sm:w-80"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 max-sm:translate-x-0 sm:w-80"
        leave-to-class="opacity-0 max-sm:translate-x-full sm:w-0"
      >
        <aside
          v-if="panelOpen && !isSolo"
          class="w-80 shrink-0 border-l border-border bg-[#0D0D0D] flex flex-col overflow-hidden relative max-sm:w-full max-sm:absolute max-sm:inset-y-0 max-sm:right-0 max-sm:z-30"
        >
          <!-- Tabs -->
          <div class="flex border-b border-border shrink-0">
            <button
              :class="['flex-1 flex items-center justify-center gap-2 h-10 text-xs font-medium transition-colors border-b-2 -mb-px',
                activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']"
              @click="switchToChat"
            >
              <MessageCircle class="h-3.5 w-3.5" />
              {{ $t('room.tabChat') }}
              <span
                v-if="unreadCount > 0 && activeTab !== 'chat'"
                class="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
              >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
              </span>
            </button>
            <button
              :class="['flex-1 flex items-center justify-center gap-2 h-10 text-xs font-medium transition-colors border-b-2 -mb-px',
                activeTab === 'players' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']"
              @click="activeTab = 'players'"
            >
              <Users class="h-3.5 w-3.5" />
              {{ $t('room.tabPlayers') }}
              <span class="text-[10px] opacity-60">{{ store.users.length }}</span>
            </button>
          </div>

          <!-- Chat tab -->
          <template v-if="activeTab === 'chat'">
            <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div v-if="chatMessages.length === 0" class="flex h-full items-center justify-center">
                <p class="text-xs text-foreground-subtle">{{ $t('room.noMessages') }}</p>
              </div>
              <div v-for="msg in chatMessages" :key="msg.id" class="group/msg flex items-start gap-2">
                <img
                  v-if="msg.avatar"
                  :src="msg.avatar"
                  :alt="msg.username"
                  class="w-6 h-6 rounded-full shrink-0 object-cover mt-0.5"
                  referrerpolicy="no-referrer"
                />
                <div
                  v-else
                  class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
                  :style="{ backgroundColor: msg.color }"
                >
                  {{ msg.username.slice(0, 2).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-xs font-semibold" :style="{ color: msg.color }">{{ msg.username }}</span>
                    <span class="text-[10px] text-foreground-subtle">{{ formatTime(msg.timestamp) }}</span>
                  </div>
                  <p class="text-[13px] leading-relaxed text-foreground-muted break-words">{{ msg.text }}</p>
                </div>
              </div>
              <div v-if="blockedError" class="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{{ blockedError }}</div>
              <div ref="messagesEnd" />
            </div>

            <!-- Chat input -->
            <div class="border-t border-border px-3 py-2.5 shrink-0">
              <form class="flex gap-2" @submit.prevent="sendMessage">
                <input
                  v-model="chatInput"
                  type="text"
                  :placeholder="$t('room.messagePlaceholder')"
                  maxlength="500"
                  class="flex-1 rounded-lg border border-border bg-surface h-9 px-3 text-[13px] text-foreground placeholder:text-foreground-subtle focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  :disabled="!chatInput.trim()"
                  class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white transition-colors hover:bg-primary-hover disabled:opacity-30"
                >
                  <Send class="h-4 w-4" />
                </button>
              </form>
            </div>
          </template>

          <!-- Players tab -->
          <template v-if="activeTab === 'players'">
            <div class="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              <div
                v-for="u in sortedUsers"
                :key="u.id"
                class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface/30 transition-colors"
              >
                <div class="relative shrink-0">
                  <img
                    v-if="u.avatar"
                    :src="u.avatar"
                    :alt="u.username"
                    class="h-8 w-8 rounded-full object-cover"
                    referrerpolicy="no-referrer"
                  />
                  <div
                    v-else
                    class="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    :style="{ backgroundColor: u.color }"
                  >
                    {{ u.username.slice(0, 2).toUpperCase() }}
                  </div>
                  <span class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0D0D0D] bg-emerald-500" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <span class="truncate text-sm font-medium text-foreground">{{ u.username }}</span>
                    <Crown v-if="u.id === store.currentRoom?.hostId" class="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                  </div>
                  <span class="text-[10px] text-foreground-subtle">{{ $t('room.online') }}</span>
                </div>
              </div>
            </div>
            <!-- Spacer to match chat input height -->
            <div class="border-t border-border px-3 py-2.5 shrink-0">
              <div class="h-9" />
            </div>
          </template>
        </aside>
      </Transition>
    </div>

  </div>
</template>
