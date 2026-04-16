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

// ── SF2 health bar renderer ───────────────────────────────────────────────────
function renderFrame (ctx, time, project, w, h) {
  ctx.clearRect(0, 0, w, h)

  if (!project.players?.length) return

  // Compute HP
  const hp = {}
  project.players.forEach(p => { hp[p.id] = 100 })
  ;(project.events || [])
    .filter(e => e.time <= time && e.type === 'hit')
    .sort((a, b) => a.time - b.time)
    .forEach(e => { hp[e.target] = Math.max(0, (hp[e.target] ?? 100) - e.damage) })
  ;(project.events || [])
    .filter(e => e.time <= time && e.type === 'ko')
    .forEach(e => { hp[e.target] = 0 })

  drawHUD(ctx, w, h, project.players, hp)
}

function drawHUD (ctx, W, H, players, hp) {
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

    // Bordure noire
    ctx.fillStyle = '#000'
    ctx.fillRect(x - BORDER, MY - BORDER, BAR_W + BORDER * 2, BAR_H + BORDER * 2)

    // Fond sombre
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(x - 1, MY - 1, BAR_W + 2, BAR_H + 2)

    // Zone vide
    ctx.fillStyle = '#5a0000'
    ctx.fillRect(x, MY, BAR_W, BAR_H)

    // Zone remplie
    if (fillW > 0) {
      const fillColor = pct > 0.6 ? '#7ce830' : pct > 0.3 ? '#f5d000' : '#e01000'
      const fillX = isLeft ? x : x + BAR_W - fillW
      ctx.fillStyle = fillColor
      ctx.fillRect(fillX, MY, fillW, BAR_H)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fillRect(fillX, MY, fillW, Math.floor(BAR_H * 0.35))
    }

    // Contour intérieur
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth   = 1
    ctx.strokeRect(x + 0.5, MY + 0.5, BAR_W - 1, BAR_H - 1)

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
