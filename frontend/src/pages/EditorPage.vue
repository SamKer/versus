<template>
  <q-page class="editor-page bg-dark">

    <!-- ══ Header ══ -->
    <div class="editor-header row items-center q-px-md q-py-sm bg-grey-10">
      <q-btn flat round dense icon="arrow_back" color="grey" @click="$router.back()" />
      <div class="q-ml-sm text-subtitle1 text-bold ellipsis">
        {{ fight?.title || fight?.movieTitle || 'Éditeur' }}
      </div>
      <q-space />
      <q-btn flat dense no-caps icon="save" label="Sauvegarder" :color="isDirty ? 'warning' : 'primary'" class="q-mr-sm" :loading="saving" @click="() => saveProject()">
        <q-badge v-if="isDirty" color="negative" floating rounded />
      </q-btn>
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
          <q-btn-group flat dense class="q-mr-xs">
            <q-btn
              v-for="spd in speedOptions" :key="spd"
              flat dense no-caps size="sm"
              :label="spd + 'x'"
              :color="playbackRate === spd ? 'primary' : 'grey'"
              :disable="!videoSrc"
              @click="setSpeed(spd)"
            />
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
              :title="`${eventLabel(ev.type)} → ${playerName(ev.target)}${ev.damage > 0 ? ' -' + ev.damage.toFixed(1) + 'pts' : ''} (${fmtTime(ev.time)}) — clic pour supprimer`"
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

        <!-- ── PERSONNAGES ─────────────────────────────────────────── -->
        <q-card dark flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="row items-center q-mb-xs">
              <div
                class="text-caption text-bold text-grey-4 col cursor-pointer row items-center no-wrap"
                @click="collapsed.players = !collapsed.players"
              >
                <q-icon :name="collapsed.players ? 'chevron_right' : 'expand_more'" size="14px" class="q-mr-xs" />
                PERSONNAGES
              </div>
              <q-btn flat dense round icon="swap_horiz" size="sm" color="grey" title="Inverser A & B" @click.stop="swapPlayers" :disable="project.players.length !== 2" class="q-mr-xs" />
              <q-btn flat dense round icon="add" size="sm" color="primary" @click.stop="addPlayer" :disable="project.players.length >= 2" />
            </div>

            <div v-show="!collapsed.players">
              <div v-for="(player, i) in project.players" :key="player.id" class="q-mb-sm">
                <!-- Identité -->
                <div class="row items-center q-gutter-xs q-mb-xs">
                  <input type="color" v-model="player.color" class="color-picker" :title="'Couleur ' + player.name" />
                  <q-input v-model="player.name" dense dark outlined style="flex:1;min-width:0" input-class="text-caption" />
                  <q-btn-toggle
                    v-model="player.side"
                    dense flat no-caps
                    :options="[{value:'left',icon:'align_horizontal_left'},{value:'right',icon:'align_horizontal_right'}]"
                    color="grey" toggle-color="primary"
                    @update:model-value="scheduleAutoSave"
                  />
                  <q-btn flat dense round icon="delete" size="xs" color="negative" @click="removePlayer(i)" />
                </div>

                <!-- Association acteur -->
                <div v-if="fight?.actors?.length" class="q-mb-xs">
                  <div class="text-caption text-grey-6 q-mb-xs" style="font-size:10px">Acteur associé :</div>
                  <div class="row q-gutter-xs">
                    <div
                      v-for="(actor, ai) in fight.actors"
                      :key="ai"
                      class="actor-chip cursor-pointer"
                      :class="{ 'actor-chip--active': player.actorIndex === ai }"
                      @click="assignActor(player, ai)"
                      :title="`${actor.name}${actor.character ? ' — ' + actor.character : ''}`"
                    >
                      <img v-if="actor.photo" :src="actor.photo" class="actor-chip-img" />
                      <div v-else class="actor-chip-img actor-chip-no-img">?</div>
                      <div class="actor-chip-label">
                        <div class="actor-chip-realname">{{ actor.name }}</div>
                        <div v-if="actor.character" class="actor-chip-char">{{ actor.character }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Vie finale -->
                <div class="row items-center q-gutter-xs">
                  <q-icon name="favorite" size="11px" color="red-4" />
                  <span class="text-caption text-grey-5" style="font-size:10px;white-space:nowrap">Fin :</span>
                  <q-slider
                    v-model.number="player.finalHp"
                    :min="0" :max="100" :step="1"
                    class="col" color="red-5" dense
                    @update:model-value="recomputeDamages"
                  />
                  <span class="text-caption text-grey-4" style="width:32px;text-align:right">{{ player.finalHp }}%</span>
                </div>
              </div>
              <div v-if="!project.players.length" class="text-caption text-grey text-center q-py-xs">
                Aucun personnage
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- ── MARQUEURS HUD ───────────────────────────────────────── -->
        <q-card dark flat bordered>
          <q-card-section class="q-pa-sm">
            <div
              class="text-caption text-bold text-grey-4 q-mb-sm cursor-pointer row items-center no-wrap"
              @click="collapsed.hud = !collapsed.hud"
            >
              <q-icon :name="collapsed.hud ? 'chevron_right' : 'expand_more'" size="14px" class="q-mr-xs" />
              MARQUEURS HUD
            </div>
            <div v-show="!collapsed.hud">
              <!-- Barres de vie -->
              <div class="row items-center q-mb-xs">
                <q-icon name="favorite" color="yellow-6" size="14px" class="q-mr-xs" />
                <span class="text-caption text-grey-4 col">Barres de vie</span>
                <span v-if="lifebarEvent" class="text-caption text-mono text-yellow-6 q-mr-xs">{{ fmtTime(lifebarEvent.time) }}</span>
                <q-btn v-if="lifebarEvent" flat dense round icon="close" size="xs" color="negative" @click="removeEvent(lifebarEvent.id)" />
                <q-btn flat dense round icon="place" size="xs" color="yellow-6" @click="setGlobalEvent('lifebar')" :title="lifebarEvent ? 'Repositionner' : 'Poser ici'" />
              </div>
              <!-- READY -->
              <div class="row items-center q-mb-sm">
                <q-icon name="flag" color="green-5" size="14px" class="q-mr-xs" />
                <span class="text-caption text-grey-4 col">READY</span>
                <span v-if="readyEvent" class="text-caption text-mono text-green-5 q-mr-xs">{{ fmtTime(readyEvent.time) }}</span>
                <q-btn v-if="readyEvent" flat dense round icon="close" size="xs" color="negative" @click="removeEvent(readyEvent.id)" />
                <q-btn flat dense round icon="place" size="xs" color="green-5" @click="setGlobalEvent('ready')" :title="readyEvent ? 'Repositionner' : 'Poser ici'" />
              </div>

              <!-- ── Résultat ── -->
              <div class="text-caption text-grey-7 q-mb-xs" style="font-size:10px;border-top:1px solid #333;padding-top:6px">RÉSULTAT — cliquer un joueur pour poser ici</div>

              <!-- K.O. -->
              <div class="row items-center q-mb-xs">
                <q-icon name="star" color="yellow" size="14px" class="q-mr-xs" />
                <span class="text-caption text-grey-4" style="width:72px;font-size:10px">K.O.</span>
                <div class="row col q-gutter-xs">
                  <q-btn v-for="p in project.players" :key="p.id" flat dense no-caps size="xs"
                    icon="place" :label="p.name.slice(0,8)"
                    :color="koEvent?.target === p.id ? 'yellow' : 'grey-6'"
                    @click="setOutcomeEvent('ko', p.id)" />
                  <span v-if="!project.players.length" class="text-caption text-grey-7 q-pl-xs">—</span>
                </div>
                <span v-if="koEvent" class="text-caption text-mono text-yellow q-mr-xs" style="font-size:10px">{{ fmtTime(koEvent.time) }}</span>
                <q-btn v-if="koEvent" flat dense round icon="close" size="xs" color="negative" @click="removeEvent(koEvent.id)" />
              </div>

              <!-- DRAW -->
              <div class="row items-center q-mb-xs">
                <q-icon name="remove" color="grey-4" size="14px" class="q-mr-xs" />
                <span class="text-caption text-grey-4 col" style="font-size:10px">DRAW</span>
                <span v-if="drawEvent" class="text-caption text-mono text-grey-4 q-mr-xs" style="font-size:10px">{{ fmtTime(drawEvent.time) }}</span>
                <q-btn v-if="drawEvent" flat dense round icon="close" size="xs" color="negative" @click="removeEvent(drawEvent.id)" />
                <q-btn flat dense round icon="place" size="xs" color="grey-4" @click="setOutcomeEvent('draw', '')" :title="drawEvent ? 'Repositionner' : 'Poser ici'" />
              </div>

              <!-- DEATH -->
              <div class="row items-center q-mb-xs">
                <q-icon name="dangerous" color="deep-purple-4" size="14px" class="q-mr-xs" />
                <span class="text-caption text-grey-4" style="width:72px;font-size:10px">DEATH</span>
                <div class="row col q-gutter-xs">
                  <q-btn v-for="p in project.players" :key="p.id" flat dense no-caps size="xs"
                    icon="place" :label="p.name.slice(0,8)"
                    :color="deathEvent?.target === p.id ? 'deep-purple-3' : 'grey-6'"
                    @click="setOutcomeEvent('death', p.id)" />
                  <span v-if="!project.players.length" class="text-caption text-grey-7 q-pl-xs">—</span>
                </div>
                <span v-if="deathEvent" class="text-caption text-mono text-deep-purple-3 q-mr-xs" style="font-size:10px">{{ fmtTime(deathEvent.time) }}</span>
                <q-btn v-if="deathEvent" flat dense round icon="close" size="xs" color="negative" @click="removeEvent(deathEvent.id)" />
              </div>

              <!-- SURRENDER -->
              <div class="row items-center">
                <q-icon name="outlined_flag" color="amber-6" size="14px" class="q-mr-xs" />
                <span class="text-caption text-grey-4" style="width:72px;font-size:10px">SURRENDER</span>
                <div class="row col q-gutter-xs">
                  <q-btn v-for="p in project.players" :key="p.id" flat dense no-caps size="xs"
                    icon="place" :label="p.name.slice(0,8)"
                    :color="surrenderEvent?.target === p.id ? 'amber-6' : 'grey-6'"
                    @click="setOutcomeEvent('surrender', p.id)" />
                  <span v-if="!project.players.length" class="text-caption text-grey-7 q-pl-xs">—</span>
                </div>
                <span v-if="surrenderEvent" class="text-caption text-mono text-amber-6 q-mr-xs" style="font-size:10px">{{ fmtTime(surrenderEvent.time) }}</span>
                <q-btn v-if="surrenderEvent" flat dense round icon="close" size="xs" color="negative" @click="removeEvent(surrenderEvent.id)" />
              </div>

            </div>
          </q-card-section>
        </q-card>

        <!-- ── HITS ───────────────────────────────────────────────── -->
        <q-card dark flat bordered>
          <q-card-section class="q-pa-sm">
            <div
              class="text-caption text-bold text-grey-4 q-mb-sm cursor-pointer row items-center no-wrap"
              @click="collapsed.hits = !collapsed.hits"
            >
              <q-icon :name="collapsed.hits ? 'chevron_right' : 'expand_more'" size="14px" class="q-mr-xs" />
              HITS À {{ fmtTime(currentTime) }}
            </div>
            <div v-show="!collapsed.hits">
              <div v-if="!project.players.length" class="text-caption text-grey text-center q-py-xs">Aucun personnage</div>
              <div v-for="player in project.players" :key="player.id" class="q-mb-sm">
                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-bold" :style="{ color: player.color }">{{ player.name }}</span>
                </div>
                <div class="row q-gutter-xs">
                  <q-btn
                    v-for="btn in hitButtons" :key="btn.type"
                    round dense size="sm"
                    :icon="btn.icon" :color="btn.color" :title="btn.label"
                    @click="addHitEvent(player.id, btn.type)"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- ── ÉVÉNEMENTS ─────────────────────────────────────────── -->
        <q-card dark flat bordered class="col overflow-auto">
          <q-card-section class="q-pa-sm">
            <div
              class="text-caption text-bold text-grey-4 q-mb-xs cursor-pointer row items-center no-wrap"
              @click="collapsed.events = !collapsed.events"
            >
              <q-icon :name="collapsed.events ? 'chevron_right' : 'expand_more'" size="14px" class="q-mr-xs" />
              ÉVÉNEMENTS ({{ project.events.length }})
            </div>
            <div v-show="!collapsed.events">
              <div v-if="!project.events.length" class="text-caption text-grey text-center q-py-xs">Aucun événement</div>
              <div
                v-for="ev in sortedEvents" :key="ev.id"
                class="event-row row items-center q-mb-xs"
                @click="seekTo(ev.time)"
              >
                <q-icon :name="eventIcon(ev.type)" :color="eventColor(ev.type)" size="14px" class="q-mr-xs" />
                <span class="text-caption text-mono text-grey-4" style="width:42px">{{ fmtTime(ev.time) }}</span>
                <span class="text-caption ellipsis col">{{ ev.target ? playerName(ev.target) : eventLabel(ev.type) }}</span>
                <span v-if="ev.damage > 0" class="text-caption text-orange q-mx-xs">-{{ ev.damage.toFixed(1) }}</span>
                <q-btn flat dense round icon="close" size="xs" color="negative" @click.stop="removeEvent(ev.id)" />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- ── COUPES ─────────────────────────────────────────────── -->
        <q-card dark flat bordered>
          <q-card-section class="q-pa-sm">
            <div
              class="text-caption text-bold text-grey-4 q-mb-xs cursor-pointer row items-center no-wrap"
              @click="collapsed.cuts = !collapsed.cuts"
            >
              <q-icon :name="collapsed.cuts ? 'chevron_right' : 'expand_more'" size="14px" class="q-mr-xs" />
              COUPES ({{ project.cuts.length }})
            </div>
            <div v-show="!collapsed.cuts">
              <div v-if="!project.cuts.length" class="text-caption text-grey text-center q-py-xs">Toute la vidéo</div>
              <div v-for="(cut, i) in project.cuts" :key="i" class="row items-center q-mb-xs">
                <q-icon name="content_cut" color="orange" size="14px" class="q-mr-xs" />
                <span class="text-caption text-mono col text-grey-4">{{ fmtTime(cut.start) }} → {{ fmtTime(cut.end) }}</span>
                <q-btn flat dense round icon="close" size="xs" color="negative" @click="removeCut(i)" />
              </div>
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
  players: Array<{ id: string; name: string; color: string; side: 'left' | 'right'; finalHp: number; actorIndex: number | null }>
  events:  Array<{ id: string; time: number; type: string; target: string; damage: number }>
  cuts:    Array<{ start: number; end: number }>
}>({
  players: [],
  events:  [],
  cuts:    [],
})

// ── Video refs ─────────────────────────────────────────────────────────────────
const videoEl       = ref<HTMLVideoElement>()
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

// ── Collapsed sections ────────────────────────────────────────────────────────
const collapsed = reactive({ players: false, hud: false, hits: false, events: false, cuts: false })

// ── Saving / dirty state ───────────────────────────────────────────────────────
const saving  = ref(false)
const isDirty = ref(false)
let   loading = false         // empêche recomputeDamages pendant le chargement initial
let   autoSaveTimer = 0       // debounce auto-save

// ── Animation HP (lerp + shake) ────────────────────────────────────────────────
const animatedHp: Record<string, number> = {}
const shakeTimers: Record<string, number> = {}
let   lastTime = -999

function scheduleAutoSave () {
  isDirty.value = true
  clearTimeout(autoSaveTimer)
  autoSaveTimer = window.setTimeout(() => saveProject(true), 3000)
}

// ── Playback speed ─────────────────────────────────────────────────────────────
const speedOptions  = [0.25, 0.5, 1]
const playbackRate  = ref(1)

function setSpeed (rate: number) {
  playbackRate.value = rate
  if (videoEl.value) videoEl.value.playbackRate = rate
}

// ── Elapsed output time computation ────────────────────────────────────────────
function computeElapsed (videoTime: number, cuts: typeof project.cuts): number {
  if (!cuts || cuts.length === 0) return videoTime
  let acc = 0
  for (const cut of cuts) {
    if (videoTime < cut.start) return -1
    if (videoTime <= cut.end) return acc + (videoTime - cut.start)
    acc += cut.end - cut.start
  }
  return -1
}

// ── Hit buttons ────────────────────────────────────────────────────────────────
// 7 boutons façon manette, dans l'ordre : blocage, poing×2, pied×3, spécial
const hitButtons = [
  { type: 'punch_w', icon: 'sports_mma',          color: 'cyan-3',        label: '1 – Coup de poing faible' },
  { type: 'punch_m', icon: 'sports_mma',          color: 'cyan-6',        label: '2 – Coup de poing moyen' },
  { type: 'punch_s', icon: 'fitness_center',      color: 'cyan-9',        label: '3 – Coup de poing fort' },
  { type: 'kick_w',  icon: 'directions_run',      color: 'lime-5',        label: '4 – Coup de pied faible' },
  { type: 'kick_m',  icon: 'sports_martial_arts', color: 'amber-5',       label: '5 – Coup de pied moyen' },
  { type: 'kick_s',  icon: 'sports_martial_arts', color: 'deep-orange-5', label: '6 – Coup de pied fort' },
  { type: 'special', icon: 'bolt',                color: 'deep-purple-3', label: '7 – Coup spécial' },
]

// Poids des dégâts — symétrie poings / pieds :
//   punch_w = kick_w = 2  ;  punch_m = kick_m = 4  ;  punch_s = kick_s = 8  ;  special = 16
const HIT_WEIGHTS: Record<string, number> = {
  punch_w: 2,
  punch_m: 4,
  punch_s: 8,
  kick_w:  2,
  kick_m:  4,
  kick_s:  8,
  special: 16,
  block:   1,   // rétro-compatibilité
  hit:     2,   // rétro-compatibilité
}

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
  loading = true
  try {
    const { data } = await api.get(`/api/projects/${fightId}`)
    if (data) {
      project.players      = (data.players || []).map((p: any) => ({ finalHp: 0, ...p }))
      project.events       = data.events       || []
      project.cuts         = data.cuts         || []
      exportStatus.value   = data.exportStatus || 'idle'
      exportPath.value     = data.exportPath   || ''
      exportProgress.value = 0
      if (data.exportStatus === 'processing') pollExport()
    }
  } catch { /* ignore */ }

  // Auto-population hors du try : s'exécute même si l'appel API a échoué
  if (!project.players.length && fight.value?.actors?.length) {
    fight.value.actors.slice(0, 2).forEach((actor: any, i: number) => {
      project.players.push({
        id:         crypto.randomUUID(),
        name:       actor.character || actor.name,
        color:      i === 0 ? '#00e676' : '#e53935',
        side:       i === 0 ? 'left' : 'right',
        finalHp:    0,
        actorIndex: i
      })
    })
  }

  // Attendre que Vue ait flushé les watchers avant de libérer le guard
  await nextTick()
  loading = false
  isDirty.value = false   // état propre après chargement
}

// ── Video events ───────────────────────────────────────────────────────────────
function onVideoLoaded () {
  duration.value = videoEl.value?.duration ?? 0
  if (videoEl.value) videoEl.value.playbackRate = playbackRate.value
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
  hp: Record<string, number>,
  shTimers?: Record<string, number>,
  now?: number,
  elapsed?: number,
  events?: typeof project.events,
  videoTime?: number,
  readyVideoTime?: number | null,
  lifebarVideoTime?: number | null
) {
  if (lifebarVideoTime != null && (videoTime ?? 0) < lifebarVideoTime) return
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

    // Vibration horizontale (shake) lors d'un coup
    let shakeX = 0
    if (shTimers && now !== undefined && shTimers[player.id] !== undefined) {
      const elapsed = (now - shTimers[player.id]) / 1000
      if (elapsed < 0.4)
        shakeX = Math.round(6 * Math.sin(elapsed * 50) * Math.exp(-elapsed * 8))
    }

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

  const vsY  = MY + Math.floor(BAR_H / 2)
  const evts = events ?? []
  const vt   = videoTime ?? 0

  // ── K.O. / DRAW / DEATH / SURRENDER depuis les events ────────────────────
  const OUTCOME_TYPES = new Set(['ko', 'draw', 'death', 'surrender'])
  const outcomeEvt = evts.filter(e => OUTCOME_TYPES.has(e.type) && e.time <= vt)
    .sort((a, b) => b.time - a.time)[0]
  if (outcomeEvt) {
    const outcome   = outcomeEvt.type
    const showAlpha = Math.min(1, Math.max(0, (vt - outcomeEvt.time) / 0.3))
    if (showAlpha > 0) {
      const KO_SZ  = Math.max(20, Math.floor(H * 0.052))
      const koY    = vsY + Math.floor(VS_SZ * 0.5) + KO_SZ * 0.75
      const OUTCOME_TEXT:  Record<string,string> = { ko: 'K.O.', draw: 'DRAW', death: 'DEATH', surrender: 'SURRENDER' }
      const OUTCOME_COLOR: Record<string,string> = { ko: '#ff2200', draw: '#ffffff', death: '#9c27b0', surrender: '#ff9800' }
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

  // ── SPECIAL HIT — même ligne que le nom, bout intérieur de la barre ─────
  const recentSpecial = evts
    .filter(e => e.type === 'special' && e.time <= vt && (vt - e.time) < 1.5)
    .sort((a, b) => b.time - a.time)[0]
  if (recentSpecial) {
    const attacker = players.find(p => p.id !== recentSpecial.target)
    if (attacker) {
      const opacity = Math.max(0, 1 - (vt - recentSpecial.time) / 1.5)
      const isLeft  = attacker.side === 'left'
      const barX    = isLeft ? MX : W - MX - BAR_W
      const innerX  = isLeft ? barX + BAR_W : barX   // bout intérieur
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
  }

  // ── READY / FIGHT! — à partir du marqueur ready (ou 1s après le début par défaut) ─
  const el         = elapsed ?? -1
  const vt2        = videoTime ?? 0
  const readyPhase = readyVideoTime != null ? (vt2 - readyVideoTime) : (el - 1.0)
  if (readyPhase >= 0 && readyPhase < 2.0) {
    const isReady  = readyPhase < 1.0
    const phase    = isReady ? readyPhase : readyPhase - 1.0
    let   alpha    = phase < 0.1 ? phase / 0.1 : phase > 0.8 ? (1.0 - phase) / 0.2 : 1.0
    alpha = Math.max(0, Math.min(1, alpha))
    const READY_SZ = Math.max(36, Math.floor(H * 0.07))
    const FIGHT_SZ = Math.max(40, Math.floor(H * 0.09))
    const RF_SZ    = isReady ? READY_SZ : FIGHT_SZ
    const centerY  = vsY + Math.floor(VS_SZ * 0.5) + Math.floor(FIGHT_SZ * 0.65) + 6
    const text     = isReady ? 'READY' : 'FIGHT!'
    const color    = isReady ? '#ffdd00' : '#ff2200'
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

  const t   = currentTime.value
  const now = performance.now()

  // Détecte un seek (saut > 1s) → snap instantané, pas de lerp
  const seeked = Math.abs(t - lastTime) > 1
  lastTime = t

  // HP réelle au timecode courant
  const actualHp: Record<string, number> = {}
  project.players.forEach(p => { actualHp[p.id] = 100 })
  const ZERO_HP = new Set(['ko', 'death', 'surrender'])
  project.events
    .filter(e => e.time <= t && !ZERO_HP.has(e.type))
    .sort((a, b) => a.time - b.time)
    .forEach(e => { actualHp[e.target] = Math.max(0, (actualHp[e.target] ?? 100) - e.damage) })
  project.events
    .filter(e => e.time <= t && ZERO_HP.has(e.type))
    .forEach(e => { actualHp[e.target] = 0 })

  // Lerp animatedHp → actualHp ; déclenche shake si HP diminue
  project.players.forEach(p => {
    const actual = actualHp[p.id]
    if (seeked) {
      animatedHp[p.id] = actual
    } else {
      const prev = animatedHp[p.id] ?? actual
      if (prev - actual > 0.5) shakeTimers[p.id] = now
      animatedHp[p.id] = prev + (actual - prev) * 0.12
    }
  })

  const W       = canvas.width
  const H       = canvas.height
  const elapsed = computeElapsed(t, project.cuts)
  const readyEv   = project.events.find(e => e.type === 'ready')
  const lifebarEv = project.events.find(e => e.type === 'lifebar')
  drawSF2Bars(ctx, W, H, project.players, animatedHp, shakeTimers, now, elapsed, project.events, t,
    readyEv   ? readyEv.time   : null,
    lifebarEv ? lifebarEv.time : null
  )
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
  const fps  = 25
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
  scheduleAutoSave()
}

function removeCut (i: number) {
  project.cuts.splice(i, 1)
  scheduleAutoSave()
}

// ── Players ────────────────────────────────────────────────────────────────────
function addPlayer () {
  const side = project.players.length === 0 ? 'left' : 'right'
  const idx  = project.players.length   // 0 pour le premier, 1 pour le second
  project.players.push({
    id:         crypto.randomUUID(),
    name:       `Joueur ${idx + 1}`,
    color:      side === 'left' ? '#00e676' : '#e53935',
    side,
    finalHp:    0,
    actorIndex: idx
  })
}

function removePlayer (i: number) {
  const id = project.players[i].id
  project.players.splice(i, 1)
  project.events = project.events.filter(e => e.target !== id)
}

function swapPlayers () {
  if (project.players.length !== 2) return
  const [a, b] = project.players
  ;[a.side, b.side]             = [b.side, a.side]
  ;[a.actorIndex, b.actorIndex] = [b.actorIndex, a.actorIndex]
  project.players.reverse()
  scheduleAutoSave()
}

function playerName (id: string) {
  return project.players.find(p => p.id === id)?.name ?? id
}

function setOutcomeEvent (type: string, targetId: string) {
  // Un seul event de ce type (outcome unique), on remplace s'il existe déjà
  const i = project.events.findIndex(e => e.type === type)
  if (i >= 0) project.events.splice(i, 1)
  project.events.push({
    id:     crypto.randomUUID(),
    time:   Math.round(currentTime.value * 100) / 100,
    type,
    target: targetId,
    damage: 0
  })
  scheduleAutoSave()
}

function assignActor (player: typeof project.players[0], ai: number) {
  player.actorIndex = ai
  const actor = fight.value?.actors?.[ai]
  if (actor) player.name = actor.character || actor.name
  scheduleAutoSave()
}

// ── Calcul automatique des dégâts ──────────────────────────────────────────────
// totalDamage = 100 - finalHp, réparti proportionnellement selon HIT_WEIGHTS
function recomputeDamages () {
  if (loading) return
  project.players.forEach(player => {
    const totalDamage = 100 - (player.finalHp ?? 0)
    const hitEvents   = project.events.filter(e =>
      e.target === player.id && !['ko', 'death', 'surrender'].includes(e.type)
    )
    const totalWeight = hitEvents.reduce((sum, e) => sum + (HIT_WEIGHTS[e.type] ?? 0), 0)
    hitEvents.forEach(e => {
      e.damage = totalWeight > 0
        ? Math.round(totalDamage * (HIT_WEIGHTS[e.type] ?? 0) / totalWeight * 100) / 100
        : 0
    })
  })
}

// Recalcul automatique quand un finalHp change
watch(
  () => project.players.map(p => p.finalHp).join(','),
  () => recomputeDamages()
)

// ── Events globaux (marqueurs uniques) ────────────────────────────────────────
const lifebarEvent   = computed(() => project.events.find(e => e.type === 'lifebar')   ?? null)
const readyEvent     = computed(() => project.events.find(e => e.type === 'ready')     ?? null)
const koEvent        = computed(() => project.events.find(e => e.type === 'ko')        ?? null)
const drawEvent      = computed(() => project.events.find(e => e.type === 'draw')      ?? null)
const deathEvent     = computed(() => project.events.find(e => e.type === 'death')     ?? null)
const surrenderEvent = computed(() => project.events.find(e => e.type === 'surrender') ?? null)

function setGlobalEvent (type: 'ready' | 'lifebar') {
  const i = project.events.findIndex(e => e.type === type)
  if (i >= 0) project.events.splice(i, 1)
  project.events.push({
    id:     crypto.randomUUID(),
    time:   Math.round(currentTime.value * 100) / 100,
    type,
    target: '',
    damage: 0
  })
  scheduleAutoSave()
}

// ── Events ─────────────────────────────────────────────────────────────────────
const sortedEvents = computed(() =>
  [...project.events].sort((a, b) => a.time - b.time)
)

function addHitEvent (attackerId: string, type: string) {
  // A frappe → B reçoit
  const target = project.players.find(p => p.id !== attackerId)
  if (!target) return
  project.events.push({
    id:     crypto.randomUUID(),
    time:   Math.round(currentTime.value * 100) / 100,
    type,
    target: target.id,
    damage: 0
  })
  recomputeDamages()
  scheduleAutoSave()
}


function removeEvent (id: string) {
  const i = project.events.findIndex(e => e.id === id)
  if (i >= 0) project.events.splice(i, 1)
  recomputeDamages()
  scheduleAutoSave()
}

function eventIcon (type: string) {
  const map: Record<string, string> = {
    punch_w: 'sports_mma',
    punch_m: 'sports_mma',
    punch_s: 'fitness_center',
    kick_w:  'directions_run',
    kick_m:  'sports_martial_arts',
    kick_s:  'sports_martial_arts',
    special: 'bolt',
    ko:        'star',
    death:     'dangerous',
    surrender: 'outlined_flag',
    block:     'shield',
    hit:     'sports_martial_arts',
    ready:   'flag',
    lifebar: 'favorite',
  }
  return map[type] ?? 'circle'
}

function eventColor (type: string) {
  const map: Record<string, string> = {
    punch_w: 'cyan-3',
    punch_m: 'cyan-6',
    punch_s: 'cyan-9',
    kick_w:  'lime-5',
    kick_m:  'amber-5',
    kick_s:  'deep-orange-5',
    special: 'deep-purple-3',
    ko:        'yellow',
    death:     'deep-purple-4',
    surrender: 'amber-6',
    block:     'grey-5',
    hit:     'orange',
    ready:   'green-5',
    lifebar: 'yellow-6',
  }
  return map[type] ?? 'grey'
}

function eventLabel (type: string) {
  const map: Record<string, string> = {
    punch_w: 'Poing faible',
    punch_m: 'Poing moyen',
    punch_s: 'Poing fort',
    kick_w:  'Pied faible',
    kick_m:  'Pied moyen',
    kick_s:  'Pied fort',
    special: 'Coup spécial',
    ko:        'KO',
    death:     'Death',
    surrender: 'Surrender',
    block:     'Blocage',
    hit:     'Hit',
    ready:   'READY',
    lifebar: 'Barres de vie',
  }
  return map[type] ?? type
}

// ── Save / Export ──────────────────────────────────────────────────────────────
async function saveProject (silent = false) {
  recomputeDamages()
  saving.value = true
  try {
    await api.put(`/api/projects/${fightId}`, {
      players: project.players,
      events:  project.events,
      cuts:    project.cuts,
    })
    isDirty.value = false
    if (!silent) $q.notify({ type: 'positive', message: 'Projet sauvegardé', timeout: 1500 })
  } catch {
    if (!silent) $q.notify({ type: 'negative', message: 'Erreur lors de la sauvegarde' })
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
  &.punch_w { background: #80deea; }
  &.punch_m { background: #26c6da; }
  &.punch_s { background: #00838f; }
  &.kick_w  { background: #aed581; }
  &.kick_m  { background: #ffca28; }
  &.kick_s  { background: #ff7043; }
  &.special { background: #b39ddb; }
  &.ko        { background: #ffeb3b; }
  &.death     { background: #9c27b0; }
  &.surrender { background: #ff9800; }
  // Rétro-compat
  &.block   { background: #78909c; }
  &.hit     { background: #ff9800; }
  // Marqueurs globaux — bande pleine hauteur
  &.ready   { background: #66bb6a; top: 0; bottom: 0; width: 3px; border-radius: 0; }
  &.lifebar { background: #ffd54f; top: 0; bottom: 0; width: 3px; border-radius: 0; }
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
.actor-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60px;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 4px;
  background: #222;
  transition: border-color 0.15s, background 0.15s;
  &:hover { border-color: #888; background: #2a2a2a; }
  &.actor-chip--active { border-color: #00e676; background: rgba(0,230,118,0.12); }
}
.actor-chip-img {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  object-fit: cover;
  display: block;
}
.actor-chip-no-img {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
  color: #666;
  font-size: 18px;
}
.actor-chip-label {
  width: 100%;
  margin-top: 3px;
  text-align: center;
}
.actor-chip-realname {
  font-size: 9px;
  color: #aaa;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.actor-chip-char {
  font-size: 9px;
  color: #e0e0e0;
  font-weight: bold;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
