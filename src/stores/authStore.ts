import { defineStore } from 'pinia'
import { supabase } from '../supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('authStore', {
    state: () => ({
        user: null as User | null,
        loading: true
    }),
    actions: {
        async initialize() {
            // Get current session on load
            const { data: { session } } = await supabase.auth.getSession()
            this.user = session?.user || null
            this.loading = false

            // Listen for changes
            supabase.auth.onAuthStateChange((_event, session) => {
                this.user = session?.user || null
            })
        },

        async signInWithEmail(email: string, password: string) {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error;
        },

        async signOut() {
            const { error } = await supabase.auth.signOut()
            if (error) throw error;
        }
    }
})
