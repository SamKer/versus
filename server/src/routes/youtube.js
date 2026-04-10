const express = require('express')
const authMiddleware = require('../middleware/auth')
const { getInfo, downloadVideo } = require('../services/ytdlp')

const router = express.Router()

router.post('/info', authMiddleware, async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL requise' })
  try {
    const info = await getInfo(url)
    res.json(info)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/download', authMiddleware, async (req, res) => {
  const { url, youtubeId } = req.body
  if (!url) return res.status(400).json({ error: 'URL requise' })
  try {
    const videoPath = await downloadVideo(url, youtubeId)
    res.json({ videoPath })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
