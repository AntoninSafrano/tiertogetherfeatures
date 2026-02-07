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
    <h2 class="text-center text-3xl font-extrabold tracking-tight text-foreground">
      {{ store.title }}
    </h2>

    <!-- Toolbar -->
    <TierToolbar />

    <!-- Tier Rows -->
    <div id="tier-rows-container" class="overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      <TierRow
        v-for="(row, index) in store.rows"
        :key="row.id"
        :row-index="index"
      />
    </div>

    <!-- Staging Area: Upload + Pool -->
    <div class="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <ImageUploader />
      <div class="border-t border-white/5" />
      <TierPool />
    </div>
  </div>
</template>
