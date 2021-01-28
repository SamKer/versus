<template>
  <div class="UrlOrigin">
    <q-input outlined bottom-slots
             v-model="urlOrigin"
             label="Url Video"
             counter maxlength="250"
             :dense="dense">
      <template v-slot:hint>
        Field hint
      </template>
      <template v-slot:append>
        <q-btn color="primary"
               label="Télécharger"
               @click="downloadYT(video)"/>
      </template>
    </q-input>
    <div class="q-pa-md">
    <q-linear-progress
      size="25px"
      :value="video.progress/100" color="blue">
      <div class="absolute-full flex flex-center">
        <q-badge color="white" text-color="accent"
                 :label="progressLabel" />
      </div>
    </q-linear-progress>
  </div>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'

  export default {
    props: {},
    data () {
      return {
        urlOrigin: null,
        dense: false,
        // canvasContext: null,
        // canvas: {
        //   width: 160,
        //   height: 90
        // },
        // newvid: null,
        // srcvid: null
      }
    },
    computed: {
      ...mapGetters('newvideo', ['video']),
      progressLabel () {
        return this.video.progress.toFixed(0) + '%'
      }
    },
    mounted () {
      this.urlOrigin = this.video.urlOrigin
    },
    methods: {
      ...mapActions('newvideo', ['downloadYT']),

      // validUrl (e) {
      //   this.downloadYT(e.target.value)
      //   this.createCanvas()
      // },
      //
      // createCanvas () {
      //   setTimeout(() => {
      //     console.log(this.$refs.video.$el.firstChild)
      //     this.canvasContext = this.$refs.canvas.getContext('2d')
      //     this.$refs.video.$on('play', this.syncCanvas, {
      //       capture: true,
      //       passive: true
      //     })
      //     //this.$refs.video.$media.addEventListener("play", this.syncCanvas)
      //   }, 500)
      // },
      //
      // syncCanvas () {
      //   console.log('test sync')
      //   this.canvasContext.drawImage(this.$refs.video.$el, 0, 0, 427, 240)
      //   setTimeout(this.syncCanvas, 0)
      // }
    }
  }
</script>
