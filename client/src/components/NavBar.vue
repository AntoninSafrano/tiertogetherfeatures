<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { Menu, X } from 'lucide-vue-next'

const router = useRouter()
const { user, fetchUser } = useAuth()
const mobileMenuOpen = ref(false)

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <nav class="sticky top-0 z-40 border-b border-surface bg-background/90 backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-10">
      <!-- Logo -->
      <router-link to="/" class="group">
        <span class="text-xl font-bold tracking-tight"><span class="text-primary">Tier</span><span class="text-foreground">Together</span></span>
      </router-link>

      <!-- Desktop nav links + Auth -->
      <div class="hidden sm:flex items-center gap-6">
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
          <router-link
            :to="{ name: 'me' }"
            class="flex items-center gap-2 ml-2 rounded-full pl-1 pr-3 py-1 hover:bg-surface-hover transition-colors"
            title="Mon profil"
          >
            <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary/30">
              <img
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.displayName"
                class="h-8 w-8 rounded-full object-cover"
                referrerpolicy="no-referrer"
              />
              <span v-else class="text-xs font-bold text-white">{{ user.displayName?.[0]?.toUpperCase() }}</span>
            </div>
            <span class="text-sm font-medium text-foreground max-w-[140px] truncate">{{ user.displayName }}</span>
          </router-link>
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

      <!-- Mobile hamburger button -->
      <button @click="mobileMenuOpen = !mobileMenuOpen" class="sm:hidden p-2 text-foreground-muted hover:text-foreground">
        <component :is="mobileMenuOpen ? X : Menu" class="h-5 w-5" />
      </button>
    </div>

    <!-- Mobile dropdown menu -->
    <div v-if="mobileMenuOpen" class="sm:hidden border-t border-border bg-background/95 backdrop-blur-sm">
      <div class="flex flex-col px-4 py-3 gap-1">
        <router-link
          to="/"
          @click="mobileMenuOpen = false"
          :class="['block rounded-lg px-3 py-2 text-sm transition-colors', router.currentRoute.value.path === '/' ? 'font-semibold text-foreground bg-surface-hover' : 'font-medium text-foreground-muted hover:text-foreground hover:bg-surface-hover']"
        >
          Explorer
        </router-link>
        <router-link
          to="/create"
          @click="mobileMenuOpen = false"
          :class="['block rounded-lg px-3 py-2 text-sm transition-colors', router.currentRoute.value.path === '/create' ? 'font-semibold text-foreground bg-surface-hover' : 'font-medium text-foreground-muted hover:text-foreground hover:bg-surface-hover']"
        >
          Créer
        </router-link>
        <!-- Auth (mobile) -->
        <template v-if="user">
          <router-link
            :to="{ name: 'me' }"
            @click="mobileMenuOpen = false"
            class="flex items-center gap-3 rounded-lg px-3 py-2 mt-1 border-t border-border pt-3 transition-colors hover:bg-surface-hover"
          >
            <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              <img
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.displayName"
                class="h-8 w-8 rounded-full object-cover"
                referrerpolicy="no-referrer"
              />
              <span v-else class="text-xs font-bold text-white">{{ user.displayName?.[0]?.toUpperCase() }}</span>
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-foreground">{{ user.displayName }}</p>
              <p class="text-[11px] text-foreground-muted">Voir mon profil</p>
            </div>
          </router-link>
        </template>
        <template v-else>
          <router-link
            to="/auth"
            @click="mobileMenuOpen = false"
            class="block mt-1 rounded-full bg-primary px-5 py-2 text-center text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            Connexion
          </router-link>
        </template>
      </div>
    </div>
  </nav>
</template>
