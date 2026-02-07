<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import type { TierRow } from '@tiertogether/shared'
import { useRoomStore } from '@/stores/room'
import TierItem from './TierItem.vue'

const props = defineProps<{
  rowIndex: number
}>()

const store = useRoomStore()

const row = computed(() => store.rows[props.rowIndex])

const items = computed({
  get: () => store.rows[props.rowIndex].items,
  set: (value) => {
    store.rows[props.rowIndex].items = value
  },
})

function onDragChange(evt: any) {
  // Will be used for socket sync in next step
  if (evt.added) {
    console.log(`[DnD] Item "${evt.added.element.label}" added to row "${row.value.label}" at index ${evt.added.newIndex}`)
  }
}
</script>

<template>
  <div class="flex border-b border-border last:border-b-0">
    <!-- Tier Label -->
    <div
      class="flex w-20 shrink-0 items-center justify-center text-2xl font-black select-none"
      :style="{ backgroundColor: row.color, color: '#1a1a1a' }"
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
      class="flex min-h-[80px] flex-1 flex-wrap items-start gap-1.5 bg-surface-hover/50 p-2"
      @change="onDragChange"
    >
      <template #item="{ element }">
        <TierItem :item="element" />
      </template>
    </draggable>
  </div>
</template>
