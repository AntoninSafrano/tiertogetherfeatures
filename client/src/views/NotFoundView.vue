<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center px-4">
    <div class="flex flex-col items-center gap-6 text-center">
      <!-- Big 404 -->
      <h1 class="text-[120px] sm:text-[160px] font-bold leading-none tracking-tighter text-primary/20">
        404
      </h1>

      <!-- Message -->
      <div class="flex flex-col items-center gap-2 -mt-4">
        <h2 class="text-2xl sm:text-3xl font-bold text-foreground">Page introuvable</h2>
        <p class="text-foreground-muted text-sm sm:text-base max-w-md">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
      </div>

      <!-- Back button -->
      <button
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
        @click="router.push('/')"
      >
        <ArrowLeft class="h-4 w-4" />
        Retour à l'accueil
      </button>
    </div>
  </div>
</template>
