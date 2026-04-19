const { createCanvas } = require('canvas')
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

function ensureSounds (dataPath) {
  const { execSync } = require('child_process')
  const dir = path.join(dataPath, 'sounds')
  fs.mkdirSync(dir, { recursive: true })
  // v2 = sons formantiques améliorés
  const p = {
    ready: path.join(dir, 'ready_v2.wav'),
    fight: path.join(dir, 'fight_v2.wav'),
    ko:    path.join(dir, 'ko_v2.wav'),
    draw:  path.join(dir, 'draw_v2.wav'),
  }
  const entries = [
    { file: p.ready, text: 'ready', gen: genReady },
    { file: p.fight, text: 'fight', gen: genFight },
    { file: p.ko,    text: 'K. O.', gen: genKo    },
    { file: p.draw,  text: 'draw',  gen: genDraw   },
  ]
  for (const { file, text, gen } of entries) {
    if (!fs.existsSync(file)) {
      let ok = false
      for (const bin of ['espeak-ng', 'espeak']) {
        try {
          execSync(`${bin} -w "${file}" -p 55 -s 115 -a 200 "${text}" 2>/dev/null`, { timeout: 5000 })
          if (fs.existsSync(file) && fs.statSync(file).size > 200) { ok = true; break }
        } catch {}
      }
      if (!ok) fs.writeFileSync(file, gen())
    }
  }
  return p
}

// ── Animation helpers ─────────────────────────────────────────────────────────
const ANIM_DURATION  = 0.25
const SHAKE_DURATION = 0.4

function getAnimatedHp (time, events, playerId) {
  let hp = 100
  const hits = (events || [])
    .filter(e => e.target === playerId && e.type !== 'ko' && e.time <= time)
    .sort((a, b) => a.time - b.time)
  for (const e of hits) {
    const progress = Math.min(1, (time - e.time) / ANIM_DURATION)
    hp = Math.max(0, hp - e.damage * progress)
  }
  const kos = (events || []).filter(e => e.target === playerId && e.type === 'ko' && e.time <= time)
  if (kos.length > 0) {
    const koTime  = Math.max(...kos.map(k => k.time))
    const progress = Math.min(1, (time - koTime) / ANIM_DURATION)
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
function renderFrame (ctx, videoTime, elapsed, project, w, h) {
  ctx.clearRect(0, 0, w, h)
  if (!project.players?.length) return

  const hp    = {}
  const shake = {}
  project.players.forEach(p => {
    hp[p.id]    = getAnimatedHp(videoTime, project.events, p.id)
    shake[p.id] = getShakeOffset(videoTime, project.events, p.id)
  })

  drawHUD(ctx, w, h, project.players, hp, shake, elapsed, project.events, videoTime, project.outcome)
}

function drawHUD (ctx, W, H, players, hp, shakeOffsets = {}, elapsed = -1, events = [], videoTime = 0, outcome = null) {
  const BORDER  = 2
  const BAR_H   = Math.max(14, Math.floor(H * 0.028))
  const BAR_W   = Math.floor(W * 0.42)
  const MX      = 14
  const MY      = 14
  const NAME_SZ = Math.max(11, Math.floor(H * 0.022))

  players.forEach(player => {
    const pct    = Math.max(0, Math.min(1, (hp[player.id] ?? 100) / 100))
    const isLeft = player.side === 'left'
    const x      = isLeft ? MX : W - MX - BAR_W
    const fillW  = Math.floor(BAR_W * pct)
    const shakeX = shakeOffsets[player.id] || 0

    ctx.save()
    ctx.translate(shakeX, 0)

    // Bordure blanche
    ctx.fillStyle = '#fff'
    ctx.fillRect(x - BORDER, MY - BORDER, BAR_W + BORDER * 2, BAR_H + BORDER * 2)

    // Fond jaune (zone vide = vie perdue)
    ctx.fillStyle = '#f5c800'
    ctx.fillRect(x, MY, BAR_W, BAR_H)

    // Barre rouge (vie restante)
    if (fillW > 0) {
      const fillX = isLeft ? x : x + BAR_W - fillW
      ctx.fillStyle = '#e01000'
      ctx.fillRect(fillX, MY, fillW, BAR_H)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fillRect(fillX, MY, fillW, Math.floor(BAR_H * 0.35))
    }

    // Nom sous la barre
    ctx.save()
    ctx.font = `bold ${NAME_SZ}px monospace`
    let name = player.name.toUpperCase()
    while (ctx.measureText(name).width > BAR_W - 4 && name.length > 1)
      name = name.slice(0, -1)
    if (name.length < player.name.length) name += '…'
    ctx.fillStyle     = '#ffe600'
    ctx.shadowColor   = '#000'
    ctx.shadowBlur    = 3
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.textAlign     = isLeft ? 'left' : 'right'
    ctx.fillText(name, isLeft ? x : x + BAR_W, MY + BAR_H + NAME_SZ + 2)
    ctx.restore()

    ctx.restore()
  })

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

  // ── K.O. / DRAW depuis project.outcome ───────────────────────────────────
  if (outcome) {
    const lastEvtTime = events.length > 0 ? Math.max(...events.map(e => e.time)) : 0
    const showAlpha   = Math.min(1, Math.max(0, (videoTime - lastEvtTime - 0.2) / 0.3))
    if (showAlpha > 0) {
      const KO_SZ  = Math.max(20, Math.floor(H * 0.052))
      const koY    = vsY + Math.floor(VS_SZ * 0.5) + KO_SZ * 0.75
      const text   = outcome === 'ko' ? 'K.O.' : 'DRAW'
      const color  = outcome === 'ko' ? '#ff2200' : '#ffffff'
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

  // ── READY / FIGHT! — commence 1s après le début ───────────────────────────
  if (elapsed >= 1.0 && elapsed < 3.0) {
    const isReady  = elapsed < 2.0
    const phase    = isReady ? elapsed - 1.0 : elapsed - 2.0
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
async function compileProject (project, videoPath, outputPath, onProgress) {
  const dataPath   = process.env.DATA_PATH || path.join(__dirname, '../../../../data')
  const soundPaths = ensureSounds(dataPath)

  const { width, height, fps, duration } = await getVideoInfo(videoPath)

  const cuts = (project.cuts?.length)
    ? project.cuts.map(c => ({ start: Number(c.start), end: Number(c.end) }))
    : [{ start: 0, end: duration }]

  console.log(`[compiler] ${cuts.length} coupe(s):`, JSON.stringify(cuts))

  const totalDuration = cuts.reduce((s, c) => s + (c.end - c.start), 0)
  const totalFrames   = Math.ceil(totalDuration * fps)

  // ── Timing des sons ───────────────────────────────────────────────────────
  const readyMs = 1000
  const fightMs = 2000

  // Son de fin (KO ou DRAW) calé sur le dernier événement
  const allEvts    = project.events || []
  const lastEvtTime = allEvts.length > 0 ? Math.max(...allEvts.map(e => e.time)) : -1
  const outcomeMs   = (project.outcome && lastEvtTime >= 0)
    ? Math.max(0, videoTimeToOutputMs(lastEvtTime, cuts) + 200)
    : -1
  const hasOutcome  = outcomeMs >= 0
  const outcomePath = project.outcome === 'draw' ? soundPaths.draw : soundPaths.ko

  // Indices des inputs son dans ffmpeg : 2=ready, 3=fight, [4=outcome]
  const soundInputArgs = [
    '-i', soundPaths.ready,
    '-i', soundPaths.fight,
    ...(hasOutcome ? ['-i', outcomePath] : [])
  ]
  const readyIdx   = 2, fightIdx = 3, outcomeIdx = hasOutcome ? 4 : -1
  const soundCount = hasOutcome ? 3 : 2
  const mixInputs  = 1 + soundCount

  // ── Build filter_complex ──────────────────────────────────────────────────
  const buildAudioMix = (mainLabel) => {
    const parts = [
      `[${readyIdx}:a]volume=5.0,adelay=${readyMs}:all=1[readya]`,
      `[${fightIdx}:a]volume=5.0,adelay=${fightMs}:all=1[fighta]`,
      ...(hasOutcome ? [`[${outcomeIdx}:a]volume=5.0,adelay=${outcomeMs}:all=1[outcomea]`] : []),
      `[${mainLabel}][readya][fighta]${hasOutcome ? '[outcomea]' : ''}amix=inputs=${mixInputs}:duration=first:normalize=0[outa]`
    ]
    return parts.join(';')
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

      renderFrame(ctx, actual, elapsed, project, width, height)

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
