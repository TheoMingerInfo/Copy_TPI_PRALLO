import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'

export interface Skill {
  id: number
  name: string
}

export const useSkillsStore = defineStore('skills', () => {
  const skills = ref<Skill[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await api.get('/skills')
      skills.value = data
    } finally {
      loading.value = false
    }
  }

  async function createSkill(name: string): Promise<Skill> {
    const { data } = await api.post('/skills', { name })
    skills.value.push(data)
    skills.value.sort((a, b) => a.name.localeCompare(b.name))
    return data
  }

  async function deleteSkill(id: number): Promise<void> {
    await api.delete(`/skills/${id}`)
    skills.value = skills.value.filter((s) => s.id !== id)
  }

  async function mergeSkills(primaryId: number, secondaryId: number): Promise<void> {
    await api.post(`/skills/${primaryId}/merge`, { secondarySkillId: secondaryId })
    skills.value = skills.value.filter((s) => s.id !== secondaryId)
  }

  return { skills, loading, fetchAll, createSkill, deleteSkill, mergeSkills }
})
