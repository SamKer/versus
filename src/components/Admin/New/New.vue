<template>
  <div class="New">
    <Error/>
    <q-toolbar class="bg-black text-white">
      <NbNews/>
      <q-toolbar-title>
        Montage Vidéo
      </q-toolbar-title>
      <SelectNewsVideos/>
      <Save/>
      <AddNew/>
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
  import AddNew from './AddNew/AddNew'
  import Save from './Save/Save'

  export default {
    components: {
      Save,
      AddNew,
      Editor,
      SelectNewsVideos,
      NbNews,
      Error
    },
    props: {}
  }

</script>
