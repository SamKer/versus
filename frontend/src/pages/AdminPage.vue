<template>
  <q-page class="q-pa-sm q-pa-md-md">

    <!-- ── LOGIN ── -->
    <div v-if="!authStore.isAuthenticated" class="flex flex-center" style="min-height: 80vh">
      <q-card style="width: 360px" class="bg-dark">
        <q-card-section class="text-center q-py-xl">
          <div class="versus-title text-h4 q-mb-lg">RYUKEN</div>
          <div class="text-grey q-mb-xl">Espace d'administration</div>

          <q-btn
            color="white"
            text-color="dark"
            icon="img:https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            label="Se connecter avec Google"
            size="md"
            @click="loginWithGoogle"
            class="full-width"
          />

          <div v-if="loginError" class="text-negative q-mt-md text-caption">
            {{ loginError }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- ── ADMIN PANEL ── -->
    <div v-else>
      <div class="row items-center q-mb-md">
        <div class="versus-title text-h5">Administration</div>
        <q-space />
        <div class="text-caption text-grey">{{ authStore.user?.name }}</div>
      </div>

      <!-- Onglets -->
      <q-tabs
        v-model="tab"
        dense
        align="left"
        mobile-arrows
        class="q-mb-lg"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab name="scenes"       icon="sports_martial_arts" label="Scènes" />
        <q-tab name="films"        icon="movie"               label="Films" />
        <q-tab name="acteurs"      icon="person"              label="Acteurs" />
        <q-tab name="choregraphes"  icon="theaters"            label="Chorégraphes" />
        <q-tab name="suggestions"  icon="add_comment"         label="Suggestions">
          <q-badge v-if="unreadSuggestions > 0" color="negative" floating rounded>{{ unreadSuggestions }}</q-badge>
        </q-tab>
      </q-tabs>

      <!-- ══════════════════════════════════════
           ONGLET SCÈNES
      ══════════════════════════════════════ -->
      <div v-show="tab === 'scenes'" class="row q-col-gutter-lg">

        <!-- ── GAUCHE : import + liste ── -->
        <div class="col-12 col-md-5">

          <!-- Import YouTube -->
          <q-card class="bg-dark" flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-bold q-mb-md">
                <q-icon name="smart_display" class="q-mr-sm" />
                Importer un combat
              </div>

              <q-input
                v-model="youtubeUrl"
                label="URL YouTube"
                outlined dark
                placeholder="https://www.youtube.com/watch?v=..."
                :disable="analyzing"
              >
                <template #append>
                  <q-btn flat icon="search" color="primary" :loading="analyzing" @click="analyze" :disable="!youtubeUrl" />
                </template>
              </q-input>
            </q-card-section>
          </q-card>

          <!-- Suggestions de films -->
          <q-card v-if="suggestions.length" class="bg-dark q-mt-md" flat bordered>
            <q-card-section>
              <div class="text-caption text-grey q-mb-sm">Autres films possibles :</div>
              <q-list dense>
                <q-item
                  v-for="s in suggestions"
                  :key="s.tmdbId"
                  clickable
                  @click="selectSuggestion(s.tmdbId)"
                  class="rounded-borders"
                >
                  <q-item-section avatar>
                    <q-avatar square size="40px">
                      <img v-if="s.poster" :src="s.poster" />
                      <q-icon v-else name="movie" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ s.title }}</q-item-label>
                    <q-item-label caption>{{ s.year }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>

          <!-- Liste des combats (triée par vues) -->
          <q-card class="bg-dark q-mt-md" flat bordered>
            <q-card-section>
              <div class="row items-center q-mb-md">
                <div class="text-subtitle1 text-bold">
                  <q-icon name="emoji_events" class="q-mr-sm" />
                  Classement ({{ fightsStore.fights.length }})
                </div>
                <q-space />
                <q-btn-toggle
                  v-model="fightSort"
                  dense unelevated no-caps
                  :options="[
                    { icon: 'visibility', value: 'views', title: 'Trier par vues' },
                    { icon: 'access_time', value: 'date', title: 'Trier par date' }
                  ]"
                  color="primary"
                  size="xs"
                />
              </div>
              <q-list dense>
                <q-item v-for="(f, idx) in sortedFights" :key="f._id" class="rounded-borders q-mb-xs">
                  <q-item-section side style="min-width:28px; padding-right:8px">
                    <div class="text-caption text-bold"
                      :class="idx === 0 ? 'text-amber' : idx === 1 ? 'text-grey-4' : idx === 2 ? 'text-orange-4' : 'text-grey'"
                    >#{{ idx + 1 }}</div>
                  </q-item-section>
                  <q-item-section avatar>
                    <q-avatar square size="40px">
                      <img v-if="f.thumbnail" :src="f.thumbnail" />
                      <q-icon v-else name="movie" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ fightDisplayTitle(f) }}</q-item-label>
                    <q-item-label caption class="text-grey">
                      <q-icon name="visibility" size="10px" class="q-mr-xs" />
                      {{ formatViews(f.views) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row q-gutter-xs">
                      <q-btn flat round icon="edit" color="primary" size="sm" @click="editFight(f)" />
                      <q-btn flat round icon="delete" color="negative" size="sm" @click="deleteFight(f._id!)" />
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <!-- ── DROITE : formulaire combat ── -->
        <div class="col-12 col-md-7">
          <q-card v-if="form" class="bg-dark" flat bordered>
            <q-card-section>

              <div class="row items-center q-mb-md">
                <div class="col">
                  <div class="text-subtitle1 text-bold">
                    <q-icon name="edit" class="q-mr-sm" />
                    {{ editingFightId ? 'Modifier la scène' : 'Nouvelle scène' }}
                  </div>
                  <div v-if="form.title" class="text-caption text-primary q-mt-xs ellipsis" style="max-width:420px">
                    {{ form.title }}
                  </div>
                </div>
                <q-btn v-if="editingFightId" flat round icon="close" size="sm" @click="resetForm" />
              </div>

              <!-- Miniature YouTube -->
              <div class="row q-gutter-md q-mb-lg items-start">
                <q-img
                  v-if="form.thumbnail"
                  :src="form.thumbnail"
                  style="width: 180px; border-radius: 8px; flex-shrink:0"
                  :ratio="16/9"
                />
                <div class="col">
                  <div class="text-body2 q-mb-xs">{{ form.youtubeTitle }}</div>
                  <div class="text-caption text-grey">
                    <q-icon name="visibility" size="12px" class="q-mr-xs" />
                    {{ formatViews(form.views) }} vues
                  </div>
                </div>
              </div>

              <q-separator dark class="q-mb-md" />

              <!-- Recherche TMDB manuelle -->
              <div class="text-caption text-grey q-mb-sm">RECHERCHE FILM (TMDB)</div>
              <q-input
                v-model="tmdbSearch"
                label="Chercher un film..."
                outlined dark dense
                class="q-mb-sm"
                @keyup.enter="searchTmdb"
                :loading="searchingTmdb"
              >
                <template #append>
                  <q-btn flat round icon="search" color="primary" :loading="searchingTmdb" @click="searchTmdb" />
                </template>
              </q-input>

              <q-list v-if="tmdbResults.length" bordered separator dark class="rounded-borders q-mb-md">
                <q-item
                  v-for="r in tmdbResults"
                  :key="r.tmdbId"
                  clickable v-ripple
                  @click="applyTmdbResult(r.tmdbId)"
                  :active="form.movieTmdbId === r.tmdbId"
                  active-class="bg-grey-9"
                >
                  <q-item-section avatar>
                    <q-avatar square size="44px">
                      <img v-if="r.poster" :src="r.poster" />
                      <q-icon v-else name="movie" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ r.title }}</q-item-label>
                    <q-item-label caption>{{ r.year }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon v-if="form.movieTmdbId === r.tmdbId" name="check_circle" color="positive" />
                  </q-item-section>
                </q-item>
              </q-list>

              <!-- Détails film -->
              <div class="text-caption text-grey q-mb-sm">DÉTAILS DU FILM</div>
              <div class="row q-col-gutter-md q-mb-sm">
                <div class="col-12 col-sm-8">
                  <q-input v-model="form.movieTitle" label="Titre du film" outlined dark dense />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model.number="form.movieYear" label="Année" outlined dark dense type="number" />
                </div>
                <div class="col-12">
                  <q-input v-model="form.choreographer" label="Chorégraphe" outlined dark dense />
                </div>
              </div>

              <!-- Titre de la scène -->
              <div class="text-caption text-grey q-mb-sm q-mt-md">TITRE DE LA SCÈNE</div>
              <q-input
                v-model="form.title"
                label="Titre"
                outlined dark dense
                class="q-mb-sm"
                hint="Auto-généré · modifiable manuellement"
              >
                <template #append>
                  <q-btn
                    flat round dense icon="refresh" size="sm" color="grey"
                    title="Regénérer le titre"
                    @click="form.title = buildAutoTitle(form)"
                  />
                </template>
              </q-input>

              <q-separator dark class="q-mb-md" />

              <!-- Acteurs -->
              <div class="text-caption text-grey q-mb-sm">ACTEURS DU FILM</div>

              <q-list v-if="form.actors.length" dense class="q-mb-sm">
                <q-item
                  v-for="(actor, i) in form.actors"
                  :key="i"
                  tag="label" clickable
                  class="rounded-borders q-mb-xs"
                  :class="actor.selected ? 'bg-grey-9' : ''"
                >
                  <q-item-section side>
                    <q-checkbox v-model="actor.selected" color="primary" dark />
                  </q-item-section>
                  <q-item-section avatar>
                    <q-avatar size="40px">
                      <img v-if="actor.photo" :src="actor.photo" />
                      <q-icon v-else name="person" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ actor.name }}</q-item-label>
                    <q-item-label caption class="text-accent">{{ actor.character }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <!-- Recherche d'acteur supplémentaire -->
              <div class="text-caption text-grey q-mt-md q-mb-sm">AJOUTER UN ACTEUR</div>

              <q-input
                v-model="castSearch"
                label="Rechercher un acteur..."
                outlined dark dense
                @keyup.enter="searchCastLocal"
                :loading="castSearchingLocal"
                clearable
                @clear="clearCastSearch"
              >
                <template #append>
                  <q-btn flat round icon="search" color="primary" :loading="castSearchingLocal" @click="searchCastLocal" :disable="!castSearch" />
                </template>
              </q-input>

              <!-- Résultats locaux -->
              <template v-if="castLocalResults.length">
                <div class="text-caption text-grey q-mt-sm q-mb-xs">
                  <q-icon name="storage" size="12px" class="q-mr-xs" />
                  Dans votre base
                </div>
                <q-list bordered separator dark class="rounded-borders q-mb-sm">
                  <q-item v-for="a in castLocalResults" :key="a._id" class="q-pa-sm">
                    <q-item-section avatar>
                      <q-avatar size="40px">
                        <img v-if="a.photo" :src="a.photo" />
                        <q-icon v-else name="person" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-bold">{{ a.name }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        v-if="!isInCast(a.name)"
                        unelevated size="sm" color="primary" icon="add" label="Ajouter à la scène"
                        @click="addActorToFight({ name: a.name, character: '', photo: a.photo ?? null, tmdbId: a.tmdbId })"
                      />
                      <q-chip v-else dense color="positive" text-color="white" icon="check" label="Dans la scène" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </template>

              <div v-else-if="castSearchDone && !castSearchingLocal" class="text-caption text-grey q-mt-sm q-mb-xs">
                <q-icon name="storage" size="12px" class="q-mr-xs" />
                Aucun résultat dans votre base
              </div>

              <!-- Bouton TMDB -->
              <q-btn
                v-if="castSearchDone && !castSearchingLocal"
                flat dense icon="travel_explore"
                :label="castTmdbResults.length ? 'Résultats TMDB ci-dessous' : 'Chercher sur TMDB'"
                color="grey" class="q-mt-xs full-width"
                :loading="castSearchingTmdb"
                @click="searchCastTmdb"
              />

              <!-- Résultats TMDB -->
              <template v-if="castTmdbResults.length">
                <div class="text-caption text-grey q-mt-sm q-mb-xs">
                  <q-icon name="travel_explore" size="12px" class="q-mr-xs" />
                  Sur TMDB
                </div>
                <q-list bordered separator dark class="rounded-borders">
                  <q-item v-for="r in castTmdbResults" :key="r.tmdbId" class="q-pa-sm">
                    <q-item-section avatar>
                      <q-avatar size="40px">
                        <img v-if="r.photo" :src="r.photo" />
                        <q-icon v-else name="person" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-bold">{{ r.name }}</q-item-label>
                      <q-item-label caption class="text-grey">{{ r.knownFor.join(', ') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        v-if="!isInCast(r.name)"
                        unelevated size="sm" color="primary" icon="add" label="Ajouter à la scène"
                        @click="addActorToFight({ name: r.name, character: '', photo: r.photo, tmdbId: r.tmdbId })"
                      />
                      <q-chip v-else dense color="positive" text-color="white" icon="check" label="Dans la scène" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </template>
            </q-card-section>

            <q-card-actions align="right" class="q-px-md q-pb-md">
              <q-btn
                outline color="accent" icon="download" label="Télécharger"
                :loading="downloading" @click="downloadVideo"
              />
              <q-btn
                v-if="editingFightId"
                flat color="grey" icon="trending_up"
                title="Historique des vues"
                @click="openViewsHistory"
              />
              <q-space />
              <q-btn
                color="primary" icon="save"
                :label="editingFightId ? 'Mettre à jour' : 'Sauvegarder'"
                :loading="saving" @click="save"
              />
            </q-card-actions>
          </q-card>

          <div v-else class="flex flex-center text-grey" style="min-height: 200px">
            <div class="text-center">
              <q-icon name="link" size="48px" class="q-mb-md" />
              <div>Collez une URL YouTube ou cliquez sur un combat pour l'éditer</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           ONGLET ACTEURS
      ══════════════════════════════════════ -->
      <div v-show="tab === 'acteurs'" class="row q-col-gutter-lg">

        <!-- ── GAUCHE : recherche ── -->
        <div class="col-12 col-md-5">
          <q-card class="bg-dark" flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-bold q-mb-md">
                <q-icon name="search" class="q-mr-sm" />
                Rechercher un acteur
              </div>

              <q-input
                v-model="actorSearch"
                label="Nom de l'acteur..."
                outlined dark
                @keyup.enter="searchActor"
                :loading="searchingActor"
                clearable
                @clear="clearActorSearch"
              >
                <template #append>
                  <q-btn flat icon="search" color="primary" :loading="searchingActor" @click="searchActor" :disable="!actorSearch" />
                </template>
              </q-input>

              <!-- Résultats locaux -->
              <template v-if="localActorResults.length">
                <div class="text-caption text-grey q-mt-md q-mb-xs">
                  <q-icon name="storage" size="12px" class="q-mr-xs" />
                  Dans votre base ({{ localActorResults.length }})
                </div>
                <q-list bordered separator dark class="rounded-borders">
                  <q-item v-for="a in localActorResults" :key="a._id" class="q-pa-sm">
                    <q-item-section avatar>
                      <q-avatar size="48px">
                        <img v-if="a.photo" :src="a.photo" />
                        <q-icon v-else name="person" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-bold">{{ a.name }}</q-item-label>
                      <q-item-label caption class="text-grey">
                        {{ a.birthDate ? new Date(a.birthDate).getFullYear() : '' }}
                        {{ a.placeOfBirth ? '· ' + a.placeOfBirth : '' }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn flat round icon="edit" color="primary" size="sm" @click="openActorEdit(a)" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </template>

              <div v-else-if="actorSearchDone && !searchingActor" class="text-caption text-grey q-mt-md q-mb-xs">
                <q-icon name="storage" size="12px" class="q-mr-xs" />
                Aucun résultat dans votre base
              </div>

              <!-- Bouton pour élargir à TMDB -->
              <q-btn
                v-if="actorSearchDone && !searchingActor"
                flat dense
                icon="travel_explore"
                :label="actorResults.length ? 'Résultats TMDB ci-dessous' : 'Chercher sur TMDB'"
                color="grey"
                class="q-mt-sm full-width"
                :loading="searchingTmdbActor"
                @click="searchActorTmdb"
              />

              <!-- Résultats TMDB -->
              <template v-if="actorResults.length">
                <div class="text-caption text-grey q-mt-md q-mb-xs">
                  <q-icon name="travel_explore" size="12px" class="q-mr-xs" />
                  Sur TMDB ({{ actorResults.length }})
                </div>
                <q-list bordered separator dark class="rounded-borders">
                  <q-item v-for="r in actorResults" :key="r.tmdbId" class="q-pa-sm">
                    <q-item-section avatar>
                      <q-avatar size="48px">
                        <img v-if="r.photo" :src="r.photo" />
                        <q-icon v-else name="person" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-bold">{{ r.name }}</q-item-label>
                      <q-item-label caption class="text-grey">{{ r.knownFor.join(', ') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn
                        flat round
                        :icon="isActorSaved(r.tmdbId) ? 'check_circle' : 'add_circle'"
                        :color="isActorSaved(r.tmdbId) ? 'positive' : 'primary'"
                        :disable="isActorSaved(r.tmdbId)"
                        :loading="addingActorId === r.tmdbId"
                        @click="addActorFromTmdb(r)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </template>

              <!-- Ajout manuel -->
              <q-separator dark class="q-my-md" />
              <div class="text-caption text-grey q-mb-sm">AJOUT MANUEL</div>
              <q-input v-model="manualActorName" label="Nom" outlined dark dense class="q-mb-sm" />
              <q-btn
                color="secondary" icon="add" label="Ajouter manuellement"
                :disable="!manualActorName.trim()"
                @click="addActorManually"
                class="full-width"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- ── DROITE : liste des acteurs sauvegardés ── -->
        <div class="col-12 col-md-7">
          <q-card class="bg-dark" flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-bold q-mb-md">
                <q-icon name="group" class="q-mr-sm" />
                Acteurs enregistrés ({{ actorsStore.actors.length }})
              </div>

              <q-input
                v-model="actorFilter"
                label="Filtrer..."
                outlined dark dense
                class="q-mb-md"
                clearable
              >
                <template #prepend><q-icon name="filter_list" /></template>
              </q-input>

              <q-list separator>
                <q-item v-for="a in filteredActors" :key="a._id" class="q-pa-sm">
                  <q-item-section avatar>
                    <q-avatar size="52px">
                      <img v-if="a.photo" :src="a.photo" />
                      <q-icon v-else name="person" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-bold">{{ a.name }}</q-item-label>
                    <q-item-label caption class="text-grey">
                      {{ a.birthDate ? new Date(a.birthDate).getFullYear() : '' }}
                      {{ a.placeOfBirth ? '· ' + a.placeOfBirth : '' }}
                    </q-item-label>
                    <q-item-label v-if="a.biography" caption class="text-grey ellipsis-2-lines" style="max-width:360px">
                      {{ a.biography }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side class="text-right">
                    <q-badge :color="a.sceneCount > 0 ? 'primary' : 'grey-8'" class="q-mb-xs">
                      {{ a.sceneCount }} scène{{ a.sceneCount > 1 ? 's' : '' }}
                    </q-badge>
                    <div class="row q-gutter-xs justify-end q-mt-xs">
                      <q-btn flat round icon="edit" color="primary" size="sm" @click="openActorEdit(a)" />
                      <q-btn flat round icon="delete" color="negative" size="sm" @click="deleteActor(a._id!)" />
                    </div>
                  </q-item-section>
                </q-item>

                <q-item v-if="!filteredActors.length" class="text-grey text-center q-py-lg">
                  <q-item-section>Aucun acteur enregistré</q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           ONGLET FILMS
      ══════════════════════════════════════ -->
      <div v-show="tab === 'films'" class="row q-col-gutter-lg">
        <div class="col-12">
          <q-card class="bg-dark" flat bordered>
            <q-card-section>
              <div class="row items-center q-mb-md">
                <div class="text-subtitle1 text-bold">
                  <q-icon name="movie" class="q-mr-sm" />
                  Films ({{ moviesList.length }})
                </div>
                <q-space />
                <div class="text-caption text-grey">classé par vues cumulées</div>
              </div>
              <q-input
                v-model="moviesFilter"
                label="Filtrer..."
                outlined dark dense
                class="q-mb-md"
                clearable
              >
                <template #prepend><q-icon name="filter_list" /></template>
              </q-input>
              <q-list separator>
                <q-item v-for="(m, idx) in filteredMovies" :key="m._id" class="q-pa-sm">
                  <q-item-section side style="min-width:28px;padding-right:8px">
                    <div class="text-caption text-bold"
                      :class="idx === 0 ? 'text-amber' : idx === 1 ? 'text-grey-4' : idx === 2 ? 'text-orange-4' : 'text-grey'"
                    >#{{ idx + 1 }}</div>
                  </q-item-section>
                  <q-item-section avatar>
                    <q-avatar square size="48px">
                      <img v-if="m.poster" :src="m.poster" />
                      <q-icon v-else name="movie" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-bold">{{ m.title }}</q-item-label>
                    <q-item-label caption class="text-grey">{{ m.year }}</q-item-label>
                    <q-item-label v-if="m.choreographer" caption class="text-accent">
                      <q-icon name="theaters" size="12px" class="q-mr-xs" />
                      {{ m.choreographer }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side class="text-right">
                    <q-badge :color="m.sceneCount > 0 ? 'primary' : 'grey-8'" class="q-mb-xs">
                      {{ m.sceneCount }} scène{{ m.sceneCount > 1 ? 's' : '' }}
                    </q-badge>
                    <div class="text-caption text-grey">
                      <q-icon name="visibility" size="10px" class="q-mr-xs" />
                      {{ formatViews(m.totalViews) }}
                    </div>
                  </q-item-section>
                </q-item>
                <q-item v-if="!filteredMovies.length" class="text-grey text-center q-py-lg">
                  <q-item-section>Aucun film enregistré</q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           ONGLET CHORÉGRAPHES
      ══════════════════════════════════════ -->
      <div v-show="tab === 'choregraphes'" class="row q-col-gutter-lg">

        <!-- Recherche -->
        <div class="col-12 col-md-5">
          <q-card class="bg-dark" flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-bold q-mb-md">
                <q-icon name="search" class="q-mr-sm" />
                Rechercher un chorégraphe
              </div>
              <q-input
                v-model="choreoSearch"
                label="Nom du chorégraphe..."
                outlined dark
                @keyup.enter="searchChoreo"
                :loading="searchingChoreo"
                clearable
                @clear="choreoResults = []"
              >
                <template #append>
                  <q-btn flat icon="search" color="primary" :loading="searchingChoreo" @click="searchChoreo" :disable="!choreoSearch" />
                </template>
              </q-input>
              <q-list v-if="choreoResults.length" bordered separator dark class="rounded-borders q-mt-md">
                <q-item v-for="c in choreoResults" :key="c._id" class="q-pa-sm">
                  <q-item-section>
                    <q-item-label class="text-bold">{{ c.name }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn flat round icon="edit" color="primary" size="sm" @click="openChoreoEdit(c)" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>

        <!-- Liste -->
        <div class="col-12 col-md-7">
          <q-card class="bg-dark" flat bordered>
            <q-card-section>
              <div class="text-subtitle1 text-bold q-mb-md">
                <q-icon name="theaters" class="q-mr-sm" />
                Chorégraphes ({{ choreoList.length }})
              </div>
              <q-input
                v-model="choreoFilter"
                label="Filtrer..."
                outlined dark dense
                class="q-mb-md"
                clearable
              >
                <template #prepend><q-icon name="filter_list" /></template>
              </q-input>
              <q-list separator>
                <q-item v-for="c in filteredChoreos" :key="c._id" class="q-pa-sm">
                  <q-item-section>
                    <q-item-label class="text-bold">{{ c.name }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn flat round icon="edit" color="primary" size="sm" @click="openChoreoEdit(c)" />
                  </q-item-section>
                </q-item>
                <q-item v-if="!filteredChoreos.length" class="text-grey text-center q-py-lg">
                  <q-item-section>Aucun chorégraphe enregistré</q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- ══════════════════════════════════════
           ONGLET SUGGESTIONS
      ══════════════════════════════════════ -->
      <div v-show="tab === 'suggestions'">
        <q-card class="bg-dark" flat bordered>
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-subtitle1 text-bold">
                <q-icon name="add_comment" class="q-mr-sm" />
                Suggestions ({{ suggestionsList.length }})
              </div>
              <q-space />
              <q-badge v-if="unreadSuggestions > 0" color="negative">{{ unreadSuggestions }} non lue{{ unreadSuggestions > 1 ? 's' : '' }}</q-badge>
            </div>

            <div v-if="loadingSuggestions" class="flex flex-center q-py-xl">
              <q-spinner color="primary" size="40px" />
            </div>

            <q-list v-else separator>
              <q-item
                v-for="s in suggestionsList"
                :key="s._id"
                class="q-pa-md rounded-borders q-mb-xs"
                :class="!s.read ? 'bg-grey-9' : ''"
              >
                <q-item-section>
                  <div class="row items-center q-gutter-sm q-mb-xs flex-wrap">
                    <q-icon name="person" size="14px" color="grey" />
                    <span class="text-caption text-bold">{{ s.name || 'Anonyme' }}</span>
                    <span class="text-caption text-grey">— {{ new Date(s.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) }}</span>
                    <q-badge v-if="!s.read" color="primary" dense>nouveau</q-badge>
                  </div>
                  <div class="text-body2 q-mb-xs">{{ s.message }}</div>
                  <div v-if="s.youtubeUrl" class="text-caption">
                    <q-icon name="smart_display" size="13px" class="q-mr-xs text-red" />
                    <a :href="s.youtubeUrl" target="_blank" class="text-primary">{{ s.youtubeUrl }}</a>
                  </div>
                </q-item-section>
                <q-item-section side>
                  <div class="column q-gutter-xs items-end">
                    <q-btn
                      v-if="!s.read"
                      flat round icon="done" color="positive" size="sm"
                      title="Marquer comme lue"
                      @click="markRead(s._id)"
                    />
                    <q-btn flat round icon="delete" color="negative" size="sm" @click="deleteSuggestion(s._id)" />
                  </div>
                </q-item-section>
              </q-item>

              <q-item v-if="!suggestionsList.length" class="text-grey text-center q-py-xl">
                <q-item-section>
                  <q-icon name="inbox" size="48px" class="q-mb-sm" />
                  <div>Aucune suggestion pour l'instant</div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ══ DIALOG édition acteur ══ -->
    <q-dialog v-model="actorDialog" persistent>
      <q-card class="bg-dark full-width" style="max-width:560px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-bold">Éditer l'acteur</div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <div class="row items-center q-mb-sm q-gutter-md">
            <q-avatar size="72px">
              <img v-if="actorForm.photo" :src="actorForm.photo" />
              <q-icon v-else name="person" size="48px" />
            </q-avatar>
            <q-input
              v-model="actorForm.photo"
              label="URL de la photo"
              outlined dark dense
              class="col"
            />
          </div>

          <q-input v-model="actorForm.name" label="Nom *" outlined dark dense />
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input v-model="actorForm.birthDate" label="Date de naissance" outlined dark dense placeholder="AAAA-MM-JJ" />
            </div>
            <div class="col-6">
              <q-input v-model="actorForm.placeOfBirth" label="Lieu de naissance" outlined dark dense />
            </div>
          </div>
          <q-input
            v-model="actorForm.biography"
            label="Biographie"
            outlined dark
            type="textarea"
            rows="5"
            autogrow
          />
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Annuler" v-close-popup />
          <q-btn color="primary" icon="save" label="Sauvegarder" :loading="savingActor" @click="saveActorEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ══ DIALOG historique vues ══ -->
    <q-dialog v-model="viewsDialog">
      <q-card class="bg-dark full-width" style="max-width:640px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-bold">
            <q-icon name="trending_up" class="q-mr-sm" color="primary" />
            Évolution des vues
          </div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <div v-if="loadingHistory" class="flex flex-center q-py-xl">
            <q-spinner size="48px" color="primary" />
          </div>

          <div v-else-if="viewsHistory.length === 0" class="text-center text-grey q-py-xl">
            <q-icon name="bar_chart" size="48px" class="q-mb-sm" /><br>
            Aucun historique disponible.<br>
            <span class="text-caption">Sauvegardez la scène ou lancez le script updateViews.</span>
          </div>

          <template v-else>
            <!-- Stats rapides -->
            <div class="row q-gutter-md q-mb-lg text-center">
              <div class="col bg-grey-9 rounded-borders q-pa-sm">
                <div class="text-h6 text-primary">{{ formatViews(viewsHistory[viewsHistory.length - 1]?.views) }}</div>
                <div class="text-caption text-grey">Vues actuelles</div>
              </div>
              <div v-if="viewsHistory.length > 1" class="col bg-grey-9 rounded-borders q-pa-sm">
                <div class="text-h6" :class="viewsGrowth >= 0 ? 'text-positive' : 'text-negative'">
                  {{ viewsGrowth >= 0 ? '+' : '' }}{{ formatViews(viewsGrowth) }}
                </div>
                <div class="text-caption text-grey">Progression totale</div>
              </div>
              <div class="col bg-grey-9 rounded-borders q-pa-sm">
                <div class="text-h6 text-grey">{{ viewsHistory.length }}</div>
                <div class="text-caption text-grey">Mesures</div>
              </div>
            </div>

            <!-- Graph SVG -->
            <svg
              v-if="chartPoints.points.length > 0"
              :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
              style="width:100%;height:auto;display:block;overflow:visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <!-- Lignes de grille horizontales -->
              <line
                v-for="gl in chartPoints.yLabels" :key="'gl' + gl.label"
                :x1="PAD_L" :y1="gl.y" :x2="SVG_W - PAD_R" :y2="gl.y"
                stroke="#333" stroke-width="1" stroke-dasharray="4,4"
              />
              <!-- Zone remplie sous la courbe -->
              <path
                v-if="chartPoints.points.length > 1"
                :d="chartPoints.areaPath"
                fill="rgba(25,118,210,0.12)"
              />
              <!-- Ligne -->
              <polyline
                v-if="chartPoints.points.length > 1"
                :points="chartPoints.polyline"
                fill="none" stroke="#1976d2" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"
              />
              <!-- Points interactifs -->
              <g v-for="pt in chartPoints.points" :key="pt.key">
                <circle :cx="pt.x" :cy="pt.y" r="5" fill="#1976d2" />
                <circle :cx="pt.x" :cy="pt.y" r="8" fill="rgba(25,118,210,0.25)" />
                <title>{{ pt.date }} — {{ formatViews(pt.views) }} vues</title>
              </g>
              <!-- Labels Y -->
              <text
                v-for="gl in chartPoints.yLabels" :key="'yl' + gl.label"
                :x="PAD_L - 8" :y="gl.y + 4"
                text-anchor="end" font-size="10" fill="#777"
              >{{ gl.label }}</text>
              <!-- Labels X -->
              <text
                v-for="xl in chartPoints.xLabels" :key="'xl' + xl.label + xl.x"
                :x="xl.x" :y="SVG_H - 6"
                text-anchor="middle" font-size="10" fill="#777"
              >{{ xl.label }}</text>
              <!-- Axe Y -->
              <line :x1="PAD_L" :y1="PAD_T" :x2="PAD_L" :y2="PAD_T + INNER_H" stroke="#555" stroke-width="1" />
              <!-- Axe X -->
              <line :x1="PAD_L" :y1="PAD_T + INNER_H" :x2="SVG_W - PAD_R" :y2="PAD_T + INNER_H" stroke="#555" stroke-width="1" />
            </svg>
          </template>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- ══ DIALOG édition chorégraphe ══ -->
    <q-dialog v-model="choreoDialog" persistent>
      <q-card class="bg-dark full-width" style="max-width:400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-bold">Éditer le chorégraphe</div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-input v-model="choreoForm.name" label="Nom *" outlined dark dense />
        </q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Annuler" v-close-popup />
          <q-btn color="primary" icon="save" label="Sauvegarder" :loading="savingChoreo" @click="saveChoreoEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { useFightsStore, type Fight, type Actor } from 'stores/fights'
import { useActorsStore, type ActorProfile, type TmdbPersonResult } from 'stores/actors'
import { api } from 'boot/axios'

const $q        = useQuasar()
const route     = useRoute()
const authStore = useAuthStore()
const fightsStore = useFightsStore()
const actorsStore = useActorsStore()

// ── Onglet actif
const tab = ref<'scenes' | 'films' | 'acteurs' | 'choregraphes' | 'suggestions'>('scenes')

// ── Classement ────────────────────────────────────────────────
const fightSort = ref<'views' | 'date'>('views')
const sortedFights = computed(() => {
  const list = [...fightsStore.fights]
  if (fightSort.value === 'views') return list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
  return list // déjà triés par date desc depuis l'API
})

// ── Combats ────────────────────────────────────────────────────
const youtubeUrl    = ref('')
const analyzing     = ref(false)
const downloading   = ref(false)
const saving        = ref(false)
const editingFightId = ref<string | null>(null)
const loginError    = ref('')
const suggestions   = ref<Array<{ tmdbId: number; title: string; year: number | null; poster: string | null }>>([])
const form          = ref<Fight | null>(null)
const tmdbSearch    = ref('')
const searchingTmdb = ref(false)
const tmdbResults   = ref<Array<{ tmdbId: number; title: string; year: number | null; poster: string | null }>>([])

// ── Recherche acteur dans le formulaire combat ─────────────────
const castSearch         = ref('')
const castSearchingLocal = ref(false)
const castSearchingTmdb  = ref(false)
const castSearchDone     = ref(false)
const castLocalResults   = ref<ActorProfile[]>([])
const castTmdbResults    = ref<TmdbPersonResult[]>([])

// ── Acteurs ────────────────────────────────────────────────────
const actorSearch        = ref('')
const searchingActor     = ref(false)
const searchingTmdbActor = ref(false)
const actorSearchDone    = ref(false)
const localActorResults  = ref<ActorProfile[]>([])
const actorResults       = ref<TmdbPersonResult[]>([])
const addingActorId      = ref<number | null>(null)
const manualActorName    = ref('')
const actorFilter        = ref('')
const actorDialog        = ref(false)
const savingActor        = ref(false)
const editingActorId     = ref<string | null>(null)
const actorForm          = ref<Partial<ActorProfile>>({
  name: '', photo: '', birthDate: '', placeOfBirth: '', biography: ''
})

// ── Films ──────────────────────────────────────────────────────
interface MovieItem { _id: string; tmdbId?: number; title: string; year?: number; poster?: string; choreographer?: string }
const moviesList   = ref<MovieItem[]>([])
const moviesFilter = ref('')

const moviesWithStats = computed(() => {
  return moviesList.value.map(m => {
    const scenes = fightsStore.fights.filter(f =>
      (m.tmdbId && f.movieTmdbId === m.tmdbId) ||
      (f.movieTitle || '').toLowerCase() === (m.title || '').toLowerCase()
    )
    const totalViews = scenes.reduce((sum, f) => sum + (f.views ?? 0), 0)
    return { ...m, sceneCount: scenes.length, totalViews }
  }).sort((a, b) => b.totalViews - a.totalViews)
})

const filteredMovies = computed(() => {
  const q = moviesFilter.value.toLowerCase()
  return q
    ? moviesWithStats.value.filter(m =>
        m.title.toLowerCase().includes(q) || (m.choreographer || '').toLowerCase().includes(q)
      )
    : moviesWithStats.value
})

// ── Chorégraphes ───────────────────────────────────────────────
interface ChoreoItem { _id: string; name: string }
const choreoList    = ref<ChoreoItem[]>([])
const choreoFilter  = ref('')
const choreoSearch  = ref('')
const searchingChoreo = ref(false)
const choreoResults = ref<ChoreoItem[]>([])
const choreoDialog  = ref(false)
const savingChoreo  = ref(false)
const editingChoreoId = ref<string | null>(null)
const choreoForm    = ref<{ name: string }>({ name: '' })
const filteredChoreos = computed(() => {
  const q = choreoFilter.value.toLowerCase()
  return q ? choreoList.value.filter(c => c.name.toLowerCase().includes(q)) : choreoList.value
})

// ── Init ───────────────────────────────────────────────────────
function loginWithGoogle () {
  window.location.href = `${import.meta.env.VITE_API_URL || ''}/auth/google`
}

onMounted(async () => {
  const token = route.query.token as string | undefined
  const error = route.query.error as string | undefined

  if (token) {
    authStore.setToken(token)
    window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0])
  }
  if (error === 'unauthorized') {
    loginError.value = "Accès refusé. Seul l'administrateur peut se connecter."
  }

  if (authStore.isAuthenticated) {
    await Promise.all([fightsStore.fetchAll(), actorsStore.fetchAll()])
    fetchMovies()
    fetchChoreos()
    fetchSuggestions()
  }
})

// ── Rechargement des collections au changement d'onglet ───────
watch(tab, (newTab) => {
  if (newTab === 'films')        fetchMovies()
  if (newTab === 'choregraphes') fetchChoreos()
  if (newTab === 'acteurs')      actorsStore.fetchAll()
  if (newTab === 'suggestions')  fetchSuggestions()
})

// ── Titre auto de la scène ────────────────────────────────────
function buildAutoTitle (f: Fight | null): string {
  if (!f) return ''
  const actors = f.actors.filter(a => a.selected).map(a => a.name)
  const actorsPart = actors.length ? ` - ${actors.join(' vs ')}` : ''
  const yearPart   = f.movieYear ? ` (${f.movieYear})` : ''
  return `${f.movieTitle || ''}${actorsPart}${yearPart}`
}

// Titre affiché dans la liste (inclut les acteurs même pour les scènes sans title stocké)
function fightDisplayTitle (f: Fight): string {
  if (f.title) return f.title
  const actors = f.actors.map(a => a.name)
  const actorsPart = actors.length ? ` - ${actors.join(' vs ')}` : ''
  const yearPart   = f.movieYear ? ` (${f.movieYear})` : ''
  return `${f.movieTitle || ''}${actorsPart}${yearPart}`
}

watch(
  () => [
    form.value?.movieTitle,
    form.value?.movieYear,
    form.value?.actors?.filter(a => a.selected).map(a => a.name).join('|')
  ],
  () => {
    if (form.value) form.value.title = buildAutoTitle(form.value)
  }
)

// ── Films ─────────────────────────────────────────────────────
async function fetchMovies () {
  try {
    const { data } = await api.get('/api/movies')
    moviesList.value = data
  } catch { /* silencieux */ }
}

// ── Chorégraphes ──────────────────────────────────────────────
async function fetchChoreos () {
  try {
    const { data } = await api.get('/api/choreographers')
    choreoList.value = data
  } catch { /* silencieux */ }
}

async function searchChoreo () {
  if (!choreoSearch.value.trim()) return
  searchingChoreo.value = true
  choreoResults.value   = []
  try {
    const { data } = await api.get('/api/choreographers/search', { params: { q: choreoSearch.value } })
    choreoResults.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur de recherche' })
  } finally {
    searchingChoreo.value = false
  }
}

function openChoreoEdit (c: ChoreoItem) {
  editingChoreoId.value = c._id
  choreoForm.value      = { name: c.name }
  choreoDialog.value    = true
}

async function saveChoreoEdit () {
  if (!editingChoreoId.value || !choreoForm.value.name.trim()) return
  savingChoreo.value = true
  try {
    const { data } = await api.put(`/api/choreographers/${editingChoreoId.value}`, choreoForm.value)
    const idx = choreoList.value.findIndex(c => c._id === editingChoreoId.value)
    if (idx !== -1) choreoList.value[idx] = data
    const ridx = choreoResults.value.findIndex(c => c._id === editingChoreoId.value)
    if (ridx !== -1) choreoResults.value[ridx] = data
    $q.notify({ type: 'positive', message: 'Chorégraphe mis à jour !' })
    choreoDialog.value = false
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Erreur' })
  } finally {
    savingChoreo.value = false
  }
}

// ── Analyse YouTube ────────────────────────────────────────────
async function analyze () {
  if (!youtubeUrl.value) return
  analyzing.value  = true
  suggestions.value = []
  form.value       = null
  editingFightId.value = null
  try {
    const { data: ytData }    = await api.post('/api/youtube/info', { url: youtubeUrl.value })
    const { data: movieData } = await api.post('/api/movie/detect', { title: ytData.title })

    form.value = {
      youtubeUrl:    youtubeUrl.value,
      youtubeId:     ytData.youtubeId,
      youtubeTitle:  ytData.title,
      views:         ytData.views,
      thumbnail:     ytData.thumbnail,
      movieTitle:    movieData.movie?.title ?? ytData.title,
      movieYear:     movieData.movie?.year ?? undefined,
      movieTmdbId:   movieData.movie?.tmdbId ?? undefined,
      moviePoster:   movieData.movie?.poster ?? undefined,
      choreographer: movieData.movie?.choreographer ?? '',
      actors:        (movieData.cast ?? []).map((a: Actor) => ({ ...a, selected: false }))
    }

    suggestions.value = movieData.suggestions ?? []
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || "Erreur lors de l'analyse" })
  } finally {
    analyzing.value = false
  }
}

async function selectSuggestion (tmdbId: number) {
  try {
    const { data } = await api.get(`/api/movie/${tmdbId}`)
    if (form.value) {
      form.value.movieTitle     = data.movie.title
      form.value.movieYear      = data.movie.year
      form.value.movieTmdbId    = data.movie.tmdbId
      form.value.moviePoster    = data.movie.poster
      form.value.choreographer  = data.movie.choreographer ?? ''
      form.value.actors         = data.cast.map((a: Actor) => ({ ...a, selected: false }))
      suggestions.value         = []
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur lors du chargement du film' })
  }
}

// ── TMDB recherche manuelle ────────────────────────────────────
async function searchTmdb () {
  if (!tmdbSearch.value.trim()) return
  searchingTmdb.value = true
  tmdbResults.value   = []
  try {
    const { data } = await api.post('/api/movie/search', { query: tmdbSearch.value })
    tmdbResults.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur de recherche TMDB' })
  } finally {
    searchingTmdb.value = false
  }
}

async function applyTmdbResult (tmdbId: number) {
  try {
    const { data } = await api.get(`/api/movie/${tmdbId}`)
    if (form.value) {
      form.value.movieTitle    = data.movie.title
      form.value.movieYear     = data.movie.year
      form.value.movieTmdbId   = data.movie.tmdbId
      form.value.moviePoster   = data.movie.poster
      form.value.choreographer = data.movie.choreographer ?? ''
      form.value.actors        = data.cast.map((a: Actor) => ({ ...a, selected: false }))
      tmdbResults.value        = []
      tmdbSearch.value         = ''
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur lors du chargement du film' })
  }
}

// ── Édition d'un combat existant ──────────────────────────────
function editFight (fight: Fight) {
  editingFightId.value = fight._id ?? null
  youtubeUrl.value     = fight.youtubeUrl
  suggestions.value    = []
  tmdbResults.value    = []
  tmdbSearch.value     = ''
  form.value = {
    ...fight,
    actors: (fight.actors || []).map(a => ({ ...a, selected: true }))
  }
  tab.value = 'scenes'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm () {
  form.value = null
  editingFightId.value = null
  youtubeUrl.value = ''
  suggestions.value = []
  tmdbResults.value = []
  clearCastSearch()
  castSearch.value = ''
}

// ── Téléchargement vidéo ───────────────────────────────────────
async function downloadVideo () {
  if (!form.value) return
  downloading.value = true
  try {
    const { data } = await api.post('/api/youtube/download', {
      url:       form.value.youtubeUrl,
      youtubeId: form.value.youtubeId
    })
    form.value.videoPath = data.videoPath
    $q.notify({ type: 'positive', message: 'Vidéo téléchargée avec succès' })
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Erreur de téléchargement' })
  } finally {
    downloading.value = false
  }
}

// ── Sauvegarde / mise à jour combat ───────────────────────────
async function save () {
  if (!form.value) return
  saving.value = true
  try {
    const payload = {
      ...form.value,
      actors: form.value.actors
        .filter(a => a.selected)
        .map(({ selected: _, ...a }) => a)
    }

    if (editingFightId.value) {
      await fightsStore.update(editingFightId.value, payload as Fight)
      $q.notify({ type: 'positive', message: 'Combat mis à jour !' })
    } else {
      await fightsStore.create(payload as Fight)
      $q.notify({ type: 'positive', message: 'Combat enregistré !' })
    }

    resetForm()
    // Sync collections mises à jour côté serveur (fire-and-forget, on attend un peu)
    setTimeout(() => {
      fetchMovies()
      fetchChoreos()
      actorsStore.fetchAll()
    }, 500)
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Erreur lors de la sauvegarde' })
  } finally {
    saving.value = false
  }
}

async function deleteFight (id: string) {
  await fightsStore.remove(id)
  if (editingFightId.value === id) resetForm()
  $q.notify({ type: 'info', message: 'Combat supprimé' })
}

// ── Cast search dans le formulaire combat ──────────────────────
function clearCastSearch () {
  castLocalResults.value = []
  castTmdbResults.value  = []
  castSearchDone.value   = false
}

async function searchCastLocal () {
  if (!castSearch.value.trim()) return
  castSearchingLocal.value = true
  castSearchDone.value     = false
  castLocalResults.value   = []
  castTmdbResults.value    = []
  try {
    castLocalResults.value = await actorsStore.searchLocal(castSearch.value)
    castSearchDone.value   = true
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur de recherche locale' })
  } finally {
    castSearchingLocal.value = false
  }
}

async function searchCastTmdb () {
  if (!castSearch.value.trim()) return
  castSearchingTmdb.value = true
  castTmdbResults.value   = []
  try {
    castTmdbResults.value = await actorsStore.searchTmdb(castSearch.value)
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur de recherche TMDB' })
  } finally {
    castSearchingTmdb.value = false
  }
}

function isInCast (name: string) {
  return !!form.value?.actors.some(a => a.name.toLowerCase() === name.toLowerCase())
}

function addActorToFight (actor: { name: string; character: string; photo: string | null; tmdbId?: number }) {
  if (!form.value || isInCast(actor.name)) return
  form.value.actors.push({ ...actor, selected: true })
  castSearch.value       = ''
  castLocalResults.value = []
  castTmdbResults.value  = []
  castSearchDone.value   = false
}

// ── Acteurs — recherche (locale d'abord, TMDB ensuite) ────────
function clearActorSearch () {
  localActorResults.value = []
  actorResults.value      = []
  actorSearchDone.value   = false
}

async function searchActor () {
  if (!actorSearch.value.trim()) return
  searchingActor.value    = true
  actorSearchDone.value   = false
  localActorResults.value = []
  actorResults.value      = []
  try {
    localActorResults.value = await actorsStore.searchLocal(actorSearch.value)
    actorSearchDone.value   = true
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur de recherche locale' })
  } finally {
    searchingActor.value = false
  }
}

async function searchActorTmdb () {
  if (!actorSearch.value.trim()) return
  searchingTmdbActor.value = true
  actorResults.value       = []
  try {
    actorResults.value = await actorsStore.searchTmdb(actorSearch.value)
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur de recherche TMDB' })
  } finally {
    searchingTmdbActor.value = false
  }
}

function isActorSaved (tmdbId: number) {
  return actorsStore.actors.some(a => a.tmdbId === tmdbId)
}

async function addActorFromTmdb (result: TmdbPersonResult) {
  addingActorId.value = result.tmdbId
  try {
    await actorsStore.create({ tmdbId: result.tmdbId, name: result.name, photo: result.photo })
    $q.notify({ type: 'positive', message: `${result.name} ajouté !` })
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Erreur lors de l\'ajout' })
  } finally {
    addingActorId.value = null
  }
}

async function addActorManually () {
  if (!manualActorName.value.trim()) return
  try {
    await actorsStore.create({ name: manualActorName.value.trim() })
    $q.notify({ type: 'positive', message: `${manualActorName.value} ajouté !` })
    manualActorName.value = ''
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || "Erreur lors de l'ajout" })
  }
}

// ── Acteurs — édition ──────────────────────────────────────────
const actorsWithStats = computed(() => {
  return actorsStore.actors.map(a => {
    const sceneCount = fightsStore.fights.filter(f =>
      f.actors.some(fa =>
        (a.tmdbId && fa.tmdbId === a.tmdbId) ||
        (fa.name || '').toLowerCase() === (a.name || '').toLowerCase()
      )
    ).length
    return { ...a, sceneCount }
  })
})

const filteredActors = computed(() => {
  const q = actorFilter.value.toLowerCase()
  return q
    ? actorsWithStats.value.filter(a => a.name.toLowerCase().includes(q))
    : actorsWithStats.value
})

function openActorEdit (actor: ActorProfile) {
  editingActorId.value = actor._id ?? null
  actorForm.value = {
    name:         actor.name,
    photo:        actor.photo ?? '',
    birthDate:    actor.birthDate
      ? new Date(actor.birthDate).toISOString().slice(0, 10)
      : '',
    placeOfBirth: actor.placeOfBirth ?? '',
    biography:    actor.biography ?? ''
  }
  actorDialog.value = true
}

async function saveActorEdit () {
  if (!editingActorId.value || !actorForm.value.name?.trim()) return
  savingActor.value = true
  try {
    await actorsStore.update(editingActorId.value, actorForm.value)
    $q.notify({ type: 'positive', message: 'Acteur mis à jour !' })
    actorDialog.value = false
  } catch (err: any) {
    $q.notify({ type: 'negative', message: err.response?.data?.error || 'Erreur lors de la mise à jour' })
  } finally {
    savingActor.value = false
  }
}

async function deleteActor (id: string) {
  await actorsStore.remove(id)
  $q.notify({ type: 'info', message: 'Acteur supprimé' })
}

// ── Suggestions ───────────────────────────────────────────────
interface SuggestionItem { _id: string; name?: string; youtubeUrl?: string; message: string; read: boolean; createdAt: string }
const suggestionsList     = ref<SuggestionItem[]>([])
const loadingSuggestions  = ref(false)
const unreadSuggestions   = computed(() => suggestionsList.value.filter(s => !s.read).length)

async function fetchSuggestions () {
  loadingSuggestions.value = true
  try {
    const { data } = await api.get('/api/suggestions')
    suggestionsList.value = data
  } catch { /* silencieux */ } finally {
    loadingSuggestions.value = false
  }
}

async function markRead (id: string) {
  try {
    const { data } = await api.patch(`/api/suggestions/${id}/read`)
    const idx = suggestionsList.value.findIndex(s => s._id === id)
    if (idx !== -1) suggestionsList.value[idx] = data
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur' })
  }
}

async function deleteSuggestion (id: string) {
  try {
    await api.delete(`/api/suggestions/${id}`)
    suggestionsList.value = suggestionsList.value.filter(s => s._id !== id)
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur lors de la suppression' })
  }
}

// ── Historique vues ───────────────────────────────────────────
interface ViewSnap { _id: string; fightId: string; views: number; recordedAt: string }
const viewsDialog    = ref(false)
const loadingHistory = ref(false)
const viewsHistory   = ref<ViewSnap[]>([])

// Constantes du graphe SVG
const SVG_W   = 480
const SVG_H   = 180
const PAD_L   = 58
const PAD_R   = 16
const PAD_T   = 12
const PAD_B   = 36
const INNER_W = SVG_W - PAD_L - PAD_R
const INNER_H = SVG_H - PAD_T - PAD_B

const viewsGrowth = computed(() => {
  if (viewsHistory.value.length < 2) return 0
  return viewsHistory.value[viewsHistory.value.length - 1].views - viewsHistory.value[0].views
})

const chartPoints = computed(() => {
  const pts = viewsHistory.value
  if (pts.length === 0) return { points: [], polyline: '', areaPath: '', yLabels: [], xLabels: [] }

  const times  = pts.map(p => new Date(p.recordedAt).getTime())
  const views  = pts.map(p => p.views)
  const tMin   = Math.min(...times), tMax = Math.max(...times)
  const vMax   = Math.max(...views) * 1.08 || 1

  const toX = (t: number) => PAD_L + (tMax === tMin ? INNER_W / 2 : ((t - tMin) / (tMax - tMin)) * INNER_W)
  const toY = (v: number) => PAD_T + INNER_H - (v / vMax) * INNER_H

  const points = pts.map((p, i) => ({
    key:   String(i),
    x:     toX(new Date(p.recordedAt).getTime()),
    y:     toY(p.views),
    views: p.views,
    date:  new Date(p.recordedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }))

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const first    = points[0], last = points[points.length - 1]
  const bot      = PAD_T + INNER_H
  const areaPath = `M ${first.x} ${bot} ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${last.x} ${bot} Z`

  // 4 graduations Y
  const yLabels = [0, 1/3, 2/3, 1].map(r => ({
    y:     toY(vMax * r),
    label: formatViews(Math.round(vMax * r))
  }))

  // Labels X : max 6 points, espacés
  const step = Math.max(1, Math.ceil(pts.length / 6))
  const xLabels = points
    .filter((_, i) => i % step === 0 || i === points.length - 1)
    .map(p => ({
      x:     p.x,
      label: new Date(pts[parseInt(p.key)].recordedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    }))

  return { points, polyline, areaPath, yLabels, xLabels }
})

async function openViewsHistory () {
  if (!editingFightId.value) return
  viewsDialog.value    = true
  loadingHistory.value = true
  viewsHistory.value   = []
  try {
    const { data } = await api.get(`/api/fights/${editingFightId.value}/views-history`)
    viewsHistory.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'Erreur chargement historique des vues' })
  } finally {
    loadingHistory.value = false
  }
}

// ── Utilitaires ───────────────────────────────────────────────
function formatViews (n?: number) {
  if (!n) return '–'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
</script>
