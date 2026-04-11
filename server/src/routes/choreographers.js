const express = require('express')
const authMiddleware = require('../middleware/auth')
const Choreographer = require('../models/Choreographer')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    res.json(await Choreographer.find().sort({ name: 1 }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  try {
    const docs = await Choreographer.find({
      name: { $regex: q, $options: 'i' }
    }).sort({ name: 1 }).limit(10)
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Choreographer.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!doc) return res.status(404).json({ error: 'Introuvable' })
    res.json(doc)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Choreographer.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
