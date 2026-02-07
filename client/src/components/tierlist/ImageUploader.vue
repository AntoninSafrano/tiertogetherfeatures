<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCloudinary } from '@/composables/useCloudinary'
import { useSocket } from '@/composables/useSocket'
import { ImagePlus } from 'lucide-vue-next'

const { uploadImage } = useCloudinary()
const { socket } = useSocket()

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadProgress = ref({ current: 0, total: 0 })
const error = ref<string | null>(null)
const isDragging = ref(false)
let dragCounter = 0

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

onMounted(() => {
  document.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', onPaste)
})
</script>

<template>
  <div
    class="p-4 transition-colors duration-200"
    :class="isDragging ? 'bg-primary/5' : ''"
    @dragover.prevent
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      @change="handleFiles"
    />

    <div v-if="isUploading" class="flex items-center justify-center gap-3 py-2">
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
      <span class="text-sm text-zinc-400">
        Uploading {{ uploadProgress.current }}/{{ uploadProgress.total }}...
      </span>
    </div>

    <div v-else class="flex items-center justify-center gap-2 py-2">
      <ImagePlus class="h-5 w-5 text-zinc-500" />
      <p class="text-sm text-zinc-500">
        Drop images, paste, or
        <button
          class="font-semibold text-primary transition-colors hover:text-primary-hover"
          @click="triggerFileInput"
        >
          browse
        </button>
      </p>
    </div>

    <span v-if="error" class="mt-1 block text-center text-xs text-destructive">
      {{ error }}
    </span>
  </div>
</template>
