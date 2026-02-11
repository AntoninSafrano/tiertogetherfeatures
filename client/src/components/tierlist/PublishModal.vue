<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoomStore } from '@/stores/room'
import { X, Globe, Lock, Tag } from 'lucide-vue-next'

const emit = defineEmits<{
  close: []
}>()

const store = useRoomStore()
const API_BASE = 'http://localhost:3001'

const isPublic = ref(true)
const category = ref('Other')
const isPublishing = ref(false)
const error = ref('')
const success = ref(false)

const categories = ['Gaming', 'Food', 'Anime', 'Music', 'Movies', 'Sports', 'Other']

const coverImage = computed(() => {
  for (const row of store.rows) {
    for (const item of row.items) {
      if (item.imageUrl) return item.imageUrl
    }
  }
  return ''
})

async function publish() {
  if (!store.currentRoom?.tierList?.id) return
  isPublishing.value = true
  error.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${store.currentRoom.tierList.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isPublic: isPublic.value, category: category.value }),
    })
    const data = await res.json()
    if (data.success) {
      success.value = true
      setTimeout(() => emit('close'), 1500)
    } else {
      error.value = data.error || 'Failed to publish'
    }
  } catch {
    error.value = 'Network error'
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
      <div class="rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl max-w-md w-full mx-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-foreground">Publish Tier List</h3>
          <button class="p-1 rounded-lg hover:bg-white/5 text-zinc-400" @click="emit('close')">
            <X class="h-4 w-4" />
          </button>
        </div>

        <template v-if="success">
          <div class="text-center py-8">
            <div class="text-2xl mb-2">🎉</div>
            <p class="text-foreground font-medium">Published successfully!</p>
          </div>
        </template>

        <template v-else>
          <!-- Preview card -->
          <div class="rounded-xl border border-white/10 bg-zinc-800/50 overflow-hidden mb-4">
            <div class="h-24 bg-gradient-to-br from-primary/20 to-zinc-800 overflow-hidden">
              <img v-if="coverImage" :src="coverImage" class="w-full h-full object-cover" />
            </div>
            <div class="p-3">
              <p class="font-bold text-sm text-foreground">{{ store.title }}</p>
              <p class="text-xs text-zinc-500">{{ store.rows.length }} tiers</p>
            </div>
          </div>

          <!-- Visibility -->
          <div class="mb-4">
            <label class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 block">Visibility</label>
            <div class="flex gap-2">
              <button
                :class="['flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-all', isPublic ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-zinc-800 text-zinc-400']"
                @click="isPublic = true"
              >
                <Globe class="h-4 w-4" />
                Public
              </button>
              <button
                :class="['flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-all', !isPublic ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-zinc-800 text-zinc-400']"
                @click="isPublic = false"
              >
                <Lock class="h-4 w-4" />
                Private
              </button>
            </div>
          </div>

          <!-- Category -->
          <div class="mb-4">
            <label class="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Tag class="h-3 w-3" />
              Category
            </label>
            <select
              v-model="category"
              class="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <!-- Error -->
          <div v-if="error" class="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{{ error }}</div>

          <!-- Actions -->
          <div class="flex gap-3 justify-end">
            <button class="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/5 transition-colors" @click="emit('close')">
              Cancel
            </button>
            <button
              :disabled="isPublishing"
              class="px-4 py-2 rounded-lg text-sm bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
              @click="publish"
            >
              {{ isPublishing ? 'Publishing...' : 'Publish' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
