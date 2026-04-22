<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSocket } from '@/composables/useSocket'
import { useAuth } from '@/composables/useAuth'
import { API_BASE } from '@/config'
import type { ChatMessage } from '@tiertogether/shared'
import { Send, ChevronDown, Flag } from 'lucide-vue-next'

const { socket } = useSocket()
const route = useRoute()
const { user } = useAuth()

const isExpanded = ref(false)
const messages = ref<ChatMessage[]>([])
const input = ref('')
const unreadCount = ref(0)
const messagesEnd = ref<HTMLElement | null>(null)
const reportingId = ref<string | null>(null)
const reportedIds = ref<Set<string>>(new Set())
const reportError = ref<string | null>(null)

function scrollToBottom() {
  nextTick(() => {
    messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

watch(
  () => socket.value,
  (sock) => {
    if (!sock) return
    sock.on('chat:message', (msg: ChatMessage) => {
      messages.value.push(msg)
      if (!isExpanded.value) {
        unreadCount.value++
      }
      scrollToBottom()
    })
  },
  { immediate: true },
)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    unreadCount.value = 0
    scrollToBottom()
  }
}

function sendMessage() {
  const text = input.value.trim()
  if (!text || !socket.value?.connected) return
  socket.value.emit('chat:send', { text })
  input.value = ''
  if (!isExpanded.value) {
    isExpanded.value = true
    unreadCount.value = 0
  }
  scrollToBottom()
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function reportMessage(msg: ChatMessage) {
  if (!user.value) {
    reportError.value = 'Connexion requise pour signaler.'
    setTimeout(() => { reportError.value = null }, 2500)
    return
  }
  const reason = window.prompt(
    'Raison du signalement ? (harassment / inappropriate / spam / other)',
    'inappropriate',
  )
  if (!reason || !['harassment', 'inappropriate', 'spam', 'other'].includes(reason)) return

  reportingId.value = msg.id
  try {
    const res = await fetch(`${API_BASE}/api/chat/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        roomId: String(route.params.id || ''),
        messageId: msg.id,
        text: msg.text,
        username: msg.username,
        senderUserId: msg.userId,
        reason,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      reportError.value = data.error || `Erreur ${res.status}`
      setTimeout(() => { reportError.value = null }, 3000)
      return
    }
    reportedIds.value.add(msg.id)
  } catch {
    reportError.value = 'Erreur réseau'
    setTimeout(() => { reportError.value = null }, 3000)
  } finally {
    reportingId.value = null
  }
}
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-40">
    <!-- Messages area (expandable) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[300px] opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="max-h-[300px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div
        v-if="isExpanded"
        class="h-[300px] overflow-y-auto border-t border-border bg-[#0D0D0D]/95 backdrop-blur-md px-4 sm:px-6 py-3 space-y-3"
      >
        <div v-if="messages.length === 0" class="flex h-full items-center justify-center">
          <p class="text-sm text-foreground-subtle">Aucun message pour le moment</p>
        </div>

        <div
          v-for="msg in messages"
          :key="msg.id"
          class="group/msg flex items-start gap-2.5"
        >
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
            <div class="flex items-baseline gap-2">
              <span class="text-xs font-semibold" :style="{ color: msg.color }">{{ msg.username }}</span>
              <span class="text-[10px] text-foreground-subtle">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <p class="text-[13px] leading-relaxed text-foreground-muted break-words">{{ msg.text }}</p>
          </div>
          <button
            v-if="user && msg.userId !== socket?.id && !reportedIds.has(msg.id)"
            type="button"
            aria-label="Signaler ce message"
            class="shrink-0 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded hover:bg-surface-hover text-foreground-subtle hover:text-amber-400 disabled:opacity-30"
            :disabled="reportingId === msg.id"
            @click="reportMessage(msg)"
          >
            <Flag class="h-3 w-3" />
          </button>
          <span v-else-if="reportedIds.has(msg.id)" class="shrink-0 text-[10px] text-amber-400">✓ signalé</span>
        </div>

        <div ref="messagesEnd" />
        <div v-if="reportError" class="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{{ reportError }}</div>
      </div>
    </Transition>

    <!-- Input bar (always visible) -->
    <div class="border-t border-border bg-[#0D0D0D] px-4 sm:px-6 py-2.5 flex items-center gap-3">
      <button
        class="shrink-0 flex items-center gap-1.5 text-foreground-muted hover:text-foreground transition-colors"
        @click="toggleExpand"
      >
        <ChevronDown
          class="h-4 w-4 transition-transform"
          :class="isExpanded ? 'rotate-0' : 'rotate-180'"
        />
        <span class="text-xs font-medium">Chat</span>
        <span
          v-if="unreadCount > 0"
          class="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <form class="flex flex-1 gap-2" @submit.prevent="sendMessage">
        <input
          v-model="input"
          type="text"
          placeholder="Envoyer un message..."
          maxlength="500"
          class="flex-1 rounded-lg border border-border bg-surface h-9 px-3 text-[13px] text-foreground placeholder:text-foreground-subtle focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
        <button
          type="submit"
          :disabled="!input.trim()"
          class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white transition-colors hover:bg-primary-hover disabled:opacity-30"
        >
          <Send class="h-4 w-4" />
        </button>
      </form>
    </div>
  </div>
</template>
