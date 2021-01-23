<template>
    <div class="Error">
      <q-dialog
        v-model="showError"
      >
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">Error</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            {{ error }}
          </q-card-section>

          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn flat label="OK" v-close-popup @click="setError(false)" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
    export default {
       data () {
         return {
         }
       },
      computed: {
          ...mapGetters('newvideo', ['error', 'showError'])
       },
      methods: {
         ...mapActions('newvideo', ['setError'])
      }
    };
</script>
