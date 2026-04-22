<script setup lang="ts">
import { computed } from 'vue'
import type { TierItem } from '@tiertogether/shared'
import { getPlaceholderColor } from '@/lib/utils'

const props = defineProps<{
  item: TierItem
}>()

// TierMaker-style: render the image as a CSS background on the square
// container instead of an <img> child, so object-fit behaves consistently
// and rounded corners never leak a hair of the surface color.
const backgroundStyle = computed(() => {
  if (!props.item.imageUrl) return undefined
  const safe = props.item.imageUrl.replace(/'/g, '%27')
  return {
    backgroundImage: `url('${safe}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } as const
})
</script>

<template>
  <div
    class="tier-item group relative aspect-square w-[68px] sm:w-[80px] cursor-grab rounded-md border border-border-hover bg-transparent shadow-md transition-[box-shadow,border-color] duration-150 hover:border-primary/50 hover:shadow-lg active:cursor-grabbing overflow-hidden"
    :style="backgroundStyle"
    role="img"
    :aria-label="item.label"
  >
    <!-- Placeholder mode — sign-like panel with label (only when no image) -->
    <div
      v-if="!item.imageUrl"
      class="flex h-full w-full items-center justify-center rounded-md p-1.5"
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
