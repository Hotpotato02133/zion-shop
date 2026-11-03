import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import {
  User,
  Scissors,
  MapPin,
  Bell,
  Check,
  ShieldCheck,
  Copy,
  Download,
  LogOut,
  ExternalLink,
  ArrowRight
} from 'lucide-react'
import { useSupabase } from '../context/SupabaseContext'
import { useIsAdmin } from '../hooks/useIsAdmin'
import {
  getCustomerPreferences,
  saveCustomerPreferences,
  getSavedShippingAddress,
  saveShippingAddress
} from '../lib/settings'

const TABS = [
  { id: 'profile', label: 'Profile & identity', icon: User },
  { id: 'sizing', label: 'Sizing & bespoke', icon: Scissors },
  { id: 'shipping', label: 'Delivery address', icon: MapPin },
  { id: 'notifications', label: 'Notifications & privacy', icon: Bell }
]

const TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const BOTTOM_SIZES = ['28', '30', '32', '34', '36', '38']
const FOOTWEAR_SIZES = [
  'EU 39 / US 6.5',
  'EU 40 / US 7.5',
  'EU 41 / US 8.5',
  'EU 42 / US 9.5',
  'EU 43 / US 10.5',
  'EU 44 / US 11.5',
  'EU 45 / US 12.5'
]
const SILHOUETTES = [
  'Classic tailored (Structured fit)',
  'Relaxed drop-shoulder (Everyday drape)',
  'Oversized atelier (Avant-garde silhouette)'
]
const PALETTES = [
  'Monochrome (Black, white, and raw cotton)',
  'Neutral earth tones (Stone, sand, and charcoal)',
  'Full seasonal capsule'
]

const COUNTRIES = [
  'United States',
  'Philippines',
  'United Kingdom',
  'Canada',
  'Australia',
  'France',
  'Germany',
  'Japan',
  'Singapore'
]

export default function Settings() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { supabase, isConfigured } = useSupabase()
  const { isAdmin } = useIsAdmin()

  const [activeTab, setActiveTab] = useState('profile')
  const [saveStatus, setSaveStatus] = useState({ state: 'idle', message: '' })
  const [copiedId, setCopiedId] = useState(false)

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    preferredName: '',
    phone: '',
    bio: ''
  })

  // Sizing Preferences State
  const [sizingForm, setSizingForm] = useState({
    top_size: 'M',
    bottom_size: '32',
    footwear_size: 'EU 42 / US 9.5',
    silhouette: SILHOUETTES[0],
    palette_preference: PALETTES[0]
  })

  // Shipping Address State
  const [shippingForm, setShippingForm] = useState({
    recipient_name: '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    instructions: ''
  })

  // Notifications State
  const [notificationsForm, setNotificationsForm] = useState({
    notify_order_status: true,
    notify_capsule_drops: true,
    notify_restocks: true,
    notify_editorials: false
  })

  // Load existing data
  useEffect(() => {
    if (!user) return

    const names = (user.fullName || '').split(' ')
    const first = user.firstName || names[0] || ''
    const last = user.lastName || names.slice(1).join(' ') || ''

    const prefs = getCustomerPreferences(user.id)
    setProfileForm({
      firstName: first,
      lastName: last,
      preferredName: prefs.preferred_name || first,
      phone: prefs.phone || user.primaryPhoneNumber?.phoneNumber || '',
      bio: prefs.bio || 'Patron of contemporary minimalist tailoring.'
    })

    setSizingForm({
      top_size: prefs.top_size || 'M',
      bottom_size: prefs.bottom_size || '32',
      footwear_size: prefs.footwear_size || 'EU 42 / US 9.5',
      silhouette: prefs.silhouette || SILHOUETTES[0],
      palette_preference: prefs.palette_preference || PALETTES[0]
    })

    setNotificationsForm({
      notify_order_status: prefs.notify_order_status ?? true,
      notify_capsule_drops: prefs.notify_capsule_drops ?? true,
      notify_restocks: prefs.notify_restocks ?? true,
      notify_editorials: prefs.notify_editorials ?? false
    })

    const savedAddr = getSavedShippingAddress(user.id)
    setShippingForm({
      recipient_name: savedAddr.recipient_name || user.fullName || '',
      phone: savedAddr.phone || '',
      street: savedAddr.street || '',
      apartment: savedAddr.apartment || '',
      city: savedAddr.city || '',
      state: savedAddr.state || '',
      postal_code: savedAddr.postal_code || '',
      country: savedAddr.country || 'United States',
      instructions: savedAddr.instructions || ''
    })
  }, [user])

  const showSavedNotice = (msg = 'Changes saved successfully') => {
    setSaveStatus({ state: 'saved', message: msg })
    setTimeout(() => {
      setSaveStatus({ state: 'idle', message: '' })
    }, 2800)
  }

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaveStatus({ state: 'saving', message: 'Saving profile…' })

    try {
      // 1. Update Clerk profile
      if (user && user.update) {
        await user.update({
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim()
        })
      }

      // 2. Persist preferences locally
      const currentPrefs = getCustomerPreferences(user?.id)
      saveCustomerPreferences(user?.id, {
        ...currentPrefs,
        preferred_name: profileForm.preferredName,
        phone: profileForm.phone,
        bio: profileForm.bio
      })

      // 3. Sync to Supabase profiles table
      if (isConfigured && user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
          email: user.primaryEmailAddress?.emailAddress,
          avatar_url: user.imageUrl,
          updated_at: new Date().toISOString()
        })
      }

      showSavedNotice('Profile identity updated')
    } catch (err) {
      console.warn('Profile save issue:', err)
      showSavedNotice('Saved to atelier profile')
    }
  }

  // Handle Sizing Save
  const handleSaveSizing = (e) => {
    e.preventDefault()
    setSaveStatus({ state: 'saving', message: 'Saving sizing…' })

    const currentPrefs = getCustomerPreferences(user?.id)
    saveCustomerPreferences(user?.id, {
      ...currentPrefs,
      ...sizingForm
    })

    showSavedNotice('Atelier sizing card updated')
  }

  // Handle Shipping Address Save
  const handleSaveShipping = (e) => {
    e.preventDefault()
    setSaveStatus({ state: 'saving', message: 'Saving destination…' })

    saveShippingAddress(user?.id, shippingForm)
    showSavedNotice('Default shipping address updated')
  }

  // Handle Notifications Save
  const handleSaveNotifications = (e) => {
    e.preventDefault()
    setSaveStatus({ state: 'saving', message: 'Updating preferences…' })

    const currentPrefs = getCustomerPreferences(user?.id)
    saveCustomerPreferences(user?.id, {
      ...currentPrefs,
      ...notificationsForm
    })

    showSavedNotice('Notification preferences updated')
  }

  // Copy User ID
  const handleCopyId = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  // Export Data JSON
  const handleExportData = () => {
    const data = {
      atelier: 'ZION Atelier',
      exported_at: new Date().toISOString(),
      account: {
        id: user?.id,
        fullName: user?.fullName,
        email: user?.primaryEmailAddress?.emailAddress,
        createdAt: user?.createdAt
      },
      sizing_preferences: sizingForm,
      default_shipping_address: shippingForm,
      communication_preferences: notificationsForm
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zion-atelier-data-${user?.id || 'account'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const initials = (user?.fullName || user?.firstName || 'Z')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-[#0a0a0a] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1152px] mx-auto space-y-8">
        {/* Title Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#e6e6e6]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[#6b6b6b]">Account &amp; Salon</span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#dcfae5] text-[#04250e]">
                  <ShieldCheck size={12} />
                  <span>Store Director</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">
              Settings
            </h1>
            <p className="text-sm text-[#6b6b6b] mt-1 max-w-2xl">
              Manage your atelier profile identity, bespoke sizing preferences, delivery addresses, and notifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin/settings"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md bg-white border border-[#e6e6e6] text-[#0a0a0a] hover:bg-[#eeeeee] transition-colors"
              >
                <span>Store settings</span>
                <ArrowRight size={13} />
              </Link>
            )}

            {saveStatus.state === 'saved' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#dcfae5] text-[#04250e]">
                <Check size={13} />
                <span>{saveStatus.message}</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#e6e6e6] overflow-x-auto gap-2 sm:gap-6 no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-[#0a0a0a] text-[#0a0a0a]'
                    : 'border-transparent text-[#6b6b6b] hover:text-[#0a0a0a]'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* VIEW 1: Profile & Identity */}
        {activeTab === 'profile' && (
          <div className="space-y-10">
            {/* Section 1: Atelier Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Label & Summary */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <h2 className="text-base font-medium text-[#0a0a0a]">
                    Atelier client identity
                  </h2>
                  <p className="text-sm text-[#6b6b6b] mt-1">
                    Your personal profile name and authentication details for private salon inquiries.
                  </p>
                </div>

                {/* Summary / Identity Card */}
                <div className="p-4 rounded-lg bg-white border border-[#e6e6e6] space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#141414] text-white flex items-center justify-center font-medium text-sm">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0a0a0a] truncate">
                        {user?.fullName || profileForm.preferredName || 'Zion Patron'}
                      </p>
                      <p className="text-xs text-[#6b6b6b] truncate">
                        {user?.primaryEmailAddress?.emailAddress || 'Verified Member'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#f0f0f0] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#6b6b6b] block">Salon status</span>
                      <span className="font-medium text-[#0a0a0a]">Authenticated</span>
                    </div>
                    <div>
                      <span className="text-[#6b6b6b] block">Client tier</span>
                      <span className="font-medium text-[#0a0a0a]">Atelier Circle</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Panel */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSaveProfile} className="p-6 rounded-lg bg-white border border-[#e6e6e6] space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                        First name
                      </label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        required
                        className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                        Last name
                      </label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        required
                        className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Preferred salutation or display name
                    </label>
                    <input
                      type="text"
                      value={profileForm.preferredName}
                      onChange={(e) => setProfileForm({ ...profileForm, preferredName: e.target.value })}
                      placeholder="e.g. Alex or Director"
                      className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                    />
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      Used in atelier communications and order acknowledgements.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Primary email address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.primaryEmailAddress?.emailAddress || ''}
                        disabled
                        className="w-full h-10 px-3 rounded-md bg-[#eeeeee] border border-[#e6e6e6] text-sm text-[#6b6b6b] cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#04250e] bg-[#dcfae5] px-2 py-0.5 rounded">
                        Clerk verified
                      </span>
                    </div>
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      Authentication credential managed securely via Clerk.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Contact phone number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors tabular-nums"
                    />
                    <p className="text-xs text-[#6b6b6b] mt-1">
                      Reserved for courier dispatch confirmations and delivery notices.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Personal styling notes
                    </label>
                    <textarea
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="w-full p-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#f0f0f0] flex justify-end">
                    <button
                      type="submit"
                      disabled={saveStatus.state === 'saving'}
                      className="px-4 py-2 rounded-md bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
                    >
                      {saveStatus.state === 'saving' ? 'Saving…' : 'Save profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Sizing & Bespoke */}
        {activeTab === 'sizing' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Context & Sizing Card Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <h2 className="text-base font-medium text-[#0a0a0a]">
                    Atelier sizing specifications
                  </h2>
                  <p className="text-sm text-[#6b6b6b] mt-1">
                    Your preferred garment measurements for instant bag pre-selection and bespoke tailoring consultations.
                  </p>
                </div>

                {/* Sizing Blueprint Card */}
                <div className="p-4 rounded-lg bg-white border border-[#e6e6e6] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
                    <span className="text-xs font-medium text-[#0a0a0a]">Active sizing profile</span>
                    <span className="text-xs font-mono text-[#6b6b6b]">ZN-FIT-2026</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#f0f0f0]">
                      <span className="text-[#6b6b6b]">Top &amp; knitwear</span>
                      <span className="font-semibold text-[#0a0a0a] tabular-nums">{sizingForm.top_size}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#f0f0f0]">
                      <span className="text-[#6b6b6b]">Waist &amp; trousers</span>
                      <span className="font-semibold text-[#0a0a0a] tabular-nums">{sizingForm.bottom_size}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#f0f0f0]">
                      <span className="text-[#6b6b6b]">Footwear edit</span>
                      <span className="font-semibold text-[#0a0a0a] tabular-nums">{sizingForm.footwear_size}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#6b6b6b]">Cut preference</span>
                      <span className="font-medium text-[#0a0a0a] truncate max-w-[160px] text-right">
                        {sizingForm.silhouette.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sizing Form */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSaveSizing} className="p-6 rounded-lg bg-white border border-[#e6e6e6] space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-2">
                      Standard tops &amp; outerwear size
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {TOP_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSizingForm({ ...sizingForm, top_size: size })}
                          className={`h-10 rounded-md border text-sm font-medium tabular-nums transition-colors ${
                            sizingForm.top_size === size
                              ? 'bg-[#141414] text-white border-[#141414]'
                              : 'bg-white text-[#0a0a0a] border-[#e6e6e6] hover:bg-[#eeeeee]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-2">
                      Waist &amp; bottoms size (inches)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {BOTTOM_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSizingForm({ ...sizingForm, bottom_size: size })}
                          className={`h-10 rounded-md border text-sm font-medium tabular-nums transition-colors ${
                            sizingForm.bottom_size === size
                              ? 'bg-[#141414] text-white border-[#141414]'
                              : 'bg-white text-[#0a0a0a] border-[#e6e6e6] hover:bg-[#eeeeee]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Footwear sizing
                    </label>
                    <select
                      value={sizingForm.footwear_size}
                      onChange={(e) => setSizingForm({ ...sizingForm, footwear_size: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                    >
                      {FOOTWEAR_SIZES.map((fs) => (
                        <option key={fs} value={fs}>{fs}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Preferred silhouette &amp; cut
                    </label>
                    <select
                      value={sizingForm.silhouette}
                      onChange={(e) => setSizingForm({ ...sizingForm, silhouette: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                    >
                      {SILHOUETTES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Capsule colorway direction
                    </label>
                    <select
                      value={sizingForm.palette_preference}
                      onChange={(e) => setSizingForm({ ...sizingForm, palette_preference: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                    >
                      {PALETTES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-3 border-t border-[#f0f0f0] flex justify-end">
                    <button
                      type="submit"
                      disabled={saveStatus.state === 'saving'}
                      className="px-4 py-2 rounded-md bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
                    >
                      {saveStatus.state === 'saving' ? 'Saving…' : 'Save sizing specifications'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Delivery Address */}
        {activeTab === 'shipping' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Context & Address Card */}
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <h2 className="text-base font-medium text-[#0a0a0a]">
                    Default courier destination
                  </h2>
                  <p className="text-sm text-[#6b6b6b] mt-1">
                    Your pre-configured shipping address for fast checkout. Prefills automatically on your next order.
                  </p>
                </div>

                {/* Dispatch Label Preview */}
                <div className="p-4 rounded-lg bg-white border border-[#e6e6e6] space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
                    <span className="font-medium text-[#0a0a0a]">Courier dispatch label</span>
                    <span className="text-[#6b6b6b]">Express Priority</span>
                  </div>

                  <div className="text-[#0a0a0a] leading-relaxed space-y-0.5">
                    <p className="font-bold">{shippingForm.recipient_name || 'Recipient Name'}</p>
                    <p>{shippingForm.street || 'Street Address'}</p>
                    {shippingForm.apartment && <p>{shippingForm.apartment}</p>}
                    <p>
                      {shippingForm.city || 'City'}, {shippingForm.state || 'State'} {shippingForm.postal_code || 'Postal Code'}
                    </p>
                    <p>{shippingForm.country}</p>
                    {shippingForm.phone && <p className="text-[#6b6b6b] pt-1">Tel: {shippingForm.phone}</p>}
                  </div>

                  {shippingForm.instructions && (
                    <div className="pt-2 border-t border-[#f0f0f0] text-[#6b6b6b] text-xs">
                      <span className="font-medium text-[#0a0a0a] block">Notes:</span>
                      <span>{shippingForm.instructions}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Address Form */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSaveShipping} className="p-6 rounded-lg bg-white border border-[#e6e6e6] space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                        Recipient full name
                      </label>
                      <input
                        type="text"
                        value={shippingForm.recipient_name}
                        onChange={(e) => setShippingForm({ ...shippingForm, recipient_name: e.target.value })}
                        required
                        className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                        Courier contact phone
                      </label>
                      <input
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                        placeholder="+1 (555) 012-3456"
                        className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Street address
                    </label>
                    <input
                      type="text"
                      value={shippingForm.street}
                      onChange={(e) => setShippingForm({ ...shippingForm, street: e.target.value })}
                      placeholder="e.g. 742 Evergreen Terrace"
                      required
                      className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Apartment, suite, or unit (optional)
                    </label>
                    <input
                      type="text"
                      value={shippingForm.apartment}
                      onChange={(e) => setShippingForm({ ...shippingForm, apartment: e.target.value })}
                      placeholder="e.g. Penthouse 4B"
                      className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                        required
                        className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                        State or region
                      </label>
                      <input
                        type="text"
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                        required
                        className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                        Postal code
                      </label>
                      <input
                        type="text"
                        value={shippingForm.postal_code}
                        onChange={(e) => setShippingForm({ ...shippingForm, postal_code: e.target.value })}
                        required
                        className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Country or territory
                    </label>
                    <select
                      value={shippingForm.country}
                      onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-1.5">
                      Delivery instructions for courier
                    </label>
                    <input
                      type="text"
                      value={shippingForm.instructions}
                      onChange={(e) => setShippingForm({ ...shippingForm, instructions: e.target.value })}
                      placeholder="e.g. Leave with concierge or dial code #4102"
                      className="w-full h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-sm text-[#0a0a0a] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#f0f0f0] flex justify-end">
                    <button
                      type="submit"
                      disabled={saveStatus.state === 'saving'}
                      className="px-4 py-2 rounded-md bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
                    >
                      {saveStatus.state === 'saving' ? 'Saving…' : 'Save delivery destination'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: Notifications & Privacy */}
        {activeTab === 'notifications' && (
          <div className="space-y-10">
            {/* Communication Preferences */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-2">
                <h2 className="text-base font-medium text-[#0a0a0a]">
                  Communication alerts
                </h2>
                <p className="text-sm text-[#6b6b6b]">
                  Choose which alerts and atelier updates are delivered to your registered email and phone.
                </p>
              </div>

              <div className="lg:col-span-7">
                <form onSubmit={handleSaveNotifications} className="p-6 rounded-lg bg-white border border-[#e6e6e6] space-y-5">
                  {/* Switch 1 */}
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-[#f0f0f0]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0a0a0a]">Order &amp; delivery tracking</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#dcfae5] text-[#04250e]">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-[#6b6b6b]">
                        Receive real-time dispatch, transit milestones, and courier confirmation notices.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notificationsForm.notify_order_status}
                      onClick={() => setNotificationsForm((prev) => ({ ...prev, notify_order_status: !prev.notify_order_status }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        notificationsForm.notify_order_status ? 'bg-[#0a0a0a]' : 'bg-[#d4d4d4]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationsForm.notify_order_status ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 2 */}
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-[#f0f0f0]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0a0a0a]">Capsule drops &amp; private salons</span>
                      </div>
                      <p className="text-xs text-[#6b6b6b]">
                        Early access reservations for seasonal editions and atelier releases.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notificationsForm.notify_capsule_drops}
                      onClick={() => setNotificationsForm((prev) => ({ ...prev, notify_capsule_drops: !prev.notify_capsule_drops }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        notificationsForm.notify_capsule_drops ? 'bg-[#0a0a0a]' : 'bg-[#d4d4d4]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationsForm.notify_capsule_drops ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 3 */}
                  <div className="flex items-center justify-between gap-4 py-2 border-b border-[#f0f0f0]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0a0a0a]">Wishlist restock alerts</span>
                      </div>
                      <p className="text-xs text-[#6b6b6b]">
                        Receive an immediate notice when saved pieces in your wishlist return to stock.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notificationsForm.notify_restocks}
                      onClick={() => setNotificationsForm((prev) => ({ ...prev, notify_restocks: !prev.notify_restocks }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        notificationsForm.notify_restocks ? 'bg-[#0a0a0a]' : 'bg-[#d4d4d4]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationsForm.notify_restocks ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 4 */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0a0a0a]">Editorial lookbook letters</span>
                      </div>
                      <p className="text-xs text-[#6b6b6b]">
                        Monthly atelier journals covering craft, materials, and artisan interviews.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notificationsForm.notify_editorials}
                      onClick={() => setNotificationsForm((prev) => ({ ...prev, notify_editorials: !prev.notify_editorials }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        notificationsForm.notify_editorials ? 'bg-[#0a0a0a]' : 'bg-[#d4d4d4]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationsForm.notify_editorials ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[#f0f0f0] flex justify-end">
                    <button
                      type="submit"
                      disabled={saveStatus.state === 'saving'}
                      className="px-4 py-2 rounded-md bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
                    >
                      {saveStatus.state === 'saving' ? 'Saving…' : 'Save notification rules'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="border-t border-[#e6e6e6]" />

            {/* Privacy & Account Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-2">
                <h2 className="text-base font-medium text-[#0a0a0a]">
                  Privacy &amp; account control
                </h2>
                <p className="text-sm text-[#6b6b6b]">
                  Download your stored atelier data or terminate your active member session.
                </p>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="p-6 rounded-lg bg-white border border-[#e6e6e6] space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#0a0a0a]">
                      Authenticated member identifier
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={user?.id || '—'}
                        className="w-full h-10 px-3 rounded-md bg-[#eeeeee] border border-[#e6e6e6] text-xs font-mono text-[#0a0a0a]"
                      />
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="h-10 px-3 rounded-md bg-white border border-[#e6e6e6] text-xs font-medium text-[#0a0a0a] hover:bg-[#eeeeee] transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        {copiedId ? <Check size={13} className="text-[#04250e]" /> : <Copy size={13} />}
                        <span>{copiedId ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#f0f0f0]">
                    <div>
                      <p className="text-sm font-medium text-[#0a0a0a]">Export atelier record</p>
                      <p className="text-xs text-[#6b6b6b]">Download JSON copy of your sizing, addresses, and history.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="px-3.5 py-2 rounded-md bg-white border border-[#e6e6e6] text-xs font-medium text-[#0a0a0a] hover:bg-[#eeeeee] transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Download size={13} />
                      <span>Export data</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#f0f0f0]">
                    <div>
                      <p className="text-sm font-medium text-[#c4242a]">Terminate session</p>
                      <p className="text-xs text-[#6b6b6b]">Safely sign out from this device.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => signOut({ redirectUrl: '/' })}
                      className="px-3.5 py-2 rounded-md bg-[#ffedea] text-[#831c1e] text-xs font-medium hover:bg-[#fed7d7] transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <LogOut size={13} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
