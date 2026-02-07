<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { TierBoard } from '@/components/tierlist'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const router = useRouter()
const store = useRoomStore()

const roomId = route.params.id as string
const error = ref<string | null>(null)
const isLoading = ref(true)
const isDemo = roomId === 'demo'

onMounted(async () => {
  if (isDemo) {
    store.initDemo()
    isLoading.value = false
    return
  }

  // Real mode: connect and join room via socket
  const user = store.username || 'Anonymous'
  const res = await store.joinRoom(roomId, user)

  isLoading.value = false

  if (!res.success) {
    error.value = res.error ?? 'Failed to join room'
  }
})

onUnmounted(() => {
  if (!isDemo) {
    store.clearRoom()
  }
})

function goHome() {
  store.clearRoom()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-border px-6 py-3">
      <button
        class="text-xl font-bold text-foreground transition-colors hover:text-primary"
        @click="goHome"
      >
        Tier<span class="text-primary">Together</span>
      </button>

      <div class="flex items-center gap-3">
        <Badge variant="outline" class="font-mono">
          {{ roomId }}
        </Badge>
        <Badge v-if="isDemo" variant="secondary">
          Demo Mode
        </Badge>
        <Badge v-else variant="secondary">
          {{ store.users.length }} online
        </Badge>
      </div>
    </header>

    <!-- Loading -->
    <main v-if="isLoading" class="flex flex-1 items-center justify-center">
      <p class="text-foreground-muted">Joining room...</p>
    </main>

    <!-- Error -->
    <main v-else-if="error" class="flex flex-1 flex-col items-center justify-center gap-4">
      <p class="text-destructive">{{ error }}</p>
      <button
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        @click="goHome"
      >
        Back to Home
      </button>
    </main>

    <!-- Tier Board -->
    <main v-else class="flex-1 p-6">
      <TierBoard />
    </main>
  </div>
</template>
