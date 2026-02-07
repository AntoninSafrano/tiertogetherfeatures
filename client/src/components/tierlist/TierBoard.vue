<script setup lang="ts">
import { useRoomStore } from '@/stores/room'
import TierRow from './TierRow.vue'
import TierPool from './TierPool.vue'

const store = useRoomStore()
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-4">
    <!-- Title -->
    <h2 class="text-center text-2xl font-bold text-foreground">
      {{ store.title }}
    </h2>

    <!-- Tier Rows -->
    <div class="overflow-hidden rounded-lg border border-border">
      <TierRow
        v-for="(row, index) in store.rows"
        :key="row.id"
        :row-index="index"
      />
    </div>

    <!-- Pool -->
    <TierPool />
  </div>
</template>
