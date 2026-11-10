import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { isCancelledByCustomer, isCodOrder, isCodOrderApproved } from '../../lib/orders'
import { subscribeOrderSync } from '../../lib/orderSync'

const POLL_MS = 6000
const READ_SYNTH_STORAGE_KEY = 'zion_admin_read_notif_ids_v1'

const readDismissedSynthIds = () => {
  try {
    const raw = localStorage.getItem(READ_SYNTH_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

const saveDismissedSynthIds = (set) => {
  try {
    localStorage.setItem(READ_SYNTH_STORAGE_KEY, JSON.stringify(Array.from(set).slice(-300)))
  } catch {
    // ignore storage errors
  }
}

const AdminAlertsContext = createContext(null)

/**
 * Polls the database + listens to cross-tab order sync for what needs the admin's attention:
 * unread notifications (new orders, customer cancellations, return requests, stock alerts),
 * action counts (toShip, codPending, onDelivery, returns, cancelled), and low-stock products.
 */
export const AdminAlertsProvider = ({ children }) => {
  const { supabase } = useSupabase()
  const [notifications, setNotifications] = useState([])
  const [counts, setCounts] = useState({ toShip: 0, codPending: 0, onDelivery: 0, returns: 0, cancelled: 0 })
  const [lowStock, setLowStock] = useState([])
  const [freshAlerts, setFreshAlerts] = useState([]) // newly arrived since last poll -> toasts
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState('')
  const seen = useRef(null)

  const refresh = useCallback(async () => {
    const [notes, recentOrdersRes, products] = await Promise.all([
      supabase.from('admin_notifications').select('*').is('read_at', null).order('created_at', { ascending: false }).limit(40),
      supabase
        .from('orders')
        .select('id, order_number, status, payment_method, payment_status, total, customer_name, cancel_reason, return_status, shipping_address, created_at, updated_at, order_events(id, status, note, created_at)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('products').select('id, name, stock, low_stock_threshold, image_url').eq('is_active', true)
    ])

    const failure = notes.error || recentOrdersRes.error || products.error
    if (failure) {
      // 42P01 = notifications table missing (migration 003 not run yet): degrade quietly
      setError(failure.code === '42P01' ? 'Run migration 003_admin_notifications.sql to enable alerts.' : failure.message)
    } else {
      setError('')
    }

    const recentOrders = recentOrdersRes.data || []
    const orderById = new Map(recentOrders.map(o => [o.id, o]))
    const dismissedSynth = readDismissedSynthIds()

    const toShipOrders = recentOrders.filter(o => o.status === 'to_ship')
    const codPendingCount = toShipOrders.filter(o => isCodOrder(o) && !isCodOrderApproved(o)).length
    const onDeliveryCount = recentOrders.filter(o => o.status === 'to_receive').length
    const returnsCount = recentOrders.filter(o => o.status === 'return_refund' && o.return_status === 'requested').length
    const cancelledCount = recentOrders.filter(o => o.status === 'cancelled').length

    // Build unified notification list:
    // 1. If a 'new_order' notification belongs to an order that is now 'cancelled', transform/suppress it
    // 2. Synthesize unread 'order_cancelled' alerts for customer-cancelled orders so the admin is always notified
    const dbNotes = notes.data || []
    const dbCancelOrderIds = new Set(
      dbNotes.filter(n => n.type === 'order_cancelled' && n.order_id).map(n => n.order_id)
    )

    const filteredDbNotes = dbNotes.filter(n => {
      if (n.type === 'new_order' && n.order_id) {
        const linked = orderById.get(n.order_id)
        if (linked && linked.status === 'cancelled') {
          return false
        }
      }
      return true
    })

    const synthCancelNotes = []
    for (const o of recentOrders) {
      if (o.status !== 'cancelled') continue
      if (!isCancelledByCustomer(o)) continue
      if (dbCancelOrderIds.has(o.id)) continue
      const synthId = `synth-cancel-${o.id}`
      if (dismissedSynth.has(synthId)) continue

      const cancelEvent = (o.order_events || []).find(ev => ev.status === 'cancelled')
      const cancelledAt = cancelEvent?.created_at || o.updated_at || o.created_at
      synthCancelNotes.push({
        id: synthId,
        type: 'order_cancelled',
        title: `Order ${o.order_number} cancelled by customer`,
        body: `${o.customer_name || 'Customer'} · Reason: ${o.cancel_reason || 'Cancelled by customer'}`,
        order_id: o.id,
        created_at: cancelledAt,
        is_synthetic: true
      })
    }

    const list = [...synthCancelNotes, ...filteredDbNotes].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )

    if (seen.current) {
      const arrived = list.filter(n => !seen.current.has(n.id))
      if (arrived.length > 0) setFreshAlerts(prev => [...arrived, ...prev].slice(0, 4))
    }
    seen.current = new Set(list.map(n => n.id))

    setNotifications(list)
    setCounts({
      toShip: toShipOrders.length,
      codPending: codPendingCount,
      onDelivery: onDeliveryCount,
      returns: returnsCount,
      cancelled: cancelledCount
    })
    setLowStock(
      (products.data || [])
        .filter(p => p.stock <= (p.low_stock_threshold ?? 5))
        .sort((a, b) => a.stock - b.stock)
    )
    setLastUpdated(new Date())
  }, [supabase])

  useEffect(() => {
    refresh()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, POLL_MS)
    const onFocus = () => refresh()
    const unsubscribeSync = subscribeOrderSync(() => refresh())
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(timer)
      unsubscribeSync()
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refresh])

  // Surface the unread count in the browser tab so it works from another tab
  useEffect(() => {
    const original = document.title.replace(/^\(\d+\)\s/, '')
    document.title = notifications.length > 0 ? `(${notifications.length}) ${original}` : original
    return () => { document.title = original }
  }, [notifications.length])

  const markRead = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return
    const synthIds = ids.filter(id => String(id).startsWith('synth-cancel-'))
    const realIds = ids.filter(id => !String(id).startsWith('synth-cancel-'))

    if (synthIds.length > 0) {
      const dismissed = readDismissedSynthIds()
      const cancelledOrderIds = []
      synthIds.forEach(id => {
        dismissed.add(id)
        const orderId = String(id).replace('synth-cancel-', '')
        if (orderId) cancelledOrderIds.push(orderId)
      })
      saveDismissedSynthIds(dismissed)
      if (cancelledOrderIds.length > 0) {
        await supabase
          .from('admin_notifications')
          .update({ read_at: new Date().toISOString() })
          .in('order_id', cancelledOrderIds)
          .is('read_at', null)
      }
    }

    if (realIds.length > 0) {
      await supabase.from('admin_notifications').update({ read_at: new Date().toISOString() }).in('id', realIds)
    }
    await refresh()
  }, [supabase, refresh])

  const dismissFresh = useCallback((id) => setFreshAlerts(prev => prev.filter(n => n.id !== id)), [])

  const value = useMemo(() => ({
    notifications, counts, lowStock, freshAlerts, lastUpdated, error,
    refresh, markRead, dismissFresh
  }), [notifications, counts, lowStock, freshAlerts, lastUpdated, error, refresh, markRead, dismissFresh])

  return <AdminAlertsContext.Provider value={value}>{children}</AdminAlertsContext.Provider>
}

export const useAdminAlerts = () => {
  const ctx = useContext(AdminAlertsContext)
  if (!ctx) throw new Error('useAdminAlerts must be used within AdminAlertsProvider')
  return ctx
}
