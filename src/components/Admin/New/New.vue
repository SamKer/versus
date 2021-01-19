<template>
    <div class="New">
      <Error/>
      <q-toolbar class="bg-black text-white">
        <q-btn flat round dense icon="movie">
          <q-badge floating color="red">{{ videosNews.length }}</q-badge>
        </q-btn>
        <q-toolbar-title>
          Montage Vidéo
        </q-toolbar-title>
        <q-select
          v-model="model"
          :options="options"
          outlined
          label="en cours de création"
          @filter="filterSelectVideos"
          @input="loadNewVideo"
        ><template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              No results
            </q-item-section>
          </q-item>
        </template>
        </q-select>
        <q-btn flat round dense icon="sim_card" class="q-mr-xs" title="Save"/>
        <q-btn flat round dense icon="gamepad" @click="newVideo" title="New"/>
      </q-toolbar>

      <div class="q-pa-md" v-if="newvid">
        <q-input outlined bottom-slots v-model="title" label="Titre de la vidéo (sera rempacé par Film - x vs y)" counter maxlength="50" :dense="dense">
        <template v-slot:hint>
          Field hint
        </template>
        <template v-slot:append>
          <q-btn color="primary"
                 label="Créer"
                 @click="createVideo(
                   {
                   title: title
                   }
                 )"/>
        </template>
      </q-input>
        <q-input outlined bottom-slots v-model="url" label="Url Video" counter maxlength="250" :dense="dense">
          <template v-slot:hint>
          Field hint
        </template>
        <template v-slot:append>
          <q-btn color="primary" label="Télécharger"  @click="validUrl"/>
        </template>
        </q-input>
        <div v-if="srcvid">
          <q-video
            id="video"
            ref="video"
            :src="srcvid"
            :ratio="16/9"
          />
          <canvas ref="canvas" id="canvas" :width="canvas.width" :height="canvas.height">waiting video</canvas>
        </div>
      </div>
    </div>
</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import Error from '../Error/Error'
export default {
  components: { Error },
  props: {

  },
  data () {
    return {
      newvid: null,
      srcvid: null,
      canvasContext: null,
      canvas: {
        width: 160,
        height: 90
      },
      model: null,
      options: null,
      title: '',
      url: '',
      dense: false
    }
  },

  mounted () {
    this.getVideosNews()
  },

  computed: {
    //...mapState('newvideo', ['videosNews']),
    ...mapGetters('newvideo', ['videosNews','video'])
  },

  methods: {
    ...mapActions('newvideo', ['getVideosNews', 'createVideo', 'loadNewVideo']),

    filterSelectVideos (val, update, abort) {
      if (this.options !== null) {
        // already loaded
        update()
        return
      }

      setTimeout(() => {
        update(() => {
          this.options = []
          for(let i = 0; i < this.videosNews.length;i++) {
            let v = this.videosNews[i];
            this.options.push({
              label: v.title,
              value: v._id
            })
          }
        })
      }, 500)
    },

    videoError (e) {
      console.log(e)
    },

    newVideo () {
      // https://www.youtube.com/embed/f-q5FLtlUOI
      // proxied by vue
      // https://i.ytimg.com/vi_webp/f-q5FLtlUOI/maxresdefault.webp
      this.newvid = true
    },

    async downloadYT(src) {
        let r = await fetch('/ytdl', {url: src})

    },

    validUrl (e) {
      this.srcvid = e.target.value
      this.downloadYT(this.srcvid)
      this.createCanvas()
    },

    createCanvas () {
      setTimeout(() => {
        console.log(this.$refs.video.$el.firstChild);
        this.canvasContext = this.$refs.canvas.getContext('2d')
        this.$refs.video.$on("play", this.syncCanvas, {capture: true, passive: true})
        //this.$refs.video.$media.addEventListener("play", this.syncCanvas)
      }, 500)
    },

    syncCanvas () {
      console.log('test sync')
      this.canvasContext.drawImage(this.$refs.video.$el, 0, 0, 427, 240)
      setTimeout(this.syncCanvas, 0)
    }
  }
}

</script>
