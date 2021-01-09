<template>
  <q-page class="row items-center justify-evenly">
    <Home/>
  </q-page>
</template>

<script lang="ts">
import { Todo, Meta } from 'components/models'
import { defineComponent, ref } from '@vue/composition-api'
import Home from "components/Home/Home.vue";
export default defineComponent({
  name: 'PageIndex',
  components: { Home }
})
</script>
