<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { useRoomStore } from '@/stores/room'
import TierItem from './TierItem.vue'
import { Badge } from '@/components/ui/badge'

const store = useRoomStore()

const pool = computed({
  get: () => store.pool,
  set: (value) => {
    store.pool = value
  },
})

function onDragChange(evt: any) {
  if (evt.added) {
    console.log(`[DnD] Item "${evt.added.element.label}" returned to pool at index ${evt.added.newIndex}`)
  }
}
</script>

<template>
  <div class="rounded-lg border border-border bg-surface p-4">
    <div class="mb-3 flex items-center gap-2">
      <h3 class="text-sm font-semibold text-foreground">Unranked</h3>
      <Badge variant="secondary">{{ pool.length }}</Badge>
    </div>

    <draggable
      v-model="pool"
      group="tieritems"
      item-key="id"
      ghost-class="ghost"
      chosen-class="chosen"
      drag-class="drag"
      :animation="200"
      class="flex min-h-[90px] flex-wrap gap-2"
      @change="onDragChange"
    >
      <template #item="{ element }">
        <TierItem :item="element" />
      </template>
    </draggable>

    <p
      v-if="pool.length === 0"
      class="flex min-h-[90px] items-center justify-center text-sm text-foreground-subtle"
    >
      Drag items here to unrank them
    </p>
  </div>
</template>
