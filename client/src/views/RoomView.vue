<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { useSocket } from '@/composables/useSocket'
import { TierBoard } from '@/components/tierlist'
import RoomEntryGate from '@/components/room/RoomEntryGate.vue'
import type { ChatMessage } from '@tiertogether/shared'
import { useAutoScroll } from '@/composables/useAutoScroll'
import { ArrowLeft, Crown, Users, MessageCircle, Send, PanelRightClose, PanelRightOpen, Copy, Check, Flag, X } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { API_BASE } from '@/config'

const route = useRoute()
const router = useRouter()
const store = useRoomStore()
const { socket } = useSocket()
const { user } = useAuth()

const ADMIN_EMAILS = new Set(['antonin.safrano@gmail.com', 'wingsoffeed95@gmail.com'])
const isAdmin = computed(() => !!user.value && ADMIN_EMAILS.has(user.value.email.toLowerCase()))

const roomId = route.params.id as string
const error = ref<string | null>(null)
const isLoading = ref(false)
const isDemo = roomId === 'demo'
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

// Copy link
const linkCopied = ref(false)
async function copyRoomLink() {
  await navigator.clipboard.writeText(window.location.href)
  linkCopied.value = true
  setTimeout(() => linkCopied.value = false, 2000)
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
const reportingId = ref<string | null>(null)
const reportedIds = ref<Set<string>>(new Set())
const reportError = ref<string | null>(null)

// Report modal state
const reportTarget = ref<ChatMessage | null>(null)
const reportReason = ref<'harassment' | 'inappropriate' | 'spam' | 'other'>('inappropriate')
const reportDetails = ref('')

function openReportModal(msg: ChatMessage) {
  reportTarget.value = msg
  reportReason.value = 'inappropriate'
  reportDetails.value = ''
  reportError.value = null
}
function closeReportModal() {
  reportTarget.value = null
}

watch(() => socket.value, (sock) => {
  if (!sock) return
  sock.on('chat:message', (msg: ChatMessage) => {
    chatMessages.value.push(msg)
    if (!panelOpen.value || activeTab.value !== 'chat') unreadCount.value++
    scrollToBottom()
  })
  sock.on('error', (serverMsg: string) => {
    if (typeof serverMsg === 'string' && serverMsg.startsWith('Message bloqué')) {
      blockedError.value = 'Ton message ne respecte pas les règles de la communauté et n\'a pas été envoyé.'
      if (!panelOpen.value || activeTab.value !== 'chat') switchToChat()
      setTimeout(() => { blockedError.value = null }, 4500)
    }
  })
}, { immediate: true })

function sendMessage() {
  const text = chatInput.value.trim()
  if (!text || !socket.value?.connected) return
  socket.value.emit('chat:send', { text })
  chatInput.value = ''
  scrollToBottom()
}

async function submitReport() {
  const msg = reportTarget.value
  if (!msg || !isAdmin.value) return

  reportingId.value = msg.id
  reportError.value = null
  try {
    const res = await fetch(`${API_BASE}/api/chat/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        roomId,
        messageId: msg.id,
        text: msg.text,
        username: msg.username,
        senderUserId: msg.userId,
        reason: reportReason.value,
        details: reportDetails.value.trim(),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      reportError.value = data.error || `Erreur ${res.status}`
      return
    }
    reportedIds.value.add(msg.id)
    closeReportModal()
  } catch {
    reportError.value = 'Erreur réseau'
  } finally {
    reportingId.value = null
  }
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
  if (isDemo) {
    store.initDemo()
    gateResolved.value = true
    return
  }

  // If we already joined this room (e.g. after createRoom navigated here), skip gate
  if (store.currentRoom?.id === roomId) {
    gateResolved.value = true
    return
  }
})

onUnmounted(() => {
  if (!isDemo) {
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
  } else {
    const isNotFound = res.error === 'Room introuvable'
    error.value = isNotFound
      ? 'Room introuvable — ce code ne correspond à aucune room active.'
      : 'Impossible de rejoindre la room. Vérifiez votre connexion.'
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
    v-if="!isDemo && !gateResolved"
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
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-semibold text-foreground truncate max-w-[200px]">{{ store.title || 'Tier List' }}</span>
          <span class="text-foreground-subtle">·</span>
          <span class="text-xs font-mono text-foreground-subtle">{{ roomId }}</span>
          <button
            v-if="!isDemo"
            class="flex items-center justify-center h-6 w-6 rounded-md text-foreground-subtle hover:text-foreground hover:bg-surface-hover transition-colors"
            title="Copier le lien de la room"
            @click="copyRoomLink"
          >
            <Check v-if="linkCopied" class="h-3.5 w-3.5 text-emerald-400" />
            <Copy v-else class="h-3.5 w-3.5" />
          </button>
          <Transition
            enter-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-200"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <span v-if="linkCopied" class="text-[11px] font-medium text-emerald-400">Copie !</span>
          </Transition>
        </div>
        <div v-if="isDemo" class="rounded-full bg-primary/10 px-2.5 py-0.5">
          <span class="text-[11px] font-medium text-primary">Démo</span>
        </div>
      </div>

      <!-- Right: Toggle panel -->
      <button
        v-if="!isDemo"
        class="flex items-center gap-2 h-8 px-3 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        @click="panelOpen = !panelOpen"
      >
        <span class="text-xs font-medium">{{ store.users.length }} en ligne</span>
        <PanelRightOpen v-if="!panelOpen" class="h-4 w-4" />
        <PanelRightClose v-else class="h-4 w-4" />
      </button>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <p class="text-foreground-muted">Connexion à la room...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-1 flex-col items-center justify-center gap-4">
      <p class="text-destructive">{{ error }}</p>
      <button
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        @click="goHome"
      >
        Retour à l'accueil
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
          v-if="panelOpen && !isDemo"
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
              Chat
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
              Joueurs
              <span class="text-[10px] opacity-60">{{ store.users.length }}</span>
            </button>
          </div>

          <!-- Chat tab -->
          <template v-if="activeTab === 'chat'">
            <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div v-if="chatMessages.length === 0" class="flex h-full items-center justify-center">
                <p class="text-xs text-foreground-subtle">Aucun message</p>
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
                <button
                  v-if="isAdmin && msg.userId !== socket?.id && !reportedIds.has(msg.id)"
                  type="button"
                  aria-label="Signaler ce message"
                  class="shrink-0 opacity-0 group-hover/msg:opacity-100 focus:opacity-100 transition-opacity p-1 rounded hover:bg-surface-hover text-foreground-subtle hover:text-amber-400 disabled:opacity-30"
                  :disabled="reportingId === msg.id"
                  @click="openReportModal(msg)"
                >
                  <Flag class="h-3 w-3" />
                </button>
                <span v-else-if="reportedIds.has(msg.id)" class="shrink-0 text-[10px] text-amber-400">✓ signalé</span>
              </div>
              <div v-if="blockedError" class="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{{ blockedError }}</div>
              <div v-if="reportError" class="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ reportError }}</div>
              <div ref="messagesEnd" />
            </div>

            <!-- Chat input -->
            <div class="border-t border-border px-3 py-2.5 shrink-0">
              <form class="flex gap-2" @submit.prevent="sendMessage">
                <input
                  v-model="chatInput"
                  type="text"
                  placeholder="Message..."
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
                  <span class="text-[10px] text-foreground-subtle">En ligne</span>
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

    <!-- Chat report modal (admin only) -->
    <Teleport to="body">
      <div
        v-if="reportTarget"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        @click.self="closeReportModal"
        @keydown.escape="closeReportModal"
      >
        <div class="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-2xl">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              <Flag class="h-4 w-4 text-amber-400" />
              <h3 id="report-modal-title" class="text-base font-semibold text-foreground">Signaler ce message</h3>
            </div>
            <button
              type="button"
              class="text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Fermer"
              @click="closeReportModal"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="mt-3 rounded-lg border border-border bg-background px-3 py-2">
            <p class="text-[11px] font-semibold text-foreground">{{ reportTarget.username }}</p>
            <p class="mt-0.5 text-sm text-foreground-muted break-words">{{ reportTarget.text }}</p>
          </div>

          <label class="mt-4 block">
            <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Raison</span>
            <select
              v-model="reportReason"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="harassment">Harcèlement</option>
              <option value="inappropriate">Contenu inapproprié</option>
              <option value="spam">Spam</option>
              <option value="other">Autre</option>
            </select>
          </label>

          <label class="mt-3 block">
            <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Détails (optionnel)</span>
            <textarea
              v-model="reportDetails"
              rows="3"
              maxlength="500"
              placeholder="Contexte pour la modération…"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </label>

          <p v-if="reportError" class="mt-3 text-xs text-red-400">{{ reportError }}</p>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover transition-colors"
              :disabled="reportingId === reportTarget.id"
              @click="closeReportModal"
            >
              Annuler
            </button>
            <button
              type="button"
              class="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
              :disabled="reportingId === reportTarget.id"
              @click="submitReport"
            >
              {{ reportingId === reportTarget.id ? 'Envoi…' : 'Envoyer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
