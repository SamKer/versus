<template>
  <div class="New">
    <Error/>
    <q-toolbar class="bg-black text-white">
      <NbNews/>
      <q-toolbar-title>
        Montage Vidéo
      </q-toolbar-title>
      <SelectNewsVideos/>
      <q-btn flat round dense icon="sim_card" class="q-mr-xs" title="Save"/>
      <q-btn flat round dense icon="gamepad" @click="newVideo" title="New"/>
    </q-toolbar>

    <Editor/>
  </div>
</template>

<script>
  import { mapActions, mapGetters } from 'vuex'
  import Error from '../Error/Error'
  import NbNews from './NbNews/NbNews'
  import SelectNewsVideos from './SelectNewsVideos/SelectNewsVideos'
  import Editor from './Editor/Editor'

  export default {
    components: {
      Editor,
      SelectNewsVideos,
      NbNews,
      Error
    },
    props: {},
    data () {
      return {

      }
    },



    methods: {
      newVideo () {
        // https://www.youtube.com/embed/f-q5FLtlUOI
        // proxied by vue
        // https://i.ytimg.com/vi_webp/f-q5FLtlUOI/maxresdefault.webp
        this.newvid = true
      }
    }
  }

</script>
