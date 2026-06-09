<script setup lang="ts">
import { ref } from 'vue'
import { Cookie } from 'lucide-vue-next'

const STORAGE_KEY = 'tt-cookie-consent'

const visible = ref(!localStorage.getItem(STORAGE_KEY))

function acknowledge() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ack: true, at: new Date().toISOString() }))
  visible.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="visible"
      role="dialog"
      aria-label="Information cookies"
      class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 rounded-xl border border-border-hover bg-surface p-4 shadow-2xl"
    >
      <div class="flex items-start gap-3">
        <Cookie class="h-5 w-5 shrink-0 text-primary mt-0.5" />
        <div class="min-w-0">
          <p class="text-sm text-foreground font-medium mb-1">Cookies & vie privée</p>
          <p class="text-xs leading-relaxed text-foreground-muted">
            TierTogether utilise uniquement un cookie essentiel d'authentification et des
            statistiques anonymes sans cookie (Umami). Aucun traçage publicitaire.
            <router-link to="/legal" class="text-primary hover:underline">En savoir plus</router-link>
          </p>
        </div>
      </div>
      <div class="mt-3 flex justify-end">
        <button
          class="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
          @click="acknowledge"
        >
          J'ai compris
        </button>
      </div>
    </div>
  </Transition>
</template>
