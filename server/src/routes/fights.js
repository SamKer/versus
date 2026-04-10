const express = require('express')
const authMiddleware = require('../middleware/auth')
const Fight = require('../models/Fight')

const router = express.Router()

// Public — list all fights
router.get('/', async (req, res) => {
  try {
    res.json(await Fight.find().sort({ createdAt: -1 }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Public — single fight
router.get('/:id', async (req, res) => {
  try {
    const fight = await Fight.findById(req.params.id)
    if (!fight) return res.status(404).json({ error: 'Introuvable' })
    res.json(fight)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Admin — create
router.post('/', authMiddleware, async (req, res) => {
  try {
    const fight = await new Fight(req.body).save()
    res.status(201).json(fight)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Admin — update
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const fight = await Fight.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!fight) return res.status(404).json({ error: 'Introuvable' })
    res.json(fight)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Admin — delete
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Fight.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
