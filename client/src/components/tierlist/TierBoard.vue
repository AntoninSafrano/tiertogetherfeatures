<script setup lang="ts">
import { useRoomStore } from '@/stores/room'
import TierRow from './TierRow.vue'
import TierPool from './TierPool.vue'
import TierToolbar from './TierToolbar.vue'
import ImageUploader from './ImageUploader.vue'
import FocusView from './FocusView.vue'
import VotePanel from './VotePanel.vue'
import { Plus } from 'lucide-vue-next'

const store = useRoomStore()
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-6">
    <!-- Title -->
    <h2 class="text-center text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
      {{ store.title }}
    </h2>

    <!-- Toolbar -->
    <TierToolbar />

    <!-- Tier Rows — space-y creates a thin dead zone between rows so
         SortableJS won't oscillate which tier the cursor is over when
         hovering exactly on a boundary. -->
    <div id="tier-rows-container" class="overflow-x-clip overflow-y-visible rounded-xl border border-border-hover shadow-2xl bg-background space-y-0.5">
      <TierRow
        v-for="(row, index) in store.rows"
        :key="row.id"
        :row-index="index"
      />
    </div>

    <!-- Add Row Button -->
    <button
      class="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border-hover py-2 text-sm text-foreground-muted hover:text-primary hover:border-primary/30 transition-all duration-300"
      @click="store.addRow()"
    >
      <Plus class="h-4 w-4" />
      Ajouter un Tier
    </button>

    <!-- Vote Mode / Focus Mode / Staging Area -->
    <Transition name="fade" mode="out-in">
      <div v-if="store.isVoteMode" key="vote" class="rounded-xl border border-emerald-500/20 bg-surface/20">
        <VotePanel />
      </div>
      <div v-else-if="store.isFocusMode" key="focus" class="rounded-xl border border-border-hover bg-surface/20">
        <FocusView />
      </div>
      <div v-else key="pool" class="overflow-hidden rounded-xl border border-border-hover bg-surface/20">
        <ImageUploader />
        <div class="border-t border-border" />
        <TierPool />
      </div>
    </Transition>
  </div>
</template>
