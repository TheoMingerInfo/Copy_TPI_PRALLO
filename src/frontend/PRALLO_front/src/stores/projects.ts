import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'

export interface Skill {
  id: number
  name: string
}

export interface ProjectFile {
  id: number
  fileName: string
  mimeType: string
  fileSize: number
}

export interface Project {
  id: number
  title: string
  description: string
  isMandatory: boolean
  maxStudents: number
  professor: { id: number; firstName: string; lastName: string }
  skills: Skill[]
  files?: ProjectFile[]
  hasFiles?: boolean
  voteCount?: number
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(params?: { search?: string; skillIds?: number[] }) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/projects', { params })
      projects.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Erreur lors du chargement des projets'
    } finally {
      loading.value = false
    }
  }

  async function createProject(payload: {
    title: string
    description: string
    skillIds: number[]
    isMandatory?: boolean
    maxStudents?: number
  }): Promise<Project> {
    const { data } = await api.post('/projects', payload)
    projects.value.unshift(data)
    return data
  }

  async function updateProject(id: number, payload: Partial<{
    title: string
    description: string
    skillIds: number[]
    isMandatory: boolean
    maxStudents: number
  }>): Promise<Project> {
    const { data } = await api.put(`/projects/${id}`, payload)
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) projects.value[idx] = data
    return data
  }

  async function deleteProject(id: number): Promise<void> {
    await api.delete(`/projects/${id}`)
    projects.value = projects.value.filter((p) => p.id !== id)
  }

  async function fetchById(id: number): Promise<Project> {
    const { data } = await api.get(`/projects/${id}`)
    return data
  }

  async function uploadFile(projectId: number, file: File): Promise<ProjectFile> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post(`/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const idx = projects.value.findIndex((p) => p.id === projectId)
    if (idx !== -1) projects.value[idx].hasFiles = true
    return data
  }

  async function deleteFile(projectId: number, fileId: number): Promise<void> {
    await api.delete(`/projects/${projectId}/files/${fileId}`)
  }

  async function downloadFile(projectId: number, fileId: number, fileName: string): Promise<void> {
    const response = await api.get(`/projects/${projectId}/files/${fileId}/download`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { projects, loading, error, fetchAll, fetchById, createProject, updateProject, deleteProject, uploadFile, deleteFile, downloadFile }
})
