import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Users } from 'lucide-react'

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/customers', label: 'Customers', icon: Users }
]

const AdminLayout = () => (
  <div className="min-h-screen w-full bg-neutral-50 text-neutral-950 font-body">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <div className="mb-6">
        <span className="text-xs uppercase tracking-widest font-semibold text-neutral-400">Store admin</span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">Zion Control Room</h1>
      </div>

      <nav className="flex gap-1 overflow-x-auto mb-8 border-b border-neutral-200">
        {LINKS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `shrink-0 inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
                isActive ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`
            }
          >
            {React.createElement(icon, { size: 14 })} {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  </div>
)

export default AdminLayout
