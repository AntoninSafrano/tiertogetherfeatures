<script setup lang="ts">
defineProps<{
  title: string
  description: string
  retryLabel?: string
}>()

const emit = defineEmits<{
  close: []
  retry: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div class="fixed inset-0 z-50 flex items-center justify-center px-4" @click.self="emit('close')">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/70" />

        <!-- Popup -->
        <div class="relative w-[380px] rounded-xl border border-border bg-surface p-6 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col gap-4">
          <!-- Title Row -->
          <div class="flex items-center gap-2.5">
            <div class="h-2 w-2 rounded-full bg-destructive shrink-0" />
            <span class="text-[15px] font-semibold text-foreground">{{ title }}</span>
          </div>

          <!-- Description -->
          <p class="text-[13px] leading-relaxed text-foreground-muted">{{ description }}</p>

          <!-- Divider -->
          <div class="h-px w-full bg-border" />

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2">
            <button
              class="text-[13px] font-medium text-foreground-subtle hover:text-foreground transition-colors px-2 py-1"
              @click="emit('close')"
            >
              Fermer
            </button>
            <button
              v-if="retryLabel"
              class="rounded-md bg-primary px-3.5 h-8 flex items-center justify-center text-[13px] font-medium text-white hover:bg-primary-hover transition-colors"
              @click="emit('retry')"
            >
              {{ retryLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
