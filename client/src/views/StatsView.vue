<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import {
  Shield, Users, LayoutGrid, Download, ThumbsUp, TrendingUp,
  BarChart3, UserPlus, Calendar, Mail, Chrome, CheckCircle
} from 'lucide-vue-next'
import { API_BASE } from '@/config'
import { getCategoryBadgeColor, getCategorySolidColor } from '@/lib/utils'

const router = useRouter()

interface Overview {
  totalTierlists: number
  publicTierlists: number
  privateTierlists: number
  totalUsers: number
  googleUsers: number
  emailUsers: number
  verifiedUsers: number
  totalDownloads: number
  totalVotes: number
  newUsersToday: number
  newUsersWeek: number
  newTierlistsToday: number
  newTierlistsWeek: number
}

interface StatsTierList {
  _id: string
  title: string
  category: string
  coverImage?: string
  upvotes: number
  downvotes: number
  downloads: number
  roomId: string
  authorId?: string
  createdAt: string
}

interface RecentUser {
  _id: string
  displayName: string
  email: string
  avatar?: string
  authProvider: string
  emailVerified: boolean
  createdAt: string
}

interface GrowthEntry {
  _id: string
  count: number
}

interface CategoryEntry {
  _id: string
  count: number
  totalDownloads: number
}

interface TopAuthor {
  _id: string
  displayName: string
  count: number
  totalDownloads: number
}

interface StatsData {
  overview: Overview
  trending: StatsTierList[]
  topDownloaded: StatsTierList[]
  topVoted: StatsTierList[]
  categories: CategoryEntry[]
  recentUsers: RecentUser[]
  userGrowth: GrowthEntry[]
  tierlistGrowth: GrowthEntry[]
  topAuthors: TopAuthor[]
}

const stats = ref<StatsData | null>(null)
const isLoading = ref(true)
const error = ref('')
const accessDenied = ref(false)

const maxCategoryCount = computed(() => {
  if (!stats.value?.categories.length) return 1
  return Math.max(...stats.value.categories.map(c => c.count))
})

const maxCategoryDownloads = computed(() => {
  if (!stats.value?.categories.length) return 1
  return Math.max(...stats.value.categories.map(c => c.totalDownloads))
})

const maxUserGrowth = computed(() => {
  if (!stats.value?.userGrowth.length) return 1
  return Math.max(...stats.value.userGrowth.map(g => g.count))
})

const maxTierlistGrowth = computed(() => {
  if (!stats.value?.tierlistGrowth.length) return 1
  return Math.max(...stats.value.tierlistGrowth.map(g => g.count))
})

async function fetchStats() {
  isLoading.value = true
  error.value = ''
  accessDenied.value = false
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/stats`, { credentials: 'include' })
    if (res.status === 401 || res.status === 403) {
      accessDenied.value = true
      return
    }
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

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatShortDate(d: string): string {
  const date = new Date(d)
  return `${date.getDate()}/${date.getMonth() + 1}`
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

    <main class="mx-auto max-w-7xl px-4 sm:px-10 py-8">

      <!-- Access denied -->
      <div v-if="accessDenied" class="flex flex-col items-center justify-center py-32">
        <Shield class="h-16 w-16 text-red-400 mb-4" />
        <h1 class="text-2xl font-bold text-foreground mb-2">Acces refuse</h1>
        <p class="text-foreground-muted mb-6">Acces reserve aux administrateurs</p>
        <button
          class="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          @click="router.push('/')"
        >
          Retour a l'accueil
        </button>
      </div>

      <!-- Loading -->
      <div v-else-if="isLoading" class="space-y-6">
        <div class="h-10 w-80 rounded-lg bg-surface-hover animate-pulse mb-6" />
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="i in 8" :key="i" class="h-28 rounded-xl bg-surface-hover animate-pulse" />
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

      <!-- Dashboard content -->
      <template v-else-if="stats">
        <!-- Header -->
        <div class="mb-8 flex items-center gap-3">
          <div class="rounded-lg bg-red-500/10 p-2.5">
            <Shield class="h-7 w-7 text-red-400" />
          </div>
          <div>
            <h1 class="text-[32px] sm:text-[40px] font-bold tracking-tight text-foreground leading-tight">PANNEAU D'ADMINISTRATION</h1>
            <p class="text-sm text-foreground-muted">Tableau de bord et analytiques detaillees</p>
          </div>
        </div>

        <!-- Overview cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <!-- Total Users -->
          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-emerald-500/10 p-2">
                <Users class="h-5 w-5 text-emerald-400" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Utilisateurs</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.overview.totalUsers }}</p>
            <p class="text-xs text-emerald-400 mt-1">+{{ stats.overview.newUsersToday }} aujourd'hui, +{{ stats.overview.newUsersWeek }} cette semaine</p>
          </div>

          <!-- Total Tierlists -->
          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-primary/10 p-2">
                <LayoutGrid class="h-5 w-5 text-primary" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Tier lists</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.overview.totalTierlists }}</p>
            <p class="text-xs text-foreground-muted mt-1">
              <span class="text-emerald-400">{{ stats.overview.publicTierlists }} publiques</span> /
              <span class="text-orange-400">{{ stats.overview.privateTierlists }} privees</span>
            </p>
          </div>

          <!-- Total Downloads -->
          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-blue-500/10 p-2">
                <Download class="h-5 w-5 text-blue-400" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Telechargements</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.overview.totalDownloads }}</p>
            <p class="text-xs text-blue-400 mt-1">+{{ stats.overview.newTierlistsToday }} TL aujourd'hui, +{{ stats.overview.newTierlistsWeek }} cette semaine</p>
          </div>

          <!-- Total Votes -->
          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-purple-500/10 p-2">
                <ThumbsUp class="h-5 w-5 text-purple-400" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Votes totaux</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.overview.totalVotes }}</p>
          </div>

          <!-- Google Users -->
          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-red-500/10 p-2">
                <Chrome class="h-5 w-5 text-red-400" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Google</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.overview.googleUsers }}</p>
          </div>

          <!-- Email Users -->
          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-orange-500/10 p-2">
                <Mail class="h-5 w-5 text-orange-400" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Email</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.overview.emailUsers }}</p>
          </div>

          <!-- Verified Users -->
          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-green-500/10 p-2">
                <CheckCircle class="h-5 w-5 text-green-400" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Verifies</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.overview.verifiedUsers }}</p>
            <p class="text-xs text-foreground-muted mt-1">{{ stats.overview.totalUsers > 0 ? Math.round(stats.overview.verifiedUsers / stats.overview.totalUsers * 100) : 0 }}% des utilisateurs</p>
          </div>

          <!-- New this week -->
          <div class="rounded-xl border border-border-hover bg-surface p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="rounded-lg bg-yellow-500/10 p-2">
                <UserPlus class="h-5 w-5 text-yellow-400" />
              </div>
              <span class="text-sm font-medium text-foreground-muted">Nouveaux (7j)</span>
            </div>
            <p class="text-3xl font-bold text-foreground">{{ stats.overview.newUsersWeek }}</p>
          </div>
        </div>

        <!-- Growth Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <!-- User Growth -->
          <section class="rounded-xl border border-border-hover bg-surface p-6">
            <div class="flex items-center gap-2 mb-5">
              <Calendar class="h-5 w-5 text-emerald-400" />
              <h2 class="text-base font-bold text-foreground">Inscriptions (30 derniers jours)</h2>
            </div>
            <div v-if="stats.userGrowth.length === 0" class="text-center py-8">
              <p class="text-foreground-muted text-sm">Aucune donnee disponible</p>
            </div>
            <div v-else class="space-y-1.5">
              <div v-for="entry in stats.userGrowth" :key="entry._id" class="flex items-center gap-3">
                <span class="text-xs text-foreground-muted w-12 shrink-0 text-right tabular-nums">{{ formatShortDate(entry._id) }}</span>
                <div class="flex-1 h-5 rounded bg-surface-hover overflow-hidden">
                  <div
                    class="h-full rounded bg-emerald-500 transition-all duration-500"
                    :style="{ width: `${Math.max((entry.count / maxUserGrowth) * 100, 4)}%` }"
                  />
                </div>
                <span class="text-xs font-bold text-foreground w-6 text-right tabular-nums">{{ entry.count }}</span>
              </div>
            </div>
          </section>

          <!-- Tierlist Growth -->
          <section class="rounded-xl border border-border-hover bg-surface p-6">
            <div class="flex items-center gap-2 mb-5">
              <Calendar class="h-5 w-5 text-primary" />
              <h2 class="text-base font-bold text-foreground">Tier lists creees (30 derniers jours)</h2>
            </div>
            <div v-if="stats.tierlistGrowth.length === 0" class="text-center py-8">
              <p class="text-foreground-muted text-sm">Aucune donnee disponible</p>
            </div>
            <div v-else class="space-y-1.5">
              <div v-for="entry in stats.tierlistGrowth" :key="entry._id" class="flex items-center gap-3">
                <span class="text-xs text-foreground-muted w-12 shrink-0 text-right tabular-nums">{{ formatShortDate(entry._id) }}</span>
                <div class="flex-1 h-5 rounded bg-surface-hover overflow-hidden">
                  <div
                    class="h-full rounded bg-primary transition-all duration-500"
                    :style="{ width: `${Math.max((entry.count / maxTierlistGrowth) * 100, 4)}%` }"
                  />
                </div>
                <span class="text-xs font-bold text-foreground w-6 text-right tabular-nums">{{ entry.count }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Recent Users Table -->
        <section class="mb-10">
          <div class="flex items-center gap-2 mb-5">
            <UserPlus class="h-5 w-5 text-emerald-400" />
            <h2 class="text-lg font-bold text-foreground">Derniers utilisateurs inscrits</h2>
          </div>
          <div class="rounded-xl border border-border-hover bg-surface overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border-hover">
                    <th class="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Utilisateur</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Methode</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider hidden sm:table-cell">Verifie</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in stats.recentUsers" :key="u._id" class="border-b border-border-hover/50 hover:bg-surface-hover/50 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2.5">
                        <div class="h-7 w-7 rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0">
                          <img v-if="u.avatar" :src="u.avatar" :alt="u.displayName" class="h-7 w-7 rounded-full object-cover" />
                          <span v-else class="text-[10px] font-bold text-white">{{ u.displayName?.[0]?.toUpperCase() }}</span>
                        </div>
                        <span class="font-medium text-foreground truncate max-w-[120px]">{{ u.displayName }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-foreground-muted hidden sm:table-cell">
                      <span class="truncate max-w-[180px] block">{{ u.email }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span :class="[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        u.authProvider === 'google' ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'
                      ]">
                        {{ u.authProvider === 'google' ? 'Google' : 'Email' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 hidden sm:table-cell">
                      <span :class="u.emailVerified ? 'text-green-400' : 'text-red-400'" class="text-xs font-medium">
                        {{ u.emailVerified ? 'Oui' : 'Non' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap">{{ formatDate(u.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Top Authors Table -->
        <section class="mb-10">
          <div class="flex items-center gap-2 mb-5">
            <Users class="h-5 w-5 text-purple-400" />
            <h2 class="text-lg font-bold text-foreground">Top auteurs</h2>
          </div>
          <div class="rounded-xl border border-border-hover bg-surface overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border-hover">
                    <th class="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">#</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase tracking-wider">Pseudo</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-foreground-muted uppercase tracking-wider">Tier lists</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-foreground-muted uppercase tracking-wider">Telechargements</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(author, idx) in stats.topAuthors" :key="author._id" class="border-b border-border-hover/50 hover:bg-surface-hover/50 transition-colors">
                    <td class="px-4 py-3 text-foreground-muted font-medium">{{ idx + 1 }}</td>
                    <td class="px-4 py-3 font-medium text-foreground">{{ author.displayName }}</td>
                    <td class="px-4 py-3 text-right tabular-nums font-bold text-primary">{{ author.count }}</td>
                    <td class="px-4 py-3 text-right tabular-nums text-foreground-muted">{{ author.totalDownloads }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="stats.topAuthors.length === 0" class="text-center py-6">
              <p class="text-foreground-muted text-sm">Aucun auteur</p>
            </div>
          </div>
        </section>

        <!-- Trending this week -->
        <section class="mb-10">
          <div class="flex items-center gap-2 mb-5">
            <TrendingUp class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-bold text-foreground">Tendances de la semaine</h2>
          </div>

          <div v-if="stats.trending.length === 0" class="rounded-xl border border-border-hover bg-surface p-8 text-center">
            <p class="text-foreground-muted">Aucune tier list publiee cette semaine</p>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <article
              v-for="tl in stats.trending"
              :key="tl._id"
              class="group rounded-xl bg-surface overflow-hidden transition-all duration-300 cursor-pointer border border-transparent hover:border-border-hover"
              @click="viewTierlist(tl._id)"
            >
              <div class="h-28 bg-gradient-to-br from-surface-hover to-surface overflow-hidden relative">
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
              <div class="p-3">
                <h3 class="font-bold text-foreground text-xs line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
                  {{ tl.title }}
                </h3>
                <div class="flex items-center gap-2 text-[10px] text-foreground-muted">
                  <span class="flex items-center gap-0.5">
                    <Download class="h-2.5 w-2.5" />
                    {{ tl.downloads || 0 }}
                  </span>
                  <span>{{ (tl.upvotes || 0) - (tl.downvotes || 0) }} votes</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Most downloaded all time -->
        <section class="mb-10">
          <div class="flex items-center gap-2 mb-5">
            <Download class="h-5 w-5 text-blue-400" />
            <h2 class="text-lg font-bold text-foreground">Les plus telechargees</h2>
          </div>

          <div v-if="stats.topDownloaded.length === 0" class="rounded-xl border border-border-hover bg-surface p-8 text-center">
            <p class="text-foreground-muted">Aucune tier list publiee</p>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <article
              v-for="tl in stats.topDownloaded"
              :key="tl._id"
              class="group rounded-xl bg-surface overflow-hidden transition-all duration-300 cursor-pointer border border-transparent hover:border-border-hover"
              @click="viewTierlist(tl._id)"
            >
              <div class="h-28 bg-gradient-to-br from-surface-hover to-surface overflow-hidden relative">
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
              <div class="p-3">
                <h3 class="font-bold text-foreground text-xs line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
                  {{ tl.title }}
                </h3>
                <div class="flex items-center gap-2 text-[10px] text-foreground-muted">
                  <span class="flex items-center gap-0.5">
                    <Download class="h-2.5 w-2.5" />
                    {{ tl.downloads || 0 }}
                  </span>
                  <span>{{ (tl.upvotes || 0) - (tl.downvotes || 0) }} votes</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Most voted all time -->
        <section class="mb-10">
          <div class="flex items-center gap-2 mb-5">
            <ThumbsUp class="h-5 w-5 text-purple-400" />
            <h2 class="text-lg font-bold text-foreground">Les plus votees</h2>
          </div>

          <div v-if="stats.topVoted.length === 0" class="rounded-xl border border-border-hover bg-surface p-8 text-center">
            <p class="text-foreground-muted">Aucune tier list publiee</p>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <article
              v-for="tl in stats.topVoted"
              :key="tl._id"
              class="group rounded-xl bg-surface overflow-hidden transition-all duration-300 cursor-pointer border border-transparent hover:border-border-hover"
              @click="viewTierlist(tl._id)"
            >
              <div class="h-28 bg-gradient-to-br from-surface-hover to-surface overflow-hidden relative">
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
              <div class="p-3">
                <h3 class="font-bold text-foreground text-xs line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
                  {{ tl.title }}
                </h3>
                <div class="flex items-center gap-2 text-[10px] text-foreground-muted">
                  <span class="flex items-center gap-0.5">
                    <ThumbsUp class="h-2.5 w-2.5" />
                    {{ tl.upvotes || 0 }}
                  </span>
                  <span class="flex items-center gap-0.5">
                    <Download class="h-2.5 w-2.5" />
                    {{ tl.downloads || 0 }}
                  </span>
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
              class="mb-4 last:mb-0"
            >
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-sm font-medium text-foreground">{{ getCategoryLabel(cat._id) }}</span>
                <div class="flex items-center gap-4 text-xs text-foreground-muted">
                  <span><span class="font-bold text-foreground">{{ cat.count }}</span> tier lists</span>
                  <span><span class="font-bold text-foreground">{{ cat.totalDownloads }}</span> telechargements</span>
                </div>
              </div>
              <div class="flex gap-2">
                <div class="flex-1 h-5 rounded bg-surface-hover overflow-hidden">
                  <div
                    :class="['h-full rounded transition-all duration-500', getCategorySolidColor(cat._id)]"
                    :style="{ width: `${Math.max((cat.count / maxCategoryCount) * 100, 4)}%` }"
                  />
                </div>
              </div>
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
