<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import NavBar from '@/components/NavBar.vue'
import { Search, Download, Clock, TrendingUp, User, Gamepad2, UtensilsCrossed, Tv, Music, Film, Dumbbell, MoreHorizontal, Star, History } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

const router = useRouter()
const { user, fetchUser } = useAuth()

const API_BASE = 'http://localhost:3001'

interface PublicTierList {
  _id: string
  roomId: string
  title: string
  rows: { id: string; label: string; color: string; items: { id: string; imageUrl: string; label: string }[] }[]
  pool: { id: string; imageUrl: string; label: string }[]
  downloads: number
  category: string
  authorId: string
  coverImage: string
  createdAt: string
}

const featuredIds = ref<Set<string>>(new Set())
const tierlists = ref<PublicTierList[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const activeCategory = ref('All')
const activeSort = ref('downloads')
const activeTab = ref<'explore' | 'mine'>('explore')
const myLists = ref<PublicTierList[]>([])

interface LocalRoom {
  roomId: string
  title: string
  createdAt: string
}
const localRooms = ref<LocalRoom[]>([])

function loadLocalRooms() {
  localRooms.value = JSON.parse(localStorage.getItem('tt-my-rooms') || '[]')
}

const categories = [
  { label: 'All', icon: MoreHorizontal },
  { label: 'Gaming', icon: Gamepad2 },
  { label: 'Food', icon: UtensilsCrossed },
  { label: 'Anime', icon: Tv },
  { label: 'Music', icon: Music },
  { label: 'Movies', icon: Film },
  { label: 'Sports', icon: Dumbbell },
  { label: 'Other', icon: MoreHorizontal },
]

const sortOptions = [
  { value: 'downloads', label: 'Most Downloaded', icon: Download },
  { value: 'recent', label: 'Recent', icon: Clock },
  { value: 'popular', label: 'Popular', icon: TrendingUp },
]

async function fetchTierlists() {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('sort', activeSort.value)
    if (activeCategory.value !== 'All') params.set('category', activeCategory.value)
    if (searchQuery.value) params.set('search', searchQuery.value)

    const res = await fetch(`${API_BASE}/api/tierlists/public?${params}`)
    const data = await res.json()
    tierlists.value = data.tierlists || []
  } catch {
    tierlists.value = []
  } finally {
    isLoading.value = false
  }
}

async function fetchMyLists() {
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/mine`, { credentials: 'include' })
    const data = await res.json()
    myLists.value = data.tierlists || []
  } catch {
    myLists.value = []
  }
}

async function fetchFeatured() {
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/featured`)
    const data = await res.json()
    featuredIds.value = new Set((data.tierlists || []).map((t: PublicTierList) => t._id))
  } catch {
    featuredIds.value = new Set()
  }
}

function viewTierlist(id: string) {
  router.push({ name: 'tierlist-view', params: { id } })
}

function getCoverImage(tierlist: PublicTierList): string {
  if (tierlist.coverImage) return tierlist.coverImage
  for (const row of tierlist.rows) {
    for (const item of row.items) {
      if (item.imageUrl) return item.imageUrl
    }
  }
  return ''
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

let searchTimeout: any = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchTierlists(), 300)
}

watch([activeCategory, activeSort], () => fetchTierlists())

onMounted(async () => {
  await fetchUser()
  fetchFeatured()
  fetchTierlists()
  loadLocalRooms()
  if (user.value) fetchMyLists()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavBar />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold tracking-tight text-foreground mb-2">Explore Tier Lists</h1>
        <p class="text-foreground-muted">Discover and use community tier lists</p>
      </div>

      <!-- Tabs (Explore / My Lists) -->
      <div class="flex gap-1 mb-6 border-b border-border pb-px">
        <button
          :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', activeTab === 'explore' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']"
          @click="activeTab = 'explore'"
        >
          Explore
        </button>
        <button
          :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', activeTab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']"
          @click="activeTab = 'mine'; loadLocalRooms(); if (user) fetchMyLists()"
        >
          My Lists
        </button>
      </div>

      <template v-if="activeTab === 'explore'">
        <!-- Search -->
        <div class="relative mb-5">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tier lists..."
            class="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            @input="onSearchInput"
          />
        </div>

        <!-- Categories + Sort -->
        <div class="flex flex-wrap items-center gap-2 mb-6">
          <button
            v-for="cat in categories"
            :key="cat.label"
            :class="['inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200', activeCategory === cat.label ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-surface text-foreground-muted hover:bg-surface-hover hover:text-foreground']"
            @click="activeCategory = cat.label"
          >
            <component :is="cat.icon" class="h-3.5 w-3.5" />
            {{ cat.label }}
          </button>

          <div class="ml-auto flex gap-1">
            <button
              v-for="s in sortOptions"
              :key="s.value"
              :class="['inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors', activeSort === s.value ? 'bg-surface-active text-foreground' : 'text-foreground-muted hover:text-foreground']"
              @click="activeSort = s.value"
            >
              <component :is="s.icon" class="h-3 w-3" />
              {{ s.label }}
            </button>
          </div>
        </div>

        <!-- Grid -->
        <div v-if="isLoading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div v-for="i in 8" :key="i" class="animate-pulse rounded-lg border border-border bg-surface overflow-hidden">
            <div class="h-24 bg-surface-hover" />
            <div class="p-3 space-y-2">
              <div class="h-3.5 w-3/4 rounded bg-surface-hover" />
              <div class="h-3 w-1/2 rounded bg-surface-hover" />
            </div>
          </div>
        </div>

        <div v-else-if="tierlists.length === 0" class="text-center py-16">
          <p class="text-foreground-muted text-lg">No tier lists found</p>
          <p class="text-foreground-subtle text-sm mt-1">Be the first to publish one!</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="tl in tierlists"
            :key="tl._id"
            class="group relative rounded-lg border bg-surface overflow-hidden shadow-lg transition-all duration-300 cursor-pointer"
            :class="featuredIds.has(tl._id) ? 'border-yellow-500/20 hover:border-yellow-500/40' : 'border-border-hover hover:border-primary/30'"
            @click="viewTierlist(tl._id)"
          >
            <!-- Featured badge -->
            <div v-if="featuredIds.has(tl._id)" class="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 rounded-full bg-yellow-500/90 px-2 py-0.5">
              <Star class="h-2.5 w-2.5 text-black" />
              <span class="text-[9px] font-bold text-black">Featured</span>
            </div>

            <!-- Cover -->
            <div class="h-24 bg-gradient-to-br from-primary/20 to-surface-hover overflow-hidden">
              <img
                v-if="getCoverImage(tl)"
                :src="getCoverImage(tl)"
                :alt="tl.title"
                class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <!-- Info -->
            <div class="p-3">
              <div class="flex items-start justify-between gap-1 mb-1.5">
                <h3 class="font-bold text-foreground text-xs line-clamp-1 group-hover:text-primary transition-colors">
                  {{ tl.title }}
                </h3>
                <span :class="['shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium', getCategoryColor(tl.category)]">
                  {{ tl.category }}
                </span>
              </div>

              <div class="flex items-center justify-between text-[10px] text-foreground-muted">
                <div class="flex items-center gap-1">
                  <Download class="h-2.5 w-2.5" />
                  {{ tl.downloads || 0 }}
                </div>
                <span>{{ new Date(tl.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- My Lists tab -->
      <template v-if="activeTab === 'mine'">
        <!-- Local room history -->
        <div v-if="localRooms.length > 0" class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <History class="h-5 w-5 text-foreground-muted" />
            <h2 class="text-lg font-bold text-foreground">My Tier Lists</h2>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="room in localRooms"
              :key="room.roomId"
              class="group rounded-xl border border-border-hover bg-surface p-4 hover:border-primary/30 transition-all duration-300 cursor-pointer"
              @click="router.push({ name: 'room', params: { id: room.roomId } })"
            >
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {{ room.title }}
                </h3>
                <span class="text-[10px] font-mono text-foreground-subtle bg-surface-hover rounded px-1.5 py-0.5">
                  {{ room.roomId }}
                </span>
              </div>
              <p class="text-xs text-foreground-muted">{{ new Date(room.createdAt).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>

        <!-- Published lists (auth) -->
        <template v-if="user">
          <div v-if="myLists.length > 0">
            <h2 class="text-lg font-bold text-foreground mb-4">Published Lists</h2>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="tl in myLists"
                :key="tl._id"
                class="rounded-xl border border-border-hover bg-surface overflow-hidden shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer"
                @click="router.push({ name: 'room', params: { id: tl.roomId } })"
              >
                <div class="h-36 bg-gradient-to-br from-primary/20 to-surface-hover overflow-hidden">
                  <img
                    v-if="getCoverImage(tl)"
                    :src="getCoverImage(tl)"
                    :alt="tl.title"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="p-4">
                  <h3 class="font-bold text-foreground text-sm mb-1">{{ tl.title }}</h3>
                  <div class="flex items-center justify-between text-xs text-foreground-muted">
                    <span :class="['rounded-full px-2 py-0.5 text-[10px] font-medium', getCategoryColor(tl.category)]">
                      {{ tl.category }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Download class="h-3 w-3" />
                      {{ tl.downloads || 0 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-if="localRooms.length === 0 && myLists.length === 0" class="text-center py-16">
          <p class="text-foreground-muted text-lg">No tier lists yet</p>
          <p class="text-foreground-subtle text-sm mt-1">Create or clone a tier list to see it here!</p>
        </div>
      </template>
    </main>
  </div>
</template>
