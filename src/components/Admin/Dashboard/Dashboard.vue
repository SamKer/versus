<template>
  <div class="Dashboard">
    <div class="q-px-lg q-pb-md">
      <q-timeline color="primary">
        <!--      <q-timeline-entry heading>-->
        <!--        Timeline heading-->
        <!--      </q-timeline-entry>-->

        <q-timeline-entry
          v-for="video in videos"
          :key="video._id"
          :title="video.title"
          :subtitle="'Mise à jour le ' + video.dateUpdated"
        >
          <q-video
            id="video"
            ref="video._id"
            :src="video.urlOriginEmbeded"
            :ratio="16/9"
          />
          <div>
            Description
          </div>
        </q-timeline-entry>
      </q-timeline>
    </div>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'

  export default {
    props: {},
    mounted () {
      this.getVideos()
    },
    computed: {
      ...mapGetters('dashboard', ['videos'])
    },
    methods: {
      ...mapActions('dashboard', ['getVideos'])
    }
  }
</script>
