import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Star } from 'lucide-react'

const AUTOPLAY_MS = 6500

const heroSlides = [
  {
    id: 1,
    badge: 'Edition 2025 • Zion Apparel',
    title: 'Refined Basics.',
    titleAccent: 'Everyday Wear.',
    description:
      'Zion curates considered apparel, footwear, and accessories built from honest materials for a lifetime of everyday wear.',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1800&auto=format&fit=crop',
    ctaPrimary: { label: 'Explore Products', to: '/products' },
    ctaSecondary: { label: 'Curated Categories', href: '#collections' },
    spotlight: {
      tag: 'Spotlight Piece',
      collection: 'Core Collection',
      name: 'Classic Crewneck T-Shirt',
      price: 28,
      rating: 4.8,
      reviews: 326
    }
  },
  {
    id: 2,
    badge: 'Denim & Bottoms',
    title: 'Cut For',
    titleAccent: 'Movement.',
    description:
      'Five-pocket denim and tailored bottoms engineered with a hint of stretch — built to move with you, not against you.',
    image:
      'https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1800&auto=format&fit=crop',
    ctaPrimary: { label: 'Shop Bottoms', to: '/products?category=Bottoms' },
    ctaSecondary: { label: 'Curated Categories', href: '#collections' },
    spotlight: {
      tag: 'Bestseller',
      collection: 'Denim Edit',
      name: 'Classic Skinny Fit Jeans',
      price: 68,
      rating: 4.8,
      reviews: 241
    }
  },
  {
    id: 3,
    badge: 'Outerwear Edit',
    title: 'Layer',
    titleAccent: 'With Character.',
    description:
      'Jackets built to fade, wear in, and layer cleanly over every tee and knit — from denim trucker to faux leather biker.',
    image:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1800&auto=format&fit=crop',
    ctaPrimary: { label: 'Shop Outerwear', to: '/products?category=Outerwear' },
    ctaSecondary: { label: 'Curated Categories', href: '#collections' },
    spotlight: {
      tag: 'Handcrafted',
      collection: 'Outerwear Edit',
      name: 'Faux Leather Biker Jacket',
      price: 148,
      rating: 4.8,
      reviews: 97
    }
  },
  {
    id: 4,
    badge: 'Footwear & Accessories',
    title: 'Finish The',
    titleAccent: 'Fit.',
    description:
      'Leather boots, everyday sneakers, and finishing accessories designed to complete every look, season after season.',
    image:
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1800&auto=format&fit=crop',
    ctaPrimary: { label: 'Shop Footwear', to: '/products?category=Footwear' },
    ctaSecondary: { label: 'Curated Categories', href: '#collections' },
    spotlight: {
      tag: 'Bestseller',
      collection: 'Footwear Edit',
      name: 'Leather Lace-Up Combat Boots',
      price: 132,
      rating: 4.8,
      reviews: 164
    }
  }
]

const contentVariants = {
  enter: (direction) => ({ opacity: 0, x: direction > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -24 : 24,
    transition: { duration: 0.3, ease: 'easeIn' }
  })
}

const HeroCarousel = () => {
  const [[slide, direction], setSlideState] = useState([0, 1])
  const [isPaused, setIsPaused] = useState(false)
  const total = heroSlides.length
  const timerRef = useRef(null)

  const goTo = useCallback((nextIndex, dir) => {
    setSlideState(([current]) => {
      const normalized = (nextIndex + total) % total
      return [normalized, dir ?? (normalized > current ? 1 : -1)]
    })
  }, [total])

  const next = useCallback(() => goTo(slide + 1, 1), [goTo, slide])
  const prev = useCallback(() => goTo(slide - 1, -1), [goTo, slide])

  useEffect(() => {
    if (isPaused) return undefined
    timerRef.current = setInterval(() => {
      setSlideState(([current]) => [(current + 1) % total, 1])
    }, AUTOPLAY_MS)
    return () => clearInterval(timerRef.current)
  }, [isPaused, slide, total])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [next, prev])

  const active = heroSlides[slide]

  return (
    <section
      className="relative w-full min-h-[90vh] lg:min-h-[94vh] bg-black overflow-hidden group"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background slides (Ken Burns crossfade) */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={active.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) next()
              else if (info.offset.x > 80) prev()
            }}
          >
            <motion.img
              src={active.image}
              alt={active.title + ' ' + active.titleAccent}
              className="w-full h-full object-cover"
              initial={{ scale: 1.04 }}
              animate={{ scale: 1.12 }}
              transition={{ duration: AUTOPLAY_MS / 1000 + 1, ease: 'linear' }}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Contrast gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20 lg:to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
        {/* Brand texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />
      </div>

      {/* Slide counter */}
      <div className="absolute top-6 right-4 sm:right-6 md:right-8 lg:right-12 z-20 flex items-center gap-2 text-white/70 text-xs font-semibold tracking-widest">
        <span className="text-white">{String(slide + 1).padStart(2, '0')}</span>
        <span className="w-6 h-px bg-white/30" />
        <span>{String(total).padStart(2, '0')}</span>
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all duration-300"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all duration-300"
      >
        <ChevronRight size={20} />
      </button>

      {/* Content */}
      <div className="relative z-10 w-full h-full min-h-[90vh] lg:min-h-[94vh] flex items-end lg:items-center pointer-events-none">
        <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-28 sm:pb-32 lg:pb-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={active.id}
              custom={direction}
              variants={contentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="max-w-xl lg:max-w-2xl space-y-6 lg:space-y-8 pointer-events-auto"
              aria-live="polite"
            >
              <span className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-semibold tracking-wider uppercase text-white">
                  {active.badge}
                </span>
              </span>

              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[0.95] text-white">
                {active.title}
                <br />
                <span className="text-white/60 font-light italic">{active.titleAccent}</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-lg leading-relaxed font-light">
                {active.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link to={active.ctaPrimary.to}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 group/btn"
                  >
                    <span>{active.ctaPrimary.label}</span>
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>

                <a href={active.ctaSecondary.href}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto bg-transparent text-white border-2 border-white/40 hover:border-white px-8 py-4 rounded-full text-base font-semibold transition-all duration-300 flex items-center justify-center"
                  >
                    {active.ctaSecondary.label}
                  </motion.button>
                </a>
              </div>

              <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <div className="font-heading text-xl lg:text-2xl font-bold text-white">100%</div>
                  <div className="text-[11px] text-white/60 uppercase tracking-wider mt-0.5">Artisanal Sourced</div>
                </div>
                <div>
                  <div className="font-heading text-xl lg:text-2xl font-bold text-white">4.9★</div>
                  <div className="text-[11px] text-white/60 uppercase tracking-wider mt-0.5">TrustPilot Score</div>
                </div>
                <div>
                  <div className="font-heading text-xl lg:text-2xl font-bold text-white">48h</div>
                  <div className="text-[11px] text-white/60 uppercase tracking-wider mt-0.5">Global Dispatch</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating spotlight card */}
      <div className="hidden lg:block absolute bottom-10 right-10 xl:right-16 z-20 w-72">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="bg-white/95 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {active.spotlight.tag}
              </span>
              <div className="flex items-center gap-1 text-yellow-500 text-xs">
                <Star size={12} className="fill-yellow-500" />
                <span>{active.spotlight.rating} ({active.spotlight.reviews}+)</span>
              </div>
            </div>
            <h3 className="font-heading text-base font-bold text-black leading-tight">
              {active.spotlight.name}
            </h3>
            <div className="flex items-center justify-between pt-1">
              <span className="text-lg font-bold text-black">${active.spotlight.price}</span>
              <Link to={active.ctaPrimary.to}>
                <button className="bg-black text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5">
                  <span>View Item</span>
                  <ArrowUpRight size={14} />
                </button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {heroSlides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={idx === slide}
            className="relative h-1.5 rounded-full bg-white/25 overflow-hidden transition-all duration-300"
            style={{ width: idx === slide ? 40 : 18 }}
          >
            {idx === slide && !isPaused && (
              <motion.span
                key={`${active.id}-progress`}
                className="absolute inset-y-0 left-0 bg-white rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
              />
            )}
            {idx === slide && isPaused && (
              <span className="absolute inset-0 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

export default HeroCarousel
