import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Star, 
  Search, 
  Filter, 
  Heart, 
  ShoppingBag, 
  Eye, 
  X, 
  Check, 
  Plus, 
  Minus, 
  Truck, 
  ShieldCheck, 
  RotateCcw,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useSupabase } from '../context/SupabaseContext'

// Expanded Curated Luxury Catalog
const products = [
  {
    id: 1,
    name: 'Atelier Wireless Over-Ear Headphones',
    price: 299,
    originalPrice: 399,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Electronics',
    tag: 'Limited Edition',
    rating: 4.9,
    reviews: 142,
    stock: 7,
    description: 'Precision acoustic engineering featuring 40mm custom beryllium drivers, memory foam ear cushions wrapped in full-grain lambskin, and 45-hour active noise cancellation.',
    specs: {
      'Material': 'Anodized Aluminum & Lambskin',
      'Battery': '45h Active ANC Playback',
      'Origin': 'Designed in Copenhagen',
      'Warranty': '3-Year Global Warranty'
    }
  },
  {
    id: 2,
    name: 'Monochrome Minimalist Chronograph',
    price: 420,
    originalPrice: 480,
    image: 'https://images.unsplash.com/photo-1523170335258-f5e6a7c0c1c4?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1523170335258-f5e6a7c0c1c4?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Accessories',
    tag: 'Bestseller',
    rating: 4.9,
    reviews: 98,
    stock: 5,
    description: 'Surgical-grade 316L matte black case paired with double-domed anti-reflective sapphire crystal and a Swiss automatic self-winding caliber.',
    specs: {
      'Movement': 'Automatic Caliber 2824-2',
      'Case': '316L Sandblasted Steel (40mm)',
      'Glass': 'Anti-Reflective Sapphire',
      'Water Resistance': '5 ATM / 50 Meters'
    }
  },
  {
    id: 3,
    name: 'Full-Grain Structured Leather Backpack',
    price: 340,
    originalPrice: 390,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Fashion',
    tag: 'Handcrafted',
    rating: 4.8,
    reviews: 215,
    stock: 12,
    description: 'Vegetable-tanned Tuscan leather conditioned with natural beeswax. Includes a padded 16-inch laptop pocket and water-resistant YKK Excella zippers.',
    specs: {
      'Material': 'Tuscan Full-Grain Vachetta',
      'Hardware': 'Brushed Solid Brass',
      'Capacity': '22 Liters',
      'Dimensions': '44cm x 30cm x 15cm'
    }
  },
  {
    id: 4,
    name: 'Acoustic Sculptural Smart Speaker',
    price: 189,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1543512214-318c7553f230?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Electronics',
    tag: 'New Arrival',
    rating: 4.7,
    reviews: 76,
    stock: 15,
    description: 'Monolithic acoustic sphere wrapped in acoustically transparent Nordic wool fabric. Features custom DSP room-tuning and lossless multi-room streaming.',
    specs: {
      'Audio': '90W Class-D Amplification',
      'Connectivity': 'WiFi 6, AirPlay 2, Bluetooth 5.3',
      'Enclosure': 'Resonance-Free Mineral Composite',
      'Weight': '3.2 kg'
    }
  },
  {
    id: 5,
    name: 'Japanese Acetate Luxury Sunglasses',
    price: 240,
    originalPrice: 280,
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Accessories',
    tag: 'Seasonal',
    rating: 4.8,
    reviews: 110,
    stock: 9,
    description: 'Hand-cut 8mm Japanese Takiron cellulose acetate with seven-barrel hinges and scratch-resistant polarized Carl Zeiss lenses offering 100% UV protection.',
    specs: {
      'Frame': 'Japanese Cured Acetate',
      'Lenses': 'Carl Zeiss CR-39 Polarized',
      'Hinges': '7-Barrel Custom German Steel',
      'UV Protection': 'UV400 Cat. 3'
    }
  },
  {
    id: 6,
    name: 'Handcrafted Scented Atelier Candle',
    price: 68,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Home',
    tag: 'Atelier',
    rating: 4.9,
    reviews: 180,
    stock: 25,
    description: 'Hand-poured coconut and soy wax blend infused with wild cypress, smoke, and black amber. Encased in a reusable mouth-blown smoked obsidian tumbler.',
    specs: {
      'Burn Time': 'Approx. 65 Hours',
      'Wax': '100% Organic Soy & Coconut',
      'Vessel': 'Mouth-Blown Smoked Glass',
      'Scent Profile': 'Cypress, Black Amber, Cedar'
    }
  },
  {
    id: 7,
    name: 'Ceramic Matte Minimalist Coffee Set',
    price: 125,
    originalPrice: 150,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Home',
    tag: 'Artisan',
    rating: 4.9,
    reviews: 94,
    stock: 14,
    description: 'Wheel-thrown high-fire stoneware glazed with an unrefined basalt matte finish. Includes precision pour-over dripper, carafe, and two matching espresso cups.',
    specs: {
      'Material': 'High-Fire Stoneware Ceramic',
      'Glaze': 'Food-Safe Basalt Matte',
      'Dishwasher Safe': 'Yes',
      'Carafe Capacity': '600 ml'
    }
  },
  {
    id: 8,
    name: 'Vegetable-Tanned Heritage Leather Journal',
    price: 95,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Accessories',
    tag: 'Refillable',
    rating: 4.9,
    reviews: 84,
    stock: 18,
    description: 'Heirloom journal with a solid brass binder mechanism, holding 192 pages of bleed-resistant 120gsm Japanese fountain-pen friendly cotton paper.',
    specs: {
      'Paper': '120gsm Japanese Cotton Archive',
      'Cover': 'Full-Grain English Bridle Leather',
      'Binding': 'Refillable Solid Brass Screwpost',
      'Page Count': '192 Lined / Plain Leaves'
    }
  },
  {
    id: 9,
    name: 'Double-Faced Cashmere Minimalist Overcoat',
    price: 780,
    originalPrice: 920,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Fashion',
    tag: 'Atelier Spotlight',
    rating: 5.0,
    reviews: 62,
    stock: 4,
    description: 'Unlined double-faced cashmere constructed using hand-split and hand-stitched invisible seam techniques by master tailors in Florence.',
    specs: {
      'Composition': '90% Mongolian Cashmere, 10% Silk',
      'Buttons': 'Natural Buffalo Horn',
      'Origin': 'Handmade in Florence, Italy',
      'Care': 'Specialist Dry Clean Only'
    }
  },
  {
    id: 10,
    name: 'Aircraft-Grade Titanium Fast Wireless Valet',
    price: 115,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Electronics',
    tag: 'New',
    rating: 4.7,
    reviews: 58,
    stock: 20,
    description: 'CNC-milled from a solid billet of Grade 5 titanium, inlaid with Italian Alcantara and capable of dual 15W Qi2 MagSafe fast charging.',
    specs: {
      'Material': 'Grade 5 Titanium & Alcantara',
      'Charging Standard': 'Qi2 Certified 15W MagSafe',
      'Ports': 'USB-C Braided Cable Included',
      'Compatibility': 'iPhone, AirPods, Android'
    }
  },
  {
    id: 11,
    name: 'Hand-Forged 67-Layer Damascus Santoku',
    price: 210,
    originalPrice: 250,
    image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1593618998160-e34014e67546?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Home',
    tag: 'Limited Craft',
    rating: 4.9,
    reviews: 43,
    stock: 6,
    description: 'Folded VG-10 core wrapped in 66 layers of nickel steel. Finished with an octagonal bog-oak handle and buffalo horn ferrule for surgical balance.',
    specs: {
      'Core Steel': 'Japanese VG-10 (61 HRC)',
      'Blade Length': '180mm / 7 Inches',
      'Handle': 'Stabilized Bog Oak & Horn',
      'Sharpening Angle': '15° Double Bevel'
    }
  },
  {
    id: 12,
    name: 'Pure Mulberry Silk Twill Modular Scarf',
    price: 165,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Fashion',
    tag: 'Silk Archive',
    rating: 4.8,
    reviews: 77,
    stock: 16,
    description: '18 momme heavy silk twill featuring subtle monochrome geometric engravings. Finished with French hand-rolled edges in Lake Como, Italy.',
    specs: {
      'Material': '100% Grade 6A Mulberry Silk (18mm)',
      'Dimensions': '90cm x 90cm',
      'Finishing': 'Hand-Rolled & Stitched Edges',
      'Origin': 'Como, Italy'
    }
  }
]

const checkCategoryMatch = (product, cat) => {
  if (!cat || cat === 'All') return true
  const catLower = cat.toLowerCase()
  const prodCatLower = (product.category || '').toLowerCase()
  if (prodCatLower === catLower) return true

  if (catLower === 'new in') {
    const tagLower = (product.tag || '').toLowerCase()
    return tagLower.includes('new') || tagLower.includes('spotlight') || tagLower.includes('limited')
  }

  if (catLower === 'outerwear') {
    return prodCatLower === 'outerwear' || 
           product.name.toLowerCase().includes('overcoat') || 
           product.name.toLowerCase().includes('coat') ||
           product.name.toLowerCase().includes('backpack')
  }

  if (catLower === 'tailoring') {
    return prodCatLower === 'tailoring' || 
           product.name.toLowerCase().includes('overcoat') || 
           product.name.toLowerCase().includes('scarf') ||
           product.name.toLowerCase().includes('chronograph')
  }

  if (catLower === 'footwear') {
    return prodCatLower === 'footwear' || 
           product.name.toLowerCase().includes('leather') || 
           prodCatLower === 'fashion'
  }

  return false
}

const categories = ['All', 'New In', 'Outerwear', 'Tailoring', 'Accessories', 'Fashion', 'Home', 'Electronics']

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToCart, addToWishlist, wishlist } = useApp()
  const { supabase, isConfigured } = useSupabase()
  const [catalog, setCatalog] = useState(products)

  // Fetch catalog from Supabase when database is ready, otherwise fall back to curated local catalog
  useEffect(() => {
    if (!isConfigured) return
    let isMounted = true

    const fetchCatalog = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*')
        if (!error && data && data.length > 0 && isMounted) {
          const normalized = data.map(item => ({
            ...item,
            productId: item.id,
            price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
            originalPrice: item.original_price ? parseFloat(item.original_price) : null,
            image: item.image_url || item.image,
            reviews: item.reviews_count ?? item.reviews ?? 0
          }))
          setCatalog(normalized)
        }
      } catch (err) {
        console.warn('[Zion Atelier] Using fallback catalog:', err)
      }
    }

    fetchCatalog()
    return () => { isMounted = false }
  }, [supabase, isConfigured])

  // Read URL parameters or fallback
  const initialCategory = searchParams.get('category') || 'All'
  const initialSearch = searchParams.get('search') || ''

  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [sortBy, setSortBy] = useState('featured')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quickViewQuantity, setQuickViewQuantity] = useState(1)
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0)
  const [toastMessage, setToastMessage] = useState(null)

  // Keep state synced if URL search params change
  useEffect(() => {
    const cat = searchParams.get('category')
    const srch = searchParams.get('search')
    if (cat && cat !== selectedCategory) setSelectedCategory(cat)
    if (srch !== null && srch !== searchTerm) setSearchTerm(srch)
  }, [searchParams, selectedCategory, searchTerm])

  // Sync state changes back to URL search params
  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    const newParams = new URLSearchParams(searchParams)
    if (category === 'All') {
      newParams.delete('category')
    } else {
      newParams.set('category', category)
    }
    setSearchParams(newParams)
  }

  const handleSearchChange = (val) => {
    setSearchTerm(val)
    const newParams = new URLSearchParams(searchParams)
    if (!val) {
      newParams.delete('search')
    } else {
      newParams.set('search', val)
    }
    setSearchParams(newParams)
  }

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

  // Check if item is saved in wishlist
  const isItemInWishlist = (productId) => {
    return wishlist.some(item => (item.productId ?? item.id) === productId)
  }

  // Toast feedback trigger
  const triggerToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const handleAddToCart = (product, quantity = 1) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    triggerToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}"${product.name}" to cart`)
  }

  const handleToggleWishlist = (product) => {
    addToWishlist(product)
    triggerToast(`Saved "${product.name}" to wishlist`)
  }

  // Filter products
  const filteredProducts = catalog.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = checkCategoryMatch(product, selectedCategory)
    return matchesSearch && matchesCategory
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'rating':
        return b.rating - a.rating
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return b.id - a.id // Newest / Featured
    }
  })

  // Quick View Modal handlers
  const openQuickView = (product) => {
    setSelectedProduct(product)
    setQuickViewQuantity(1)
    setQuickViewImageIndex(0)
    document.body.style.overflow = 'hidden'
  }

  const closeQuickView = () => {
    setSelectedProduct(null)
    document.body.style.overflow = 'auto'
  }

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeQuickView()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen w-full pt-10 pb-20 bg-white text-black font-body overflow-x-clip">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800 text-sm font-medium"
          >
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
              <Check size={12} strokeWidth={3} />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        
        {/* Header Banner */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="mb-12 border-b border-gray-100 pb-10"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-700 mb-4">
            Curated Atelier Collection
          </motion.div>
          <motion.h1 
            variants={fadeInUp}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4"
          >
            The Collection
          </motion.h1>
          <motion.p 
            variants={fadeInUp}
            className="text-base sm:text-lg text-gray-600 max-w-2xl font-light"
          >
            Discover enduring objects engineered with tactile restraint, honest materials, and certified artisan provenance.
          </motion.p>
        </motion.div>

        {/* Filter, Search & Sort Control Bar */}
        <div className="space-y-6 mb-12">
          
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by title, material, or category..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white text-sm transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort & Quick Filter Selector */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <SlidersHorizontal size={16} className="absolute left-3.5 text-gray-500 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-10 pr-8 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-semibold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-black cursor-pointer appearance-none"
                >
                  <option value="featured">Featured Pieces</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

              <div className="text-xs font-medium text-gray-500 hidden sm:block">
                {sortedProducts.length} {sortedProducts.length === 1 ? 'Piece' : 'Pieces'}
              </div>
            </div>

          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((category) => {
              const count = category === 'All' 
                ? products.length 
                : products.filter(p => checkCategoryMatch(p, category)).length

              return (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-black text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{category}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedCategory === category ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active Filter Clear Bar */}
          {(selectedCategory !== 'All' || searchTerm) && (
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
              <span>Active filters:</span>
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full text-black font-medium">
                  Category: {selectedCategory}
                  <button onClick={() => handleCategoryChange('All')}><X size={12} /></button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full text-black font-medium">
                  Search: "{searchTerm}"
                  <button onClick={() => handleSearchChange('')}><X size={12} /></button>
                </span>
              )}
              <button 
                onClick={() => { handleCategoryChange('All'); handleSearchChange(''); }}
                className="underline hover:text-black ml-2 font-medium"
              >
                Clear all
              </button>
            </div>
          )}

        </div>

        {/* Product Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
        >
          <AnimatePresence>
            {sortedProducts.map((product) => {
              const inWishlist = isItemInWishlist(product.id)

              return (
                <motion.article
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group"
                >
                  {/* Product Image Stage */}
                  <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden cursor-pointer" onClick={() => openQuickView(product)}>
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" 
                      loading="lazy"
                    />
                    
                    {/* Tag Badge */}
                    {product.tag && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-black/85 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                          {product.tag}
                        </span>
                      </div>
                    )}

                    {/* Floating Quick Action Buttons */}
                    <div 
                      className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleWishlist(product)}
                        className={`p-2.5 rounded-full shadow-lg transition-colors backdrop-blur-md ${
                          inWishlist
                            ? 'bg-red-500 text-white'
                            : 'bg-white/90 text-black hover:bg-white'
                        }`}
                        title="Save to Wishlist"
                      >
                        <Heart size={16} className={inWishlist ? 'fill-white' : ''} />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openQuickView(product)}
                        className="p-2.5 bg-white/90 backdrop-blur-md text-black hover:bg-white rounded-full shadow-lg transition-colors"
                        title="Quick View"
                      >
                        <Eye size={16} />
                      </motion.button>
                    </div>

                    {/* Quick Add To Bag Bar */}
                    <div 
                      className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-black/90 hover:bg-black backdrop-blur-md text-white py-3 rounded-2xl text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl"
                      >
                        <ShoppingBag size={14} />
                        <span>Quick Add to Bag</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="uppercase tracking-widest font-medium">{product.category}</span>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          <span>{product.rating}</span>
                          <span className="text-gray-400">({product.reviews})</span>
                        </div>
                      </div>

                      <h3 
                        onClick={() => openQuickView(product)}
                        className="font-heading font-bold text-base text-black group-hover:text-gray-600 transition-colors line-clamp-1 cursor-pointer"
                      >
                        {product.name}
                      </h3>
                    </div>

                    {/* Price & Action Row */}
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading text-lg font-bold">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => openQuickView(product)}
                        className="text-xs font-semibold text-black hover:text-gray-500 transition-colors uppercase tracking-wider"
                      >
                        Details →
                      </button>
                    </div>
                  </div>

                </motion.article>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty Search Results */}
        {sortedProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 max-w-md mx-auto space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <Search size={28} />
            </div>
            <h3 className="font-heading text-2xl font-bold">No Products Found</h3>
            <p className="text-sm text-gray-500">
              We couldn't find any items matching your current filters or search query.
            </p>
            <button
              onClick={() => { handleCategoryChange('All'); handleSearchChange(''); }}
              className="bg-black text-white px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors"
            >
              Reset All Filters
            </button>
          </motion.div>
        )}

      </div>

      {/* QUICK VIEW / PRODUCT DETAILS MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeQuickView}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl z-10 border border-gray-100"
            >
              {/* Close Button */}
              <button
                onClick={closeQuickView}
                className="absolute top-5 right-5 p-2.5 rounded-full bg-gray-100 hover:bg-black hover:text-white transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                
                {/* Left: Product Imagery Gallery */}
                <div className="p-6 lg:p-8 bg-gray-50 flex flex-col justify-between">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
                    <img 
                      src={selectedProduct.gallery ? selectedProduct.gallery[quickViewImageIndex] : selectedProduct.image} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedProduct.tag && (
                      <span className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        {selectedProduct.tag}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {selectedProduct.gallery && selectedProduct.gallery.length > 1 && (
                    <div className="flex gap-2.5">
                      {selectedProduct.gallery.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setQuickViewImageIndex(i)}
                          className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                            quickViewImageIndex === i ? 'border-black shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`thumbnail-${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Specifications & Purchasing Controls */}
                <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest font-semibold text-gray-500">
                        {selectedProduct.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Star size={13} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{selectedProduct.rating}</span>
                        <span className="text-gray-400">({selectedProduct.reviews} reviews)</span>
                      </div>
                    </div>

                    <h2 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">
                      {selectedProduct.name}
                    </h2>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-3">
                      <span className="font-heading text-2xl lg:text-3xl font-extrabold">
                        ${selectedProduct.price}
                      </span>
                      {selectedProduct.originalPrice && (
                        <>
                          <span className="text-sm text-gray-400 line-through">
                            ${selectedProduct.originalPrice}
                          </span>
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            Save ${(selectedProduct.originalPrice - selectedProduct.price)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      {selectedProduct.description}
                    </p>

                    {/* Specifications Accordion / Grid */}
                    {selectedProduct.specs && (
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <p className="text-xs uppercase tracking-wider font-semibold text-gray-900">Craft Details</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(selectedProduct.specs).map(([label, val]) => (
                            <div key={label} className="bg-gray-50 p-2.5 rounded-xl">
                              <span className="text-gray-400 block text-[10px] uppercase font-medium">{label}</span>
                              <span className="font-medium text-gray-900">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Purchase & Action Controls */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    
                    {/* Stock status */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-gray-600">
                        In stock • Only <strong className="text-black">{selectedProduct.stock} pieces</strong> crafted for this drop.
                      </span>
                    </div>

                    {/* Quantity + Add to Cart buttons */}
                    <div className="flex gap-3">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-gray-200 rounded-2xl px-2">
                        <button
                          onClick={() => setQuickViewQuantity(q => Math.max(1, q - 1))}
                          className="p-2 text-gray-500 hover:text-black transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {quickViewQuantity}
                        </span>
                        <button
                          onClick={() => setQuickViewQuantity(q => Math.min(selectedProduct.stock, q + 1))}
                          className="p-2 text-gray-500 hover:text-black transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Add to Bag CTA */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleAddToCart(selectedProduct, quickViewQuantity)
                          closeQuickView()
                        }}
                        className="flex-1 bg-black text-white py-3.5 px-6 rounded-2xl text-xs font-semibold uppercase tracking-wider hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 shadow-xl"
                      >
                        <ShoppingBag size={16} />
                        <span>Add to Bag • ${(selectedProduct.price * quickViewQuantity)}</span>
                      </motion.button>

                      {/* Wishlist Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleWishlist(selectedProduct)}
                        className={`p-3.5 rounded-2xl border transition-colors ${
                          isItemInWishlist(selectedProduct.id)
                            ? 'bg-red-500 text-white border-red-500'
                            : 'border-gray-200 text-black hover:bg-gray-50'
                        }`}
                        title="Save to Wishlist"
                      >
                        <Heart size={18} className={isItemInWishlist(selectedProduct.id) ? 'fill-white' : ''} />
                      </motion.button>
                    </div>

                    {/* Guarantees micro-bar */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-gray-500 pt-2">
                      <div className="flex items-center justify-center gap-1">
                        <Truck size={12} />
                        <span>Insured Courier</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <ShieldCheck size={12} />
                        <span>Certified Authentic</span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <RotateCcw size={12} />
                        <span>30-Day Returns</span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default Products
