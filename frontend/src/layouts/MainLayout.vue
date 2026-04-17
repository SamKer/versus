<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-dark">
      <q-toolbar>
        <q-toolbar-title shrink>
          <router-link to="/" class="versus-title text-h5 no-underline" style="color: inherit; text-decoration: none;">
            VERSUS
          </router-link>
        </q-toolbar-title>
        <div class="text-caption text-grey q-ml-sm gt-xs ellipsis">all fight look like street fighter</div>
        <q-space />
        <!-- Connecté : lien Admin + déconnexion -->
        <template v-if="authStore.isAuthenticated">
          <q-btn flat icon="admin_panel_settings" :label="$q.screen.gt.xs ? 'Admin' : ''" to="/admin" class="q-mr-xs">
            <q-badge v-if="unreadCount > 0" color="negative" floating rounded>{{ unreadCount }}</q-badge>
          </q-btn>
          <q-btn flat icon="menu_book" :label="$q.screen.gt.xs ? 'Doc' : ''" href="/docs" target="_blank" class="q-mr-xs" title="Documentation" />
          <q-btn flat round icon="logout" @click="authStore.logout()" title="Déconnexion" />
        </template>
        <!-- Non connecté -->
        <q-btn v-else flat round icon="lock" title="Connexion administrateur" @click="loginWithGoogle" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { api } from 'boot/axios'

const $q        = useQuasar()
const authStore = useAuthStore()
const unreadCount = ref(0)

async function fetchUnread () {
  try {
    const { data } = await api.get('/api/suggestions/unread-count')
    unreadCount.value = data.count
  } catch { /* silencieux */ }
}

watch(() => authStore.isAuthenticated, (v) => { if (v) fetchUnread() }, { immediate: true })

function loginWithGoogle () {
  window.location.href = `${import.meta.env.VITE_API_URL || ''}/auth/google`
}
</script>
