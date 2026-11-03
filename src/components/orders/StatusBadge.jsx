import React from 'react'
import { STATUS_META, isCodOrder, isCodOrderApproved } from '../../lib/orders'

const StatusBadge = ({ status, order }) => {
  const meta = STATUS_META[status] || { label: status, tone: 'bg-neutral-100 text-neutral-600 border-neutral-200' }

  if (order && status === 'to_ship' && isCodOrder(order)) {
    const approved = isCodOrderApproved(order)
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${
        approved
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${approved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
        {approved ? 'To Ship · Approved' : 'To Ship · COD Pending'}
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
