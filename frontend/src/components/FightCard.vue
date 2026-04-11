<template>
  <q-card class="fight-card bg-dark text-white" flat bordered>

    <!-- Thumbnail + bouton play -->
    <div class="fight-card__thumb cursor-pointer" @click="openVideo">
      <q-img
        :src="fight.thumbnail || 'https://placehold.co/640x360/1a1a1a/555?text=Versus'"
        :ratio="16/9"
      >
        <!-- overlay play -->
        <div class="absolute-full fight-card__overlay flex flex-center">
          <q-icon name="play_circle" size="56px" color="white" style="opacity:.85;filter:drop-shadow(0 2px 6px #000a)" />
        </div>
        <!-- badge vues -->
        <div class="absolute-bottom text-right q-pa-xs">
          <q-badge color="dark" class="text-caption">
            <q-icon name="visibility" size="11px" class="q-mr-xs" />
            {{ formatViews(fight.views) }}
          </q-badge>
        </div>
      </q-img>
    </div>

    <!-- Infos -->
    <q-card-section class="q-pb-xs q-pt-sm">
      <div class="text-subtitle2 text-bold fight-card__title">{{ displayTitle }}</div>
      <div class="text-caption text-grey">{{ fight.movieYear }}</div>
    </q-card-section>

    <!-- Acteurs -->
    <q-card-section class="q-pt-xs q-pb-sm">
      <div class="row items-center q-gutter-x-xs q-gutter-y-xs flex-wrap">
        <template v-for="(actor, i) in fight.actors.slice(0, 3)" :key="actor.name">
          <div class="row items-center q-gutter-xs no-wrap">
            <q-avatar size="22px">
              <img v-if="actor.photo" :src="actor.photo" />
              <q-icon v-else name="person" size="14px" />
            </q-avatar>
            <span class="text-caption text-bold">{{ actor.name }}</span>
          </div>
          <span v-if="i < Math.min(fight.actors.length, 3) - 1" class="text-caption text-grey">vs</span>
        </template>
      </div>
      <div v-if="fight.choreographer" class="text-caption text-grey q-mt-xs ellipsis">
        <q-icon name="theaters" size="12px" class="q-mr-xs" />
        {{ fight.choreographer }}
      </div>
    </q-card-section>

    <!-- ══ Dialog lecteur vidéo ══ -->
    <q-dialog v-model="videoOpen" maximized transition-show="slide-up" transition-hide="slide-down">
      <div class="fight-player column no-wrap bg-black" style="height:100dvh">

        <!-- Header -->
        <div class="fight-player__header row items-center q-px-md q-py-sm">
          <q-btn flat round dense icon="arrow_back" color="white" v-close-popup />
          <div class="col q-ml-sm">
            <div class="text-subtitle2 text-bold text-white ellipsis">{{ displayTitle }}</div>
            <div class="text-caption text-grey">
              <q-icon name="visibility" size="11px" class="q-mr-xs" />{{ formatViews(fight.views) }} vues
            </div>
          </div>
        </div>

        <!-- Vidéo -->
        <div class="fight-player__video col-auto">
          <!-- Vidéo locale téléchargée -->
          <video
            v-if="fight.videoPath"
            controls autoplay playsinline
            style="width:100%;display:block;max-height:56vw;background:#000"
          >
            <source :src="localVideoSrc" />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>

          <!-- YouTube embed -->
          <div v-else-if="fight.youtubeId" style="position:relative;padding-top:56.25%">
            <iframe
              :src="`https://www.youtube.com/embed/${fight.youtubeId}?autoplay=1&rel=0`"
              style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowfullscreen
            />
          </div>

          <!-- Aucune source -->
          <div v-else class="flex flex-center text-grey" style="height:200px">
            <div class="text-center">
              <q-icon name="videocam_off" size="48px" class="q-mb-sm" />
              <div class="text-caption">Aucune vidéo disponible</div>
            </div>
          </div>
        </div>

        <!-- Infos détaillées -->
        <div class="fight-player__info col q-pa-md overflow-auto">
          <div class="text-subtitle1 text-bold text-white q-mb-xs">{{ displayTitle }}</div>
          <div v-if="fight.choreographer" class="text-caption text-grey q-mb-md">
            <q-icon name="theaters" size="13px" class="q-mr-xs" />
            Chorégraphie : {{ fight.choreographer }}
          </div>

          <!-- Acteurs -->
          <div v-if="fight.actors.length" class="row q-gutter-sm">
            <div
              v-for="actor in fight.actors"
              :key="actor.name"
              class="row items-center q-gutter-sm bg-grey-9 rounded-borders q-pa-sm"
              style="flex:0 0 auto;max-width:100%"
            >
              <q-avatar size="40px">
                <img v-if="actor.photo" :src="actor.photo" />
                <q-icon v-else name="person" />
              </q-avatar>
              <div>
                <div class="text-caption text-bold text-white">{{ actor.name }}</div>
                <div v-if="actor.character" class="text-caption text-grey">{{ actor.character }}</div>
              </div>
            </div>
          </div>

          <!-- Lien YouTube si pas de vidéo locale -->
          <div v-if="!fight.videoPath && fight.youtubeUrl" class="q-mt-md">
            <q-btn
              flat dense icon="open_in_new" color="grey" size="sm"
              label="Voir sur YouTube"
              :href="fight.youtubeUrl" target="_blank"
            />
          </div>
        </div>
      </div>
    </q-dialog>

  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Fight } from 'stores/fights'

const props = defineProps<{ fight: Fight }>()

const videoOpen = ref(false)

const displayTitle = computed(() => {
  if (props.fight.title) return props.fight.title
  const actors = props.fight.actors.map(a => a.name)
  const actorsPart = actors.length ? ` - ${actors.join(' vs ')}` : ''
  const yearPart   = props.fight.movieYear ? ` (${props.fight.movieYear})` : ''
  return `${props.fight.movieTitle || ''}${actorsPart}${yearPart}`
})

const localVideoSrc = computed(() => {
  if (!props.fight.videoPath) return ''
  const base = import.meta.env.VITE_API_URL || ''
  return `${base}${props.fight.videoPath}`
})

function openVideo () {
  if (props.fight.videoPath || props.fight.youtubeId || props.fight.youtubeUrl) {
    videoOpen.value = true
  }
}

function formatViews (n?: number) {
  if (!n) return '–'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
</script>

<style scoped>
.fight-card {
  border-radius: 10px;
  overflow: hidden;
  transition: transform .15s, box-shadow .15s;
}
.fight-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
}
.fight-card__thumb {
  position: relative;
}
.fight-card__overlay {
  background: rgba(0,0,0,0);
  transition: background .2s;
}
.fight-card__thumb:hover .fight-card__overlay {
  background: rgba(0,0,0,.35);
}
.fight-card__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
}
.fight-player__header {
  background: rgba(0,0,0,.7);
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.fight-player__video {
  background: #000;
}
</style>
