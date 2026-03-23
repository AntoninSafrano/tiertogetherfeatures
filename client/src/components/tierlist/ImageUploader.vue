<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCloudinary } from '@/composables/useCloudinary'
import { useSocket } from '@/composables/useSocket'
import { ImagePlus, Search, X } from 'lucide-vue-next'

const API_BASE = 'http://localhost:3001'

const { uploadImage } = useCloudinary()
const { socket } = useSocket()

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadProgress = ref({ current: 0, total: 0 })
const error = ref<string | null>(null)
const isDragging = ref(false)
let dragCounter = 0

// Image search state
const searchQuery = ref('')
const searchResults = ref<{ title: string; imageUrl: string; thumbnail: string }[]>([])
const isSearching = ref(false)
const selectedImage = ref<{ title: string; imageUrl: string; thumbnail: string } | null>(null)
const labelInput = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function triggerFileInput() {
  fileInput.value?.click()
}

async function processFiles(files: File[]) {
  const images = files.filter((f) => f.type.startsWith('image/'))
  if (images.length === 0) return

  isUploading.value = true
  error.value = null
  uploadProgress.value = { current: 0, total: images.length }

  for (const file of images) {
    try {
      const imageUrl = await uploadImage(file)
      const label = file.name && file.name !== 'image.png'
        ? file.name.replace(/\.[^.]+$/, '').substring(0, 50)
        : `Pasted image ${uploadProgress.value.current + 1}`

      if (socket.value?.connected) {
        socket.value.emit('item:create', { imageUrl, label })
      }

      uploadProgress.value.current++
    } catch (err) {
      console.error(`[Upload] Failed for ${file.name}:`, err)
      error.value = `Failed to upload ${file.name}`
      uploadProgress.value.current++
    }
  }

  isUploading.value = false
}

function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  processFiles(Array.from(files))
  input.value = ''
}

function onDragEnter(e: DragEvent) {
  e.preventDefault()
  dragCounter++
  isDragging.value = true
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  dragCounter--
  if (dragCounter <= 0) {
    isDragging.value = false
    dragCounter = 0
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  dragCounter = 0
  if (e.dataTransfer?.files) {
    processFiles(Array.from(e.dataTransfer.files))
  }
}

function onPaste(e: ClipboardEvent) {
  if (!e.clipboardData?.files.length) return
  processFiles(Array.from(e.clipboardData.files))
}

// Image search functions
async function searchImages() {
  const q = searchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  error.value = null

  try {
    const res = await fetch(`${API_BASE}/api/images/search?q=${encodeURIComponent(q)}`, {
      credentials: 'include',
    })
    const data = await res.json()

    if (!res.ok) {
      error.value = data.error || 'Search failed'
      searchResults.value = []
      return
    }

    searchResults.value = data
  } catch (err) {
    console.error('[ImageSearch] Error:', err)
    error.value = 'Search failed'
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(searchImages, 500)
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    if (debounceTimer) clearTimeout(debounceTimer)
    searchImages()
  }
}

function selectImage(img: { title: string; imageUrl: string; thumbnail: string }) {
  selectedImage.value = img
  labelInput.value = img.title.substring(0, 50)
}

function cancelSelection() {
  selectedImage.value = null
  labelInput.value = ''
}

function confirmAddImage() {
  if (!selectedImage.value) return

  if (socket.value?.connected) {
    socket.value.emit('item:create', {
      imageUrl: selectedImage.value.imageUrl,
      label: labelInput.value || selectedImage.value.title.substring(0, 50),
    })
  }

  selectedImage.value = null
  labelInput.value = ''
}

onMounted(() => {
  document.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', onPaste)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div
    class="transition-colors duration-200"
    :class="isDragging ? 'bg-primary/5' : ''"
    @dragover.prevent
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Image Search Section -->
    <div class="px-4 pt-3 pb-2">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search images..."
          class="w-full rounded-lg border border-border-hover bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder-foreground-muted outline-none transition-colors focus:border-primary/30"
          @input="onSearchInput"
          @keydown="onSearchKeydown"
        />
      </div>
    </div>

    <!-- Search Results Grid -->
    <div v-if="isSearching" class="grid grid-cols-2 gap-2 px-4 pb-2 sm:grid-cols-3 lg:grid-cols-4">
      <div
        v-for="i in 8"
        :key="i"
        class="aspect-square animate-pulse rounded-lg bg-surface-hover"
      />
    </div>

    <div v-else-if="searchResults.length > 0" class="px-4 pb-2">
      <!-- Selected image label input -->
      <div
        v-if="selectedImage"
        class="mb-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-surface p-2"
      >
        <img
          :src="selectedImage.thumbnail"
          :alt="selectedImage.title"
          class="h-10 w-10 rounded object-cover"
        />
        <input
          v-model="labelInput"
          type="text"
          placeholder="Label"
          maxlength="50"
          class="flex-1 rounded border border-border-hover bg-surface-hover px-2 py-1 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-primary/30"
          @keydown.enter="confirmAddImage"
        />
        <button
          class="rounded bg-primary px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          @click="confirmAddImage"
        >
          Add
        </button>
        <button
          class="rounded p-1 text-foreground-muted transition-colors hover:text-foreground"
          @click="cancelSelection"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="(img, idx) in searchResults"
          :key="idx"
          class="group relative aspect-square overflow-hidden rounded-lg border transition-all duration-200"
          :class="
            selectedImage?.imageUrl === img.imageUrl
              ? 'border-primary ring-2 ring-primary'
              : 'border-border hover:border-primary/30'
          "
          @click="selectImage(img)"
        >
          <img
            :src="img.thumbnail"
            :alt="img.title"
            class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <p class="truncate text-xs text-white">{{ img.title }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Separator -->
    <div v-if="searchQuery || searchResults.length > 0" class="flex items-center gap-3 px-4 py-2">
      <div class="h-px flex-1 bg-border-hover" />
      <span class="text-xs text-foreground-muted">or upload manually</span>
      <div class="h-px flex-1 bg-border-hover" />
    </div>

    <!-- Original Upload Section -->
    <div class="px-4 pb-3" :class="!searchQuery && searchResults.length === 0 ? 'pt-3' : ''">
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="hidden"
        @change="handleFiles"
      />

      <div v-if="isUploading" class="flex items-center justify-center gap-3">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
        <span class="text-sm text-foreground-muted">
          Uploading {{ uploadProgress.current }}/{{ uploadProgress.total }}...
        </span>
      </div>

      <div v-else class="flex items-center justify-center gap-2">
        <ImagePlus class="h-5 w-5 text-foreground-muted" />
        <p class="text-sm text-foreground-muted">
          Drop images, paste, or
          <button
            class="font-semibold text-primary transition-colors hover:text-primary-hover"
            @click="triggerFileInput"
          >
            browse
          </button>
        </p>
      </div>
    </div>

    <span v-if="error" class="block px-4 pb-2 text-center text-xs text-destructive">
      {{ error }}
    </span>
  </div>
</template>
