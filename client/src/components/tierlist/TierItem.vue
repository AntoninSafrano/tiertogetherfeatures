<script setup lang="ts">
import type { TierItem } from '@tiertogether/shared'
import { getPlaceholderColor } from '@/lib/utils'

const props = defineProps<{
  item: TierItem
}>()
</script>

<template>
  <div
    class="tier-item group relative aspect-square w-[72px] sm:w-[92px] cursor-grab rounded-lg border border-border-hover bg-black shadow-lg ring-0 ring-white/25 transition-[box-shadow,border-color] duration-200 hover:ring-1 hover:shadow-xl hover:border-primary/40 active:cursor-grabbing overflow-hidden"
  >
    <!-- Image mode -->
    <img
      v-if="item.imageUrl"
      :src="item.imageUrl"
      :alt="item.label"
      class="h-full w-full rounded-lg object-cover"
      draggable="false"
    />

    <!-- Placeholder mode — sign-like panel with label -->
    <div
      v-else
      class="flex h-full w-full items-center justify-center rounded-lg p-1.5"
      :style="{
        boxShadow: `inset 0 0 0 1.5px ${getPlaceholderColor(item.id)}80`,
        background: `linear-gradient(135deg, ${getPlaceholderColor(item.id)}15, #000000)`,
      }"
    >
      <span class="text-center text-[11px] sm:text-xs font-bold leading-tight text-white">
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
