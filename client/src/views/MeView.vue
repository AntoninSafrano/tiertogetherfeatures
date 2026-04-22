<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useCloudinary } from '@/composables/useCloudinary'
import { getCategoryBadgeColor } from '@/lib/utils'
import NavBar from '@/components/NavBar.vue'
import AvatarCropper from '@/components/AvatarCropper.vue'
import {
  Calendar,
  Camera,
  Clock,
  Download,
  Eye,
  EyeOff,
  LayoutGrid,
  LogOut,
  Mail,
  Pencil,
  ShieldCheck,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-vue-next'
import { API_BASE } from '@/config'

interface MyTierList {
  _id: string
  roomId: string
  title: string
  category: string
  coverImage: string
  isPublic: boolean
  downloads: number
  upvotes: number
  rows: { id: string; label: string; color: string; items: { id: string; imageUrl: string; label: string }[] }[]
  pool: { id: string; imageUrl: string; label: string }[]
  createdAt: string
  updatedAt: string
}

const router = useRouter()
const { user, fetchUser, logout, updateProfile } = useAuth()
const { uploadImage } = useCloudinary()

const isLoadingLists = ref(true)
const tierlists = ref<MyTierList[]>([])
const fetchError = ref<string | null>(null)

const showEditModal = ref(false)
const editDisplayName = ref('')
const editAvatar = ref('')
const avatarFileInput = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)
const cropperSrc = ref<string | null>(null)
const editError = ref<string | null>(null)
const isSaving = ref(false)

const confirmDelete = ref<MyTierList | null>(null)
const deleteError = ref<string | null>(null)
const isDeleting = ref(false)

const CATEGORY_LABELS: Record<string, string> = {
  Gaming: 'Jeux vidéo',
  Food: 'Cuisine',
  Anime: 'Anime',
  Music: 'Musique',
  Movies: 'Films',
  Sports: 'Sport',
  Other: 'Autre',
}

function getCategoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat
}

function getCoverImage(tl: MyTierList): string {
  if (tl.coverImage) return tl.coverImage
  for (const row of tl.rows ?? []) {
    for (const item of row.items ?? []) {
      if (item.imageUrl) return item.imageUrl
    }
  }
  for (const item of tl.pool ?? []) {
    if (item.imageUrl) return item.imageUrl
  }
  return ''
}

const recentLists = computed(() => tierlists.value.slice(0, 5))

const stats = computed(() => {
  const total = tierlists.value.length
  const publicCount = tierlists.value.filter(t => t.isPublic).length
  const downloads = tierlists.value.reduce((sum, t) => sum + (t.downloads || 0), 0)
  const upvotes = tierlists.value.reduce((sum, t) => sum + (t.upvotes || 0), 0)
  return { total, publicCount, privateCount: total - publicCount, downloads, upvotes }
})

const memberSince = computed(() => {
  if (tierlists.value.length === 0) return null
  const oldest = [...tierlists.value].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )[0]
  return oldest?.createdAt ?? null
})

async function fetchTierlists() {
  isLoadingLists.value = true
  fetchError.value = null
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/mine`, { credentials: 'include' })
    if (!res.ok) {
      fetchError.value = 'Impossible de charger vos tier lists.'
      return
    }
    const data = await res.json()
    tierlists.value = data.tierlists ?? []
  } catch {
    fetchError.value = 'Erreur réseau.'
  } finally {
    isLoadingLists.value = false
  }
}

onMounted(async () => {
  await fetchUser()
  if (!user.value) {
    router.replace({ name: 'auth', query: { redirect: '/me' } })
    return
  }
  await fetchTierlists()
})

function openEditModal() {
  if (!user.value) return
  editDisplayName.value = user.value.displayName
  editAvatar.value = user.value.avatar || ''
  editError.value = null
  showEditModal.value = true
}

function onAvatarFile(evt: Event) {
  const input = evt.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    editError.value = "Le fichier doit être une image."
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    editError.value = "L'image ne doit pas dépasser 5 Mo."
    return
  }
  editError.value = null
  cropperSrc.value = URL.createObjectURL(file)
}

function onCropperClose() {
  if (cropperSrc.value) URL.revokeObjectURL(cropperSrc.value)
  cropperSrc.value = null
}

async function onCropperConfirm(blob: Blob) {
  const src = cropperSrc.value
  cropperSrc.value = null
  if (src) URL.revokeObjectURL(src)
  isUploadingAvatar.value = true
  editError.value = null
  try {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    const url = await uploadImage(file)
    editAvatar.value = url
  } catch (err) {
    console.error(err)
    editError.value = "Échec de l'upload de l'image."
  } finally {
    isUploadingAvatar.value = false
  }
}

async function saveProfile() {
  if (isSaving.value || isUploadingAvatar.value) return
  isSaving.value = true
  editError.value = null
  const res = await updateProfile(editDisplayName.value.trim(), editAvatar.value)
  isSaving.value = false
  if (res.success) {
    showEditModal.value = false
  } else {
    editError.value = res.error ?? 'Échec de la mise à jour'
  }
}

async function handleLogout() {
  await logout()
  router.push({ name: 'explore' })
}

function viewTierlist(id: string) {
  router.push({ name: 'tierlist-view', params: { id } })
}

function goToRoom(roomId: string) {
  router.push({ name: 'room', params: { id: roomId } })
}

function askDelete(tl: MyTierList, evt: Event) {
  evt.stopPropagation()
  deleteError.value = null
  confirmDelete.value = tl
}

async function deleteTierlist() {
  if (!confirmDelete.value || isDeleting.value) return
  const id = confirmDelete.value._id
  isDeleting.value = true
  deleteError.value = null
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      deleteError.value = data.error || 'Échec de la suppression'
      return
    }
    tierlists.value = tierlists.value.filter(t => t._id !== id)
    confirmDelete.value = null
  } catch {
    deleteError.value = 'Erreur réseau'
  } finally {
    isDeleting.value = false
  }
}

function formatRelative(d: string): string {
  const then = new Date(d).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - then)
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const days = Math.floor(h / 24)
  if (days < 7) return `il y a ${days} j`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `il y a ${weeks} sem`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavBar />

    <div v-if="!user" class="flex min-h-[60vh] items-center justify-center">
      <p class="text-sm text-foreground-muted">Redirection…</p>
    </div>

    <main v-else class="mx-auto max-w-6xl px-4 py-8 sm:px-10">
      <!-- Profile header -->
      <section class="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-5">
            <div
              :class="['flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full',
                user.avatar ? 'bg-surface-hover' : 'bg-primary']"
            >
              <img
                v-if="user.avatar"
                :src="user.avatar"
                :alt="user.displayName"
                class="h-20 w-20 rounded-full object-cover"
                referrerpolicy="no-referrer"
              />
              <span v-else class="text-2xl font-bold text-white">
                {{ user.displayName?.[0]?.toUpperCase() }}
              </span>
            </div>
            <div class="min-w-0">
              <h1 class="truncate text-2xl font-bold text-foreground">{{ user.displayName }}</h1>
              <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
                <span class="inline-flex items-center gap-1">
                  <Mail class="h-3.5 w-3.5" />
                  {{ user.email }}
                </span>
                <span v-if="memberSince" class="inline-flex items-center gap-1">
                  <Calendar class="h-3.5 w-3.5" />
                  Membre depuis le {{ formatDate(memberSince) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              class="inline-flex items-center gap-2 rounded-lg border border-border-hover bg-surface-hover px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-active transition-colors"
              @click="openEditModal"
            >
              <Pencil class="h-4 w-4" />
              Modifier
            </button>
            <button
              class="inline-flex items-center gap-2 rounded-lg border border-border-hover bg-surface-hover px-4 py-2 text-sm font-medium text-foreground hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-colors"
              @click="handleLogout"
            >
              <LogOut class="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>

        <!-- Stats strip -->
        <div class="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
          <div class="rounded-lg bg-surface-hover px-4 py-3">
            <div class="flex items-center gap-2 text-xs text-foreground-muted">
              <LayoutGrid class="h-3.5 w-3.5" />
              Tier lists
            </div>
            <p class="mt-1 text-xl font-bold text-foreground">{{ stats.total }}</p>
          </div>
          <div class="rounded-lg bg-surface-hover px-4 py-3">
            <div class="flex items-center gap-2 text-xs text-foreground-muted">
              <Eye class="h-3.5 w-3.5" />
              Publiques
            </div>
            <p class="mt-1 text-xl font-bold text-foreground">{{ stats.publicCount }}</p>
          </div>
          <div class="rounded-lg bg-surface-hover px-4 py-3">
            <div class="flex items-center gap-2 text-xs text-foreground-muted">
              <Download class="h-3.5 w-3.5" />
              Téléchargements
            </div>
            <p class="mt-1 text-xl font-bold text-foreground">{{ stats.downloads }}</p>
          </div>
          <div class="rounded-lg bg-surface-hover px-4 py-3">
            <div class="flex items-center gap-2 text-xs text-foreground-muted">
              <ThumbsUp class="h-3.5 w-3.5" />
              Upvotes
            </div>
            <p class="mt-1 text-xl font-bold text-foreground">{{ stats.upvotes }}</p>
          </div>
        </div>
      </section>

      <!-- Recent activity -->
      <section class="mt-8">
        <div class="flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-bold text-foreground">
            <Clock class="h-5 w-5 text-primary" />
            Activité récente
          </h2>
        </div>

        <div v-if="isLoadingLists" class="mt-4 text-sm text-foreground-muted">
          Chargement…
        </div>
        <div v-else-if="fetchError" class="mt-4 text-sm text-destructive">{{ fetchError }}</div>
        <div v-else-if="recentLists.length === 0" class="mt-4 rounded-lg border border-border bg-surface p-6 text-center text-sm text-foreground-muted">
          Aucune activité pour le moment. Créez votre première tier list !
        </div>
        <ul v-else class="mt-4 space-y-2">
          <li
            v-for="tl in recentLists"
            :key="tl._id"
            class="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-hover cursor-pointer"
            @click="tl.isPublic ? viewTierlist(tl._id) : goToRoom(tl.roomId)"
          >
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-hover">
              <img
                v-if="getCoverImage(tl)"
                :src="getCoverImage(tl)"
                :alt="tl.title"
                class="h-full w-full object-cover"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-foreground">{{ tl.title }}</p>
              <p class="text-xs text-foreground-muted">
                {{ formatRelative(tl.updatedAt) }}
              </p>
            </div>
            <div :class="['inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold leading-none', getCategoryBadgeColor(tl.category)]">
              {{ getCategoryLabel(tl.category) }}
            </div>
            <div
              :class="['inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-bold leading-none',
                tl.isPublic ? 'bg-emerald-500/15 text-emerald-400' : 'bg-foreground-subtle/15 text-foreground-muted']"
            >
              <Eye v-if="tl.isPublic" class="h-2.5 w-2.5" />
              <EyeOff v-else class="h-2.5 w-2.5" />
              {{ tl.isPublic ? 'Publique' : 'Privée' }}
            </div>
          </li>
        </ul>
      </section>

      <!-- All tier lists -->
      <section class="mt-10">
        <div class="flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-lg font-bold text-foreground">
            <LayoutGrid class="h-5 w-5 text-primary" />
            Mes tier lists
            <span class="text-sm font-normal text-foreground-muted">({{ stats.total }})</span>
          </h2>
        </div>

        <div v-if="isLoadingLists" class="mt-4 text-sm text-foreground-muted">Chargement…</div>
        <div v-else-if="tierlists.length === 0" class="mt-4 rounded-lg border border-border bg-surface p-6 text-center text-sm text-foreground-muted">
          Vous n'avez encore créé aucune tier list.
        </div>
        <div v-else class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <article
            v-for="tl in tierlists"
            :key="tl._id"
            class="group relative cursor-pointer overflow-hidden rounded-xl border border-transparent bg-surface transition-all duration-300 hover:border-border-hover"
            @click="tl.isPublic ? viewTierlist(tl._id) : goToRoom(tl.roomId)"
          >
            <!-- Privacy badge (top-left) -->
            <div
              :class="['absolute top-2 left-2 z-10 inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-bold leading-none backdrop-blur-sm',
                tl.isPublic ? 'bg-emerald-500/90 text-white' : 'bg-black/70 text-foreground-muted']"
            >
              <Eye v-if="tl.isPublic" class="h-2.5 w-2.5" />
              <EyeOff v-else class="h-2.5 w-2.5" />
              {{ tl.isPublic ? 'Publique' : 'Privée' }}
            </div>

            <!-- Category badge (top-right) -->
            <div :class="['absolute top-2 right-2 z-10 inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold leading-none backdrop-blur-sm', getCategoryBadgeColor(tl.category)]">
              {{ getCategoryLabel(tl.category) }}
            </div>

            <!-- Cover -->
            <div class="h-36 overflow-hidden bg-gradient-to-br from-surface-hover to-surface">
              <img
                v-if="getCoverImage(tl)"
                :src="getCoverImage(tl)"
                :alt="tl.title"
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <!-- Delete button (bottom-right, hover-reveal) -->
            <button
              type="button"
              class="absolute bottom-2 right-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-red-400 opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-500/90 hover:text-white group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
              :aria-label="`Supprimer la tier list ${tl.title}`"
              @click.stop="askDelete(tl, $event)"
            >
              <Trash2 class="h-4 w-4" />
            </button>

            <!-- Info -->
            <div class="p-3.5">
              <h3 class="mb-1 line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {{ tl.title }}
              </h3>
              <div class="flex items-center justify-between text-[11px] text-foreground-muted">
                <span>{{ formatRelative(tl.updatedAt) }}</span>
                <span v-if="tl.isPublic" class="inline-flex items-center gap-3">
                  <span class="inline-flex items-center gap-1">
                    <Download class="h-3 w-3" />
                    {{ tl.downloads || 0 }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <ThumbsUp class="h-3 w-3" />
                    {{ tl.upvotes || 0 }}
                  </span>
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>

    <!-- Avatar cropper -->
    <AvatarCropper
      v-if="cropperSrc"
      :src="cropperSrc"
      @close="onCropperClose"
      @confirm="onCropperConfirm"
    />

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div
        v-if="confirmDelete"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="confirmDelete = null"
      >
        <div class="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl">
          <h3 class="text-base font-semibold text-foreground">Supprimer cette tier list ?</h3>
          <p class="mt-2 text-sm text-foreground-muted">
            <span class="font-medium text-foreground">{{ confirmDelete.title }}</span> sera définitivement supprimée. Cette action est irréversible.
          </p>
          <p v-if="deleteError" class="mt-3 text-xs text-destructive">{{ deleteError }}</p>
          <div class="mt-5 flex justify-end gap-2">
            <button
              class="rounded-lg px-4 py-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover transition-colors"
              :disabled="isDeleting"
              @click="confirmDelete = null"
            >
              Annuler
            </button>
            <button
              class="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              :disabled="isDeleting"
              @click="deleteTierlist"
            >
              <Trash2 class="h-3.5 w-3.5" />
              {{ isDeleting ? 'Suppression…' : 'Supprimer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit profile modal -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        @click.self="showEditModal = false"
      >
        <div class="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold text-foreground">Modifier mon profil</h3>
              <p class="mt-1 text-xs text-foreground-muted">Ton pseudo est visible publiquement sur tes tier lists.</p>
            </div>
            <button
              class="text-foreground-muted hover:text-foreground transition-colors"
              @click="showEditModal = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Avatar upload -->
          <div class="mt-5 flex items-center gap-4">
            <div
              :class="['relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full',
                editAvatar ? 'bg-surface-hover' : 'bg-primary']"
            >
              <img
                v-if="editAvatar"
                :src="editAvatar"
                alt=""
                class="h-20 w-20 rounded-full object-cover"
                referrerpolicy="no-referrer"
              />
              <span v-else-if="user" class="text-2xl font-bold text-white">
                {{ user.displayName?.[0]?.toUpperCase() }}
              </span>
              <div
                v-if="isUploadingAvatar"
                class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-[10px] font-medium text-white"
              >
                Upload…
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-border-hover bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-active transition-colors disabled:opacity-50"
                :disabled="isUploadingAvatar"
                @click="avatarFileInput?.click()"
              >
                <Camera class="h-3.5 w-3.5" />
                Changer la photo
              </button>
              <button
                v-if="editAvatar"
                type="button"
                class="text-left text-[11px] font-medium text-foreground-muted hover:text-red-400 transition-colors"
                :disabled="isUploadingAvatar"
                @click="editAvatar = ''"
              >
                Retirer la photo
              </button>
            </div>
            <input
              ref="avatarFileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarFile"
            />
          </div>

          <label class="mt-5 block">
            <span class="mb-1 block text-xs font-medium text-foreground-muted">Pseudo</span>
            <input
              v-model="editDisplayName"
              type="text"
              maxlength="30"
              class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder="Votre pseudo"
              @keyup.enter="saveProfile"
            />
          </label>

          <div class="mt-3 flex items-center gap-2 rounded-md bg-surface-hover px-3 py-2 text-xs text-foreground-muted">
            <ShieldCheck class="h-3.5 w-3.5 shrink-0" />
            Ton email ne peut pas être modifié.
          </div>

          <p v-if="editError" class="mt-3 text-xs text-destructive">{{ editError }}</p>

          <div class="mt-5 flex justify-end gap-2">
            <button
              class="rounded-lg px-4 py-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover transition-colors"
              @click="showEditModal = false"
            >
              Annuler
            </button>
            <button
              class="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
              :disabled="isSaving || isUploadingAvatar || editDisplayName.trim().length < 2"
              @click="saveProfile"
            >
              {{ isSaving ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
