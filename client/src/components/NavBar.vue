<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Layers, Plus, Hash, LogOut } from 'lucide-vue-next'

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
  <nav class="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 group">
        <Layers class="h-5 w-5 text-primary transition-transform group-hover:rotate-12" :stroke-width="2.5" />
        <span class="text-lg font-bold tracking-tight text-white">TierTogether</span>
      </router-link>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <router-link
          to="/create"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Plus class="h-4 w-4" />
          Create
        </router-link>

        <router-link
          to="/create"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
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
              class="h-7 w-7 rounded-full border border-white/10"
            />
            <span class="text-sm text-zinc-300 hidden sm:inline">{{ user.displayName }}</span>
            <button
              class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
              @click="handleLogout"
              title="Logout"
            >
              <LogOut class="h-4 w-4" />
            </button>
          </div>
        </template>
        <template v-else>
          <button
            class="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
            @click="loginWithGoogle"
          >
            Sign in
          </button>
        </template>
      </div>
    </div>
  </nav>
</template>
