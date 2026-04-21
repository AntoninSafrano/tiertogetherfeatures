<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import { ArrowLeft, Download, ThumbsUp, Calendar, LayoutGrid, User } from 'lucide-vue-next'
import { API_BASE } from '@/config'

const route = useRoute()
const router = useRouter()

interface ProfileTierList {
  _id: string
  roomId: string
  title: string
  category: string
  coverImage: string
  upvotes: number
  downvotes: number
  downloads: number
  createdAt: string
}

interface ProfileData {
  user: {
    id: string
    displayName: string
    avatar: string
    joinedAt: string
  }
  stats: {
    tierlistCount: number
    totalScore: number
    totalDownloads: number
  }
  tierlists: ProfileTierList[]
}

const profile = ref<ProfileData | null>(null)
const isLoading = ref(true)
const error = ref('')

async function fetchProfile() {
  isLoading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/users/${route.params.id}/profile`)
    if (!res.ok) {
      error.value = res.status === 404 ? 'Utilisateur introuvable' : 'Impossible de charger le profil'
      return
    }
    profile.value = await res.json()
  } catch {
    error.value = 'Impossible de charger le profil'
  } finally {
    isLoading.value = false
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getCategoryColor(cat: string): string {
  const colors: Record<string, string> = {
    Gaming: 'bg-blue-500/20 text-blue-400',
    Food: 'bg-orange-500/20 text-orange-400',
    Anime: 'bg-pink-500/20 text-pink-400',
    Music: 'bg-green-500/20 text-green-400',
    Movies: 'bg-yellow-500/20 text-yellow-400',
    Sports: 'bg-red-500/20 text-red-400',
    Other: 'bg-foreground-subtle/20 text-foreground-muted',
  }
  return colors[cat] || colors.Other!
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    Gaming: 'Jeux video',
    Food: 'Cuisine',
    Anime: 'Anime',
    Music: 'Musique',
    Movies: 'Films',
    Sports: 'Sport',
    Other: 'Autre',
  }
  return labels[cat] || cat
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days}j`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `il y a ${weeks}sem`
  return new Date(dateStr).toLocaleDateString()
}

function formatJoinDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavBar />

    <main class="mx-auto max-w-6xl px-4 sm:px-10 py-8">
      <!-- Back button -->
      <button
        class="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
        @click="router.push({ name: 'explore' })"
      >
        <ArrowLeft class="h-4 w-4" />
        Retour
      </button>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-6">
        <div class="flex items-center gap-5">
          <div class="h-20 w-20 rounded-full bg-surface-hover animate-pulse" />
          <div class="space-y-2 flex-1">
            <div class="h-6 w-48 rounded bg-surface-hover animate-pulse" />
            <div class="h-4 w-32 rounded bg-surface-hover animate-pulse" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="h-20 rounded-xl bg-surface-hover animate-pulse" />
        </div>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div v-for="i in 4" :key="i" class="animate-pulse rounded-xl border border-border bg-surface overflow-hidden">
            <div class="h-36 bg-surface-hover" />
            <div class="p-3.5 space-y-2">
              <div class="h-4 w-3/4 rounded bg-surface-hover" />
              <div class="h-3 w-1/2 rounded bg-surface-hover" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-16">
        <p class="text-foreground-muted text-lg">{{ error }}</p>
        <button
          class="mt-4 rounded-lg bg-surface-hover border border-border-hover px-4 py-2 text-sm text-foreground hover:bg-surface-active transition-colors"
          @click="router.push({ name: 'explore' })"
        >
          Retour
        </button>
      </div>

      <!-- Content -->
      <div v-else-if="profile">
        <!-- User header -->
        <div class="flex items-center gap-5 mb-8">
          <div class="h-20 w-20 rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
            <img
              v-if="profile.user.avatar"
              :src="profile.user.avatar"
              :alt="profile.user.displayName"
              class="h-20 w-20 rounded-full object-cover"
            />
            <span v-else class="text-2xl font-bold text-white">{{ getInitials(profile.user.displayName) }}</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ profile.user.displayName }}</h1>
            <p class="text-sm text-foreground-muted flex items-center gap-1.5 mt-1">
              <Calendar class="h-3.5 w-3.5" />
              Membre depuis {{ formatJoinDate(profile.user.joinedAt) }}
            </p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mb-8">
          <div class="rounded-xl border border-border bg-surface p-4 text-center">
            <div class="flex items-center justify-center gap-1.5 text-foreground-muted mb-1">
              <LayoutGrid class="h-4 w-4" />
            </div>
            <p class="text-2xl font-bold text-foreground">{{ profile.stats.tierlistCount }}</p>
            <p class="text-xs text-foreground-muted">Tier lists</p>
          </div>
          <div class="rounded-xl border border-border bg-surface p-4 text-center">
            <div class="flex items-center justify-center gap-1.5 text-foreground-muted mb-1">
              <ThumbsUp class="h-4 w-4" />
            </div>
            <p class="text-2xl font-bold text-foreground">{{ profile.stats.totalScore }}</p>
            <p class="text-xs text-foreground-muted">Score total</p>
          </div>
          <div class="rounded-xl border border-border bg-surface p-4 text-center">
            <div class="flex items-center justify-center gap-1.5 text-foreground-muted mb-1">
              <Download class="h-4 w-4" />
            </div>
            <p class="text-2xl font-bold text-foreground">{{ profile.stats.totalDownloads }}</p>
            <p class="text-xs text-foreground-muted">Telechargements</p>
          </div>
        </div>

        <!-- Tier lists section -->
        <div>
          <h2 class="text-lg font-bold text-foreground mb-4">Tier lists publiees</h2>

          <div v-if="profile.tierlists.length === 0" class="text-center py-12 rounded-xl border border-border bg-surface">
            <p class="text-foreground-muted">Aucune tier list publiee</p>
          </div>

          <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <article
              v-for="tl in profile.tierlists"
              :key="tl._id"
              class="group relative rounded-xl bg-surface overflow-hidden transition-all duration-300 cursor-pointer border border-transparent hover:border-border-hover"
              @click="router.push({ name: 'tierlist-view', params: { id: tl._id } })"
            >
              <!-- Category badge -->
              <div class="absolute top-2 right-2 z-10">
                <span :class="['rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm', getCategoryColor(tl.category)]">
                  {{ getCategoryLabel(tl.category) }}
                </span>
              </div>

              <!-- Cover -->
              <div class="h-36 bg-gradient-to-br from-surface-hover to-surface overflow-hidden">
                <img
                  v-if="tl.coverImage"
                  :src="tl.coverImage"
                  :alt="tl.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <!-- Info -->
              <div class="p-3.5">
                <h3 class="font-bold text-foreground text-sm line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                  {{ tl.title }}
                </h3>

                <div class="flex items-center justify-between text-[11px] text-foreground-muted">
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-1">
                      <Download class="h-3 w-3" />
                      {{ tl.downloads || 0 }}
                    </div>
                    <div class="flex items-center gap-1">
                      <ThumbsUp class="h-3 w-3" />
                      {{ (tl.upvotes || 0) - (tl.downvotes || 0) }}
                    </div>
                  </div>
                  <span>{{ getRelativeTime(tl.createdAt) }}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
