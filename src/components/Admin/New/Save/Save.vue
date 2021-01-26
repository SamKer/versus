<template>
    <div class="Save">
      <q-btn flat round dense icon="sim_card" class="q-mr-xs" title="Save" @click="save"/>
    </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
    export default {
        props: {
        },
      computed: {
          ...mapGetters('newvideo', ['video'])
      },
      methods: {
          ...mapActions('newvideo', ['saveVideo']),
        save() {
            this.saveVideo(this.video)
        }
      }
    };
</script>
