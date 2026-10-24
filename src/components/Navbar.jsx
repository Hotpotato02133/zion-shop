import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, 
  Heart, 
  Menu, 
  X, 
  Search, 
  User, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  Check, 
  Trash2,
  Clock,
  ShieldCheck
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const ANNOUNCEMENTS = [
  'COMPLIMENTARY WORLDWIDE INSURED COURIER ON ALL ORDERS OVER $300',
  'AUTUMN / WINTER 2026 RUNWAY CAPSULE NOW AVAILABLE IN LIMITED QUANTITIES',
  'ATELIER CONCIERGE: BESPOKE TAILORING & SIZING CONSULTATIONS OPEN'
]

const FEATURED_COLLECTIONS = [
  {
    title: 'Architectural Outerwear',
    subtitle: 'Double-faced cashmere & Italian wool',
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Monolith Footwear',
    subtitle: 'Hand-welted Tuscan calfskin leather',
    category: 'Footwear',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop'
  },
  {
    title: 'Bespoke Tailoring',
    subtitle: 'Unstructured blazers & wide-leg trousers',
    category: 'Tailoring',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop'
  }
]

const POPULAR_SEARCHES = [
  'Cashmere Overcoat',
  'Leather Boots',
  'Double-Breasted Blazer',
  'Silk Trousers',
  'Minimalist Tote',
  'Wool Scarf'
]

const Navbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { cart, cartCount, wishlistCount, removeFromCart } = useApp()

  // Navbar states
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeAnnouncement, setActiveAnnouncement] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCollectionsHovered, setIsCollectionsHovered] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isMiniBagOpen, setIsMiniBagOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('USD ($)')
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)

  const searchInputRef = useRef(null)
  const accountRef = useRef(null)
  const miniBagRef = useRef(null)
  const collectionsRef = useRef(null)

  // Track scroll position for header glass elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Rotate announcement bar every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % ANNOUNCEMENTS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
    setIsCollectionsHovered(false)
    setIsAccountOpen(false)
    setIsMiniBagOpen(false)
  }, [location.pathname])

  // Focus search input when search overlay opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isSearchOpen])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setIsAccountOpen(false)
      }
      if (miniBagRef.current && !miniBagRef.current.contains(e.target)) {
        setIsMiniBagOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const handleQuickSearch = (term) => {
    navigate(`/products?search=${encodeURIComponent(term)}`)
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  // Calculate cart subtotal safely
  const cartSubtotal = cart.reduce((acc, item) => {
    let p = item.price
    if (typeof p === 'string') {
      const num = parseFloat(p.replace(/[^0-9.-]+/g, ''))
      p = isNaN(num) ? 0 : num
    }
    return acc + (p * (item.quantity || 1))
  }, 0)

  const formatCurrency = (val) => `$${val.toFixed(2)}`

  const navLinks = [
    { label: 'All Pieces', path: '/products' },
    { label: 'New In', path: '/products?category=Outerwear', badge: 'AW26' },
    { label: 'Outerwear', path: '/products?category=Outerwear' },
    { label: 'Tailoring', path: '/products?category=Tailoring' },
    { label: 'Footwear', path: '/products?category=Footwear' },
    { label: 'Accessories', path: '/products?category=Accessories' }
  ]

  const isLinkActive = (path) => {
    if (path === '/products' && location.pathname === '/products' && !location.search) return true
    if (location.pathname + location.search === path) return true
    return false
  }

  return (
    <div className="w-full relative z-50">
      {/* 1. Top Announcement & Utility Bar */}
      <div className="w-full bg-black text-white text-[11px] font-medium tracking-widest uppercase border-b border-neutral-800">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 h-8 sm:h-9 flex items-center justify-between">
          {/* Left: Region & Currency Selector */}
          <div className="relative hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <Globe size={12} />
              <span>{selectedCurrency}</span>
              <ChevronDown size={10} className={`transform transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCurrencyOpen && (
              <div className="absolute top-full left-0 mt-1 w-32 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl py-1 z-50 text-neutral-300">
                {['USD ($)', 'EUR (€)', 'GBP (£)', 'JPY (¥)'].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => {
                      setSelectedCurrency(curr)
                      setIsCurrencyOpen(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-[10px] hover:bg-neutral-800 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{curr}</span>
                    {selectedCurrency === curr && <Check size={10} className="text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center: Rotating Announcement Ticker */}
          <div className="flex-1 flex justify-center items-center overflow-hidden h-full px-2 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAnnouncement}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-2 text-neutral-200 truncate"
              >
                <Sparkles size={11} className="text-amber-400 shrink-0 hidden sm:inline" />
                <span className="truncate">{ANNOUNCEMENTS[activeAnnouncement]}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Atelier Service & Contact Shortcuts */}
          <div className="hidden md:flex items-center gap-4 text-neutral-400 text-[10px] tracking-wider">
            <Link to="/products" className="hover:text-white transition-colors">
              Lookbook
            </Link>
            <span className="text-neutral-700">|</span>
            <Link to="/wishlist" className="hover:text-white transition-colors flex items-center gap-1">
              <span>Private Reserve</span>
              {wishlistCount > 0 && <span className="text-white font-bold">({wishlistCount})</span>}
            </Link>
            <span className="text-neutral-700">|</span>
            <Link to="/login" className="hover:text-white transition-colors">
              Client Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <motion.header
        className={`sticky top-0 w-full transition-all duration-300 bg-white/95 backdrop-blur-md border-b ${
          isScrolled ? 'border-neutral-200 shadow-sm py-2 sm:py-2.5' : 'border-neutral-100 py-3 sm:py-4'
        }`}
      >
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between h-12 sm:h-14">
            
            {/* Left: Brand Logotype & Mobile Hamburger */}
            <div className="flex items-center gap-3 lg:gap-0 lg:min-w-[200px]">
              {/* Mobile Hamburger Button */}
              <div className="flex items-center lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 -ml-2 text-neutral-800 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>

              {/* Brand Logotype */}
              <Link to="/" className="inline-block group text-left">
                <span className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 block transition-transform group-hover:scale-[1.02]">
                  ZION
                </span>
                <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-neutral-400 block -mt-1">
                  Atelier Privé
                </span>
              </Link>
            </div>

            {/* Middle: Desktop Navigation Menu */}
            <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 text-xs font-semibold tracking-wider uppercase flex-1 px-4">
              {/* Collections with Mega-Menu */}
              <div
                ref={collectionsRef}
                onMouseEnter={() => setIsCollectionsHovered(true)}
                onMouseLeave={() => setIsCollectionsHovered(false)}
                className="relative py-2"
              >
                <button
                  onClick={() => setIsCollectionsHovered(!isCollectionsHovered)}
                  className={`flex items-center gap-1 transition-colors ${
                    isCollectionsHovered ? 'text-black' : 'text-neutral-600 hover:text-black'
                  }`}
                >
                  <span>Collections</span>
                  <ChevronDown
                    size={13}
                    className={`transform transition-transform duration-200 ${
                      isCollectionsHovered ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Mega Menu Dropdown */}
                <AnimatePresence>
                  {isCollectionsHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 w-[680px] max-w-[calc(100vw-2rem)] bg-white border border-neutral-200 rounded-2xl shadow-2xl p-6 z-50 mt-1"
                    >
                      <div className="grid grid-cols-3 gap-6">
                        {FEATURED_COLLECTIONS.map((col) => (
                          <Link
                            key={col.title}
                            to={`/products?category=${encodeURIComponent(col.category)}`}
                            onClick={() => setIsCollectionsHovered(false)}
                            className="group block"
                          >
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 mb-3 relative">
                              <img
                                src={col.image}
                                alt={col.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                            </div>
                            <h4 className="text-xs font-bold text-neutral-900 group-hover:text-black uppercase tracking-wider">
                              {col.title}
                            </h4>
                            <p className="text-[11px] text-neutral-500 normal-case font-normal mt-0.5 line-clamp-1">
                              {col.subtitle}
                            </p>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] font-medium tracking-normal normal-case">
                        <span className="text-neutral-400">
                          Handcrafted in limited seasonal editions. Complimentary express delivery.
                        </span>
                        <Link
                          to="/products"
                          onClick={() => setIsCollectionsHovered(false)}
                          className="text-black font-semibold uppercase tracking-wider text-[10px] hover:underline flex items-center gap-1"
                        >
                          <span>Explore All 12 Pieces</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Standard Nav Links */}
              {navLinks.map((link) => {
                const active = isLinkActive(link.path)
                return (
                  <Link
                    key={link.label}
                    to={link.path}
                    className={`relative py-2 transition-colors flex items-center gap-1.5 ${
                      active ? 'text-black font-bold' : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.5 bg-black text-white text-[9px] font-bold rounded-full tracking-widest">
                        {link.badge}
                      </span>
                    )}
                    {active && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right: Functional E-Commerce Utility Icons */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 lg:gap-3 lg:min-w-[200px]">
              {/* Search Trigger Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 sm:p-2.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition-colors flex items-center gap-2 group"
                aria-label="Open product search"
              >
                <Search size={18} strokeWidth={2} />
                <span className="hidden xl:inline text-xs font-medium text-neutral-400 group-hover:text-neutral-700">
                  Search...
                </span>
              </button>

              {/* Account Dropdown Trigger */}
              <div ref={accountRef} className="relative">
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="p-2 sm:p-2.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
                  aria-label="Account menu"
                >
                  <User size={18} strokeWidth={2} />
                </button>

                <AnimatePresence>
                  {isAccountOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white border border-neutral-200 rounded-2xl shadow-xl py-3 z-50 text-neutral-800"
                    >
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                          Atelier Member Portal
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Private salon access & acquisitions
                        </p>
                      </div>

                      <div className="py-2">
                        <Link
                          to="/login"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-xs font-semibold hover:bg-neutral-50 transition-colors"
                        >
                          <span>Sign In to Account</span>
                          <ArrowRight size={13} className="text-neutral-400" />
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-xs hover:bg-neutral-50 transition-colors"
                        >
                          <span>Request Circle Membership</span>
                          <Sparkles size={13} className="text-amber-500" />
                        </Link>
                      </div>

                      <div className="border-t border-neutral-100 py-2">
                        <Link
                          to="/wishlist"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                          <span>Saved Pieces ({wishlistCount})</span>
                          <Heart size={13} className="text-neutral-400" />
                        </Link>
                        <Link
                          to="/cart"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                        >
                          <span>Active Bag ({cartCount})</span>
                          <ShoppingBag size={13} className="text-neutral-400" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wishlist Link with Live Counter Badge */}
              <Link
                to="/wishlist"
                className="relative p-2 sm:p-2.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
                aria-label={`Wishlist with ${wishlistCount} items`}
              >
                <Heart size={18} strokeWidth={2} />
                {wishlistCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0.5 right-0.5 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </Link>

              {/* Shopping Bag with Interactive Mini-Bag Dropdown */}
              <div
                ref={miniBagRef}
                onMouseEnter={() => setIsMiniBagOpen(true)}
                onMouseLeave={() => setIsMiniBagOpen(false)}
                className="relative"
              >
                <Link
                  to="/cart"
                  className="relative p-2 sm:p-2.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-full transition-colors flex items-center"
                  aria-label={`Cart with ${cartCount} items`}
                >
                  <ShoppingBag size={18} strokeWidth={2} />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0.5 right-0.5 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </Link>

                {/* Mini-Bag Dropdown Flyout */}
                <AnimatePresence>
                  {isMiniBagOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-80 sm:w-96 bg-white border border-neutral-200 rounded-2xl shadow-2xl p-5 z-50 text-neutral-900"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Shopping Bag ({cartCount})
                        </span>
                        <Link
                          to="/cart"
                          onClick={() => setIsMiniBagOpen(false)}
                          className="text-[11px] text-neutral-500 hover:text-black font-semibold underline"
                        >
                          View Full Bag
                        </Link>
                      </div>

                      {cart.length === 0 ? (
                        <div className="py-8 text-center">
                          <ShoppingBag size={32} className="mx-auto text-neutral-300 mb-2" strokeWidth={1.5} />
                          <p className="text-xs text-neutral-500 font-medium">Your shopping bag is empty.</p>
                          <Link
                            to="/products"
                            onClick={() => setIsMiniBagOpen(false)}
                            className="mt-3 inline-block text-xs font-bold text-black uppercase tracking-wider hover:underline"
                          >
                            Explore Atelier Collection
                          </Link>
                        </div>
                      ) : (
                        <div>
                          <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 py-2">
                            {cart.slice(0, 3).map((item) => {
                              const itemId = item.productId || item.id
                              return (
                                <div key={itemId} className="py-2.5 flex items-center gap-3">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-12 h-14 object-cover rounded-lg bg-neutral-100 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-xs font-semibold truncate text-neutral-900">
                                      {item.name}
                                    </h5>
                                    <p className="text-[11px] text-neutral-500">
                                      Qty: {item.quantity} × {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : item.price}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeFromCart(itemId)}
                                    className="p-1.5 text-neutral-400 hover:text-red-500 rounded-full hover:bg-neutral-50"
                                    title="Remove item"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>

                          {cart.length > 3 && (
                            <p className="text-center text-[10px] text-neutral-400 py-1">
                              + {cart.length - 3} more items in bag
                            </p>
                          )}

                          <div className="pt-3 border-t border-neutral-100 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-neutral-500">Estimated Subtotal</span>
                              <span className="font-bold text-neutral-900 text-sm">
                                {formatCurrency(cartSubtotal)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Link
                                to="/cart"
                                onClick={() => setIsMiniBagOpen(false)}
                                className="w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold rounded-xl text-center transition-colors"
                              >
                                Review Bag
                              </Link>
                              <Link
                                to="/cart"
                                onClick={() => setIsMiniBagOpen(false)}
                                className="w-full py-2.5 px-3 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5"
                              >
                                <span>Checkout</span>
                                <ArrowRight size={13} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 3. Interactive Search Modal / Slide-Down Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 z-10 border border-neutral-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Search Zion Atelier
                </span>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors"
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative mb-6">
                <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search garments, outerwear, footwear, materials..."
                  className="w-full pl-12 pr-12 py-4 bg-neutral-50 hover:bg-neutral-100 focus:bg-white border border-neutral-200 rounded-2xl text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                  >
                    <X size={16} />
                  </button>
                )}
              </form>

              {/* Popular Atelier Search Queries */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  Trending Collections & Search Terms
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleQuickSearch(term)}
                      className="px-3.5 py-1.5 bg-neutral-50 hover:bg-black hover:text-white border border-neutral-200 rounded-full text-xs font-medium text-neutral-700 transition-all duration-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Category Jump */}
              <div className="mt-6 pt-5 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Outerwear', count: '4 Pieces' },
                  { name: 'Tailoring', count: '3 Pieces' },
                  { name: 'Footwear', count: '2 Pieces' },
                  { name: 'Accessories', count: '3 Pieces' }
                ].map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      navigate(`/products?category=${encodeURIComponent(c.name)}`)
                      setIsSearchOpen(false)
                    }}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-left transition-colors"
                  >
                    <p className="text-xs font-bold text-neutral-900">{c.name}</p>
                    <p className="text-[10px] text-neutral-400">{c.count}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Mobile Slide-Over Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-4/5 max-w-sm h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto z-10"
            >
              {/* Drawer Header */}
              <div>
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                  <div>
                    <span className="font-heading text-xl font-bold tracking-tight text-neutral-900 block">
                      ZION
                    </span>
                    <span className="text-[9px] font-semibold tracking-widest uppercase text-neutral-400">
                      Atelier Privé
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile Search Button */}
                <div className="p-4 border-b border-neutral-100">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsSearchOpen(true)
                    }}
                    className="w-full py-3 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-400 flex items-center gap-3 text-left"
                  >
                    <Search size={16} />
                    <span>Search garments, collections...</span>
                  </button>
                </div>

                {/* Mobile Navigation Links */}
                <div className="py-4 px-6 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                    Catalog Categories
                  </p>
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-3 text-sm font-semibold text-neutral-800 hover:text-black border-b border-neutral-50"
                    >
                      <div className="flex items-center gap-2">
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="px-1.5 py-0.5 bg-black text-white text-[9px] font-bold rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-neutral-400" />
                    </Link>
                  ))}
                </div>

                {/* Collections Shortcut */}
                <div className="px-6 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
                    Featured Capsules
                  </p>
                  <div className="space-y-2">
                    {FEATURED_COLLECTIONS.map((c) => (
                      <Link
                        key={c.title}
                        to={`/products?category=${encodeURIComponent(c.category)}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors"
                      >
                        <img
                          src={c.image}
                          alt={c.title}
                          className="w-10 h-10 rounded-lg object-cover bg-neutral-100"
                        />
                        <div>
                          <p className="text-xs font-semibold text-neutral-900">{c.title}</p>
                          <p className="text-[10px] text-neutral-400">{c.category}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer / Account */}
              <div className="p-6 border-t border-neutral-100 bg-neutral-50 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 px-3 bg-white border border-neutral-200 text-neutral-900 text-xs font-semibold rounded-xl text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 px-3 bg-black text-white text-xs font-semibold rounded-xl text-center"
                  >
                    Join Circle
                  </Link>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500 pt-2">
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} />
                    <span>Global Delivery (USD)</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <ShieldCheck size={13} />
                    <span>Secure SSL</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Navbar
