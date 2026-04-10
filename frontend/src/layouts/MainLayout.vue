<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-dark">
      <q-toolbar>
        <q-toolbar-title>
          <router-link to="/" class="versus-title text-h5 no-underline" style="color: inherit; text-decoration: none;">
            VERSUS
          </router-link>
          <span class="text-caption text-grey q-ml-sm">all fight look like street fighter</span>
        </q-toolbar-title>
        <!-- Connecté : lien Admin + déconnexion -->
        <template v-if="authStore.isAuthenticated">
          <q-btn flat icon="admin_panel_settings" label="Admin" to="/admin" class="q-mr-xs" />
          <q-btn flat round icon="logout" @click="authStore.logout()" title="Déconnexion" />
        </template>

        <!-- Non connecté : bouton Google -->
        <q-btn
          v-else
          flat
          round
          icon="lock"
          title="Connexion administrateur"
          @click="loginWithGoogle"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useAuthStore } from 'stores/auth'

const authStore = useAuthStore()

function loginWithGoogle () {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`
}
</script>
