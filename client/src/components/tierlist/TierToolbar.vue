<script setup lang="ts">
import { ref } from 'vue'
import { useRoomStore } from '@/stores/room'
import { useAuth } from '@/composables/useAuth'
import { Lock, Unlock, RotateCcw, Download, Maximize, Upload } from 'lucide-vue-next'
import { toPng } from 'html-to-image'
import PublishModal from './PublishModal.vue'

const store = useRoomStore()
const { user } = useAuth()
const isExporting = ref(false)
const showPublishModal = ref(false)

function resetRankings() {
  if (!confirm('Move all items back to the pool?')) return
  store.resetRoom()
}

async function exportImage() {
  const target = document.getElementById('tier-rows-container')
  if (!target) return

  isExporting.value = true
  try {
    const dataUrl = await toPng(target, {
      backgroundColor: '#0c0d14',
      pixelRatio: 2,
    })

    const link = document.createElement('a')
    link.download = `${store.title || 'tierlist'}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('[Export] Failed:', err)
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-between rounded-md border border-border-hover bg-surface/80 px-4 py-2">
    <!-- Left zone: Admin Controls (host only) -->
    <div v-if="store.isHost" class="flex items-center gap-3">
      <span class="font-mono text-[10px] font-medium tracking-wider text-foreground-muted uppercase">
        Admin
      </span>

      <button
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
        @click="resetRankings"
      >
        <RotateCcw class="h-3.5 w-3.5" />
        Unrank All
      </button>

      <button
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-orange-500/10 hover:text-orange-400"
        @click="store.toggleLock()"
      >
        <Lock v-if="store.isLocked" class="h-3.5 w-3.5" />
        <Unlock v-else class="h-3.5 w-3.5" />
        {{ store.isLocked ? 'Unlock' : 'Lock' }}
      </button>

      <button
        :class="[
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          store.isFocusMode
            ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
            : 'text-foreground-muted hover:bg-primary/10 hover:text-primary',
        ]"
        @click="store.toggleFocusMode()"
      >
        <Maximize class="h-3.5 w-3.5" />
        Focus Mode
      </button>
    </div>

    <div v-else />

    <!-- Right zone -->
    <div class="flex items-center gap-2">
      <!-- Publish -->
      <button
        class="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        @click="showPublishModal = true"
      >
        <Upload class="h-3.5 w-3.5" />
        Publish
      </button>

    <button
      :disabled="isExporting"
      class="inline-flex items-center gap-1.5 rounded-md border border-border-hover px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
      @click="exportImage"
    >
      <Download class="h-3.5 w-3.5" />
      {{ isExporting ? 'Exporting...' : 'Export Image' }}
    </button>
    </div>

    <PublishModal v-if="showPublishModal" @close="showPublishModal = false" />
  </div>
</template>
