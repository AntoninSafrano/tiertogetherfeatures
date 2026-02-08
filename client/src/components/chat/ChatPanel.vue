<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useSocket } from '@/composables/useSocket'
import { useRoomStore } from '@/stores/room'
import type { ChatMessage } from '@tiertogether/shared'
import { MessageSquare, Send, X } from 'lucide-vue-next'

const { socket } = useSocket()
const store = useRoomStore()

const isOpen = ref(false)
const messages = ref<ChatMessage[]>([])
const input = ref('')
const unreadCount = ref(0)
const messagesEnd = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

// Listen for incoming messages
watch(
  () => socket.value,
  (sock) => {
    if (!sock) return
    sock.on('chat:message', (msg: ChatMessage) => {
      messages.value.push(msg)
      if (!isOpen.value) {
        unreadCount.value++
      }
      scrollToBottom()
    })
  },
  { immediate: true },
)

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unreadCount.value = 0
    scrollToBottom()
  }
}

function sendMessage() {
  const text = input.value.trim()
  if (!text || !socket.value?.connected) return
  socket.value.emit('chat:send', { text })
  input.value = ''
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <!-- Closed tab -->
  <button
    v-if="!isOpen"
    class="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg border border-r-0 border-white/10 bg-zinc-900/90 px-2 py-4 backdrop-blur-sm transition-colors hover:bg-zinc-800"
    @click="toggle"
  >
    <div class="flex flex-col items-center gap-2">
      <MessageSquare class="h-4 w-4 text-zinc-400" />
      <span class="text-[10px] font-bold tracking-widest text-zinc-500 uppercase [writing-mode:vertical-lr]">
        Comms
      </span>
      <!-- Notification badge -->
      <span
        v-if="unreadCount > 0"
        class="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </div>
  </button>

  <!-- Open panel -->
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-200 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-white/10 bg-zinc-950/95 backdrop-blur-md"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div class="flex items-center gap-2">
          <MessageSquare class="h-4 w-4 text-primary" />
          <span class="font-mono text-xs font-bold tracking-wider text-zinc-300 uppercase">Comms</span>
        </div>
        <button
          class="rounded-md p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
          @click="toggle"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Messages -->
      <div class="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        <div v-if="messages.length === 0" class="flex h-full items-center justify-center">
          <p class="text-xs text-zinc-600">No messages yet</p>
        </div>

        <div
          v-for="msg in messages"
          :key="msg.id"
          class="group rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
        >
          <div class="flex items-baseline gap-2">
            <span
              class="text-xs font-semibold"
              :style="{ color: msg.color }"
            >
              {{ msg.username }}
              <span v-if="msg.isHost" class="ml-0.5 text-[9px] font-bold text-yellow-500">HOST</span>
            </span>
            <span class="text-[10px] text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100">
              {{ formatTime(msg.timestamp) }}
            </span>
          </div>
          <p class="text-sm leading-snug text-zinc-300">{{ msg.text }}</p>
        </div>

        <div ref="messagesEnd" />
      </div>

      <!-- Input -->
      <div class="border-t border-white/10 p-3">
        <form class="flex gap-2" @submit.prevent="sendMessage">
          <input
            v-model="input"
            type="text"
            placeholder="Message..."
            maxlength="500"
            class="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-zinc-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="submit"
            :disabled="!input.trim()"
            class="rounded-lg bg-primary px-3 py-2 text-white transition-colors hover:bg-primary-hover disabled:opacity-30"
          >
            <Send class="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  </Transition>
</template>
