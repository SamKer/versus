const express = require('express')
const authMiddleware = require('../middleware/auth')
const Movie = require('../models/Movie')

const router = express.Router()

// Public — liste tous les films (ordre alphabétique)
router.get('/', async (req, res) => {
  try {
    res.json(await Movie.find().sort({ title: 1 }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin — créer ou mettre à jour (upsert par tmdbId)
router.post('/', authMiddleware, async (req, res) => {
  try {
    let movie
    if (req.body.tmdbId) {
      movie = await Movie.findOneAndUpdate(
        { tmdbId: req.body.tmdbId },
        req.body,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      movie = await new Movie(req.body).save()
    }
    res.status(201).json(movie)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Admin — mettre à jour
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!movie) return res.status(404).json({ error: 'Introuvable' })
    res.json(movie)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Admin — supprimer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
