<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { RouterView } from 'vue-router'

const router = useRouter()

// After a Google OAuth round-trip the user lands on "/"; if we stashed a
// post-login target path, jump there instead. Same-origin paths only.
onMounted(() => {
  const next = sessionStorage.getItem('postLoginNext')
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    sessionStorage.removeItem('postLoginNext')
    router.replace(next)
  }
})
</script>

<template>
  <RouterView />
</template>
