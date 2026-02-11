<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import NavBar from '@/components/NavBar.vue'
import { Search, Download, Clock, TrendingUp, User, Gamepad2, UtensilsCrossed, Tv, Music, Film, Dumbbell, MoreHorizontal } from 'lucide-vue-next'
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

const tierlists = ref<PublicTierList[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const activeCategory = ref('All')
const activeSort = ref('downloads')
const activeTab = ref<'explore' | 'mine'>('explore')
const myLists = ref<PublicTierList[]>([])

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

async function cloneTierlist(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${id}/clone`, {
      method: 'POST',
      credentials: 'include',
    })
    const data = await res.json()
    if (data.success && data.roomId) {
      router.push({ name: 'room', params: { id: data.roomId } })
    }
  } catch (err) {
    console.error('Clone failed:', err)
  }
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
    Other: 'bg-zinc-500/20 text-zinc-400',
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
  fetchTierlists()
  if (user.value) fetchMyLists()
})
</script>

<template>
  <div class="min-h-screen bg-zinc-950">
    <NavBar />

    <main class="mx-auto max-w-6xl px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold tracking-tight text-foreground mb-2">Explore Tier Lists</h1>
        <p class="text-zinc-400">Discover and use community tier lists</p>
      </div>

      <!-- Tabs (Explore / My Lists) -->
      <div class="flex gap-1 mb-6 border-b border-white/5 pb-px">
        <button
          :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', activeTab === 'explore' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300']"
          @click="activeTab = 'explore'"
        >
          Explore
        </button>
        <button
          v-if="user"
          :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', activeTab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300']"
          @click="activeTab = 'mine'; fetchMyLists()"
        >
          My Lists
        </button>
      </div>

      <template v-if="activeTab === 'explore'">
        <!-- Search -->
        <div class="relative mb-6">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tier lists..."
            class="w-full rounded-lg border border-white/5 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-zinc-600 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            @input="onSearchInput"
          />
        </div>

        <!-- Categories -->
        <div class="flex flex-wrap gap-2 mb-6">
          <button
            v-for="cat in categories"
            :key="cat.label"
            :class="['inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200', activeCategory === cat.label ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300']"
            @click="activeCategory = cat.label"
          >
            <component :is="cat.icon" class="h-3.5 w-3.5" />
            {{ cat.label }}
          </button>
        </div>

        <!-- Sort -->
        <div class="flex gap-2 mb-6">
          <button
            v-for="s in sortOptions"
            :key="s.value"
            :class="['inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors', activeSort === s.value ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300']"
            @click="activeSort = s.value"
          >
            <component :is="s.icon" class="h-3 w-3" />
            {{ s.label }}
          </button>
        </div>

        <!-- Grid -->
        <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 6" :key="i" class="animate-pulse rounded-xl border border-white/5 bg-zinc-900 p-4">
            <div class="h-32 rounded-lg bg-zinc-800 mb-3" />
            <div class="h-4 w-3/4 rounded bg-zinc-800 mb-2" />
            <div class="h-3 w-1/2 rounded bg-zinc-800" />
          </div>
        </div>

        <div v-else-if="tierlists.length === 0" class="text-center py-16">
          <p class="text-zinc-500 text-lg">No tier lists found</p>
          <p class="text-zinc-600 text-sm mt-1">Be the first to publish one!</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="tl in tierlists"
            :key="tl._id"
            class="group rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer"
            @click="cloneTierlist(tl._id)"
          >
            <!-- Cover -->
            <div class="h-36 bg-gradient-to-br from-primary/20 to-zinc-800 overflow-hidden">
              <img
                v-if="getCoverImage(tl)"
                :src="getCoverImage(tl)"
                :alt="tl.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <!-- Info -->
            <div class="p-4">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {{ tl.title }}
                </h3>
                <span :class="['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', getCategoryColor(tl.category)]">
                  {{ tl.category }}
                </span>
              </div>

              <div class="flex items-center justify-between text-xs text-zinc-500">
                <div class="flex items-center gap-1">
                  <Download class="h-3 w-3" />
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
        <div v-if="myLists.length === 0" class="text-center py-16">
          <p class="text-zinc-500 text-lg">You haven't published any tier lists yet</p>
        </div>
        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="tl in myLists"
            :key="tl._id"
            class="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer"
            @click="router.push({ name: 'room', params: { id: tl.roomId } })"
          >
            <div class="h-36 bg-gradient-to-br from-primary/20 to-zinc-800 overflow-hidden">
              <img
                v-if="getCoverImage(tl)"
                :src="getCoverImage(tl)"
                :alt="tl.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-4">
              <h3 class="font-bold text-foreground text-sm mb-1">{{ tl.title }}</h3>
              <div class="flex items-center justify-between text-xs text-zinc-500">
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
      </template>
    </main>
  </div>
</template>
