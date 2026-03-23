<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Crown, Plus, Hash, LogOut } from 'lucide-vue-next'

const router = useRouter()
const { user, fetchUser, loginWithGoogle, logout } = useAuth()

onMounted(() => {
  fetchUser()
})

async function handleLogout() {
  await logout()
  router.push('/')
}
</script>

<template>
  <nav class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 group">
        <Crown class="h-5 w-5 text-primary transition-transform group-hover:rotate-12" :stroke-width="2.5" />
        <span class="text-lg font-bold tracking-tight text-foreground">TierTogether</span>
      </router-link>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <router-link
          to="/create"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <Plus class="h-4 w-4" />
          Create
        </router-link>

        <router-link
          to="/create"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <Hash class="h-4 w-4" />
          Join
        </router-link>

        <!-- Auth -->
        <template v-if="user">
          <div class="flex items-center gap-2 ml-2">
            <img
              v-if="user.avatar"
              :src="user.avatar"
              :alt="user.displayName"
              class="h-7 w-7 rounded-full border border-border-hover"
            />
            <span class="text-sm text-foreground hidden sm:inline">{{ user.displayName }}</span>
            <button
              class="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              @click="handleLogout"
              title="Logout"
            >
              <LogOut class="h-4 w-4" />
            </button>
          </div>
        </template>
        <template v-else>
          <button
            class="rounded-lg bg-surface-hover border border-border-hover px-3 py-1.5 text-sm text-foreground hover:bg-surface-active hover:text-foreground transition-all"
            @click="loginWithGoogle"
          >
            Sign in
          </button>
        </template>
      </div>
    </div>
  </nav>
</template>
