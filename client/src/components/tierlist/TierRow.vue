<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { useRoomStore } from '@/stores/room'
import TierItem from './TierItem.vue'
import { Trash2, ArrowUp, ArrowDown, Palette, MoreVertical } from 'lucide-vue-next'
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

// Color palette — swap the native <input type="color"> (flaky on
// Chromium/Windows, and it spammed row:update on every drag inside the
// native popup, tripping the Socket.io rate limiter → crash on the
// second open). Now a fixed 12-swatch popup emits exactly one update.
const TIER_COLOR_SWATCHES = [
  '#FF7F7F', '#FFBF7F', '#FFDF7F', '#BFFF7F',
  '#7FFFBF', '#7FFFFF', '#7FBFFF', '#7F7FFF',
  '#BF7FFF', '#FF7FFF', '#FF7FBF', '#9CA3AF',
]

const showPalette = ref(false)
const showMobileActions = ref(false)

function openColorPicker() {
  showPalette.value = !showPalette.value
}

function pickColor(hex: string) {
  showPalette.value = false
  if (hex === rowData.value.color) return
  store.updateRow({ rowId: rowData.value.id, color: hex })
}

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
      class="flex w-16 sm:w-24 shrink-0 items-center justify-center font-extrabold select-none relative overflow-hidden text-center leading-tight px-1"
      :class="[
        rowData.label.length > 4 ? (rowData.label.length > 8 ? 'text-xs' : 'text-sm') : 'text-3xl',
        readonly ? '' : 'group/label cursor-pointer',
      ]"
      style="overflow-wrap: anywhere; word-break: break-word;"
      :style="{
        backgroundColor: rowData.color,
        color: '#0c0d14',
        boxShadow: `inset 0 0 32px ${rowData.color}80, inset 0 0 12px ${rowData.color}40`,
      }"
      @click="startEditing"
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

      <!-- Row action buttons: toggle on mobile, hover on desktop -->
      <button
        v-if="!readonly"
        class="absolute right-1 top-1 sm:hidden z-20 p-1 rounded bg-surface/80 text-foreground-muted"
        @click.stop="showMobileActions = !showMobileActions"
      >
        <MoreVertical class="h-3 w-3" />
      </button>
      <div v-if="!readonly" :class="[
        'absolute -right-0 top-0 bottom-0 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 z-10 px-1',
        showMobileActions ? 'opacity-100 bg-surface/90' : 'opacity-0 pointer-events-none sm:pointer-events-auto',
        'sm:opacity-0 sm:group-hover/row:opacity-100 sm:translate-x-full sm:group-hover/row:translate-x-0 sm:bg-transparent'
      ]">
        <button
          class="p-1 rounded hover:bg-surface-active text-foreground-muted hover:text-foreground transition-colors"
          title="Monter"
          @click.stop="store.reorderRow({ rowId: rowData.id, direction: 'up' })"
        >
          <ArrowUp class="h-3.5 w-3.5" />
        </button>
        <div class="relative">
          <button
            class="p-1 rounded hover:bg-surface-active text-foreground-muted hover:text-foreground transition-colors"
            title="Changer la couleur"
            @click.stop="openColorPicker"
          >
            <Palette class="h-3.5 w-3.5" />
          </button>

          <div
            v-if="showPalette"
            class="absolute left-full top-1/2 ml-2 -translate-y-1/2 z-30 rounded-lg border border-border bg-surface p-2 shadow-2xl grid grid-cols-4 gap-1.5"
            @click.stop
          >
            <button
              v-for="hex in TIER_COLOR_SWATCHES"
              :key="hex"
              class="h-6 w-6 rounded-md border border-black/40 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/60"
              :style="{ backgroundColor: hex }"
              @click.stop="pickColor(hex)"
            />
          </div>
        </div>
        <button
          class="p-1 rounded hover:bg-surface-active text-foreground-muted hover:text-foreground transition-colors"
          title="Descendre"
          @click.stop="store.reorderRow({ rowId: rowData.id, direction: 'down' })"
        >
          <ArrowDown class="h-3.5 w-3.5" />
        </button>
        <button
          class="p-1 rounded hover:bg-red-500/20 text-foreground-muted hover:text-red-400 transition-colors"
          title="Supprimer la ligne"
          @click.stop="showDeleteConfirm = true"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
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
        class="flex min-h-[100px] flex-1 flex-wrap items-start gap-2 bg-surface/20 p-3 transition-colors duration-200 group-hover/row:bg-surface/40"
        @change="onDragChange"
      >
        <template #item="{ element }">
          <TierItem :item="element" />
        </template>
      </draggable>
    </template>

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
