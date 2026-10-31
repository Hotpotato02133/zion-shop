import React from 'react'
import { Check } from 'lucide-react'

const STEPS = ['Bag', 'Sign in', 'Delivery & payment', 'Confirmation']

/** current: 0-based index of the active step */
const CheckoutSteps = ({ current }) => (
  <ol className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold overflow-x-auto pb-1">
    {STEPS.map((label, index) => {
      const done = index < current
      const active = index === current
      return (
        <li key={label} className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              done
                ? 'bg-neutral-950 text-white border-neutral-950'
                : active
                  ? 'border-neutral-950 text-neutral-950'
                  : 'border-neutral-200 text-neutral-400'
            }`}
          >
            {done ? <Check size={11} strokeWidth={3} /> : index + 1}
          </span>
          <span className={active ? 'text-neutral-950' : done ? 'text-neutral-600' : 'text-neutral-400'}>{label}</span>
          {index < STEPS.length - 1 && <span className="w-4 sm:w-8 h-px bg-neutral-200" />}
        </li>
      )
    })}
  </ol>
)

export default CheckoutSteps
