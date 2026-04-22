<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import draggable from 'vuedraggable'
import { useRoomStore } from '@/stores/room'
import TierItem from './TierItem.vue'
import { Trash2, ChevronUp, ChevronDown, Settings, X } from 'lucide-vue-next'
import type { TierRow as TierRowData } from '@tiertogether/shared'

const props = defineProps<{
  rowIndex: number
  readonly?: boolean
  row?: TierRowData
}>()

const store = useRoomStore()

const rowData = computed(() => props.readonly && props.row ? props.row : store.rows[props.rowIndex])
const isDragDisabled = computed(() => store.isLocked && !store.isHost)

const items = computed({
  get: () => props.readonly && props.row ? props.row.items : store.rows[props.rowIndex].items,
  set: (value) => {
    if (!props.readonly) {
      store.rows[props.rowIndex].items = value
    }
  },
})

// Editable label
const isEditing = ref(false)
const editLabel = ref('')
const labelInput = ref<HTMLTextAreaElement | null>(null)

function startEditing() {
  if (props.readonly) return
  editLabel.value = rowData.value.label
  isEditing.value = true
  nextTick(() => {
    labelInput.value?.focus()
    labelInput.value?.select()
  })
}

function finishEditing() {
  isEditing.value = false
  const newLabel = editLabel.value.trim()
  if (newLabel && newLabel !== rowData.value.label) {
    store.updateRow({ rowId: rowData.value.id, label: newLabel })
  }
}

// Settings popup — gear icon opens a TierMaker-style panel with a fixed
// 18-swatch palette + delete button. One click = one row:update emit, no
// socket flood, no native color picker weirdness.
const TIER_COLOR_SWATCHES = [
  '#FF4D4D', '#FF7F7F', '#FFA347', '#FFBF7F',
  '#FFD24D', '#FFDF7F', '#BFFF7F', '#8FE37A',
  '#7FFFBF', '#7FFFFF', '#7FD4FF', '#7FBFFF',
  '#7F7FFF', '#BF7FFF', '#FF7FFF', '#FF7FBF',
  '#9CA3AF', '#FFFFFF',
]

const showSettings = ref(false)
const settingsPanel = ref<HTMLElement | null>(null)
const gearButton = ref<HTMLElement | null>(null)

const renameDraft = ref('')

function toggleSettings(e: Event) {
  e.stopPropagation()
  showSettings.value = !showSettings.value
  if (showSettings.value) {
    renameDraft.value = rowData.value.label
  }
}

function pickColor(hex: string) {
  showSettings.value = false
  if (hex === rowData.value.color) return
  store.updateRow({ rowId: rowData.value.id, color: hex })
}

function applyRename() {
  const next = renameDraft.value.trim().slice(0, 40)
  if (!next || next === rowData.value.label) return
  store.updateRow({ rowId: rowData.value.id, label: next })
}

function onDocMouseDown(e: MouseEvent) {
  if (!showSettings.value) return
  const t = e.target as Node
  if (settingsPanel.value?.contains(t) || gearButton.value?.contains(t)) return
  showSettings.value = false
}
onMounted(() => document.addEventListener('mousedown', onDocMouseDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMouseDown))

// Delete confirmation
const showDeleteConfirm = ref(false)

function confirmDelete() {
  store.deleteRow({ rowId: rowData.value.id })
  showDeleteConfirm.value = false
}

function onDragChange(evt: any) {
  if (evt.added) {
    store.handleDragAdded(evt.added.element.id, rowData.value.id, evt.added.newIndex)
  }
  if (evt.removed) {
    store.handleDragRemoved(evt.removed.element.id, rowData.value.id)
  }
  if (evt.moved) {
    store.emitMove({
      itemId: evt.moved.element.id,
      fromRowId: rowData.value.id,
      toRowId: rowData.value.id,
      toIndex: evt.moved.newIndex,
    })
  }
}
</script>

<template>
  <div class="group/row flex border-b border-border last:border-b-0 relative">
    <!-- Tier Label -->
    <div
      :role="readonly ? 'heading' : 'button'"
      :aria-label="readonly ? undefined : `Renommer le tier ${rowData.label}`"
      :tabindex="readonly ? undefined : 0"
      class="flex w-16 sm:w-24 shrink-0 items-center justify-center font-extrabold select-none relative overflow-hidden text-center leading-tight px-1 focus:outline-none"
      :class="[
        rowData.label.length > 4 ? (rowData.label.length > 8 ? 'text-xs' : 'text-sm') : 'text-3xl',
        readonly ? '' : 'cursor-pointer focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-inset',
      ]"
      style="overflow-wrap: anywhere; word-break: break-word;"
      :style="{
        backgroundColor: rowData.color,
        color: '#0c0d14',
        boxShadow: `inset 0 0 32px ${rowData.color}80, inset 0 0 12px ${rowData.color}40`,
      }"
      @click="startEditing"
      @keydown.enter.prevent="startEditing"
      @keydown.space.prevent="startEditing"
    >
      <template v-if="isEditing && !readonly">
        <textarea
          ref="labelInput"
          v-model="editLabel"
          maxlength="40"
          rows="2"
          class="w-full bg-transparent text-center font-extrabold text-[#0c0d14] outline-none border-b-2 border-black/30 resize-none overflow-hidden"
          :class="editLabel.length > 4 ? (editLabel.length > 8 ? 'text-xs' : 'text-sm') : 'text-3xl'"
          @blur="finishEditing"
          @keydown.enter.prevent="finishEditing"
        />
      </template>
      <template v-else>
        <span class="block w-full break-words overflow-wrap-anywhere">{{ rowData.label }}</span>
      </template>
    </div>

    <!-- Items Zone -->
    <template v-if="readonly">
      <div class="flex min-h-[100px] flex-1 flex-wrap items-start gap-2 bg-surface/20 p-3">
        <TierItem v-for="item in items" :key="item.id" :item="item" />
      </div>
    </template>
    <template v-else>
      <draggable
        v-model="items"
        group="tieritems"
        item-key="id"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="drag"
        :animation="200"
        :disabled="isDragDisabled"
        class="flex min-h-[100px] flex-1 flex-wrap items-start gap-2 bg-surface/20 p-3 transition-colors duration-200"
        @change="onDragChange"
      >
        <template #item="{ element }">
          <TierItem :item="element" />
        </template>
      </draggable>
    </template>

    <!-- Side actions column (always visible, TierMaker-style) -->
    <div
      v-if="!readonly"
      class="flex w-10 shrink-0 flex-col border-l border-border/60 bg-surface/40"
    >
      <button
        ref="gearButton"
        type="button"
        class="flex flex-1 items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-active transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset"
        :aria-label="`Paramètres du tier ${rowData.label}`"
        :aria-expanded="showSettings"
        @click.stop="toggleSettings"
      >
        <Settings class="h-4 w-4" />
      </button>
      <button
        type="button"
        class="flex flex-1 items-center justify-center border-t border-border/60 text-foreground-muted hover:text-foreground hover:bg-surface-active transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset"
        :aria-label="`Monter le tier ${rowData.label}`"
        @click.stop="store.reorderRow({ rowId: rowData.id, direction: 'up' })"
      >
        <ChevronUp class="h-4 w-4" />
      </button>
      <button
        type="button"
        class="flex flex-1 items-center justify-center border-t border-border/60 text-foreground-muted hover:text-foreground hover:bg-surface-active transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset"
        :aria-label="`Descendre le tier ${rowData.label}`"
        @click.stop="store.reorderRow({ rowId: rowData.id, direction: 'down' })"
      >
        <ChevronDown class="h-4 w-4" />
      </button>
    </div>

    <!-- Settings popup -->
    <div
      v-if="!readonly && showSettings"
      ref="settingsPanel"
      role="dialog"
      :aria-label="`Paramètres du tier ${rowData.label}`"
      class="absolute right-11 top-1/2 z-40 w-64 -translate-y-1/2 rounded-xl border border-border-hover bg-surface p-4 shadow-2xl"
      @click.stop
      @keydown.escape.stop="showSettings = false"
    >
      <div class="flex items-start justify-between mb-3">
        <p class="text-sm font-semibold text-foreground">Paramètres de la ligne</p>
        <button
          type="button"
          class="text-foreground-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded"
          aria-label="Fermer le panneau"
          @click.stop="showSettings = false"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <label class="block mb-3">
        <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Nom</span>
        <input
          v-model="renameDraft"
          type="text"
          maxlength="40"
          class="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          @keydown.enter.prevent="applyRename"
          @keydown.escape.stop="showSettings = false"
          @blur="applyRename"
        />
      </label>

      <p class="mb-2 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Couleur</p>
      <div class="grid grid-cols-6 gap-1.5">
        <button
          v-for="hex in TIER_COLOR_SWATCHES"
          :key="hex"
          class="h-7 w-7 rounded-md border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/60"
          :class="hex === rowData.color ? 'border-white' : 'border-black/40'"
          :style="{ backgroundColor: hex }"
          :title="hex"
          @click.stop="pickColor(hex)"
        />
      </div>

      <button
        class="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
        @click.stop="showSettings = false; showDeleteConfirm = true"
      >
        <Trash2 class="h-3.5 w-3.5" />
        Supprimer la ligne
      </button>
    </div>

    <!-- Delete confirmation modal - hidden in readonly -->
    <Teleport v-if="!readonly" to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="showDeleteConfirm = false"
      >
        <div class="rounded-2xl border border-border-hover bg-surface p-6 shadow-2xl max-w-sm w-full mx-4">
          <h3 class="text-lg font-bold text-foreground mb-2">Supprimer la ligne "{{ rowData.label }}" ?</h3>
          <p class="text-sm text-foreground-muted mb-4">Les éléments seront remis dans le pool.</p>
          <div class="flex gap-3 justify-end">
            <button
              class="px-4 py-2 rounded-lg text-sm text-foreground-muted hover:bg-surface-hover transition-colors"
              @click="showDeleteConfirm = false"
            >
              Annuler
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              @click="confirmDelete"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
