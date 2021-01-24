<template>
    <div class="AddNew">
      <q-btn flat round dense icon="gamepad" @click="newVideo" title="New"/>
    </div>
</template>

<script>
  import { mapActions } from 'vuex'
    export default {
        props: {
        },
      methods: {
          ...mapActions('newvideo', ['newVideo'])
      }
    };
</script>
