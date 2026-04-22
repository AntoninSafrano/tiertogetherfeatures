<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import NavBar from '@/components/NavBar.vue'
import { API_BASE } from '@/config'
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-vue-next'

interface ImportItem { id?: string; src: string; label?: string }
interface ImportPayload {
  title: string
  cover?: string | null
  category: string
  items: ImportItem[]
}

const route = useRoute()
const router = useRouter()
const { user, fetchUser } = useAuth()

const ADMIN_EMAILS = new Set(['antonin.safrano@gmail.com', 'wingsoffeed95@gmail.com'])
const CATEGORIES = ['Gaming', 'Food', 'Anime', 'Music', 'Movies', 'Sports', 'Other']

const isAdmin = computed(() => !!user.value && ADMIN_EMAILS.has(user.value.email.toLowerCase()))
const payload = ref<ImportPayload | null>(null)
const parseError = ref<string | null>(null)
const submitError = ref<string | null>(null)
const isSubmitting = ref(false)
const editableTitle = ref('')
const editableCategory = ref('Other')

onMounted(async () => {
  await fetchUser()

  const raw = route.query.payload
  if (typeof raw !== 'string' || !raw) {
    parseError.value = 'Aucun payload reçu. Utilise le snippet depuis une page TierMaker.'
    return
  }
  try {
    const json = decodeURIComponent(escape(atob(raw)))
    const data = JSON.parse(json) as ImportPayload
    if (!data.items?.length) throw new Error('Payload vide')
    // Strip TierMaker suffix
    data.title = (data.title || '').replace(/\s*Tier\s*List(\s*Maker)?\s*$/i, '').trim()
    if (!CATEGORIES.includes(data.category)) data.category = 'Other'
    payload.value = data
    editableTitle.value = data.title
    editableCategory.value = data.category
  } catch (err) {
    parseError.value = `Payload invalide : ${(err as Error).message}`
  }
})

async function submitImport() {
  if (!payload.value || isSubmitting.value) return
  isSubmitting.value = true
  submitError.value = null
  try {
    const res = await fetch(`${API_BASE}/api/admin/import-tiermaker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: editableTitle.value.trim(),
        cover: payload.value.cover,
        category: editableCategory.value,
        items: payload.value.items,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      submitError.value = data.error || `Erreur ${res.status}`
      return
    }
    // Redirect to the new tierlist
    router.replace({ name: 'tierlist-view', params: { id: data.tierlist._id } })
  } catch (err) {
    submitError.value = (err as Error).message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavBar />

    <main class="mx-auto max-w-3xl px-4 py-8 sm:px-10">
      <h1 class="text-2xl font-bold text-foreground">Importer depuis TierMaker</h1>

      <!-- Auth gate -->
      <div v-if="!user" class="mt-8 rounded-xl border border-border bg-surface p-6 text-center">
        <p class="text-foreground-muted">Chargement…</p>
      </div>
      <div v-else-if="!isAdmin" class="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-6">
        <p class="text-sm font-semibold text-red-400">Accès réservé aux administrateurs.</p>
        <p class="mt-1 text-xs text-foreground-muted">Tu es connecté en tant que {{ user.email }}.</p>
      </div>

      <!-- Parse error -->
      <div v-else-if="parseError" class="mt-8 rounded-xl border border-red-500/40 bg-red-500/10 p-6">
        <p class="text-sm font-semibold text-red-400 flex items-center gap-2">
          <XCircle class="h-4 w-4" />
          {{ parseError }}
        </p>
        <p class="mt-2 text-xs text-foreground-muted">
          Ouvre une tierlist sur TierMaker, exécute le snippet console, il redirigera ici automatiquement.
        </p>
      </div>

      <!-- Preview + submit -->
      <div v-else-if="payload" class="mt-8 space-y-6">
        <div class="rounded-xl border border-border bg-surface p-5">
          <p class="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Aperçu de l'import</p>

          <div class="mt-4 flex gap-5">
            <img
              v-if="payload.cover"
              :src="payload.cover"
              alt=""
              class="h-28 w-28 shrink-0 rounded-lg border border-border-hover object-cover"
              referrerpolicy="no-referrer"
            />
            <div class="flex-1 space-y-3">
              <label class="block">
                <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Titre</span>
                <input
                  v-model="editableTitle"
                  type="text"
                  maxlength="100"
                  class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Catégorie</span>
                <select
                  v-model="editableCategory"
                  class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                >
                  <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
                </select>
              </label>
              <p class="text-xs text-foreground-muted">
                <span class="font-semibold text-foreground">{{ payload.items.length }}</span> items — toutes les images sont déjà sur notre Cloudinary.
              </p>
            </div>
          </div>
        </div>

        <!-- Items grid preview -->
        <div class="rounded-xl border border-border bg-surface p-4">
          <p class="mb-3 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
            Items ({{ payload.items.length }})
          </p>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
            <div
              v-for="(it, i) in payload.items.slice(0, 60)"
              :key="i"
              class="aspect-square overflow-hidden rounded-md border border-border-hover bg-cover bg-center"
              :style="{ backgroundImage: `url(${it.src})` }"
              :title="it.label || ''"
            />
            <div
              v-if="payload.items.length > 60"
              class="aspect-square flex items-center justify-center rounded-md border border-border-hover bg-surface-hover text-xs font-medium text-foreground-muted"
            >
              +{{ payload.items.length - 60 }}
            </div>
          </div>
        </div>

        <p v-if="submitError" class="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {{ submitError }}
        </p>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm text-foreground-muted hover:bg-surface-hover transition-colors"
            @click="router.replace({ name: 'explore' })"
          >
            Annuler
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
            :disabled="isSubmitting || editableTitle.trim().length < 2"
            @click="submitImport"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            <CheckCircle v-else class="h-4 w-4" />
            {{ isSubmitting ? 'Import…' : 'Importer sur TierTogether' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
