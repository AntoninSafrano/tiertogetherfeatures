<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { useRoomStore } from '@/stores/room'
import TierItem from './TierItem.vue'
import { Trash2, ArrowUp, ArrowDown, Palette } from 'lucide-vue-next'

const props = defineProps<{
  rowIndex: number
}>()

const store = useRoomStore()

const row = computed(() => store.rows[props.rowIndex])
const isDragDisabled = computed(() => store.isLocked && !store.isHost)

const items = computed({
  get: () => store.rows[props.rowIndex].items,
  set: (value) => {
    store.rows[props.rowIndex].items = value
  },
})

// Editable label
const isEditing = ref(false)
const editLabel = ref('')
const labelInput = ref<HTMLInputElement | null>(null)

function startEditing() {
  editLabel.value = row.value.label
  isEditing.value = true
  nextTick(() => {
    labelInput.value?.focus()
    labelInput.value?.select()
  })
}

function finishEditing() {
  isEditing.value = false
  const newLabel = editLabel.value.trim()
  if (newLabel && newLabel !== row.value.label) {
    store.updateRow({ rowId: row.value.id, label: newLabel })
  }
}

// Color picker
const showColorPicker = ref(false)
const colorInput = ref('')

function openColorPicker() {
  colorInput.value = row.value.color
  showColorPicker.value = true
}

function applyColor(e: Event) {
  const target = e.target as HTMLInputElement
  store.updateRow({ rowId: row.value.id, color: target.value })
  showColorPicker.value = false
}

// Delete confirmation
const showDeleteConfirm = ref(false)

function confirmDelete() {
  store.deleteRow({ rowId: row.value.id })
  showDeleteConfirm.value = false
}

function onDragChange(evt: any) {
  if (evt.added) {
    store.handleDragAdded(evt.added.element.id, row.value.id, evt.added.newIndex)
  }
  if (evt.removed) {
    store.handleDragRemoved(evt.removed.element.id, row.value.id)
  }
  if (evt.moved) {
    store.emitMove({
      itemId: evt.moved.element.id,
      fromRowId: row.value.id,
      toRowId: row.value.id,
      toIndex: evt.moved.newIndex,
    })
  }
}
</script>

<template>
  <div class="group/row flex border-b border-white/5 last:border-b-0 relative">
    <!-- Tier Label -->
    <div
      class="flex w-24 shrink-0 items-center justify-center text-3xl font-extrabold select-none relative group/label cursor-pointer"
      :style="{
        backgroundColor: row.color,
        color: '#0a0a0c',
        boxShadow: `inset 0 0 32px ${row.color}80, inset 0 0 12px ${row.color}40`,
      }"
      @click="startEditing"
    >
      <template v-if="isEditing">
        <input
          ref="labelInput"
          v-model="editLabel"
          maxlength="10"
          class="w-16 bg-transparent text-center text-3xl font-extrabold text-[#0a0a0c] outline-none border-b-2 border-black/30"
          @blur="finishEditing"
          @keydown.enter="finishEditing"
        />
      </template>
      <template v-else>
        {{ row.label }}
      </template>

      <!-- Row action buttons (show on hover) -->
      <div class="absolute -right-0 top-0 bottom-0 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 z-10 translate-x-full px-1">
        <button
          class="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Move up"
          @click.stop="store.reorderRow({ rowId: row.id, direction: 'up' })"
        >
          <ArrowUp class="h-3.5 w-3.5" />
        </button>
        <button
          class="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Change color"
          @click.stop="openColorPicker"
        >
          <Palette class="h-3.5 w-3.5" />
          <input
            v-if="showColorPicker"
            type="color"
            :value="row.color"
            class="absolute opacity-0 w-0 h-0"
            @input="applyColor"
            @change="applyColor"
            ref="colorPickerInput"
          />
        </button>
        <button
          class="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Move down"
          @click.stop="store.reorderRow({ rowId: row.id, direction: 'down' })"
        >
          <ArrowDown class="h-3.5 w-3.5" />
        </button>
        <button
          class="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
          title="Delete row"
          @click.stop="showDeleteConfirm = true"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Draggable Drop Zone -->
    <draggable
      v-model="items"
      group="tieritems"
      item-key="id"
      ghost-class="ghost"
      chosen-class="chosen"
      drag-class="drag"
      :animation="200"
      :disabled="isDragDisabled"
      class="flex min-h-[100px] flex-1 flex-wrap items-start gap-2 bg-white/[0.02] p-3 transition-colors duration-200 group-hover/row:bg-white/[0.04]"
      @change="onDragChange"
    >
      <template #item="{ element }">
        <TierItem :item="element" />
      </template>
    </draggable>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="showDeleteConfirm = false"
      >
        <div class="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl max-w-sm w-full mx-4">
          <h3 class="text-lg font-bold text-foreground mb-2">Delete Row "{{ row.label }}"?</h3>
          <p class="text-sm text-zinc-400 mb-4">Items will be moved back to the pool.</p>
          <div class="flex gap-3 justify-end">
            <button
              class="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/5 transition-colors"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              @click="confirmDelete"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
