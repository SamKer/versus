<template>
  <div class="Tabs q-pa-md">
    <div class="q-gutter-y-md">
      <q-card>
        <q-tabs
          v-model="tab"
          inline-label
          outside-arrows
          mobile-arrows
          class="bg-primary text-white shadow-2"
        >
          <q-tab name="dashboard" icon="mail" label="Dashboard" />
          <q-tab name="news" icon="mail" label="New" />
          <q-tab name="fighters" icon="alarm" label="Fighters" />
          <q-tab name="movies" icon="movie" label="Movies" />
          <q-tab name="photos" icon="photo" label="Photos" />
          <q-tab name="videos" icon="slow_motion_video" label="Videos" />
          <q-tab name="types" icon="slow_motion_video" label="Categories" />
        </q-tabs>
        <q-separator/>
        <q-tab-panels
          v-model="tab"
          animated
        >
          <q-tab-panel name="dashboard">
            <Dashboard/>
          </q-tab-panel>
          <q-tab-panel name="news">
            <New/>
          </q-tab-panel>
          <q-tab-panel name="fighters">
            <div class="text-h4 q-mb-md">Fighters</div>
            <p>sqdft, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
          </q-tab-panel>
          <q-tab-panel name="movies">
            <div class="text-h4 q-mb-md">Films</div>
            <p>sqdft, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis praesentium cumque magnam odio iure quidem, quod illum numquam possimus obcaecati commodi minima assumenda consectetur culpa fuga nulla ullam. In, libero.</p>
          </q-tab-panel>
          <q-tab-panel name="photos">
            photos
          </q-tab-panel>
          <q-tab-panel name="videos">
            Vidéos
          </q-tab-panel>
          <q-tab-panel name="types">
            Catégories
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </div>
</template>

<script>
    import Dashboard from '../Dashboard/Dashboard'
    import New from '../New/New'
    export default {
      components: { New, Dashboard },
      props: {
        },
      data() {
          return {
            tab: 'dashboard'
          }
      }
    };
</script>
