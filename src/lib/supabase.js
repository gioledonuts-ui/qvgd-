import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when Supabase credentials are configured. Otherwise the app runs in demo (local) mode. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase =
  isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: { params: { eventsPerSecond: 20 } },
      })
    : null
