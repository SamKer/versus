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

// ── Animation helpers ─────────────────────────────────────────────────────────
const ANIM_DURATION = 0.25   // secondes pour la transition HP
const SHAKE_DURATION = 0.4   // secondes de vibration

function getAnimatedHp (time, events, playerId) {
  let hp = 100
  const hits = (events || [])
    .filter(e => e.target === playerId && e.type !== 'ko' && e.time <= time)
    .sort((a, b) => a.time - b.time)
  for (const e of hits) {
    const progress = Math.min(1, (time - e.time) / ANIM_DURATION)
    hp = Math.max(0, hp - e.damage * progress)
  }
  // KO : fade vers 0 sur ANIM_DURATION
  const kos = (events || []).filter(e => e.target === playerId && e.type === 'ko' && e.time <= time)
  if (kos.length > 0) {
    const koTime = Math.max(...kos.map(k => k.time))
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

// ── SF2 health bar renderer ───────────────────────────────────────────────────
function renderFrame (ctx, time, project, w, h) {
  ctx.clearRect(0, 0, w, h)

  if (!project.players?.length) return

  // HP animée (transition fluide) + vibration
  const hp = {}
  const shake = {}
  project.players.forEach(p => {
    hp[p.id]    = getAnimatedHp(time, project.events, p.id)
    shake[p.id] = getShakeOffset(time, project.events, p.id)
  })

  drawHUD(ctx, w, h, project.players, hp, shake)
}

function drawHUD (ctx, W, H, players, hp, shakeOffsets = {}) {
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

    // Nom sous la barre (tronqué si trop long)
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

    ctx.restore()   // restore shake translation
  })

  // "Versus" centré, style script, légèrement incliné
  const VS_SZ = Math.max(18, Math.floor(H * 0.038))
  ctx.save()
  ctx.translate(W / 2, MY + Math.floor(BAR_H / 2))
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
}

// ── Main compiler ─────────────────────────────────────────────────────────────
async function compileProject (project, videoPath, outputPath, onProgress) {
  // Debug: vérifier l'association players ↔ events
  console.log('[compiler] Players:')
  ;(project.players || []).forEach(p => console.log(`  [${p.side}] ${p.name} → id=${p.id}`))
  console.log('[compiler] Events (target = qui reçoit le coup):')
  ;(project.events || []).slice(0, 10).forEach(e => {
    const tgt = (project.players || []).find(p => p.id === e.target)
    console.log(`  t=${e.time.toFixed(2)}s  type=${e.type}  dmg=${e.damage}  target=${tgt?.name ?? '???'} (${e.target.slice(0,8)})`)
  })
  const { width, height, fps, duration } = await getVideoInfo(videoPath)

  const cuts = (project.cuts?.length)
    ? project.cuts.map(c => ({ start: Number(c.start), end: Number(c.end) }))
    : [{ start: 0, end: duration }]

  console.log(`[compiler] ${cuts.length} coupe(s):`, JSON.stringify(cuts))

  const totalDuration = cuts.reduce((s, c) => s + (c.end - c.start), 0)
  const totalFrames   = Math.ceil(totalDuration * fps)

  // ── Build filter_complex ──────────────────────────────────────────────────
  let filterComplex
  let mapAudio

  if (cuts.length === 1) {
    const { start, end } = cuts[0]
    filterComplex = [
      `[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[trimv]`,
      `[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[trima]`,
      `[trimv][1:v]overlay=0:0[outv]`
    ].join(';')
    mapAudio = '[trima]'
  } else {
    const parts = cuts.map((c, i) =>
      `[0:v]trim=start=${c.start}:end=${c.end},setpts=PTS-STARTPTS[v${i}];` +
      `[0:a]atrim=start=${c.start}:end=${c.end},asetpts=PTS-STARTPTS[a${i}]`
    ).join(';')
    const concatIn = cuts.map((_, i) => `[v${i}][a${i}]`).join('')
    filterComplex  = `${parts};${concatIn}concat=n=${cuts.length}:v=1:a=1[concatv][concata];[concatv][1:v]overlay=0:0[outv]`
    mapAudio       = '[concata]'
  }

  // ── Spawn ffmpeg ──────────────────────────────────────────────────────────
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  const args = [
    '-y',
    '-i', videoPath,
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', String(fps), '-i', 'pipe:0',
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

      renderFrame(ctx, actual, project, width, height)

      // getImageData → RGBA buffer
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
