import React from 'react'
import { STATUS_META } from '../../lib/orders'

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, tone: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${meta.tone}`}>
      {meta.label}
    </span>
  )
}

export default StatusBadge
