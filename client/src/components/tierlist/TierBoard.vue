<script setup lang="ts">
import { useRoomStore } from '@/stores/room'
import TierRow from './TierRow.vue'
import TierPool from './TierPool.vue'
import TierToolbar from './TierToolbar.vue'
import ImageUploader from './ImageUploader.vue'

const store = useRoomStore()
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-6">
    <!-- Title -->
    <h2 class="text-center font-display text-4xl font-bold tracking-wide text-foreground uppercase">
      {{ store.title }}
    </h2>

    <!-- Toolbar -->
    <TierToolbar />

    <!-- Tier Rows with ambient glow -->
    <div class="relative">
      <!-- Glow behind the tier board -->
      <div class="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-2xl" />

      <div id="tier-rows-container" class="overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50">
        <TierRow
          v-for="(row, index) in store.rows"
          :key="row.id"
          :row-index="index"
        />
      </div>
    </div>

    <!-- Unified Staging Area: Upload + Pool -->
    <div class="glass overflow-hidden rounded-xl">
      <!-- Upload zone -->
      <ImageUploader />

      <!-- Divider -->
      <div class="mx-4 border-t border-white/5" />

      <!-- Pool -->
      <TierPool />
    </div>
  </div>
</template>
