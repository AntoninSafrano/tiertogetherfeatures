<script setup lang="ts">
import { ref } from 'vue'
import { useRoomStore } from '@/stores/room'
import { Lock, Unlock, RotateCcw, Download } from 'lucide-vue-next'
import { toPng } from 'html-to-image'

const store = useRoomStore()
const isExporting = ref(false)

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
      backgroundColor: '#09090b',
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
  <div class="glass-toolbar flex items-center justify-between rounded-xl px-5 py-2.5">
    <!-- Left zone: Admin Controls (host only) -->
    <div v-if="store.isHost" class="flex items-center gap-1">
      <span class="mr-2 font-mono text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
        Admin
      </span>

      <button
        class="toolbar-btn toolbar-btn-danger inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
        @click="resetRankings"
      >
        <RotateCcw class="h-3.5 w-3.5" />
        Unrank All
      </button>

      <button
        class="toolbar-btn toolbar-btn-warn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-200 hover:bg-orange-500/10 hover:text-orange-400"
        @click="store.toggleLock()"
      >
        <Lock v-if="store.isLocked" class="h-3.5 w-3.5" />
        <Unlock v-else class="h-3.5 w-3.5" />
        {{ store.isLocked ? 'Unlock' : 'Lock' }}
      </button>
    </div>

    <div v-else />

    <!-- Right zone: Export -->
    <button
      :disabled="isExporting"
      class="toolbar-btn toolbar-btn-export inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-zinc-200 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-white disabled:opacity-50"
      @click="exportImage"
    >
      <Download class="h-3.5 w-3.5" />
      {{ isExporting ? 'Exporting...' : 'Export Image' }}
    </button>
  </div>
</template>
