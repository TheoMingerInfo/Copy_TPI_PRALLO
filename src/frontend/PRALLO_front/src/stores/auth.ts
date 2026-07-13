import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'
import { setTokenGetter } from '@/lib/token'
import { msalInstance, loginRequest } from '@/lib/msal'
import type { Permissions } from '@/types/permissions'

export type AppStateValue = 'preparation' | 'reperage' | 'vote' | 'repartition' | 'publication'
export type UserRole = 'doyen' | 'professeur' | 'etudiant' | 'invite'

export interface AuthUser {
  id: number
  firstName: string
  lastName: string
  email: string
  role: UserRole
  maxProjects?: number | null
  skills?: { id: number; name: string }[]
}

const isDevMode = import.meta.env.VITE_DEV_BYPASS === 'true'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const appState = ref<AppStateValue>('preparation')
  const permissions = ref<Permissions | null>(null)

  // Token courant (Azure idToken ou "dev_<email>")
  // Pas besoin de sessionStorage — MSAL gère son propre cache, le dev token est en mémoire
  const _token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isDoyen = computed(() => user.value?.role === 'doyen')
  const isProfesseur = computed(() => user.value?.role === 'professeur')
  const isEtudiant = computed(() => user.value?.role === 'etudiant')
  const isInvite = computed(() => user.value?.role === 'invite')

  function can(permission: keyof Permissions): boolean {
    return permissions.value?.[permission] === true
  }

  // ── Enregistrer le getter de token dans lib/token.ts ──────────────────────
  // En mode dev bypass : retourne le token en mémoire
  // En mode Azure : acquireTokenSilent() pour toujours avoir un token frais
  setTokenGetter(async () => {
    if (isDevMode) return _token.value

    const account = msalInstance.getActiveAccount()
    if (!account) return null
    try {
      const result = await msalInstance.acquireTokenSilent({ ...loginRequest, account })
      return result.idToken
    } catch {
      return null
    }
  })

  // ── MSAL : initialisation + traitement du retour de redirection ───────────
  async function initMsal(): Promise<void> {
    if (isDevMode) return

    console.log('[MSAL] initMsal() — URL :', window.location.href)
    try {
      const result = await msalInstance.handleRedirectPromise()

      if (result?.account) {
        // Retour depuis Microsoft
        console.log('[MSAL] Retour redirect :', result.account.username)
        msalInstance.setActiveAccount(result.account)
        await fetchMe()
      } else {
        // Rechargement de page — compte déjà en cache MSAL
        const account = msalInstance.getAllAccounts()[0]
        if (account) {
          console.log('[MSAL] Compte en cache :', account.username)
          msalInstance.setActiveAccount(account)
          await fetchMe()
        } else {
          console.log('[MSAL] Aucun compte MSAL.')
        }
      }
    } catch (e) {
      console.error('[MSAL] initMsal() erreur :', e)
    }
  }

  // ── Connexion Azure : redirige vers Microsoft ─────────────────────────────
  async function loginWithAzure(): Promise<void> {
    console.log('[MSAL] loginRedirect()')
    await msalInstance.loginRedirect({
      ...loginRequest,
      redirectStartPage: window.location.origin,
    })
  }

  // ── Dev bypass ────────────────────────────────────────────────────────────
  async function loginDevBypass(email: string): Promise<void> {
    _token.value = `dev_${email}`
    await fetchMe()
  }

  // ── Récupérer le profil depuis le backend ─────────────────────────────────
  async function fetchMe(): Promise<void> {
    const { data } = await api.get('/auth/me')
    user.value = data.user
    appState.value = data.appState
    permissions.value = data.permissions
    console.log('[Auth] fetchMe OK :', data.user?.email, '| rôle :', data.user?.role)
  }

  // ── Déconnexion ───────────────────────────────────────────────────────────
  async function logout(): Promise<void> {
    await api.post('/auth/logout').catch(() => {})
    user.value = null
    permissions.value = null
    _token.value = null

    if (!isDevMode) {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        await msalInstance.logoutRedirect({
          account: accounts[0],
          postLogoutRedirectUri: window.location.origin,
        }).catch(() => {})
      }
    }
  }

  // Exposer _token en lecture pour le guard du router
  const token = computed(() => _token.value || (msalInstance.getActiveAccount() ? 'msal' : null))

  return {
    user, appState, permissions, token,
    isAuthenticated, isDoyen, isProfesseur, isEtudiant, isInvite,
    can, initMsal, loginWithAzure, loginDevBypass, fetchMe, logout,
  }
})
