import React from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart } = useApp()

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

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    updateCartQuantity(productId, newQuantity)
  }

  const removeItem = (productId) => {
    removeFromCart(productId)
  }

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.08 // 8% tax
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleCheckout = () => {
    console.log('Proceeding to checkout...')
    // TODO: Implement checkout functionality
  }

  if (cart.length === 0) {
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
              <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
              <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">
                Your Cart is Empty
              </h1>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Looks like you haven't added any items to your cart yet. 
                Start shopping to fill it up!
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
            Shopping Cart
          </motion.h1>
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-gray-600"
          >
            Review your items and proceed to checkout.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerChildren}
              className="space-y-6"
            >
              {cart.map((item) => (
                <motion.div
                  key={item.productId}
                  variants={fadeInUp}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-lg font-semibold mb-2 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-lg font-bold text-gray-900 mb-4">
                        ${item.price}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={16} />
                          </motion.button>
                          <span className="px-4 py-2 font-medium">{item.quantity}</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={16} />
                          </motion.button>
                        </div>

                        <div className="text-lg font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItem(item.productId)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24"
            >
              <h2 className="font-heading text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                className="w-full bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors duration-300 flex items-center justify-center group"
              >
                Proceed to Checkout
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Secure checkout powered by our payment partners
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
