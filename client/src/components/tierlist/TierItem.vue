<script setup lang="ts">
import type { TierItem } from '@tiertogether/shared'

const props = defineProps<{
  item: TierItem
}>()

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
</script>

<template>
  <div
    class="tier-item group relative aspect-square w-[60px] sm:w-[76px] cursor-grab rounded-lg border border-border-hover bg-surface shadow-lg ring-0 ring-white/25 transition-all duration-200 hover:scale-105 hover:ring-1 hover:shadow-xl active:cursor-grabbing"
  >
    <!-- Image mode -->
    <img
      v-if="item.imageUrl"
      :src="item.imageUrl"
      :alt="item.label"
      class="h-full w-full rounded-lg object-cover"
      draggable="false"
    />

    <!-- Placeholder mode -->
    <div
      v-else
      class="flex h-full w-full items-center justify-center rounded-lg p-1.5"
      :style="{
        background: `linear-gradient(135deg, ${getPlaceholderColor(item.id)}30, ${getPlaceholderColor(item.id)}10)`,
      }"
    >
      <span class="text-center text-[10px] font-semibold leading-tight text-foreground/90">
        {{ item.label }}
      </span>
    </div>

    <!-- Tooltip above item -->
    <div
      class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100"
    >
      {{ item.label }}
    </div>
  </div>
</template>
