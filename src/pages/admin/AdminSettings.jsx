import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  Store,
  Truck,
  AlertTriangle,
  Server,
  Users,
  Check,
  ShieldCheck,
  Copy,
  ExternalLink,
  RefreshCw,
  Plus,
  Trash2,
  ArrowLeft
} from 'lucide-react'
import { useSupabase } from '../../context/SupabaseContext'
import {
  getStoreSettings,
  saveStoreSettings,
  DEFAULT_STORE_SETTINGS
} from '../../lib/settings'

const TABS = [
  { id: 'store', label: 'Store profile', icon: Store },
  { id: 'fulfillment', label: 'Fulfillment & commerce', icon: Truck },
  { id: 'inventory', label: 'Inventory alerts', icon: AlertTriangle },
  { id: 'api', label: 'Integrations & API', icon: Server },
  { id: 'team', label: 'Staff access', icon: Users }
]

const CURRENCIES = ['USD ($)', 'EUR (€)', 'GBP (£)', 'PHP (₱)']

export default function AdminSettings() {
  const { user } = useUser()
  const { supabase, isConfigured } = useSupabase()

  const [activeTab, setActiveTab] = useState('store')
  const [saveStatus, setSaveStatus] = useState({ state: 'idle', message: '' })
  const [loading, setLoading] = useState(true)

  // Store Configuration Settings
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS)

  // Database Connection Health State
  const [pingStatus, setPingStatus] = useState({ state: 'idle', latency: null, message: '' })

  // Admin Team Access List
  const [admins, setAdmins] = useState([])
  const [newAdminId, setNewAdminId] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [teamError, setTeamError] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)

  // Catalog Low Stock Count
  const [lowStockCount, setLowStockCount] = useState(0)

  // Load Settings and Admin Team from Supabase
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      const data = await getStoreSettings()
      if (!cancelled) {
        setSettings(data)
      }

      if (isConfigured) {
        try {
          // Fetch admins
          const { data: adminRows } = await supabase.from('admins').select('*')
          if (!cancelled && adminRows) {
            setAdmins(adminRows)
          }

          // Count products below low stock threshold
          const threshold = parseInt(data.low_stock_threshold || '5', 10)
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .lte('stock', threshold)
            .eq('is_active', true)
          if (!cancelled && typeof count === 'number') {
            setLowStockCount(count)
          }
        } catch (err) {
          console.warn('[Admin Settings] Background fetch error:', err)
        }
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [supabase, isConfigured])

  const showSavedNotice = (msg = 'Settings saved successfully') => {
    setSaveStatus({ state: 'saved', message: msg })
    setTimeout(() => {
      setSaveStatus({ state: 'idle', message: '' })
    }, 2800)
  }

  // Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault()
    setSaveStatus({ state: 'saving', message: 'Saving settings…' })

    const res = await saveStoreSettings(settings)
    if (res.warning) {
      showSavedNotice('Saved to local configuration')
    } else {
      showSavedNotice('Store settings saved')
    }
  }

  // Ping Database Health
  const handleTestDatabasePing = async () => {
    setPingStatus({ state: 'pinging', latency: null, message: 'Testing database latency…' })
    const start = performance.now()
    try {
      if (!isConfigured) {
        setPingStatus({
          state: 'offline',
          latency: null,
          message: 'Supabase credentials not configured in environment.'
        })
        return
      }

      const { error } = await supabase.from('app_settings').select('key').limit(1)
      const end = performance.now()
      const duration = Math.round(end - start)

      if (error) {
        setPingStatus({
          state: 'error',
          latency: duration,
          message: `Query failed: ${error.message}`
        })
      } else {
        setPingStatus({
          state: 'online',
          latency: duration,
          message: `Operational · Response in ${duration} ms`
        })
      }
    } catch (err) {
      setPingStatus({
        state: 'error',
        latency: null,
        message: err.message || 'Connection timeout.'
      })
    }
  }

  // Add Authorized Admin
  const handleAddAdmin = async (e) => {
    e.preventDefault()
    if (!newAdminId.trim()) return
    setTeamError('')

    if (!isConfigured) {
      const mockAdmin = {
        user_id: newAdminId.trim(),
        email: newAdminEmail.trim() || 'director@zion-atelier.com',
        created_at: new Date().toISOString()
      }
      setAdmins([...admins, mockAdmin])
      setNewAdminId('')
      setNewAdminEmail('')
      showSavedNotice('Admin authorized locally')
      return
    }

    try {
      const { error } = await supabase.from('admins').insert({
        user_id: newAdminId.trim(),
        email: newAdminEmail.trim() || null
      })

      if (error) {
        setTeamError(error.message)
      } else {
        setAdmins([
          ...admins,
          {
            user_id: newAdminId.trim(),
            email: newAdminEmail.trim() || null,
            created_at: new Date().toISOString()
          }
        ])
        setNewAdminId('')
        setNewAdminEmail('')
        showSavedNotice('New admin granted access')
      }
    } catch (err) {
      setTeamError(err.message)
    }
  }

  // Remove Admin
  const handleRemoveAdmin = async (userIdToRemove) => {
    if (userIdToRemove === user?.id) {
      alert('Cannot revoke access for the active session administrator.')
      return
    }

    if (!isConfigured) {
      setAdmins(admins.filter((a) => a.user_id !== userIdToRemove))
      showSavedNotice('Admin revoked locally')
      return
    }

    try {
      const { error } = await supabase.from('admins').delete().eq('user_id', userIdToRemove)
      if (!error) {
        setAdmins(admins.filter((a) => a.user_id !== userIdToRemove))
        showSavedNotice('Admin access revoked')
      }
    } catch (err) {
      console.warn('Remove admin issue:', err)
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Title Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Control room</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#dcfae5] text-[#04250e]">
              <ShieldCheck size={12} />
              <span>Director permissions</span>
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Storefront operational controls, fulfillment rules, restock thresholds, and director access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-950 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>My account settings</span>
          </Link>

          {saveStatus.state === 'saved' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#dcfae5] text-[#04250e]">
              <Check size={13} />
              <span>{saveStatus.message}</span>
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto gap-2 sm:gap-6 no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? 'border-neutral-950 dark:border-white text-neutral-950 dark:text-white'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:text-white'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: Store Profile */}
      {activeTab === 'store' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h2 className="text-base font-medium text-neutral-950 dark:text-white">
                  Atelier identity
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Public brand name, primary contact desk, and operating currency rendered on customer receipts.
                </p>
              </div>

              {/* Storefront Header Preview */}
              <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-medium text-neutral-950 dark:text-white">Storefront banner preview</span>
                  <span className="text-xs text-[#04250e] bg-[#dcfae5] px-1.5 py-0.5 rounded font-medium">Live</span>
                </div>
                <div className="space-y-1">
                  <span className="text-lg font-semibold tracking-tight text-neutral-950 dark:text-white block">
                    {settings.store_name}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
                    {settings.store_tagline}
                  </span>
                </div>
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 flex justify-between">
                  <span>Currency: <strong className="text-neutral-950 dark:text-white tabular-nums">{settings.currency}</strong></span>
                  <span>HQ: <strong className="text-neutral-950 dark:text-white">{settings.headquarters}</strong></span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSaveSettings} className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                    Storefront name
                  </label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                    Atelier subtitle &amp; brand tagline
                  </label>
                  <input
                    type="text"
                    value={settings.store_tagline}
                    onChange={(e) => setSettings({ ...settings, store_tagline: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                    Concierge support email
                  </label>
                  <input
                    type="email"
                    value={settings.concierge_email}
                    onChange={(e) => setSettings({ ...settings, concierge_email: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                      Store operating currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                      Atelier showroom city
                    </label>
                    <input
                      type="text"
                      value={settings.headquarters}
                      onChange={(e) => setSettings({ ...settings, headquarters: e.target.value })}
                      required
                      className="w-full h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saveStatus.state === 'saving'}
                    className="px-4 py-2 rounded-md bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
                  >
                    {saveStatus.state === 'saving' ? 'Saving…' : 'Save store profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Fulfillment & Commerce */}
      {activeTab === 'fulfillment' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h2 className="text-base font-medium text-neutral-950 dark:text-white">
                  Checkout parameters
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Express shipping thresholds, return policy duration, and sandbox transaction settings.
                </p>
              </div>

              {/* Policy Summary Card */}
              <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
                <span className="font-medium text-neutral-950 dark:text-white block pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  Active checkout policy
                </span>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Complimentary shipping</span>
                  <span className="font-semibold text-neutral-950 dark:text-white tabular-nums">Orders &gt; ${settings.free_shipping_threshold}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Standard courier fee</span>
                  <span className="font-semibold text-neutral-950 dark:text-white tabular-nums">${settings.standard_shipping_fee}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Return window</span>
                  <span className="font-semibold text-neutral-950 dark:text-white tabular-nums">{settings.return_window_days} days</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500 dark:text-neutral-400">Payment simulation</span>
                  <span className={`font-semibold tabular-nums ${settings.demo_payments === 'true' ? 'text-[#2e7d32]' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {settings.demo_payments === 'true' ? 'Sandbox active' : 'Live only'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSaveSettings} className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                      Complimentary courier threshold ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={settings.free_shipping_threshold}
                      onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                      required
                      className="w-full h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors tabular-nums"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Orders exceeding this total receive complimentary courier delivery.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                      Standard express shipping fee ($)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={settings.standard_shipping_fee}
                      onChange={(e) => setSettings({ ...settings, standard_shipping_fee: e.target.value })}
                      required
                      className="w-full h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors tabular-nums"
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Applied to orders below the complimentary threshold.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                    Return &amp; refund window (days)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="7"
                    max="90"
                    value={settings.return_window_days}
                    onChange={(e) => setSettings({ ...settings, return_window_days: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors tabular-nums"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Allowed duration for customer-initiated returns in customer orders tab.
                  </p>
                </div>

                {/* Switch: Demo Payments */}
                <div className="flex items-center justify-between gap-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-950 dark:text-white">Demo payment simulation mode</span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#dcfae5] text-[#04250e]">
                        {settings.demo_payments === 'true' ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Enables portfolio visitors to complete sandbox checkout without live charges.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.demo_payments === 'true'}
                    onClick={() => setSettings((s) => ({ ...s, demo_payments: s.demo_payments === 'true' ? 'false' : 'true' }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.demo_payments === 'true' ? 'bg-[#0a0a0a]' : 'bg-[#d4d4d4]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        settings.demo_payments === 'true' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch: Cash on Delivery */}
                <div className="flex items-center justify-between gap-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-950 dark:text-white">Cash on delivery (COD)</span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#eeeeee] dark:bg-neutral-800 text-[#3d3d3d] dark:text-neutral-300">
                        {settings.allow_cod === 'true' ? 'Available' : 'Restricted'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Permit clients to settle order balance upon physical parcel delivery.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.allow_cod === 'true'}
                    onClick={() => setSettings((s) => ({ ...s, allow_cod: s.allow_cod === 'true' ? 'false' : 'true' }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.allow_cod === 'true' ? 'bg-[#0a0a0a]' : 'bg-[#d4d4d4]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        settings.allow_cod === 'true' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saveStatus.state === 'saving'}
                    className="px-4 py-2 rounded-md bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
                  >
                    {saveStatus.state === 'saving' ? 'Saving…' : 'Save fulfillment rules'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Inventory Alerts */}
      {activeTab === 'inventory' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h2 className="text-base font-medium text-neutral-950 dark:text-white">
                  Stock monitoring
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Thresholds for low-stock warnings, out-of-stock banners, and automated stock digests.
                </p>
              </div>

              {/* Stock Audit Badge */}
              <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-medium text-neutral-950 dark:text-white">Inventory health status</span>
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                    lowStockCount > 0 ? 'bg-[#fffbeb] text-[#92400e]' : 'bg-[#dcfae5] text-[#04250e]'
                  }`}>
                    {lowStockCount > 0 ? `${lowStockCount} items at alert level` : 'All items optimal'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Products with stock quantity &le; {settings.low_stock_threshold} units trigger notification bell alerts and restock badges in the Products table.
                </p>
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Link
                    to="/admin/products?filter=low"
                    className="text-xs font-medium text-neutral-950 dark:text-white hover:underline flex items-center gap-1"
                  >
                    <span>View items needing restock</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSaveSettings} className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                    Default low-stock warning threshold (units)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="50"
                    value={settings.low_stock_threshold}
                    onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })}
                    required
                    className="w-full h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors tabular-nums"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    When inventory drops to or below this count, a restock notification is added to the admin drawer.
                  </p>
                </div>

                {/* Switch: Notification Bell */}
                <div className="flex items-center justify-between gap-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-950 dark:text-white">Urgent restock banners &amp; toasts</span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#dcfae5] text-[#04250e]">
                        {settings.notify_low_stock === 'true' ? 'Active' : 'Muted'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Display top warning banner across admin portal when catalog pieces deplete.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.notify_low_stock === 'true'}
                    onClick={() => setSettings((s) => ({ ...s, notify_low_stock: s.notify_low_stock === 'true' ? 'false' : 'true' }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.notify_low_stock === 'true' ? 'bg-[#0a0a0a]' : 'bg-[#d4d4d4]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        settings.notify_low_stock === 'true' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch: Auto Archive */}
                <div className="flex items-center justify-between gap-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-950 dark:text-white">Auto-hide depleted garments</span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#eeeeee] dark:bg-neutral-800 text-[#3d3d3d] dark:text-neutral-300">
                        {settings.auto_archive_depleted === 'true' ? 'Auto-archive' : 'Show sold out'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      When stock hits 0, mark product inactive so it disappears from the live storefront catalog.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.auto_archive_depleted === 'true'}
                    onClick={() => setSettings((s) => ({ ...s, auto_archive_depleted: s.auto_archive_depleted === 'true' ? 'false' : 'true' }))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.auto_archive_depleted === 'true' ? 'bg-[#0a0a0a]' : 'bg-[#d4d4d4]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                        settings.auto_archive_depleted === 'true' ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saveStatus.state === 'saving'}
                    className="px-4 py-2 rounded-md bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
                  >
                    {saveStatus.state === 'saving' ? 'Saving…' : 'Save inventory rules'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Integrations & API */}
      {activeTab === 'api' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h2 className="text-base font-medium text-neutral-950 dark:text-white">
                  Service connectivity
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Status of third-party API keys, webhook endpoints, and PostgreSQL database cluster.
                </p>
              </div>

              {/* Health Ping Box */}
              <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-medium text-neutral-950 dark:text-white">Cluster latency check</span>
                  {pingStatus.latency !== null && (
                    <span className="text-xs font-mono font-medium text-[#04250e] bg-[#dcfae5] px-1.5 py-0.5 rounded">
                      {pingStatus.latency} ms
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {pingStatus.message || 'Run an end-to-end latency diagnostic to check Supabase PostgreSQL health.'}
                </p>

                <button
                  type="button"
                  onClick={handleTestDatabasePing}
                  disabled={pingStatus.state === 'pinging'}
                  className="w-full h-9 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-950 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} className={pingStatus.state === 'pinging' ? 'animate-spin' : ''} />
                  <span>{pingStatus.state === 'pinging' ? 'Pinging cluster…' : 'Run diagnostic test'}</span>
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                    PayMongo sandbox public API key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="pk_test_dGVzdC1rZXktemlvbi1hdGVsaWVy"
                      className="w-full h-10 px-3 rounded-md bg-[#eeeeee] border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-950 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('pk_test_dGVzdC1rZXktemlvbi1hdGVsaWVy')
                        setCopiedKey(true)
                        setTimeout(() => setCopiedKey(false), 2000)
                      }}
                      className="h-10 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-950 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {copiedKey ? <Check size={13} className="text-[#04250e]" /> : <Copy size={13} />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Used on client-side checkout to initiate sandbox transactions.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                    PayMongo payment webhook endpoint
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="https://placeholder.supabase.co/functions/v1/paymongo-webhook"
                    className="w-full h-10 px-3 rounded-md bg-[#eeeeee] border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-950 dark:text-white"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Edge function configured to receive asynchronous payment settlement payloads.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-950 dark:text-white mb-1.5">
                    Database cluster provider
                  </label>
                  <div className="flex items-center justify-between p-3 rounded-md bg-[#f8f8f8] dark:bg-neutral-800/60 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                    <div>
                      <p className="text-sm font-medium text-neutral-950 dark:text-white">Supabase PostgreSQL 15</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Third-party Clerk JWT authorization enabled</p>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#dcfae5] text-[#04250e] font-medium">
                      {isConfigured ? 'Connected' : 'Local mock'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Staff Access */}
      {activeTab === 'team' && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h2 className="text-base font-medium text-neutral-950 dark:text-white">
                  Authorized directors
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Clerk identities permitted to enter the control room, manage catalog items, and fulfill client orders.
                </p>
              </div>

              {/* Current Session Director Card */}
              <div className="p-4 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                <span className="font-medium text-neutral-950 dark:text-white block pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  Your active session
                </span>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500 dark:text-neutral-400">Clerk user ID</span>
                  <span className="font-mono text-neutral-950 dark:text-white truncate max-w-[180px]">{user?.id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500 dark:text-neutral-400">Role assignment</span>
                  <span className="font-semibold text-[#04250e] bg-[#dcfae5] px-1.5 py-0.5 rounded">Store Admin</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Form to Add Admin */}
              <form onSubmit={handleAddAdmin} className="p-6 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
                <h3 className="text-sm font-medium text-neutral-950 dark:text-white">
                  Grant director access
                </h3>
                {teamError && (
                  <p className="text-xs text-[#c4242a]">{teamError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      Clerk user ID (user_...)
                    </label>
                    <input
                      type="text"
                      value={newAdminId}
                      onChange={(e) => setNewAdminId(e.target.value)}
                      placeholder="user_2b8x..."
                      required
                      className="w-full h-9 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      Director email (optional)
                    </label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="colleague@zion.com"
                      className="w-full h-9 px-3 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-950 dark:border-white transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-md bg-[#141414] text-white text-xs font-medium hover:bg-black transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Authorize director</span>
                  </button>
                </div>
              </form>

              {/* Admins Table */}
              <div className="rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-4 py-3 bg-[#f8f8f8] dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-medium text-neutral-950 dark:text-white">
                    Active store administrators ({admins.length + 1})
                  </span>
                </div>
                <div className="divide-y divide-[#f0f0f0] dark:divide-neutral-800 text-xs">
                  {/* Current User Row */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-950 dark:text-white flex items-center gap-2">
                        <span>{user?.fullName || 'Current Director'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#eeeeee] dark:bg-neutral-800 text-[#3d3d3d] dark:text-neutral-300 font-normal">
                          You
                        </span>
                      </p>
                      <p className="text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">{user?.id}</p>
                    </div>
                    <span className="text-xs font-medium text-[#04250e] bg-[#dcfae5] px-2 py-0.5 rounded">
                      Active
                    </span>
                  </div>

                  {/* Other Admins */}
                  {admins.map((adm) => (
                    <div key={adm.user_id} className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-950 dark:text-white">
                          {adm.email || 'Authorized Administrator'}
                        </p>
                        <p className="text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">{adm.user_id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(adm.user_id)}
                        className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-[#c4242a] hover:bg-[#ffedea] rounded transition-colors"
                        title="Revoke access"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
