import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp,
  ShieldCheck,
  Instagram,
  Twitter,
  Facebook,
  Youtube
} from 'lucide-react'
import Navbar from './Navbar'

const Layout = ({ children }) => {
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Track scroll position to show floating back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 font-body flex flex-col justify-between selection:bg-black selection:text-white overflow-x-clip">
      {/* Specialized E-Commerce Luxury Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Luxury Atelier Footer */}
      <footer className="w-full bg-neutral-950 text-white relative overflow-hidden flex flex-col justify-between">
        <div className="relative z-10 w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-16 lg:pt-20 pb-8 sm:pb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12">

            {/* Brand Manifesto */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-heading text-2xl font-semibold tracking-tight text-white">
                  ZION
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium">
                  Atelier
                </span>
              </div>
              <p className="text-neutral-300 text-base leading-relaxed max-w-sm mb-6">
                An international atelier dedicated to understated luxury, architectural permanence, and handcrafted materials sourced across Biella, Florence, and Tokyo.
              </p>
              <div className="flex items-center gap-2.5 text-sm text-neutral-400 mb-6">
                <ShieldCheck size={16} className="text-white" />
                <span>Verified Official Atelier Store • 256-Bit SSL Protection</span>
              </div>

              {/* Social Links */}
              <div data-ui className="flex items-center gap-3">
                {[Instagram, Twitter, Facebook, Youtube].map((Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    aria-label="Social link"
                    className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-white hover:text-black text-neutral-300 flex items-center justify-center transition-colors"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Catalog Links */}
            <div>
              <h4 className="font-semibold text-sm text-white mb-4">
                The Collections
              </h4>
              <div className="space-y-3 text-sm font-medium">
                <Link to="/products?category=Tops" className="block text-neutral-400 hover:text-white transition-colors">
                  Tops & Dresses
                </Link>
                <Link to="/products?category=Bottoms" className="block text-neutral-400 hover:text-white transition-colors">
                  Bottoms & Denim
                </Link>
                <Link to="/products?category=Outerwear" className="block text-neutral-400 hover:text-white transition-colors">
                  Outerwear & Jackets
                </Link>
                <Link to="/products?category=Footwear" className="block text-neutral-400 hover:text-white transition-colors">
                  Footwear
                </Link>
                <Link to="/products?category=Accessories" className="block text-neutral-400 hover:text-white transition-colors">
                  Accessories
                </Link>
                <Link to="/products" className="block text-neutral-400 hover:text-white transition-colors">
                  View Full Catalog (19)
                </Link>
              </div>
            </div>

            {/* Client Services */}
            <div>
              <h4 className="font-semibold text-sm text-white mb-4">
                Client Concierge
              </h4>
              <div className="space-y-3 text-sm font-medium">
                <Link to="/wishlist" className="block text-neutral-400 hover:text-white transition-colors">
                  Private Reserve / Wishlist
                </Link>
                <Link to="/cart" className="block text-neutral-400 hover:text-white transition-colors">
                  Shopping Bag & Checkout
                </Link>
                <Link to="/login" className="block text-neutral-400 hover:text-white transition-colors">
                  Member Portal & Tracking
                </Link>
                <a href="#concierge" className="block text-neutral-400 hover:text-white transition-colors">
                  Bespoke Sizing Consultation
                </a>
                <a href="#returns" className="block text-neutral-400 hover:text-white transition-colors">
                  Complimentary 30-Day Returns
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar (Legal & Atelier Verification) */}
          <div data-ui className="mt-12 sm:mt-16 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
            <p>
              &copy; 2026 ZION Atelier International Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="#terms" className="hover:text-white transition-colors">
                Terms of Atelier
              </a>
              <a href="#privacy" className="hover:text-white transition-colors">
                Privacy Code
              </a>
              <a href="#cookies" className="hover:text-white transition-colors">
                Cookie Preferences
              </a>
            </div>
          </div>
        </div>

        {/* Submerged 50% Monumental Brandmark Bedrock (Modern Luxury Footer Trend) */}
        <div className="w-full overflow-hidden select-none pointer-events-none mt-auto">
          <div className="w-full flex justify-center items-start overflow-hidden h-[11.5vw] sm:h-[12vw] md:h-[12.5vw] 2xl:h-[13vw] leading-none">
            <span
              aria-hidden="true"
              className="font-heading font-black text-[25vw] tracking-tighter text-neutral-800 leading-[0.75] block text-center uppercase select-none transform translate-y-[-2%]"
            >
              ZION
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="back-to-top"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            aria-label="Scroll back to top"
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 p-3 sm:p-3.5 rounded-full bg-neutral-900 hover:bg-black text-white border border-neutral-700 transition-colors flex items-center justify-center cursor-pointer"
          >
            <ArrowUp
              size={18}
              strokeWidth={2.5}
              className="text-white"
            />
            <span className="sr-only">Scroll back to top</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Layout
