import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
)

if (!isSupabaseConfigured) {
  console.info(
    '[Zion Atelier] Supabase is running in local fallback mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local for database persistence.'
  )
}

/**
 * Creates a Supabase client configured with dynamic Clerk JWT authentication.
 * Attaches the Authorization header with the Clerk token on each database request.
 * 
 * @param {Function|null} getToken - Clerk's getToken() function from useAuth()
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const createClerkSupabaseClient = (getToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => {
      if (!getToken) return null
      try {
        // Uses Clerk's native Supabase third-party auth integration (no JWT template needed):
        // https://supabase.com/docs/guides/auth/third-party/clerk
        return (await getToken()) || null
      } catch (err) {
        console.warn('[Zion Supabase] Error retrieving Clerk auth token:', err)
        return null
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
}

/**
 * Anonymous public Supabase client for unauthenticated public catalog queries.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})
