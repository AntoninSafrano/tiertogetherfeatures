import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'explore',
      component: () => import('@/views/ExploreView.vue'),
      meta: { title: 'TierTogether' },
    },
    {
      path: '/create',
      name: 'home',
      component: () => import('@/views/CreateView.vue'),
      meta: { title: 'Créer une Room - TierTogether' },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { title: 'Connexion - TierTogether' },
    },
    {
      path: '/tierlist/:id',
      name: 'tierlist-view',
      component: () => import('@/views/TierListView.vue'),
      meta: { title: 'Tier List - TierTogether' },
    },
    {
      path: '/room/:id',
      name: 'room',
      component: () => import('@/views/RoomView.vue'),
      meta: { title: 'Room - TierTogether' },
    },
    {
      path: '/legal',
      name: 'legal',
      component: () => import('@/views/LegalView.vue'),
      meta: { title: 'Mentions légales - TierTogether' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Page introuvable - TierTogether' },
    },
  ],
})

router.afterEach((to) => {
  const title = to.meta.title as string
  if (title) {
    document.title = title
  }
})

export default router
