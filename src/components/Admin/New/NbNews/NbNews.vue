<template>
    <div class="NbNews">
      <q-btn flat round dense icon="movie">
        <q-badge floating color="red">{{ videosNews.length }}</q-badge>
      </q-btn>
    </div>
</template>

<script>
  import { mapGetters } from 'vuex'
    export default {
        props: {
        },
      computed: {
    ...mapGetters('newvideo', ['videosNews'])
  },
    };
</script>
