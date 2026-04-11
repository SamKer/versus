import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'

export interface ActorProfile {
  _id?: string
  tmdbId?: number
  name: string
  photo?: string | null
  birthDate?: string | null
  placeOfBirth?: string | null
  biography?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface TmdbPersonResult {
  tmdbId: number
  name: string
  photo: string | null
  knownFor: string[]
}

export const useActorsStore = defineStore('actors', () => {
  const actors = ref<ActorProfile[]>([])
  const loading = ref(false)

  async function fetchAll () {
    loading.value = true
    try {
      const { data } = await api.get<ActorProfile[]>('/api/actors')
      actors.value = data
    } finally {
      loading.value = false
    }
  }

  async function create (actor: Partial<ActorProfile>) {
    const { data } = await api.post<ActorProfile>('/api/actors', actor)
    actors.value.push(data)
    actors.value.sort((a, b) => a.name.localeCompare(b.name))
    return data
  }

  async function update (id: string, actor: Partial<ActorProfile>) {
    const { data } = await api.put<ActorProfile>(`/api/actors/${id}`, actor)
    const idx = actors.value.findIndex(a => a._id === id)
    if (idx !== -1) actors.value[idx] = data
    return data
  }

  async function remove (id: string) {
    await api.delete(`/api/actors/${id}`)
    actors.value = actors.value.filter(a => a._id !== id)
  }

  async function searchLocal (query: string): Promise<ActorProfile[]> {
    const { data } = await api.get<ActorProfile[]>('/api/actors/search', { params: { q: query } })
    return data
  }

  async function searchTmdb (query: string): Promise<TmdbPersonResult[]> {
    const { data } = await api.post<TmdbPersonResult[]>('/api/actors/search-tmdb', { query })
    return data
  }

  return { actors, loading, fetchAll, create, update, remove, searchLocal, searchTmdb }
})
