<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useSocket } from '@/composables/useSocket'
import type { ChatMessage } from '@tiertogether/shared'
import { Send, ChevronDown } from 'lucide-vue-next'

const { socket } = useSocket()

const isExpanded = ref(false)
const messages = ref<ChatMessage[]>([])
const input = ref('')
const unreadCount = ref(0)
const messagesEnd = ref<HTMLElement | null>(null)

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
          class="flex items-start gap-2.5"
        >
          <div
            class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white mt-0.5"
            :style="{ backgroundColor: msg.color }"
          >
            {{ msg.username.slice(0, 2).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <div class="flex items-baseline gap-2">
              <span class="text-xs font-semibold" :style="{ color: msg.color }">{{ msg.username }}</span>
              <span class="text-[10px] text-foreground-subtle">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <p class="text-[13px] leading-relaxed text-foreground-muted break-words">{{ msg.text }}</p>
          </div>
        </div>

        <div ref="messagesEnd" />
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
