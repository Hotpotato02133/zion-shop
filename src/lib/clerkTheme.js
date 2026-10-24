/**
 * Custom luxury monochrome theme for Clerk Authentication components
 * Aligns with Zion UI Design System (Urbanist, Hauora Sans, High-Contrast B&W)
 */
export const luxuryClerkAppearance = {
  layout: {
    socialButtonsPlacement: 'bottom',
    socialButtonsVariant: 'blockButton',
    showOptionalFields: false
  },
  variables: {
    colorPrimary: '#000000',
    colorText: '#0a0a0a',
    colorTextSecondary: '#737373',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#0a0a0a',
    colorDanger: '#ef4444',
    fontFamily: 'Hauora Sans, system-ui, sans-serif',
    borderRadius: '0.75rem'
  },
  elements: {
    rootBox: 'w-full max-w-md mx-auto',
    card: 'border border-neutral-200 shadow-2xl rounded-2xl bg-white p-6 sm:p-8',
    headerTitle: 'font-heading font-bold text-2xl sm:text-3xl tracking-tight text-neutral-950',
    headerSubtitle: 'text-xs text-neutral-500 font-medium tracking-wide mt-1',
    formButtonPrimary: 
      'bg-black text-white hover:bg-neutral-800 text-xs font-semibold uppercase tracking-widest py-3 px-6 rounded-xl transition-all duration-200 shadow-sm active:scale-[0.99]',
    formFieldInput: 
      'border-neutral-200 focus:border-black focus:ring-1 focus:ring-black text-xs py-2.5 px-3.5 rounded-xl transition-colors',
    formFieldLabel: 
      'text-[11px] font-semibold uppercase tracking-wider text-neutral-700 mb-1.5',
    socialButtonsBlockButton: 
      'border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-xs font-semibold text-neutral-800 rounded-xl py-2.5 transition-all',
    socialButtonsBlockButtonText: 
      'text-xs font-semibold tracking-wide text-neutral-800',
    dividerLine: 'bg-neutral-100',
    dividerText: 'text-[10px] uppercase tracking-widest text-neutral-400 font-medium',
    footerActionLink: 'text-black font-semibold hover:underline',
    footerActionText: 'text-xs text-neutral-500',
    identityPreviewText: 'text-xs font-medium text-neutral-800',
    identityPreviewEditButton: 'text-xs text-black font-semibold hover:underline',
    userButtonAvatarBox: 'w-8 h-8 rounded-full border border-neutral-200 shadow-sm',
    userButtonPopoverCard: 'border border-neutral-200 shadow-2xl rounded-2xl p-2 bg-white',
    userButtonPopoverActionButton: 'text-xs hover:bg-neutral-100 transition-colors rounded-lg py-2',
    userButtonPopoverActionButtonText: 'text-xs font-medium text-neutral-800',
    userButtonPopoverFooter: 'hidden'
  }
}
