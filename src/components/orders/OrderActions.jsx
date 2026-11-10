import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Camera, Loader2, Sparkles, X } from 'lucide-react'
import { useSupabase } from '../../context/SupabaseContext'
import { fetchDemoPaymentsEnabled, startPayment } from '../../lib/payments'
import { friendlyError } from '../../lib/orders'
import { notifyOrderSync } from '../../lib/orderSync'
import { evaluateRefundClaim } from '../../services/refundTriageService'

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Need to change delivery details',
  'Found a better price',
  'Other'
]
const RETURN_REASONS = ['Wrong size', 'Item damaged or defective', 'Not as described', 'Received the wrong item', 'Other']

const primaryBtn =
  'px-5 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2'
const outlineBtn =
  'px-5 py-2.5 rounded-xl border border-neutral-200 text-neutral-900 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-50 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2'

const Dialog = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm" onClick={onClose} />
    <div role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100" aria-label="Close">
        <X size={16} />
      </button>
      <h3 className="font-heading text-xl font-semibold pr-8">{title}</h3>
      {children}
    </div>
  </div>
)

/**
 * Customer actions for one order, driven by its status:
 * To Pay -> pay / cancel · To Ship -> cancel · To Receive -> confirm received · Completed -> request return
 */
const OrderActions = ({ order, onUpdated }) => {
  const { supabase } = useSupabase()
  const { user } = useUser()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null) // 'cancel' | 'return'
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [damagePhotoFile, setDamagePhotoFile] = useState(null)
  const [damagePreviewUrl, setDamagePreviewUrl] = useState('')
  const [demoEnabled, setDemoEnabled] = useState(false)

  const awaitingOnlinePayment = order.status === 'to_pay' && order.payment_method === 'paymongo'

  useEffect(() => {
    if (!awaitingOnlinePayment) return
    let cancelled = false
    fetchDemoPaymentsEnabled(supabase).then(enabled => { if (!cancelled) setDemoEnabled(enabled) })
    return () => { cancelled = true }
  }, [awaitingOnlinePayment, supabase])

  const run = async (task) => {
    setBusy(true)
    setError('')
    try {
      await task()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const callRpc = (name, params) => run(async () => {
    const { data, error: rpcError } = await supabase.rpc(name, params)
    if (rpcError) throw rpcError
    setDialog(null)
    setReason('')
    setDetails('')
    notifyOrderSync({
      type: name,
      orderId: order.id,
      orderNumber: order.order_number,
      status: data?.status || (name === 'cancel_order' ? 'cancelled' : order.status),
      reason: params?.p_reason || null
    })
    onUpdated?.(data)
  })

  const payNow = () => run(() => startPayment(supabase, order))
  const simulatePayment = () => callRpc('demo_mark_paid', { p_order_id: order.id })

  const closeDialog = () => {
    setDialog(null)
    setError('')
    setDamagePhotoFile(null)
    setDamagePreviewUrl('')
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDamagePhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setDamagePreviewUrl(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const reasonText = [reason, details.trim()].filter(Boolean).join(' - ')

  const submitReturnWithAiTriage = () => run(async () => {
    const primaryItemName =
      order.order_items?.[0]?.name || `Order ${order.order_number}`

    const triageRecord = await evaluateRefundClaim(
      {
        orderId: order.id,
        clerkUserId: user?.id || order.user_id,
        productName: primaryItemName,
        userReason: reasonText,
        damagePhotoFile
      },
      supabase
    )

    const enrichedReason = triageRecord?.status === 'auto_approved'
      ? `${reasonText} [AI Verified ${(Number(triageRecord.ai_confidence_score || 0) * 100).toFixed(0)}%]`
      : reasonText

    const { data, error: rpcError } = await supabase.rpc('request_return', {
      p_order_id: order.id,
      p_reason: enrichedReason
    })
    if (rpcError) throw rpcError
    setDialog(null)
    setReason('')
    setDetails('')
    setDamagePhotoFile(null)
    setDamagePreviewUrl('')
    notifyOrderSync({
      type: 'request_return',
      orderId: order.id,
      orderNumber: order.order_number,
      status: data?.status || order.status,
      reason: enrichedReason
    })
    onUpdated?.(data)
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {awaitingOnlinePayment && (
          <button className={primaryBtn} disabled={busy} onClick={payNow}>
            {busy && <Loader2 size={13} className="animate-spin" />} Pay now
          </button>
        )}
        {awaitingOnlinePayment && demoEnabled && (
          <button className={outlineBtn} disabled={busy} onClick={simulatePayment} title="Demo mode only">
            Simulate payment (demo)
          </button>
        )}
        {order.status === 'to_receive' && (
          <button className={primaryBtn} disabled={busy} onClick={() => callRpc('confirm_received', { p_order_id: order.id })}>
            {busy && <Loader2 size={13} className="animate-spin" />} Order received
          </button>
        )}
        {(order.status === 'to_pay' || order.status === 'to_ship') && (
          <button className={outlineBtn} disabled={busy} onClick={() => setDialog('cancel')}>Cancel order</button>
        )}
        {order.status === 'completed' && (
          <button className={outlineBtn} disabled={busy} onClick={() => setDialog('return')}>Return / refund</button>
        )}
      </div>

      {error && !dialog && <p role="alert" className="text-xs text-red-600">{error}</p>}

      {dialog === 'cancel' && (
        <Dialog title="Cancel this order?" onClose={closeDialog}>
          <p className="text-xs text-neutral-500">
            {order.payment_status === 'paid'
              ? 'You have already paid. Our team will refund you after the cancellation.'
              : 'Items go back into stock and this cannot be undone.'}
          </p>
          <select value={reason} onChange={e => setReason(e.target.value)} className="w-full p-3 rounded-xl border border-neutral-200 text-sm">
            <option value="">Select a reason…</option>
            {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button className={outlineBtn} onClick={closeDialog}>Keep order</button>
            <button
              className={primaryBtn}
              disabled={busy || !reason}
              onClick={() => callRpc('cancel_order', { p_order_id: order.id, p_reason: reason })}
            >
              {busy && <Loader2 size={13} className="animate-spin" />} Confirm cancel
            </button>
          </div>
        </Dialog>
      )}

      {dialog === 'return' && (
        <Dialog title="Request a return or refund" onClose={closeDialog}>
          <p className="text-xs text-neutral-500">
            Returns are accepted within 30 days of delivery. Attach a photo for instant AI quality verification.
          </p>
          <select value={reason} onChange={e => setReason(e.target.value)} className="w-full p-3 rounded-xl border border-neutral-200 text-sm">
            <option value="">Select a reason…</option>
            {RETURN_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={3}
            placeholder="Tell us a bit more (optional)"
            className="w-full p-3 rounded-xl border border-neutral-200 text-sm"
          />

          {/* AI Vision Evidence Upload */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700 inline-flex items-center gap-1.5">
                <Sparkles size={13} /> AI Instant Return Triage
              </span>
              <span className="text-[10px] text-neutral-400">Optional photo</span>
            </div>
            <div className="flex items-center gap-3">
              {damagePreviewUrl && (
                <img
                  src={damagePreviewUrl}
                  alt="Evidence preview"
                  className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                />
              )}
              <label className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-neutral-300 bg-white hover:border-black text-xs font-medium text-neutral-700 cursor-pointer transition-colors">
                <Camera size={14} />
                <span>{damagePhotoFile ? damagePhotoFile.name : 'Upload photo of item / defect'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button className={outlineBtn} onClick={closeDialog}>Close</button>
            <button
              className={primaryBtn}
              disabled={busy || !reason}
              onClick={submitReturnWithAiTriage}
            >
              {busy && <Loader2 size={13} className="animate-spin" />}
              {busy ? 'AI Verifying…' : 'Submit request'}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export default OrderActions
