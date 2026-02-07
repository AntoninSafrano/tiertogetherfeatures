<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { useRoomStore } from '@/stores/room'
import TierItem from './TierItem.vue'

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
  <div class="group/row flex border-b border-white/5 last:border-b-0">
    <!-- Tier Label with inner glow -->
    <div
      class="flex w-24 shrink-0 items-center justify-center text-3xl font-extrabold select-none"
      :style="{
        backgroundColor: row.color,
        color: '#0a0a0c',
        boxShadow: `inset 0 0 32px ${row.color}80, inset 0 0 12px ${row.color}40`,
      }"
    >
      {{ row.label }}
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
  </div>
</template>
