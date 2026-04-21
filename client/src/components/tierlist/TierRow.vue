<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { useRoomStore } from '@/stores/room'
import TierItem from './TierItem.vue'
import { Trash2, ArrowUp, ArrowDown, Palette } from 'lucide-vue-next'
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

// Color picker
const showColorPicker = ref(false)
const colorInput = ref('')

function openColorPicker() {
  colorInput.value = rowData.value.color
  showColorPicker.value = true
}

function applyColor(e: Event) {
  const target = e.target as HTMLInputElement
  store.updateRow({ rowId: rowData.value.id, color: target.value })
  showColorPicker.value = false
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

      <!-- Row action buttons (show on hover) - hidden in readonly -->
      <div v-if="!readonly" class="absolute -right-0 top-0 bottom-0 flex flex-col items-center justify-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity duration-200 z-10 sm:translate-x-full sm:group-hover/row:translate-x-0 bg-surface/80 sm:bg-transparent px-1">
        <button
          class="p-1 rounded hover:bg-surface-active text-foreground-muted hover:text-foreground transition-colors"
          title="Monter"
          @click.stop="store.reorderRow({ rowId: rowData.id, direction: 'up' })"
        >
          <ArrowUp class="h-3.5 w-3.5" />
        </button>
        <button
          class="p-1 rounded hover:bg-surface-active text-foreground-muted hover:text-foreground transition-colors"
          title="Changer la couleur"
          @click.stop="openColorPicker"
        >
          <Palette class="h-3.5 w-3.5" />
          <input
            v-if="showColorPicker"
            type="color"
            :value="rowData.color"
            class="absolute opacity-0 w-0 h-0"
            @input="applyColor"
            @change="applyColor"
            ref="colorPickerInput"
          />
        </button>
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
