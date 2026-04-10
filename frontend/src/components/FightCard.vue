<template>
  <q-card class="fight-card bg-dark text-white" flat bordered>
    <q-img
      :src="fight.thumbnail || 'https://via.placeholder.com/640x360?text=Versus'"
      :ratio="16/9"
    >
      <div class="absolute-bottom text-right q-pa-xs">
        <q-badge color="dark" class="text-caption">
          <q-icon name="visibility" size="12px" class="q-mr-xs" />
          {{ formatViews(fight.views) }}
        </q-badge>
      </div>
    </q-img>

    <q-card-section class="q-pb-xs">
      <div class="text-subtitle1 text-bold ellipsis">{{ fight.movieTitle }}</div>
      <div class="text-caption text-grey">{{ fight.movieYear }}</div>
    </q-card-section>

    <q-card-section class="q-pt-xs">
      <div
        v-for="actor in fight.actors.slice(0, 3)"
        :key="actor.name"
        class="row items-center q-gutter-sm q-mb-xs"
      >
        <q-avatar size="28px">
          <img v-if="actor.photo" :src="actor.photo" />
          <q-icon v-else name="person" />
        </q-avatar>
        <div>
          <div class="text-caption text-bold">{{ actor.name }}</div>
          <div class="text-caption text-grey">{{ actor.character }}</div>
        </div>
      </div>
      <div v-if="fight.choreographer" class="text-caption text-grey q-mt-xs">
        <q-icon name="sports_martial_arts" size="14px" class="q-mr-xs" />
        {{ fight.choreographer }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Fight } from 'stores/fights'

defineProps<{ fight: Fight }>()

function formatViews (n?: number) {
  if (!n) return '–'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
</script>
