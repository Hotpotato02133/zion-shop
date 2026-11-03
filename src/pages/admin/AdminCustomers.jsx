import React, { useEffect, useMemo, useState } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { formatDate, money } from '../../lib/orders'

const AdminCustomers = () => {
  const { supabase } = useSupabase()
  const [profiles, setProfiles] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('user_id, total, status, payment_status')
    ]).then(([p, o]) => {
      if (cancelled) return
      if (p.error || o.error) setError((p.error || o.error).message)
      setProfiles(p.data || [])
      setOrders(o.data || [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [supabase])

  const rows = useMemo(() => {
    const totals = {}
    orders.forEach(o => {
      const t = totals[o.user_id] || (totals[o.user_id] = { count: 0, spent: 0 })
      t.count += 1
      if (o.payment_status === 'paid') t.spent += Number(o.total)
    })
    const needle = query.trim().toLowerCase()
    return profiles
      .filter(p => !needle || `${p.full_name} ${p.email}`.toLowerCase().includes(needle))
      .map(p => ({ ...p, ...(totals[p.id] || { count: 0, spent: 0 }) }))
  }, [profiles, orders, query])

  return (
    <div className="space-y-6 w-full">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search name or email…"
        className="w-full sm:w-80 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white transition-colors"
      />
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-xs overflow-x-auto transition-colors">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium border-b border-neutral-100 dark:border-neutral-800">
            <tr>
              <th className="p-4">Customer</th><th className="p-4">Email</th>
              <th className="p-4 text-right">Orders</th><th className="p-4 text-right">Paid spend</th><th className="p-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-400 dark:text-neutral-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-400 dark:text-neutral-500">No customers found.</td></tr>
            ) : rows.map(p => (
              <tr key={p.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors">
                <td className="p-4 font-semibold text-neutral-900 dark:text-white">{p.full_name || '—'}</td>
                <td className="p-4 text-neutral-500 dark:text-neutral-400">{p.email || '—'}</td>
                <td className="p-4 text-right text-neutral-900 dark:text-neutral-200">{p.count}</td>
                <td className="p-4 text-right font-medium text-neutral-900 dark:text-white">{money(p.spent)}</td>
                <td className="p-4 text-neutral-500 dark:text-neutral-400">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminCustomers
