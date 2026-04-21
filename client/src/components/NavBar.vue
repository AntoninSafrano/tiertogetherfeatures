<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { LogOut } from 'lucide-vue-next'

const router = useRouter()
const { user, fetchUser, logout } = useAuth()

onMounted(() => {
  fetchUser()
})

async function handleLogout() {
  await logout()
  router.push('/')
}
</script>

<template>
  <nav class="sticky top-0 z-40 border-b border-surface bg-background/90 backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-10">
      <!-- Logo -->
      <router-link to="/" class="group">
        <span class="text-xl font-bold tracking-tight"><span class="text-primary">Tier</span><span class="text-foreground">Together</span></span>
      </router-link>

      <!-- Nav links + Auth -->
      <div class="flex items-center gap-6">
        <router-link
          to="/"
          :class="['text-sm transition-colors', router.currentRoute.value.path === '/' ? 'font-semibold text-foreground' : 'font-medium text-foreground-muted hover:text-foreground']"
        >
          Explorer
        </router-link>
        <router-link
          to="/create"
          :class="['text-sm transition-colors', router.currentRoute.value.path === '/create' ? 'font-semibold text-foreground' : 'font-medium text-foreground-muted hover:text-foreground']"
        >
          Créer
        </router-link>

        <!-- Auth -->
        <template v-if="user">
          <div class="flex items-center gap-3 ml-2">
            <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              <img
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.displayName"
                class="h-8 w-8 rounded-full object-cover"
              />
              <span v-else class="text-xs font-bold text-white">{{ user.displayName?.[0]?.toUpperCase() }}</span>
            </div>
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
          <router-link
            to="/auth"
            class="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            Connexion
          </router-link>
        </template>
      </div>
    </div>
  </nav>
</template>
