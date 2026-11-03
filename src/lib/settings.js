// Shared settings helpers for Storefront & Admin Portal
import { supabase, isSupabaseConfigured } from './supabase'

export const DEFAULT_STORE_SETTINGS = {
  store_name: 'ZION Atelier',
  store_tagline: 'Modern Luxury & Bespoke Apparel',
  concierge_email: 'concierge@zion-atelier.com',
  currency: 'USD ($)',
  headquarters: 'New York · Paris',
  free_shipping_threshold: '150.00',
  standard_shipping_fee: '15.00',
  return_window_days: '30',
  demo_payments: 'true',
  allow_cod: 'true',
  low_stock_threshold: '5',
  notify_low_stock: 'true',
  auto_archive_depleted: 'false'
}

export const DEFAULT_CUSTOMER_PREFERENCES = {
  preferred_name: '',
  phone: '',
  bio: 'Patron of contemporary minimalist tailoring.',
  top_size: 'M',
  bottom_size: '32',
  footwear_size: 'EU 42 / US 9',
  silhouette: 'Tailored',
  palette_preference: 'Monochrome',
  notify_order_status: true,
  notify_capsule_drops: true,
  notify_restocks: true,
  notify_editorials: false
}

export const DEFAULT_SHIPPING_ADDRESS = {
  recipient_name: '',
  phone: '',
  street: '',
  apartment: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'United States',
  instructions: ''
}

/**
 * Loads store settings from Supabase app_settings table, falling back to localStorage and defaults.
 */
export async function getStoreSettings() {
  const local = {}
  try {
    const raw = localStorage.getItem('zion_store_settings')
    if (raw) Object.assign(local, JSON.parse(raw))
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured) {
    return { ...DEFAULT_STORE_SETTINGS, ...local }
  }

  try {
    const { data, error } = await supabase.from('app_settings').select('key, value')
    if (error || !data) {
      return { ...DEFAULT_STORE_SETTINGS, ...local }
    }
    const dbSettings = {}
    data.forEach(row => {
      dbSettings[row.key] = row.value
    })
    return { ...DEFAULT_STORE_SETTINGS, ...local, ...dbSettings }
  } catch {
    return { ...DEFAULT_STORE_SETTINGS, ...local }
  }
}

/**
 * Persists store settings to Supabase app_settings table and mirrors to localStorage.
 */
export async function saveStoreSettings(settings) {
  try {
    localStorage.setItem('zion_store_settings', JSON.stringify(settings))
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured) {
    return { success: true, localOnly: true }
  }

  try {
    const upserts = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value)
    }))

    const { error } = await supabase.from('app_settings').upsert(upserts)
    if (error) {
      console.warn('[Zion Settings] Database sync notice:', error.message)
      return { success: true, localOnly: true, warning: error.message }
    }
    return { success: true, localOnly: false }
  } catch (err) {
    console.warn('[Zion Settings] Failed to persist to Supabase:', err)
    return { success: true, localOnly: true }
  }
}

/**
 * Loads customer preferences for a given user ID.
 */
export function getCustomerPreferences(userId) {
  if (!userId) return DEFAULT_CUSTOMER_PREFERENCES
  try {
    const raw = localStorage.getItem(`zion_preferences_${userId}`)
    if (raw) return { ...DEFAULT_CUSTOMER_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return DEFAULT_CUSTOMER_PREFERENCES
}

/**
 * Saves customer preferences for a given user ID.
 */
export function saveCustomerPreferences(userId, prefs) {
  if (!userId) return
  try {
    localStorage.setItem(`zion_preferences_${userId}`, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

/**
 * Loads saved default shipping address for a user (synced with Checkout).
 */
export function getSavedShippingAddress(userId) {
  const key = `zion_last_shipping_${userId || 'guest'}`
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        recipient_name: parsed.full_name || '',
        phone: parsed.phone || '',
        street: parsed.street_address || parsed.street || '',
        apartment: parsed.apartment || '',
        city: parsed.city || '',
        state: parsed.state || '',
        postal_code: parsed.postal_code || '',
        country: parsed.country || 'United States',
        instructions: parsed.delivery_notes || parsed.instructions || ''
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SHIPPING_ADDRESS
}

/**
 * Saves default shipping address (synced with Checkout format).
 */
export function saveShippingAddress(userId, address) {
  const key = `zion_last_shipping_${userId || 'guest'}`
  const checkoutPayload = {
    full_name: address.recipient_name,
    phone: address.phone,
    street_address: address.street,
    apartment: address.apartment,
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
    country: address.country,
    delivery_notes: address.instructions
  }
  try {
    localStorage.setItem(key, JSON.stringify(checkoutPayload))
  } catch {
    // ignore
  }
}
