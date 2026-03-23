<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoomStore } from '@/stores/room'
import { Users, X, Crown } from 'lucide-vue-next'

const store = useRoomStore()
const isOpen = ref(false)

// Sort users: host first, then alphabetical
const sortedUsers = computed(() => {
  const hostId = store.currentRoom?.hostId
  return [...store.users].sort((a, b) => {
    if (a.id === hostId) return -1
    if (b.id === hostId) return 1
    return a.username.localeCompare(b.username)
  })
})

function toggle() {
  isOpen.value = !isOpen.value
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}
</script>

<template>
  <!-- Closed tab -->
  <button
    v-if="!isOpen"
    class="fixed left-0 top-1/2 z-40 -translate-y-1/2 rounded-r-lg border border-l-0 border-border-hover bg-surface/90 px-2 py-4 backdrop-blur-sm transition-colors hover:bg-surface-hover"
    @click="toggle"
  >
    <div class="flex flex-col items-center gap-2">
      <Users class="h-4 w-4 text-foreground-muted" />
      <span class="text-[10px] font-bold tracking-widest text-foreground-muted uppercase [writing-mode:vertical-lr]">
        Users
      </span>
      <span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/80 px-1 text-[10px] font-bold text-white">
        {{ store.users.length }}
      </span>
    </div>
  </button>

  <!-- Open panel -->
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="-translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-200 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="-translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed left-0 top-0 z-50 flex h-full w-full sm:w-72 flex-col border-r border-border-hover bg-background/95 backdrop-blur-md"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border-hover px-4 py-3">
        <div class="flex items-center gap-2">
          <Users class="h-4 w-4 text-primary" />
          <span class="font-mono text-xs font-bold tracking-wider text-foreground uppercase">Collaborators</span>
          <span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-bold text-primary">
            {{ store.users.length }}
          </span>
        </div>
        <button
          class="rounded-md p-1 text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          @click="toggle"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- User List -->
      <div class="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div v-if="sortedUsers.length === 0" class="flex h-full items-center justify-center">
          <p class="text-xs text-foreground-subtle">No users connected</p>
        </div>

        <div
          v-for="u in sortedUsers"
          :key="u.id"
          class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface/20"
        >
          <!-- Avatar -->
          <div class="relative flex-shrink-0">
            <!-- Google avatar -->
            <img
              v-if="u.avatar"
              :src="u.avatar"
              :alt="u.username"
              class="h-8 w-8 rounded-full object-cover"
              referrerpolicy="no-referrer"
            />
            <!-- Guest initials -->
            <div
              v-else
              class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              :style="{ backgroundColor: u.color }"
            >
              {{ getInitials(u.username) }}
            </div>
            <!-- Online dot -->
            <span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
          </div>

          <!-- Name + role -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="truncate text-sm font-medium text-foreground">
                {{ u.username }}
              </span>
              <Crown
                v-if="u.id === store.currentRoom?.hostId"
                class="h-3.5 w-3.5 flex-shrink-0 text-yellow-500"
              />
            </div>
            <span class="text-[10px] text-foreground-muted">
              {{ u.isGuest ? 'Guest' : 'Google' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
