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
    <div className="space-y-4">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search name or email…"
        className="w-full sm:w-80 p-3 rounded-xl border border-neutral-200 bg-white text-sm"
      />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="p-4">Customer</th><th className="p-4">Email</th>
              <th className="p-4 text-right">Orders</th><th className="p-4 text-right">Paid spend</th><th className="p-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-400">No customers found.</td></tr>
            ) : rows.map(p => (
              <tr key={p.id}>
                <td className="p-4 font-semibold">{p.full_name || '—'}</td>
                <td className="p-4 text-neutral-500">{p.email || '—'}</td>
                <td className="p-4 text-right">{p.count}</td>
                <td className="p-4 text-right">{money(p.spent)}</td>
                <td className="p-4 text-neutral-500">{formatDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminCustomers
