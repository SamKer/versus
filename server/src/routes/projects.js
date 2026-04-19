const express  = require('express')
const path     = require('path')
const fs       = require('fs')
const jwt      = require('jsonwebtoken')
const Project  = require('../models/Project')
const Fight    = require('../models/Fight')
const { compileProject } = require('../services/compiler')

const router = express.Router()

// Progression en mémoire (évite les écritures DB à chaque frame)
const exportProgress = new Map()

// ── Auth middleware ───────────────────────────────────────────────────────────
function auth (req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// ── GET /api/projects/:fightId ─────────────────────────────────────────────
router.get('/:fightId', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ fightId: req.params.fightId })
    if (!project) return res.json(null)
    res.json(project)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── PUT /api/projects/:fightId ─────────────────────────────────────────────
router.put('/:fightId', auth, async (req, res) => {
  try {
    const { players, events, cuts, outcome } = req.body
    const project = await Project.findOneAndUpdate(
      { fightId: req.params.fightId },
      { $set: { players, events, cuts, outcome: outcome ?? null } },
      { upsert: true, new: true }
    )
    res.json(project)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── POST /api/projects/:fightId/export ────────────────────────────────────
router.post('/:fightId/export', auth, async (req, res) => {
  try {
    const fight = await Fight.findById(req.params.fightId)
    if (!fight) return res.status(404).json({ error: 'Fight not found' })
    if (!fight.videoPath) return res.status(400).json({ error: 'No local video for this fight' })

    const dataPath  = process.env.DATA_PATH || path.join(__dirname, '../../../../data')
    const videoPath = path.join(dataPath, fight.videoPath.replace(/^\/media\//, ''))

    if (!fs.existsSync(videoPath)) {
      return res.status(400).json({ error: 'Video file not found on disk' })
    }

    const project = await Project.findOneAndUpdate(
      { fightId: req.params.fightId },
      { $set: { exportStatus: 'processing', exportError: null } },
      { upsert: false, new: true }   // pas d'upsert : le projet doit déjà exister
    )

    if (!project) {
      return res.status(404).json({ error: 'Projet introuvable — sauvegardez d\'abord.' })
    }

    const outputDir  = path.join(dataPath, 'projects', req.params.fightId)
    const outputPath = path.join(outputDir, 'exported.mp4')

    const fightId = req.params.fightId
    exportProgress.set(fightId, 0)

    // Fire and forget — client polls status
    compileProject(project.toObject(), videoPath, outputPath, pct => {
      exportProgress.set(fightId, pct)
    })
      .then(async () => {
        exportProgress.set(fightId, 100)
        const exportPath = `/media/projects/${fightId}/exported.mp4`
        await Project.updateOne({ fightId }, { $set: { exportStatus: 'done', exportPath } })
        console.log(`✓ Export done: ${outputPath}`)
      })
      .catch(async err => {
        exportProgress.delete(fightId)
        await Project.updateOne({ fightId }, { $set: { exportStatus: 'error', exportError: err.message } })
        console.error('✗ Export error:', err.message)
      })

    res.json({ status: 'processing' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── DELETE /api/projects/:fightId/export ─────────────────────────────────
router.delete('/:fightId/export', auth, async (req, res) => {
  try {
    exportProgress.delete(req.params.fightId)
    await Project.updateOne(
      { fightId: req.params.fightId },
      { $set: { exportStatus: 'idle', exportError: null } }
    )
    res.json({ status: 'idle' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── GET /api/projects/:fightId/export/status ─────────────────────────────
router.get('/:fightId/export/status', auth, async (req, res) => {
  try {
    const project = await Project.findOne({ fightId: req.params.fightId })
    if (!project) return res.json({ status: 'idle' })
    res.json({
      status:     project.exportStatus,
      exportPath: project.exportPath,
      error:      project.exportError,
      progress:   exportProgress.get(req.params.fightId) ?? (project.exportStatus === 'done' ? 100 : 0)
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
