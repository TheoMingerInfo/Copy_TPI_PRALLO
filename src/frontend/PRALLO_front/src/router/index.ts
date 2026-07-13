import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        { path: '', redirect: '/projects' },
        { path: 'projects', name: 'projects', component: () => import('@/views/projects/ProjectsView.vue') },
        { path: 'skills', name: 'skills', component: () => import('@/views/skills/SkillsView.vue') },
        { path: 'votes', name: 'votes', component: () => import('@/views/votes/VotesView.vue') },
        { path: 'participants', name: 'participants', component: () => import('@/views/participants/ParticipantsView.vue') },
        { path: 'allocations', name: 'allocations', component: () => import('@/views/allocations/AllocationsView.vue') },
        { path: 'state', name: 'state', component: () => import('@/views/admin/StateView.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
      ],
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: () => import('@/views/ForbiddenView.vue'),
      meta: { public: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    // Authenticated user trying to reach /login → redirect to app
    if (to.name === 'login' && auth.user) {
      const redirect = to.query.redirect as string | undefined
      return { path: redirect || '/' }
    }
    return true
  }

  // Utilisateur déjà chargé
  if (auth.user) return true

  // Pas de compte MSAL ni de token dev → login
  if (!auth.token) {
    console.log(`[Router] Pas authentifié → /login (depuis ${to.fullPath})`)
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Token présent mais user absent (rechargement de page)
  try {
    console.log('[Router] Token présent, fetchMe()...')
    await auth.fetchMe()
    return true
  } catch (e) {
    console.error('[Router] fetchMe échoué :', e)
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
