import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Export a robust client that won't crash the Vue app on boot if credentials are missing
export const supabase: SupabaseClient | any = (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: { message: 'Supabase credentials missing in .env' } }) }) }),
            insert: () => Promise.resolve({ error: { message: 'Supabase credentials missing in .env' } }),
            upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase credentials missing in .env' } }) }) }),
            update: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase credentials missing in .env' } }) }),
            delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase credentials missing in .env' } }) }),
        })
    }

if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
    console.error('Supabase credentials missing. Please update your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}
