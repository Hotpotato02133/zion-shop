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
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useSupabase } from '../context/SupabaseContext'

// Zion Apparel Catalog (local fallback, mirrored from Supabase `products` table)
const products = [
  {
    id: 1,
    name: 'Classic Crewneck T-Shirt',
    price: 28,
    originalPrice: 35,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Tops',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 326,
    stock: 48,
    description: 'A wardrobe essential cut from heavyweight combed cotton jersey for a clean drape that holds its shape wash after wash. Reinforced collar seam and double-stitched hem.',
    specs: {
      'Material': '100% Combed Cotton Jersey',
      'Fit': 'Regular Fit',
      'Sizes': 'XS, S, M, L, XL, XXL',
      'Care': 'Machine Wash Cold'
    }
  },
  {
    id: 2,
    name: 'Essential Tee 3-Pack',
    price: 45,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Tops',
    tag: 'New In',
    rating: 4.6,
    reviews: 154,
    stock: 60,
    description: 'Three go-to crewneck tees in rotating core colors. Pre-shrunk cotton blend keeps its fit through everyday wear and frequent washing.',
    specs: {
      'Material': '95% Cotton, 5% Elastane',
      'Fit': 'Regular Fit',
      'Pack Size': '3 Tees',
      'Care': 'Machine Wash Cold'
    }
  },
  {
    id: 3,
    name: 'Fringed Knit Poncho Sweater',
    price: 58,
    originalPrice: 72,
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Tops',
    tag: 'Handcrafted',
    rating: 4.7,
    reviews: 61,
    stock: 22,
    description: 'Hand-finished open-knit poncho sweater with a relaxed V-neck and fringe hem. Lightweight enough to layer, textured enough to wear alone.',
    specs: {
      'Material': 'Cotton-Acrylic Knit Blend',
      'Fit': 'Relaxed / One Size',
      'Length': 'Hip Length',
      'Care': 'Hand Wash Cold'
    }
  },
  {
    id: 4,
    name: 'Corduroy Long-Sleeve Shirt Dress',
    price: 89,
    originalPrice: 110,
    image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Tops',
    tag: 'New Arrival',
    rating: 4.9,
    reviews: 47,
    stock: 16,
    description: 'A fitted-waist shirt dress in brushed corduroy with a button placket and three-quarter sleeves. Transitions easily from desk to dinner.',
    specs: {
      'Material': '100% Cotton Corduroy',
      'Fit': 'Fitted Waist, A-Line Skirt',
      'Sizes': 'XS, S, M, L, XL',
      'Care': 'Machine Wash Cold'
    }
  },
  {
    id: 5,
    name: 'Off-Shoulder Ruffle Mini Dress',
    price: 42,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Tops',
    tag: 'Seasonal',
    rating: 4.5,
    reviews: 88,
    stock: 30,
    description: 'Breathable cotton-poplin off-shoulder mini dress with an elasticated ruffle neckline and tiered hem. Warm-weather staple with a flattering silhouette.',
    specs: {
      'Material': '100% Cotton Poplin',
      'Fit': 'Relaxed, Off-Shoulder',
      'Sizes': 'XS, S, M, L, XL',
      'Care': 'Machine Wash Cold'
    }
  },
  {
    id: 6,
    name: 'Pleated Mini Skirt',
    price: 48,
    originalPrice: 58,
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Bottoms',
    tag: 'Bestseller',
    rating: 4.7,
    reviews: 133,
    stock: 34,
    description: 'A box-pleated mini skirt in structured stretch twill with a concealed side zip. Pairs cleanly with tees, knits, or tucked-in shirts.',
    specs: {
      'Material': 'Stretch Twill (Poly-Viscose Blend)',
      'Fit': 'A-Line, Box Pleat',
      'Sizes': 'XS, S, M, L, XL',
      'Care': 'Dry Clean Recommended'
    }
  },
  {
    id: 7,
    name: 'High-Waist Jogger Pants',
    price: 52,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Bottoms',
    tag: 'New In',
    rating: 4.6,
    reviews: 72,
    stock: 40,
    description: 'Soft satin-twill joggers with a high elastic waistband, side pockets, and tapered elastic cuffs. Structured enough to dress up, soft enough for travel.',
    specs: {
      'Material': 'Satin Twill (Poly Blend)',
      'Fit': 'Tapered, High-Rise',
      'Sizes': 'XS, S, M, L, XL',
      'Care': 'Machine Wash Cold'
    }
  },
  {
    id: 8,
    name: 'Classic Skinny Fit Jeans',
    price: 68,
    originalPrice: 82,
    image: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Bottoms',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 241,
    stock: 45,
    description: 'Five-pocket skinny jeans in rigid mid-wash denim with a hint of stretch for all-day movement. A clean, everyday staple.',
    specs: {
      'Material': '98% Cotton, 2% Elastane Denim',
      'Fit': 'Skinny, Mid-Rise',
      'Sizes': '24-32 (Waist)',
      'Care': 'Machine Wash Cold, Inside Out'
    }
  },
  {
    id: 9,
    name: 'Relaxed Fit Sweatpants',
    price: 46,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Bottoms',
    tag: 'New Arrival',
    rating: 4.5,
    reviews: 58,
    stock: 38,
    description: 'Brushed-back fleece sweatpants with a drawstring waist and tapered leg. Everyday comfort with a clean, minimal silhouette.',
    specs: {
      'Material': '80% Cotton, 20% Polyester Fleece',
      'Fit': 'Relaxed, Tapered Leg',
      'Sizes': 'XS, S, M, L, XL, XXL',
      'Care': 'Machine Wash Cold'
    }
  },
  {
    id: 10,
    name: 'Faux Leather Biker Jacket',
    price: 148,
    originalPrice: 178,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Outerwear',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 97,
    stock: 18,
    description: 'A moto-inspired jacket in supple faux leather with an asymmetric zip front, snap lapels, and quilted shoulder panels. Fully lined for structure.',
    specs: {
      'Material': 'Faux Leather, Polyester Lining',
      'Fit': 'Fitted, Cropped',
      'Sizes': 'XS, S, M, L, XL',
      'Care': 'Wipe Clean / Spot Clean Only'
    }
  },
  {
    id: 11,
    name: 'Classic Denim Trucker Jacket',
    price: 96,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Outerwear',
    tag: 'New In',
    rating: 4.7,
    reviews: 112,
    stock: 24,
    description: 'A timeless button-front trucker jacket in rigid cotton denim with twin chest pockets and adjustable waist tabs. Built to fade and wear in beautifully.',
    specs: {
      'Material': '100% Cotton Denim',
      'Fit': 'Classic, Button Front',
      'Sizes': 'XS, S, M, L, XL',
      'Care': 'Machine Wash Cold'
    }
  },
  {
    id: 12,
    name: 'Oversized Utility Jacket',
    price: 118,
    originalPrice: 140,
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Outerwear',
    tag: 'New Arrival',
    rating: 4.6,
    reviews: 39,
    stock: 15,
    description: 'An oversized shirt-jacket in brushed twill with chest flap pockets and a dropped shoulder seam. Layers easily over knits and tees.',
    specs: {
      'Material': 'Cotton Twill',
      'Fit': 'Oversized',
      'Sizes': 'S, M, L, XL',
      'Care': 'Machine Wash Cold'
    }
  },
  {
    id: 13,
    name: 'Leather Lace-Up Combat Boots',
    price: 132,
    originalPrice: 155,
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Footwear',
    tag: 'Bestseller',
    rating: 4.8,
    reviews: 164,
    stock: 26,
    description: 'Full-grain leather combat boots with a cap toe, reinforced eyelets, and a durable lugged outsole built for daily wear.',
    specs: {
      'Material': 'Full-Grain Leather',
      'Outsole': 'Rubber Lug Sole',
      'Sizes': 'US 6 - US 12',
      'Care': 'Leather Conditioner Recommended'
    }
  },
  {
    id: 14,
    name: 'Tan Leather Work Boots',
    price: 145,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Footwear',
    tag: 'New In',
    rating: 4.7,
    reviews: 85,
    stock: 20,
    description: 'Rugged oiled-leather work boots with a cushioned footbed and shock-absorbing sole. Durable enough for daily wear, refined enough for everyday fits.',
    specs: {
      'Material': 'Oiled Full-Grain Leather',
      'Outsole': 'Shock-Absorbing Rubber',
      'Sizes': 'US 7 - US 13',
      'Care': 'Leather Conditioner Recommended'
    }
  },
  {
    id: 15,
    name: 'Chunky Colorblock Sneakers',
    price: 110,
    originalPrice: 130,
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Footwear',
    tag: 'New Arrival',
    rating: 4.6,
    reviews: 72,
    stock: 32,
    description: 'Statement low-top sneakers in a colorblocked suede-and-mesh upper with a chunky lugged midsole for all-day comfort.',
    specs: {
      'Material': 'Suede & Mesh Upper',
      'Outsole': 'Chunky EVA Midsole',
      'Sizes': 'US 6 - US 12',
      'Care': 'Wipe Clean'
    }
  },
  {
    id: 16,
    name: 'Floral Print Statement Heels',
    price: 95,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Footwear',
    tag: 'Seasonal',
    rating: 4.5,
    reviews: 54,
    stock: 18,
    description: 'Pointed-toe pumps in a hand-finished floral jacquard with a comfort-padded insole and a stable 90mm heel.',
    specs: {
      'Material': 'Jacquard Textile Upper',
      'Heel Height': '90mm',
      'Sizes': 'US 5 - US 10',
      'Care': 'Spot Clean Only'
    }
  },
  {
    id: 17,
    name: 'Round Metal-Frame Sunglasses',
    price: 38,
    originalPrice: 48,
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Accessories',
    tag: 'Bestseller',
    rating: 4.7,
    reviews: 198,
    stock: 50,
    description: 'Vintage-inspired round sunglasses in a lightweight gold-tone metal frame with polarized UV400 lenses.',
    specs: {
      'Frame': 'Gold-Tone Metal',
      'Lenses': 'Polarized UV400',
      'Fit': 'One Size',
      'Care': 'Microfiber Cloth Only'
    }
  },
  {
    id: 18,
    name: 'Everyday Canvas Backpack',
    price: 78,
    originalPrice: 95,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Accessories',
    tag: 'New In',
    rating: 4.8,
    reviews: 143,
    stock: 28,
    description: 'A durable canvas backpack with a padded 15-inch laptop sleeve, water-resistant coating, and adjustable ergonomic straps.',
    specs: {
      'Material': 'Water-Resistant Canvas',
      'Capacity': '20 Liters',
      'Laptop Sleeve': 'Up to 15 Inches',
      'Care': 'Spot Clean'
    }
  },
  {
    id: 19,
    name: 'Structured Canvas Tote Bag',
    price: 42,
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1400&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1400&auto=format&fit=crop'
    ],
    category: 'Accessories',
    tag: 'New Arrival',
    rating: 4.6,
    reviews: 76,
    stock: 35,
    description: 'A roomy structured tote in heavyweight cotton canvas with reinforced handles and an interior zip pocket. Everyday carry, built to last.',
    specs: {
      'Material': 'Heavyweight Cotton Canvas',
      'Capacity': '18 Liters',
      'Dimensions': '38cm x 34cm x 14cm',
      'Care': 'Spot Clean'
    }
  }
]

const checkCategoryMatch = (product, cat) => {
  if (!cat || cat === 'All') return true
  const catLower = cat.toLowerCase()
  const prodCatLower = (product.category || '').toLowerCase()

  if (catLower === 'new in') {
    const tagLower = (product.tag || '').toLowerCase()
    return tagLower.includes('new')
  }

  return prodCatLower === catLower
}

const categories = ['All', 'New In', 'Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories']

// Extracts a short, chip-friendly list of discrete sizes from a product's spec string.
// Ranges like "US 6 - US 12" or single labels like "One Size" are left as plain text instead.
const getSizeOptions = (product) => {
  const sizesStr = product?.specs?.Sizes
  if (!sizesStr) return null
  const parts = sizesStr.split(',').map(s => s.trim()).filter(Boolean)
  const looksSelectable = parts.length > 1 && parts.every(p => p.length <= 6)
  return looksSelectable ? parts : null
}

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
  const [quickViewSelectedSize, setQuickViewSelectedSize] = useState(null)
  const [toastMessage, setToastMessage] = useState(null)

  // Derived quick-view helpers
  const quickViewGallery = selectedProduct?.gallery?.length
    ? selectedProduct.gallery
    : (selectedProduct?.image ? [selectedProduct.image] : [])
  const quickViewSizeOptions = getSizeOptions(selectedProduct)

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
    setQuickViewSelectedSize(null)
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8">

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeQuickView}
              className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xl"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl lg:max-w-6xl max-h-[92vh] bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.4)] z-10 overflow-hidden flex flex-col md:flex-row"
            >
              {/* Close Button — floating frosted glass */}
              <button
                onClick={closeQuickView}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-md text-neutral-900 shadow-lg hover:bg-black hover:text-white transition-all duration-200"
              >
                <X size={18} strokeWidth={2.25} />
              </button>

              {/* Left: Imagery Gallery */}
              <div className="relative w-full md:w-[46%] lg:w-[48%] shrink-0 bg-neutral-100 flex flex-col">
                <div className="relative aspect-[4/5] md:aspect-auto md:flex-1 overflow-hidden group/image">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={quickViewImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      src={quickViewGallery[quickViewImageIndex]}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105"
                    />
                  </AnimatePresence>

                  {selectedProduct.tag && (
                    <span className="absolute top-4 left-4 bg-black/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                      {selectedProduct.tag}
                    </span>
                  )}

                  {/* Gallery nav arrows */}
                  {quickViewGallery.length > 1 && (
                    <>
                      <button
                        onClick={() => setQuickViewImageIndex(i => (i - 1 + quickViewGallery.length) % quickViewGallery.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-md text-black opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white shadow-md"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setQuickViewImageIndex(i => (i + 1) % quickViewGallery.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 backdrop-blur-md text-black opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-white shadow-md"
                      >
                        <ChevronRight size={18} />
                      </button>

                      {/* Dot indicators */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {quickViewGallery.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setQuickViewImageIndex(i)}
                            className={`h-1.5 rounded-full transition-all ${
                              quickViewImageIndex === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail rail (desktop) */}
                {quickViewGallery.length > 1 && (
                  <div className="hidden md:flex gap-2 p-4 bg-neutral-100">
                    {quickViewGallery.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setQuickViewImageIndex(i)}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden ring-2 transition-all shrink-0 ${
                          quickViewImageIndex === i ? 'ring-black' : 'ring-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`${selectedProduct.name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Info panel — scrolls independently, CTA stays pinned */}
              <div className="relative flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 pt-7 sm:pt-9 pb-4">

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-400">
                      {selectedProduct.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-neutral-900">{selectedProduct.rating}</span>
                      <span className="text-neutral-400">({selectedProduct.reviews})</span>
                    </div>
                  </div>

                  <h2 className="font-heading text-[26px] sm:text-3xl lg:text-[34px] leading-[1.1] font-bold tracking-tight text-neutral-950 mb-3">
                    {selectedProduct.name}
                  </h2>

                  <div className="flex items-baseline gap-3 mb-5">
                    <span className="font-heading text-2xl sm:text-[28px] font-extrabold text-neutral-950">
                      ${selectedProduct.price}
                    </span>
                    {selectedProduct.originalPrice && (
                      <>
                        <span className="text-sm text-neutral-400 line-through">
                          ${selectedProduct.originalPrice}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          Save ${(selectedProduct.originalPrice - selectedProduct.price).toFixed(0)}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                    {selectedProduct.description}
                  </p>

                  {/* Size selector */}
                  {quickViewSizeOptions && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-900">Select Size</span>
                        {quickViewSelectedSize && (
                          <span className="text-xs text-neutral-400">Size {quickViewSelectedSize}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickViewSizeOptions.map(size => (
                          <button
                            key={size}
                            onClick={() => setQuickViewSelectedSize(size)}
                            className={`min-w-[44px] h-11 px-3 rounded-xl text-xs font-semibold border transition-all ${
                              quickViewSelectedSize === size
                                ? 'bg-black text-white border-black shadow-sm'
                                : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock status with urgency bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5 text-neutral-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        In Stock
                      </span>
                      <span className="text-neutral-400">{selectedProduct.stock} left</span>
                    </div>
                    <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (selectedProduct.stock / 60) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Details & Care */}
                  {selectedProduct.specs && (
                    <div className="border-t border-neutral-100 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900 mb-3">Details &amp; Care</p>
                      <dl className="space-y-2.5">
                        {Object.entries(selectedProduct.specs).map(([label, val]) => (
                          <div key={label} className="flex items-start justify-between gap-4 text-xs">
                            <dt className="text-neutral-400 shrink-0">{label}</dt>
                            <dd className="text-neutral-900 font-medium text-right">{val}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>

                {/* Sticky Purchase Footer */}
                <div className="shrink-0 border-t border-neutral-100 bg-white/95 backdrop-blur-sm px-6 sm:px-8 lg:px-10 py-5 space-y-4">
                  <div className="flex gap-3">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-neutral-200 rounded-2xl">
                      <button
                        onClick={() => setQuickViewQuantity(q => Math.max(1, q - 1))}
                        className="p-3 text-neutral-500 hover:text-black transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">
                        {quickViewQuantity}
                      </span>
                      <button
                        onClick={() => setQuickViewQuantity(q => Math.min(selectedProduct.stock, q + 1))}
                        className="p-3 text-neutral-500 hover:text-black transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Add to Bag CTA */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleAddToCart(selectedProduct, quickViewQuantity)
                        closeQuickView()
                      }}
                      className="flex-1 bg-neutral-950 text-white py-3.5 px-5 rounded-2xl text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                    >
                      <ShoppingBag size={16} />
                      <span>Add to Bag · ${(selectedProduct.price * quickViewQuantity).toFixed(0)}</span>
                    </motion.button>

                    {/* Wishlist Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleWishlist(selectedProduct)}
                      className={`p-3.5 rounded-2xl border transition-colors ${
                        isItemInWishlist(selectedProduct.id)
                          ? 'bg-red-500 text-white border-red-500'
                          : 'border-neutral-200 text-neutral-900 hover:bg-neutral-50'
                      }`}
                      title="Save to Wishlist"
                    >
                      <Heart size={18} className={isItemInWishlist(selectedProduct.id) ? 'fill-white' : ''} />
                    </motion.button>
                  </div>

                  {/* Guarantees micro-bar */}
                  <div className="flex items-center justify-center gap-5 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1"><Truck size={12} /> Insured Courier</span>
                    <span className="flex items-center gap-1"><ShieldCheck size={12} /> Certified Authentic</span>
                    <span className="flex items-center gap-1"><RotateCcw size={12} /> 30-Day Returns</span>
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
