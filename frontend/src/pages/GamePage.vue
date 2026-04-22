<template>
  <div class="game-wrap">

    <!-- ─── SCREEN 1 : START ──────────────────────────────────── -->
    <div v-show="screen === 'start'" class="screen screen-start">
      <div class="dark-overlay" />
      <div class="scanlines" />
      <button class="btn-corner pixel-text" @click="goHome">◄ BACK</button>
      <div class="start-center">
        <h1 class="game-title pixel-text">VERSUS</h1>
        <p class="game-sub pixel-text">ALL FIGHTS LOOK LIKE STREET FIGHTER</p>
        <button class="btn-start pixel-text" @click="goToSelect">▶ START</button>
      </div>
      <div class="start-footer pixel-text">INSERT COIN</div>
    </div>

    <!-- ─── SCREEN 2 : SELECT FIGHTER ───────────────────────────── -->
    <div v-show="screen === 'select'" class="screen screen-select">

      <!-- Header -->
      <div class="select-header">
        <button class="btn-corner pixel-text" @click="backFromSelect">◄ BACK</button>
<div class="mode-tabs">
          <button
            v-for="m in modes" :key="m.value"
            class="mode-btn pixel-text"
            :class="{ active: mode === m.value }"
            @click="setMode(m.value)"
          >{{ m.label }}</button>
        </div>
      </div>

      <!-- Arena: P1 | centre | P2 -->
      <div class="arena">

        <!-- Portrait P1 -->
        <div class="portrait-zone portrait-p1">
          <template v-if="p1Display">
            <img
              v-if="p1Display.photo"
              :src="largePhoto(p1Display.photo)"
              :alt="p1Display.name"
              class="portrait-img portrait-img-p1"
            />
            <div v-else class="portrait-empty pixel-text">?</div>
            <div class="portrait-label pixel-text p1-label">{{ p1Display.name }}</div>
          </template>
          <div v-else class="portrait-slot">
            <span class="slot-num pixel-text">P1</span>
          </div>
        </div>

        <!-- Centre -->
        <div class="arena-center">
          <template v-if="fighter1 && fighter2 && currentFight">
            <div class="vs-vs pixel-text">VS</div>
            <button class="btn-fight pixel-text" @click="goToFight">⚔ FIGHT!</button>
            <img
              v-if="currentFight.moviePoster"
              :src="currentFight.moviePoster"
              :alt="currentFight.movieTitle"
              class="movie-poster"
            />
          </template>

          <div v-if="noFightFound" class="no-fight pixel-text">NO MATCH</div>
        </div>

        <!-- Portrait P2 -->
        <div class="portrait-zone portrait-p2">
          <template v-if="p2Display">
            <img
              v-if="p2Display.photo"
              :src="largePhoto(p2Display.photo)"
              :alt="p2Display.name"
              class="portrait-img portrait-img-p2"
            />
            <div v-else class="portrait-empty pixel-text">?</div>
            <div class="portrait-label pixel-text p2-label">{{ p2Display.name }}</div>
          </template>
          <div v-else-if="fighter1" class="portrait-slot">
            <span class="slot-num pixel-text">P2</span>
          </div>
        </div>
      </div>

      <!-- Strip bas : acteurs (screen P1) OU scènes (screen P2) -->
      <div class="actor-strip-wrap">
        <div v-if="actorsLoading" class="loading-pixel pixel-text">LOADING...</div>

        <!-- Choix P1 : liste de tous les acteurs -->
        <div v-else-if="!fighter1" class="actor-strip">
          <div
            v-for="actor in allActors"
            :key="actor._id"
            class="actor-tile"
            @mouseenter="hoverActor = actor"
            @mouseleave="hoverActor = null"
            @click="selectP1(actor)"
          >
            <div class="actor-thumb-wrap">
              <img v-if="actor.photo" :src="actor.photo" :alt="actor.name" class="actor-thumb" />
              <div v-else class="actor-thumb actor-no-photo pixel-text">?</div>
            </div>
            <div class="actor-name pixel-text">{{ actor.name }}</div>
          </div>
        </div>

        <!-- Choix P2 : une tuile par scène -->
        <div v-else class="actor-strip">
          <div
            v-for="(option, idx) in fightOptions"
            :key="idx"
            class="actor-tile"
            :class="{ 'selected-p2': currentFight?._id === option.fight._id && fighter2?.name === option.coFighter.name }"
            @mouseenter="hoverOption = option"
            @mouseleave="hoverOption = null"
            @click="selectP2(option)"
          >
            <div class="actor-thumb-wrap">
              <img v-if="option.coFighter.photo" :src="option.coFighter.photo" :alt="option.coFighter.name" class="actor-thumb" />
              <div v-else class="actor-thumb actor-no-photo pixel-text">?</div>
            </div>
            <div class="actor-name pixel-text">{{ option.coFighter.name }}</div>
            <div class="fight-scene-label pixel-text">{{ option.fight.movieTitle }}</div>
            <div class="fight-scene-num pixel-text">SCN {{ idx + 1 }}</div>
          </div>
        </div>
      </div>

    </div>

    <!-- ─── SCREEN 3 : FIGHT VIDEO ────────────────────────────── -->
    <div v-if="screen === 'fight'" class="screen screen-fight">
      <button class="btn-corner pixel-text" @click="screen = 'select'">◄ BACK</button>

      <div v-if="currentFight" class="fight-meta pixel-text">
        {{ currentFight.movieTitle }}<span v-if="currentFight.title"> — {{ currentFight.title }}</span>
      </div>

      <div class="video-wrap">
        <video
          v-if="useExportedVideo && exportedVideoUrl"
          :src="exportedVideoUrl"
          controls autoplay
          class="fight-video"
          @error="useExportedVideo = false"
        />
        <iframe
          v-else-if="currentFight?.youtubeId"
          :src="`https://www.youtube.com/embed/${currentFight.youtubeId}?autoplay=1&rel=0`"
          class="fight-video"
          frameborder="0"
          allow="autoplay; fullscreen"
          allowfullscreen
        />
        <div v-else class="no-video pixel-text">NO VIDEO AVAILABLE</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'
import type { ActorProfile } from 'stores/actors'

const router  = useRouter()
const apiBase = import.meta.env.VITE_API_URL || ''

type Screen = 'start' | 'select' | 'fight'
const screen = ref<Screen>('start')

const modes = [
  { value: '1v1',   label: '1 VS 1' },
  { value: '2v2',   label: '2 VS 2' },
  { value: '1vAll', label: '1 VS ALL' },
]
const mode = ref('1v1')

interface FightOption {
  fight: any
  coFighter: { name: string; photo: string | null; tmdbId?: number }
}

const allActors      = ref<ActorProfile[]>([])
const fightOptions   = ref<FightOption[]>([])
const actorsLoading  = ref(false)
const hoverActor     = ref<ActorProfile | null>(null)
const hoverOption    = ref<FightOption | null>(null)
const fighter1       = ref<ActorProfile | null>(null)
const fighter2       = ref<{ name: string; photo: string | null } | null>(null)
const noFightFound   = ref(false)
const currentFight   = ref<any>(null)
const exportedVideoUrl  = ref<string | null>(null)
const useExportedVideo  = ref(false)

// P1 zone : acteur survolé (avant sélection) ou acteur choisi
const p1Display = computed(() =>
  !fighter1.value ? (hoverActor.value ?? null) : fighter1.value
)

// P2 zone : scène survolée (avant sélection) ou acteur choisi
const p2Display = computed(() => {
  if (fighter2.value) return fighter2.value
  if (hoverOption.value) return hoverOption.value.coFighter
  return null
})

onMounted(async () => {
  actorsLoading.value = true
  try {
    const { data } = await api.get<ActorProfile[]>('/api/actors')
    allActors.value = data
  } finally {
    actorsLoading.value = false
  }
})

function goHome ()     { router.push('/') }
function goToSelect () { screen.value = 'select' }

function backFromSelect () {
  if (fighter1.value) resetSelection()
  else screen.value = 'start'
}

function setMode (v: string) { mode.value = v; resetSelection() }

function resetSelection () {
  fighter1.value = null
  fighter2.value = null
  fightOptions.value = []
  noFightFound.value = false
  currentFight.value = null
  hoverActor.value = null
  hoverOption.value = null
  exportedVideoUrl.value = null
  useExportedVideo.value = false
}

async function selectP1 (actor: ActorProfile) {
  fighter1.value = actor
  actorsLoading.value = true
  try {
    const { data } = await api.get<any[]>(`/api/fights/by-actor/${actor._id}`)
    // Une option par scène : extraire le co-fighter (pas l'acteur P1)
    fightOptions.value = data.flatMap(fight => {
      const others = fight.actors.filter((a: any) =>
        actor.tmdbId ? a.tmdbId !== actor.tmdbId : a.name !== actor.name
      )
      // S'il n'y a pas d'autres acteurs (1vAll solo ?), on prend le premier
      const list = others.length ? others : fight.actors.slice(0, 1)
      return list.map((a: any) => ({ fight, coFighter: { name: a.name, photo: a.photo || null, tmdbId: a.tmdbId } }))
    })
    if (!fightOptions.value.length) noFightFound.value = true
  } finally {
    actorsLoading.value = false
  }
}

function selectP2 (option: FightOption) {
  fighter2.value = option.coFighter
  currentFight.value = option.fight
  noFightFound.value = false
}

async function goToFight () {
  if (!currentFight.value) return
  useExportedVideo.value = false
  exportedVideoUrl.value = null

  try {
    const { data } = await api.get<{ exists: boolean; url: string }>(`/api/projects/${currentFight.value._id}/export-exists`)
    if (data.exists && data.url) {
      exportedVideoUrl.value = `${apiBase}${data.url}`
      useExportedVideo.value = true
    }
  } catch { /* fallback YouTube */ }

  screen.value = 'fight'
}

function largePhoto (url: string | null | undefined): string {
  if (!url) return ''
  return url.replace('/w185/', '/w342/').replace('/w92/', '/w342/').replace('/w500/', '/w342/')
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
</style>

<style scoped>
.pixel-text { font-family: 'Press Start 2P', monospace; }

.game-wrap {
  position: fixed;
  inset: 0;
  background: #000;
  overflow: hidden;
  color: #fff;
}

/* ── Forcer le mode paysage sur mobile portrait ─────────────── */
@media (orientation: portrait) and (max-width: 1024px) {
  .game-wrap {
    /* Dimensions inversées : largeur = hauteur écran, hauteur = largeur écran */
    width: 100vh;
    height: 100vw;
    /* Centrage : compense la différence vw/vh */
    top: calc((100vh - 100vw) / 2);
    left: calc((100vw - 100vh) / 2);
    right: auto;
    bottom: auto;
    /* Rotation 90° sens horaire */
    transform: rotate(90deg);
    transform-origin: center center;
  }
}

.screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

/* ═══════════════ SCREEN 1 — START ═══════════════ */
.screen-start {
  background-image: url('/bg-game.webp');
  background-size: cover;
  background-position: center;
  justify-content: center;
  align-items: center;
}

.dark-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.52);
  z-index: 1;
}

.scanlines {
  position: absolute; inset: 0;
  z-index: 2; pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px, transparent 3px,
    rgba(0,0,0,.18) 3px, rgba(0,0,0,.18) 4px
  );
}

.start-center {
  position: relative; z-index: 3;
  display: flex; flex-direction: column;
  align-items: center; gap: 36px;
  text-align: center; padding: 24px;
}

.game-title {
  font-size: clamp(2.4rem, 9vw, 5.5rem);
  color: #f0c010;
  text-shadow: 5px 5px 0 #8b0000, 10px 10px 0 #3a0000;
  letter-spacing: .12em; margin: 0;
}

.game-sub {
  font-size: clamp(.35rem, 1.4vw, .65rem);
  color: #aaa; letter-spacing: .06em; margin: 0;
}

.btn-start {
  background: transparent;
  border: 3px solid #f0c010;
  color: #f0c010;
  padding: 18px 48px;
  font-size: clamp(.75rem, 2.5vw, 1.1rem);
  cursor: pointer;
  text-shadow: 2px 2px 0 #8b0000;
  animation: blink-btn 1.2s step-end infinite;
  font-family: 'Press Start 2P', monospace;
}
.btn-start:hover { background: rgba(240,192,16,.15); animation: none; }

@keyframes blink-btn {
  0%,49%  { opacity: 1; }
  50%,100%{ opacity: 0; }
}

.start-footer {
  position: absolute; bottom: 28px; left: 0; right: 0;
  text-align: center; font-size: .45rem; color: #444; z-index: 3;
  animation: blink-btn 2s step-end infinite;
}

/* ── bouton retour (tous écrans) ─────────────── */
.btn-corner {
  position: absolute; top: 14px; left: 14px; z-index: 10;
  background: rgba(0,0,0,.8); border: 2px solid #555; color: #aaa;
  padding: 8px 14px; font-size: .42rem; cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  transition: border-color .1s, color .1s;
}
.btn-corner:hover { border-color: #f0c010; color: #f0c010; }

/* ═══════════════ SCREEN 2 — SELECT ══════════════ */
.screen-select {
  background-image: url('/bg-select.jpg');
  background-size: cover;
  background-position: center;
}

.select-header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 60px 12px; border-bottom: 2px solid #1a1a2e;
  flex-shrink: 0; flex-wrap: wrap; min-height: 52px;
  background: transparent;
}


.mode-tabs { display: flex; gap: 6px; margin-left: auto; }

.mode-btn {
  background: rgba(0,0,0,.65); border: 2px solid #555; color: #aaa;
  padding: 6px 10px; font-size: .36rem; cursor: pointer;
  font-family: 'Press Start 2P', monospace;
  transition: border-color .1s, color .1s;
}
.mode-btn.active { border-color: #f0c010; color: #f0c010; background: rgba(0,0,0,.8); }
.mode-btn:hover  { border-color: #ccc; color: #ccc; }

/* Arena */
.arena {
  flex: 1; display: flex; min-height: 0; overflow: hidden;
}

.portrait-zone {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: flex-end;
  padding-bottom: 8px; overflow: hidden; position: relative;
}

.portrait-zone::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0;
  height: 40%; pointer-events: none;
}
.portrait-p1::after { background: linear-gradient(to top, rgba(180,0,0,.2), transparent); }
.portrait-p2::after { background: linear-gradient(to top, rgba(0,40,180,.2), transparent); }

.portrait-img {
  max-height: 100%; max-width: 100%;
  object-fit: contain; object-position: bottom;
}
.portrait-img-p2 { transform: scaleX(-1); }

.portrait-label {
  font-size: clamp(.55rem, 1.6vw, 1rem); text-align: center;
  padding: 6px 8px 0;
  position: absolute; bottom: 10px; left: 0; right: 0; z-index: 2;
}
.p1-label { color: #ff7070; text-shadow: 1px 1px 0 #8b0000; }
.p2-label { color: #7090ff; text-shadow: 1px 1px 0 #00008b; }

.portrait-slot {
  display: flex; align-items: center; justify-content: center;
  height: 100%; width: 100%; opacity: .15;
}
.slot-num { font-size: clamp(2rem, 6vw, 4rem); color: #fff; }

.portrait-empty { font-size: 3rem; color: #333; }

/* Centre arena */
.arena-center {
  flex: 0 0 clamp(110px, 16vw, 200px);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px; padding: 12px;
}

.vs-vs {
  font-size: clamp(1rem, 3.5vw, 2rem);
  color: #f0c010; text-shadow: 3px 3px 0 #8b0000;
}

.btn-fight {
  background: #5a0000; border: 3px solid #f03838; color: #ff7070;
  padding: clamp(10px,2vh,16px) clamp(14px,2.5vw,28px);
  font-size: clamp(.5rem, 1.6vw, .85rem);
  cursor: pointer; font-family: 'Press Start 2P', monospace;
  white-space: nowrap;
  animation: pulse-fight 1s ease-in-out infinite alternate;
}
.btn-fight:hover { background: #8b0000; animation: none; box-shadow: 0 0 28px #f03838; }

@keyframes pulse-fight {
  from { box-shadow: 0 0 8px #f03838; }
  to   { box-shadow: 0 0 28px #f03838, 0 0 56px #5a0000; }
}

.no-fight { font-size: .35rem; color: #f03838; text-align: center; }

.movie-poster {
  width: clamp(100px, 14vw, 180px);
  border: 2px solid rgba(255,255,255,.3);
  box-shadow: 0 0 12px rgba(0,0,0,.6);
  margin-top: 4px;
}

/* Strip bas */
.actor-strip-wrap {
  flex-shrink: 0;
  height: clamp(115px, 21vh, 160px);
  background: transparent;
  border-top: 2px solid rgba(255,255,255,.1);
  display: flex; align-items: center;
  padding: 0 8px;
}

.loading-pixel {
  width: 100%; text-align: center; color: #555; font-size: .5rem;
  animation: blink-btn 1s step-end infinite;
}

.actor-strip {
  display: flex; gap: 8px; overflow-x: auto;
  padding: 8px 4px; align-items: flex-end; width: 100%;
}
.actor-strip::-webkit-scrollbar { height: 4px; }
.actor-strip::-webkit-scrollbar-track { background: #111; }
.actor-strip::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

.actor-tile {
  flex-shrink: 0; display: flex; flex-direction: column;
  align-items: center; gap: 3px; cursor: pointer;
  border: 2px solid transparent; padding: 3px; width: 86px;
  transition: border-color .1s, box-shadow .1s;
}
.actor-tile:hover  { border-color: #fff; }
.actor-tile.selected-p2 {
  border-color: #3880f0 !important;
  box-shadow: 0 0 10px rgba(56,128,240,.7);
}

.actor-thumb-wrap { width: 80px; height: 100px; overflow: hidden; flex-shrink: 0; }
.actor-thumb {
  width: 100%; height: 100%;
  object-fit: cover; object-position: top; display: block;
}
.actor-no-photo {
  display: flex; align-items: center; justify-content: center;
  background: #1a1a2e; color: #333; font-size: 1rem;
}

.actor-name {
  font-size: .32rem; text-align: center; color: #eee;
  line-height: 1.5; word-break: break-word; max-width: 80px;
}

.fight-scene-label {
  font-size: .2rem; text-align: center;
  color: #888; line-height: 1.3; max-width: 80px;
  word-break: break-word;
}

.fight-scene-num {
  font-size: .2rem; color: #f0c010; text-align: center;
}

/* ═══════════════ SCREEN 3 — VIDEO ═══════════════ */
.screen-fight {
  background: #000; align-items: center; justify-content: center;
}

.fight-meta {
  position: absolute; top: 52px; left: 0; right: 0;
  text-align: center; font-size: .38rem; color: #555;
  z-index: 5; padding: 0 80px;
}

.video-wrap {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
}
.fight-video {
  width: 100%; height: 100%; max-height: 100vh; object-fit: contain;
}
.no-video { font-size: .55rem; color: #444; }
</style>
