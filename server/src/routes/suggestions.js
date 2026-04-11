const express = require('express')
const authMiddleware = require('../middleware/auth')
const Suggestion = require('../models/Suggestion')

const router = express.Router()

// Public — soumettre une suggestion
router.post('/', async (req, res) => {
  const { name, youtubeUrl, message } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'Le message est requis' })
  try {
    const doc = await new Suggestion({ name, youtubeUrl, message }).save()
    res.status(201).json(doc)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Admin — liste toutes les suggestions
router.get('/', authMiddleware, async (req, res) => {
  try {
    res.json(await Suggestion.find().sort({ createdAt: -1 }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin — nombre de non lues
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    res.json({ count: await Suggestion.countDocuments({ read: false }) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin — marquer comme lue
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const doc = await Suggestion.findByIdAndUpdate(req.params.id, { read: true }, { new: true })
    if (!doc) return res.status(404).json({ error: 'Introuvable' })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin — supprimer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Suggestion.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
