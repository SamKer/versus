<template>
  <q-page class="q-pa-md">
    <!-- Hero -->
    <div class="text-center q-py-xl">
      <div class="versus-title text-h2 q-mb-sm">VERSUS</div>
      <div class="text-subtitle1 text-grey">Les plus beaux combats d'arts martiaux du cinéma</div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="60px" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!store.fights.length" class="text-center q-mt-xl text-grey">
      <q-icon name="sports_martial_arts" size="80px" class="q-mb-md" />
      <div class="text-h6">Aucun combat pour l'instant</div>
    </div>

    <!-- Fight grid -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="fight in store.fights"
        :key="fight._id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <FightCard :fight="fight" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useFightsStore } from 'stores/fights'
import FightCard from 'components/FightCard.vue'

const store = useFightsStore()

onMounted(() => store.fetchAll())
</script>
