import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Search, Filter, Heart, ShoppingBag } from 'lucide-react'
import { useApp } from '../context/AppContext'

// Mock products data
const products = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    price: '$299',
    originalPrice: '$399',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Electronics',
    rating: 4.8,
    reviews: 124
  },
  {
    id: 2,
    name: 'Minimalist Watch',
    price: '$199',
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1523170335258-f5e6a7c0c1c4?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Accessories',
    rating: 4.9,
    reviews: 89
  },
  {
    id: 3,
    name: 'Designer Backpack',
    price: '$159',
    originalPrice: '$199',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Fashion',
    rating: 4.7,
    reviews: 203
  },
  {
    id: 4,
    name: 'Smart Home Speaker',
    price: '$129',
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Electronics',
    rating: 4.6,
    reviews: 67
  },
  {
    id: 5,
    name: 'Luxury Sunglasses',
    price: '$249',
    originalPrice: '$299',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Accessories',
    rating: 4.8,
    reviews: 156
  },
  {
    id: 6,
    name: 'Premium Coffee Maker',
    price: '$189',
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=8a9b7c6d5e4f3a2b1c0d',
    category: 'Home',
    rating: 4.9,
    reviews: 98
  },
  {
    id: 7,
    name: 'Wireless Charging Pad',
    price: '$79',
    originalPrice: '$99',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Electronics',
    rating: 4.5,
    reviews: 87
  },
  {
    id: 8,
    name: 'Leather Wallet',
    price: '$89',
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    category: 'Accessories',
    rating: 4.7,
    reviews: 134
  }
]

const categories = ['All', 'Electronics', 'Accessories', 'Fashion', 'Home']

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('name')
  const { addToCart, addToWishlist } = useApp()

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

  // Filter and search products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''))
      case 'price-high':
        return parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', ''))
      case 'rating':
        return b.rating - a.rating
      default:
        return a.name.localeCompare(b.name)
    }
  })


  return (
    <div className="min-h-screen py-8">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="mb-12"
        >
          <motion.h1 
            variants={fadeInUp}
            className="font-heading text-4xl md:text-5xl font-bold mb-6"
          >
            Products
          </motion.h1>
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-gray-600 max-w-3xl"
          >
            Discover our complete collection of premium products designed to enhance your lifestyle.
          </motion.p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
        >
          {sortedProducts.map((product) => (
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
                    onClick={() => addToWishlist(product)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <Heart size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addToCart(product)}
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
                
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)}
                    className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors duration-300"
                  >
                    Add to Cart
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToWishlist(product)}
                    className="px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-300"
                  >
                    ♡
                  </motion.button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* No Results */}
        {sortedProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </motion.div>
        )}

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-12 text-gray-600"
        >
          Showing {sortedProducts.length} of {products.length} products
        </motion.div>
      </div>
    </div>
  )
}

export default Products
