// Shared order constants + formatting helpers

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
  to_pay: { label: 'To Pay', tone: 'bg-amber-50 text-amber-800 border-amber-200', hint: 'Waiting for your payment' },
  to_ship: { label: 'To Ship', tone: 'bg-sky-50 text-sky-800 border-sky-200', hint: 'We are preparing your order' },
  to_receive: { label: 'To Receive', tone: 'bg-indigo-50 text-indigo-800 border-indigo-200', hint: 'Your order is on its way' },
  completed: { label: 'Completed', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200', hint: 'Delivered' },
  return_refund: { label: 'Return/Refund', tone: 'bg-rose-50 text-rose-800 border-rose-200', hint: 'Return in progress' },
  cancelled: { label: 'Cancelled', tone: 'bg-neutral-100 text-neutral-600 border-neutral-200', hint: 'This order was cancelled' }
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
