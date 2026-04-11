const axios = require('axios')

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: { Authorization: `Bearer ${process.env.TMDB_TOKEN}` }
})

const CHOREO_JOBS = ['choreographer', 'fight choreographer', 'stunt choreographer', 'action choreographer']

function imgUrl (profilePath, size = 'w500') {
  return profilePath ? `https://image.tmdb.org/t/p/${size}${profilePath}` : null
}

function yearFromDate (dateStr) {
  return dateStr ? new Date(dateStr).getFullYear() : null
}

function extractChoreographer (crew = []) {
  return crew
    .filter(c => CHOREO_JOBS.some(j => c.job?.toLowerCase().includes(j)))
    .map(c => c.name)
    .join(', ') || null
}

async function searchMovie (query) {
  const { data } = await tmdb.get('/search/movie', {
    params: { query, language: 'fr-FR', include_adult: false }
  })
  return data.results
}

async function getMovieDetails (tmdbId) {
  const { data } = await tmdb.get(`/movie/${tmdbId}`, {
    params: { language: 'fr-FR', append_to_response: 'credits' }
  })

  const cast = (data.credits?.cast || []).slice(0, 12).map(a => ({
    tmdbId:    a.id,
    name:      a.name,
    character: a.character,
    photo:     imgUrl(a.profile_path)
  }))

  return {
    movie: {
      tmdbId:        data.id,
      title:         data.title,
      year:          yearFromDate(data.release_date),
      poster:        imgUrl(data.poster_path),
      choreographer: extractChoreographer(data.credits?.crew)
    },
    cast
  }
}

function cleanTitle (youtubeTitle) {
  return youtubeTitle
    .replace(/\b(HD|4K|720p|1080p|fight\s*scene|combat\s*scene|scene|clip|official|trailer|full\s*movie)\b/gi, '')
    .replace(/\(\d{4}\)/g, '')           // (2005)
    .replace(/\[\d{4}\]/g, '')           // [2005]
    .replace(/\[.*?\]/g, '')             // [anything]
    .replace(/\s[|–—]\s.*/g, '')         // " | rest" ou " — rest"
    .replace(/\s+-\s+.*/g, '')           // " - rest" (tiret entouré d'espaces seulement)
    .trim()
    .replace(/\s+/g, ' ')
}

async function searchPerson (query) {
  const { data } = await tmdb.get('/search/person', {
    params: { query, language: 'fr-FR', include_adult: false }
  })
  return data.results
}

async function getPersonDetails (tmdbId) {
  const { data } = await tmdb.get(`/person/${tmdbId}`, {
    params: { language: 'fr-FR' }
  })
  return {
    tmdbId:       data.id,
    name:         data.name,
    photo:        imgUrl(data.profile_path),
    birthDate:    data.birthday || null,
    placeOfBirth: data.place_of_birth || null,
    biography:    data.biography || null
  }
}

module.exports = { searchMovie, getMovieDetails, cleanTitle, searchPerson, getPersonDetails }
