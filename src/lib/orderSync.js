// Cross-tab & same-tab real-time order synchronization bus
// Complements Supabase Realtime & polling so customer <-> admin actions reflect immediately.

const CHANNEL_NAME = 'zion_orders_sync'
const STORAGE_EVENT_KEY = 'zion_orders_sync_event'
const APPROVED_COD_KEY = 'zion_approved_cod_orders'

export const markCodApprovedLocally = (orderId) => {
  if (!orderId || typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(APPROVED_COD_KEY)
    const list = raw ? JSON.parse(raw) : []
    if (!list.includes(orderId)) {
      list.push(orderId)
      localStorage.setItem(APPROVED_COD_KEY, JSON.stringify(list.slice(-200)))
    }
  } catch {
    // ignore storage errors
  }
}

export const isCodApprovedLocally = (orderId) => {
  if (!orderId || typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(APPROVED_COD_KEY)
    if (!raw) return false
    const list = JSON.parse(raw)
    return Array.isArray(list) && list.includes(orderId)
  } catch {
    return false
  }
}

export const notifyOrderSync = (payload = {}) => {
  if (typeof window === 'undefined') return
  const message = {
    ...payload,
    timestamp: Date.now()
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(CHANNEL_NAME)
      bc.postMessage(message)
      bc.close()
    }
  } catch {
    // ignore BroadcastChannel errors
  }

  try {
    localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(message))
  } catch {
    // ignore storage quota errors
  }

  try {
    window.dispatchEvent(new CustomEvent('zion:order-sync', { detail: message }))
  } catch {
    // ignore custom event errors
  }
}

export const subscribeOrderSync = (onSync) => {
  if (typeof window === 'undefined' || typeof onSync !== 'function') {
    return () => {}
  }

  let bc = null
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CHANNEL_NAME)
      bc.onmessage = (event) => {
        if (event?.data) onSync(event.data)
      }
    }
  } catch {
    bc = null
  }

  const handleStorage = (event) => {
    if (event.key === STORAGE_EVENT_KEY && event.newValue) {
      try {
        onSync(JSON.parse(event.newValue))
      } catch {
        onSync({})
      }
    }
  }

  const handleCustom = (event) => {
    onSync(event?.detail || {})
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener('zion:order-sync', handleCustom)

  return () => {
    if (bc) {
      try {
        bc.close()
      } catch {
        // ignore
      }
    }
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener('zion:order-sync', handleCustom)
  }
}

