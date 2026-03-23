<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { TierBoard } from '@/components/tierlist'
import { Badge } from '@/components/ui/badge'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import RoomEntryGate from '@/components/room/RoomEntryGate.vue'
import CollaboratorsPanel from '@/components/room/CollaboratorsPanel.vue'

const route = useRoute()
const router = useRouter()
const store = useRoomStore()

const roomId = route.params.id as string
const error = ref<string | null>(null)
const isLoading = ref(false)
const isDemo = roomId === 'demo'
const gateResolved = ref(false)

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
    error.value = res.error ?? 'Impossible de rejoindre la room'
    gateResolved.value = true // Show error in main view
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
  <div v-else class="flex min-h-screen flex-col bg-background">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-border px-3 sm:px-6 py-3">
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
          Mode Démo
        </Badge>
        <Badge v-else variant="secondary">
          {{ store.users.length }} en ligne
        </Badge>
      </div>
    </header>

    <!-- Loading -->
    <main v-if="isLoading" class="flex flex-1 items-center justify-center">
      <p class="text-foreground-muted">Connexion à la room...</p>
    </main>

    <!-- Error -->
    <main v-else-if="error" class="flex flex-1 flex-col items-center justify-center gap-4">
      <p class="text-destructive">{{ error }}</p>
      <button
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        @click="goHome"
      >
        Retour à l'accueil
      </button>
    </main>

    <!-- Tier Board -->
    <main v-else class="flex-1 p-3 sm:p-6">
      <TierBoard />
    </main>

    <!-- Collaborators Panel -->
    <CollaboratorsPanel v-if="!isDemo && gateResolved" />

    <!-- Chat -->
    <ChatPanel v-if="!isDemo" />
  </div>
</template>
