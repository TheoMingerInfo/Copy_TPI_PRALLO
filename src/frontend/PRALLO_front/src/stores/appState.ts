import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'
import type { AppStateValue } from '@/stores/auth'

export const useAppStateStore = defineStore('appState', () => {
  const state = ref<AppStateValue>('preparation')
  const loading = ref(false)
  const pendingTransition = ref<{
    from: AppStateValue
    to: AppStateValue
    warnings: string[]
  } | null>(null)

  async function fetchState() {
    const { data } = await api.get('/state')
    state.value = data.state
  }

  async function changeState(newState: AppStateValue, confirmed = false): Promise<{ requiresConfirmation?: boolean; warnings?: string[] }> {
    loading.value = true
    try {
      const { data } = await api.put('/state', { newState, confirmed })

      if (data.requiresConfirmation) {
        pendingTransition.value = { from: data.currentState, to: data.newState, warnings: data.warnings }
        return { requiresConfirmation: true, warnings: data.warnings }
      }

      state.value = data.state
      pendingTransition.value = null
      return { warnings: data.warnings ?? [] }
    } finally {
      loading.value = false
    }
  }

  function cancelTransition() {
    pendingTransition.value = null
  }

  return { state, loading, pendingTransition, fetchState, changeState, cancelTransition }
})
