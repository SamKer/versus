const express = require('express')
const authMiddleware = require('../middleware/auth')
const Fight        = require('../models/Fight')
const Movie        = require('../models/Movie')
const Actor        = require('../models/Actor')
const Choreographer = require('../models/Choreographer')
const ViewSnapshot = require('../models/ViewSnapshot')

const router = express.Router()

// Synchronise toutes les collections annexes à partir des données d'un combat
async function syncCollections (data) {
  const ops = []

  // ── Films ───────────────────────────────────────────────────
  if (data.movieTitle) {
    const movieDoc = {
      title:         data.movieTitle,
      year:          data.movieYear          || undefined,
      poster:        data.moviePoster        || undefined,
      choreographer: data.choreographer      || undefined
    }
    if (data.movieTmdbId) {
      ops.push(
        Movie.findOneAndUpdate(
          { tmdbId: data.movieTmdbId },
          { ...movieDoc, tmdbId: data.movieTmdbId },
          { upsert: true, new: true }
        )
      )
    }
  }

  // ── Acteurs ─────────────────────────────────────────────────
  for (const actor of data.actors || []) {
    if (!actor.name) continue
    const actorDoc = {
      name:  actor.name,
      photo: actor.photo || undefined
    }
    if (actor.tmdbId) {
      ops.push(
        Actor.findOneAndUpdate(
          { tmdbId: actor.tmdbId },
          { ...actorDoc, tmdbId: actor.tmdbId },
          { upsert: true, new: true }
        )
      )
    } else {
      // Upsert par nom si pas de tmdbId
      ops.push(
        Actor.findOneAndUpdate(
          { name: actor.name, tmdbId: { $exists: false } },
          actorDoc,
          { upsert: true, new: true }
        )
      )
    }
  }

  // ── Chorégraphes ─────────────────────────────────────────────
  if (data.choreographer) {
    const names = data.choreographer.split(',').map(n => n.trim()).filter(Boolean)
    for (const name of names) {
      ops.push(
        Choreographer.findOneAndUpdate(
          { name },
          { name },
          { upsert: true, new: true }
        )
      )
    }
  }

  await Promise.allSettled(ops)
}

// ── Snapshot de vues (1 par jour max par combat) ────────────────
async function saveViewSnapshot (fight) {
  if (!fight._id || !(fight.views > 0)) return
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  await ViewSnapshot.findOneAndUpdate(
    { fightId: fight._id, recordedAt: { $gte: today, $lt: tomorrow } },
    { fightId: fight._id, youtubeId: fight.youtubeId, views: fight.views, recordedAt: new Date() },
    { upsert: true }
  )
}

// Public — liste tous les combats
router.get('/', async (req, res) => {
  try {
    res.json(await Fight.find().sort({ createdAt: -1 }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Public — tous les combats d'un acteur donné
router.get('/by-actor/:id', async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id)
    if (!actor) return res.status(404).json({ error: 'Introuvable' })
    const query = actor.tmdbId
      ? { $or: [{ 'actors.tmdbId': actor.tmdbId }, { 'actors.name': actor.name }] }
      : { 'actors.name': actor.name }
    const fights = await Fight.find(query).sort({ createdAt: -1 })
    res.json(fights)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Public — combats contenant deux acteurs donnés (par _id Mongo)
router.get('/with-actors', async (req, res) => {
  const { a1, a2 } = req.query
  if (!a1 || !a2) return res.status(400).json({ error: 'a1 et a2 requis' })
  try {
    const [actor1, actor2] = await Promise.all([
      Actor.findById(a1),
      Actor.findById(a2)
    ])
    if (!actor1 || !actor2) return res.json([])

    const buildQuery = (a) => a.tmdbId
      ? { $or: [{ 'actors.tmdbId': a.tmdbId }, { 'actors.name': a.name }] }
      : { 'actors.name': a.name }

    const q1 = buildQuery(actor1)
    const q2 = buildQuery(actor2)

    const fights = await Fight.find({ $and: [q1, q2] }).sort({ createdAt: -1 })
    res.json(fights)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Public — historique des vues d'un combat
router.get('/:id/views-history', async (req, res) => {
  try {
    const history = await ViewSnapshot.find({ fightId: req.params.id }).sort({ recordedAt: 1 })
    res.json(history)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Public — un combat
router.get('/:id', async (req, res) => {
  try {
    const fight = await Fight.findById(req.params.id)
    if (!fight) return res.status(404).json({ error: 'Introuvable' })
    res.json(fight)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin — créer
router.post('/', authMiddleware, async (req, res) => {
  try {
    const fight = await new Fight(req.body).save()
    syncCollections(req.body)
    saveViewSnapshot(fight)            // fire-and-forget
    res.status(201).json(fight)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Admin — mettre à jour
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const fight = await Fight.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!fight) return res.status(404).json({ error: 'Introuvable' })
    syncCollections(req.body)
    saveViewSnapshot(fight)            // fire-and-forget
    res.json(fight)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Admin — supprimer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Fight.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
