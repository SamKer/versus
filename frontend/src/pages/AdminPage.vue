<template>
  <q-page class="q-pa-md">

    <!-- ── LOGIN ── -->
    <div v-if="!authStore.isAuthenticated" class="flex flex-center" style="min-height: 80vh">
      <q-card style="width: 360px" class="bg-dark">
        <q-card-section class="text-center q-py-xl">
          <div class="versus-title text-h4 q-mb-lg">RYUKEN</div>
          <div class="text-grey q-mb-xl">Espace d'administration</div>

          <q-btn
            color="white"
            text-color="dark"
            icon="img:https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            label="Se connecter avec Google"
            size="md"
            @click="loginWithGoogle"
            class="full-width"
          />

          <div v-if="loginError" class="text-negative q-mt-md text-caption">
            {{ loginError }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- ── ADMIN PANEL ── -->
    <div v-else>
      <div class="row items-center q-mb-lg">
        <div class="versus-title text-h5">Administration</div>
        <q-space />
        <div class="text-caption text-grey">{{ authStore.user?.name }}</div>
      </div>

      <div class="row q-col-gutter-lg">

        <!-- ── LEFT: YouTube import ── -->
        <div class="col-12 col-md-5">
          <q-card class="bg-dark" flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-bold q-mb-md">
                <q-icon name="smart_display" class="q-mr-sm" />
                Importer un combat
              </div>

              <q-input
                v-model="youtubeUrl"
                label="URL YouTube"
                outlined
                dark
                placeholder="https://www.youtube.com/watch?v=..."
                :disable="analyzing"
              >
                <template #append>
                  <q-btn
                    flat
                    icon="search"
                    color="primary"
                    :loading="analyzing"
                    @click="analyze"
                    :disable="!youtubeUrl"
                  />
                </template>
              </q-input>
            </q-card-section>
          </q-card>

          <!-- Movie suggestions -->
          <q-card v-if="suggestions.length" class="bg-dark q-mt-md" flat bordered>
            <q-card-section>
              <div class="text-caption text-grey q-mb-sm">Autres films possibles :</div>
              <q-list dense>
                <q-item
                  v-for="s in suggestions"
                  :key="s.tmdbId"
                  clickable
                  @click="selectSuggestion(s.tmdbId)"
                  class="rounded-borders"
                >
                  <q-item-section avatar>
                    <q-avatar square size="40px">
                      <img v-if="s.poster" :src="s.poster" />
                      <q-icon v-else name="movie" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ s.title }}</q-item-label>
                    <q-item-label caption>{{ s.year }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>

          <!-- Existing fights list -->
          <q-card class="bg-dark q-mt-md" flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-bold q-mb-md">
                <q-icon name="list" class="q-mr-sm" />
                Combats enregistrés ({{ fightsStore.fights.length }})
              </div>
              <q-list dense>
                <q-item
                  v-for="f in fightsStore.fights"
                  :key="f._id"
                  class="rounded-borders"
                >
                  <q-item-section avatar>
                    <q-avatar square size="40px">
                      <img v-if="f.thumbnail" :src="f.thumbnail" />
                      <q-icon v-else name="movie" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ f.movieTitle }}</q-item-label>
                    <q-item-label caption>{{ f.movieYear }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn flat round icon="delete" color="negative" size="sm" @click="deleteFight(f._id!)" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <!-- ── RIGHT: Fight form ── -->
        <div class="col-12 col-md-7">
          <q-card v-if="form" class="bg-dark" flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-bold q-mb-md">
                <q-icon name="edit" class="q-mr-sm" />
                Détails du combat
              </div>

              <!-- YouTube info -->
              <div class="row q-gutter-md q-mb-lg items-start">
                <q-img
                  v-if="form.thumbnail"
                  :src="form.thumbnail"
                  style="width: 180px; border-radius: 8px; flex-shrink:0"
                  :ratio="16/9"
                />
                <div class="col">
                  <div class="text-body2 q-mb-xs">{{ form.youtubeTitle }}</div>
                  <div class="text-caption text-grey">
                    <q-icon name="visibility" size="12px" class="q-mr-xs" />
                    {{ formatViews(form.views) }} vues
                  </div>
                </div>
              </div>

              <q-separator dark class="q-mb-md" />

              <!-- Recherche manuelle TMDB -->
              <div class="text-caption text-grey q-mb-sm">RECHERCHE FILM (TMDB)</div>

              <q-input
                v-model="tmdbSearch"
                label="Chercher un film..."
                outlined dark dense
                class="q-mb-sm"
                @keyup.enter="searchTmdb"
                :loading="searchingTmdb"
              >
                <template #append>
                  <q-btn flat round icon="search" color="primary" :loading="searchingTmdb" @click="searchTmdb" />
                </template>
              </q-input>

              <!-- Résultats de recherche -->
              <q-list v-if="tmdbResults.length" bordered separator dark class="rounded-borders q-mb-md">
                <q-item
                  v-for="r in tmdbResults"
                  :key="r.tmdbId"
                  clickable
                  v-ripple
                  @click="applyTmdbResult(r.tmdbId)"
                  :active="form.movieTmdbId === r.tmdbId"
                  active-class="bg-grey-9"
                >
                  <q-item-section avatar>
                    <q-avatar square size="44px">
                      <img v-if="r.poster" :src="r.poster" />
                      <q-icon v-else name="movie" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ r.title }}</q-item-label>
                    <q-item-label caption>{{ r.year }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon v-if="form.movieTmdbId === r.tmdbId" name="check_circle" color="positive" />
                  </q-item-section>
                </q-item>
              </q-list>

              <!-- Film sélectionné -->
              <div class="text-caption text-grey q-mb-sm">DÉTAILS DU FILM</div>

              <div class="row q-col-gutter-md q-mb-sm">
                <div class="col-12 col-sm-8">
                  <q-input
                    v-model="form.movieTitle"
                    label="Titre du film"
                    outlined dark dense
                    :hint="form.movieTitle ? '' : 'Non détecté — saisir manuellement'"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model.number="form.movieYear"
                    label="Année"
                    outlined dark dense
                    type="number"
                    :hint="form.movieYear ? '' : 'Non détecté'"
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model="form.choreographer"
                    label="Chorégraphe"
                    outlined dark dense
                    :hint="form.choreographer ? '' : 'Non trouvé dans TMDB — optionnel'"
                  />
                </div>
              </div>

              <q-separator dark class="q-mb-md" />

              <!-- Actors -->
              <div class="text-caption text-grey q-mb-sm">ACTEURS DU FILM</div>

              <div v-if="!form.actors.length" class="text-caption text-grey q-mb-md">
                Aucun acteur — sélectionnez un film d'abord
              </div>

              <q-list v-else dense class="q-mb-sm">
                <q-item
                  v-for="(actor, i) in form.actors"
                  :key="i"
                  tag="label"
                  clickable
                  class="rounded-borders q-mb-xs"
                  :class="actor.selected ? 'bg-grey-9' : ''"
                >
                  <q-item-section side>
                    <q-checkbox v-model="actor.selected" color="primary" dark />
                  </q-item-section>
                  <q-item-section avatar>
                    <q-avatar size="40px">
                      <img v-if="actor.photo" :src="actor.photo" />
                      <q-icon v-else name="person" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ actor.name }}</q-item-label>
                    <q-item-label caption class="text-accent">{{ actor.character }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>

            <q-card-actions align="right" class="q-px-md q-pb-md">
              <q-btn
                outline
                color="accent"
                icon="download"
                label="Télécharger la vidéo"
                :loading="downloading"
                @click="downloadVideo"
              />
              <q-space />
              <q-btn
                color="primary"
                icon="save"
                label="Sauvegarder"
                :loading="saving"
                @click="save"
              />
            </q-card-actions>
          </q-card>

          <div v-else class="flex flex-center text-grey" style="min-height: 200px">
            <div class="text-center">
              <q-icon name="link" size="48px" class="q-mb-md" />
              <div>Collez une URL YouTube et cliquez sur Analyser</div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { useFightsStore, type Fight, type Actor } from 'stores/fights'
import { api } from 'boot/axios'

const $q = useQuasar()
const route = useRoute()
const authStore = useAuthStore()
const fightsStore = useFightsStore()

const youtubeUrl = ref('')
const analyzing = ref(false)
const downloading = ref(false)
const saving = ref(false)
const loginError = ref('')
const suggestions = ref<Array<{ tmdbId: number; title: string; year: number | null; poster: string | null }>>([])
const form = ref<Fight | null>(null)

const tmdbSearch = ref('')
const searchingTmdb = ref(false)
const tmdbResults = ref<Array<{ tmdbId: number; title: string; year: number | null; poster: string | null }>>([])

// ── Auth ──────────────────────────────────────────────────────
function loginWithGoogle () {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`
}

onMounted(async () => {
  // Pick up token from redirect
  const token = route.query.token as string | undefined
  const error = route.query.error as string | undefined

  if (token) {
    authStore.setToken(token)
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0])
  }
  if (error === 'unauthorized') {
    loginError.value = 'Accès refusé. Seul l\'administrateur peut se connecter.'
  }

  if (authStore.isAuthenticated) {
    await fightsStore.fetchAll()
  }
})

// ── Analysis ──────────────────────────────────────────────────
async function analyze () {
  if (!youtubeUrl.value) return
  analyzing.value = true
  suggestions.value = []
  form.value = null
  try {
    // 1. YouTube metadata via yt-dlp
    const { data: ytData } = await api.post('/api/youtube/info', { url: youtubeUrl.value })

    // 2. Movie detection via TMDB
    const { data: movieData } = await api.post('/api/movie/detect', { title: ytData.title })

    form.value = {
      youtubeUrl: youtubeUrl.value,
      youtubeId: ytData.youtubeId,
      youtubeTitle: ytData.title,
      views: ytData.views,
      thumbnail: ytData.thumbnail,
      movieTitle: movieData.movie?.title ?? ytData.title,
      movieYear: movieData.movie?.year ?? undefined,
      movieTmdbId: movieData.movie?.tmdbId ?? undefined,
      moviePoster: movieData.movie?.poster ?? undefined,
      choreographer: movieData.movie?.choreographer ?? '',
      actors: (movieData.cast ?? []).map((a: Actor) => ({ ...a, selected: false }))
    }

    suggestions.value = movieData.suggestions ?? []
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Erreur lors de l\'analyse' })
  } finally {
    analyzing.value = false
  }
}

async function selectSuggestion (tmdbId: number) {
  try {
    const { data } = await api.get(`/api/movie/${tmdbId}`)
    if (form.value) {
      form.value.movieTitle = data.movie.title
      form.value.movieYear = data.movie.year
      form.value.movieTmdbId = data.movie.tmdbId
      form.value.moviePoster = data.movie.poster
      form.value.choreographer = data.movie.choreographer ?? ''
      form.value.actors = data.cast
      suggestions.value = []
    }
  } catch (err: any) {
    $q.notify({ type: 'negative', message: 'Erreur lors du chargement du film' })
  }
}

// ── TMDB manual search ────────────────────────────────────────
async function searchTmdb () {
  if (!tmdbSearch.value.trim()) return
  searchingTmdb.value = true
  tmdbResults.value = []
  try {
    const { data } = await api.post('/api/movie/search', { query: tmdbSearch.value })
    tmdbResults.value = data
  } catch (err: any) {
    $q.notify({ type: 'negative', message: 'Erreur de recherche TMDB' })
  } finally {
    searchingTmdb.value = false
  }
}

async function applyTmdbResult (tmdbId: number) {
  try {
    const { data } = await api.get(`/api/movie/${tmdbId}`)
    if (form.value) {
      form.value.movieTitle      = data.movie.title
      form.value.movieYear       = data.movie.year
      form.value.movieTmdbId     = data.movie.tmdbId
      form.value.moviePoster     = data.movie.poster
      form.value.choreographer   = data.movie.choreographer ?? ''
      form.value.actors          = data.cast.map((a: Actor) => ({ ...a, selected: false }))
      tmdbResults.value          = []
      tmdbSearch.value           = ''
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur lors du chargement du film' })
  }
}


// ── Download ──────────────────────────────────────────────────
async function downloadVideo () {
  if (!form.value) return
  downloading.value = true
  try {
    const { data } = await api.post('/api/youtube/download', {
      url: form.value.youtubeUrl,
      youtubeId: form.value.youtubeId
    })
    form.value.videoPath = data.videoPath
    $q.notify({ type: 'positive', message: 'Vidéo téléchargée avec succès' })
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Erreur de téléchargement' })
  } finally {
    downloading.value = false
  }
}

// ── Save ──────────────────────────────────────────────────────
async function save () {
  if (!form.value) return
  saving.value = true
  try {
    const payload = {
      ...form.value,
      actors: form.value.actors
        .filter(a => a.selected)
        .map(({ selected: _, ...a }) => a)
    }
    await fightsStore.create(payload as Fight)
    $q.notify({ type: 'positive', message: 'Combat enregistré !' })
    form.value = null
    youtubeUrl.value = ''
    suggestions.value = []
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Erreur lors de la sauvegarde' })
  } finally {
    saving.value = false
  }
}

async function deleteFight (id: string) {
  await fightsStore.remove(id)
  $q.notify({ type: 'info', message: 'Combat supprimé' })
}

// ── Helpers ───────────────────────────────────────────────────
function formatViews (n?: number) {
  if (!n) return '–'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
</script>
