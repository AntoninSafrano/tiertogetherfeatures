<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import TierRow from '@/components/tierlist/TierRow.vue'
import TierItem from '@/components/tierlist/TierItem.vue'
import { useRoomStore } from '@/stores/room'
import { ArrowLeft, Download, Calendar, LayoutGrid, Copy, Settings2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()

const API_BASE = 'http://localhost:3001'

interface TierListData {
  _id: string
  roomId: string
  title: string
  rows: { id: string; label: string; color: string; items: { id: string; imageUrl: string; label: string }[] }[]
  pool: { id: string; imageUrl: string; label: string }[]
  downloads: number
  category: string
  coverImage: string
  createdAt: string
}

const tierlist = ref<TierListData | null>(null)
const isLoading = ref(true)
const error = ref('')
const isCloning = ref(false)
const activeRowMenu = ref<string | null>(null)

function toggleRowMenu(rowId: string) {
  activeRowMenu.value = activeRowMenu.value === rowId ? null : rowId
}

function deleteRow(index: number) {
  if (!tierlist.value) return
  const row = tierlist.value.rows[index]
  tierlist.value.pool.push(...row.items)
  tierlist.value.rows.splice(index, 1)
  activeRowMenu.value = null
}

function changeRowColor(index: number, color: string) {
  if (!tierlist.value) return
  tierlist.value.rows[index].color = color
}

const totalItems = computed(() => {
  if (!tierlist.value) return 0
  const rowItems = tierlist.value.rows.reduce((sum, r) => sum + r.items.length, 0)
  return rowItems + tierlist.value.pool.length
})

async function fetchTierList() {
  isLoading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${route.params.id}`)
    if (!res.ok) {
      error.value = 'Tier list introuvable'
      return
    }
    const data = await res.json()
    tierlist.value = data.tierlist
  } catch {
    error.value = 'Impossible de charger la tier list'
  } finally {
    isLoading.value = false
  }
}

async function cloneAndUse() {
  if (!tierlist.value || isCloning.value) return
  isCloning.value = true
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${tierlist.value._id}/clone`, {
      method: 'POST',
      credentials: 'include',
    })
    const data = await res.json()
    if (data.success && data.roomId) {
      roomStore.saveRoomToHistory(data.roomId, tierlist.value.title)
      router.push({ name: 'room', params: { id: data.roomId } })
    }
  } catch (err) {
    console.error('Clone failed:', err)
  } finally {
    isCloning.value = false
  }
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

onMounted(() => {
  fetchTierList()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavBar />

    <main class="mx-auto max-w-4xl px-4 py-8">
      <!-- Back button -->
      <button
        class="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6"
        @click="router.push({ name: 'explore' })"
      >
        <ArrowLeft class="h-4 w-4" />
        Retour à l'exploration
      </button>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4">
        <div class="h-8 w-2/3 rounded bg-surface-hover animate-pulse" />
        <div class="h-4 w-1/3 rounded bg-surface-hover animate-pulse" />
        <div class="space-y-1 mt-6">
          <div v-for="i in 5" :key="i" class="h-[100px] rounded bg-surface-hover/50 animate-pulse" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-16">
        <p class="text-foreground-muted text-lg">{{ error }}</p>
        <button
          class="mt-4 rounded-lg bg-surface-hover border border-border-hover px-4 py-2 text-sm text-foreground hover:bg-surface-active transition-colors"
          @click="router.push({ name: 'explore' })"
        >
          Retour à l'exploration
        </button>
      </div>

      <!-- Content -->
      <template v-else-if="tierlist">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground mb-3">{{ tierlist.title }}</h1>
          <div class="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
            <span :class="['rounded-full px-2.5 py-0.5 text-xs font-medium', getCategoryColor(tierlist.category)]">
              {{ tierlist.category }}
            </span>
            <span class="inline-flex items-center gap-1">
              <Download class="h-3.5 w-3.5" />
              {{ tierlist.downloads || 0 }} téléchargements
            </span>
            <span class="inline-flex items-center gap-1">
              <LayoutGrid class="h-3.5 w-3.5" />
              {{ totalItems }} éléments
            </span>
            <span class="inline-flex items-center gap-1">
              <Calendar class="h-3.5 w-3.5" />
              {{ new Date(tierlist.createdAt).toLocaleDateString() }}
            </span>
          </div>
        </div>

        <!-- Use Template button -->
        <div class="mb-6">
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isCloning"
            @click="cloneAndUse"
          >
            <Copy class="h-4 w-4" />
            {{ isCloning ? 'Création...' : 'Utiliser comme modèle' }}
          </button>
        </div>

        <!-- Tier Rows -->
        <div class="rounded-xl border border-border-hover bg-surface overflow-visible shadow-2xl">
          <div
            v-for="(row, index) in tierlist.rows"
            :key="row.id"
            class="group/preview relative"
          >
            <TierRow
              :row-index="index"
              :readonly="true"
              :row="row"
            />

            <!-- Gear button -->
            <button
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-surface-hover/80 p-1.5 text-foreground-muted opacity-0 transition-all hover:bg-surface-active hover:text-foreground group-hover/preview:opacity-100"
              @click.stop="toggleRowMenu(row.id)"
            >
              <Settings2 class="h-4 w-4" />
            </button>

            <!-- Row menu popover -->
            <div
              v-if="activeRowMenu === row.id"
              class="absolute right-10 top-1/2 -translate-y-1/2 z-50 rounded-lg border border-border-hover bg-surface-hover p-3 shadow-xl"
            >
              <div class="flex flex-col gap-2 min-w-[140px]">
                <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="color"
                    :value="row.color"
                    class="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                    @input="changeRowColor(index, ($event.target as HTMLInputElement).value)"
                  />
                  Couleur
                </label>
                <button
                  class="rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors text-left"
                  @click="deleteRow(index)"
                >
                  Supprimer la ligne
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pool -->
        <div v-if="tierlist.pool.length > 0" class="mt-6">
          <h2 class="text-sm font-semibold text-foreground-muted mb-3">Pool ({{ tierlist.pool.length }} éléments)</h2>
          <div class="rounded-xl border border-border-hover bg-surface p-4">
            <div class="flex flex-wrap gap-2">
              <TierItem v-for="item in tierlist.pool" :key="item.id" :item="item" />
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
