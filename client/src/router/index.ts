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
      path: '/room/:id',
      name: 'room',
      component: () => import('@/views/RoomView.vue'),
    },
  ],
})

export default router
