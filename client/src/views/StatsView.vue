<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import { TrendingUp, Download, Users, LayoutGrid, BarChart3 } from 'lucide-vue-next'
import { API_BASE } from '@/config'

const router = useRouter()

interface StatsTierList {
  _id: string
  title: string
  category: string
  coverImage?: string
  upvotes: number
  downvotes: number
  downloads: number
  roomId: string
}

interface StatsData {
  totalTierlists: number
  totalUsers: number
  trending: StatsTierList[]
  topDownloaded: StatsTierList[]
  categories: { _id: string; count: number }[]
}

const stats = ref<StatsData | null>(null)
const isLoading = ref(true)
const error = ref('')

const maxCategoryCount = computed(() => {
  if (!stats.value?.categories.length) return 1
  return Math.max(...stats.value.categories.map(c => c.count))
})

async function fetchStats() {
  isLoading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/stats`)
    if (!res.ok) {
      error.value = 'Impossible de charger les statistiques'
      return
    }
    stats.value = await res.json()
  } catch {
    error.value = 'Erreur de connexion au serveur'
  } finally {
    isLoading.value = false
  }
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

function getCategoryColor(cat: string): string {
  const colors: Record<string, string> = {
    Gaming: 'bg-blue-500',
    Food: 'bg-orange-500',
    Anime: 'bg-pink-500',
    Music: 'bg-green-500',
    Movies: 'bg-yellow-500',
    Sports: 'bg-red-500',
    Other: 'bg-gray-500',
  }
  return colors[cat] || 'bg-gray-500'
}

function getCategoryBadgeColor(cat: string): string {
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

function viewTierlist(id: string) {
  router.push({ name: 'tierlist-view', params: { id } })
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavBar />

    <main class="mx-auto max-w-6xl px-4 sm:px-10 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-[40px] font-bold tracking-tight text-foreground mb-2">STATISTIQUES</h1>
        <p class="text-base text-foreground-muted">Chiffres et tendances de la communaute TierTogether</p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-6">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="h-24 rounded-xl bg-surface-hover animate-pulse" />
        </div>
        <div class="h-64 rounded-xl bg-surface-hover animate-pulse" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-16">
        <p class="text-foreground-muted text-lg">{{ error }}</p>
        <button
          class="mt-4 rounded-lg bg-surface-hover border border-border-hover px-4 py-2 text-sm text-foreground hover:bg-surface-active transition-colors"
          @click="fetchStats"
        >
          Reessayer
        </button>
      </div>

      <!-- Stats content -->
      <template v-else-if="stats">
        <!-- Summary cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-primary/10 p-2">
                <LayoutGrid class="h-5 w-5 text-primary" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Tier lists</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.totalTierlists }}</p>
          </div>

          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-emerald-500/10 p-2">
                <Users class="h-5 w-5 text-emerald-400" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Utilisateurs</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.totalUsers }}</p>
          </div>

          <div class="rounded-xl border border-border-hover bg-surface p-5 col-span-2 sm:col-span-1">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-purple-500/10 p-2">
                <BarChart3 class="h-5 w-5 text-purple-400" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Categories</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.categories.length }}</p>
          </div>
        </div>

        <!-- Trending this week -->
        <section class="mb-10">
          <div class="flex items-center gap-2 mb-5">
            <TrendingUp class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-bold text-foreground">Tendances de la semaine</h2>
          </div>

          <div v-if="stats.trending.length === 0" class="rounded-xl border border-border-hover bg-surface p-8 text-center">
            <p class="text-foreground-muted">Aucune tier list publiee cette semaine</p>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <article
              v-for="tl in stats.trending"
              :key="tl._id"
              class="group rounded-xl bg-surface overflow-hidden transition-all duration-300 cursor-pointer border border-transparent hover:border-border-hover"
              @click="viewTierlist(tl._id)"
            >
              <div class="h-32 bg-gradient-to-br from-surface-hover to-surface overflow-hidden relative">
                <img
                  v-if="tl.coverImage"
                  :src="tl.coverImage"
                  :alt="tl.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div class="absolute top-2 right-2">
                  <span :class="['rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm', getCategoryBadgeColor(tl.category)]">
                    {{ getCategoryLabel(tl.category) }}
                  </span>
                </div>
              </div>
              <div class="p-3.5">
                <h3 class="font-bold text-foreground text-sm line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                  {{ tl.title }}
                </h3>
                <div class="flex items-center gap-3 text-[11px] text-foreground-muted">
                  <span class="flex items-center gap-1">
                    <Download class="h-3 w-3" />
                    {{ tl.downloads || 0 }}
                  </span>
                  <span class="text-xs font-medium">{{ (tl.upvotes || 0) - (tl.downvotes || 0) }} votes</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Most downloaded all time -->
        <section class="mb-10">
          <div class="flex items-center gap-2 mb-5">
            <Download class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-bold text-foreground">Les plus telechargees</h2>
          </div>

          <div v-if="stats.topDownloaded.length === 0" class="rounded-xl border border-border-hover bg-surface p-8 text-center">
            <p class="text-foreground-muted">Aucune tier list publiee</p>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <article
              v-for="tl in stats.topDownloaded"
              :key="tl._id"
              class="group rounded-xl bg-surface overflow-hidden transition-all duration-300 cursor-pointer border border-transparent hover:border-border-hover"
              @click="viewTierlist(tl._id)"
            >
              <div class="h-32 bg-gradient-to-br from-surface-hover to-surface overflow-hidden relative">
                <img
                  v-if="tl.coverImage"
                  :src="tl.coverImage"
                  :alt="tl.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div class="absolute top-2 right-2">
                  <span :class="['rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm', getCategoryBadgeColor(tl.category)]">
                    {{ getCategoryLabel(tl.category) }}
                  </span>
                </div>
              </div>
              <div class="p-3.5">
                <h3 class="font-bold text-foreground text-sm line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                  {{ tl.title }}
                </h3>
                <div class="flex items-center gap-3 text-[11px] text-foreground-muted">
                  <span class="flex items-center gap-1">
                    <Download class="h-3 w-3" />
                    {{ tl.downloads || 0 }}
                  </span>
                  <span class="text-xs font-medium">{{ (tl.upvotes || 0) - (tl.downvotes || 0) }} votes</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Category breakdown -->
        <section class="mb-10">
          <div class="flex items-center gap-2 mb-5">
            <BarChart3 class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-bold text-foreground">Repartition par categorie</h2>
          </div>

          <div class="rounded-xl border border-border-hover bg-surface p-6">
            <div
              v-for="cat in stats.categories"
              :key="cat._id"
              class="flex items-center gap-4 mb-3 last:mb-0"
            >
              <span class="text-sm font-medium text-foreground w-24 shrink-0 text-right">
                {{ getCategoryLabel(cat._id) }}
              </span>
              <div class="flex-1 h-7 rounded-lg bg-surface-hover overflow-hidden">
                <div
                  :class="['h-full rounded-lg transition-all duration-500', getCategoryColor(cat._id)]"
                  :style="{ width: `${Math.max((cat.count / maxCategoryCount) * 100, 4)}%` }"
                />
              </div>
              <span class="text-sm font-bold text-foreground w-10 text-right tabular-nums">
                {{ cat.count }}
              </span>
            </div>

            <div v-if="stats.categories.length === 0" class="text-center py-4">
              <p class="text-foreground-muted text-sm">Aucune categorie</p>
            </div>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
