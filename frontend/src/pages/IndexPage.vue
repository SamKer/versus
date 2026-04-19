<template>
  <q-page class="q-pa-sm q-pa-md-md">

    <!-- Hero -->
    <div class="text-center q-py-lg">
      <div class="versus-title text-h3 text-h2-md q-mb-xs">VERSUS</div>
      <div class="text-caption text-subtitle1-md text-grey">Les plus beaux combats d'arts martiaux du cinéma</div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="60px" />
    </div>

    <template v-else>
      <!-- Barre recherche + tri -->
      <div class="row q-col-gutter-sm q-mb-sm items-center">
        <div class="col">
          <q-input
            v-model="search"
            placeholder="Rechercher un film, un acteur, un chorégraphe..."
            outlined dark dense clearable
            @clear="search = ''"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
        <div class="col-auto">
          <q-btn-dropdown
            flat dense no-caps color="grey"
            :label="sortLabel"
            icon="sort"
          >
            <q-list dark>
              <q-item
                v-for="opt in sortOptions" :key="opt.value"
                clickable v-close-popup
                @click="sortBy = opt.value"
                :active="sortBy === opt.value"
                active-class="text-primary"
              >
                <q-item-section avatar>
                  <q-icon :name="opt.icon" />
                </q-item-section>
                <q-item-section>{{ opt.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>

      <!-- Filtres type de combat & armes -->
      <div class="row items-center q-gutter-xs q-mb-md">
        <q-chip
          v-for="opt in fightTypeOptions" :key="opt.value"
          dense clickable
          :color="filterType === opt.value ? 'primary' : 'grey-9'"
          :text-color="filterType === opt.value ? 'white' : 'grey-4'"
          @click="filterType = filterType === opt.value ? null : opt.value"
        >
          {{ opt.label }}
        </q-chip>
        <q-separator vertical dark class="q-mx-xs" style="height:20px;align-self:center" />
        <q-chip
          dense clickable
          :color="filterArmed === true ? 'orange-9' : 'grey-9'"
          :text-color="filterArmed === true ? 'white' : 'grey-4'"
          icon="hardware"
          @click="filterArmed = filterArmed === true ? null : true"
        >
          Avec arme
        </q-chip>
        <q-chip
          dense clickable
          :color="filterArmed === false ? 'teal-9' : 'grey-9'"
          :text-color="filterArmed === false ? 'white' : 'grey-4'"
          icon="sports_martial_arts"
          @click="filterArmed = filterArmed === false ? null : false"
        >
          Sans arme
        </q-chip>
      </div>

      <!-- Résultats / Empty -->
      <div v-if="!filteredFights.length" class="text-center q-mt-xl text-grey">
        <q-icon name="search_off" size="64px" class="q-mb-md" />
        <div class="text-h6">Aucune scène trouvée</div>
        <div v-if="search" class="text-caption q-mt-sm">
          Aucun résultat pour « {{ search }} »
        </div>
      </div>

      <!-- Fight grid -->
      <div v-else>
        <div class="text-caption text-grey q-mb-sm">
          {{ filteredFights.length }} scène{{ filteredFights.length > 1 ? 's' : '' }}
          <span v-if="search"> · "{{ search }}"</span>
        </div>
        <div class="row q-col-gutter-md">
          <div
            v-for="fight in filteredFights"
            :key="fight._id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <FightCard :fight="fight" />
          </div>
        </div>
      </div>
    </template>

    <!-- Bouton suggestion flottant -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab icon="add_comment" color="primary"
        label="Suggérer une scène"
        @click="suggestionDialog = true"
        unelevated no-caps
      />
    </q-page-sticky>

    <!-- ══ Dialog suggestion ══ -->
    <q-dialog v-model="suggestionDialog" persistent>
      <q-card class="bg-dark full-width" style="max-width:480px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-bold">
            <q-icon name="add_comment" class="q-mr-sm" color="primary" />
            Suggérer une scène
          </div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup :disable="sending" />
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <p class="text-caption text-grey q-mb-sm">
            Tu connais un combat de cinéma qui mérite d'être ici ? Dis-le nous !
          </p>
          <q-input v-model="suggestion.name" label="Ton prénom (optionnel)" outlined dark dense :disable="sending" />
          <q-input
            v-model="suggestion.youtubeUrl"
            label="Lien YouTube (optionnel)"
            outlined dark dense
            placeholder="https://www.youtube.com/watch?v=..."
            :disable="sending"
          />
          <q-input
            v-model="suggestion.message"
            label="Ta suggestion *"
            outlined dark type="textarea"
            rows="3" autogrow
            :disable="sending"
            hint="Film, acteurs, une description..."
          />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Annuler" v-close-popup :disable="sending" />
          <q-btn
            color="primary" icon="send" label="Envoyer"
            :loading="sending" :disable="!suggestion.message.trim()"
            @click="sendSuggestion"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useFightsStore } from 'stores/fights'
import FightCard from 'components/FightCard.vue'
import { api } from 'boot/axios'

const $q   = useQuasar()
const store = useFightsStore()

onMounted(() => store.fetchAll())

// ── Recherche & tri ───────────────────────────────────────────
const search = ref('')
const sortBy = ref<'date' | 'views' | 'title'>('date')
const filterType  = ref<'1v1' | '1vAll' | '2v2' | null>(null)
const filterArmed = ref<boolean | null>(null)

const sortOptions = [
  { value: 'date',  label: 'Date d\'ajout',  icon: 'access_time' },
  { value: 'views', label: 'Vues',            icon: 'visibility'  },
  { value: 'title', label: 'Titre (A–Z)',     icon: 'sort_by_alpha' }
] as const

const fightTypeOptions = [
  { value: '1v1',   label: '1 vs 1'   },
  { value: '1vAll', label: '1 vs All' },
  { value: '2v2',   label: '2 vs 2'   }
] as const

const sortLabel = computed(() => sortOptions.find(o => o.value === sortBy.value)?.label ?? 'Trier')

const filteredFights = computed(() => {
  const q = search.value.trim().toLowerCase()

  let list = q
    ? store.fights.filter(f =>
        (f.title        || '').toLowerCase().includes(q) ||
        (f.movieTitle   || '').toLowerCase().includes(q) ||
        (f.choreographer|| '').toLowerCase().includes(q) ||
        f.actors.some(a => (a.name || '').toLowerCase().includes(q))
      )
    : [...store.fights]

  if (filterType.value !== null) {
    list = list.filter(f => (f.fightType ?? '1v1') === filterType.value)
  }

  if (filterArmed.value !== null) {
    list = list.filter(f => (f.armed ?? false) === filterArmed.value)
  }

  if (sortBy.value === 'views') {
    list = list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
  } else if (sortBy.value === 'title') {
    list = list.sort((a, b) =>
      (a.title || a.movieTitle || '').localeCompare(b.title || b.movieTitle || '', 'fr')
    )
  } else {
    // date desc (ordre par défaut de l'API)
    list = list.sort((a, b) =>
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    )
  }

  return list
})

// ── Suggestion ────────────────────────────────────────────────
const suggestionDialog = ref(false)
const sending          = ref(false)
const suggestion       = ref({ name: '', youtubeUrl: '', message: '' })

async function sendSuggestion () {
  if (!suggestion.value.message.trim()) return
  sending.value = true
  try {
    await api.post('/api/suggestions', suggestion.value)
    $q.notify({ type: 'positive', message: 'Merci pour ta suggestion ! 🙏', timeout: 3000 })
    suggestionDialog.value = false
    suggestion.value       = { name: '', youtubeUrl: '', message: '' }
  } catch {
    $q.notify({ type: 'negative', message: "Erreur lors de l'envoi, réessaie." })
  } finally {
    sending.value = false
  }
}
</script>
