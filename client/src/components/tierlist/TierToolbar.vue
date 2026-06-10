<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoomStore } from '@/stores/room'
import { Lock, Unlock, RotateCcw, Download, Maximize, Upload, Vote, Palette, Twitch } from 'lucide-vue-next'
import PublishModal from './PublishModal.vue'

const store = useRoomStore()
const isExporting = ref(false)
const showPublishModal = ref(false)
const showResetConfirm = ref(false)
const showThemeMenu = ref(false)
const showTwitchMenu = ref(false)
const twitchChannelInput = ref('')

function submitTwitch() {
  const channel = twitchChannelInput.value.trim().replace(/^#/, '').replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '')
  if (!channel) return
  store.connectTwitch(channel)
}

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

function closeMenus() {
  showThemeMenu.value = false
  showTwitchMenu.value = false
}

onMounted(() => document.addEventListener('click', closeMenus))
onUnmounted(() => document.removeEventListener('click', closeMenus))

function resetRankings() {
  showResetConfirm.value = true
}

function confirmReset() {
  store.resetRoom()
  showResetConfirm.value = false
}

// ─── Canvas export ──────────────────────────────────────────────
// The tier list is redrawn from the store onto a canvas (instead of a DOM
// screenshot, which silently dropped CSS background-images). Deterministic,
// works on every browser, and includes the tiertogether.fr footer.

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => resolve(null), 8000)
    img.onload = () => { clearTimeout(timer); resolve(img) }
    img.onerror = () => { clearTimeout(timer); resolve(null) }
    img.src = url
  })
}

/** Draw an image cropped to cover a square cell */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number) {
  const ratio = Math.max(size / img.width, size / img.height)
  const w = img.width * ratio
  const h = img.height * ratio
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, size, size, 8)
  ctx.clip()
  ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h)
  ctx.restore()
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, label: string, color: string, x: number, y: number, size: number) {
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, size, size, 8)
  ctx.clip()
  const grad = ctx.createLinearGradient(x, y, x + size, y + size)
  grad.addColorStop(0, color + '30')
  grad.addColorStop(1, '#000000')
  ctx.fillStyle = grad
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const words = label.split(/\s+/).slice(0, 3)
  words.forEach((w, i) => {
    ctx.fillText(w.slice(0, 12), x + size / 2, y + size / 2 + (i - (words.length - 1) / 2) * 16)
  })
  ctx.restore()
}

async function exportImage() {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const ITEM = 96
    const GAP = 8
    const LABEL_W = 120
    const WIDTH = 1240
    const BANNER = 64
    const cols = Math.floor((WIDTH - LABEL_W - GAP) / (ITEM + GAP))

    const rows = store.rows.map((row) => {
      const lines = Math.max(1, Math.ceil(row.items.length / cols))
      return { row, height: Math.max(ITEM + GAP * 2, lines * (ITEM + GAP) + GAP) }
    })
    const totalH = rows.reduce((s, r) => s + r.height, 0) + BANNER

    // Preload every image in parallel (failed loads → placeholder)
    const urls = [...new Set(store.rows.flatMap((r) => r.items.map((i) => i.imageUrl)).filter(Boolean))]
    const loaded = new Map<string, HTMLImageElement>()
    await Promise.all(urls.map(async (u) => {
      const img = await loadImage(u)
      if (img) loaded.set(u, img)
    }))

    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = totalH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d unavailable')

    ctx.fillStyle = '#0c0d14'
    ctx.fillRect(0, 0, WIDTH, totalH)

    let y = 0
    for (const { row, height } of rows) {
      // Label column
      ctx.fillStyle = row.color
      ctx.fillRect(0, y, LABEL_W, height)
      ctx.fillStyle = '#0c0d14'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = row.label
      ctx.font = label.length > 8 ? 'bold 15px system-ui' : label.length > 4 ? 'bold 20px system-ui' : 'bold 34px system-ui'
      const labelWords = label.length > 8 ? label.split(/\s+/).slice(0, 3) : [label]
      labelWords.forEach((w, i) => {
        ctx.fillText(w.slice(0, 12), LABEL_W / 2, y + height / 2 + (i - (labelWords.length - 1) / 2) * 18)
      })

      // Items zone
      ctx.fillStyle = 'rgba(255,255,255,0.025)'
      ctx.fillRect(LABEL_W, y, WIDTH - LABEL_W, height)

      row.items.forEach((item, idx) => {
        const cx = LABEL_W + GAP + (idx % cols) * (ITEM + GAP)
        const cy = y + GAP + Math.floor(idx / cols) * (ITEM + GAP)
        const img = item.imageUrl ? loaded.get(item.imageUrl) : undefined
        if (img) drawCover(ctx, img, cx, cy, ITEM)
        else drawPlaceholder(ctx, item.label, row.color, cx, cy, ITEM)
      })

      // Separator
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fillRect(0, y + height - 1, WIDTH, 1)
      y += height
    }

    // Footer banner: title + brand
    const midY = totalH - BANNER / 2
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = '600 22px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    let title = store.title || 'Tier list'
    while (title && ctx.measureText(title).width > WIDTH * 0.55) title = title.slice(0, -1)
    ctx.fillText(title, 24, midY)

    ctx.font = '700 24px system-ui, sans-serif'
    const w1 = ctx.measureText('tier').width
    const w2 = ctx.measureText('together.fr').width
    const startX = WIDTH - w1 - w2 - 24
    ctx.fillStyle = '#a855f7'
    ctx.fillText('tier', startX, midY)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText('together.fr', startX + w1, midY)

    const link = document.createElement('a')
    link.download = `${store.title || 'tierlist'}.png`
    link.href = canvas.toDataURL('image/png')
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
        {{ $t('toolbar.admin') }}
      </span>

      <button
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
        @click="resetRankings"
      >
        <RotateCcw class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">{{ $t('toolbar.resetAll') }}</span>
      </button>

      <button
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-orange-500/10 hover:text-orange-400"
        @click="store.toggleLock()"
      >
        <Lock v-if="store.isLocked" class="h-3.5 w-3.5" />
        <Unlock v-else class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">{{ store.isLocked ? $t('toolbar.unlock') : $t('toolbar.lock') }}</span>
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
        <span class="hidden sm:inline">{{ $t('toolbar.focusMode') }}</span>
      </button>

      <button
        :class="[
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          store.isVoteMode
            ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
            : store.twitchConnected
              ? 'text-emerald-400 ring-1 ring-emerald-500/60 animate-pulse hover:bg-emerald-500/10'
              : 'text-foreground-muted hover:bg-emerald-500/10 hover:text-emerald-400',
        ]"
        @click="store.toggleVoteMode()"
      >
        <Vote class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">{{ store.isVoteMode ? $t('toolbar.stopVote') : $t('toolbar.voteMode') }}</span>
      </button>

      <!-- Twitch chat bridge -->
      <div class="relative">
        <button
          :class="[
            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            store.twitchConnected
              ? 'bg-[#9146FF]/20 text-[#bf94ff] ring-1 ring-[#9146FF]/50'
              : 'text-foreground-muted hover:bg-[#9146FF]/10 hover:text-[#bf94ff]',
          ]"
          @click.stop="showTwitchMenu = !showTwitchMenu; showThemeMenu = false"
        >
          <Twitch class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{{ store.twitchConnected ? store.twitchChannel : 'Twitch' }}</span>
        </button>
        <div
          v-if="showTwitchMenu"
          class="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-border-hover bg-surface shadow-xl p-3"
          @click.stop
        >
          <p class="text-sm font-semibold text-foreground mb-2.5">{{ $t('twitch.title') }}</p>

          <!-- Étape 1 : connecter la chaîne -->
          <div class="flex items-start gap-2 mb-2.5">
            <span
              :class="['flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                store.twitchConnected ? 'bg-emerald-500 text-white' : 'bg-[#9146FF] text-white']"
            >{{ store.twitchConnected ? '✓' : '1' }}</span>
            <div class="min-w-0 flex-1">
              <template v-if="!store.twitchConnected">
                <p class="text-xs text-foreground mb-1.5">{{ $t('twitch.step1') }}</p>
                <form class="flex gap-2" @submit.prevent="submitTwitch">
                  <input
                    v-model="twitchChannelInput"
                    type="text"
                    :placeholder="$t('twitch.channelPlaceholder')"
                    maxlength="25"
                    class="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-foreground-subtle focus:border-[#9146FF]/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    :disabled="!twitchChannelInput.trim()"
                    class="rounded-md bg-[#9146FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7c2df0] transition-colors disabled:opacity-50"
                  >
                    {{ $t('twitch.connect') }}
                  </button>
                </form>
                <p v-if="store.twitchError" class="mt-1.5 text-[11px] text-red-400">{{ store.twitchError }}</p>
              </template>
              <template v-else>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs text-foreground">
                    {{ $t('twitch.connectedTo') }} <span class="font-semibold text-[#bf94ff]">#{{ store.twitchChannel }}</span>
                  </span>
                  <button
                    class="rounded-md border border-border-hover px-2 py-0.5 text-[10px] font-medium text-foreground-muted hover:text-red-400 hover:border-red-500/40 transition-colors"
                    @click="store.disconnectTwitch()"
                  >
                    {{ $t('twitch.disconnect') }}
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- Étape 2 : lancer le mode vote -->
          <div class="flex items-start gap-2">
            <span
              :class="['flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                store.isVoteMode ? 'bg-emerald-500 text-white' : store.twitchConnected ? 'bg-[#9146FF] text-white' : 'bg-surface-hover text-foreground-subtle']"
            >{{ store.isVoteMode ? '✓' : '2' }}</span>
            <div class="min-w-0 flex-1">
              <template v-if="store.isVoteMode">
                <p class="text-xs text-emerald-400 font-medium">
                  {{ $t('twitch.voteRunningBefore') }}(<span class="font-mono">S</span>, <span class="font-mono">A</span>…){{ $t('twitch.voteRunningAfter') }}
                </p>
              </template>
              <template v-else>
                <p class="text-xs text-foreground mb-1.5">
                  {{ $t('twitch.launchHintBefore') }}(<span class="font-mono">S</span>,
                  <span class="font-mono">A</span>, <span class="font-mono">B</span>…){{ $t('twitch.launchHintAfter') }}
                </p>
                <button
                  :disabled="!store.twitchConnected || store.pool.length === 0"
                  class="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-40"
                  @click="store.toggleVoteMode(); showTwitchMenu = false"
                >
                  <Vote class="h-3.5 w-3.5" />
                  {{ $t('twitch.launchVote') }}
                </button>
                <p v-if="store.twitchConnected && store.pool.length === 0" class="mt-1.5 text-[11px] text-amber-400">
                  {{ $t('twitch.poolEmptyHint') }}
                </p>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Theme picker -->
      <div class="relative">
        <button
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-purple-500/10 hover:text-purple-400"
          @click.stop="showThemeMenu = !showThemeMenu; showTwitchMenu = false"
        >
          <Palette class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{{ $t('toolbar.theme') }}</span>
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
        <span class="hidden sm:inline">{{ $t('toolbar.publish') }}</span>
      </button>

    <button
      :disabled="isExporting"
      class="inline-flex items-center gap-1.5 rounded-md border border-border-hover px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
      @click="exportImage"
    >
      <Download class="h-3.5 w-3.5" />
      <span class="hidden sm:inline">{{ isExporting ? $t('toolbar.exporting') : $t('toolbar.export') }}</span>
    </button>
    </div>

    <PublishModal v-if="showPublishModal" @close="showPublishModal = false" />

    <!-- Reset confirmation -->
    <Teleport to="body">
      <div v-if="showResetConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showResetConfirm = false">
        <div class="mx-4 w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl">
          <p class="text-sm font-medium text-foreground">{{ $t('toolbar.resetConfirm') }}</p>
          <div class="mt-4 flex justify-end gap-3">
            <button class="rounded-lg px-4 py-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover transition-colors" @click="showResetConfirm = false">{{ $t('common.cancel') }}</button>
            <button class="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors" @click="confirmReset">{{ $t('common.confirm') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
