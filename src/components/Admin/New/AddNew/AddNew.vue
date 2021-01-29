<template>
    <div class="AddNew">
      <q-btn flat round dense icon="gamepad" @click="createVideo" title="New"/>
    </div>
</template>

<script>
  import { mapActions } from 'vuex'
    export default {
        props: {
        },
      methods: {
          ...mapActions('newvideo', ['createVideo'])
      }
    };
</script>
