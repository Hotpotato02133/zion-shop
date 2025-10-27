import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Menu, 
  X, 
  ShoppingBag, 
  Heart, 
  Search,
  ChevronRight,
  Star,
  ArrowRight
} from 'lucide-react'

const products = [
  {
    id: 1,
    name: 'The Atelier Candle',
    price: '$58',
    originalPrice: '$78',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Home',
    rating: 4.8,
    reviews: 124
  },
  {
    id: 2,
    name: 'Handcrafted Leather Journal',
    price: '$120',
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Stationery',
    rating: 4.9,
    reviews: 89
  },
  {
    id: 3,
    name: 'Minimalist Timepiece',
    price: '$420',
    originalPrice: '$480',
    image: 'https://images.unsplash.com/photo-1523170335258-f5e6a7c0c1c4?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Accessories',
    rating: 4.7,
    reviews: 203
  },
  {
    id: 4,
    name: 'Porcelain Vase',
    price: '$85',
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Home',
    rating: 4.6,
    reviews: 67
  },
  {
    id: 5,
    name: 'Silk Scarf',
    price: '$210',
    originalPrice: '$250',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Fashion',
    rating: 4.8,
    reviews: 156
  },
  {
    id: 6,
    name: 'Ceramic Coffee Set',
    price: '$95',
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=8a9b7c6d5e4f3a2b1c0d',
    category: 'Home',
    rating: 4.9,
    reviews: 98
  }
]

const categories = ['All', 'Home', 'Fashion', 'Accessories', 'Stationery']

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [cartItems, setCartItems] = useState(0)
  const [wishlistItems, setWishlistItems] = useState(0)

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const cardHover = { 
    scale: 1.02, 
    boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
    transition: { duration: 0.3, ease: "easeOut" }
  }

  const handleAddToCart = () => {
    setCartItems(prev => prev + 1)
    // Here you would typically add to actual cart state
  }

  const handleAddToWishlist = () => {
    setWishlistItems(prev => prev + 1)
    // Here you would typically add to actual wishlist state
  }

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory)

  return (
    <div className="min-h-screen bg-white text-black font-body">
      {/* Navigation */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100"
      >
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="font-heading text-2xl font-bold tracking-tight"
            >
              Maison Noir
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#collections" className="text-sm font-medium hover:text-gray-600 transition-colors">
                Collections
              </a>
              <a href="#about" className="text-sm font-medium hover:text-gray-600 transition-colors">
                About
              </a>
              <a href="#contact" className="text-sm font-medium hover:text-gray-600 transition-colors">
                Contact
              </a>
              <div className="flex items-center space-x-4">
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Search size={18} />
                </button>
                <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Heart size={18} />
                  {wishlistItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistItems}
                    </span>
                  )}
                </button>
                <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ShoppingBag size={18} />
                  {cartItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItems}
                    </span>
                  )}
                </button>
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 py-4"
            >
              <div className="flex flex-col space-y-4">
                <a href="#collections" className="text-sm font-medium hover:text-gray-600 transition-colors">
                  Collections
                </a>
                <a href="#about" className="text-sm font-medium hover:text-gray-600 transition-colors">
                  About
                </a>
                <a href="#contact" className="text-sm font-medium hover:text-gray-600 transition-colors">
                  Contact
                </a>
                <div className="flex items-center space-x-4 pt-4">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Search size={18} />
                  </button>
                  <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Heart size={18} />
                    {wishlistItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlistItems}
                      </span>
                    )}
                  </button>
                  <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ShoppingBag size={18} />
                    {cartItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItems}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <div className="min-h-[80vh] lg:min-h-[90vh] xl:min-h-[95vh] w-full flex items-center">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1556228720-8af8a4b9f702?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=4b9d6b7a8c9e"
              alt="Luxury product showcase"
              className="w-full h-full object-cover grayscale opacity-20"
            />
          </div>
          
          <div className="relative z-10 w-full">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh] lg:min-h-[90vh] xl:min-h-[95vh]">
                {/* Content */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerChildren}
                  className="flex flex-col justify-center space-y-8"
                >
                  <motion.div variants={fadeInUp} className="space-y-6">
                    <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[0.9]">
                      Discover
                      <br />
                      <span className="text-gray-600">Timeless</span>
                      <br />
                      Elegance
                    </h1>
                    
                    <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 max-w-2xl leading-relaxed font-light">
                      Elevate your lifestyle with our curated luxury selection — handcrafted
                      objects designed for a lifetime of use and appreciation.
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    variants={fadeInUp}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-black text-white px-8 py-4 lg:px-10 lg:py-5 rounded-full text-sm lg:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
                    >
                      Explore Collection
                      <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="border-2 border-black text-black px-8 py-4 lg:px-10 lg:py-5 rounded-full text-sm lg:text-base font-semibold hover:bg-black hover:text-white transition-all duration-300"
                    >
                      Learn More
                    </motion.button>
                  </motion.div>
                </motion.div>

                {/* Visual Element */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="hidden lg:flex items-center justify-center"
                >
                  <div className="relative w-full max-w-lg">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl shadow-2xl flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-black rounded-full mx-auto flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">MN</span>
                        </div>
                        <p className="text-gray-600 font-medium">Maison Noir</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-gray-50">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-black text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section id="collections" className="py-20">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="font-heading text-4xl md:text-5xl font-bold mb-6"
            >
              Featured Collections
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-gray-600 max-w-3xl mx-auto"
            >
              Handpicked pieces that embody refined simplicity and lasting quality. 
              Each item tells a story of craftsmanship and timeless design.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8"
          >
            {filteredProducts.map((product) => (
              <motion.article
                key={product.id}
                variants={fadeInUp}
                whileHover={cardHover}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                  
                  {/* Quick actions */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleAddToWishlist}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <Heart size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleAddToCart}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ShoppingBag size={16} />
                    </motion.button>
                  </div>

                  {/* Sale badge */}
                  {product.originalPrice && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      Sale
                    </div>
                  )}
                </div>
                
                <div className="p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {product.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{product.rating}</span>
                      <span className="text-xs text-gray-400">({product.reviews})</span>
                    </div>
                  </div>
                  
                  <h3 className="font-heading text-lg lg:text-xl font-semibold mb-3 group-hover:text-gray-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold">{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors duration-300 flex items-center justify-center group/btn"
                  >
                    Add to Cart
                    <ChevronRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="font-heading text-4xl md:text-5xl font-bold mb-8">
                Craftsmanship & Story
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                We source materials thoughtfully and work with artisans who value restraint and
                intention. Each object is chosen to be useful, beautiful, and to last.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Our commitment to quality extends beyond the products themselves — it's about
                creating a connection between maker and user, tradition and innovation.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-black text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-300"
              >
                Our Story
              </motion.button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=8a9b7c6d5e4f3a2b1c0d"
                alt="Craftsmanship"
                className="rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section id="newsletter" className="py-20">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-black text-white rounded-3xl p-12 text-center"
          >
            <h4 className="font-heading text-3xl md:text-4xl font-bold mb-6">
              Join Our Circle
            </h4>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Be the first to discover new collections, exclusive offers, and stories from our artisans.
            </p>
            
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-6 py-4 rounded-full text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-300"
              >
                Subscribe
              </motion.button>
            </form>
            
            <p className="text-sm text-gray-400 mt-4">
              No spam, just beautiful things. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white">
        <div className="w-full px-[100px] xl:px-[120px] 2xl:px-[140px] py-16 lg:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="font-heading text-2xl font-bold mb-6">Maison Noir</div>
              <p className="text-gray-300 mb-8 max-w-sm leading-relaxed">
                Refined objects for a considered life. We believe in the power of beautiful, 
                functional design that stands the test of time.
              </p>
              <div className="flex space-x-4">
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </motion.a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="font-semibold mb-6 text-lg">Quick Links</h5>
              <div className="space-y-4">
                <a href="#collections" className="block text-gray-300 hover:text-white transition-colors">
                  Collections
                </a>
                <a href="#about" className="block text-gray-300 hover:text-white transition-colors">
                  About
                </a>
                <a href="#contact" className="block text-gray-300 hover:text-white transition-colors">
                  Contact
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>

            {/* Support */}
            <div>
              <h5 className="font-semibold mb-6 text-lg">Support</h5>
              <div className="space-y-4">
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  Shipping Info
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  Returns
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  Size Guide
                </a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors">
                  FAQ
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h5 className="font-semibold mb-6 text-lg">Stay Updated</h5>
              <p className="text-gray-300 mb-4 text-sm">
                Get the latest updates on new collections and exclusive offers.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 lg:mt-16 pt-8 lg:pt-12">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                &copy; 2024 Maison Noir. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}