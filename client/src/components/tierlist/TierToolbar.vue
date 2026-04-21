<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoomStore } from '@/stores/room'
import { Lock, Unlock, RotateCcw, Download, Maximize, Upload, Vote, Palette } from 'lucide-vue-next'
import { toPng } from 'html-to-image'
import PublishModal from './PublishModal.vue'

const store = useRoomStore()
const isExporting = ref(false)
const showPublishModal = ref(false)
const showResetConfirm = ref(false)
const showThemeMenu = ref(false)

const colorThemes: { name: string; colors: string[] }[] = [
  { name: 'Classique', colors: ['#FF7F7F', '#FFBF7F', '#FFFF7F', '#7FFF7F', '#7FBFFF', '#BF7FFF'] },
  { name: 'Pastel', colors: ['#F4A6A6', '#F4CDA6', '#F4F4A6', '#A6F4A6', '#A6CDF4', '#CDA6F4'] },
  { name: 'Néon', colors: ['#FF003C', '#FF6F00', '#FFE600', '#00FF87', '#00D4FF', '#BF00FF'] },
  { name: 'Monochrome', colors: ['#E0E0E0', '#BDBDBD', '#9E9E9E', '#787878', '#5C5C5C', '#424242'] },
]

function applyTheme(theme: { name: string; colors: string[] }) {
  store.rows.forEach((row, index) => {
    const color = theme.colors[index % theme.colors.length]
    store.updateRow({ rowId: row.id, color })
  })
  showThemeMenu.value = false
}

function closeThemeMenu() {
  showThemeMenu.value = false
}

onMounted(() => document.addEventListener('click', closeThemeMenu))
onUnmounted(() => document.removeEventListener('click', closeThemeMenu))

function resetRankings() {
  showResetConfirm.value = true
}

function confirmReset() {
  store.resetRoom()
  showResetConfirm.value = false
}

async function exportImage() {
  const target = document.getElementById('tier-rows-container')
  if (!target) return

  isExporting.value = true
  try {
    const dataUrl = await toPng(target, {
      backgroundColor: '#0c0d14',
      pixelRatio: 2,
      cacheBust: true,
      fetchRequestInit: { mode: 'cors' },
      skipFonts: true,
      filter: (node: HTMLElement) => {
        // Skip problematic elements
        return !node.classList?.contains('lucide')
      },
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
  <div class="flex flex-wrap items-center gap-2 justify-between rounded-md border border-border-hover bg-surface/80 px-2 sm:px-4 py-2">
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
        <span class="hidden sm:inline">Tout retirer</span>
      </button>

      <button
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-orange-500/10 hover:text-orange-400"
        @click="store.toggleLock()"
      >
        <Lock v-if="store.isLocked" class="h-3.5 w-3.5" />
        <Unlock v-else class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">{{ store.isLocked ? 'Déverrouiller' : 'Verrouiller' }}</span>
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
        <span class="hidden sm:inline">Mode Focus</span>
      </button>

      <button
        :class="[
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          store.isVoteMode
            ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
            : 'text-foreground-muted hover:bg-emerald-500/10 hover:text-emerald-400',
        ]"
        @click="store.toggleVoteMode()"
      >
        <Vote class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">{{ store.isVoteMode ? 'Arrêter Vote' : 'Mode Vote' }}</span>
      </button>

      <!-- Theme picker -->
      <div class="relative">
        <button
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-purple-500/10 hover:text-purple-400"
          @click.stop="showThemeMenu = !showThemeMenu"
        >
          <Palette class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">Thème</span>
        </button>
        <div
          v-if="showThemeMenu"
          class="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg border border-border-hover bg-surface shadow-xl p-2"
        >
          <button
            v-for="theme in colorThemes"
            :key="theme.name"
            class="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
            @click="applyTheme(theme)"
          >
            <span class="flex gap-0.5">
              <span
                v-for="(color, i) in theme.colors.slice(0, 5)"
                :key="i"
                class="h-3.5 w-3.5 rounded-sm"
                :style="{ backgroundColor: color }"
              />
            </span>
            <span class="text-xs font-medium">{{ theme.name }}</span>
          </button>
        </div>
      </div>
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
        <span class="hidden sm:inline">Publier</span>
      </button>

    <button
      :disabled="isExporting"
      class="inline-flex items-center gap-1.5 rounded-md border border-border-hover px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
      @click="exportImage"
    >
      <Download class="h-3.5 w-3.5" />
      <span class="hidden sm:inline">{{ isExporting ? 'Export...' : 'Exporter' }}</span>
    </button>
    </div>

    <PublishModal v-if="showPublishModal" @close="showPublishModal = false" />

    <!-- Reset confirmation -->
    <Teleport to="body">
      <div v-if="showResetConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showResetConfirm = false">
        <div class="mx-4 w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl">
          <p class="text-sm font-medium text-foreground">Remettre tous les éléments dans le pool ?</p>
          <div class="mt-4 flex justify-end gap-3">
            <button class="rounded-lg px-4 py-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover transition-colors" @click="showResetConfirm = false">Annuler</button>
            <button class="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors" @click="confirmReset">Confirmer</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
