<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { useRoomStore } from '@/stores/room'
import TierItem from './TierItem.vue'
import { LayoutGrid } from 'lucide-vue-next'

const store = useRoomStore()
const isDragDisabled = computed(() => store.isLocked && !store.isHost)

const pool = computed({
  get: () => store.pool,
  set: (value) => {
    store.pool = value
  },
})

function onDragChange(evt: any) {
  if (evt.added) {
    store.handleDragAdded(evt.added.element.id, null, evt.added.newIndex)
  }
  if (evt.removed) {
    store.handleDragRemoved(evt.removed.element.id, null)
  }
  if (evt.moved) {
    store.emitMove({
      itemId: evt.moved.element.id,
      fromRowId: null,
      toRowId: null,
      toIndex: evt.moved.newIndex,
    })
  }
}
</script>

<template>
  <div class="p-4">
    <div class="mb-3 flex items-center gap-2">
      <h3 class="text-sm font-semibold text-foreground">Non classés</h3>
      <span class="rounded-full bg-surface-active px-2 py-0.5 text-xs font-medium text-foreground-muted">
        {{ pool.length }}
      </span>
    </div>

    <div class="relative">
      <draggable
        v-model="pool"
        group="tieritems"
        item-key="id"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="drag"
        :animation="200"
        :disabled="isDragDisabled"
        class="flex min-h-[100px] flex-wrap items-start gap-2"
        @change="onDragChange"
      >
        <template #item="{ element }">
          <TierItem :item="element" />
        </template>
      </draggable>

      <!-- Empty state overlay -->
      <div
        v-if="pool.length === 0"
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2"
      >
        <LayoutGrid class="h-8 w-8 text-foreground-subtle" />
        <span class="text-sm text-foreground-subtle">Glissez des éléments ici ou ajoutez-en ci-dessus</span>
      </div>
    </div>
  </div>
</template>
