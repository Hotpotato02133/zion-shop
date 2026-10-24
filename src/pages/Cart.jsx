import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
  Check, 
  X, 
  CreditCard, 
  Smartphone, 
  Lock, 
  Sparkles,
  Receipt,
  Gift
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useApp()

  // Checkout modal & state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState('form') // 'form', 'processing', 'success'
  const [paymentMethod, setPaymentMethod] = useState('card') // 'card', 'gcash', 'maya'
  const [completedOrder, setCompletedOrder] = useState(null)
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')

  // Gift option
  const [isGiftWrapped, setIsGiftWrapped] = useState(false)
  const [giftNote, setGiftNote] = useState('')

  // Checkout form data
  const [customerInfo, setCustomerInfo] = useState({
    fullName: 'Alexander Vance',
    email: 'a.vance@atelier-private.com',
    address: '450 Via Montenapoleone',
    city: 'Milan',
    postalCode: '20121',
    country: 'Italy',
    cardNumber: '4242 •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '888',
    gcashNumber: '0917 888 2390'
  })

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

  // Helper calculations
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = typeof item.price === 'number' 
        ? item.price 
        : parseFloat(String(item.price).replace(/[^0-9.-]+/g, '')) || 0
      return total + (price * item.quantity)
    }, 0)
  }

  const subtotal = calculateSubtotal()
  
  // Discount calculation
  let discountAmount = 0
  if (appliedPromo) {
    if (appliedPromo.type === 'percent') {
      discountAmount = subtotal * appliedPromo.value
    } else if (appliedPromo.type === 'fixed') {
      discountAmount = Math.min(subtotal, appliedPromo.value)
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount)
  const tax = discountedSubtotal * 0.08 // 8% luxury sales tax
  const shipping = subtotal > 150 ? 0 : 25
  const total = discountedSubtotal + tax + shipping

  // Promo Code Handler
  const handleApplyPromo = (e) => {
    e.preventDefault()
    setPromoError('')
    const code = promoCode.trim().toUpperCase()

    if (code === 'ZION10') {
      setAppliedPromo({ code: 'ZION10', type: 'percent', value: 0.1, label: '10% Private Atelier Privilege' })
      setPromoCode('')
    } else if (code === 'ATELIER') {
      setAppliedPromo({ code: 'ATELIER', type: 'fixed', value: 50, label: '$50 Off Welcome Benefit' })
      setPromoCode('')
    } else {
      setPromoError('Invalid privilege code. Try "ZION10" or "ATELIER"')
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoError('')
  }

  // Simulated Checkout Execution (PayMongo Sandbox)
  const handleExecuteCheckout = (e) => {
    e.preventDefault()
    setCheckoutStep('processing')

    // Simulate PayMongo test payment round-trip
    setTimeout(() => {
      const orderRef = `ZION-${Math.floor(100000 + Math.random() * 900000)}`
      const paymongoRef = `pay_sbox_${Math.random().toString(36).substring(2, 14)}`

      setCompletedOrder({
        orderId: orderRef,
        paymentReference: paymongoRef,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        items: [...cart],
        total: total.toFixed(2),
        paymentMethod: paymentMethod === 'card' ? 'Visa (Test Sandbox)' : paymentMethod === 'gcash' ? 'GCash Sandbox' : 'Maya Sandbox',
        shippingAddress: `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.postalCode}`,
        recipient: customerInfo.fullName
      })

      setCheckoutStep('success')
      clearCart()
    }, 2000)
  }

  // Empty State
  if (cart.length === 0 && checkoutStep !== 'success') {
    return (
      <div className="min-h-[80vh] w-full flex items-center justify-center py-16 bg-white text-black font-body overflow-x-hidden">
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="space-y-6"
          >
            <motion.div variants={fadeInUp} className="w-24 h-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <ShoppingBag size={38} strokeWidth={1.5} />
            </motion.div>
            
            <motion.div variants={fadeInUp} className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Bag Overview</span>
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">
                Your Bag is Empty
              </h1>
              <p className="text-gray-600 text-sm sm:text-base font-light leading-relaxed max-w-sm mx-auto">
                Discover our curated catalog of precision chronographs, acoustic audio, and artisanal leatherware.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="pt-4">
              <Link to="/products">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-black text-white px-8 py-4 rounded-full text-xs font-semibold tracking-wider uppercase shadow-xl hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
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
    <div className="min-h-screen w-full py-10 bg-white text-black font-body overflow-x-hidden">
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="mb-10 border-b border-gray-100 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <motion.span variants={fadeInUp} className="text-xs uppercase tracking-widest font-semibold text-gray-500 block mb-2">
              Private Order
            </motion.span>
            <motion.h1 
              variants={fadeInUp}
              className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight"
            >
              Shopping Bag
            </motion.h1>
          </div>

          <motion.div variants={fadeInUp} className="text-sm text-gray-500">
            {cart.reduce((t, i) => t + i.quantity, 0)} {cart.reduce((t, i) => t + i.quantity, 0) === 1 ? 'Piece' : 'Pieces'} Selected
          </motion.div>
        </motion.div>

        {/* Main 2-Column Cart Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Line Items & Packaging (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <AnimatePresence>
              {cart.map((item) => {
                const itemPrice = typeof item.price === 'number' 
                  ? item.price 
                  : parseFloat(String(item.price).replace(/[^0-9.-]+/g, '')) || 0
                const itemLineTotal = (itemPrice * item.quantity).toFixed(2)

                return (
                  <motion.div
                    key={item.productId || item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 rounded-3xl border border-gray-100 bg-white hover:border-gray-200 shadow-sm transition-all"
                  >
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      
                      {/* Product Thumbnail */}
                      <Link to={`/products?search=${encodeURIComponent(item.name)}`} className="shrink-0 w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center"
                        />
                      </Link>

                      {/* Details & Quantities */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            {item.category && (
                              <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 block mb-1">
                                {item.category}
                              </span>
                            )}
                            <h3 className="font-heading text-lg font-bold text-black line-clamp-1">
                              {item.name}
                            </h3>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(item.productId || item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                            title="Remove piece"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">${itemPrice.toFixed(2)}</span>
                          <span className="text-xs text-gray-400 font-light">each</span>
                        </div>

                        {/* Quantity Controls & Line Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                          <div className="flex items-center border border-gray-200 rounded-xl px-1.5 py-0.5">
                            <button
                              onClick={() => updateCartQuantity(item.productId || item.id, item.quantity - 1)}
                              className="p-1.5 text-gray-500 hover:text-black transition-colors"
                              title="Decrease"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.productId || item.id, item.quantity + 1)}
                              className="p-1.5 text-gray-500 hover:text-black transition-colors"
                              title="Increase"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div className="font-heading text-lg font-bold">
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
            <div className="p-6 rounded-3xl border border-gray-100 bg-gray-50/60 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-black">
                    <Gift size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Complimentary Atelier Gift Packaging</p>
                    <p className="text-xs text-gray-500 font-light">Matte black ribbon box with personalized wax seal certificate.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isGiftWrapped}
                  onChange={(e) => setIsGiftWrapped(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
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
                    className="w-full p-3.5 rounded-2xl bg-white border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </motion.div>
              )}
            </div>

            {/* Delivery Guarantee Pill */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
              <Truck size={18} className="text-black shrink-0" />
              <span>Complimentary insured air courier. Orders dispatch within 24 hours from Milan.</span>
            </div>

          </div>

          {/* Right Column: Order Summary & Checkout Trigger (5 cols) */}
          <div className="lg:col-span-5">
            <div className="p-8 rounded-3xl border border-gray-100 bg-white shadow-xl space-y-6 sticky top-28">
              
              <h2 className="font-heading text-xl font-bold tracking-tight">Order Summary</h2>

              {/* Price Rows */}
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Atelier Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-green-700 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Tag size={14} />
                      <span>{appliedPromo.label}</span>
                    </span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Sales Tax (8%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Global Insured Freight</span>
                  <span className="font-semibold text-green-700">
                    {shipping === 0 ? 'Complimentary' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
                  <div>
                    <span className="font-heading text-lg font-bold block">Total Amount</span>
                    <span className="text-[11px] text-gray-400">All import duties and freight included</span>
                  </div>
                  <span className="font-heading text-2xl font-extrabold">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="pt-2">
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-800">
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
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-black uppercase font-medium"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoError && (
                  <p className="text-[11px] text-red-500 mt-1.5">{promoError}</p>
                )}
              </div>

              {/* Proceed to Checkout CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCheckoutStep('form')
                  setIsCheckoutOpen(true)
                }}
                className="w-full bg-black text-white py-4 rounded-2xl text-xs font-semibold tracking-wider uppercase hover:bg-gray-900 transition-colors shadow-2xl flex items-center justify-center gap-2 group"
              >
                <Lock size={15} />
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-gray-400 pt-2 border-t border-gray-50">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck size={16} className="text-gray-600" />
                  <span>256-Bit SSL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CreditCard size={16} className="text-gray-600" />
                  <span>PayMongo Sandbox</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw size={16} className="text-gray-600" />
                  <span>30-Day Return</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* PAYMONGO SANDBOX CHECKOUT MODAL */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (checkoutStep !== 'processing') setIsCheckoutOpen(false); }}
              className="fixed inset-0 bg-black/65 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl z-10 border border-gray-100 p-6 sm:p-8"
            >
              {checkoutStep !== 'processing' && (
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-black hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              {/* STEP 1: CHECKOUT FORM */}
              {checkoutStep === 'form' && (
                <div className="space-y-6">
                  
                  {/* Sandbox Banner */}
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <Sparkles size={18} className="shrink-0 text-amber-600" />
                    <div>
                      <strong className="font-semibold">PayMongo Sandbox Environment Active</strong>
                      <p className="text-[11px] text-amber-700">Simulated test checkout. No real money will be charged.</p>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="font-heading text-2xl font-bold tracking-tight">Express Checkout</h2>
                    <p className="text-xs text-gray-500 mt-1">Order total: <strong className="text-black font-semibold">${total.toFixed(2)}</strong> ({cart.length} line items)</p>
                  </div>

                  <form onSubmit={handleExecuteCheckout} className="space-y-5">
                    
                    {/* Shipping Address Details */}
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-wider font-semibold text-gray-900">1. Dispatch Address</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={customerInfo.fullName}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-black"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Email Address"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-black"
                        />
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Street Address"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-black"
                      />

                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="City"
                          value={customerInfo.city}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-black"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Postal Code"
                          value={customerInfo.postalCode}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, postalCode: e.target.value })}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-black"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Country"
                          value={customerInfo.country}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, country: e.target.value })}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <p className="text-xs uppercase tracking-wider font-semibold text-gray-900">2. Payment Method (PayMongo)</p>

                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            paymentMethod === 'card' 
                              ? 'border-black bg-black text-white shadow-sm' 
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <CreditCard size={18} className="mx-auto mb-1" />
                          <span className="text-[11px] font-bold block">Credit Card</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('gcash')}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            paymentMethod === 'gcash' 
                              ? 'border-blue-600 bg-blue-600 text-white shadow-sm' 
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Smartphone size={18} className="mx-auto mb-1" />
                          <span className="text-[11px] font-bold block">GCash Pay</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('maya')}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            paymentMethod === 'maya' 
                              ? 'border-green-600 bg-green-600 text-white shadow-sm' 
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Smartphone size={18} className="mx-auto mb-1" />
                          <span className="text-[11px] font-bold block">Maya Wallet</span>
                        </button>
                      </div>

                      {/* Card Details View */}
                      {paymentMethod === 'card' && (
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                          <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <span>Test Card Number</span>
                            <span className="text-green-700 font-semibold">Ready for authorization</span>
                          </div>
                          
                          <input
                            type="text"
                            required
                            placeholder="Card Number"
                            value={customerInfo.cardNumber}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, cardNumber: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-mono"
                          />

                          <div className="grid grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              required
                              placeholder="MM/YY"
                              value={customerInfo.cardExp}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, cardExp: e.target.value })}
                              className="p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-mono"
                            />
                            <input
                              type="text"
                              required
                              placeholder="CVC"
                              value={customerInfo.cardCvc}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, cardCvc: e.target.value })}
                              className="p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Mobile Wallet View */}
                      {(paymentMethod === 'gcash' || paymentMethod === 'maya') && (
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                          <p className="text-xs text-gray-600">
                            Simulated test wallet number:
                          </p>
                          <input
                            type="text"
                            required
                            value={customerInfo.gcashNumber}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, gcashNumber: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-mono"
                          />
                        </div>
                      )}

                    </div>

                    {/* Authorize & Pay CTA */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      className="w-full bg-black text-white py-4 rounded-2xl text-xs font-semibold tracking-wider uppercase hover:bg-gray-800 transition-colors shadow-2xl flex items-center justify-center gap-2 mt-4"
                    >
                      <Lock size={14} />
                      <span>Authorize Payment (${total.toFixed(2)})</span>
                    </motion.button>

                  </form>

                </div>
              )}

              {/* STEP 2: PROCESSING ANIMATION */}
              {checkoutStep === 'processing' && (
                <div className="py-16 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-black animate-spin mx-auto" />
                  <div className="space-y-2">
                    <h3 className="font-heading text-2xl font-bold">Connecting to PayMongo...</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Simulating encrypted TLS handshake and sandbox payment authorization.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: ORDER SUCCESS SCREEN */}
              {checkoutStep === 'success' && completedOrder && (
                <div className="py-6 space-y-6">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-md">
                      <Check size={32} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-3 py-1 rounded-full">
                      Payment Approved • Sandbox Test Mode
                    </span>
                    <h2 className="font-heading text-3xl font-extrabold tracking-tight">Order Confirmed</h2>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Thank you for your patronage. Your atelier order has been logged into the fulfillment queue.
                    </p>
                  </div>

                  {/* Receipt Breakdown Card */}
                  <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-3">
                    <div className="flex justify-between border-b border-gray-200 pb-2.5">
                      <span className="text-gray-500">Order Reference</span>
                      <span className="font-mono font-bold text-black">{completedOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2.5">
                      <span className="text-gray-500">Payment Reference</span>
                      <span className="font-mono text-gray-700">{completedOrder.paymentReference}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2.5">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="font-medium">{completedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2.5">
                      <span className="text-gray-500">Dispatch Recipient</span>
                      <span className="font-medium">{completedOrder.recipient}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2.5">
                      <span className="text-gray-500">Destination</span>
                      <span className="font-medium text-right max-w-xs truncate">{completedOrder.shippingAddress}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-sm font-bold text-black">
                      <span>Total Paid</span>
                      <span>${completedOrder.total}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => {
                        window.print()
                      }}
                      className="flex-1 py-3.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Receipt size={14} />
                      <span>Print Receipt</span>
                    </button>

                    <Link to="/products" className="flex-1" onClick={() => setIsCheckoutOpen(false)}>
                      <button className="w-full py-3.5 px-4 rounded-xl bg-black text-white hover:bg-gray-800 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl">
                        <span>Continue Shopping</span>
                        <ArrowRight size={14} />
                      </button>
                    </Link>
                  </div>

                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default Cart
