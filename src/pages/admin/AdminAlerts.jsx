import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSupabase } from '../../context/SupabaseContext'

const POLL_MS = 20000

const AdminAlertsContext = createContext(null)

/**
 * Polls the database for what needs the admin's attention: unread notifications
 * (new orders, return requests, stock alerts), action counts, and low-stock products.
 * Polling keeps this simple and works with Clerk tokens; swap for Realtime later if needed.
 */
export const AdminAlertsProvider = ({ children }) => {
  const { supabase } = useSupabase()
  const [notifications, setNotifications] = useState([])
  const [counts, setCounts] = useState({ toShip: 0, returns: 0 })
  const [lowStock, setLowStock] = useState([])
  const [freshAlerts, setFreshAlerts] = useState([]) // newly arrived since last poll -> toasts
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState('')
  const seen = useRef(null)

  const refresh = useCallback(async () => {
    const [notes, toShip, returns, products] = await Promise.all([
      supabase.from('admin_notifications').select('*').is('read_at', null).order('created_at', { ascending: false }).limit(30),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'to_ship'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'return_refund').eq('return_status', 'requested'),
      supabase.from('products').select('id, name, stock, low_stock_threshold, image_url').eq('is_active', true)
    ])

    const failure = notes.error || toShip.error || returns.error || products.error
    if (failure) {
      // 42P01 = notifications table missing (migration 003 not run yet): degrade quietly
      setError(failure.code === '42P01' ? 'Run migration 003_admin_notifications.sql to enable alerts.' : failure.message)
    } else {
      setError('')
    }

    const list = notes.data || []
    if (seen.current) {
      const arrived = list.filter(n => !seen.current.has(n.id))
      if (arrived.length > 0) setFreshAlerts(prev => [...arrived, ...prev].slice(0, 4))
    }
    seen.current = new Set(list.map(n => n.id))

    setNotifications(list)
    setCounts({ toShip: toShip.count || 0, returns: returns.count || 0 })
    setLowStock(
      (products.data || [])
        .filter(p => p.stock <= (p.low_stock_threshold ?? 5))
        .sort((a, b) => a.stock - b.stock)
    )
    setLastUpdated(new Date())
  }, [supabase])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  // Surface the unread count in the browser tab so it works from another tab
  useEffect(() => {
    const original = document.title.replace(/^\(\d+\)\s/, '')
    document.title = notifications.length > 0 ? `(${notifications.length}) ${original}` : original
    return () => { document.title = original }
  }, [notifications.length])

  const markRead = useCallback(async (ids) => {
    if (ids.length === 0) return
    await supabase.from('admin_notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
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
