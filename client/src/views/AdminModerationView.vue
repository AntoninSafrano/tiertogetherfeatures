<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import NavBar from '@/components/NavBar.vue'
import { API_BASE } from '@/config'
import { Flag, Trash2, EyeOff, Check, RefreshCw, Search, Loader2, BarChart3 } from 'lucide-vue-next'
// Chat reports feature removed — banned-word filter is enough, no need to
// signal individual messages.

interface TierListMini {
  _id: string
  title: string
  category: string
  coverImage: string
  isPublic: boolean
  authorId: string
  ownerId: string
  roomId: string
  downloads?: number
  upvotes?: number
  downvotes?: number
  createdAt?: string
  updatedAt?: string
  authorDisplayName?: string | null
  authorEmail?: string | null
}

interface ReportItem {
  _id: string
  tierListId: string
  reporterId: string | null
  reason: string
  details: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: string
  tierList: TierListMini | null
  reporter: { _id: string; displayName: string; email: string } | null
}

const ADMIN_EMAILS = new Set(['antonin.safrano@gmail.com', 'wingsoffeed95@gmail.com'])
const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Inapproprié',
  spam: 'Spam',
  copyright: 'Copyright',
  duplicate: 'Doublon',
  other: 'Autre',
}

const router = useRouter()
const { user, fetchUser } = useAuth()
const isAdmin = computed(() => !!user.value && ADMIN_EMAILS.has(user.value.email.toLowerCase()))

const tab = ref<'reports' | 'publications'>('reports')

// Reports tab
const reports = ref<ReportItem[]>([])
const reportStatus = ref<'pending' | 'resolved' | 'dismissed' | 'all'>('pending')
const loadingReports = ref(false)
const busyReports = ref<Set<string>>(new Set())

// Publications tab
const tierlists = ref<TierListMini[]>([])
const tlScope = ref<'public' | 'private'>('public')
const tlSearch = ref('')
const loadingTierlists = ref(false)
const busyTierlists = ref<Set<string>>(new Set())

const confirmDelete = ref<TierListMini | null>(null)

async function fetchReports() {
  loadingReports.value = true
  try {
    const res = await fetch(`${API_BASE}/api/admin/reports?status=${reportStatus.value}`, { credentials: 'include' })
    const data = await res.json()
    reports.value = data.reports ?? []
  } finally {
    loadingReports.value = false
  }
}

async function fetchTierlists() {
  loadingTierlists.value = true
  try {
    const qs = new URLSearchParams({ scope: tlScope.value })
    if (tlSearch.value.trim()) qs.set('search', tlSearch.value.trim())
    const res = await fetch(`${API_BASE}/api/admin/tierlists?${qs}`, { credentials: 'include' })
    const data = await res.json()
    tierlists.value = data.tierlists ?? []
  } finally {
    loadingTierlists.value = false
  }
}

async function resolveReport(rep: ReportItem, action: 'dismiss' | 'unpublish' | 'delete') {
  if (busyReports.value.has(rep._id)) return
  busyReports.value.add(rep._id)
  try {
    const res = await fetch(`${API_BASE}/api/admin/reports/${rep._id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      reports.value = reports.value.filter(r => r._id !== rep._id)
    }
  } finally {
    busyReports.value.delete(rep._id)
  }
}

async function unpublishTl(tl: TierListMini) {
  if (busyTierlists.value.has(tl._id)) return
  busyTierlists.value.add(tl._id)
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${tl._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isPublic: false }),
    })
    if (res.ok) {
      if (tlScope.value === 'public') {
        tierlists.value = tierlists.value.filter(t => t._id !== tl._id)
      } else {
        tl.isPublic = false
      }
    }
  } finally {
    busyTierlists.value.delete(tl._id)
  }
}

async function deleteTl(tl: TierListMini) {
  if (busyTierlists.value.has(tl._id)) return
  busyTierlists.value.add(tl._id)
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${tl._id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      tierlists.value = tierlists.value.filter(t => t._id !== tl._id)
      reports.value = reports.value.filter(r => r.tierList?._id !== tl._id)
    }
  } finally {
    busyTierlists.value.delete(tl._id)
    confirmDelete.value = null
  }
}

function formatDate(d?: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(async () => {
  await fetchUser()
  if (!isAdmin.value) return
  await Promise.all([fetchReports(), fetchTierlists()])
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavBar />

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-10">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Flag class="h-6 w-6 text-amber-400" />
          Modération
        </h1>
        <router-link
          :to="{ name: 'stats' }"
          class="inline-flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-all"
        >
          <BarChart3 class="h-4 w-4" />
          Statistiques
        </router-link>
      </div>

      <div v-if="!user" class="mt-8 text-sm text-foreground-muted">Chargement…</div>
      <div v-else-if="!isAdmin" class="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-6">
        <p class="text-sm font-semibold text-red-400">Accès réservé aux administrateurs.</p>
      </div>

      <template v-else>
        <!-- Tabs -->
        <div class="mt-6 flex gap-1 border-b border-border">
          <button
            type="button"
            :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === 'reports' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']"
            @click="tab = 'reports'"
          >
            Signalements
            <span v-if="reports.length" class="ml-1 rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-400">{{ reports.length }}</span>
          </button>
          <button
            type="button"
            :class="['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === 'publications' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']"
            @click="tab = 'publications'"
          >
            Publications
          </button>
        </div>

        <!-- Reports tab -->
        <section v-if="tab === 'reports'" class="mt-6">
          <div class="flex flex-wrap items-center gap-3">
            <label class="text-xs text-foreground-muted">Statut</label>
            <select
              v-model="reportStatus"
              class="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              @change="fetchReports"
            >
              <option value="pending">En attente</option>
              <option value="resolved">Résolus</option>
              <option value="dismissed">Ignorés</option>
              <option value="all">Tous</option>
            </select>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md border border-border-hover bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-active transition-colors"
              @click="fetchReports"
            >
              <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loadingReports }" />
              Actualiser
            </button>
          </div>

          <div v-if="loadingReports" class="mt-6 text-sm text-foreground-muted">Chargement…</div>
          <div v-else-if="reports.length === 0" class="mt-6 rounded-lg border border-border bg-surface p-6 text-center text-sm text-foreground-muted">
            Aucun signalement {{ reportStatus === 'pending' ? 'en attente' : '' }}.
          </div>
          <ul v-else class="mt-4 space-y-3">
            <li
              v-for="rep in reports"
              :key="rep._id"
              class="flex gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div class="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-hover">
                <img
                  v-if="rep.tierList?.coverImage"
                  :src="rep.tierList.coverImage"
                  :alt="rep.tierList.title"
                  class="h-full w-full object-cover"
                  referrerpolicy="no-referrer"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-foreground">
                      {{ rep.tierList?.title ?? '[Tier list supprimée]' }}
                    </p>
                    <div class="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                      <span class="rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-400">{{ REASON_LABELS[rep.reason] }}</span>
                      <span>·</span>
                      <span>Par {{ rep.reporter?.displayName || 'Anonyme' }}</span>
                      <span>·</span>
                      <span>{{ formatDate(rep.createdAt) }}</span>
                      <span v-if="rep.tierList" class="truncate">· {{ rep.tierList.category }}</span>
                    </div>
                    <p v-if="rep.details" class="mt-2 text-xs text-foreground break-words whitespace-pre-wrap">« {{ rep.details }} »</p>
                  </div>
                  <div v-if="rep.tierList" class="flex flex-col gap-1.5">
                    <router-link
                      :to="{ name: 'tierlist-view', params: { id: rep.tierList._id } }"
                      target="_blank"
                      class="rounded-md border border-border-hover bg-surface-hover px-3 py-1 text-[11px] font-medium text-foreground hover:bg-surface-active transition-colors text-center"
                    >
                      Voir
                    </router-link>
                  </div>
                </div>
                <div v-if="rep.status === 'pending' && rep.tierList" class="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-md border border-border-hover bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50"
                    :disabled="busyReports.has(rep._id)"
                    @click="resolveReport(rep, 'dismiss')"
                  >
                    <Check class="h-3.5 w-3.5" />
                    Ignorer
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                    :disabled="busyReports.has(rep._id)"
                    @click="resolveReport(rep, 'unpublish')"
                  >
                    <EyeOff class="h-3.5 w-3.5" />
                    Dépublier
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    :disabled="busyReports.has(rep._id)"
                    @click="resolveReport(rep, 'delete')"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
                <p v-else-if="rep.status !== 'pending'" class="mt-2 text-[11px] text-foreground-subtle">
                  {{ rep.status === 'resolved' ? 'Résolu' : 'Ignoré' }}
                </p>
              </div>
            </li>
          </ul>
        </section>

        <!-- Publications tab -->
        <section v-else-if="tab === 'publications'" class="mt-6">
          <div class="flex flex-wrap items-center gap-3">
            <select
              v-model="tlScope"
              class="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              @change="fetchTierlists"
            >
              <option value="public">Publiques</option>
              <option value="private">Privées</option>
            </select>
            <div class="relative flex-1 max-w-xs">
              <Search class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
              <input
                v-model="tlSearch"
                type="text"
                placeholder="Rechercher un titre…"
                class="w-full rounded-md border border-border bg-surface pl-8 pr-3 py-1.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
                @keyup.enter="fetchTierlists"
              />
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md border border-border-hover bg-surface-hover px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-active transition-colors"
              @click="fetchTierlists"
            >
              <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loadingTierlists }" />
              Actualiser
            </button>
          </div>

          <div v-if="loadingTierlists" class="mt-6 text-sm text-foreground-muted">Chargement…</div>
          <div v-else-if="tierlists.length === 0" class="mt-6 rounded-lg border border-border bg-surface p-6 text-center text-sm text-foreground-muted">
            Aucune tier list.
          </div>
          <ul v-else class="mt-4 space-y-2">
            <li
              v-for="tl in tierlists"
              :key="tl._id"
              class="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div class="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-hover">
                <img
                  v-if="tl.coverImage"
                  :src="tl.coverImage"
                  :alt="tl.title"
                  class="h-full w-full object-cover"
                  referrerpolicy="no-referrer"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-foreground">{{ tl.title }}</p>
                <div class="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                  <span class="rounded px-1.5 py-0.5 bg-surface-hover">{{ tl.category }}</span>
                  <span v-if="tl.isPublic" class="text-emerald-400">Publique</span>
                  <span v-else class="text-foreground-subtle">Privée</span>
                  <span>·</span>
                  <span>{{ tl.authorDisplayName || 'Système' }}</span>
                  <span v-if="tl.authorEmail">({{ tl.authorEmail }})</span>
                  <span>·</span>
                  <span>{{ tl.downloads || 0 }} DL</span>
                  <span>·</span>
                  <span>{{ formatDate(tl.updatedAt) }}</span>
                </div>
              </div>
              <router-link
                :to="{ name: 'tierlist-view', params: { id: tl._id } }"
                target="_blank"
                class="rounded-md border border-border-hover bg-surface-hover px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-active transition-colors"
              >
                Voir
              </router-link>
              <button
                v-if="tl.isPublic"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                :disabled="busyTierlists.has(tl._id)"
                @click="unpublishTl(tl)"
              >
                <EyeOff class="h-3.5 w-3.5" />
                Dépublier
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                :aria-label="`Supprimer ${tl.title}`"
                @click="confirmDelete = tl"
              >
                <Trash2 class="h-3.5 w-3.5" />
                Supprimer
              </button>
            </li>
          </ul>
        </section>
      </template>
    </main>

    <!-- Delete confirmation -->
    <Teleport to="body">
      <div
        v-if="confirmDelete"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        @click.self="confirmDelete = null"
      >
        <div class="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl">
          <h3 class="text-base font-semibold text-foreground">Supprimer cette tier list ?</h3>
          <p class="mt-2 text-sm text-foreground-muted">
            <span class="font-medium text-foreground">{{ confirmDelete.title }}</span> sera définitivement supprimée. Action irréversible.
          </p>
          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover transition-colors"
              @click="confirmDelete = null"
            >
              Annuler
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              :disabled="busyTierlists.has(confirmDelete._id)"
              @click="deleteTl(confirmDelete!)"
            >
              <Loader2 v-if="busyTierlists.has(confirmDelete._id)" class="h-3.5 w-3.5 animate-spin" />
              <Trash2 v-else class="h-3.5 w-3.5" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
