import React from 'react'
import { STATUS_META, isCancelledByCustomer, isCodOrder, isCodOrderApproved } from '../../lib/orders'

const StatusBadge = ({ status, order }) => {
  const meta = STATUS_META[status] || { label: status, tone: 'bg-neutral-100 text-neutral-600 border-neutral-200' }

  if (status === 'cancelled') {
    const byCustomer = order ? isCancelledByCustomer(order) : false
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        {byCustomer && order?.cancel_reason ? 'Cancelled' : 'Cancelled'}
      </span>
    )
  }

  if (order && status === 'to_ship' && isCodOrder(order)) {
    const approved = isCodOrderApproved(order)
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${
        approved
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${approved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
        {approved ? 'To Ship · COD Approved' : 'To Ship · COD Pending'}
      </span>
    )
  }

  if (status === 'to_receive') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        On Delivery · To Receive
      </span>
    )
  }

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full border text-xs font-medium uppercase tracking-wider ${meta.tone}`}>
      {meta.label}
    </span>
  )
}

export default StatusBadge
