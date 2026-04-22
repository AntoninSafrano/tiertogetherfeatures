<script setup lang="ts">
import { ref } from 'vue'
import { X, Flag, CheckCircle2 } from 'lucide-vue-next'
import { API_BASE } from '@/config'

const props = defineProps<{ tierlistId: string; tierlistTitle?: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'done'): void }>()

const REASONS: Array<{ value: string; label: string }> = [
  { value: 'inappropriate', label: 'Contenu inapproprié / haineux' },
  { value: 'spam', label: 'Spam' },
  { value: 'copyright', label: "Violation de droit d'auteur" },
  { value: 'duplicate', label: 'Doublon' },
  { value: 'other', label: 'Autre' },
]

const reason = ref('inappropriate')
const details = ref('')
const isSending = ref(false)
const errorMsg = ref<string | null>(null)
const success = ref(false)

async function submit() {
  if (isSending.value) return
  isSending.value = true
  errorMsg.value = null
  try {
    const res = await fetch(`${API_BASE}/api/tierlists/${props.tierlistId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason: reason.value, details: details.value.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      errorMsg.value = data.error || `Erreur ${res.status}`
      return
    }
    success.value = true
    setTimeout(() => {
      emit('done')
      emit('close')
    }, 1100)
  } catch (err) {
    errorMsg.value = (err as Error).message
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      role="dialog"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      @click.self="emit('close')"
      @keydown.escape="emit('close')"
    >
      <div class="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <Flag class="h-4 w-4 text-amber-400" />
            <h3 class="text-base font-semibold text-foreground">Signaler cette tier list</h3>
          </div>
          <button
            type="button"
            class="text-foreground-muted hover:text-foreground transition-colors"
            aria-label="Fermer"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <p v-if="tierlistTitle" class="mt-1 text-xs text-foreground-muted truncate">
          « {{ tierlistTitle }} »
        </p>

        <template v-if="!success">
          <label class="mt-4 block">
            <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Raison</span>
            <select
              v-model="reason"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option v-for="r in REASONS" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </label>

          <label class="mt-3 block">
            <span class="mb-1 block text-[10px] font-medium uppercase tracking-wide text-foreground-muted">Détails (optionnel)</span>
            <textarea
              v-model="details"
              rows="3"
              maxlength="500"
              placeholder="Précise le problème pour aider la modération…"
              class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </label>

          <p v-if="errorMsg" class="mt-3 text-xs text-red-400">{{ errorMsg }}</p>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-xs font-medium text-foreground-muted hover:bg-surface-hover transition-colors"
              :disabled="isSending"
              @click="emit('close')"
            >
              Annuler
            </button>
            <button
              type="button"
              class="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
              :disabled="isSending"
              @click="submit"
            >
              {{ isSending ? 'Envoi…' : 'Envoyer le signalement' }}
            </button>
          </div>
        </template>

        <div v-else class="mt-5 flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 class="h-4 w-4 shrink-0 mt-0.5" />
          <span>Signalement envoyé. Merci, on regarde ça.</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
