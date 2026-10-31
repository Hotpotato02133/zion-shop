import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { loginUrlFor, rememberRedirect } from '../lib/redirect'
import { useIsAdmin } from '../hooks/useIsAdmin'

const Spinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-4 border-neutral-100 border-t-black animate-spin" />
  </div>
)

/** Sends signed-out visitors to login and returns them here afterwards. */
export const RequireAuth = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()
  const target = `${location.pathname}${location.search}`

  useEffect(() => {
    if (isLoaded && !isSignedIn) rememberRedirect(target)
  }, [isLoaded, isSignedIn, target])

  if (!isLoaded) return <Spinner />
  if (!isSignedIn) return <Navigate to={loginUrlFor(target)} replace />
  return children
}

/** Admin-only area. Authorisation is enforced by RLS too; this only controls what is rendered. */
export const RequireAdmin = ({ children }) => {
  const { isAdmin, isLoading } = useIsAdmin()
  return (
    <RequireAuth>
      {isLoading ? (
        <Spinner />
      ) : isAdmin ? (
        children
      ) : (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">Admins only</h1>
          <p className="text-sm text-neutral-500 mt-2 max-w-sm">
            Your account does not have access to the store dashboard.
          </p>
        </div>
      )}
    </RequireAuth>
  )
}
