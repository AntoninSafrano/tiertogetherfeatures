<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import NavBar from '@/components/NavBar.vue'
import ErrorPopup from '@/components/ErrorPopup.vue'
import { Search, Download, Clock, TrendingUp, Gamepad2, UtensilsCrossed, Tv, Music, Film, Dumbbell, MoreHorizontal, LayoutGrid, Star, History, Trash2, Pencil, EyeOff, Eye, X, Check, ThumbsUp, ThumbsDown, Share2 } from 'lucide-vue-next'
import { API_BASE } from '@/config'
import { getCategoryBadgeColor, getCategoryLabel, getRelativeTime, tierlistSlugId, CATEGORY_SLUGS, getCategorySlug } from '@/lib/utils'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { user, fetchUser } = useAuth()

function categoryFromRoute(): string {
  if (route.name === 'category') {
    return CATEGORY_SLUGS[String(route.params.cat)] ?? 'All'
  }
  return 'All'
}

interface PublicTierList {
  _id: string
  roomId: string
  title: string
  rows: { id: string; label: string; color: string; items: { id: string; imageUrl: string; label: string }[] }[]
  pool: { id: string; imageUrl: string; label: string }[]
  downloads: number
  upvotes: number
  downvotes: number
  userVote: number | null
  category: string
  authorId: string
  authorDisplayName: string | null
  coverImage: string
  createdAt: string
  isPublic?: boolean
}

const featuredIds = ref<Set<string>>(new Set())
const tierlists = ref<PublicTierList[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const activeCategory = ref(categoryFromRoute())
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

const categories = computed(() => [
  { label: t('common.all'), icon: LayoutGrid, value: 'All' },
  { label: getCategoryLabel('Gaming'), icon: Gamepad2, value: 'Gaming' },
  { label: getCategoryLabel('Food'), icon: UtensilsCrossed, value: 'Food' },
  { label: getCategoryLabel('Anime'), icon: Tv, value: 'Anime' },
  { label: getCategoryLabel('Music'), icon: Music, value: 'Music' },
  { label: getCategoryLabel('Movies'), icon: Film, value: 'Movies' },
  { label: getCategoryLabel('Sports'), icon: Dumbbell, value: 'Sports' },
  { label: getCategoryLabel('Other'), icon: MoreHorizontal, value: 'Other' },
])

const sortOptions = computed(() => [
  { value: 'downloads', label: t('explore.sortDownloads'), icon: Download },
  { value: 'recent', label: t('explore.sortRecent'), icon: Clock },
  { value: 'popular', label: t('explore.sortPopular'), icon: TrendingUp },
])

async function fetchTierlists() {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    params.set('sort', activeSort.value)
    if (activeCategory.value !== 'All') {
      params.set('category', activeCategory.value)
    }
    if (searchQuery.value) params.set('search', searchQuery.value)

    const res = await fetch(`${API_BASE}/api/tierlists/public?${params}`, { credentials: 'include' })
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

function viewTierlist(tl: PublicTierList) {
  router.push({ name: 'tierlist-view', params: { id: tierlistSlugId(tl._id, tl.title) } })
}

/** Category chip click → SEO-friendly URL; the route watcher updates the filter */
function selectCategory(value: string) {
  const slug = value === 'All' ? null : getCategorySlug(value)
  router.replace(slug ? `/tierlists/${slug}` : '/')
}

const pageTitle = computed(() =>
  activeCategory.value === 'All'
    ? t('explore.title')
    : t('explore.categoryTitle', { category: getCategoryLabel(activeCategory.value).toUpperCase() }),
)

watch(() => route.fullPath, () => {
  if (route.name === 'explore' || route.name === 'category') {
    const next = categoryFromRoute()
    if (next !== activeCategory.value) activeCategory.value = next
    document.title = activeCategory.value === 'All'
      ? 'TierTogether'
      : t('explore.docTitle', { category: getCategoryLabel(activeCategory.value) })
  }
})

function getCoverImage(tierlist: PublicTierList): string {
  if (tierlist.coverImage) return tierlist.coverImage
  for (const row of tierlist.rows) {
    for (const item of row.items) {
      if (item.imageUrl) return item.imageUrl
    }
  }
  return ''
}

const sharedId = ref<string | null>(null)

async function shareTierList(e: Event, tl: PublicTierList) {
  e.stopPropagation()
  const url = `${window.location.origin}/tierlist/${tierlistSlugId(tl._id, tl.title)}`
  const title = tl.title || 'TierTogether'

  if (navigator.share) {
    await navigator.share({ title, url, text: t('explore.shareText', { title }) })
  } else {
    await navigator.clipboard.writeText(url)
    sharedId.value = tl._id
    setTimeout(() => { if (sharedId.value === tl._id) sharedId.value = null }, 2000)
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchTierlists(), 300)
}

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})

const votingInProgress = ref<Set<string>>(new Set())

async function vote(tierlist: PublicTierList, voteValue: 1 | -1) {
  if (!user.value) {
    router.push({ name: 'auth' })
    return
  }

  // Block double-clicks
  if (votingInProgress.value.has(tierlist._id)) return
  votingInProgress.value.add(tierlist._id)

  // If the user clicks the same vote again, remove it (toggle)
  const newVote = tierlist.userVote === voteValue ? 0 : voteValue

  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${tierlist._id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vote: newVote }),
    })
    const data = await res.json()
    if (res.ok) {
      tierlist.upvotes = data.upvotes
      tierlist.downvotes = data.downvotes
      tierlist.userVote = data.userVote
    }
  } catch {
    // Silent fail
  } finally {
    votingInProgress.value.delete(tierlist._id)
  }
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
      managementError.value = { title: t('explore.deleteFailed'), description: data.error || t('common.unknownError') }
    }
  } catch {
    managementError.value = { title: t('common.networkError'), description: t('explore.deleteNetworkError') }
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
      managementError.value = { title: t('explore.editFailed'), description: data.error || t('common.unknownError') }
    }
  } catch {
    managementError.value = { title: t('common.networkError'), description: t('explore.editNetworkError') }
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
        <h1 class="text-3xl sm:text-[40px] font-bold tracking-tight text-foreground mb-2">{{ pageTitle }}</h1>
        <p class="text-base text-foreground-muted mb-5">{{ $t('explore.subtitle') }}</p>

        <!-- Search -->
        <div class="relative max-w-md">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-subtle" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('explore.searchPlaceholder')"
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
          {{ $t('explore.tabExplore') }}
        </button>
        <button
          :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', activeTab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']"
          @click="activeTab = 'mine'; loadLocalRooms(); if (user) fetchMyLists()"
        >
          {{ $t('explore.tabMine') }}
        </button>
      </div>

      <section v-if="activeTab === 'explore'" :aria-label="$t('explore.sectionAria')">
        <!-- Categories -->
        <div class="flex flex-wrap items-center gap-2.5 mb-4">
          <button
            v-for="cat in categories"
            :key="cat.value"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200',
              activeCategory === cat.value
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-foreground-muted hover:bg-surface-hover hover:text-foreground'
            ]"
            @click="selectCategory(cat.value)"
          >
            <component :is="cat.icon" class="h-3.5 w-3.5" />
            {{ cat.label }}
          </button>
        </div>

        <!-- Sort -->
        <div class="flex items-center gap-2 mb-6">
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
          <p class="text-foreground-muted text-lg">{{ $t('explore.emptyTitle') }}</p>
          <p class="text-foreground-subtle text-sm mt-1">{{ $t('explore.emptyHint') }}</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <article
            v-for="tl in tierlists"
            :key="tl._id"
            class="group relative rounded-xl bg-surface overflow-hidden transition-all duration-300 cursor-pointer border border-transparent hover:border-border-hover"
            @click="viewTierlist(tl)"
          >
            <!-- Featured badge -->
            <div v-if="featuredIds.has(tl._id)" class="absolute top-2 left-2 z-10 inline-flex h-5 items-center gap-1 rounded-full bg-yellow-500/90 px-2 text-[10px] font-bold leading-none text-black">
              <Star class="h-2.5 w-2.5" />
              <span>{{ $t('explore.popular') }}</span>
            </div>

            <!-- Category badge -->
            <div :class="['absolute top-2 right-2 z-10 inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold leading-none backdrop-blur-sm', getCategoryBadgeColor(tl.category)]">
              {{ getCategoryLabel(tl.category) }}
            </div>

            <!-- Cover -->
            <div class="h-36 bg-gradient-to-br from-surface-hover to-surface overflow-hidden">
              <img
                v-if="getCoverImage(tl)"
                :src="getCoverImage(tl)"
                :alt="tl.title"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <!-- Info -->
            <div class="p-3.5">
              <h3 class="font-bold text-foreground text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                {{ tl.title }}
              </h3>

              <router-link
                v-if="tl.authorId && tl.authorDisplayName"
                :to="{ name: 'profile', params: { id: tl.authorId } }"
                class="text-[11px] text-foreground-subtle hover:text-primary transition-colors mb-1.5 block truncate"
                @click.stop
              >
                {{ $t('explore.byAuthor', { author: tl.authorDisplayName }) }}
              </router-link>

              <div class="flex items-center justify-between text-[11px] text-foreground-muted">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1">
                    <Download class="h-3 w-3" />
                    {{ tl.downloads || 0 }}
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button
                      @click.stop="vote(tl, 1)"
                      :class="['transition-colors hover:text-primary', tl.userVote === 1 ? 'text-primary' : 'text-foreground-muted']"
                    >
                      <ThumbsUp class="h-3.5 w-3.5" />
                    </button>
                    <span class="text-xs font-medium text-foreground-muted">{{ (tl.upvotes || 0) - (tl.downvotes || 0) }}</span>
                    <button
                      @click.stop="vote(tl, -1)"
                      :class="['transition-colors hover:text-red-400', tl.userVote === -1 ? 'text-red-400' : 'text-foreground-muted']"
                    >
                      <ThumbsDown class="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    @click.stop="shareTierList($event, tl)"
                    class="transition-colors text-foreground-muted hover:text-primary"
                    :title="sharedId === tl._id ? $t('common.linkCopied') : $t('common.share')"
                  >
                    <Check v-if="sharedId === tl._id" class="h-3.5 w-3.5 text-emerald-400" />
                    <Share2 v-else class="h-3.5 w-3.5" />
                  </button>
                </div>
                <span>{{ getRelativeTime(tl.createdAt) }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- My Lists tab -->
      <section v-if="activeTab === 'mine'" :aria-label="$t('explore.mineSectionAria')">
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
            <h2 class="text-lg font-bold text-foreground">{{ $t('explore.drafts') }}</h2>
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
                    :title="$t('common.delete')"
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
            <h2 class="text-lg font-bold text-foreground mb-4">{{ $t('explore.published') }}</h2>
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
                    loading="lazy"
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
                      <option v-for="cat in validCategories" :key="cat" :value="cat">{{ getCategoryLabel(cat) }}</option>
                    </select>
                    <div class="flex gap-2">
                      <button
                        class="flex-1 flex items-center justify-center gap-1 rounded bg-primary py-1.5 text-xs font-medium text-white hover:bg-primary-hover transition-colors"
                        @click="saveEdit"
                      >
                        <Check class="h-3 w-3" />
                        {{ $t('common.save') }}
                      </button>
                      <button
                        class="flex-1 flex items-center justify-center gap-1 rounded bg-surface-hover py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
                        @click="editingList = null"
                      >
                        <X class="h-3 w-3" />
                        {{ $t('common.cancel') }}
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
                          :title="$t('common.edit')"
                          @click="startEdit(tl)"
                        >
                          <Pencil class="h-3.5 w-3.5" />
                        </button>
                        <!-- Toggle visibility -->
                        <button
                          class="p-1.5 rounded text-foreground-subtle hover:text-warning hover:bg-warning/10 transition-colors"
                          :title="(tl as any).isPublic !== false ? $t('explore.makePrivate') : $t('explore.makePublic')"
                          @click="toggleVisibility(tl)"
                        >
                          <EyeOff v-if="(tl as any).isPublic !== false" class="h-3.5 w-3.5" />
                          <Eye v-else class="h-3.5 w-3.5" />
                        </button>
                        <!-- Delete -->
                        <button
                          v-if="confirmDelete !== tl._id"
                          class="p-1.5 rounded text-foreground-subtle hover:text-destructive hover:bg-destructive/10 transition-colors"
                          :title="$t('common.delete')"
                          @click="confirmDelete = tl._id"
                        >
                          <Trash2 class="h-3.5 w-3.5" />
                        </button>
                        <button
                          v-else
                          class="px-2 py-1 rounded bg-destructive text-white text-[10px] font-medium hover:bg-red-600 transition-colors"
                          @click="deleteTierList(tl._id)"
                        >
                          {{ $t('common.confirm') }}
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center justify-between text-xs text-foreground-muted">
                      <div class="flex items-center gap-2">
                        <span :class="['rounded-full px-2 py-0.5 text-[10px] font-medium', getCategoryBadgeColor(tl.category)]">
                          {{ getCategoryLabel(tl.category) }}
                        </span>
                        <span v-if="(tl as any).isPublic === false" class="rounded-full px-2 py-0.5 text-[10px] font-medium bg-foreground-subtle/20 text-foreground-subtle">
                          {{ $t('explore.private') }}
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
          <p class="text-foreground-muted text-lg">{{ $t('explore.mineEmptyTitle') }}</p>
          <p class="text-foreground-subtle text-sm mt-1">{{ $t('explore.mineEmptyHint') }}</p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-border mt-12 py-6 text-center text-xs text-foreground-subtle">
        <nav :aria-label="$t('explore.footerNavAria')" class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-4">
          <router-link to="/tierlists/jeux-video" class="hover:text-foreground transition-colors">{{ $t('explore.footerGaming') }}</router-link>
          <span>&middot;</span>
          <router-link to="/tierlists/anime" class="hover:text-foreground transition-colors">{{ $t('explore.footerAnime') }}</router-link>
          <span>&middot;</span>
          <router-link to="/tierlists/musique" class="hover:text-foreground transition-colors">{{ $t('explore.footerMusic') }}</router-link>
          <span>&middot;</span>
          <router-link to="/tierlists/films" class="hover:text-foreground transition-colors">{{ $t('explore.footerMovies') }}</router-link>
          <span>&middot;</span>
          <router-link to="/tierlists/sport" class="hover:text-foreground transition-colors">{{ $t('explore.footerSports') }}</router-link>
          <span>&middot;</span>
          <router-link to="/tierlists/cuisine" class="hover:text-foreground transition-colors">{{ $t('explore.footerFood') }}</router-link>
        </nav>
        <div class="flex items-center justify-center gap-4">
          <router-link to="/legal" class="hover:text-foreground transition-colors">{{ $t('explore.footerLegal') }}</router-link>
          <span>&middot;</span>
          <a href="mailto:support@tiertogether.fr" class="hover:text-foreground transition-colors">{{ $t('explore.footerContact') }}</a>
          <span>&middot;</span>
          <span>&copy; 2026 TierTogether</span>
        </div>
      </footer>
    </main>
  </div>
</template>
