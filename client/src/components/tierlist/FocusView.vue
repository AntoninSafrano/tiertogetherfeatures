<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { useRoomStore } from '@/stores/room'
import TierItem from './TierItem.vue'
import { SkipForward, PartyPopper } from 'lucide-vue-next'

const store = useRoomStore()
const isDragDisabled = computed(() => store.isLocked && !store.isHost)

// Expose only the first pool item as a draggable list
const focusItems = computed({
  get: () => (store.pool.length > 0 ? [store.pool[0]] : []),
  set: (value) => {
    // When the item is dragged away, vuedraggable sets value to []
    // Remove first item from pool locally (server handles persistence via item:move)
    if (value.length === 0 && store.pool.length > 0) {
      store.pool.splice(0, 1)
    }
  },
})

const remainingCount = computed(() => Math.max(0, store.pool.length - 1))

const placeholderColors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

function getPlaceholderColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return placeholderColors[Math.abs(hash) % placeholderColors.length]
}

function onDragChange(evt: any) {
  if (evt.removed) {
    store.handleDragRemoved(evt.removed.element.id, null)
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-6 py-8">
    <!-- All ranked state -->
    <template v-if="store.pool.length === 0">
      <div class="flex flex-col items-center gap-3 py-12">
        <PartyPopper class="h-16 w-16 text-primary" />
        <p class="text-xl font-bold text-foreground">All items ranked!</p>
        <p class="text-sm text-foreground-muted">Every item has been placed in a tier.</p>
      </div>
    </template>

    <!-- Focus card -->
    <template v-else>
      <p class="text-sm font-medium text-foreground-muted">
        Classify this item — drag it to a tier
      </p>

      <!-- Draggable card (pull only, no drop back) -->
      <draggable
        v-model="focusItems"
        :group="{ name: 'tieritems', pull: true, put: false }"
        item-key="id"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="drag"
        :animation="200"
        :disabled="isDragDisabled"
        class="flex items-center justify-center"
        @change="onDragChange"
      >
        <template #item="{ element }">
          <div
            class="relative h-56 w-56 cursor-grab rounded-2xl border border-white/10 bg-surface shadow-2xl ring-0 ring-primary/30 transition-all duration-200 hover:scale-[1.03] hover:ring-2 active:cursor-grabbing sm:h-64 sm:w-64"
          >
            <!-- Image mode -->
            <img
              v-if="element.imageUrl"
              :src="element.imageUrl"
              :alt="element.label"
              class="h-full w-full rounded-2xl object-contain"
              draggable="false"
            />

            <!-- Placeholder mode -->
            <div
              v-else
              class="flex h-full w-full items-center justify-center rounded-2xl p-4"
              :style="{
                background: `linear-gradient(135deg, ${getPlaceholderColor(element.id)}30, ${getPlaceholderColor(element.id)}10)`,
              }"
            >
              <span class="text-center text-2xl font-bold leading-tight text-foreground/90">
                {{ element.label }}
              </span>
            </div>

            <!-- Label below image -->
            <div
              v-if="element.imageUrl"
              class="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5"
            >
              <p class="truncate text-center text-sm font-semibold text-white">
                {{ element.label }}
              </p>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Controls -->
      <div class="flex items-center gap-4">
        <button
          v-if="store.isHost"
          class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-white/10 hover:text-foreground"
          @click="store.skipCurrentItem()"
        >
          <SkipForward class="h-4 w-4" />
          Skip / Later
        </button>
      </div>

      <!-- Remaining counter -->
      <p class="text-xs text-foreground-subtle">
        {{ remainingCount }} item{{ remainingCount !== 1 ? 's' : '' }} remaining
      </p>
    </template>
  </div>
</template>
