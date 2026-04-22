const express = require('express')
const authMiddleware = require('../middleware/auth')
const Actor = require('../models/Actor')
const { searchPerson, getPersonDetails } = require('../services/tmdb')

const router = express.Router()

// Public — liste tous les acteurs (ordre alphabétique)
router.get('/', async (req, res) => {
  try {
    res.json(await Actor.find().sort({ name: 1 }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Public — recherche dans la base locale (insensible à la casse)
router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  try {
    const actors = await Actor.find({
      name: { $regex: q, $options: 'i' }
    }).sort({ name: 1 }).limit(10)
    res.json(actors)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin — recherche TMDB
router.post('/search-tmdb', authMiddleware, async (req, res) => {
  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'Query requise' })
  try {
    const results = await searchPerson(query)
    res.json(results.slice(0, 8).map(p => ({
      tmdbId:   p.id,
      name:     p.name,
      photo:    p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : null,
      knownFor: (p.known_for || []).slice(0, 3).map(k => k.title || k.name).filter(Boolean)
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin — créer (avec fetch TMDB optionnel si tmdbId fourni)
router.post('/', authMiddleware, async (req, res) => {
  try {
    let data = { ...req.body }

    // Si tmdbId présent sans biographie, on enrichit depuis TMDB
    if (data.tmdbId && !data.biography) {
      const details = await getPersonDetails(data.tmdbId)
      data = { ...details, ...data }
    }

    let actor
    if (data.tmdbId) {
      actor = await Actor.findOneAndUpdate(
        { tmdbId: data.tmdbId },
        data,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    } else {
      actor = await new Actor(data).save()
    }

    res.status(201).json(actor)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Public — acteurs ayant un combat en commun avec un acteur donné
router.get('/:id/co-fighters', async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id)
    if (!actor) return res.status(404).json({ error: 'Introuvable' })

    const Fight = require('../models/Fight')
    const query = actor.tmdbId
      ? { $or: [{ 'actors.tmdbId': actor.tmdbId }, { 'actors.name': actor.name }] }
      : { 'actors.name': actor.name }

    const fights = await Fight.find(query)

    const tmdbIds = new Set()
    const names   = new Set()
    for (const fight of fights) {
      for (const a of fight.actors) {
        if (actor.tmdbId && a.tmdbId === actor.tmdbId) continue
        if (!actor.tmdbId && a.name === actor.name) continue
        if (a.tmdbId) tmdbIds.add(a.tmdbId)
        else names.add(a.name)
      }
    }

    const orConds = []
    if (tmdbIds.size) orConds.push({ tmdbId: { $in: [...tmdbIds] } })
    if (names.size)   orConds.push({ name: { $in: [...names] } })
    if (!orConds.length) return res.json([])

    const coFighters = await Actor.find({ $or: orConds }).sort({ name: 1 })
    res.json(coFighters)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin — mettre à jour
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const actor = await Actor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!actor) return res.status(404).json({ error: 'Introuvable' })
    res.json(actor)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Admin — supprimer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Actor.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
