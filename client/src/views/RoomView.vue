<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const roomId = route.params.id as string
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background p-4">
    <header class="flex items-center justify-between border-b border-border pb-4">
      <h1 class="text-xl font-bold text-foreground">
        Tier<span class="text-primary">Together</span>
      </h1>
      <div class="flex items-center gap-3">
        <span class="rounded-md bg-surface px-3 py-1 text-sm font-mono text-foreground-muted">
          Room: {{ roomId }}
        </span>
      </div>
    </header>

    <main class="mt-8 flex flex-1 items-center justify-center">
      <p class="text-foreground-subtle">Tier list editor coming soon...</p>
    </main>
  </div>
</template>
