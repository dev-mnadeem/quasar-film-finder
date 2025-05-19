import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import MovieSearchView from '@/views/MovieSearchView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'movie-search',
    component: MovieSearchView,
  },
  {
    path: '/movie/:id',
    name: 'movie-detail',
    // Detail is a secondary screen: keep it out of the first bundle.
    component: () => import('@/views/MovieDetailView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    // Paging through results should not jump the list back to the top.
    if (saved) return saved
    if (to.name === 'movie-search' && from.name === 'movie-search') return false
    return { top: 0 }
  },
})

export default router
