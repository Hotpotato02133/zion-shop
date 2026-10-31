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

// Zion apparel catalog (local fallback, mirrored from Supabase `products` table)
const defaultFeaturedProducts = [
  {
    id: 1,
    name: 'Classic Crewneck T-Shirt',
    price: 28,
    originalPrice: 35,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1400&auto=format&fit=crop',
    category: 'Tops',
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
    category: 'Bottoms',
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
    category: 'Bottoms',
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
    category: 'Outerwear',
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
    category: 'Outerwear',
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
    category: 'Footwear',
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
    category: 'Footwear',
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
    category: 'Accessories',
    tag: 'Bestseller',
    rating: 4.7,
    reviews: 198
  }
]

const categories = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories']

const collectionShowcases = [
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

const testimonials = [
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
      <section className="w-full py-12 bg-black text-white">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Truck size={22} className="text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base">Complimentary Global Freight</h4>
                <p className="text-sm text-gray-400">Insured express courier on all worldwide orders over $150.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base">Artisanal Warranty</h4>
                <p className="text-sm text-gray-400">Lifetime craftsmanship repair and certified provenance.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Clock size={22} className="text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base">30-Day Effortless Returns</h4>
                <p className="text-sm text-gray-400">Complimentary home collection for exchanges and returns.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Sparkles size={22} className="text-white" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading font-bold text-base">Private Concierge</h4>
                <p className="text-sm text-gray-400">24/7 dedicated personal styling and gifting consultation.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CURATED CATEGORY SHOWCASE (Interactive Grid) */}
      <section id="collections" className="w-full py-20 bg-gray-50/50">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-widest font-semibold text-gray-500">
                Architectural Universes
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Curated Collections
              </h2>
            </div>
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors group">
              <span>Explore All Categories</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {collectionShowcases.map((col, idx) => (
              <Link key={idx} to={col.link} className="group block">
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-sm group-hover:shadow-2xl transition-all duration-500 bg-gray-900"
                >
                  <img 
                    src={col.image} 
                    alt={col.title}
                    className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                    <h3 className="font-heading text-2xl font-bold tracking-tight">
                      {col.title}
                    </h3>
                    <p className="text-sm text-gray-300 font-light line-clamp-2">
                      {col.description}
                    </p>
                    <div className="pt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white group-hover:underline">
                      <span>Browse Gallery</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS (Dynamic Tabs + Direct Cart/Wishlist integration) */}
      <section className="w-full py-24 bg-white">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-widest font-semibold text-gray-500">
                Atelier Handpicked
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Featured Catalog
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
                    activeCategory === cat
                      ? 'bg-black text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      {/* Tag Badge */}
                      {product.tag && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                            {product.tag}
                          </span>
                        </div>
                      )}

                      {/* Floating Quick Action Buttons */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                        
                        <Link to={`/products?search=${encodeURIComponent(product.name)}`}>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2.5 bg-white/90 backdrop-blur-md text-black hover:bg-white rounded-full shadow-lg transition-colors"
                            title="Inspect details"
                          >
                            <Eye size={16} />
                          </motion.button>
                        </Link>
                      </div>

                      {/* Quick Add To Cart Hover Pill */}
                      <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleAddToCartWithToast(product)}
                          className="w-full bg-black/90 hover:bg-black backdrop-blur-md text-white py-3 rounded-2xl text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl"
                        >
                          <ShoppingBag size={14} />
                          <span>Quick Add to Bag</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="uppercase tracking-widest font-medium">{product.category}</span>
                          <div className="flex items-center gap-1 text-gray-700">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            <span>{product.rating}</span>
                          </div>
                        </div>

                        <h3 className="font-heading font-bold text-base text-black group-hover:text-gray-600 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </div>

                      {/* Pricing */}
                      <div className="pt-4 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="font-heading text-lg font-bold">${product.price}</span>
                          {product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">${product.originalPrice}</span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-500 hover:text-black">
                          In Stock
                        </span>
                      </div>
                    </div>

                  </motion.article>
                )
              })}
            </AnimatePresence>
          </motion.div>

          {/* Catalog CTA */}
          <div className="text-center mt-16">
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-black text-white px-10 py-4 rounded-full text-sm font-semibold tracking-wider uppercase shadow-xl hover:bg-gray-800 transition-all duration-300 inline-flex items-center gap-2"
              >
                <span>View Full Catalog</span>
                <ArrowRight size={16} />
              </motion.button>
            </Link>
          </div>

        </div>
      </section>

      {/* 5. CRAFTSMANSHIP & EDITORIAL STORY SECTION */}
      <section className="w-full py-24 bg-gray-50/70 border-t border-b border-gray-100">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Visual Mosaic (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1400&auto=format&fit=crop" 
                  alt="Zion Craft Workshop"
                  className="w-full h-[480px] object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-white/90 backdrop-blur-md text-black">
                  <p className="font-heading text-sm font-bold uppercase tracking-wider text-gray-500">Workshop Manifesto</p>
                  <p className="text-sm font-medium mt-1">"We eliminate every superfluous curve until only true functional essence remains."</p>
                </div>
              </div>
            </div>

            {/* Narrative Story (6 cols) */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-widest font-semibold text-gray-500">
                  The Zion Philosophy
                </span>
                <h2 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-black leading-tight">
                  Restraint. Material Honesty. Longevity.
                </h2>
                <p className="text-base sm:text-lg text-gray-600 font-light leading-relaxed">
                  In an age of rapid disposability, Zion stands for permanence. We partner directly with mills and workshops across Portugal, Japan, and northern Italy to cut and finish everyday apparel using honest cotton, full-grain leather, and durable denim.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-1">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-base">Zero Synthetic Compromises</h4>
                    <p className="text-sm text-gray-600">Pure raw materials selected for their tactile aging qualities and patina.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-1">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-base">Direct Heritage Workshops</h4>
                    <p className="text-sm text-gray-600">Eliminating middlemen markups to invest directly in artisan fair wages.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-1">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-base">Circular Longevity Guarantee</h4>
                    <p className="text-sm text-gray-600">Every garment is cut to be repaired, re-hemmed, and worn for years.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link to="/products">
                  <button className="text-sm font-bold uppercase tracking-wider text-black border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors">
                    Read Our Complete Provenance Report →
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS & CLIENT ACCOLADES */}
      <section className="w-full py-24 bg-white">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase tracking-widest font-semibold text-gray-500">
              Patron Testimonials
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Words From The Circle
            </h2>
            <p className="text-gray-600 font-light">
              Trusted by architects, designers, and discerning collectors in over 40 countries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic text-base leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-heading font-bold text-sm text-black">{t.author}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t.city}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. VIP PRIVATE CIRCLE NEWSLETTER */}
      <section className="w-full py-20 lg:py-28 bg-black text-white relative overflow-hidden">
        {/* Decorative ambient glows */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-[480px] h-[480px] bg-white/[0.05] rounded-full blur-3xl pointer-events-none" />
        {/* Brand texture, consistent with hero */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] pointer-events-none" />

        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: Copy & Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-7 text-center lg:text-left"
            >
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-gray-400">
                <Sparkles size={14} className="text-white" />
                Exclusive Access
              </span>
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.02]">
                Join The Zion
                <br className="hidden lg:block" /> Private Circle
              </h2>
              <p className="text-gray-400 font-light text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                Receive private previews of limited atelier runs, architectural lookbooks, and invitations to seasonal private sales.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-xl mx-auto lg:mx-0">
                {[
                  { icon: Gift, label: 'Limited Atelier Previews' },
                  { icon: Calendar, label: 'Seasonal Private Sales' },
                  { icon: Sparkles, label: 'Architectural Lookbooks' }
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center lg:items-start gap-2.5 text-center lg:text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-300 leading-snug">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Signup Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl"
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
                    <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center mx-auto">
                      <Check size={26} strokeWidth={2.5} />
                    </div>
                    <p className="font-heading text-xl font-bold">Welcome to the Private Circle</p>
                    <p className="text-sm text-gray-400">We have sent a verification invitation to your email.</p>
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
                    className="space-y-5"
                  >
                    <div className="space-y-1.5">
                      <h3 className="font-heading text-xl font-bold">Request Your Invitation</h3>
                      <p className="text-xs text-gray-400">Strict confidentiality. No promotional spam.</p>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        required
                        className="w-full px-5 py-4 rounded-2xl bg-white/5 text-white placeholder-gray-500 border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent text-sm transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-white text-black py-4 rounded-2xl text-sm font-bold tracking-wider uppercase hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2"
                      >
                        <span>Join the Circle</span>
                        <ArrowRight size={16} />
                      </motion.button>
                    </div>

                    <p className="text-[11px] text-gray-500 text-center">
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
