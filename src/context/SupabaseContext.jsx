import React, { createContext, useContext, useMemo } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { createClerkSupabaseClient, supabase as publicClient, isSupabaseConfigured } from '../lib/supabase'

const SupabaseContext = createContext(publicClient)

export const SupabaseProvider = ({ children }) => {
  const { getToken, isSignedIn } = useAuth()

  // Recreate the client only when auth status changes
  const client = useMemo(() => {
    if (!isSignedIn) {
      return publicClient
    }
    return createClerkSupabaseClient(getToken)
  }, [isSignedIn, getToken])

  return (
    <SupabaseContext.Provider value={{ supabase: client, isConfigured: isSupabaseConfigured }}>
      {children}
    </SupabaseContext.Provider>
  )
}

/**
 * Hook to access the authenticated Supabase client in any React component
 * @returns {{ supabase: import('@supabase/supabase-js').SupabaseClient, isConfigured: boolean }}
 */
export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}
