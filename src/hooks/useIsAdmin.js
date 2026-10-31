import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useSupabase } from '../context/SupabaseContext'

/** Asks the database (is_admin() RPC) whether the signed-in Clerk user is a store admin. */
export const useIsAdmin = () => {
  const { isSignedIn, userId } = useAuth()
  const { supabase, isConfigured } = useSupabase()
  const [state, setState] = useState({ isAdmin: false, isLoading: true, forUser: null })

  useEffect(() => {
    if (!isSignedIn || !isConfigured) return
    let cancelled = false
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (cancelled) return
      setState({ isAdmin: !error && data === true, isLoading: false, forUser: userId })
    })
    return () => { cancelled = true }
  }, [isSignedIn, isConfigured, supabase, userId])

  if (!isSignedIn || !isConfigured) return { isAdmin: false, isLoading: false }
  // Until the RPC answers for *this* user, report loading
  if (state.forUser !== userId) return { isAdmin: false, isLoading: true }
  return { isAdmin: state.isAdmin, isLoading: false }
}
