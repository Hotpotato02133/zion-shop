import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ShoppingBag, 
  Heart, 
  Menu, 
  X,
  Search
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { cartCount, wishlistCount } = useApp()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Products' },
    { path: '/wishlist', label: 'Wishlist' },
    { path: '/cart', label: 'Cart' }
  ]

  const authItems = [
    { path: '/login', label: 'Login' },
    { path: '/signup', label: 'Signup' }
  ]

  const isActive = (path) => location.pathname === path

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
            <Link to="/" className="flex items-center">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="font-heading text-2xl font-bold tracking-tight text-black"
              >
                Zion
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors relative ${
                    isActive(item.path)
                      ? 'text-black'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {item.label}
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black"
                    />
                  )}
                </Link>
              ))}
              
              <div className="flex items-center space-x-4 ml-6">
                {authItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-black'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Search size={18} />
                </button>
                <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Heart size={18} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ShoppingBag size={18} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
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
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-black font-semibold'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-gray-200 pt-4">
                  {authItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'text-black font-semibold'
                          : 'text-gray-600 hover:text-black'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="flex items-center space-x-4 pt-4">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Search size={18} />
                  </button>
                  <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Heart size={18} />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ShoppingBag size={18} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white mt-20">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px] py-16 lg:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="font-heading text-2xl font-bold mb-6">Zion</div>
              <p className="text-gray-300 mb-8 max-w-sm leading-relaxed">
                Discover premium products that elevate your lifestyle. 
                Quality, style, and innovation in every purchase.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="font-semibold mb-6 text-lg">Quick Links</h5>
              <div className="space-y-4">
                <Link to="/" className="block text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
                <Link to="/products" className="block text-gray-300 hover:text-white transition-colors">
                  Products
                </Link>
                <Link to="/wishlist" className="block text-gray-300 hover:text-white transition-colors">
                  Wishlist
                </Link>
                <Link to="/cart" className="block text-gray-300 hover:text-white transition-colors">
                  Cart
                </Link>
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
                Get the latest updates on new products and exclusive offers.
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
                &copy; 2024 Zion. All rights reserved.
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

export default Layout
