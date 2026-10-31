import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Tag, 
  X, 
  CreditCard, 
  Lock, 
  Gift,
  UserPlus
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import CheckoutSteps from '../components/CheckoutSteps'
import { PROMOS, computeTotals, saveCheckoutExtras, toPrice } from '../lib/pricing'
import { loginUrlFor, rememberRedirect } from '../lib/redirect'

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart } = useApp()
  const { isLoaded, isSignedIn } = useAuth()
  const navigate = useNavigate()

  // Promo code state
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')

  // Gift option
  const [isGiftWrapped, setIsGiftWrapped] = useState(false)
  const [giftNote, setGiftNote] = useState('')

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  }

  const { subtotal, discount: discountAmount, tax, shipping, total } = computeTotals(cart, appliedPromo)

  // Promo Code Handler
  const handleApplyPromo = (e) => {
    e.preventDefault()
    setPromoError('')
    const code = promoCode.trim().toUpperCase()

    if (PROMOS[code]) {
      setAppliedPromo(PROMOS[code])
      setPromoCode('')
    } else {
      setPromoError('Invalid privilege code. Try "ZION10" or "ATELIER"')
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoError('')
  }

  // Checkout requires an account: guests are sent to login and brought straight back to /checkout
  const handleCheckout = () => {
    saveCheckoutExtras({ promo: appliedPromo?.code, giftNote: isGiftWrapped ? giftNote : '' })
    if (isSignedIn) {
      navigate('/checkout')
      return
    }
    rememberRedirect('/checkout')
    navigate(loginUrlFor('/checkout'))
  }

  const handleCreateAccount = () => {
    saveCheckoutExtras({ promo: appliedPromo?.code, giftNote: isGiftWrapped ? giftNote : '' })
    rememberRedirect('/checkout')
    navigate('/signup?redirect=' + encodeURIComponent('/checkout'))
  }

  // Empty State
  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] w-full flex items-center justify-center py-16 bg-white text-neutral-950 font-body overflow-x-clip">
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="space-y-6"
          >
            <motion.div variants={fadeInUp} className="w-24 h-24 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mx-auto text-neutral-400 shadow-sm">
              <ShoppingBag size={38} strokeWidth={1.5} />
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Bag Overview</span>
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">
                Your Bag is Empty
              </h1>
              <p className="text-neutral-500 text-sm sm:text-base font-light leading-relaxed max-w-sm mx-auto">
                Discover our curated catalog of everyday apparel, footwear, and finishing accessories.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="pt-4">
              <Link to="/products">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-neutral-950 text-white px-8 py-4 rounded-full text-xs font-semibold tracking-wider uppercase shadow-lg shadow-black/10 hover:bg-black transition-colors inline-flex items-center gap-2"
                >
                  <span>Explore The Collection</span>
                  <ArrowRight size={16} />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full pt-10 pb-20 bg-white text-neutral-950 font-body overflow-x-clip">
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">

        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="mb-10 border-b border-neutral-100 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <motion.div variants={fadeInUp} className="mb-5">
              <CheckoutSteps current={0} />
            </motion.div>
            <motion.span variants={fadeInUp} className="text-xs uppercase tracking-widest font-semibold text-neutral-400 block mb-2">
              Private Order
            </motion.span>
            <motion.h1
              variants={fadeInUp}
              className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight"
            >
              Shopping Bag
            </motion.h1>
          </div>

          <motion.div variants={fadeInUp} className="text-sm text-neutral-500">
            {cart.reduce((t, i) => t + i.quantity, 0)} {cart.reduce((t, i) => t + i.quantity, 0) === 1 ? 'Piece' : 'Pieces'} Selected
          </motion.div>
        </motion.div>

        {/* Main 2-Column Cart Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Line Items & Packaging (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <AnimatePresence>
              {cart.map((item) => {
                const itemPrice = toPrice(item.price)
                const itemLineTotal = (itemPrice * item.quantity).toFixed(2)

                return (
                  <motion.div
                    key={item.productId || item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="p-5 sm:p-6 rounded-[24px] border border-neutral-100 bg-white hover:border-neutral-200 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] shadow-sm transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">

                      {/* Product Thumbnail */}
                      <Link to={`/products?search=${encodeURIComponent(item.name)}`} className="shrink-0 w-24 sm:w-28 aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100 group">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>

                      {/* Details & Quantities */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            {item.category && (
                              <span className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 block mb-1">
                                {item.category}
                              </span>
                            )}
                            <h3 className="font-heading text-lg font-bold text-neutral-950 line-clamp-1">
                              {item.name}
                            </h3>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(item.productId || item.id)}
                            className="p-2 text-neutral-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors shrink-0"
                            title="Remove piece"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-neutral-900">${itemPrice.toFixed(2)}</span>
                          <span className="text-xs text-neutral-400 font-light">each</span>
                        </div>

                        {/* Quantity Controls & Line Total */}
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-50">
                          <div className="flex items-center border border-neutral-200 rounded-2xl">
                            <button
                              onClick={() => updateCartQuantity(item.productId || item.id, item.quantity - 1)}
                              className="p-2.5 text-neutral-500 hover:text-black transition-colors"
                              title="Decrease"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-7 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.productId || item.id, item.quantity + 1)}
                              className="p-2.5 text-neutral-500 hover:text-black transition-colors"
                              title="Increase"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div className="font-heading text-lg font-bold text-neutral-950">
                            ${itemLineTotal}
                          </div>
                        </div>

                      </div>

                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Bespoke Gift Packaging Toggle */}
            <div className="p-5 sm:p-6 rounded-[24px] border border-neutral-100 bg-neutral-50/60 space-y-4">
              <label className="flex items-center justify-between cursor-pointer gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-900 shrink-0">
                    <Gift size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-950">Complimentary Atelier Gift Packaging</p>
                    <p className="text-xs text-neutral-500 font-light">Matte black ribbon box with personalized wax seal certificate.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isGiftWrapped}
                  onChange={(e) => setIsGiftWrapped(e.target.checked)}
                  className="w-5 h-5 rounded border-neutral-300 text-black focus:ring-black cursor-pointer shrink-0"
                />
              </label>

              {isGiftWrapped && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2"
                >
                  <textarea
                    placeholder="Enter your personalized gift inscription (optional)..."
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    rows={2}
                    className="w-full p-3.5 rounded-2xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </motion.div>
              )}
            </div>

            {/* Delivery Guarantee Pill */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs text-neutral-600">
              <Truck size={18} className="text-neutral-900 shrink-0" />
              <span>Complimentary insured air courier. Orders dispatch within 24 hours from Milan.</span>
            </div>

          </div>

          {/* Right Column: Order Summary & Checkout Trigger (5 cols) */}
          <div className="lg:col-span-5">
            <div className="p-7 sm:p-8 rounded-[28px] border border-neutral-100 bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] space-y-6 sticky top-28">

              <h2 className="font-heading text-xl font-bold tracking-tight text-neutral-950">Order Summary</h2>

              {/* Price Rows */}
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Atelier Subtotal</span>
                  <span className="font-medium text-neutral-900">${subtotal.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Tag size={14} />
                      <span>{appliedPromo.label}</span>
                    </span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-neutral-500">Estimated Sales Tax (8%)</span>
                  <span className="font-medium text-neutral-900">${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">Global Insured Freight</span>
                  <span className="font-semibold text-emerald-700">
                    {shipping === 0 ? 'Complimentary' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-neutral-100 pt-4 flex justify-between items-baseline">
                  <div>
                    <span className="font-heading text-lg font-bold block text-neutral-950">Total Amount</span>
                    <span className="text-[11px] text-neutral-400">All import duties and freight included</span>
                  </div>
                  <span className="font-heading text-2xl font-extrabold text-neutral-950">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="pt-2">
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <span className="font-semibold">Code: {appliedPromo.code} applied</span>
                    <button onClick={handleRemovePromo} className="hover:text-red-500"><X size={14} /></button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (try ZION10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-black uppercase font-medium"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-neutral-950 text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoError && (
                  <p className="text-[11px] text-red-500 mt-1.5">{promoError}</p>
                )}
              </div>

              {/* Checkout CTA: members go straight to checkout, guests are asked to sign in first */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                disabled={!isLoaded}
                className="w-full bg-neutral-950 text-white py-4 rounded-2xl text-xs font-semibold tracking-wider uppercase hover:bg-black transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2 group disabled:opacity-60"
              >
                <Lock size={15} />
                <span>{isSignedIn ? 'Proceed to Checkout' : 'Sign in to Checkout'}</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {isLoaded && !isSignedIn && (
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2.5">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Your bag is saved. Sign in to enter delivery details, pay securely and track your order.
                  </p>
                  <button
                    onClick={handleCreateAccount}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-950 hover:underline"
                  >
                    <UserPlus size={13} /> New here? Create an account
                  </button>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-neutral-400 pt-2 border-t border-neutral-50">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck size={16} className="text-neutral-600" />
                  <span>256-Bit SSL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CreditCard size={16} className="text-neutral-600" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw size={16} className="text-neutral-600" />
                  <span>30-Day Return</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

export default Cart
