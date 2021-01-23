<template>
  <div class="Editor">
    <div class="q-pa-md" v-if="video">
      <Id/>
      <Title/>
      <UrlOrigin/>
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
  import { mapGetters } from 'vuex'
  import Id from './Id/Id'
  import Title from './Title/Title'
  import UrlOrigin from './UrlOrigin/UrlOrigin'
  export default {
    components: { UrlOrigin, Title, Id },
    props: {},
    data () {
      return {
        canvasContext: null,
        canvas: {
          width: 160,
          height: 90
        },
        newvid: null,
        srcvid: null
      }
    },
    computed: {
      ...mapGetters('newvideo', ['video'])
    },
    methods: {

    }
  }
</script>
