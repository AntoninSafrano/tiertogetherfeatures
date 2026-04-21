<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { LogOut, Menu, X, Trash2 } from 'lucide-vue-next'
import { API_BASE } from '@/config'

const router = useRouter()
const { user, fetchUser, logout } = useAuth()
const mobileMenuOpen = ref(false)

onMounted(() => {
  fetchUser()
})

async function handleLogout() {
  await logout()
  router.push('/')
}

const showDeleteConfirm = ref(false)

async function deleteAccount() {
  try {
    const res = await fetch(`${API_BASE}/auth/account`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      showDeleteConfirm.value = false
      await logout()
      router.push('/')
    }
  } catch (err) {
    console.error('Failed to delete account:', err)
  }
}
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
        <router-link
          to="/stats"
          :class="['text-sm transition-colors', router.currentRoute.value.path === '/stats' ? 'font-semibold text-foreground' : 'font-medium text-foreground-muted hover:text-foreground']"
        >
          Stats
        </router-link>

        <!-- Auth -->
        <template v-if="user">
          <div class="relative group/user flex items-center gap-3 ml-2">
            <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center overflow-hidden cursor-pointer">
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
            <!-- Dropdown -->
            <div class="absolute right-0 top-full mt-1 hidden group-hover/user:block w-48 rounded-lg border border-border-hover bg-surface shadow-xl z-50">
              <button
                class="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                @click="showDeleteConfirm = true"
              >
                <Trash2 class="h-3.5 w-3.5" />
                Supprimer mon compte
              </button>
            </div>
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
        <router-link
          to="/stats"
          @click="mobileMenuOpen = false"
          :class="['block rounded-lg px-3 py-2 text-sm transition-colors', router.currentRoute.value.path === '/stats' ? 'font-semibold text-foreground bg-surface-hover' : 'font-medium text-foreground-muted hover:text-foreground hover:bg-surface-hover']"
        >
          Stats
        </router-link>

        <!-- Auth (mobile) -->
        <template v-if="user">
          <div class="flex items-center gap-3 px-3 py-2 mt-1 border-t border-border pt-3">
            <div class="h-8 w-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              <img
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.displayName"
                class="h-8 w-8 rounded-full object-cover"
              />
              <span v-else class="text-xs font-bold text-white">{{ user.displayName?.[0]?.toUpperCase() }}</span>
            </div>
            <span class="text-sm font-medium text-foreground">{{ user.displayName }}</span>
            <button
              class="ml-auto p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              @click="handleLogout(); mobileMenuOpen = false"
              title="Logout"
            >
              <LogOut class="h-4 w-4" />
            </button>
          </div>
          <button
            class="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            @click="showDeleteConfirm = true; mobileMenuOpen = false"
          >
            <Trash2 class="h-3.5 w-3.5" />
            Supprimer mon compte
          </button>
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

  <!-- Delete account confirmation modal -->
  <Teleport to="body">
    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showDeleteConfirm = false">
      <div class="mx-4 w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <p class="text-sm font-medium text-foreground">Supprimer votre compte ?</p>
        <p class="mt-2 text-xs text-foreground-muted">Toutes vos tier lists seront supprimées. Cette action est irréversible.</p>
        <div class="mt-4 flex justify-end gap-3">
          <button class="rounded-lg px-4 py-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover transition-colors" @click="showDeleteConfirm = false">Annuler</button>
          <button class="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors" @click="deleteAccount">Supprimer</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
