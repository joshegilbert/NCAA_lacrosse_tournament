import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'landing', component: () => import('../views/LandingView.vue') },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
  },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/tournament-bracket', redirect: { name: 'dashboard' } },
  {
    path: '/leagues/:id',
    name: 'league',
    component: () => import('../views/LeagueDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/leagues/:id/tournament-results',
    name: 'league-tournament-results',
    component: () => import('../views/OfficialBracketView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/leagues/:id/bracket',
    name: 'bracket-builder',
    component: () => import('../views/BracketBuilderView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/leagues/:id/me',
    name: 'my-bracket',
    component: () => import('../views/MyBracketView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/leagues/:id/users/:userId',
    name: 'member-bracket',
    component: () => import('../views/MemberBracketView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/leagues/:id/admin',
    name: 'admin-results',
    component: () => import('../views/AdminResultsView.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth) {
    if (!auth.user) await auth.fetchMe()
    if (!auth.user) return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
