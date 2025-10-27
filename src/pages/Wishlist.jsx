import React from 'react'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'

const Wishlist = () => {
  const { wishlist, removeFromWishlist, moveToCart, addToCart, clearWishlist } = useApp()

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

  const removeFromWishlistHandler = (productId) => {
    removeFromWishlist(productId)
  }

  const moveToCartHandler = (product) => {
    moveToCart(product)
  }

  const addToCartHandler = (product) => {
    addToCart(product)
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen py-8">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="text-center py-20"
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <Heart size={64} className="mx-auto text-gray-300 mb-4" />
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
                Your Wishlist is Empty
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Save items you love by adding them to your wishlist. 
                They'll be waiting for you here!
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <a
                href="/products"
                className="inline-block bg-black text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-300"
              >
                Start Shopping
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

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
            Wishlist
          </motion.h1>
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-gray-600"
          >
            Your saved items ({wishlist.length})
          </motion.p>
        </motion.div>

        {/* Wishlist Items */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
        >
          {wishlist.map((item) => (
            <motion.article
              key={item.productId}
              variants={fadeInUp}
              whileHover={cardHover}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                
                {/* Quick actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFromWishlistHandler(item.productId)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>

                {/* Sale badge */}
                {item.originalPrice && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Sale
                  </div>
                )}
              </div>
              
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Heart size={14} className="fill-red-500 text-red-500" />
                    <span className="text-sm text-gray-600">{item.rating}</span>
                    <span className="text-xs text-gray-400">({item.reviews})</span>
                  </div>
                </div>
                
                <h3 className="font-heading text-lg lg:text-xl font-semibold mb-3 group-hover:text-gray-600 transition-colors line-clamp-2">
                  {item.name}
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold">{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {item.originalPrice}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => moveToCartHandler(item)}
                    className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors duration-300 flex items-center justify-center group"
                  >
                    Move to Cart
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCartHandler(item)}
                    className="px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-300"
                  >
                    <ShoppingBag size={16} />
                  </motion.button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-black text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-300"
          >
            Move All to Cart
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => clearWishlist()}
            className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-50 transition-colors duration-300"
          >
            Clear Wishlist
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default Wishlist
