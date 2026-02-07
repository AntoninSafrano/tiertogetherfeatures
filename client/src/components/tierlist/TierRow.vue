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
  <div class="tier-row group/row flex border-b border-white/5 last:border-b-0">
    <!-- Tier Label -->
    <div
      class="tier-label relative flex w-24 shrink-0 items-center justify-center overflow-hidden text-4xl select-none"
      :style="{
        backgroundColor: row.color,
        color: '#0a0a0c',
      }"
    >
      <!-- Inner glow layers -->
      <div
        class="pointer-events-none absolute inset-0"
        :style="{
          boxShadow: `inset 0 0 40px ${row.color}90, inset 0 0 16px ${row.color}50`,
        }"
      />
      <span class="relative z-10">{{ row.label }}</span>
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
      class="flex min-h-[100px] flex-1 flex-wrap items-start gap-2 p-3 transition-all duration-300"
      :style="{
        background: `linear-gradient(90deg, ${row.color}06 0%, transparent 30%)`,
      }"
      @change="onDragChange"
    >
      <template #item="{ element }">
        <TierItem :item="element" />
      </template>
    </draggable>
  </div>
</template>
