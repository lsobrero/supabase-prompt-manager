<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center bg-grey-2">
        <q-card class="q-pa-md shadow-2" style="width: 400px; max-width: 90vw;">
          <q-card-section class="text-center">
            <div class="text-h5 q-mb-md">Prompt Manager</div>
            <div class="text-subtitle1 text-grey">Sign in to your account</div>
          </q-card-section>

          <q-card-section>
            <q-form @submit="handleLogin">
              <q-input 
                v-model="email" 
                label="Email" 
                type="email" 
                outlined 
                class="q-mb-md" 
                :rules="[val => !!val || 'Email is required']"
              />
              <q-input 
                v-model="password" 
                label="Password" 
                type="password" 
                outlined 
                class="q-mb-md" 
                :rules="[val => !!val || 'Password is required']"
              />
              
              <q-btn 
                type="submit"
                color="primary" 
                class="full-width q-mt-md" 
                label="Sign In" 
                :loading="loading" 
              />
            </q-form>
            
            <div v-if="errorMsg" class="text-negative text-center q-mt-md bg-red-1 q-pa-sm rounded-borders">
              {{ errorMsg }}
            </div>
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

async function handleLogin() {
  if (!email.value || !password.value) return;

  loading.value = true
  errorMsg.value = ''
  
  try {
     await authStore.signInWithEmail(email.value, password.value)
     router.push('/') 
  } catch(err: any) {
     errorMsg.value = err.message || 'Failed to sign in'
  } finally {
     loading.value = false
  }
}
</script>
