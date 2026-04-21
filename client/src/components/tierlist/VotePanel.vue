<script setup lang="ts">
import { computed } from 'vue'
import { useRoomStore } from '@/stores/room'
import { getPlaceholderColor } from '@/lib/utils'
import { Check, Trophy, Users, Timer } from 'lucide-vue-next'

const store = useRoomStore()

// The item currently being voted on
const voteItem = computed(() => {
  if (!store.currentVoteItem) return null
  return store.pool.find((i) => i.id === store.currentVoteItem) ?? null
})

// Remaining items in pool (excluding current vote item)
const remainingCount = computed(() => Math.max(0, store.pool.length - 1))

// Winner row details (for result animation)
const winnerRow = computed(() => {
  if (!store.voteWinner) return null
  return store.rows.find((r) => r.id === store.voteWinner!.winnerRowId) ?? null
})

function getVoteCount(rowId: string): number {
  return store.voteResults[rowId] ?? 0
}

// Maximum votes for any row (for progress bar scaling)
const maxVotes = computed(() => {
  const counts = Object.values(store.voteResults)
  return counts.length > 0 ? Math.max(...counts) : 0
})

// Timer progress (0 to 1)
const timerProgress = computed(() => {
  return Math.max(0, store.voteTimeLeft / 30)
})

const timerColor = computed(() => {
  if (store.voteTimeLeft <= 5) return '#ef4444'   // red
  if (store.voteTimeLeft <= 10) return '#f97316'  // orange
  return '#10b981'                                  // emerald
})
</script>

<template>
  <div class="flex flex-col items-center gap-6 py-4 sm:py-8">
    <!-- All items voted -->
    <template v-if="store.pool.length === 0 && !store.voteWinner">
      <div class="flex flex-col items-center gap-3 py-12">
        <Trophy class="h-16 w-16 text-emerald-400" />
        <p class="text-xl font-bold text-foreground">Tous les elements ont ete votes !</p>
        <p class="text-sm text-foreground-muted">Le mode vote est termine.</p>
      </div>
    </template>

    <!-- Vote result animation -->
    <template v-else-if="store.voteWinner && winnerRow">
      <div class="flex flex-col items-center gap-4 animate-pulse">
        <Trophy class="h-10 w-10 text-yellow-400" />
        <p class="text-lg font-bold text-foreground">Resultat du vote</p>
        <div
          class="flex items-center gap-3 rounded-xl px-6 py-3 text-lg font-bold shadow-lg"
          :style="{ backgroundColor: winnerRow.color + '30', color: winnerRow.color, border: '2px solid ' + winnerRow.color }"
        >
          <span>{{ winnerRow.label }}</span>
        </div>
        <p class="text-xs text-foreground-subtle">Prochain element dans un instant...</p>
      </div>
    </template>

    <!-- Active vote -->
    <template v-else-if="voteItem">
      <!-- Header -->
      <div class="flex items-center gap-2 text-sm font-medium text-emerald-400">
        <Users class="h-4 w-4" />
        <span>{{ store.votedCount }}/{{ store.totalVoters }} joueurs ont vote</span>
      </div>

      <!-- Countdown timer -->
      <div v-if="store.voteTimeLeft > 0" class="flex items-center gap-3">
        <div class="relative h-12 w-12">
          <!-- Background circle -->
          <svg class="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24" cy="24" r="20"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="text-surface-hover"
            />
            <circle
              cx="24" cy="24" r="20"
              fill="none"
              :stroke="timerColor"
              stroke-width="3"
              stroke-linecap="round"
              :stroke-dasharray="125.66"
              :stroke-dashoffset="125.66 * (1 - timerProgress)"
              class="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span
            class="absolute inset-0 flex items-center justify-center text-sm font-bold"
            :style="{ color: timerColor }"
          >
            {{ store.voteTimeLeft }}
          </span>
        </div>
        <span class="text-xs text-foreground-muted">secondes restantes</span>
      </div>

      <!-- Item card -->
      <div
        class="relative h-44 w-44 sm:h-56 sm:w-56 rounded-2xl border-2 border-emerald-500/30 bg-surface shadow-2xl ring-0 ring-emerald-500/20 md:h-64 md:w-64"
      >
        <!-- Image mode -->
        <img
          v-if="voteItem.imageUrl"
          :src="voteItem.imageUrl"
          :alt="voteItem.label"
          class="h-full w-full rounded-2xl object-contain"
          draggable="false"
        />

        <!-- Placeholder mode -->
        <div
          v-else
          class="flex h-full w-full items-center justify-center rounded-2xl p-4"
          :style="{
            background: `linear-gradient(135deg, ${getPlaceholderColor(voteItem.id)}30, ${getPlaceholderColor(voteItem.id)}10)`,
          }"
        >
          <span class="text-center text-2xl font-bold leading-tight text-foreground/90">
            {{ voteItem.label }}
          </span>
        </div>

        <!-- Label below image -->
        <div
          v-if="voteItem.imageUrl"
          class="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5"
        >
          <p class="truncate text-center text-sm font-semibold text-white">
            {{ voteItem.label }}
          </p>
        </div>
      </div>

      <!-- Instruction -->
      <p class="text-sm text-foreground-muted">
        {{ store.hasVoted ? 'En attente des autres joueurs...' : 'Cliquez sur un tier pour voter' }}
      </p>

      <!-- Tier row buttons -->
      <div class="w-full max-w-lg space-y-2">
        <button
          v-for="row in store.rows"
          :key="row.id"
          :disabled="store.hasVoted"
          class="group flex w-full items-center gap-3 rounded-lg border border-border-hover bg-surface/50 px-4 py-3 text-left transition-all duration-200 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
          :class="store.hasVoted ? 'cursor-default' : 'cursor-pointer hover:border-white/20 hover:bg-surface-hover'"
          @click="store.castVote(row.id)"
        >
          <!-- Tier label badge -->
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-md"
            :style="{ backgroundColor: row.color }"
          >
            {{ row.label }}
          </div>

          <!-- Vote bar -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-foreground">{{ row.label }}</span>
              <span v-if="getVoteCount(row.id) > 0" class="text-xs font-mono text-foreground-muted">
                {{ getVoteCount(row.id) }} vote{{ getVoteCount(row.id) !== 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Progress bar -->
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                class="h-full rounded-full transition-all duration-500 ease-out"
                :style="{
                  width: maxVotes > 0 ? `${(getVoteCount(row.id) / maxVotes) * 100}%` : '0%',
                  backgroundColor: row.color,
                }"
              />
            </div>
          </div>

          <!-- Check mark if has votes -->
          <Check
            v-if="getVoteCount(row.id) > 0"
            class="h-4 w-4 shrink-0 text-foreground-muted"
          />
        </button>
      </div>

      <!-- Remaining counter -->
      <p class="text-xs text-foreground-subtle">
        {{ remainingCount }} element{{ remainingCount !== 1 ? 's' : '' }} restant{{ remainingCount !== 1 ? 's' : '' }}
      </p>
    </template>

    <!-- Waiting for vote to start -->
    <template v-else>
      <div class="flex flex-col items-center gap-3 py-8">
        <Users class="h-10 w-10 text-foreground-muted animate-pulse" />
        <p class="text-sm text-foreground-muted">En attente du debut du vote...</p>
      </div>
    </template>
  </div>
</template>
