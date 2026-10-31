import React from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { LayoutDashboard, Package } from 'lucide-react'
import { luxuryClerkAppearance } from '../lib/clerkTheme'
import { useIsAdmin } from '../hooks/useIsAdmin'

/** Clerk's avatar menu, extended with order tracking and (for admins) the dashboard. */
const AccountMenu = () => {
  const navigate = useNavigate()
  const { isAdmin } = useIsAdmin()

  return (
    <UserButton appearance={luxuryClerkAppearance} afterSignOutUrl="/">
      <UserButton.MenuItems>
        <UserButton.Action label="My Orders" labelIcon={<Package size={14} />} onClick={() => navigate('/orders')} />
        {isAdmin && (
          <UserButton.Action label="Admin dashboard" labelIcon={<LayoutDashboard size={14} />} onClick={() => navigate('/admin')} />
        )}
      </UserButton.MenuItems>
    </UserButton>
  )
}

export default AccountMenu
