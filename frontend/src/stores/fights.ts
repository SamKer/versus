import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'

export interface Actor {
  name: string
  character: string
  photo: string | null
  tmdbId?: number
  selected?: boolean  // utilisé uniquement côté formulaire, non stocké en base
}

export interface Fight {
  _id?: string
  youtubeUrl: string
  youtubeId?: string
  youtubeTitle?: string
  views?: number
  thumbnail?: string
  movieTitle: string
  movieYear?: number
  movieTmdbId?: number
  moviePoster?: string
  title?: string
  choreographer?: string
  actors: Actor[]
  videoPath?: string
  fightType?: '1v1' | '1vAll' | '2v2'
  armed?: boolean
  createdAt?: string
}

export const useFightsStore = defineStore('fights', () => {
  const fights = ref<Fight[]>([])
  const loading = ref(false)

  async function fetchAll () {
    loading.value = true
    try {
      const { data } = await api.get<Fight[]>('/api/fights')
      fights.value = data
    } finally {
      loading.value = false
    }
  }

  async function create (fight: Fight) {
    const { data } = await api.post<Fight>('/api/fights', fight)
    fights.value.unshift(data)
    return data
  }

  async function update (id: string, fight: Partial<Fight>) {
    const { data } = await api.put<Fight>(`/api/fights/${id}`, fight)
    const idx = fights.value.findIndex(f => f._id === id)
    if (idx !== -1) fights.value[idx] = data
    return data
  }

  async function remove (id: string) {
    await api.delete(`/api/fights/${id}`)
    fights.value = fights.value.filter(f => f._id !== id)
  }

  return { fights, loading, fetchAll, create, update, remove }
})
