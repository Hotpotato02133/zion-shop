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
      <footer className="w-full bg-neutral-950 text-white relative overflow-hidden">
        {/* Subtle ambient texture, consistent with hero/newsletter */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.04] pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-14 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-12">

            {/* Brand Manifesto */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-heading text-2xl font-bold tracking-tight text-white">
                  ZION
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                  Atelier
                </span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mb-6">
                An international atelier dedicated to understated luxury, architectural permanence, and handcrafted materials sourced across Biella, Florence, and Tokyo.
              </p>
              <div className="flex items-center gap-2.5 text-xs text-neutral-400 mb-6">
                <ShieldCheck size={16} className="text-white" />
                <span>Verified Official Atelier Store • 256-Bit SSL Protection</span>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {[Instagram, Twitter, Facebook, Youtube].map((Icon, idx) => (
                  <a
                    key={idx}
                    href="#"
                    aria-label="Social link"
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white hover:text-black text-neutral-300 flex items-center justify-center transition-colors"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Catalog Links */}
            <div>
              <h5 className="font-semibold text-xs uppercase tracking-widest text-neutral-300 mb-5">
                The Collections
              </h5>
              <div className="space-y-3 text-xs font-medium">
                <Link to="/products?category=Outerwear" className="block text-neutral-400 hover:text-white transition-colors">
                  Outerwear & Coats
                </Link>
                <Link to="/products?category=Tailoring" className="block text-neutral-400 hover:text-white transition-colors">
                  Structured Tailoring
                </Link>
                <Link to="/products?category=Footwear" className="block text-neutral-400 hover:text-white transition-colors">
                  Monolith Footwear
                </Link>
                <Link to="/products?category=Accessories" className="block text-neutral-400 hover:text-white transition-colors">
                  Fine Accessories
                </Link>
                <Link to="/products" className="block text-neutral-400 hover:text-white transition-colors">
                  View Full Catalog (12)
                </Link>
              </div>
            </div>

            {/* Client Services */}
            <div>
              <h5 className="font-semibold text-xs uppercase tracking-widest text-neutral-300 mb-5">
                Client Concierge
              </h5>
              <div className="space-y-3 text-xs font-medium">
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

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-12 lg:mt-14 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
            <p>
              &copy; 2026 ZION Atelier International Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="#terms" className="hover:text-neutral-300 transition-colors">
                Terms of Atelier
              </a>
              <a href="#privacy" className="hover:text-neutral-300 transition-colors">
                Privacy Code
              </a>
              <a href="#cookies" className="hover:text-neutral-300 transition-colors">
                Cookie Preferences
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="back-to-top"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 16 }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            aria-label="Scroll back to top"
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 p-3 sm:p-3.5 rounded-full bg-neutral-950/90 hover:bg-black text-white shadow-2xl border border-neutral-700/60 hover:border-neutral-400 backdrop-blur-md group transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 flex items-center justify-center cursor-pointer"
          >
            <ArrowUp
              size={18}
              strokeWidth={2.5}
              className="text-white transition-transform duration-300 group-hover:-translate-y-0.5"
            />
            <span className="sr-only">Scroll back to top</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Layout
