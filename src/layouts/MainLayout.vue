<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>
          Prompt Manager
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header>
          Navigation
        </q-item-label>
        <q-item clickable tag="a" to="/">
          <q-item-section avatar>
            <q-icon name="list" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Prompts</q-item-label>
            <q-item-label caption>Manage Gemini Prompts</q-item-label>
          </q-item-section>
        </q-item>
        
        <q-item clickable tag="a" to="/tags">
          <q-item-section avatar>
            <q-icon name="label" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Tags</q-item-label>
            <q-item-label caption>Manage System Tags</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      
      <q-separator />
      
      <q-list class="q-mt-auto">
        <q-item clickable @click="handleLogout" class="text-negative">
          <q-item-section avatar>
            <q-icon name="logout" color="negative"/>
          </q-item-section>
          <q-item-section>
            <q-item-label>Logout</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'

const leftDrawerOpen = ref(false)
const authStore = useAuthStore()
const router = useRouter()

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

async function handleLogout() {
  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
</script>
