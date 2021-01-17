<template>
    <div class="New">
      <q-toolbar class="bg-black text-white">
        <q-btn flat round dense icon="movie">
          <q-badge floating color="red">{{ videosNews.length }}</q-badge>
        </q-btn>
        <q-toolbar-title>
          Montage Vidéo
        </q-toolbar-title>
        <q-btn flat round dense icon="sim_card" class="q-mr-xs" title="Save"/>
        <q-btn flat round dense icon="gamepad" @click="newVideo" title="New"/>
      </q-toolbar>

      <div class="q-pa-md" v-if="newvid">
        <q-input outlined label="Url Video" @keyup.enter="validUrl"/>
        <div v-if="srcvid">
<!--          <p>q-video</p>-->
          <q-video
            id="video"
            ref="video"
            :src="srcvid"
            :ratio="16/9"
          />
<!--          <video :src="srcvid" controls />-->
<!--          <p>q-media-player</p>-->
<!--        <q-media-player-->
<!--          ref="video"-->
<!--          id="video"-->
<!--          type="video"-->
<!--          :source="srcvid"-->
<!--          controls-->
<!--          autoplay-->
<!--          @play="syncCanvas"-->
<!--          @error="videoError"-->
<!--          />-->
<!--          <p>q-video-iframe</p>-->
<!--          <div class="q-video">-->
<!--      <iframe-->
<!--        :src="srcvid"-->
<!--        frameborder="0"-->
<!--        allowfullscreen-->
<!--      />-->
<!--    </div>-->
<!--          <p>v-pip</p>-->
<!--          <v-pip>-->
<!--            :video-options="videoOptions"-->
<!--            :button-options="buttonOptions"-->
<!--            @video-in-pip="handlePIP"-->
<!--            @requesting-pip-failure="videoError"-->
<!--            @exiting-pip-failure="videoError"-->
<!--          </v-pip>-->
          <canvas ref="canvas" id="canvas" :width="canvas.width" :height="canvas.height">waiting video</canvas>
        </div>
      </div>
    </div>
</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
export default {
  //components: { VPip },
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
      }
    }
  },

  mounted () {
    this.getVideosNews()
  },

  computed: {
    //...mapState('newvideo', ['videosNews']),
    ...mapGetters('newvideo', ['videosNews'])
  },

  methods: {
    ...mapActions('newvideo', ['getVideosNews']),

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
