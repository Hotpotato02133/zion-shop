import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { useApp } from '../context/AppContext'

// Mock featured products data
const featuredProducts = [
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
  }
]

const Home = () => {
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        <div className="min-h-[80vh] lg:min-h-[90vh] xl:min-h-[95vh] w-full flex items-center">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=8a9b7c6d5e4f3a2b1c0d"
              alt="Zion store showcase"
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
                      Welcome to
                      <br />
                      <span className="text-gray-600">Zion</span>
                    </h1>
                    
                    <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 max-w-2xl leading-relaxed font-light">
                      Discover premium products that elevate your lifestyle. 
                      Quality, style, and innovation in every purchase.
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    variants={fadeInUp}
                    className="flex flex-col sm:flex-row gap-4 sm:gap-6"
                  >
                    <Link to="/products">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-black text-white px-8 py-4 lg:px-10 lg:py-5 rounded-full text-sm lg:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
                      >
                        Shop Now
                        <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </Link>
                    
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
                          <span className="text-white text-2xl font-bold">Z</span>
                        </div>
                        <p className="text-gray-600 font-medium">Zion</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
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
              Featured Products
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-gray-600 max-w-3xl mx-auto"
            >
              Discover our handpicked selection of premium products that combine 
              quality, style, and innovation.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
          >
            {featuredProducts.map((product) => (
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

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mt-12"
          >
            <Link to="/products">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-black text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-300"
              >
                View All Products
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
