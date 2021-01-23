<template>
  <div class="Id">
    <q-input v-if="video._id"
             outlined disable
             v-model="video._id"
             label="identifiant"
             :dense="dense">{{video._id}}
    </q-input>
  </div>
</template>

<script>
  import {mapGetters} from 'vuex'
  export default {
    props: {},
    data () {
      return {
        dense: false
      }
    },
    computed: {
      ...mapGetters('newvideo', ['video'])
    },
  }
</script>
