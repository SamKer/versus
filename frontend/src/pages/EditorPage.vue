<template>
  <q-page class="editor-page bg-dark">

    <!-- ══ Header ══ -->
    <div class="editor-header row items-center q-px-md q-py-sm bg-grey-10">
      <q-btn flat round dense icon="arrow_back" color="grey" @click="$router.back()" />
      <div class="q-ml-sm text-subtitle1 text-bold ellipsis">
        {{ fight?.title || fight?.movieTitle || 'Éditeur' }}
      </div>
      <q-space />
      <q-btn flat dense no-caps icon="save" label="Sauvegarder" color="primary" class="q-mr-sm" :loading="saving" @click="saveProject" />
      <q-btn flat dense no-caps icon="movie_creation" label="Compiler" color="positive"
        :loading="exportStatus === 'processing'"
        :disable="exportStatus === 'processing'"
        @click="startExport"
      />
    </div>

    <!-- ══ Main layout ══ -->
    <div class="editor-body row no-wrap">

      <!-- ── Left: video + timeline ── -->
      <div class="col editor-left column">

        <!-- Video + canvas overlay -->
        <div class="video-wrapper" ref="videoWrapper">
          <video
            ref="videoEl"
            :src="videoSrc"
            class="editor-video"
            @loadedmetadata="onVideoLoaded"
            @timeupdate="onTimeUpdate"
            @ended="playing = false"
            preload="metadata"
          />
          <canvas ref="overlayCanvas" class="editor-canvas" />
          <div v-if="!videoSrc" class="video-placeholder column items-center justify-center text-grey">
            <q-icon name="videocam_off" size="64px" />
            <div class="q-mt-sm text-caption">Aucune vidéo locale pour cette scène</div>
          </div>
        </div>

        <!-- Transport -->
        <div class="transport row items-center q-px-md q-py-xs bg-grey-10">
          <q-btn flat round dense :icon="playing ? 'pause' : 'play_arrow'" color="primary" @click="togglePlay" :disable="!videoSrc" />
          <span class="q-mx-sm text-caption text-mono text-grey">{{ fmtTime(currentTime) }} / {{ fmtTime(duration) }}</span>
          <q-slider
            v-model="currentTime" :min="0" :max="duration || 1" :step="0.05"
            class="col q-mx-md" color="primary" track-color="grey-8"
            :disable="!videoSrc"
            @update:model-value="seekTo"
          />
          <q-btn-group flat dense class="q-mr-xs">
            <q-btn flat dense round icon="chevron_left" color="grey" @click="stepFrame(-1)" :disable="!videoSrc" title="Image précédente" />
            <q-btn flat dense round icon="chevron_right" color="grey" @click="stepFrame(1)" :disable="!videoSrc" title="Image suivante" />
          </q-btn-group>
          <q-btn-group flat dense>
            <q-btn flat dense no-caps icon="content_cut" label="Début coupe" color="orange" @click="setCutIn" :disable="!videoSrc" />
            <q-btn flat dense no-caps icon="content_cut" label="Fin coupe" color="orange" @click="setCutOut" :disable="!cutIn || !videoSrc" />
          </q-btn-group>
        </div>

        <!-- Timeline -->
        <div class="timeline-wrapper q-pa-sm bg-grey-10" v-if="duration > 0">
          <div
            class="timeline"
            ref="timelineEl"
            @click="onTimelineClick"
          >
            <!-- Cuts -->
            <div
              v-for="(cut, i) in project.cuts" :key="'cut'+i"
              class="cut-segment"
              :style="{ left: pct(cut.start) + '%', width: (pct(cut.end) - pct(cut.start)) + '%' }"
              :title="`Coupe ${fmtTime(cut.start)} → ${fmtTime(cut.end)} — clic pour supprimer`"
              @click.stop="removeCut(i)"
            />
            <!-- Events -->
            <div
              v-for="ev in project.events" :key="ev.id"
              class="event-marker"
              :style="{ left: pct(ev.time) + '%' }"
              :class="ev.type"
              :title="`${ev.type} → ${playerName(ev.target)} -${ev.damage} (${fmtTime(ev.time)}) — clic pour supprimer`"
              @click.stop="removeEvent(ev.id)"
            />
            <!-- Cursor -->
            <div class="time-cursor" :style="{ left: pct(currentTime) + '%' }" />
            <!-- Cut-in pending -->
            <div v-if="cutIn !== null" class="cut-in-marker" :style="{ left: pct(cutIn) + '%' }" />
          </div>
          <div class="row justify-between text-caption text-grey q-mt-xs">
            <span>0:00</span><span>{{ fmtTime(duration) }}</span>
          </div>
        </div>

      </div>

      <!-- ── Right: panels ── -->
      <div class="editor-sidebar q-pa-sm column q-gutter-sm">

        <!-- Export status -->
        <q-card v-if="exportStatus === 'processing'" dark flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="row items-center q-mb-xs">
              <q-spinner color="positive" size="14px" class="q-mr-xs" />
              <span class="text-caption text-grey-4 col">Compilation en cours… {{ exportProgress }}%</span>
              <q-btn flat dense round icon="close" size="xs" color="grey" @click="cancelExport" />
            </div>
            <q-linear-progress
              :value="exportProgress / 100"
              color="positive"
              track-color="grey-8"
              rounded
              size="10px"
              :animation-speed="300"
            />
          </q-card-section>
        </q-card>
        <q-banner v-if="exportStatus === 'done'" class="bg-positive text-white text-caption" dense rounded>
          <template #avatar><q-icon name="check_circle" /></template>
          Export prêt —
          <a :href="`${apiBase}${exportPath}`" target="_blank" download class="text-white text-bold">Télécharger</a>
        </q-banner>
        <q-banner v-if="exportStatus === 'error'" class="bg-negative text-white text-caption" dense rounded>
          <template #avatar><q-icon name="error" /></template>
          Erreur : {{ exportError }}
        </q-banner>

        <!-- Players -->
        <q-card dark flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="row items-center q-mb-xs">
              <div class="text-caption text-bold text-grey-4">PERSONNAGES</div>
              <q-space />
              <q-btn flat dense round icon="add" size="sm" color="primary" @click="addPlayer" :disable="project.players.length >= 2" />
            </div>
            <div v-for="(player, i) in project.players" :key="player.id" class="row items-center q-gutter-xs q-mb-xs">
              <input type="color" v-model="player.color" class="color-picker" :title="'Couleur ' + player.name" />
              <q-input v-model="player.name" dense dark outlined style="flex:1;min-width:0" input-class="text-caption" />
              <q-btn-toggle
                v-model="player.side"
                dense flat no-caps
                :options="[{value:'left',icon:'align_horizontal_left'},{value:'right',icon:'align_horizontal_right'}]"
                color="grey" toggle-color="primary"
              />
              <q-btn flat dense round icon="delete" size="xs" color="negative" @click="removePlayer(i)" />
            </div>
            <div v-if="!project.players.length" class="text-caption text-grey text-center q-py-xs">
              Aucun personnage
            </div>
          </q-card-section>
        </q-card>

        <!-- Add event -->
        <q-card dark flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-bold text-grey-4 q-mb-xs">AJOUTER UN ÉVÉNEMENT À {{ fmtTime(currentTime) }}</div>
            <div class="row q-gutter-xs items-center">
              <q-select
                v-model="newEvent.type"
                :options="eventTypes" dense dark outlined
                style="width:80px" emit-value map-options
              />
              <q-select
                v-model="newEvent.target"
                :options="playerOptions" dense dark outlined
                style="flex:1;min-width:0" emit-value map-options
                placeholder="Cible"
              />
              <q-input
                v-model.number="newEvent.damage"
                type="number" dense dark outlined
                style="width:56px" suffix="pts"
                :disable="newEvent.type !== 'hit'"
              />
              <q-btn round dense icon="add" color="primary" @click="addEvent" :disable="!newEvent.target" />
            </div>
          </q-card-section>
        </q-card>

        <!-- Events list -->
        <q-card dark flat bordered class="col overflow-auto">
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-bold text-grey-4 q-mb-xs">ÉVÉNEMENTS ({{ project.events.length }})</div>
            <div v-if="!project.events.length" class="text-caption text-grey text-center q-py-xs">Aucun événement</div>
            <div
              v-for="ev in sortedEvents" :key="ev.id"
              class="event-row row items-center q-mb-xs"
              @click="seekTo(ev.time)"
            >
              <q-icon :name="eventIcon(ev.type)" :color="eventColor(ev.type)" size="14px" class="q-mr-xs" />
              <span class="text-caption text-mono text-grey-4" style="width:42px">{{ fmtTime(ev.time) }}</span>
              <span class="text-caption ellipsis col">{{ playerName(ev.target) }}</span>
              <span v-if="ev.type==='hit'" class="text-caption text-orange q-mx-xs">-{{ ev.damage }}pts</span>
              <q-btn flat dense round icon="close" size="xs" color="negative" @click.stop="removeEvent(ev.id)" />
            </div>
          </q-card-section>
        </q-card>

        <!-- Cuts list -->
        <q-card dark flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="text-caption text-bold text-grey-4 q-mb-xs">COUPES ({{ project.cuts.length }})</div>
            <div v-if="!project.cuts.length" class="text-caption text-grey text-center q-py-xs">Toute la vidéo</div>
            <div
              v-for="(cut, i) in project.cuts" :key="i"
              class="row items-center q-mb-xs"
            >
              <q-icon name="content_cut" color="orange" size="14px" class="q-mr-xs" />
              <span class="text-caption text-mono col text-grey-4">{{ fmtTime(cut.start) }} → {{ fmtTime(cut.end) }}</span>
              <q-btn flat dense round icon="close" size="xs" color="negative" @click="removeCut(i)" />
            </div>
          </q-card-section>
        </q-card>

      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

const $q    = useQuasar()
const route = useRoute()
const fightId = route.params.fightId as string
const apiBase = import.meta.env.VITE_API_URL || ''

// ── Fight + video ──────────────────────────────────────────────────────────────
const fight    = ref<any>(null)
const videoSrc = computed(() => {
  if (!fight.value?.videoPath) return ''
  return `${import.meta.env.VITE_API_URL || ''}${fight.value.videoPath}`
})

// ── Project state ──────────────────────────────────────────────────────────────
const project = reactive<{
  players: Array<{ id: string; name: string; color: string; side: 'left' | 'right' }>
  events:  Array<{ id: string; time: number; type: string; target: string; damage: number }>
  cuts:    Array<{ start: number; end: number }>
}>({
  players: [],
  events:  [],
  cuts:    []
})

// ── Video refs ─────────────────────────────────────────────────────────────────
const videoEl      = ref<HTMLVideoElement>()
const overlayCanvas = ref<HTMLCanvasElement>()
const videoWrapper  = ref<HTMLElement>()
const timelineEl    = ref<HTMLElement>()

const duration    = ref(0)
const currentTime = ref(0)
const playing     = ref(false)

let rafId = 0

// ── Cut-in pending ─────────────────────────────────────────────────────────────
const cutIn = ref<number | null>(null)

// ── Export status ──────────────────────────────────────────────────────────────
const exportStatus   = ref<'idle' | 'processing' | 'done' | 'error'>('idle')
const exportPath     = ref('')
const exportError    = ref('')
const exportProgress = ref(0)
let   pollTimer    = 0

// ── New event form ─────────────────────────────────────────────────────────────
const newEvent = reactive({ type: 'hit', target: '', damage: 10 })

const eventTypes = [
  { label: 'Hit',   value: 'hit'   },
  { label: 'Block', value: 'block' },
  { label: 'KO',    value: 'ko'    }
]

const playerOptions = computed(() =>
  project.players.map(p => ({ label: p.name, value: p.id }))
)

// ── Saving ─────────────────────────────────────────────────────────────────────
const saving = ref(false)

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadFight()
  await loadProject()
  rafId = requestAnimationFrame(drawOverlay)
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearInterval(pollTimer)
})

// ── Loaders ────────────────────────────────────────────────────────────────────
async function loadFight () {
  try {
    const { data } = await api.get(`/api/fights/${fightId}`)
    fight.value = data
  } catch { /* ignore */ }
}

async function loadProject () {
  try {
    const { data } = await api.get(`/api/projects/${fightId}`)
    if (data) {
      project.players      = data.players      || []
      project.events       = data.events       || []
      project.cuts         = data.cuts         || []
      exportStatus.value   = data.exportStatus || 'idle'
      exportPath.value     = data.exportPath   || ''
      exportProgress.value = 0
      // Si une compilation était en cours avant le rechargement, reprendre le polling
      if (data.exportStatus === 'processing') pollExport()
    }
    // Pré-remplir les joueurs depuis les acteurs de la scène si aucun joueur défini
    if (!project.players.length && fight.value?.actors?.length) {
      fight.value.actors.slice(0, 2).forEach((actor: any, i: number) => {
        project.players.push({
          id:    crypto.randomUUID(),
          name:  actor.character || actor.name,
          color: i === 0 ? '#00e676' : '#e53935',
          side:  i === 0 ? 'left' : 'right'
        })
      })
    }
  } catch { /* ignore */ }
}

// ── Video events ───────────────────────────────────────────────────────────────
function onVideoLoaded () {
  duration.value = videoEl.value?.duration ?? 0
  resizeCanvas()
}

function onTimeUpdate () {
  if (videoEl.value) currentTime.value = videoEl.value.currentTime
}

function togglePlay () {
  if (!videoEl.value) return
  if (playing.value) { videoEl.value.pause(); playing.value = false }
  else               { videoEl.value.play();  playing.value = true  }
}

function seekTo (t: number) {
  if (!videoEl.value) return
  videoEl.value.currentTime = t
  currentTime.value = t
}

// ── HUD renderer (browser) ────────────────────────────────────────────────────
function drawSF2Bars (
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  players: typeof project.players,
  hp: Record<string, number>
) {
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

// ── Canvas overlay ─────────────────────────────────────────────────────────────
function resizeCanvas () {
  if (!overlayCanvas.value || !videoEl.value) return
  overlayCanvas.value.width  = videoEl.value.clientWidth  || videoEl.value.videoWidth
  overlayCanvas.value.height = videoEl.value.clientHeight || videoEl.value.videoHeight
}

function drawOverlay () {
  rafId = requestAnimationFrame(drawOverlay)
  const canvas = overlayCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!project.players.length) return

  const t = currentTime.value

  // Compute HP
  const hp: Record<string, number> = {}
  project.players.forEach(p => { hp[p.id] = 100 })
  project.events
    .filter(e => e.time <= t && e.type === 'hit')
    .sort((a, b) => a.time - b.time)
    .forEach(e => { hp[e.target] = Math.max(0, (hp[e.target] ?? 100) - e.damage) })
  project.events
    .filter(e => e.time <= t && e.type === 'ko')
    .forEach(e => { hp[e.target] = 0 })

  const W = canvas.width
  const H = canvas.height
  drawSF2Bars(ctx, W, H, project.players, hp)
}

// ── Timeline ───────────────────────────────────────────────────────────────────
function pct (t: number) {
  return duration.value ? (t / duration.value) * 100 : 0
}

function onTimelineClick (e: MouseEvent) {
  const el   = timelineEl.value!
  const rect = el.getBoundingClientRect()
  const t    = ((e.clientX - rect.left) / rect.width) * duration.value
  seekTo(Math.max(0, Math.min(duration.value, t)))
}

// ── Cuts ───────────────────────────────────────────────────────────────────────
function stepFrame (dir: number) {
  if (!videoEl.value) return
  const fps  = 25 // 1 frame ≈ 40 ms à 25 fps
  const step = dir / fps
  seekTo(Math.max(0, Math.min(duration.value, currentTime.value + step)))
}

function setCutIn () {
  cutIn.value = currentTime.value
  $q.notify({ message: `Début de coupe : ${fmtTime(cutIn.value)}`, color: 'orange', timeout: 1500 })
}

function setCutOut () {
  if (cutIn.value === null) return
  if (currentTime.value <= cutIn.value) {
    $q.notify({ type: 'warning', message: 'La fin doit être après le début' })
    return
  }
  project.cuts.push({ start: cutIn.value, end: currentTime.value })
  project.cuts.sort((a, b) => a.start - b.start)
  cutIn.value = null
  $q.notify({ message: 'Coupe ajoutée', color: 'orange', timeout: 1200 })
}

function removeCut (i: number) {
  project.cuts.splice(i, 1)
}

// ── Players ────────────────────────────────────────────────────────────────────
function addPlayer () {
  const side = project.players.length === 0 ? 'left' : 'right'
  project.players.push({
    id:    crypto.randomUUID(),
    name:  `Joueur ${project.players.length + 1}`,
    color: side === 'left' ? '#00e676' : '#e53935',
    side
  })
}

function removePlayer (i: number) {
  const id = project.players[i].id
  project.players.splice(i, 1)
  project.events = project.events.filter(e => e.target !== id)
}

function playerName (id: string) {
  return project.players.find(p => p.id === id)?.name ?? id
}

// ── Events ─────────────────────────────────────────────────────────────────────
const sortedEvents = computed(() =>
  [...project.events].sort((a, b) => a.time - b.time)
)

function addEvent () {
  if (!newEvent.target) return
  project.events.push({
    id:     crypto.randomUUID(),
    time:   Math.round(currentTime.value * 100) / 100,
    type:   newEvent.type,
    target: newEvent.target,
    damage: newEvent.type === 'hit' ? newEvent.damage : 0
  })
}

function removeEvent (id: string) {
  const i = project.events.findIndex(e => e.id === id)
  if (i >= 0) project.events.splice(i, 1)
}

function eventIcon (type: string) {
  return { hit: 'sports_martial_arts', block: 'shield', ko: 'star' }[type] ?? 'circle'
}

function eventColor (type: string) {
  return { hit: 'orange', block: 'cyan', ko: 'yellow' }[type] ?? 'grey'
}

// ── Save / Export ──────────────────────────────────────────────────────────────
async function saveProject () {
  saving.value = true
  try {
    await api.put(`/api/projects/${fightId}`, {
      players: project.players,
      events:  project.events,
      cuts:    project.cuts
    })
    $q.notify({ type: 'positive', message: 'Projet sauvegardé', timeout: 1500 })
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur lors de la sauvegarde' })
  } finally {
    saving.value = false
  }
}

async function cancelExport () {
  clearInterval(pollTimer)
  try {
    await api.delete(`/api/projects/${fightId}/export`)
  } catch { /* ignore */ }
  exportStatus.value   = 'idle'
  exportProgress.value = 0
}

async function startExport () {
  try {
    await saveProject()
    await api.post(`/api/projects/${fightId}/export`)
    exportStatus.value   = 'processing'
    exportProgress.value = 0
    $q.notify({ message: 'Compilation en cours...', color: 'info', timeout: 3000 })
    pollExport()
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.error || 'Erreur export' })
  }
}

function pollExport () {
  clearInterval(pollTimer)
  pollTimer = window.setInterval(async () => {
    try {
      const { data } = await api.get(`/api/projects/${fightId}/export/status`)
      exportStatus.value   = data.status
      exportProgress.value = data.progress ?? 0
      if (data.status === 'done') {
        exportProgress.value = 100
        exportPath.value = data.exportPath
        clearInterval(pollTimer)
        $q.notify({ type: 'positive', message: 'Vidéo compilée !', timeout: 4000 })
      } else if (data.status === 'error') {
        exportError.value = data.error
        clearInterval(pollTimer)
        $q.notify({ type: 'negative', message: 'Erreur de compilation' })
      }
    } catch { /* ignore */ }
  }, 3000)
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtTime (s: number) {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  const ms  = Math.floor((s % 1) * 10)
  return `${m}:${sec}.${ms}`
}

// Resize canvas when video dimensions change
watch(videoSrc, async () => {
  await nextTick()
  resizeCanvas()
})
</script>

<style scoped lang="scss">
.editor-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.editor-header {
  flex-shrink: 0;
  border-bottom: 1px solid #333;
}
.editor-body {
  flex: 1;
  overflow: hidden;
}
.editor-left {
  overflow: hidden;
  min-width: 0;
}
.video-wrapper {
  flex: 1;
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.editor-video {
  max-width: 100%;
  max-height: 100%;
  display: block;
}
.editor-canvas {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}
.video-placeholder {
  position: absolute;
  inset: 0;
}
.transport {
  flex-shrink: 0;
  gap: 4px;
  border-top: 1px solid #333;
}
.text-mono { font-family: monospace; }

.timeline-wrapper {
  flex-shrink: 0;
  border-top: 1px solid #333;
}
.timeline {
  position: relative;
  height: 32px;
  background: #2a2a2a;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
}
.cut-segment {
  position: absolute;
  top: 0; bottom: 0;
  background: rgba(255, 152, 0, 0.25);
  border-left: 2px solid #ff9800;
  border-right: 2px solid #ff9800;
  cursor: pointer;
  &:hover { background: rgba(255, 80, 0, 0.5); }
}
.event-marker {
  position: absolute;
  top: 4px; bottom: 4px;
  width: 6px;
  border-radius: 3px;
  transform: translateX(-50%);
  cursor: pointer;
  &.hit   { background: #ff9800; }
  &.block { background: #00bcd4; }
  &.ko    { background: #ffeb3b; }
  &:hover { filter: brightness(1.6) drop-shadow(0 0 4px currentColor); top: 2px; bottom: 2px; }
}
.time-cursor {
  position: absolute;
  top: 0; bottom: 0;
  width: 2px;
  background: #fff;
  transform: translateX(-50%);
  pointer-events: none;
}
.cut-in-marker {
  position: absolute;
  top: 0; bottom: 0;
  width: 2px;
  background: #ff9800;
  transform: translateX(-50%);
}
.editor-sidebar {
  width: 280px;
  flex-shrink: 0;
  overflow-y: auto;
  border-left: 1px solid #333;
  background: #1a1a1a;
}
.color-picker {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 1px;
  background: transparent;
}
.event-row {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  &:hover { background: rgba(255,255,255,0.05); }
}
</style>
