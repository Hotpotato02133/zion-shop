import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const CHAPTERS = [
  {
    id: 'volume',
    category: 'Silhouette Study',
    title: 'Structure in Motion',
    subtitle: 'Generous drape, dropped shoulders, and architectural line.',
    description: 'Cut with subtle fullness through the chest and armholes, allowing fluid movement while retaining a clean, authoritative silhouette.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1400&auto=format&fit=crop',
    link: '/products?category=Outerwear',
    linkText: 'Explore Tailored Outerwear'
  },
  {
    id: 'textile',
    category: 'Material Provenance',
    title: 'The Tactile Edge',
    subtitle: 'Shuttle-loom selvedge and high-twist raw fibers.',
    description: 'Woven slowly on vintage Toyoda looms in Ibara, Okayama. The natural surface chatter creates a patina that matures with each season of wear.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1400&auto=format&fit=crop',
    link: '/products?category=Bottoms',
    linkText: 'Explore Raw Denim'
  },
  {
    id: 'restraint',
    category: 'Atelier Philosophy',
    title: 'Form Without Noise',
    subtitle: 'Zero exterior branding. Architectural purity.',
    description: 'Concealed button plackets, bonded seam allowances, and hand-turned collar points. Luxury felt in the weight and hand, never announced.',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1400&auto=format&fit=crop',
    link: '/products',
    linkText: 'Explore The Full Archive'
  }
]

export default function ScrollLookbook() {
  const containerRef = useRef(null)
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)

  return (
    <section 
      ref={containerRef}
      className="w-full py-20 lg:py-28 bg-white text-neutral-900 relative"
    >
      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
              Chapters of Form
            </h2>
            <p className="text-base text-neutral-600 max-w-xl leading-relaxed">
              An ongoing visual study of silhouette, raw material integrity, and everyday elegance.
            </p>
          </div>

          {/* Chapter Quick Switcher */}
          <div data-ui className="flex items-center gap-2">
            {CHAPTERS.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => setActiveChapterIndex(idx)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeChapterIndex === idx
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
                aria-label={`View ${ch.category}`}
              >
                <span>{ch.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cinematic Lookbook Frame Stage */}
        <div className="relative rounded-3xl overflow-hidden bg-neutral-950 text-white min-h-[500px] sm:min-h-[560px] lg:min-h-[600px] flex flex-col justify-end">
          
          {/* Background Images with Crossfade */}
          {CHAPTERS.map((chapter, idx) => (
            <motion.div
              key={chapter.id}
              initial={false}
              animate={{
                opacity: activeChapterIndex === idx ? 1 : 0,
                scale: activeChapterIndex === idx ? 1 : 1.05
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 z-0 pointer-events-none"
            >
              <img
                src={chapter.image}
                alt={chapter.title}
                className="w-full h-full object-cover object-center opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
            </motion.div>
          ))}

          {/* Foreground Editorial Plate Content */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-2xl space-y-4">
            <h3 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight">
              {CHAPTERS[activeChapterIndex].title}
            </h3>

            <p className="text-base sm:text-lg text-neutral-200 font-light leading-relaxed">
              <span className="font-medium text-white mr-2">{CHAPTERS[activeChapterIndex].category} —</span>
              {CHAPTERS[activeChapterIndex].description}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link to={CHAPTERS[activeChapterIndex].link}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white text-black px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-neutral-100 transition-colors flex items-center gap-2 group"
                >
                  <span>{CHAPTERS[activeChapterIndex].linkText}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

              <button
                onClick={() => setActiveChapterIndex((activeChapterIndex + 1) % CHAPTERS.length)}
                className="text-neutral-300 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors px-2 py-1"
              >
                <span>Next Study</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Bottom Right Dot Indicators */}
          <div data-ui className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 z-10 hidden sm:flex items-center gap-2">
            {CHAPTERS.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setActiveChapterIndex(dotIdx)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  activeChapterIndex === dotIdx ? 'bg-white' : 'bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  )
}
