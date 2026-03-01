# Implementing Supabase Authentication in Vue 3 

Managing Authentication and Authorization with Supabase and Vue 3 involves three main concepts:
1. **Handling the Auth State**: Keeping track of who is logged in via Pinia.
2. **Route Guards**: Protecting specific pages from unauthenticated users.
3. **Database RLS (Row Level Security)**: Ensuring the database only allows users to fetch/edit their own data.

Here is a step-by-step guide on how we can update our frontend to support this.

## 1. Create an Auth Store (Pinia)

We need a central place to hold the current user session. Create a new file `src/stores/authStore.ts`.

```typescript
import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('authStore', {
  state: () => ({
    user: null as User | null,
    loading: true
  }),
  actions: {
    // 1. Initialize Auth State
    async initialize() {
      // Get current session on load
      const { data: { session } } = await supabase.auth.getSession()
      this.user = session?.user || null
      this.loading = false

      // Listen for changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user || null
      })
    },
    
    // 2. Login Method
    async signInWithEmail(email: string, password: string) {
       const { error } = await supabase.auth.signInWithPassword({ email, password })
       if (error) throw error;
    },
    
    // 3. Logout Method
    async signOut() {
       const { error } = await supabase.auth.signOut()
       if (error) throw error;
    }
  }
})
```

*Don't forget to call `useAuthStore().initialize()` inside your `App.vue` or `main.ts` so it runs immediately on page load!*

## 2. Protect Routes with Vue Router

We don't want unauthorized users hitting the `PromptManager` directly. We update `src/router/index.ts` to use Navigation Guards.

```typescript
import { createRouter, createWebHistory } from 'vue-router'
// Assuming you created authStore.ts
import { useAuthStore } from '../stores/authStore' 

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    // Requires Auth!
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('../pages/IndexPage.vue') },
      { path: 'tags', component: () => import('../pages/TagManagerPage.vue') }
    ]
  },
  {
    path: '/login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { requiresGuest: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// === The Route Guard ===
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Ensure the store has loaded the session from local storage
  if (authStore.loading) await authStore.initialize()
  
  const isAuthenticated = !!authStore.user

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect to login if trying to access protected route
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    // Redirect to dashboard if logged in user tries hitting '/login'
    next('/')
  } else {
    next() // Proceed normally
  }
})

export default router
```

## 3. Build a Login UI Component

Create a `LoginPage.vue` that uses the Quasar UI and your new `authStore`.

```vue
<!-- src/pages/LoginPage.vue -->
<template>
  <q-page class="flex flex-center">
    <q-card style="width: 350px;">
      <q-card-section>
        <div class="text-h6">Log In</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="email" label="Email" type="email" outlined class="q-mb-md" />
        <q-input v-model="password" label="Password" type="password" outlined class="q-mb-md" />
        
        <q-btn color="primary" class="full-width" label="Sign In" @click="handleLogin" :loading="loading" />
        <div v-if="errorMsg" class="text-negative q-mt-sm">{{ errorMsg }}</div>
      </q-card-section>
    </q-card>
  </q-page>
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
  loading.value = true
  errorMsg.value = ''
  try {
     await authStore.signInWithEmail(email.value, password.value)
     router.push('/') // Success! Redirect to Dashboard
  } catch(err: any) {
     errorMsg.value = err.message
  } finally {
     loading.value = false
  }
}
</script>
```

## 4. Secure the Database (Row Level Security - RLS)

If user A logs in, they should not see user B's Prompts. Right now, our database is entirely open. 

You must drop the "Enable all access" policies in Supabase SQL editor and link Prompts to the builtin `auth.uid()`.

**1. Create a `user_id` column:**
```sql
ALTER TABLE prompts ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

**2. Update the `promptStore.ts` insertion:**
*Supabase JS client will automatically attach the JWT token of the logged-in user to every request. Supabase postgres will then know who the user is.* You usually don't even have to pass the `user_id` from the frontend, you just use RLS defaults.

**3. Replace old Policies with Secure Policies:**
```sql
-- Prompts can only be viewed by their creator
CREATE POLICY "Users can view own prompts" ON prompts FOR SELECT 
USING (auth.uid() = user_id);

-- Prompts can only be created by the logged in user
CREATE POLICY "Users can insert own prompts" ON prompts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Prompts can only be updated/deleted by their creator
CREATE POLICY "Users can update own prompts" ON prompts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" ON prompts FOR DELETE 
USING (auth.uid() = user_id);
```

Once RLS is enabled, the Supabase Postgres database itself will act as your final validator. Even if a user bypasses the Vue router, the DB will reject requests to fetch arrays of prompts that do not belong to their `auth.uid()`.
