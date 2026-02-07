<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { TierBoard } from '@/components/tierlist'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const router = useRouter()
const store = useRoomStore()

const roomId = route.params.id as string

onMounted(() => {
  // For now, load demo data locally (socket sync comes in step 3)
  if (store.rows.length === 0) {
    store.initDemo()
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
        <Badge variant="secondary">
          Demo Mode
        </Badge>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 p-6">
      <TierBoard />
    </main>
  </div>
</template>
