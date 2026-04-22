const express = require('express')
const path    = require('path')
const fs      = require('fs')
const jwt     = require('jsonwebtoken')

const router     = express.Router()
const SOUND_NAMES = ['ready', 'fight', 'ko', 'draw']

function soundsDir () {
  const dataPath = process.env.DATA_PATH || path.join(__dirname, '../../../../data')
  return path.join(dataPath, 'sounds')
}

function findCustomFile (dir, name) {
  if (!fs.existsSync(dir)) return null
  const f = fs.readdirSync(dir).find(x => x.startsWith(`${name}_custom.`))
  return f ? path.join(dir, f) : null
}

function auth (req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Invalid token' }) }
}

// ── GET /api/sounds ────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const dir = soundsDir()
  fs.mkdirSync(dir, { recursive: true })

  // Sons prédéfinis
  const result = SOUND_NAMES.map(name => {
    const customFile = findCustomFile(dir, name)
    const synthFile  = path.join(dir, `${name}_v2.wav`)
    const customExt  = customFile ? path.extname(customFile).slice(1) : null
    return {
      name,
      predefined: true,
      hasCustom:  !!customFile,
      customUrl:  customFile ? `/media/sounds/${name}_custom.${customExt}` : null,
      synthUrl:   fs.existsSync(synthFile) ? `/media/sounds/${name}_v2.wav` : null,
    }
  })

  // Sons custom supplémentaires (pas dans SOUND_NAMES)
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(.+)_custom\.(.+)$/)
    if (!m || SOUND_NAMES.includes(m[1])) continue
    const name = m[1], ext = m[2]
    result.push({
      name,
      predefined: false,
      hasCustom:  true,
      customUrl:  `/media/sounds/${name}_custom.${ext}`,
      synthUrl:   null,
    })
  }

  res.json(result)
})

// ── POST /api/sounds/:name  (body: { data: base64, ext: 'mp3'|'wav'|… }) ──────
router.post('/:name', auth, express.json({ limit: '20mb' }), (req, res) => {
  const { name } = req.params
  if (!SOUND_NAMES.includes(name)) return res.status(400).json({ error: 'Son inconnu' })

  const { data, ext = 'wav' } = req.body
  if (!data) return res.status(400).json({ error: 'Données manquantes' })

  const dir = soundsDir()
  fs.mkdirSync(dir, { recursive: true })

  // Supprimer les anciens fichiers custom (toute extension)
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(`${name}_custom.`)) fs.unlinkSync(path.join(dir, f))
  }

  const savePath = path.join(dir, `${name}_custom.${ext}`)
  fs.writeFileSync(savePath, Buffer.from(data, 'base64'))

  res.json({ ok: true, url: `/media/sounds/${name}_custom.${ext}` })
})

// ── DELETE /api/sounds/:name ───────────────────────────────────────────────────
router.delete('/:name', auth, (req, res) => {
  const { name } = req.params
  if (!SOUND_NAMES.includes(name)) return res.status(400).json({ error: 'Son inconnu' })

  const dir = soundsDir()
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith(`${name}_custom.`)) fs.unlinkSync(path.join(dir, f))
    }
  }
  res.json({ ok: true })
})

module.exports = router
