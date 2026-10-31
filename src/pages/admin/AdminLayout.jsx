import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, LayoutDashboard, Package, RefreshCw, ShoppingBag, Users, X } from 'lucide-react'
import { AdminAlertsProvider, useAdminAlerts } from './AdminAlerts'
import { formatDateTime } from '../../lib/orders'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, badge: a => a.lowStock.length, tone: 'amber' },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: a => a.counts.toShip + a.counts.returns, tone: 'black' },
  { to: '/admin/customers', label: 'Customers', icon: Users }
]

const Badge = ({ value, tone }) =>
  value > 0 ? (
    <span className={`ml-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center ${tone === 'amber' ? 'bg-amber-500 text-white' : 'bg-neutral-950 text-white'}`}>
      {value}
    </span>
  ) : null

const destinationFor = (n) => (n.order_id ? '/admin/orders' : '/admin/products?filter=low')

const NotificationBell = () => {
  const { notifications, markRead } = useAdminAlerts()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openNotification = (n) => {
    markRead([n.id])
    setOpen(false)
    navigate(destinationFor(n) + (n.order_id ? `?order=${n.order_id}` : ''))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2.5 rounded-full bg-white border border-neutral-200 hover:bg-neutral-100"
        aria-label={`Notifications (${notifications.length} unread)`}
      >
        <Bell size={18} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <p className="text-xs font-bold uppercase tracking-wider">Notifications</p>
            {notifications.length > 0 && (
              <button onClick={() => markRead(notifications.map(n => n.id))} className="text-[11px] font-semibold underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500 text-center">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-neutral-100">
              {notifications.map(n => (
                <li key={n.id}>
                  <button onClick={() => openNotification(n)} className="w-full text-left px-4 py-3 hover:bg-neutral-50">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      {(n.type === 'low_stock' || n.type === 'out_of_stock') && (
                        <AlertTriangle size={13} className={n.type === 'out_of_stock' ? 'text-red-600' : 'text-amber-600'} />
                      )}
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-neutral-400 mt-1">{formatDateTime(n.created_at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// New-arrival toasts so an admin on another page notices a fresh order or stock alert immediately
const AlertToasts = () => {
  const { freshAlerts, dismissFresh } = useAdminAlerts()
  const navigate = useNavigate()

  useEffect(() => {
    if (freshAlerts.length === 0) return
    const timers = freshAlerts.map(n => setTimeout(() => dismissFresh(n.id), 8000))
    return () => timers.forEach(clearTimeout)
  }, [freshAlerts, dismissFresh])

  return (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2 w-80 max-w-[calc(100vw-2rem)]" aria-live="polite">
      {freshAlerts.map(n => (
        <div key={n.id} className="bg-neutral-950 text-white rounded-2xl p-4 shadow-2xl flex gap-3">
          <button className="flex-1 text-left" onClick={() => { dismissFresh(n.id); navigate(destinationFor(n)) }}>
            <p className="text-sm font-semibold">{n.title}</p>
            {n.body && <p className="text-xs text-neutral-300 mt-0.5">{n.body}</p>}
          </button>
          <button onClick={() => dismissFresh(n.id)} aria-label="Dismiss" className="text-neutral-400 hover:text-white self-start"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}

const Shell = () => {
  const alerts = useAdminAlerts()
  const out = alerts.lowStock.filter(p => p.stock === 0).length

  return (
    <div className="min-h-screen w-full bg-neutral-50 text-neutral-950 font-body">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-neutral-400">Store admin</span>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">Zion Control Room</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={alerts.refresh}
              className="p-2.5 rounded-full bg-white border border-neutral-200 hover:bg-neutral-100"
              aria-label="Refresh data"
              title={alerts.lastUpdated ? `Updated ${alerts.lastUpdated.toLocaleTimeString()}` : 'Refresh'}
            >
              <RefreshCw size={18} />
            </button>
            <NotificationBell />
          </div>
        </div>

        {alerts.lowStock.length > 0 && (
          <Link
            to="/admin/products?filter=low"
            className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle size={18} className="shrink-0" />
            <span className="flex-1">
              <strong>{alerts.lowStock.length} product{alerts.lowStock.length === 1 ? '' : 's'} need restocking</strong>
              {out > 0 && <> · {out} sold out</>}
              <span className="hidden sm:inline"> — {alerts.lowStock.slice(0, 3).map(p => `${p.name} (${p.stock})`).join(', ')}{alerts.lowStock.length > 3 ? '…' : ''}</span>
            </span>
            <span className="text-xs font-semibold underline shrink-0">Restock</span>
          </Link>
        )}
        {alerts.error && <p role="alert" className="mb-4 text-xs text-red-600">{alerts.error}</p>}

        <nav className="flex gap-1 overflow-x-auto mb-8 border-b border-neutral-200">
          {NAV.map(({ to, label, icon, end, badge, tone }) => (
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
              {badge && <Badge value={badge(alerts)} tone={tone} />}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
      <AlertToasts />
    </div>
  )
}

const AdminLayout = () => (
  <AdminAlertsProvider>
    <Shell />
  </AdminAlertsProvider>
)

export default AdminLayout
