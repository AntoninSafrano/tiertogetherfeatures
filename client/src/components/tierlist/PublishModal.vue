<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoomStore } from '@/stores/room'
import { useAuth } from '@/composables/useAuth'
import { useCloudinary } from '@/composables/useCloudinary'
import { X, Globe, Lock, Tag, LogIn, ImagePlus, Upload, Loader2 } from 'lucide-vue-next'
import { API_BASE } from '@/config'

const emit = defineEmits<{
  close: []
}>()

const store = useRoomStore()
const { user } = useAuth()

const isPublic = ref(true)
const category = ref('Other')
const isPublishing = ref(false)
const error = ref('')
const success = ref(false)
const customCover = ref('')

const categories = ['Gaming', 'Food', 'Anime', 'Music', 'Movies', 'Sports', 'Other']

const categoryLabels: Record<string, string> = {
  Gaming: 'Jeux vidéo',
  Food: 'Cuisine',
  Anime: 'Anime',
  Music: 'Musique',
  Movies: 'Films',
  Sports: 'Sport',
  Other: 'Autre',
}

const autoCover = computed(() => {
  for (const row of store.rows) {
    for (const item of row.items) {
      if (item.imageUrl) return item.imageUrl
    }
  }
  for (const item of store.pool) {
    if (item.imageUrl) return item.imageUrl
  }
  return ''
})

const coverImage = computed(() => customCover.value || autoCover.value)

// All images from the tier list (rows + pool) for picker
const allImages = computed(() => {
  const imgs: { url: string; label: string }[] = []
  for (const row of store.rows) {
    for (const item of row.items) {
      if (item.imageUrl) imgs.push({ url: item.imageUrl, label: item.label })
    }
  }
  for (const item of store.pool) {
    if (item.imageUrl) imgs.push({ url: item.imageUrl, label: item.label })
  }
  return imgs
})

const showImagePicker = ref(false)
const isUploading = ref(false)
const isDragOver = ref(false)
const { uploadImage } = useCloudinary()
const fileInput = ref<HTMLInputElement | null>(null)

async function handleFile(file: File) {
  if (!file.type.startsWith('image/')) return
  isUploading.value = true
  try {
    const url = await uploadImage(file)
    customCover.value = url
    showImagePicker.value = false
  } catch {
    error.value = 'Échec de l\'upload'
  } finally {
    isUploading.value = false
  }
}

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

async function publish() {
  if (!store.currentRoom?.tierList?.id) return
  isPublishing.value = true
  error.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${store.currentRoom.tierList.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isPublic: isPublic.value, category: category.value, coverImage: coverImage.value }),
    })
    const data = await res.json()
    if (data.success) {
      success.value = true
      setTimeout(() => emit('close'), 1500)
    } else {
      error.value = data.error || 'Échec de la publication'
    }
  } catch {
    error.value = 'Erreur réseau'
  } finally {
    isPublishing.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="rounded-2xl border border-border-hover bg-surface p-6 shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-foreground">Publier la Tier List</h3>
          <button class="p-1 rounded-lg hover:bg-surface-hover text-foreground-muted" @click="emit('close')">
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Not logged in -->
        <template v-if="!user">
          <div class="text-center py-8">
            <LogIn class="h-10 w-10 text-foreground-muted mx-auto mb-3" />
            <p class="text-foreground font-medium mb-1">Connectez-vous pour publier</p>
            <p class="text-sm text-foreground-muted mb-5">Vous avez besoin d'un compte pour partager votre tier list avec la communauté.</p>
            <a
              :href="`${API_BASE}/auth/google`"
              class="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-background hover:bg-surface-active transition-colors"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Se connecter avec Google
            </a>
          </div>
        </template>

        <template v-else-if="success">
          <div class="text-center py-8">
            <div class="text-2xl mb-2">🎉</div>
            <p class="text-foreground font-medium">Publié avec succès !</p>
          </div>
        </template>

        <template v-else>
          <!-- Preview card + cover picker -->
          <div class="rounded-xl border border-border-hover bg-surface-hover/50 overflow-hidden mb-4">
            <div
              class="relative aspect-video bg-gradient-to-br from-primary/20 to-surface-hover overflow-hidden cursor-pointer group"
              @click="showImagePicker = !showImagePicker"
            >
              <img v-if="coverImage" :src="coverImage" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="flex items-center gap-2 text-white text-xs font-medium">
                  <ImagePlus class="h-4 w-4" />
                  Changer la couverture
                </div>
              </div>
            </div>
            <div class="p-3">
              <p class="font-bold text-sm text-foreground">{{ store.title }}</p>
              <p class="text-xs text-foreground-muted">{{ store.rows.length }} tiers</p>
            </div>
          </div>

          <!-- Image picker -->
          <div v-if="showImagePicker" class="mb-4">
            <label class="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 block">Choisir une couverture</label>

            <!-- Upload from PC (click or drag & drop) -->
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelected" />
            <div
              :class="['w-full mb-2 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed py-5 text-sm transition-all cursor-pointer',
                isDragOver ? 'border-primary bg-primary/10 text-primary' : 'border-border-hover text-foreground-muted hover:text-primary hover:border-primary/30',
                isUploading ? 'opacity-50 pointer-events-none' : '']"
              @click="fileInput?.click()"
              @dragover.prevent="isDragOver = true"
              @dragleave="isDragOver = false"
              @drop.prevent="onDrop"
            >
              <Loader2 v-if="isUploading" class="h-5 w-5 animate-spin" />
              <Upload v-else class="h-5 w-5" />
              <span class="font-medium">{{ isUploading ? 'Upload en cours...' : 'Glisser une image ici' }}</span>
              <span v-if="!isUploading" class="text-xs text-foreground-subtle">ou cliquer pour parcourir</span>
            </div>

            <!-- Or pick from tier list -->
            <div v-if="allImages.length > 0" class="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto rounded-lg border border-border p-2 bg-surface">
              <button
                v-for="img in allImages"
                :key="img.url"
                :class="['rounded-md overflow-hidden border-2 transition-all aspect-square',
                  coverImage === img.url ? 'border-primary' : 'border-transparent hover:border-border-hover']"
                :title="img.label"
                @click="customCover = img.url; showImagePicker = false"
              >
                <img :src="img.url" :alt="img.label" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <!-- Visibility -->
          <div class="mb-4">
            <label class="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 block">Visibilité</label>
            <div class="flex gap-2">
              <button
                :class="['flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-all', isPublic ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-surface-hover text-foreground-muted']"
                @click="isPublic = true"
              >
                <Globe class="h-4 w-4" />
                Publique
              </button>
              <button
                :class="['flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-all', !isPublic ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-surface-hover text-foreground-muted']"
                @click="isPublic = false"
              >
                <Lock class="h-4 w-4" />
                Privée
              </button>
            </div>
          </div>

          <!-- Category -->
          <div class="mb-4">
            <label class="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <Tag class="h-3 w-3" />
              Catégorie
            </label>
            <select
              v-model="category"
              class="w-full rounded-lg border border-border-hover bg-surface-hover px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">{{ categoryLabels[cat] || cat }}</option>
            </select>
          </div>

          <!-- Error -->
          <div v-if="error" class="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{{ error }}</div>

          <!-- Actions -->
          <div class="flex gap-3 justify-end">
            <button class="px-4 py-2 rounded-lg text-sm text-foreground-muted hover:bg-surface-hover transition-colors" @click="emit('close')">
              Annuler
            </button>
            <button
              :disabled="isPublishing"
              class="px-4 py-2 rounded-lg text-sm bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
              @click="publish"
            >
              {{ isPublishing ? 'Publication...' : 'Publier' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
