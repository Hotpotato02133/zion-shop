import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Star,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  Sparkles,
  Clock,
  Check,
  ChevronRight,
  Eye,
  Calendar,
  Gift
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useSupabase } from '../context/SupabaseContext'
import HeroCarousel from '../components/HeroCarousel'
import ScrollLookbook from '../components/ScrollLookbook'
import Atelier3DViewer from '../components/Atelier3DViewer'

// Zion apparel catalog (local fallback, mirrored from Supabase `products` table)
const defaultFeaturedProducts = [
  {
    id: 1,
    name: 'Classic Crewneck T-Shirt',
    price: 28,
    originalPrice: 35,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1400&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1400&auto=format&fit=crop',
    category: 'Tops',
    spec: '240 GSM Organic Cotton',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 326
  },
  {
    id: 6,
    name: 'Pleated Mini Skirt',
    price: 48,
    originalPrice: 58,
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1400&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1400&auto=format&fit=crop',
    category: 'Bottoms',
    spec: 'Fine-Weave Wool & Cotton',
    tag: 'Bestseller',
    rating: 4.7,
    reviews: 133
  },
  {
    id: 8,
    name: 'Classic Skinny Fit Jeans',
    price: 68,
    originalPrice: 82,
    image: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1400&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1400&auto=format&fit=crop',
    category: 'Bottoms',
    spec: '13.5oz Stretch Selvedge',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 241
  },
  {
    id: 10,
    name: 'Faux Leather Biker Jacket',
    price: 148,
    originalPrice: 178,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1400&auto=format&fit=crop',
    category: 'Outerwear',
    spec: 'Tuscan Grain Vegan Nappa',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 97
  },
  {
    id: 11,
    name: 'Classic Denim Trucker Jacket',
    price: 96,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1400&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1400&auto=format&fit=crop',
    category: 'Outerwear',
    spec: '14oz Raw Indigo Selvedge',
    tag: 'New In',
    rating: 4.7,
    reviews: 112
  },
  {
    id: 13,
    name: 'Leather Lace-Up Combat Boots',
    price: 132,
    originalPrice: 155,
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1400&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1400&auto=format&fit=crop',
    category: 'Footwear',
    spec: 'Full-Grain Calfskin Welted',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 164
  },
  {
    id: 15,
    name: 'Chunky Colorblock Sneakers',
    price: 110,
    originalPrice: 130,
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1400&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1400&auto=format&fit=crop',
    category: 'Footwear',
    spec: 'Vibram Sole & Italian Suede',
    tag: 'New Arrival',
    rating: 4.6,
    reviews: 72
  },
  {
    id: 17,
    name: 'Round Metal-Frame Sunglasses',
    price: 38,
    originalPrice: 48,
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop',
    secondaryImage: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?q=80&w=1400&auto=format&fit=crop',
    category: 'Accessories',
    spec: 'Titanium Wire & Mineral Glass',
    tag: 'Bestseller',
    rating: 4.7,
    reviews: 198
  }
]

const categories = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories']

const _collectionShowcases = [
  {
    title: 'Everyday Apparel',
    description: 'Tees, knits, and dresses cut from honest, breathable fabrics.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop',
    link: '/products?category=Tops'
  },
  {
    title: 'Outerwear Edit',
    description: 'Jackets built to layer, weather, and wear in with character.',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=900&auto=format&fit=crop',
    link: '/products?category=Outerwear'
  },
  {
    title: 'Footwear & Accessories',
    description: 'Boots, sneakers, bags, and finishing pieces for every fit.',
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=900&auto=format&fit=crop',
    link: '/products?category=Footwear'
  }
]

const _testimonials = [
  {
    quote: "Zion embodies the pinnacle of quiet luxury. The tactile presence of their objects transforms everyday spaces.",
    author: "Elena Rostova",
    role: "Architectural Digest Reviewer",
    city: "Milan"
  },
  {
    quote: "Fast international courier, immaculate packaging, and a level of finish that outclasses brands twice the price.",
    author: "Julian Vance",
    role: "Verified Private Collector",
    city: "London"
  },
  {
    quote: "Uncompromising minimalism. You can sense the restraint and human hand in every stitch and edge.",
    author: "Kaito Tanaka",
    role: "Industrial Designer",
    city: "Tokyo"
  }
]

const Home = () => {
  const { addToCart, addToWishlist, wishlist } = useApp()
  const { supabase, isConfigured } = useSupabase()
  const [activeCategory, setActiveCategory] = useState('All')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false)
  const [addedItemNotification, setAddedItemNotification] = useState(null)
  const [featuredProducts, setFeaturedProducts] = useState(defaultFeaturedProducts)

  // Fetch featured catalog from Supabase when database is ready, otherwise fall back to local catalog
  useEffect(() => {
    if (!isConfigured) return
    let isMounted = true

    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('reviews_count', { ascending: false })
          .limit(8)
        if (!error && data && data.length > 0 && isMounted) {
          const normalized = data.map(item => ({
            ...item,
            productId: item.id,
            price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
            originalPrice: item.original_price ? parseFloat(item.original_price) : null,
            image: item.image_url || item.image,
            reviews: item.reviews_count ?? item.reviews ?? 0
          }))
          setFeaturedProducts(normalized)
        }
      } catch (err) {
        console.warn('[Zion Atelier] Using fallback featured catalog:', err)
      }
    }

    fetchFeatured()
    return () => { isMounted = false }
  }, [supabase, isConfigured])

  const isItemInWishlist = (productId) => {
    return wishlist.some(item => (item.productId ?? item.id) === productId)
  }

  const handleAddToCartWithToast = (product) => {
    addToCart(product)
    setAddedItemNotification(`${product.name} added to cart`)
    setTimeout(() => setAddedItemNotification(null), 2500)
  }

  const handleToggleWishlist = (product) => {
    addToWishlist(product)
    setAddedItemNotification(`${product.name} added to wishlist`)
    setTimeout(() => setAddedItemNotification(null), 2500)
  }

  const filteredProducts = activeCategory === 'All'
    ? featuredProducts
    : featuredProducts.filter(p => p.category === activeCategory)

  return (
    <div className="min-h-screen w-full bg-white text-black font-body overflow-x-clip">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {addedItemNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800 text-sm font-medium"
          >
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
              <Check size={12} strokeWidth={3} />
            </div>
            <span>{addedItemNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO SECTION */}
      <HeroCarousel />

      {/* 2. VALUE PROPOSITION RIBBON */}
      <section className="w-full py-12 bg-neutral-950 text-white">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1.5">
              <h3 className="font-heading font-medium text-base text-white">Global Express Freight</h3>
              <p className="text-base text-neutral-300">Insured express delivery worldwide on all orders over $150.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-medium text-base text-white">Artisanal Provenance</h3>
              <p className="text-base text-neutral-300">Lifetime craftsmanship repair and verified workshop sourcing.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-medium text-base text-white">30-Day Returns</h3>
              <p className="text-base text-neutral-300">Complimentary courier collection for exchanges and returns.</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-heading font-medium text-base text-white">Private Concierge</h3>
              <p className="text-base text-neutral-300">Dedicated styling assistance and bespoke sizing consultation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CURATED CATEGORY SHOWCASE (Asymmetrical Editorial Mosaic) */}
      <section id="collections" className="w-full py-20 lg:py-28 bg-neutral-50">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-2">
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
                Curated Collections
              </h2>
              <p className="text-base text-neutral-600">Considered garments engineered for silhouette, movement, and permanence.</p>
            </div>
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-neutral-600 transition-colors group">
              <span>Explore All Categories</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Asymmetrical Editorial Mosaic (7 / 5 Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Left Dominant Frame (7 Columns) */}
            <div className="lg:col-span-7">
              <Link to="/products?category=Outerwear" className="group block h-full">
                <div className="relative h-[440px] sm:h-[500px] lg:h-[620px] rounded-2xl overflow-hidden bg-neutral-900">
                  <img 
                    src="https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop" 
                    alt="Outerwear & Tailoring"
                    className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  
                  <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
                    <h3 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight">
                      Outerwear & Tailoring
                    </h3>
                    <p className="text-base text-neutral-200 font-light max-w-md line-clamp-2">
                      Jackets built to layer, weather, and wear in with character. Milled in northern Italy and finished by hand.
                    </p>
                    <div className="pt-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white group-hover:underline">
                      <span>Explore Outerwear</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Right Stacked Frames (5 Columns) */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
              {/* Top Frame: Everyday Apparel */}
              <Link to="/products?category=Tops" className="group block flex-1">
                <div className="relative h-[260px] sm:h-[280px] lg:h-[294px] rounded-2xl overflow-hidden bg-neutral-900">
                  <img 
                    src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop" 
                    alt="Everyday Apparel"
                    className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <h3 className="font-heading text-2xl font-semibold tracking-tight">
                      Everyday Apparel
                    </h3>
                    <p className="text-sm text-neutral-200 font-light line-clamp-1">
                      Tees, knits, and shirt dresses cut from 240 GSM organic jersey.
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-white group-hover:underline">
                      <span>View Apparel</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Bottom Frame: Footwear & Accessories */}
              <Link to="/products?category=Footwear" className="group block flex-1">
                <div className="relative h-[260px] sm:h-[280px] lg:h-[294px] rounded-2xl overflow-hidden bg-neutral-900">
                  <img 
                    src="https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=900&auto=format&fit=crop" 
                    alt="Footwear & Objects"
                    className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <h3 className="font-heading text-2xl font-semibold tracking-tight">
                      Footwear & Leather Objects
                    </h3>
                    <p className="text-sm text-neutral-200 font-light line-clamp-1">
                      Goodyear-welted leather boots and minimal everyday carry.
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-white group-hover:underline">
                      <span>View Footwear</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SCROLL-TRIGGERED EDITORIAL LOOKBOOK */}
      <ScrollLookbook />

      {/* 5. FEATURED PRODUCTS (Dynamic Tabs + Direct Cart/Wishlist integration) */}
      <section className="w-full py-24 bg-white">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-2">
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
                Featured Catalog
              </h2>
              <p className="text-sm text-neutral-600">Pure raw materials selected for their tactile aging qualities.</p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold tracking-wider uppercase transition-colors ${
                    activeCategory === cat
                      ? 'bg-black text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          >
            <AnimatePresence>
              {filteredProducts.map((product) => {
                const inWishlist = isItemInWishlist(product.id)

                return (
                  <motion.article
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-2xl overflow-hidden flex flex-col group"
                  >
                    {/* Image Area with Lookbook Crossfade */}
                    <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden rounded-2xl">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          product.secondaryImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'
                        }`}
                        loading="lazy"
                      />
                      {product.secondaryImage && (
                        <img 
                          src={product.secondaryImage} 
                          alt={`${product.name} detail view`} 
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}
                      
                      {/* Tag Badge */}
                      {product.tag && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="bg-black text-white text-xs font-medium px-2.5 py-1 rounded">
                            {product.tag}
                          </span>
                        </div>
                      )}

                      {/* Quick Action Buttons */}
                      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleWishlist(product)}
                          className={`p-2 rounded-full transition-colors ${
                            inWishlist
                              ? 'bg-black text-white'
                              : 'bg-white text-black hover:bg-neutral-100'
                          }`}
                          title="Save to Wishlist"
                        >
                          <Heart size={15} className={inWishlist ? 'fill-white' : ''} />
                        </motion.button>
                        
                        <Link to={`/products?search=${encodeURIComponent(product.name)}`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-white text-black hover:bg-neutral-100 rounded-full transition-colors"
                            title="Inspect details"
                          >
                            <Eye size={15} />
                          </motion.button>
                        </Link>
                      </div>

                      {/* Quick Add To Cart Hover Pill */}
                      <div className="absolute bottom-3 left-3 right-3 z-10 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleAddToCartWithToast(product)}
                          className="w-full bg-black hover:bg-neutral-800 text-white py-2.5 rounded-xl text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
                        >
                          <ShoppingBag size={14} />
                          <span>Quick Add to Bag</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="pt-3 pb-1 px-1 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-neutral-600">
                          <span className="font-medium text-neutral-700 truncate mr-2">{product.spec || product.category}</span>
                          <span className="shrink-0 text-neutral-500">In Stock</span>
                        </div>

                        <h3 className="font-heading font-medium text-base text-neutral-950 group-hover:text-neutral-600 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </div>

                      {/* Pricing */}
                      <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="font-heading text-base font-medium tabular-nums text-neutral-950">${product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-neutral-600 line-through">${product.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>

                  </motion.article>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {/* Catalog CTA */}
          <div className="text-center mt-14">
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-black text-white px-9 py-4 rounded-full text-sm font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
              >
                <span>View Full Catalog</span>
                <ArrowRight size={16} />
              </motion.button>
            </Link>
          </div>

        </div>
      </section>

      {/* 5. CRAFTSMANSHIP & EDITORIAL STORY SECTION */}
      <section className="w-full py-24 bg-neutral-50">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Visual Mosaic (6 cols) */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden bg-neutral-900">
                <img 
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1400&auto=format&fit=crop" 
                  alt="Zion Craft Workshop"
                  className="w-full h-[460px] object-cover"
                />
              </div>
            </div>

            {/* Narrative Story (6 cols) */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-3">
                <h2 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight text-black leading-tight">
                  Restraint. Material Honesty. Longevity.
                </h2>
                <p className="text-base sm:text-lg text-neutral-600 font-light leading-relaxed">
                  In an age of rapid disposability, Zion stands for permanence. We partner directly with mills and workshops across Portugal, Japan, and northern Italy to cut and finish everyday apparel using honest cotton, full-grain leather, and durable denim.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div className="space-y-1">
                  <h3 className="font-heading font-semibold text-base text-black">Zero Synthetic Compromises</h3>
                  <p className="text-base text-neutral-600 leading-relaxed">Pure raw materials selected for their tactile aging qualities and rich natural patina.</p>
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading font-semibold text-base text-black">Direct Heritage Workshops</h3>
                  <p className="text-base text-neutral-600 leading-relaxed">Partnering directly with mills across Portugal, Japan, and Italy to invest in artisan wages.</p>
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading font-semibold text-base text-black">Circular Longevity Guarantee</h3>
                  <p className="text-base text-neutral-600 leading-relaxed">Every garment is engineered and cut to be repaired, re-hemmed, and worn across decades.</p>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/products">
                  <button className="text-sm font-medium tracking-wide uppercase text-black underline underline-offset-8 hover:text-neutral-600 transition-colors">
                    Read Our Complete Provenance Report →
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE 3D ATELIER STAGE (360° Drag Turntable + Material Inspector) */}
      <Atelier3DViewer />

      {/* 8. TESTIMONIALS & RECOGNITION */}
      <section className="w-full py-24 bg-white">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="max-w-3xl mb-12 space-y-3">
            <blockquote className="font-heading text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight text-neutral-950 leading-snug">
              "Zion embodies quiet luxury — garments of architectural weight and material restraint, without superfluous detail."
            </blockquote>
            <p className="text-sm text-neutral-600 font-medium">
              — Elena Rostova, <span className="text-neutral-900 font-semibold">Architectural Digest Reviewer</span> · Milan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 pt-4">
            <div className="space-y-2.5">
              <p className="text-neutral-800 text-base sm:text-lg leading-relaxed font-light">
                "Fast international courier, immaculate packaging, and a level of finish that outclasses brands twice the price."
              </p>
              <p className="text-base text-neutral-600">
                <span className="font-medium text-black">Julian Vance</span> · Verified Private Collector, London
              </p>
            </div>
            <div className="space-y-2.5">
              <p className="text-neutral-800 text-base sm:text-lg leading-relaxed font-light">
                "Uncompromising minimalism. You can sense the human hand in every selvedge seam and collar edge."
              </p>
              <p className="text-base text-neutral-600">
                <span className="font-medium text-black">Kaito Tanaka</span> · Industrial Designer, Tokyo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. VIP PRIVATE CIRCLE NEWSLETTER */}
      <section className="w-full py-20 lg:py-24 bg-neutral-950 text-white relative">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="space-y-5 text-center lg:text-left"
            >
              <h2 className="font-heading text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
                Join The Zion Private Circle
              </h2>
              <p className="text-neutral-300 font-light text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                Receive private previews of limited atelier runs, architectural lookbooks, and invitations to seasonal private releases.
              </p>
            </motion.div>

            {/* Right: Signup Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 sm:p-10"
            >
              <AnimatePresence mode="wait">
                {newsletterSubscribed ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-6 space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center mx-auto">
                      <Check size={22} strokeWidth={2.5} />
                    </div>
                    <p className="font-heading text-xl font-semibold">Welcome to the Private Circle</p>
                    <p className="text-sm text-neutral-400">We have sent a verification invitation to your email.</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (newsletterEmail) setNewsletterSubscribed(true)
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <h3 className="font-heading text-lg font-semibold">Request Your Invitation</h3>
                      <p className="text-sm text-neutral-400">Strict confidentiality. No promotional marketing.</p>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3.5 rounded-xl bg-neutral-950 text-white placeholder-neutral-500 border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-white text-base transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-white text-black py-3.5 rounded-xl text-sm font-semibold tracking-wider uppercase hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>Join the Circle</span>
                        <ArrowRight size={16} />
                      </motion.button>
                    </div>

                    <p className="text-sm text-neutral-400 text-center">
                      Unsubscribe with one click anytime.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  )
}

export default Home
