// Shared order constants + formatting helpers
import { isCodApprovedLocally } from './orderSync'

export const ORDER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'to_pay', label: 'To Pay' },
  { key: 'to_ship', label: 'To Ship' },
  { key: 'to_receive', label: 'To Receive' },
  { key: 'completed', label: 'Completed' },
  { key: 'return_refund', label: 'Return/Refund' },
  { key: 'cancelled', label: 'Cancelled' }
]

export const STATUS_META = {
  to_pay: { label: 'To Pay', tone: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60', hint: 'Waiting for your payment' },
  to_ship: { label: 'To Ship', tone: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60', hint: 'We are preparing your order' },
  to_receive: { label: 'On Delivery', tone: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60', hint: 'Your order is on delivery' },
  completed: { label: 'Completed', tone: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60', hint: 'Delivered' },
  return_refund: { label: 'Return/Refund', tone: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60', hint: 'Return in progress' },
  cancelled: { label: 'Cancelled', tone: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700', hint: 'This order was cancelled' }
}

export const PAYMENT_LABELS = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  cod: 'Cash on delivery',
  refund_pending: 'Refund pending',
  refunded: 'Refunded'
}

export const RETURN_LABELS = {
  requested: 'Return requested',
  approved: 'Return approved',
  rejected: 'Return declined',
  refunded: 'Refunded'
}

/** Check if an order is Cash on Delivery */
export const isCodOrder = (order) =>
  order?.payment_method === 'cod' || order?.payment_status === 'cod'

/** Check if a COD order has been approved by admin for shipping */
export const isCodOrderApproved = (order) => {
  if (!order || !isCodOrder(order)) return true
  if (order.status === 'cancelled') return false
  if (['to_receive', 'completed', 'return_refund'].includes(order.status)) return true
  if (order.shipping_address?.cod_approved === true) return true
  if (order.id && isCodApprovedLocally(order.id)) return true
  const events = order.order_events || []
  return events.some(ev => /approved|confirmed for shipping|ready for dispatch/i.test(ev.note || ''))
}

/** Check if a cancelled order was cancelled by the customer (rather than the store/admin) */
export const isCancelledByCustomer = (order) => {
  if (!order || order.status !== 'cancelled') return false
  if (/^cancelled by (store|admin)/i.test(order.cancel_reason || '')) return false
  const events = order.order_events || []
  if (events.some(ev => ev.status === 'cancelled' && /^cancelled by (store|admin)/i.test(ev.note || ''))) {
    return false
  }
  return true
}

/** Sort order_events newest-first, breaking same-timestamp ties logically */
export const sortOrderEvents = (events = []) => {
  const rank = (ev) => {
    const status = ev?.status || ''
    const note = ev?.note || ''
    if (status === 'placed' || /^order placed$/i.test(note)) return 0
    if (/cash on delivery - preparing your order|awaiting store approval/i.test(note)) return 1
    if (/approved|confirmed for shipping/i.test(note)) return 2
    if (status === 'to_receive') return 3
    if (status === 'completed') return 4
    if (status === 'return_refund') return 5
    if (status === 'cancelled') return 6
    return 2
  }
  return [...events].sort((a, b) => {
    const tA = new Date(a?.created_at || 0).getTime()
    const tB = new Date(b?.created_at || 0).getTime()
    if (Math.abs(tB - tA) > 1500) return tB - tA
    return rank(b) - rank(a)
  })
}

/** Format an order timeline event note so initial COD placement accurately reflects approval state */
export const formatOrderEventNote = (event, order) => {
  if (!event) return ''
  const rawNote = event.note || STATUS_META[event.status]?.label || event.status || ''
  if (
    order &&
    isCodOrder(order) &&
    event.status === 'to_ship' &&
    /cash on delivery - preparing your order/i.test(rawNote)
  ) {
    if (order.status === 'to_ship' && !isCodOrderApproved(order)) {
      return 'Cash on delivery — awaiting store approval for shipping'
    }
    return 'Cash on delivery — submitted for store verification'
  }
  return rawNote
}

/** Customer-facing & admin-facing contextual status hint */
export const getOrderStatusHint = (order) => {
  if (!order) return ''
  if (order.status === 'to_ship') {
    if (isCodOrder(order)) {
      return isCodOrderApproved(order)
        ? 'Cash on delivery · Approved by store, preparing to ship'
        : 'Cash on delivery · Order placed, awaiting store approval'
    }
    return 'Payment confirmed · Preparing your order'
  }
  if (order.status === 'to_receive') {
    return order.courier
      ? `On delivery via ${order.courier}${order.tracking_number ? ` · Tracking: ${order.tracking_number}` : ''}`
      : 'On delivery · Your order is on its way'
  }
  if (order.status === 'cancelled') {
    if (order.cancel_reason) {
      return isCancelledByCustomer(order)
        ? `Cancelled by customer · ${order.cancel_reason}`
        : `Cancelled · ${order.cancel_reason}`
    }
    return 'This order was cancelled'
  }
  return STATUS_META[order.status]?.hint || ''
}

export const money = (value) => `$${(Number(value) || 0).toFixed(2)}`

export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'

/** Turn a Supabase/Postgres error into a sentence a customer can act on. */
export const friendlyError = (error) => {
  const message = error?.message || 'Something went wrong. Please try again.'
  if (/JWT|PGRST301|not authenticated/i.test(message)) return 'Your session expired. Please sign in again.'
  return message
}
