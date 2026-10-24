import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Sparkles, 
  Check, 
  Eye, 
  X, 
  ChevronRight, 
  RotateCcw,
  ShieldCheck,
  Star
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const Wishlist = () => {
  const { wishlist, removeFromWishlist, moveToCart, addToCart, clearWishlist } = useApp()
  const [toastMessage, setToastMessage] = useState(null)
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3200)
  }

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `$${price.toFixed(2)}`
    }
    if (typeof price === 'string') {
      const clean = price.replace(/[^0-9.-]+/g, '')
      const num = parseFloat(clean)
      return !isNaN(num) ? `$${num.toFixed(2)}` : price
    }
    return '$0.00'
  }

  const parseNumericPrice = (price) => {
    if (typeof price === 'number') return price
    if (typeof price === 'string') {
      const parsed = parseFloat(price.replace(/[^0-9.-]+/g, ''))
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const totalValue = wishlist.reduce((acc, item) => acc + parseNumericPrice(item.price), 0)

  const handleRemove = (productId, name) => {
    removeFromWishlist(productId)
    showToast(`Removed "${name}" from your wishlist`)
  }

  const handleMoveToCart = (item) => {
    moveToCart(item)
    showToast(`Moved "${item.name}" to your shopping bag`)
  }

  const handleAddToCart = (item) => {
    addToCart(item)
    showToast(`Added "${item.name}" to your shopping bag`)
  }

  const handleMoveAllToCart = () => {
    if (wishlist.length === 0) return
    const count = wishlist.length
    wishlist.forEach((item) => {
      addToCart(item)
    })
    clearWishlist()
    showToast(`Successfully moved ${count} piece${count > 1 ? 's' : ''} to your shopping bag`)
  }

  const handleClearWishlist = () => {
    if (wishlist.length === 0) return
    clearWishlist()
    showToast('Your wishlist has been cleared')
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.92, 
      y: -15, 
      transition: { duration: 0.3 } 
    }
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen w-full bg-white py-16 lg:py-24 overflow-x-hidden">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            {/* Minimalist Icon Badge */}
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <Heart size={36} strokeWidth={1.5} />
              </div>
              <span className="absolute bottom-0 right-0 p-2 rounded-full bg-black text-white shadow-md">
                <Sparkles size={14} />
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold tracking-wider uppercase mb-4">
              Private Atelier
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
              Your Wishlist is Empty
            </h1>
            
            <p className="text-neutral-500 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-10">
              Curate your personal selection of handcrafted outerwear, architectural tailoring, and limited edition accessories.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-full text-sm font-semibold tracking-wide hover:bg-neutral-800 transition-all duration-300 shadow-sm hover:shadow group"
              >
                <span>Explore Catalog</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full text-sm font-semibold text-neutral-700 border border-neutral-200 hover:border-black hover:text-black transition-colors"
              >
                Return to Atelier Home
              </Link>
            </div>

            {/* Quick Category Jump */}
            <div className="border-t border-neutral-100 pt-10">
              <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400 mb-6">
                Featured Categories
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                  { name: 'Outerwear', query: 'Outerwear' },
                  { name: 'Tailoring', query: 'Tailoring' },
                  { name: 'Footwear', query: 'Footwear' },
                  { name: 'Accessories', query: 'Accessories' },
                  { name: 'Leather Goods', query: 'Accessories' }
                ].map((cat) => (
                  <Link
                    key={cat.name}
                    to={`/products?category=${encodeURIComponent(cat.query)}`}
                    className="px-4 py-2 bg-neutral-50 hover:bg-neutral-900 hover:text-white rounded-full text-xs font-medium text-neutral-600 transition-all duration-200 border border-neutral-200"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white py-12 lg:py-16 overflow-x-hidden">
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider mb-6">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-black transition-colors">Products</Link>
          <ChevronRight size={12} />
          <span className="text-black font-semibold">Wishlist</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-neutral-100 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
              <Sparkles size={12} />
              Private Atelier Reserve
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900">
              Saved Pieces
            </h1>
            <p className="text-neutral-500 text-sm sm:text-base mt-2">
              You have <span className="font-semibold text-neutral-900">{wishlist.length}</span> {wishlist.length === 1 ? 'item' : 'items'} saved in your private sanctuary. Estimated total: <span className="font-semibold text-neutral-900">{formatPrice(totalValue)}</span>.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleMoveAllToCart}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wide hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <ShoppingBag size={15} />
              <span>Move All to Bag</span>
            </button>
            <button
              onClick={handleClearWishlist}
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-red-600 px-4 py-3 rounded-full text-xs sm:text-sm font-semibold transition-colors border border-neutral-200 hover:border-red-200"
            >
              <Trash2 size={15} />
              <span>Clear List</span>
            </button>
          </div>
        </div>

        {/* Wishlist Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {wishlist.map((item) => {
              const currentId = item.productId || item.id
              return (
                <motion.article
                  key={currentId}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="group relative bg-white border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {item.tag && (
                        <span className="px-2.5 py-1 bg-black text-white text-[10px] font-bold tracking-widest uppercase rounded-full shadow-sm">
                          {item.tag}
                        </span>
                      )}
                      {item.originalPrice && (
                        <span className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase rounded-full shadow-sm">
                          Special Atelier
                        </span>
                      )}
                    </div>

                    {/* Remove Action Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemove(currentId, item.name)}
                        className="p-2.5 bg-white/90 backdrop-blur-md hover:bg-white text-neutral-600 hover:text-red-600 rounded-full shadow-sm hover:shadow transition-all duration-200"
                        title="Remove from wishlist"
                        aria-label={`Remove ${item.name} from wishlist`}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>

                    {/* Quick View Button overlay on hover */}
                    <div className="absolute inset-x-4 bottom-4 z-10 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={() => setQuickViewProduct(item)}
                        className="w-full py-2.5 bg-white/95 backdrop-blur-sm text-neutral-900 text-xs font-semibold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <Eye size={14} />
                        <span>Inspect Specifications</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-neutral-400 tracking-wider uppercase text-[11px]">
                          {item.category || 'Atelier Collection'}
                        </span>
                        {item.rating && (
                          <div className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span className="text-neutral-700 text-xs">{item.rating}</span>
                            {item.reviews && (
                              <span className="text-neutral-400 text-[10px]">({item.reviews})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-heading text-base font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-2 mb-2">
                        {item.name}
                      </h3>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-lg font-bold text-neutral-900">
                          {formatPrice(item.price)}
                        </span>
                        {item.originalPrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleMoveToCart(item)}
                        className="flex-1 bg-black text-white py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 group/btn"
                      >
                        <span>Move to Bag</span>
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToCart(item)}
                        className="p-2.5 border border-neutral-200 hover:border-black rounded-xl text-neutral-700 hover:text-black transition-colors"
                        title="Add copy to bag without removing"
                        aria-label={`Add ${item.name} to bag`}
                      >
                        <ShoppingBag size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Bottom Banner & Value Guarantees */}
        <div className="mt-16 bg-neutral-50 rounded-2xl p-8 border border-neutral-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-neutral-100 text-black shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Price & Allocation Lock</h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Saved atelier items retain current priority allocations for 14 calendar days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-neutral-100 text-black shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Complimentary Courier</h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Every order includes insured express global delivery with signature verification.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-neutral-100 text-black shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">30-Day White-Glove Returns</h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Complimentary concierge courier pickup for returns and bespoke alterations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col md:flex-row"
            >
              {/* Close Button */}
              <button
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 hover:bg-white text-neutral-500 hover:text-black transition-colors shadow-sm"
              >
                <X size={18} />
              </button>

              {/* Modal Image */}
              <div className="md:w-1/2 aspect-square md:aspect-auto bg-neutral-100 relative">
                <img
                  src={quickViewProduct.image}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
                {quickViewProduct.tag && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-black text-white text-[10px] font-bold tracking-widest uppercase rounded-full">
                    {quickViewProduct.tag}
                  </span>
                )}
              </div>

              {/* Modal Content */}
              <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
                <div>
                  <span className="text-xs font-semibold text-neutral-400 tracking-widest uppercase">
                    {quickViewProduct.category || 'Atelier'}
                  </span>
                  <h3 className="font-heading text-2xl font-bold text-neutral-900 mt-1 mb-2">
                    {quickViewProduct.name}
                  </h3>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold text-neutral-900">
                      {formatPrice(quickViewProduct.price)}
                    </span>
                    {quickViewProduct.originalPrice && (
                      <span className="text-sm text-neutral-400 line-through">
                        {formatPrice(quickViewProduct.originalPrice)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-6">
                    {quickViewProduct.description || 'Masterfully engineered using sustainably sourced textiles and Italian hardware. Designed for effortless contemporary elegance.'}
                  </p>

                  <div className="space-y-2 border-t border-b border-neutral-100 py-4 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Origin</span>
                      <span className="font-medium text-neutral-900">Biella & Florence, Italy</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Hardware</span>
                      <span className="font-medium text-neutral-900">PVD Matte Titanium</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-500">Availability</span>
                      <span className="font-medium text-emerald-600 flex items-center gap-1">
                        <Check size={12} /> In Stock (Limited Run)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      handleMoveToCart(quickViewProduct)
                      setQuickViewProduct(null)
                    }}
                    className="flex-1 bg-black text-white py-3.5 px-4 rounded-xl text-xs font-semibold tracking-wide hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={16} />
                    <span>Move to Bag</span>
                  </button>
                  <button
                    onClick={() => {
                      handleRemove(quickViewProduct.productId || quickViewProduct.id, quickViewProduct.name)
                      setQuickViewProduct(null)
                    }}
                    className="p-3.5 border border-neutral-200 hover:border-red-500 hover:text-red-500 rounded-xl text-neutral-600 transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.aside
            aria-live="polite"
            role="status"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-medium border border-neutral-800"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Check size={14} className="text-white" />
            </div>
            <span>{toastMessage}</span>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Wishlist
