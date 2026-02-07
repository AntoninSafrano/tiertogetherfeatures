<script setup lang="ts">
import { ref } from 'vue'
import { useCloudinary } from '@/composables/useCloudinary'
import { useSocket } from '@/composables/useSocket'

const { uploadImage } = useCloudinary()
const { socket } = useSocket()

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadProgress = ref({ current: 0, total: 0 })
const error = ref<string | null>(null)

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  isUploading.value = true
  error.value = null
  uploadProgress.value = { current: 0, total: files.length }

  for (const file of Array.from(files)) {
    try {
      const imageUrl = await uploadImage(file)

      // Strip extension from filename for label
      const label = file.name.replace(/\.[^.]+$/, '').substring(0, 50)

      // Emit to server (or local in demo mode)
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

  // Reset input so the same files can be re-selected
  input.value = ''
}
</script>

<template>
  <div class="flex items-center gap-3">
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      class="hidden"
      @change="handleFiles"
    />

    <button
      :disabled="isUploading"
      class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      @click="triggerFileInput"
    >
      <svg
        v-if="!isUploading"
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>

      <template v-if="isUploading">
        Uploading {{ uploadProgress.current }}/{{ uploadProgress.total }}...
      </template>
      <template v-else>
        Add Images
      </template>
    </button>

    <span v-if="error" class="text-xs text-destructive">
      {{ error }}
    </span>
  </div>
</template>
