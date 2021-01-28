<template>
    <div class="Title">
      <q-input outlined bottom-slots
               v-model="title"
               label="Titre de la vidéo (sera rempacé par Film - x vs y)"
               counter
               maxlength="150"
               :dense="dense">
        <template v-slot:hint>
          Field hint
        </template>
        <template v-slot:append>
          <q-btn v-if="!video._id"
                 color="primary"
                 label="Créer"
                 @click="createVideo(
                   {
                   title: title
                   }
                 )"/>
        </template>
      </q-input>
    </div>
</template>

<script>
    import { mapGetters , mapActions } from 'vuex'

    export default {
        props: {
        },
      data () {
        return {
          title:null,
          dense: false
        }
      },
      computed: {
        ...mapGetters('newvideo', ['video'])
      },
      mounted() {
          this.title = this.video.title
      },

      methods: {
        ...mapActions('newvideo', ['createVideo']),
      }
    };
</script>
