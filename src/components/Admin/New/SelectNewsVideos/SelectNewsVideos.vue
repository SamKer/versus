<template>
  <div class="SelectNewsVideos">
    <q-select
      v-model="model"
      :options="options"
      outlined
      label="en cours de création"
      @filter="filterSelectVideos"
      @input="loadNewVideo"
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-grey">
            No results
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  export default {
    props: {},
    data () {
      return {
        model: null,
        options: null
      }
    },
    mounted () {
      this.getVideosNews()
    },

    computed: {
      ...mapGetters('newvideo', ['videosNews'])
    },

    methods: {
      ...mapActions('newvideo', ['getVideosNews', 'loadNewVideo']),

      filterSelectVideos (val, update, abort) {
        if (this.options !== null) {
          // already loaded
          update()
          return
        }

        setTimeout(() => {
          update(() => {
            this.options = []
            for (let i = 0; i < this.videosNews.length; i++) {
              let v = this.videosNews[i]
              this.options.push({
                label: v.title,
                value: v._id
              })
            }
          })
        }, 500)
      }
    }
  }
</script>
