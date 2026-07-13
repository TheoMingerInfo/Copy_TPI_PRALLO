import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'
import type { Project } from '@/stores/projects'

export interface Vote {
  id: number
  priority: 1 | 2 | 3
  project: Project
}

export const useVotesStore = defineStore('votes', () => {
  const votes = ref<Vote[]>([])
  const loading = ref(false)

  async function fetchMyVotes() {
    loading.value = true
    try {
      const { data } = await api.get('/votes')
      votes.value = data
    } finally {
      loading.value = false
    }
  }

  async function castVote(projectId: number, priority: 1 | 2 | 3): Promise<void> {
    const { data } = await api.post('/votes', { projectId, priority })
    votes.value.push(data)
    votes.value.sort((a, b) => a.priority - b.priority)
    await fetchMyVotes()
  }

  async function removeVote(voteId: number): Promise<void> {
    await api.delete(`/votes/${voteId}`)
    await fetchMyVotes()
  }

  async function reorderVotes(updates: { id: number; priority: 1 | 2 | 3 }[]): Promise<void> {
    await api.put('/votes/reorder', { updates })
    updates.forEach(({ id, priority }) => {
      const vote = votes.value.find((v) => v.id === id)
      if (vote) vote.priority = priority
    })
  }

  return { votes, loading, fetchMyVotes, castVote, removeVote, reorderVotes }
})
