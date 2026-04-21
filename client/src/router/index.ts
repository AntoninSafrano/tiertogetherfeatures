import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'explore',
      component: () => import('@/views/ExploreView.vue'),
    },
    {
      path: '/create',
      name: 'home',
      component: () => import('@/views/CreateView.vue'),
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
    },
    {
      path: '/tierlist/:id',
      name: 'tierlist-view',
      component: () => import('@/views/TierListView.vue'),
    },
    {
      path: '/room/:id',
      name: 'room',
      component: () => import('@/views/RoomView.vue'),
    },
    {
      path: '/legal',
      name: 'legal',
      component: () => import('@/views/LegalView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

export default router
