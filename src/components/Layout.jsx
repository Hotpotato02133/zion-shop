import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react'
import Navbar from './Navbar'

const Layout = ({ children }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterToast, setNewsletterToast] = useState(false)

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (!newsletterEmail) return
    setNewsletterToast(true)
    setNewsletterEmail('')
    setTimeout(() => {
      setNewsletterToast(false)
    }, 3500)
  }

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 font-body flex flex-col justify-between selection:bg-black selection:text-white overflow-x-hidden">
      {/* Specialized E-Commerce Luxury Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Luxury Atelier Footer */}
      <footer className="w-full bg-neutral-950 text-white mt-24 border-t border-neutral-900">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
            
            {/* Brand Manifesto */}
            <div className="lg:col-span-2">
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
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Verified Official Atelier Store • 256-Bit SSL Protection</span>
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

            {/* Private Circle Newsletter */}
            <div>
              <h5 className="font-semibold text-xs uppercase tracking-widest text-neutral-300 mb-5 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" />
                The Private Circle
              </h5>
              <p className="text-neutral-400 text-xs mb-4 leading-relaxed">
                Receive private salon invitations, lookbooks, and early access to limited seasonal capsule drops.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="client@atelier-zion.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-xs focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-white text-black py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 group"
                >
                  <span>Request Invitation</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-neutral-900 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
            <p>
              &copy; 2026 ZION Atelier International Inc. All rights reserved.
            </p>
            <div className="flex space-x-6">
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

      {/* Newsletter Success Toast */}
      <AnimatePresence>
        {newsletterToast && (
          <motion.aside
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-medium border border-neutral-800"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Check size={14} className="text-white" />
            </div>
            <span>Invitation confirmed. Welcome to the Zion Private Circle.</span>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Layout
