<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{ src: string }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', blob: Blob): void
}>()

const VIEWPORT = 288
const CIRCLE_RADIUS = 128
const OUTPUT = 512

const imgEl = ref<HTMLImageElement | null>(null)
const naturalW = ref(0)
const naturalH = ref(0)
const zoom = ref(1)
const pos = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, ox: 0, oy: 0 })
const isSaving = ref(false)

const baseScale = computed(() => {
  if (!naturalW.value || !naturalH.value) return 1
  return Math.max(VIEWPORT / naturalW.value, VIEWPORT / naturalH.value)
})
const displayScale = computed(() => baseScale.value * zoom.value)
const displayW = computed(() => naturalW.value * displayScale.value)
const displayH = computed(() => naturalH.value * displayScale.value)

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

function constrain(x: number, y: number): { x: number; y: number } {
  const c = VIEWPORT / 2
  const minX = c + CIRCLE_RADIUS - displayW.value
  const maxX = c - CIRCLE_RADIUS
  const minY = c + CIRCLE_RADIUS - displayH.value
  const maxY = c - CIRCLE_RADIUS
  return {
    x: minX > maxX ? (VIEWPORT - displayW.value) / 2 : clamp(x, minX, maxX),
    y: minY > maxY ? (VIEWPORT - displayH.value) / 2 : clamp(y, minY, maxY),
  }
}

function onLoad() {
  if (!imgEl.value) return
  naturalW.value = imgEl.value.naturalWidth
  naturalH.value = imgEl.value.naturalHeight
  zoom.value = 1
  pos.value = constrain((VIEWPORT - displayW.value) / 2, (VIEWPORT - displayH.value) / 2)
}

watch(zoom, () => {
  pos.value = constrain(pos.value.x, pos.value.y)
})

function pt(e: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in e && e.touches.length) {
    const t = e.touches[0]!
    return { x: t.clientX, y: t.clientY }
  }
  const m = e as MouseEvent
  return { x: m.clientX, y: m.clientY }
}

function startDrag(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  const p = pt(e)
  dragStart.value = { x: p.x, y: p.y, ox: pos.value.x, oy: pos.value.y }
  if (e.cancelable) e.preventDefault()
}
function moveDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return
  const p = pt(e)
  pos.value = constrain(
    dragStart.value.ox + (p.x - dragStart.value.x),
    dragStart.value.oy + (p.y - dragStart.value.y),
  )
  if (e.cancelable) e.preventDefault()
}
function endDrag() {
  isDragging.value = false
}

async function confirmCrop() {
  if (!imgEl.value || isSaving.value) return
  isSaving.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas ctx unavailable')
    const c = VIEWPORT / 2
    const sx = (c - CIRCLE_RADIUS - pos.value.x) / displayScale.value
    const sy = (c - CIRCLE_RADIUS - pos.value.y) / displayScale.value
    const sSize = (2 * CIRCLE_RADIUS) / displayScale.value
    ctx.drawImage(imgEl.value, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.9)
    })
    emit('confirm', blob)
  } catch (err) {
    console.error('[AvatarCropper] confirm failed', err)
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  window.addEventListener('mousemove', moveDrag)
  window.addEventListener('mouseup', endDrag)
  window.addEventListener('touchmove', moveDrag, { passive: false })
  window.addEventListener('touchend', endDrag)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', moveDrag)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('touchmove', moveDrag)
  window.removeEventListener('touchend', endDrag)
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div class="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-foreground">Recadrer votre photo</h3>
            <p class="mt-1 text-xs text-foreground-muted">Glissez et zoomez pour choisir la zone visible.</p>
          </div>
          <button
            class="text-foreground-muted hover:text-foreground transition-colors"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div
          class="relative mx-auto mt-5 cursor-move select-none overflow-hidden rounded-lg bg-black/50"
          :style="{ width: VIEWPORT + 'px', height: VIEWPORT + 'px' }"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <img
            ref="imgEl"
            :src="src"
            alt=""
            draggable="false"
            class="pointer-events-none max-w-none select-none"
            :style="{
              width: naturalW + 'px',
              height: naturalH + 'px',
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${displayScale})`,
              transformOrigin: '0 0',
            }"
            @load="onLoad"
          />
          <!-- Circular mask overlay -->
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              class="rounded-full ring-2 ring-white/90"
              :style="{
                width: CIRCLE_RADIUS * 2 + 'px',
                height: CIRCLE_RADIUS * 2 + 'px',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              }"
            />
          </div>
        </div>

        <label class="mt-4 block">
          <span class="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Zoom</span>
          <input
            v-model.number="zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            class="mt-1 w-full accent-primary"
          />
        </label>

        <div class="mt-4 flex justify-end gap-2">
          <button
            class="rounded-lg px-4 py-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover transition-colors disabled:opacity-50"
            :disabled="isSaving"
            @click="emit('close')"
          >
            Annuler
          </button>
          <button
            class="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
            :disabled="isSaving"
            @click="confirmCrop"
          >
            {{ isSaving ? 'Traitement…' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
