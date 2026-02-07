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
    class="tier-item group relative aspect-square w-[76px] cursor-grab overflow-hidden rounded-lg border border-white/10 bg-surface shadow-lg transition-all duration-200 hover:scale-105 hover:border-white/25 hover:shadow-xl active:cursor-grabbing"
  >
    <!-- Image mode -->
    <img
      v-if="item.imageUrl"
      :src="item.imageUrl"
      :alt="item.label"
      class="h-full w-full object-cover"
      draggable="false"
    />

    <!-- Placeholder mode -->
    <div
      v-else
      class="flex h-full w-full items-center justify-center p-1.5"
      :style="{
        background: `linear-gradient(135deg, ${getPlaceholderColor(item.id)}30, ${getPlaceholderColor(item.id)}10)`,
      }"
    >
      <span class="text-center text-[10px] font-semibold leading-tight text-foreground/90">
        {{ item.label }}
      </span>
    </div>

    <!-- Tooltip on hover -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 bg-black/80 px-1.5 py-0.5 text-center text-[9px] font-medium text-white opacity-0 backdrop-blur-sm transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100"
    >
      {{ item.label }}
    </div>
  </div>
</template>
