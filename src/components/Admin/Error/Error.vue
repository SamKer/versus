<template>
    <div class="Error">
      <q-dialog
        v-model="show"
      >
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">Error</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            {{ error }}
          </q-card-section>

          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn flat label="OK" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
</template>

<script>
  import { mapGetters } from 'vuex'
    export default {
       data () {
         return {
           show: false
         }
       },

      computed: {
          ...mapGetters('newvideo', ['error'])
      }
    };
</script>
