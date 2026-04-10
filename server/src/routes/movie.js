const express = require('express')
const authMiddleware = require('../middleware/auth')
const { searchMovie, getMovieDetails, cleanTitle } = require('../services/tmdb')

const router = express.Router()

// Detect movie from YouTube title and return best match + cast
router.post('/detect', authMiddleware, async (req, res) => {
  const { title } = req.body
  if (!title) return res.status(400).json({ error: 'Titre requis' })

  try {
    const cleaned = cleanTitle(title)

    // 1er essai avec le titre nettoyé, fallback sur le titre brut
    let results = await searchMovie(cleaned)
    if (!results.length && cleaned !== title) {
      results = await searchMovie(title)
    }

    if (!results.length) return res.json({ movie: null, cast: [], suggestions: [] })

    const { movie, cast } = await getMovieDetails(results[0].id)

    const suggestions = await Promise.all(
      results.slice(1, 5).map(m => getMovieDetails(m.id).then(d => d.movie).catch(() => null))
    ).then(r => r.filter(Boolean))

    res.json({ movie, cast, suggestions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Search movies manually by query string
router.post('/search', authMiddleware, async (req, res) => {
  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'Query requise' })
  try {
    const results = await searchMovie(query)
    res.json(results.slice(0, 8).map(m => ({
      tmdbId: m.id,
      title:  m.title,
      year:   m.release_date ? new Date(m.release_date).getFullYear() : null,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : null
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get details for a specific TMDB movie (when admin picks a suggestion)
router.get('/:tmdbId', authMiddleware, async (req, res) => {
  try {
    const { movie, cast } = await getMovieDetails(req.params.tmdbId)
    res.json({ movie, cast })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
