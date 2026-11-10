import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'
import {
  AlertTriangle,
  Ban,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  Truck,
  Users,
  X
} from 'lucide-react'
import { AdminAlertsProvider, useAdminAlerts } from './AdminAlerts'
import { AdminThemeProvider, useAdminTheme } from '../../context/AdminThemeContext'
import { formatDateTime } from '../../lib/orders'
import { luxuryClerkAppearance, luxuryClerkDarkAppearance } from '../../lib/clerkTheme'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  {
    to: '/admin/orders',
    label: 'Orders',
    icon: ShoppingBag,
    badge: (a) => a.counts.toShip + a.counts.returns,
    tone: 'black'
  },
  {
    to: '/admin/orders?status=to_ship',
    label: 'Shipping',
    icon: Truck,
    badge: (a) => a.counts.toShip,
    tone: 'black'
  },
  {
    to: '/admin/products',
    label: 'Products',
    icon: Package,
    badge: (a) => a.lowStock.length,
    tone: 'amber'
  },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings }
]

const Badge = ({ value, tone }) =>
  value > 0 ? (
    <span
      className={`ml-auto min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center ${
        tone === 'amber'
          ? 'bg-amber-500 text-white'
          : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
      }`}
    >
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
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
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
        onClick={() => setOpen((o) => !o)}
        className="relative p-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm"
        aria-label={`Notifications (${notifications.length} unread)`}
      >
        <Bell size={17} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-50/70 dark:bg-neutral-800/70 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">Notifications</span>
              {notifications.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-semibold">
                  {notifications.length} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => markRead(notifications.map((n) => n.id))}
                className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 size={24} className="mx-auto text-neutral-300 dark:text-neutral-600" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">All notifications caught up.</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">New orders and low stock warnings will appear here.</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => openNotification(n)}
                    className="w-full text-left px-4 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      {(n.type === 'low_stock' || n.type === 'out_of_stock') && (
                        <AlertTriangle
                          size={15}
                          className={`mt-0.5 shrink-0 ${
                            n.type === 'out_of_stock' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                          }`}
                        />
                      )}
                      {n.type === 'order_cancelled' && (
                        <Ban size={15} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">{n.title}</p>
                        {n.body && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">{formatDateTime(n.created_at)}</p>
                      </div>
                    </div>
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

// New-arrival floating toasts
const AlertToasts = () => {
  const { freshAlerts, dismissFresh } = useAdminAlerts()
  const navigate = useNavigate()

  useEffect(() => {
    if (freshAlerts.length === 0) return
    const timers = freshAlerts.map((n) => setTimeout(() => dismissFresh(n.id), 8000))
    return () => timers.forEach(clearTimeout)
  }, [freshAlerts, dismissFresh])

  return (
    <div className="fixed bottom-5 right-5 z-[70] space-y-2.5 w-84 max-w-[calc(100vw-2.5rem)]" aria-live="polite">
      {freshAlerts.map((n) => (
        <div
          key={n.id}
          className="bg-neutral-950 dark:bg-neutral-900 text-white rounded-2xl p-4 shadow-2xl border border-neutral-800 flex gap-3 animate-in slide-in-from-bottom-2 duration-200"
        >
          <button
            className="flex-1 text-left"
            onClick={() => {
              dismissFresh(n.id)
              navigate(destinationFor(n) + (n.order_id ? `?order=${n.order_id}` : ''))
            }}
          >
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  n.type === 'order_cancelled' ? 'bg-rose-500' : 'bg-amber-400'
                }`}
              />
              {n.title}
            </p>
            {n.body && <p className="text-xs text-neutral-300 mt-1">{n.body}</p>}
          </button>
          <button
            onClick={() => dismissFresh(n.id)}
            aria-label="Dismiss"
            className="text-neutral-400 hover:text-white self-start p-1"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

const SidebarContent = ({ onNavigate, onCollapse }) => {
  const alerts = useAdminAlerts()
  const { user } = useUser()
  const { isDark, setTheme } = useAdminTheme()
  const location = useLocation()

  const isNavActive = (to, end) => {
    if (to.includes('status=to_ship')) {
      return location.pathname === '/admin/orders' && location.search.includes('status=to_ship')
    }
    if (to === '/admin/orders') {
      return location.pathname === '/admin/orders' && !location.search.includes('status=to_ship')
    }
    if (end) {
      return location.pathname === to
    }
    return location.pathname.startsWith(to)
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center font-bold text-sm tracking-widest font-heading shadow-sm shrink-0">
              Z
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-base font-semibold tracking-tight text-neutral-950 dark:text-white">
                  ZION
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                  Atelier
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium -mt-0.5">
                Control Room
              </p>
            </div>
          </Link>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="p-4 space-y-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-3 mb-2">
              Main Menu
            </p>
            <nav className="space-y-1">
              {NAV_ITEMS.map((navItem) => {
                const { to, label, end, badge, tone } = navItem
                const NavIcon = navItem.icon
                const isActive = isNavActive(to, end)
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-medium shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 font-normal'
                    }`}
                  >
                    <NavIcon size={17} />
                    <span>{label}</span>
                    {badge && <Badge value={badge(alerts)} tone={tone} />}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-3 mb-2">
              Sales Channel
            </p>
            <div className="space-y-1">
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Store size={17} className="text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-950 dark:group-hover:text-white" />
                  <span>Online Store</span>
                </div>
                <ExternalLink size={14} className="text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-950 dark:group-hover:text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer: Appearance, System Status & User Card */}
      <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
        {/* Theme mode switcher inside sidebar */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800/80 text-xs">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
            {isDark ? <Moon size={14} className="text-amber-400" /> : <Sun size={14} className="text-amber-500" />}
            <span className="font-medium text-[11px] uppercase tracking-wider">Theme</span>
          </div>
          <div className="flex items-center rounded-lg bg-neutral-200/70 dark:bg-neutral-800 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                !isDark
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                isDark
                  ? 'bg-neutral-700 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Database Synced</span>
          </div>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Supabase</span>
        </div>

        {/* User Card - Fix alignment for avatar, name and email */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
          <div className="shrink-0 flex items-center justify-center">
            <UserButton
              appearance={isDark ? luxuryClerkDarkAppearance : luxuryClerkAppearance}
              afterSignOutUrl="/"
            />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center text-left">
            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate leading-snug">
              {user?.fullName || user?.firstName || 'Atelier Director'}
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate leading-tight mt-0.5">
              {user?.primaryEmailAddress?.emailAddress || 'Admin Session'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const Shell = () => {
  const alerts = useAdminAlerts()
  const { user } = useUser()
  const location = useLocation()
  const { isDark, toggleTheme } = useAdminTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('zion_admin_sidebar_open')
      return saved !== null ? saved === 'true' : true
    } catch {
      return true
    }
  })
  const [refreshing, setRefreshing] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem('zion_admin_sidebar_open', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await alerts.refresh()
    setTimeout(() => setRefreshing(false), 600)
  }

  // Current formatted date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  // Dynamic greeting
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 18) return 'Good Afternoon'
    return 'Good Evening'
  })()

  const displayName = user?.firstName || user?.fullName?.split(' ')[0] || 'Director'

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-neutral-950 text-neutral-50' : 'bg-[#f8f9fa] text-neutral-950'} font-body flex transition-colors duration-200`}>
      {/* 1. Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-30 transition-all duration-300 ease-in-out bg-white dark:bg-neutral-900 border-r border-neutral-200/80 dark:border-neutral-800 ${
          sidebarOpen
            ? 'lg:w-64 xl:w-72 translate-x-0'
            : '-translate-x-full lg:w-64 xl:w-72 opacity-0 pointer-events-none'
        }`}
      >
        <SidebarContent onCollapse={toggleSidebar} />
      </aside>

      {/* 2. Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-neutral-900 shadow-2xl z-50 flex flex-col">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:pl-64 xl:pl-72' : 'lg:pl-0'
        }`}
      >
        {/* Modern Administrative Top Bar */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 sm:px-6 lg:px-8 xl:px-10 py-4 transition-colors">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Mobile Toggle & Desktop Sidebar Toggle & Store Greeting */}
            <div className="flex items-center gap-3">
              {/* Mobile drawer toggle */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-xs"
                aria-label="Open sidebar menu"
              >
                <Menu size={18} />
              </button>

              {/* Desktop sidebar toggle button */}
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center gap-1.5 p-2 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-xs transition-all hover:scale-105 active:scale-95"
                aria-label={sidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
                title={sidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
              >
                {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
                {!sidebarOpen && (
                  <span className="text-xs font-semibold px-1 tracking-wide">Sidebar</span>
                )}
              </button>

              <div>
                <h1 className="font-heading text-lg sm:text-xl font-semibold tracking-tight text-neutral-950 dark:text-white">
                  {greeting}, {displayName}!
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
                  Here&apos;s what&apos;s happening with your atelier store today.
                </p>
              </div>
            </div>

            {/* Right: Date Indicator, Theme Switcher, Refresh, Alerts, Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium border border-neutral-200/60 dark:border-neutral-700">
                <Calendar size={13} className="text-neutral-500 dark:text-neutral-400" />
                <span>{todayFormatted}</span>
              </div>

              {/* Light / Dark Mode Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <Sun size={16} className="text-amber-400 transition-transform hover:rotate-45" />
                ) : (
                  <Moon size={16} className="text-neutral-700 transition-transform hover:-rotate-12" />
                )}
              </button>

              <button
                onClick={handleRefresh}
                className="p-2.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors shadow-sm"
                aria-label="Refresh data"
                title={alerts.lastUpdated ? `Updated ${alerts.lastUpdated.toLocaleTimeString()}` : 'Refresh'}
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>

              <NotificationBell />

              <div className="border-l border-neutral-200 dark:border-neutral-800 pl-2 sm:pl-3 ml-1 sm:ml-2">
                <UserButton appearance={isDark ? luxuryClerkDarkAppearance : luxuryClerkAppearance} afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </header>

        {/* Global Urgent Stock Alert (if any items critically out of stock) */}
        {alerts.lowStock.length > 0 && location.pathname !== '/admin/products' && (
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-5">
            <Link
              to="/admin/products?filter=low"
              className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 text-xs sm:text-sm hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle size={17} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">
                  <strong className="font-semibold">
                    {alerts.lowStock.length} product{alerts.lowStock.length === 1 ? '' : 's'} need restocking
                  </strong>
                  <span className="hidden md:inline text-amber-800/90 dark:text-amber-300/90">
                    {' '}
                    — {alerts.lowStock.slice(0, 3).map((p) => `${p.name} (${p.stock})`).join(', ')}
                    {alerts.lowStock.length > 3 ? '…' : ''}
                  </span>
                </span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300 underline shrink-0">
                Restock catalog
              </span>
            </Link>
          </div>
        )}

        {/* Main Routed Page Content */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
          <Outlet />
        </main>
      </div>

      <AlertToasts />
    </div>
  )
}

const AdminLayout = () => (
  <AdminThemeProvider>
    <AdminAlertsProvider>
      <Shell />
    </AdminAlertsProvider>
  </AdminThemeProvider>
)

export default AdminLayout
