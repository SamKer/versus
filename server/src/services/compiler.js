const { createCanvas, loadImage } = require('canvas')
const { spawn }        = require('child_process')
const path             = require('path')
const fs               = require('fs')

// ── Probe ─────────────────────────────────────────────────────────────────────
function getVideoInfo (videoPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-show_format',
      videoPath
    ])
    let out = ''
    proc.stdout.on('data', d => { out += d })
    proc.on('close', code => {
      if (code !== 0) return reject(new Error('ffprobe failed'))
      try {
        const meta   = JSON.parse(out)
        const stream = meta.streams.find(s => s.codec_type === 'video')
        const [num, den] = (stream.r_frame_rate || '25/1').split('/').map(Number)
        resolve({
          width:    stream.width,
          height:   stream.height,
          fps:      den ? num / den : 25,
          duration: parseFloat(meta.format.duration)
        })
      } catch (e) { reject(e) }
    })
  })
}

// ── WAV sound generation ───────────────────────────────────────────────────────
function makeWav (samples, sr) {
  const n   = samples.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0);  buf.writeUInt32LE(36 + n * 2, 4);  buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16);          buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);       buf.writeUInt32LE(sr * 2, 28)
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++)
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2)
  return buf
}

// Synthèse vocale formantique simplifiée — sonne comme une annonce d'arcade
function voiced (sr, dur, pitchHz, formants, env) {
  const s = new Float32Array(Math.ceil(dur * sr))
  for (let i = 0; i < s.length; i++) {
    const t = i / sr
    const e = env(t, dur)
    let v = Math.sin(2 * Math.PI * pitchHz * t)
    for (let k = 2; k <= 5; k++) v += (1 / k) * Math.sin(2 * Math.PI * pitchHz * k * t)
    let f = 0
    for (const [fq, amp] of formants) f += amp * Math.sin(2 * Math.PI * fq * t)
    s[i] = e * 0.35 * (v * 0.6 + f * 0.4)
  }
  return s
}

function genReady (sr = 44100) {
  // "REA" syllabe (0.05–0.5s) + "DY" syllabe (0.55–0.95s)
  const s = new Float32Array(Math.ceil(1.05 * sr))
  // REA — voyelle /ε/, pitch 300Hz descendant
  for (let i = Math.floor(0.05 * sr); i < Math.floor(0.50 * sr); i++) {
    const t = (i / sr) - 0.05
    const pitch = 300 - t * 70
    const env = Math.min(t / 0.04, 1) * Math.exp(-t * 3.5)
    let v = 0
    for (let k = 1; k <= 5; k++) v += (1 / k) * Math.sin(2 * Math.PI * pitch * k * t)
    s[i] += env * 0.38 * (v * 0.55 + 0.25 * Math.sin(2 * Math.PI * 800 * t) + 0.2 * Math.sin(2 * Math.PI * 1700 * t))
  }
  // DY — voyelle /i/, pitch 340Hz montant
  for (let i = Math.floor(0.55 * sr); i < Math.floor(0.95 * sr); i++) {
    const t = (i / sr) - 0.55
    const pitch = 330 + t * 60
    const env = Math.min(t / 0.03, 1) * Math.exp(-t * 3.0)
    let v = 0
    for (let k = 1; k <= 5; k++) v += (1 / k) * Math.sin(2 * Math.PI * pitch * k * t)
    s[i] += env * 0.42 * (v * 0.5 + 0.15 * Math.sin(2 * Math.PI * 300 * t) + 0.35 * Math.sin(2 * Math.PI * 2400 * t))
  }
  return makeWav(s, sr)
}

function genFight (sr = 44100) {
  // Attaque fricative + voyelle /a/ percutante
  const s = new Float32Array(Math.ceil(0.95 * sr))
  // Fricative F (0–0.08s)
  for (let i = 0; i < Math.floor(0.08 * sr); i++) {
    const t = i / sr
    const env = Math.exp(-t * 25)
    s[i] = env * 0.3 * Math.sin(2 * Math.PI * (3000 + 800 * Math.sin(t * 300)) * t)
  }
  // Voyelle /a/ (0.08–0.65s), pitch 260Hz
  for (let i = Math.floor(0.08 * sr); i < Math.floor(0.65 * sr); i++) {
    const t = (i / sr) - 0.08
    const env = Math.min(t / 0.02, 1) * Math.exp(-t * 2.8)
    let v = 0
    for (let k = 1; k <= 6; k++) v += (1 / k) * Math.sin(2 * Math.PI * 260 * k * t)
    s[i] += env * 0.45 * (v * 0.5 + 0.3 * Math.sin(2 * Math.PI * 750 * t) + 0.2 * Math.sin(2 * Math.PI * 1200 * t))
  }
  return makeWav(s, sr)
}

function genKo (sr = 44100) {
  // "K" click + "O" grave (x2), pitch descendant
  const s = new Float32Array(Math.ceil(1.3 * sr))
  // K click
  for (let i = 0; i < Math.floor(0.06 * sr); i++) {
    const t = i / sr
    s[i] = Math.exp(-t * 70) * 0.5 * Math.sin(2 * Math.PI * (900 - 8000 * t) * t)
  }
  // O1 (0.06–0.55s), 210Hz
  for (let i = Math.floor(0.06 * sr); i < Math.floor(0.55 * sr); i++) {
    const t = (i / sr) - 0.06
    const pitch = 210 - t * 30
    const env = Math.min(t / 0.03, 1) * Math.exp(-t * 2.2)
    let v = 0
    for (let k = 1; k <= 5; k++) v += (1 / k) * Math.sin(2 * Math.PI * pitch * k * t)
    s[i] += env * 0.48 * (v * 0.55 + 0.25 * Math.sin(2 * Math.PI * 450 * t) + 0.2 * Math.sin(2 * Math.PI * 900 * t))
  }
  // Pause + O2 (0.65–1.15s), plus grave
  for (let i = Math.floor(0.65 * sr); i < Math.floor(1.15 * sr); i++) {
    const t = (i / sr) - 0.65
    const pitch = 185 - t * 25
    const env = Math.min(t / 0.03, 1) * Math.exp(-t * 2.0)
    let v = 0
    for (let k = 1; k <= 5; k++) v += (1 / k) * Math.sin(2 * Math.PI * pitch * k * t)
    s[i] += env * 0.52 * (v * 0.55 + 0.25 * Math.sin(2 * Math.PI * 400 * t) + 0.2 * Math.sin(2 * Math.PI * 800 * t))
  }
  return makeWav(s, sr)
}

function genDeath (sr = 44100) {
  // Impact sourd + résonance grave descendante
  const s = new Float32Array(Math.ceil(1.6 * sr))
  // Thud (0–0.08s)
  for (let i = 0; i < Math.floor(0.08 * sr); i++) {
    const t = i / sr
    s[i] = Math.exp(-t * 40) * 0.7 * Math.sin(2 * Math.PI * (120 - 600 * t) * t)
  }
  // Résonance grave (0.05–1.4s), 80Hz descendant vers 50Hz
  for (let i = Math.floor(0.05 * sr); i < Math.floor(1.4 * sr); i++) {
    const t = (i / sr) - 0.05
    const pitch = 80 - t * 18
    const env = Math.min(t / 0.05, 1) * Math.exp(-t * 1.8)
    let v = 0
    for (let k = 1; k <= 4; k++) v += (1 / k) * Math.sin(2 * Math.PI * pitch * k * t)
    s[i] += env * 0.45 * (v * 0.7 + 0.3 * Math.sin(2 * Math.PI * 200 * t))
  }
  return makeWav(s, sr)
}

function genSurrender (sr = 44100) {
  // Mélodie descendante triste (tierce mineure)
  const s = new Float32Array(Math.ceil(1.4 * sr))
  const notes = [{ f: 350, start: 0, dur: 0.45 }, { f: 295, start: 0.48, dur: 0.45 }, { f: 220, start: 0.96, dur: 0.44 }]
  for (const { f, start, dur } of notes) {
    const s0 = Math.floor(start * sr), s1 = Math.floor((start + dur) * sr)
    for (let i = s0; i < s1; i++) {
      const t = (i / sr) - start
      const env = Math.min(t / 0.04, 1) * Math.exp(-t * 3.5)
      let v = 0
      for (let k = 1; k <= 5; k++) v += (1 / k) * Math.sin(2 * Math.PI * f * k * t)
      s[i] += env * 0.38 * (v * 0.6 + 0.25 * Math.sin(2 * Math.PI * f * 1.5 * t))
    }
  }
  return makeWav(s, sr)
}

function genDraw (sr = 44100) {
  // "DRAW" — deux tons plats, neutre
  const s = new Float32Array(Math.ceil(1.1 * sr))
  for (let i = 0; i < Math.floor(0.48 * sr); i++) {
    const t = i / sr
    const env = Math.min(t / 0.04, 1) * Math.max(0, 1 - (t - 0.32) / 0.16)
    let v = 0
    for (let k = 1; k <= 5; k++) v += (1 / k) * Math.sin(2 * Math.PI * 260 * k * t)
    s[i] += env * 0.4 * (v * 0.6 + 0.2 * Math.sin(2 * Math.PI * 700 * t) + 0.2 * Math.sin(2 * Math.PI * 1600 * t))
  }
  for (let i = Math.floor(0.55 * sr); i < Math.floor(1.0 * sr); i++) {
    const t = (i / sr) - 0.55
    const env = Math.min(t / 0.03, 1) * Math.exp(-t * 3)
    let v = 0
    for (let k = 1; k <= 5; k++) v += (1 / k) * Math.sin(2 * Math.PI * 220 * k * t)
    s[i] += env * 0.42 * (v * 0.6 + 0.2 * Math.sin(2 * Math.PI * 600 * t))
  }
  return makeWav(s, sr)
}

function genWins (sr = 44100) {
  // Fanfare victorieuse : arpège C4-E4-G4-C5 puis accord final
  const dur = 1.5
  const s   = new Float32Array(Math.ceil(dur * sr))
  const arp = [261.63, 329.63, 392.00, 523.25]
  arp.forEach((freq, i) => {
    const start = i * 0.12
    const end   = start + 0.55
    for (let j = Math.floor(start * sr); j < Math.min(Math.floor(end * sr), s.length); j++) {
      const t   = (j / sr) - start
      const env = Math.min(t / 0.015, 1) * Math.exp(-t * 4)
      let v = 0
      for (let k = 1; k <= 4; k++) v += (1 / k) * Math.sin(2 * Math.PI * freq * k * t)
      s[j] += env * 0.28 * v
    }
  })
  const chordStart = 0.58
  for (let j = Math.floor(chordStart * sr); j < s.length; j++) {
    const t   = (j / sr) - chordStart
    const env = Math.min(t / 0.04, 1) * Math.exp(-t * 1.2)
    let v = 0
    for (const freq of arp)
      for (let k = 1; k <= 3; k++) v += (1 / (k * arp.length)) * Math.sin(2 * Math.PI * freq * k * t)
    s[j] += env * 0.55 * v
  }
  return makeWav(s, sr)
}

function ensureSounds (dataPath) {
  const { execSync } = require('child_process')
  const dir = path.join(dataPath, 'sounds')
  fs.mkdirSync(dir, { recursive: true })

  const entries = [
    { name: 'ready',     text: 'ready',     gen: genReady     },
    { name: 'fight',     text: 'fight',     gen: genFight     },
    { name: 'ko',        text: 'K. O.',     gen: genKo        },
    { name: 'draw',      text: 'draw',      gen: genDraw      },
    { name: 'death',     text: 'death',     gen: genDeath     },
    { name: 'surrender', text: 'surrender', gen: genSurrender },
    { name: 'wins',      text: 'wins',      gen: genWins      },
  ]

  const p = {}
  for (const { name, text, gen } of entries) {
    // Fichier custom (toute extension) = priorité
    const files      = fs.readdirSync(dir)
    const customFile = files.find(f => f.startsWith(`${name}_custom.`))
    if (customFile) { p[name] = path.join(dir, customFile); continue }

    // Synthèse (espeak ou formantique)
    const synthFile = path.join(dir, `${name}_v2.wav`)
    if (!fs.existsSync(synthFile)) {
      let ok = false
      for (const bin of ['espeak-ng', 'espeak']) {
        try {
          execSync(`${bin} -w "${synthFile}" -p 55 -s 115 -a 200 "${text}" 2>/dev/null`, { timeout: 5000 })
          if (fs.existsSync(synthFile) && fs.statSync(synthFile).size > 200) { ok = true; break }
        } catch {}
      }
      if (!ok) fs.writeFileSync(synthFile, gen())
    }
    p[name] = synthFile
  }
  return p
}

// ── Animation helpers ─────────────────────────────────────────────────────────
const ANIM_DURATION  = 0.25
const SHAKE_DURATION = 0.4
const SLIDE_DURATION = 0.5   // durée de l'animation d'entrée de la lifebar

// Trouve l'acteur du fight qui correspond à un joueur (par nom puis par position)
function findFightActor (player, fightActors) {
  if (!fightActors?.length) return null
  // Source fiable : actorIndex stocké dans le projet (mis à jour au swap)
  if (typeof player.actorIndex === 'number') {
    return fightActors[player.actorIndex] ?? null
  }
  // Fallback : matching par nom (projets sans actorIndex sauvegardé)
  const match = fightActors.find(a => a.name?.toLowerCase() === player.name?.toLowerCase())
  if (match) return match
  const idx = player.side === 'left' ? 0 : 1
  return fightActors[idx] ?? null
}

const ZERO_HP_TYPES = new Set(['ko', 'death', 'surrender'])

function getAnimatedHp (time, events, playerId) {
  let hp = 100
  const hits = (events || [])
    .filter(e => e.target === playerId && !ZERO_HP_TYPES.has(e.type) && e.time <= time)
    .sort((a, b) => a.time - b.time)
  for (const e of hits) {
    const progress = Math.min(1, (time - e.time) / ANIM_DURATION)
    hp = Math.max(0, hp - e.damage * progress)
  }
  const finishers = (events || []).filter(e => e.target === playerId && ZERO_HP_TYPES.has(e.type) && e.time <= time)
  if (finishers.length > 0) {
    const finishTime = Math.max(...finishers.map(k => k.time))
    const progress   = Math.min(1, (time - finishTime) / ANIM_DURATION)
    hp = hp * (1 - progress)
  }
  return Math.max(0, hp)
}

function getShakeOffset (time, events, playerId) {
  let shakeX = 0
  const recent = (events || []).filter(e =>
    e.target === playerId && e.time <= time && (time - e.time) < SHAKE_DURATION
  )
  for (const e of recent) {
    const elapsed = time - e.time
    shakeX += 5 * Math.sin(elapsed * 50) * Math.exp(-elapsed * 8)
  }
  return Math.round(shakeX)
}

// ── HUD overlay helpers ───────────────────────────────────────────────────────
function getSpecialAttacker (videoTime, events, players) {
  const recent = (events || [])
    .filter(e => e.type === 'special' && e.time <= videoTime && (videoTime - e.time) < 1.5)
    .sort((a, b) => b.time - a.time)
  if (!recent.length) return null
  const evt      = recent[0]
  const attacker = (players || []).find(p => p.id !== evt.target)
  if (!attacker) return null
  return { attacker, opacity: Math.max(0, 1 - (videoTime - evt.time) / 1.5) }
}

// ── SF2 health bar renderer ───────────────────────────────────────────────────
function renderFrame (ctx, videoTime, elapsed, project, w, h, readyVideoTime = null, lifebarVideoTime = null, actorData = {}) {
  ctx.clearRect(0, 0, w, h)
  if (!project.players?.length) return

  const hp    = {}
  const shake = {}
  project.players.forEach(p => {
    hp[p.id]    = getAnimatedHp(videoTime, project.events, p.id)
    shake[p.id] = getShakeOffset(videoTime, project.events, p.id)
  })

  drawHUD(ctx, w, h, project.players, hp, shake, elapsed, project.events, videoTime, readyVideoTime, lifebarVideoTime, actorData)
}

function drawHUD (ctx, W, H, players, hp, shakeOffsets = {}, elapsed = -1, events = [], videoTime = 0, readyVideoTime = null, lifebarVideoTime = null, actorData = {}) {
  if (lifebarVideoTime !== null && videoTime < lifebarVideoTime) return

  const BORDER  = 2
  const BAR_H   = Math.max(14, Math.floor(H * 0.028))
  const BAR_W   = Math.floor(W * 0.38)   // légèrement réduit pour la photo
  const MX      = 14
  const MY      = 14
  const NAME_SZ = Math.max(11, Math.floor(H * 0.022))
  const PHOTO_H = Math.floor(H * 0.10)
  const PHOTO_W = Math.floor(PHOTO_H * 0.70)

  // ── Calcul de la slide (descente depuis le haut) ─────────────────────────
  let slideY = 0
  if (lifebarVideoTime !== null) {
    const elapsed2 = videoTime - lifebarVideoTime
    if (elapsed2 < SLIDE_DURATION) {
      const t    = elapsed2 / SLIDE_DURATION
      const ease = 1 - Math.pow(1 - t, 3)           // cubic ease-out
      const offY = MY + PHOTO_H + BORDER * 2 + 10   // hauteur totale du HUD
      slideY = -offY * (1 - ease)
    }
  }

  ctx.save()
  ctx.translate(0, Math.round(slideY))

  players.forEach(player => {
    const pct    = Math.max(0, Math.min(1, (hp[player.id] ?? 100) / 100))
    const isLeft = player.side === 'left'
    const shakeX = shakeOffsets[player.id] || 0
    const aData  = actorData[player.id] || {}

    // Position de la barre (décalée pour laisser la place à la photo)
    const barX  = isLeft ? MX + PHOTO_W + 4 : W - MX - BAR_W - PHOTO_W - 4
    const fillW = Math.floor(BAR_W * pct)

    // Photo alignée : bord supérieur = bord supérieur de la barre (avec bordure)
    const photoY = MY - BORDER
    const photoX = isLeft ? MX : W - MX - PHOTO_W

    ctx.save()
    ctx.translate(shakeX, 0)

    // ── Photo de l'acteur ──────────────────────────────────────────────────
    if (aData.img) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(photoX, photoY, PHOTO_W, PHOTO_H)
      ctx.clip()
      // Ratio portrait : recadre en haut (visage)
      const ratio  = aData.img.width / aData.img.height
      const drawH  = PHOTO_W / ratio
      ctx.drawImage(aData.img, photoX, photoY, PHOTO_W, Math.max(PHOTO_H, drawH))
      ctx.restore()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth   = BORDER
      ctx.strokeRect(photoX, photoY, PHOTO_W, PHOTO_H)
    }

    // ── Barre de vie ───────────────────────────────────────────────────────
    ctx.fillStyle = '#fff'
    ctx.fillRect(barX - BORDER, MY - BORDER, BAR_W + BORDER * 2, BAR_H + BORDER * 2)
    ctx.fillStyle = '#f5c800'
    ctx.fillRect(barX, MY, BAR_W, BAR_H)
    if (fillW > 0) {
      const fillX = isLeft ? barX : barX + BAR_W - fillW
      ctx.fillStyle = '#e01000'
      ctx.fillRect(fillX, MY, fillW, BAR_H)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fillRect(fillX, MY, fillW, Math.floor(BAR_H * 0.35))
    }

    // ── Noms : nom du joueur + (vrai nom acteur) ───────────────────────────
    const nameY      = MY + BAR_H + BORDER + 2
    const playerName = player.name.toUpperCase()
    const actorName  = aData.actorName || null

    ctx.shadowColor   = '#000'
    ctx.shadowBlur    = 3
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.textBaseline  = 'top'

    if (isLeft) {
      // PLAYERNAME  (actorname)
      ctx.textAlign = 'left'
      ctx.font      = `bold ${NAME_SZ}px monospace`
      ctx.fillStyle = '#ffe600'
      ctx.fillText(playerName, barX, nameY)
      if (actorName) {
        const pnW  = ctx.measureText(playerName).width
        const aSZ  = Math.max(9, Math.floor(NAME_SZ * 0.82))
        ctx.font      = `${aSZ}px monospace`
        ctx.fillStyle = '#cccccc'
        ctx.fillText(` (${actorName})`, barX + pnW, nameY + (NAME_SZ - aSZ) / 2)
      }
    } else {
      // (actorname)  PLAYERNAME  — symétrie
      ctx.font      = `bold ${NAME_SZ}px monospace`
      const pnW    = ctx.measureText(playerName).width
      ctx.fillStyle = '#ffe600'
      ctx.textAlign = 'left'
      ctx.fillText(playerName, barX + BAR_W - pnW, nameY)
      if (actorName) {
        const aSZ  = Math.max(9, Math.floor(NAME_SZ * 0.82))
        ctx.font      = `${aSZ}px monospace`
        ctx.fillStyle = '#cccccc'
        const anW  = ctx.measureText(`(${actorName}) `).width
        ctx.fillText(`(${actorName}) `, barX + BAR_W - pnW - anW, nameY + (NAME_SZ - aSZ) / 2)
      }
    }

    ctx.restore()
  })

  ctx.restore()  // fin slide

  // ── "Versus" centré ───────────────────────────────────────────────────────
  const VS_SZ = Math.max(18, Math.floor(H * 0.038))
  const vsY   = MY + Math.floor(BAR_H / 2)
  ctx.save()
  ctx.translate(W / 2, vsY)
  ctx.rotate(-0.12)
  ctx.font         = `bold italic ${VS_SZ}px serif`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor  = '#000'
  ctx.shadowBlur   = 8
  ctx.lineWidth    = Math.max(2, Math.floor(VS_SZ * 0.12))
  ctx.strokeStyle  = '#000'
  ctx.fillStyle    = '#fff'
  ctx.strokeText('Versus', 0, 0)
  ctx.fillText('Versus', 0, 0)
  ctx.restore()

  // ── K.O. / DRAW / DEATH / SURRENDER depuis les events ────────────────────
  const OUTCOME_TYPES = new Set(['ko', 'draw', 'death', 'surrender'])
  const outcomeEvt = [...events]
    .filter(e => OUTCOME_TYPES.has(e.type) && e.time <= videoTime)
    .sort((a, b) => b.time - a.time)[0]
  if (outcomeEvt) {
    const outcome   = outcomeEvt.type
    const showAlpha = Math.min(1, Math.max(0, (videoTime - outcomeEvt.time) / 0.3))
    if (showAlpha > 0) {
      const KO_SZ  = Math.max(20, Math.floor(H * 0.052))
      const koY    = vsY + Math.floor(VS_SZ * 0.5) + KO_SZ * 0.75
      const OUTCOME_TEXT  = { ko: 'K.O.', draw: 'DRAW', death: 'DEATH', surrender: 'SURRENDER' }
      const OUTCOME_COLOR = { ko: '#ff2200', draw: '#ffffff', death: '#9c27b0', surrender: '#ff9800' }
      const text  = OUTCOME_TEXT[outcome]  ?? outcome.toUpperCase()
      const color = OUTCOME_COLOR[outcome] ?? '#ffffff'
      ctx.save()
      ctx.globalAlpha  = showAlpha
      ctx.font         = `bold italic ${KO_SZ}px serif`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor  = '#000'
      ctx.shadowBlur   = 12
      ctx.lineWidth    = Math.max(2, Math.floor(KO_SZ * 0.1))
      ctx.strokeStyle  = '#000'
      ctx.strokeText(text, W / 2, koY)
      ctx.fillStyle = color
      ctx.fillText(text, W / 2, koY)
      ctx.restore()
    }
  }

  // ── "SPECIAL HIT" — même ligne que le nom, bout intérieur de la barre ────
  const specialInfo = getSpecialAttacker(videoTime, events, players)
  if (specialInfo) {
    const { attacker, opacity } = specialInfo
    const isLeft  = attacker.side === 'left'
    const barX    = isLeft ? MX : W - MX - BAR_W
    const innerX  = isLeft ? barX + BAR_W : barX   // bout intérieur (côté centre)
    const textY   = MY + BAR_H + NAME_SZ + 2        // même Y que le nom
    const SP_SZ   = Math.max(10, Math.floor(H * 0.02))
    ctx.save()
    ctx.globalAlpha  = opacity
    ctx.font         = `bold ${SP_SZ}px monospace`
    ctx.textAlign    = isLeft ? 'right' : 'left'    // vers le centre
    ctx.textBaseline = 'top'
    ctx.shadowColor  = '#000'
    ctx.shadowBlur   = 6
    ctx.fillStyle    = '#ce93d8'
    ctx.fillText('★ SPECIAL HIT', innerX, textY)
    ctx.restore()
  }

  // ── READY / FIGHT! — à partir du marqueur ready (ou 1s après le début par défaut) ─
  const readyPhase = readyVideoTime !== null ? (videoTime - readyVideoTime) : (elapsed - 1.0)
  if (readyPhase >= 0 && readyPhase < 2.0) {
    const isReady  = readyPhase < 1.0
    const phase    = isReady ? readyPhase : readyPhase - 1.0
    let   alpha    = phase < 0.1 ? phase / 0.1 : phase > 0.8 ? (1.0 - phase) / 0.2 : 1.0
    alpha = Math.max(0, Math.min(1, alpha))

    const READY_SZ = Math.max(36, Math.floor(H * 0.07))
    const FIGHT_SZ = Math.max(40, Math.floor(H * 0.09))
    const RF_SZ    = isReady ? READY_SZ : FIGHT_SZ
    const centerY  = vsY + Math.floor(VS_SZ * 0.5) + Math.floor(FIGHT_SZ * 0.65) + 6

    const text  = isReady ? 'READY' : 'FIGHT!'
    const color = isReady ? '#ffdd00' : '#ff2200'

    ctx.save()
    ctx.globalAlpha  = alpha
    ctx.font         = `bold italic ${RF_SZ}px serif`
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor  = '#000'
    ctx.shadowBlur   = 20
    ctx.lineWidth    = Math.max(3, Math.floor(RF_SZ * 0.08))
    ctx.strokeStyle  = '#000'
    ctx.strokeText(text, W / 2, centerY)
    ctx.fillStyle = color
    ctx.fillText(text, W / 2, centerY)
    ctx.restore()
  }
}

// ── Utilitaire : temps vidéo → ms dans la sortie compilée ────────────────────
function videoTimeToOutputMs (videoTime, cuts) {
  let acc = 0
  for (const cut of cuts) {
    if (videoTime >= cut.start && videoTime <= cut.end)
      return Math.round((acc + (videoTime - cut.start)) * 1000)
    acc += cut.end - cut.start
  }
  return -1
}

// ── Main compiler ─────────────────────────────────────────────────────────────
async function compileProject (project, videoPath, outputPath, fightActors = [], onProgress) {
  const dataPath   = process.env.DATA_PATH || path.join(__dirname, '../../../../data')
  const soundPaths = ensureSounds(dataPath)

  const { width, height, fps, duration } = await getVideoInfo(videoPath)

  // ── Pré-chargement des photos des acteurs ─────────────────────────────────
  const actorData = {}
  for (const player of project.players || []) {
    const actor = findFightActor(player, fightActors)
    let img = null
    if (actor?.photo) {
      try { img = await loadImage(actor.photo) } catch (e) {
        console.warn(`[compiler] Photo non chargée pour ${player.name}:`, e.message)
      }
    }
    actorData[player.id] = { img, actorName: actor?.name ?? null }
  }

  const cuts = (project.cuts?.length)
    ? project.cuts.map(c => ({ start: Number(c.start), end: Number(c.end) }))
    : [{ start: 0, end: duration }]

  console.log(`[compiler] ${cuts.length} coupe(s):`, JSON.stringify(cuts))

  const totalDuration = cuts.reduce((s, c) => s + (c.end - c.start), 0)
  const totalFrames   = Math.ceil(totalDuration * fps)

  // ── Timing des sons ───────────────────────────────────────────────────────
  const allEvts      = project.events || []
  const readyEvt     = allEvts.find(e => e.type === 'ready')
  const lifebarEvt   = allEvts.find(e => e.type === 'lifebar')
  const readyVideoTime   = readyEvt   ? readyEvt.time   : null
  const lifebarVideoTime = lifebarEvt ? lifebarEvt.time : null

  const rawReadyMs = readyVideoTime !== null ? videoTimeToOutputMs(readyVideoTime, cuts) : -1
  const readyMs    = rawReadyMs >= 0 ? rawReadyMs : 1000
  const fightMs    = readyMs + 1000

  // Son de fin (KO/DRAW/DEATH/SURRENDER) calé sur le marqueur event
  const OUTCOME_TYPES = new Set(['ko', 'draw', 'death', 'surrender'])
  const outcomeEvt  = [...allEvts].filter(e => OUTCOME_TYPES.has(e.type)).sort((a, b) => b.time - a.time)[0]
  const outcomeMs   = outcomeEvt
    ? Math.max(0, videoTimeToOutputMs(outcomeEvt.time, cuts))
    : -1
  const hasOutcome  = outcomeMs >= 0
  const OUTCOME_SOUND = { ko: 'ko', draw: 'draw', death: 'death', surrender: 'surrender' }
  const outcomePath = outcomeEvt ? (soundPaths[OUTCOME_SOUND[outcomeEvt.type]] ?? soundPaths.ko) : soundPaths.ko

  // ── Announce events (son acteur + wins) ──────────────────────────────────
  const announceAudio = []
  for (const evt of allEvts.filter(e => e.type === 'announce')) {
    const player = (project.players || []).find(p => p.id === evt.target)
    console.log(`[announce] evt.target=${evt.target} player=${player?.name ?? 'NOT FOUND'}`)
    if (!player) continue
    const actor = findFightActor(player, fightActors)
    console.log(`[announce] actor=${actor?.name ?? 'NOT FOUND'} soundUrl=${actor?.soundUrl ?? 'NONE'}`)
    if (!actor?.soundUrl) continue
    const actorFilePath = path.join(dataPath, actor.soundUrl.replace(/^\/media\//, ''))
    console.log(`[announce] actorFilePath=${actorFilePath} exists=${fs.existsSync(actorFilePath)}`)
    if (!fs.existsSync(actorFilePath)) continue
    const actorMs = Math.max(0, videoTimeToOutputMs(evt.time, cuts))
    announceAudio.push({ actorPath: actorFilePath, actorMs, winsMs: actorMs + 1500 })
    console.log(`[announce] OK — actorMs=${actorMs} winsMs=${actorMs + 1500}`)
  }
  console.log(`[announce] ${announceAudio.length} announce(s) à mixer`)

  // ── Build dynamic sound input list (inputs 0=video, 1=pipe, 2+=sons) ────
  const soundDefs = []
  soundDefs.push({ path: soundPaths.ready, delayMs: readyMs,  label: 'readya'  })
  soundDefs.push({ path: soundPaths.fight, delayMs: fightMs,  label: 'fighta'  })
  if (hasOutcome) soundDefs.push({ path: outcomePath, delayMs: outcomeMs, label: 'outcomea' })
  announceAudio.forEach((a, i) => {
    soundDefs.push({ path: a.actorPath,       delayMs: a.actorMs, label: `ann_actor${i}a` })
    soundDefs.push({ path: soundPaths.wins,   delayMs: a.winsMs,  label: `ann_wins${i}a`  })
  })

  const soundInputArgs = soundDefs.flatMap(d => ['-i', d.path])

  // ── Build filter_complex ──────────────────────────────────────────────────
  const buildAudioMix = (mainLabel) => {
    const firstIdx = 2
    const filters  = soundDefs.map((d, i) => `[${firstIdx + i}:a]volume=5.0,adelay=${d.delayMs}:all=1[${d.label}]`)
    const labels   = soundDefs.map(d => `[${d.label}]`).join('')
    filters.push(`[${mainLabel}]${labels}amix=inputs=${1 + soundDefs.length}:duration=first:normalize=0[outa]`)
    return filters.join(';')
  }

  let filterComplex
  let mapAudio

  if (cuts.length === 1) {
    const { start, end } = cuts[0]
    filterComplex = [
      `[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[trimv]`,
      `[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[trima]`,
      buildAudioMix('trima'),
      `[trimv][1:v]overlay=0:0[outv]`
    ].join(';')
    mapAudio = '[outa]'
  } else {
    const parts = cuts.map((c, i) =>
      `[0:v]trim=start=${c.start}:end=${c.end},setpts=PTS-STARTPTS[v${i}];` +
      `[0:a]atrim=start=${c.start}:end=${c.end},asetpts=PTS-STARTPTS[a${i}]`
    ).join(';')
    const concatIn = cuts.map((_, i) => `[v${i}][a${i}]`).join('')
    filterComplex  = [
      parts,
      `${concatIn}concat=n=${cuts.length}:v=1:a=1[concatv][concata]`,
      buildAudioMix('concata'),
      `[concatv][1:v]overlay=0:0[outv]`
    ].join(';')
    mapAudio = '[outa]'
  }

  // ── Spawn ffmpeg ──────────────────────────────────────────────────────────
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  const args = [
    '-y',
    '-i', videoPath,
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', String(fps), '-i', 'pipe:0',
    ...soundInputArgs,
    '-filter_complex', filterComplex,
    '-map', '[outv]', '-map', mapAudio,
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
    '-c:a', 'aac', '-movflags', '+faststart',
    outputPath
  ]

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] })

    let errOut = ''
    proc.stderr.on('data', d => { errOut += d })
    proc.on('error', reject)
    proc.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited ${code}: ${errOut.slice(-500)}`))
    })

    // ── Stream canvas overlay frames ────────────────────────────────────────
    const canvas = createCanvas(width, height)
    const ctx    = canvas.getContext('2d')
    let   frame  = 0

    function writeNext () {
      if (frame >= totalFrames) { proc.stdin.end(); return }

      const elapsed = frame / fps
      let   actual  = cuts[0].start
      let   acc     = 0
      for (const cut of cuts) {
        const seg = cut.end - cut.start
        if (elapsed <= acc + seg) { actual = cut.start + (elapsed - acc); break }
        acc += seg
      }

      renderFrame(ctx, actual, elapsed, project, width, height, readyVideoTime, lifebarVideoTime, actorData)

      const imgData = ctx.getImageData(0, 0, width, height)
      const buf     = Buffer.from(imgData.data.buffer)

      frame++
      if (onProgress) {
        const pct = Math.floor((frame / totalFrames) * 100)
        if (pct !== writeNext._lastPct) { writeNext._lastPct = pct; onProgress(pct) }
      }
      const ok = proc.stdin.write(buf)
      if (ok) setImmediate(writeNext)
      else proc.stdin.once('drain', writeNext)
    }

    writeNext()
  })
}

module.exports = { compileProject, getVideoInfo }
