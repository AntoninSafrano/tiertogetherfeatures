<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import NavBar from '@/components/NavBar.vue'
import ErrorPopup from '@/components/ErrorPopup.vue'
import { Search, Download, Clock, TrendingUp, Gamepad2, UtensilsCrossed, Tv, Music, Film, Dumbbell, MoreHorizontal, LayoutGrid, Star, History, Trash2, Pencil, EyeOff, Eye, X, Check } from 'lucide-vue-next'
import { API_BASE } from '@/config'

const router = useRouter()
const { user, fetchUser } = useAuth()

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
  isPublic?: boolean
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
  { label: 'Tout', icon: LayoutGrid, value: 'All' },
  { label: 'Jeux vidéo', icon: Gamepad2, value: 'Gaming' },
  { label: 'Cuisine', icon: UtensilsCrossed, value: 'Food' },
  { label: 'Anime', icon: Tv, value: 'Anime' },
  { label: 'Musique', icon: Music, value: 'Music' },
  { label: 'Films', icon: Film, value: 'Movies' },
  { label: 'Sport', icon: Dumbbell, value: 'Sports' },
  { label: 'Autre', icon: MoreHorizontal, value: 'Other' },
]

const sortOptions = [
  { value: 'downloads', label: 'Plus téléchargés', icon: Download },
  { value: 'recent', label: 'Récents', icon: Clock },
  { value: 'popular', label: 'Populaires', icon: TrendingUp },
]

async function fetchTierlists() {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('sort', activeSort.value)
    if (activeCategory.value !== 'All') {
      params.set('category', activeCategory.value)
    }
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

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString()
}

let searchTimeout: any = null
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchTierlists(), 300)
}

watch([activeCategory, activeSort], () => fetchTierlists())

// ─── Tier list management ─────────────────────────────────────
const confirmDelete = ref<string | null>(null)
const editingList = ref<PublicTierList | null>(null)
const editTitle = ref('')
const editCategory = ref('')
const managementError = ref<{ title: string; description: string } | null>(null)

const validCategories = ['Gaming', 'Food', 'Anime', 'Music', 'Movies', 'Sports', 'Other']

async function deleteTierList(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await res.json()
    if (data.success) {
      myLists.value = myLists.value.filter((l) => l._id !== id)
      confirmDelete.value = null
    } else {
      managementError.value = { title: 'Suppression impossible', description: data.error || 'Erreur inconnue' }
    }
  } catch {
    managementError.value = { title: 'Erreur réseau', description: 'Impossible de supprimer la tier list.' }
  }
}

function startEdit(tl: PublicTierList) {
  editingList.value = tl
  editTitle.value = tl.title
  editCategory.value = tl.category
}

async function saveEdit() {
  if (!editingList.value) return
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${editingList.value._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: editTitle.value, category: editCategory.value }),
    })
    const data = await res.json()
    if (data.success) {
      const idx = myLists.value.findIndex((l) => l._id === editingList.value!._id)
      if (idx !== -1) {
        myLists.value[idx].title = editTitle.value
        myLists.value[idx].category = editCategory.value
      }
      editingList.value = null
    } else {
      managementError.value = { title: 'Modification impossible', description: data.error || 'Erreur inconnue' }
    }
  } catch {
    managementError.value = { title: 'Erreur réseau', description: 'Impossible de modifier la tier list.' }
  }
}

async function toggleVisibility(tl: PublicTierList) {
  try {
    const newPublic = !tl.isPublic
    const res = await fetch(`${API_BASE}/api/tierlists/${tl._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isPublic: newPublic }),
    })
    const data = await res.json()
    if (data.success) {
      const item = myLists.value.find((l) => l._id === tl._id)
      if (item) (item as any).isPublic = newPublic
    }
  } catch { /* silent */ }
}

function deleteLocalRoom(roomId: string) {
  localRooms.value = localRooms.value.filter((r) => r.roomId !== roomId)
  localStorage.setItem('tt-my-rooms', JSON.stringify(localRooms.value))
}

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

    <main class="mx-auto max-w-6xl px-4 sm:px-10 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-[40px] font-bold tracking-tight text-foreground mb-2">EXPLORE TIER LISTS</h1>
        <p class="text-base text-foreground-muted mb-5">Discover and clone tier lists created by the community</p>

        <!-- Search -->
        <div class="relative max-w-md">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-subtle" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tier lists..."
            class="w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-5 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            @input="onSearchInput"
          />
        </div>
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
        <!-- Categories + Search row -->
        <div class="flex items-start gap-4 mb-6">
          <div class="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            <button
              v-for="cat in categories"
              :key="cat.value"
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200',
                activeCategory === cat.value
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-foreground-muted hover:bg-surface-hover hover:text-foreground'
              ]"
              @click="activeCategory = cat.value"
            >
              <component :is="cat.icon" class="h-3.5 w-3.5" />
              {{ cat.label }}
            </button>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Sort -->
            <button
              v-for="s in sortOptions"
              :key="s.value"
              :class="[
                'inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs transition-colors',
                activeSort === s.value
                  ? 'bg-surface-active text-foreground border border-border-hover'
                  : 'text-foreground-muted hover:text-foreground'
              ]"
              @click="activeSort = s.value"
            >
              <component :is="s.icon" class="h-3 w-3" />
              {{ s.label }}
            </button>
          </div>
        </div>

        <!-- Grid -->
        <div v-if="isLoading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div v-for="i in 8" :key="i" class="animate-pulse rounded-xl border border-border bg-surface overflow-hidden">
            <div class="h-36 bg-surface-hover" />
            <div class="p-3.5 space-y-2">
              <div class="h-4 w-3/4 rounded bg-surface-hover" />
              <div class="h-3 w-1/2 rounded bg-surface-hover" />
            </div>
          </div>
        </div>

        <div v-else-if="tierlists.length === 0" class="text-center py-16">
          <p class="text-foreground-muted text-lg">No tier lists found</p>
          <p class="text-foreground-subtle text-sm mt-1">Be the first to publish one!</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="tl in tierlists"
            :key="tl._id"
            class="group relative rounded-xl bg-surface overflow-hidden transition-all duration-300 cursor-pointer border border-transparent hover:border-border-hover"
            @click="viewTierlist(tl._id)"
          >
            <!-- Featured badge -->
            <div v-if="featuredIds.has(tl._id)" class="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-yellow-500/90 px-2 py-0.5">
              <Star class="h-2.5 w-2.5 text-black" />
              <span class="text-[9px] font-bold text-black">Featured</span>
            </div>

            <!-- Category badge -->
            <div class="absolute top-2 right-2 z-10">
              <span :class="['rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm', getCategoryColor(tl.category)]">
                {{ tl.category }}
              </span>
            </div>

            <!-- Cover -->
            <div class="h-36 bg-gradient-to-br from-surface-hover to-surface overflow-hidden">
              <img
                v-if="getCoverImage(tl)"
                :src="getCoverImage(tl)"
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
                <div class="flex items-center gap-1">
                  <Download class="h-3 w-3" />
                  {{ tl.downloads || 0 }}
                </div>
                <span>{{ getRelativeTime(tl.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- My Lists tab -->
      <template v-if="activeTab === 'mine'">
        <!-- Error popup -->
        <ErrorPopup
          v-if="managementError"
          :title="managementError.title"
          :description="managementError.description"
          @close="managementError = null"
        />

        <!-- Local room history (drafts) -->
        <div v-if="localRooms.length > 0" class="mb-8">
          <div class="flex items-center gap-2 mb-4">
            <History class="h-5 w-5 text-foreground-muted" />
            <h2 class="text-lg font-bold text-foreground">Brouillons</h2>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="room in localRooms"
              :key="room.roomId"
              class="group rounded-xl border border-border-hover bg-surface p-4 hover:border-primary/30 transition-all duration-300"
            >
              <div class="flex items-center justify-between mb-2">
                <h3
                  class="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors cursor-pointer flex-1"
                  @click="router.push({ name: 'room', params: { id: room.roomId } })"
                >
                  {{ room.title }}
                </h3>
                <div class="flex items-center gap-1 ml-2">
                  <span class="text-[10px] font-mono text-foreground-subtle bg-surface-hover rounded px-1.5 py-0.5">
                    {{ room.roomId }}
                  </span>
                  <button
                    class="p-1 rounded text-foreground-subtle hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Supprimer"
                    @click="deleteLocalRoom(room.roomId)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p class="text-xs text-foreground-muted">{{ new Date(room.createdAt).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>

        <!-- Published lists (auth) -->
        <template v-if="user">
          <div v-if="myLists.length > 0">
            <h2 class="text-lg font-bold text-foreground mb-4">Publiées</h2>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="tl in myLists"
                :key="tl._id"
                class="rounded-xl border border-border-hover bg-surface overflow-hidden transition-all duration-300"
              >
                <!-- Cover -->
                <div
                  class="h-32 bg-gradient-to-br from-primary/20 to-surface-hover overflow-hidden cursor-pointer"
                  @click="router.push({ name: 'room', params: { id: tl.roomId } })"
                >
                  <img
                    v-if="getCoverImage(tl)"
                    :src="getCoverImage(tl)"
                    :alt="tl.title"
                    class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <!-- Info -->
                <div class="p-4">
                  <!-- Editing mode -->
                  <template v-if="editingList?._id === tl._id">
                    <input
                      v-model="editTitle"
                      class="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground mb-2 focus:border-primary/50 focus:outline-none"
                      maxlength="100"
                    />
                    <select
                      v-model="editCategory"
                      class="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground mb-2 focus:border-primary/50 focus:outline-none"
                    >
                      <option v-for="cat in validCategories" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                    <div class="flex gap-2">
                      <button
                        class="flex-1 flex items-center justify-center gap-1 rounded bg-primary py-1.5 text-xs font-medium text-white hover:bg-primary-hover transition-colors"
                        @click="saveEdit"
                      >
                        <Check class="h-3 w-3" />
                        Sauver
                      </button>
                      <button
                        class="flex-1 flex items-center justify-center gap-1 rounded bg-surface-hover py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
                        @click="editingList = null"
                      >
                        <X class="h-3 w-3" />
                        Annuler
                      </button>
                    </div>
                  </template>

                  <!-- Normal mode -->
                  <template v-else>
                    <div class="flex items-start justify-between mb-2">
                      <h3
                        class="font-bold text-foreground text-sm line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                        @click="router.push({ name: 'room', params: { id: tl.roomId } })"
                      >
                        {{ tl.title }}
                      </h3>
                      <div class="flex items-center gap-0.5 ml-2 shrink-0">
                        <!-- Edit -->
                        <button
                          class="p-1.5 rounded text-foreground-subtle hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Modifier"
                          @click="startEdit(tl)"
                        >
                          <Pencil class="h-3.5 w-3.5" />
                        </button>
                        <!-- Toggle visibility -->
                        <button
                          class="p-1.5 rounded text-foreground-subtle hover:text-warning hover:bg-warning/10 transition-colors"
                          :title="(tl as any).isPublic !== false ? 'Rendre privée' : 'Rendre publique'"
                          @click="toggleVisibility(tl)"
                        >
                          <EyeOff v-if="(tl as any).isPublic !== false" class="h-3.5 w-3.5" />
                          <Eye v-else class="h-3.5 w-3.5" />
                        </button>
                        <!-- Delete -->
                        <button
                          v-if="confirmDelete !== tl._id"
                          class="p-1.5 rounded text-foreground-subtle hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Supprimer"
                          @click="confirmDelete = tl._id"
                        >
                          <Trash2 class="h-3.5 w-3.5" />
                        </button>
                        <button
                          v-else
                          class="px-2 py-1 rounded bg-destructive text-white text-[10px] font-medium hover:bg-red-600 transition-colors"
                          @click="deleteTierList(tl._id)"
                        >
                          Confirmer
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center justify-between text-xs text-foreground-muted">
                      <div class="flex items-center gap-2">
                        <span :class="['rounded-full px-2 py-0.5 text-[10px] font-medium', getCategoryColor(tl.category)]">
                          {{ tl.category }}
                        </span>
                        <span v-if="(tl as any).isPublic === false" class="rounded-full px-2 py-0.5 text-[10px] font-medium bg-foreground-subtle/20 text-foreground-subtle">
                          Privée
                        </span>
                      </div>
                      <span class="flex items-center gap-1">
                        <Download class="h-3 w-3" />
                        {{ tl.downloads || 0 }}
                      </span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-if="localRooms.length === 0 && myLists.length === 0" class="text-center py-16">
          <p class="text-foreground-muted text-lg">Aucune tier list</p>
          <p class="text-foreground-subtle text-sm mt-1">Créez ou clonez une tier list pour commencer !</p>
        </div>
      </template>
    </main>
  </div>
</template>
