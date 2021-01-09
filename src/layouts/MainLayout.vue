<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-dark">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-avatar>
          <img src="/icons/vs-240x240.png">
        </q-avatar>
        <q-toolbar-title class="text-blue">
          Versus
        </q-toolbar-title>

      <q-btn flat round dense icon="mdi-google-plus" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="text-white bg-dark"
    >
      <q-list>
        <q-item-label
          header
        >
          Aide
        </q-item-label>
        <MenuLeft
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import MenuLeft from 'components/MenuLeft/MenuLeft.vue'
import linksLeft from 'components/MenuLeft/menuleft';

import { defineComponent, ref } from '@vue/composition-api'

export default defineComponent({
  name: 'MainLayout',
  components: { MenuLeft },
  setup () {
    const leftDrawerOpen = ref(false);
    const essentialLinks = ref(linksLeft);

    return { leftDrawerOpen, essentialLinks }
  }
})
</script>
