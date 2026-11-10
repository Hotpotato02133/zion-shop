// src/services/aiService.js
import axios from 'axios'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

export const isAiConfigured = Boolean(
  GEMINI_API_KEY &&
  !GEMINI_API_KEY.includes('your_free_google_ai_studio_key') &&
  !GEMINI_API_KEY.includes('your-free-google-ai-studio-key')
)

// In-memory rate-limit window fallback (protects 15 RPM quota even before SQL migration is run)
const memoryRateWindow = new Map()

// Curated fallback catalog mirroring `supabase_schema.sql` (used when pgvector embeddings are not seeded yet)
export const FALLBACK_ATELIER_CATALOG = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Classic Crewneck T-Shirt',
    price: 28,
    original_price: 35,
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1400&auto=format&fit=crop',
    category: 'Tops',
    tag: 'Bestseller',
    rating: 4.8,
    reviews_count: 326,
    stock: 48,
    description: 'A wardrobe essential cut from heavyweight combed cotton jersey for a clean drape that holds its shape wash after wash. Reinforced collar seam and double-stitched hem.',
    specs: { Material: '100% Combed Cotton Jersey', Fit: 'Regular Fit', Sizes: 'XS, S, M, L, XL, XXL', Care: 'Machine Wash Cold' }
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Essential Tee 3-Pack',
    price: 45,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?q=80&w=1400&auto=format&fit=crop',
    category: 'Tops',
    tag: 'New In',
    rating: 4.6,
    reviews_count: 154,
    stock: 60,
    description: 'Three go-to crewneck tees in rotating core colors. Pre-shrunk cotton blend keeps its fit through everyday wear and frequent washing.',
    specs: { Material: '95% Cotton, 5% Elastane', Fit: 'Regular Fit', 'Pack Size': '3 Tees', Care: 'Machine Wash Cold' }
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Fringed Knit Poncho Sweater',
    price: 58,
    original_price: 72,
    image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=1400&auto=format&fit=crop',
    category: 'Tops',
    tag: 'Handcrafted',
    rating: 4.7,
    reviews_count: 61,
    stock: 22,
    description: 'Hand-finished open-knit poncho sweater with a relaxed V-neck and fringe hem. Lightweight enough to layer, textured enough to wear alone.',
    specs: { Material: 'Cotton-Acrylic Knit Blend', Fit: 'Relaxed / One Size', Length: 'Hip Length', Care: 'Hand Wash Cold' }
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Corduroy Long-Sleeve Shirt Dress',
    price: 89,
    original_price: 110,
    image_url: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=1400&auto=format&fit=crop',
    category: 'Tops',
    tag: 'New Arrival',
    rating: 4.9,
    reviews_count: 47,
    stock: 16,
    description: 'A fitted-waist shirt dress in brushed corduroy with a button placket and three-quarter sleeves. Transitions easily from desk to dinner.',
    specs: { Material: '100% Cotton Corduroy', Fit: 'Fitted Waist, A-Line Skirt', Sizes: 'XS, S, M, L, XL', Care: 'Machine Wash Cold' }
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    name: 'Off-Shoulder Ruffle Mini Dress',
    price: 42,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1400&auto=format&fit=crop',
    category: 'Tops',
    tag: 'Seasonal',
    rating: 4.5,
    reviews_count: 88,
    stock: 30,
    description: 'Breathable cotton-poplin off-shoulder mini dress with an elasticated ruffle neckline and tiered hem. Warm-weather staple with a flattering silhouette.',
    specs: { Material: '100% Cotton Poplin', Fit: 'Relaxed, Off-Shoulder', Sizes: 'XS, S, M, L, XL', Care: 'Machine Wash Cold' }
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    name: 'Pleated Mini Skirt',
    price: 48,
    original_price: 58,
    image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1400&auto=format&fit=crop',
    category: 'Bottoms',
    tag: 'Bestseller',
    rating: 4.7,
    reviews_count: 133,
    stock: 34,
    description: 'A box-pleated mini skirt in structured stretch twill with a concealed side zip. Pairs cleanly with tees, knits, or tucked-in shirts.',
    specs: { Material: 'Stretch Twill (Poly-Viscose Blend)', Fit: 'A-Line, Box Pleat', Sizes: 'XS, S, M, L, XL', Care: 'Dry Clean Recommended' }
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    name: 'High-Waist Jogger Pants',
    price: 52,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1400&auto=format&fit=crop',
    category: 'Bottoms',
    tag: 'New In',
    rating: 4.6,
    reviews_count: 72,
    stock: 40,
    description: 'Soft satin-twill joggers with a high elastic waistband, side pockets, and tapered elastic cuffs. Structured enough to dress up, soft enough for travel.',
    specs: { Material: 'Satin Twill (Poly Blend)', Fit: 'Tapered, High-Rise', Sizes: 'XS, S, M, L, XL', Care: 'Machine Wash Cold' }
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    name: 'Classic Skinny Fit Jeans',
    price: 68,
    original_price: 82,
    image_url: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?q=80&w=1400&auto=format&fit=crop',
    category: 'Bottoms',
    tag: 'Bestseller',
    rating: 4.8,
    reviews_count: 241,
    stock: 45,
    description: 'Five-pocket skinny jeans in rigid mid-wash denim with a hint of stretch for all-day movement. A clean, everyday staple.',
    specs: { Material: '98% Cotton, 2% Elastane Denim', Fit: 'Skinny, Mid-Rise', Sizes: '24-32 (Waist)', Care: 'Machine Wash Cold, Inside Out' }
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    name: 'Relaxed Fit Sweatpants',
    price: 46,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1400&auto=format&fit=crop',
    category: 'Bottoms',
    tag: 'New Arrival',
    rating: 4.5,
    reviews_count: 58,
    stock: 38,
    description: 'Brushed-back fleece sweatpants with a drawstring waist and tapered leg. Everyday comfort with a clean, minimal silhouette.',
    specs: { Material: '80% Cotton, 20% Polyester Fleece', Fit: 'Relaxed, Tapered Leg', Sizes: 'XS, S, M, L, XL, XXL', Care: 'Machine Wash Cold' }
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    name: 'Faux Leather Biker Jacket',
    price: 148,
    original_price: 178,
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop',
    category: 'Outerwear',
    tag: 'Bestseller',
    rating: 4.8,
    reviews_count: 97,
    stock: 18,
    description: 'A moto-inspired jacket in supple faux leather with an asymmetric zip front, snap lapels, and quilted shoulder panels. Fully lined for structure.',
    specs: { Material: 'Faux Leather, Polyester Lining', Fit: 'Fitted, Cropped', Sizes: 'XS, S, M, L, XL', Care: 'Wipe Clean / Spot Clean Only' }
  },
  {
    id: '10000000-0000-0000-0000-000000000011',
    name: 'Classic Denim Trucker Jacket',
    price: 96,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1400&auto=format&fit=crop',
    category: 'Outerwear',
    tag: 'New In',
    rating: 4.7,
    reviews_count: 112,
    stock: 24,
    description: 'A timeless button-front trucker jacket in rigid cotton denim with twin chest pockets and adjustable waist tabs. Built to fade and wear in beautifully.',
    specs: { Material: '100% Cotton Denim', Fit: 'Classic, Button Front', Sizes: 'XS, S, M, L, XL', Care: 'Machine Wash Cold' }
  },
  {
    id: '10000000-0000-0000-0000-000000000012',
    name: 'Oversized Utility Jacket',
    price: 118,
    original_price: 140,
    image_url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1400&auto=format&fit=crop',
    category: 'Outerwear',
    tag: 'New Arrival',
    rating: 4.6,
    reviews_count: 39,
    stock: 15,
    description: 'An oversized shirt-jacket in brushed twill with chest flap pockets and a dropped shoulder seam. Layers easily over knits and tees.',
    specs: { Material: 'Cotton Twill', Fit: 'Oversized', Sizes: 'S, M, L, XL', Care: 'Machine Wash Cold' }
  },
  {
    id: '10000000-0000-0000-0000-000000000013',
    name: 'Leather Lace-Up Combat Boots',
    price: 132,
    original_price: 155,
    image_url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1400&auto=format&fit=crop',
    category: 'Footwear',
    tag: 'Bestseller',
    rating: 4.8,
    reviews_count: 164,
    stock: 26,
    description: 'Full-grain leather combat boots with a cap toe, reinforced eyelets, and a durable lugged outsole built for daily wear.',
    specs: { Material: 'Full-Grain Leather', Outsole: 'Rubber Lug Sole', Sizes: 'US 6 - US 12', Care: 'Leather Conditioner Recommended' }
  },
  {
    id: '10000000-0000-0000-0000-000000000014',
    name: 'Tan Leather Work Boots',
    price: 145,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=1400&auto=format&fit=crop',
    category: 'Footwear',
    tag: 'New In',
    rating: 4.7,
    reviews_count: 85,
    stock: 20,
    description: 'Rugged oiled-leather work boots with a cushioned footbed and shock-absorbing sole. Durable enough for daily wear, refined enough for everyday fits.',
    specs: { Material: 'Oiled Full-Grain Leather', Outsole: 'Shock-Absorbing Rubber', Sizes: 'US 7 - US 13', Care: 'Leather Conditioner Recommended' }
  },
  {
    id: '10000000-0000-0000-0000-000000000015',
    name: 'Chunky Colorblock Sneakers',
    price: 110,
    original_price: 130,
    image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1400&auto=format&fit=crop',
    category: 'Footwear',
    tag: 'New Arrival',
    rating: 4.6,
    reviews_count: 72,
    stock: 32,
    description: 'Statement low-top sneakers in a colorblocked suede-and-mesh upper with a chunky lugged midsole for all-day comfort.',
    specs: { Material: 'Suede & Mesh Upper', Outsole: 'Chunky EVA Midsole', Sizes: 'US 6 - US 12', Care: 'Wipe Clean' }
  },
  {
    id: '10000000-0000-0000-0000-000000000016',
    name: 'Floral Print Statement Heels',
    price: 95,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1400&auto=format&fit=crop',
    category: 'Footwear',
    tag: 'Seasonal',
    rating: 4.5,
    reviews_count: 54,
    stock: 18,
    description: 'Pointed-toe pumps in a hand-finished floral jacquard with a comfort-padded insole and a stable 90mm heel.',
    specs: { Material: 'Jacquard Textile Upper', 'Heel Height': '90mm', Sizes: 'US 5 - US 10', Care: 'Spot Clean Only' }
  },
  {
    id: '10000000-0000-0000-0000-000000000017',
    name: 'Round Metal-Frame Sunglasses',
    price: 38,
    original_price: 48,
    image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1400&auto=format&fit=crop',
    category: 'Accessories',
    tag: 'Bestseller',
    rating: 4.7,
    reviews_count: 198,
    stock: 50,
    description: 'Vintage-inspired round sunglasses in a lightweight gold-tone metal frame with polarized UV400 lenses.',
    specs: { Frame: 'Gold-Tone Metal', Lenses: 'Polarized UV400', Fit: 'One Size', Care: 'Microfiber Cloth Only' }
  },
  {
    id: '10000000-0000-0000-0000-000000000018',
    name: 'Everyday Canvas Backpack',
    price: 78,
    original_price: 95,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1400&auto=format&fit=crop',
    category: 'Accessories',
    tag: 'New In',
    rating: 4.8,
    reviews_count: 143,
    stock: 28,
    description: 'A durable canvas backpack with a padded 15-inch laptop sleeve, water-resistant coating, and adjustable ergonomic straps.',
    specs: { Material: 'Water-Resistant Canvas', Capacity: '20 Liters', 'Laptop Sleeve': 'Up to 15 Inches', Care: 'Spot Clean' }
  },
  {
    id: '10000000-0000-0000-0000-000000000019',
    name: 'Structured Canvas Tote Bag',
    price: 42,
    original_price: null,
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1400&auto=format&fit=crop',
    category: 'Accessories',
    tag: 'New Arrival',
    rating: 4.6,
    reviews_count: 76,
    stock: 35,
    description: 'A roomy structured tote in heavyweight cotton canvas with reinforced handles and an interior zip pocket. Everyday carry, built to last.',
    specs: { Material: 'Heavyweight Cotton Canvas', Capacity: '18 Liters', Dimensions: '38cm x 34cm x 14cm', Care: 'Spot Clean' }
  }
]

/**
 * Normalize a product object from Supabase or fallback catalog so both
 * storefront (`image`, `originalPrice`, `reviews`) and AI guide (`image_url`) fields exist.
 */
export function normalizeCatalogProduct(row) {
  if (!row) return null
  const price = typeof row.price === 'string' ? parseFloat(row.price) : Number(row.price || 0)
  const rawOriginal = row.original_price ?? row.originalPrice
  const originalPrice = rawOriginal ? (typeof rawOriginal === 'string' ? parseFloat(rawOriginal) : Number(rawOriginal)) : null
  const image = row.image_url || row.image || ''
  return {
    ...row,
    id: row.id ?? row.productId,
    productId: row.productId ?? row.id,
    price,
    originalPrice,
    original_price: originalPrice,
    image,
    image_url: image,
    reviews: row.reviews_count ?? row.reviews ?? 0,
    reviews_count: row.reviews_count ?? row.reviews ?? 0,
    gallery: Array.isArray(row.gallery) && row.gallery.length > 0 ? row.gallery : (image ? [image] : [])
  }
}

/**
 * Fetch active catalog from Supabase or return the normalized 19-piece fallback catalog.
 */
export async function getLiveOrFallbackCatalog(client = supabase) {
  if (isSupabaseConfigured && client) {
    try {
      const { data, error } = await client.from('products').select('*').eq('is_active', true)
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(normalizeCatalogProduct)
      }
    } catch (err) {
      console.warn('[Zion AI] Falling back to local catalog:', err?.message)
    }
  }
  return FALLBACK_ATELIER_CATALOG.map(normalizeCatalogProduct)
}

/**
 * Semantic-aware local scoring fallback when pgvector embeddings haven't been seeded yet
 * or when offline / unconfigured. Understands budgets ("under $100"), occasions, and materials.
 */
export function rankCatalogLocally(catalog, rawQuery, maxResults = 8) {
  const list = (catalog || FALLBACK_ATELIER_CATALOG).map(normalizeCatalogProduct)
  if (!rawQuery || !rawQuery.trim()) return list.slice(0, maxResults)

  const q = rawQuery.toLowerCase()

  // Extract budget cap if mentioned (e.g. "under $100", "below 80", "$50 budget")
  const budgetMatch =
    q.match(/(?:under|below|less than|max|budget|around)\s*[$₱]?\s*(\d+(?:\.\d+)?)/i) ||
    q.match(/[$₱]\s*(\d+(?:\.\d+)?)/i)
  const maxBudget = budgetMatch ? parseFloat(budgetMatch[1]) : null

  // Domain concept expansion for natural-language queries
  const conceptExpansions = {
    rainy: ['jacket', 'outerwear', 'boots', 'water-resistant', 'hood', 'layer', 'poncho', 'sweater', 'canvas'],
    cold: ['jacket', 'outerwear', 'sweater', 'knit', 'poncho', 'fleece', 'sweatpants', 'boots', 'corduroy', 'layer'],
    winter: ['jacket', 'outerwear', 'sweater', 'knit', 'boots', 'fleece', 'biker', 'trucker'],
    cozy: ['sweater', 'knit', 'poncho', 'fleece', 'sweatpants', 'jogger', 'soft', 'relaxed', 'cotton'],
    warm: ['dress', 'mini', 'tee', 't-shirt', 'sunglasses', 'skirt', 'poplin', 'breathable', 'summer'],
    summer: ['dress', 'mini', 'tee', 't-shirt', 'sunglasses', 'skirt', 'poplin'],
    office: ['dress', 'shirt', 'corduroy', 'tote', 'heels', 'skirt', 'structured', 'tailored'],
    formal: ['dress', 'heels', 'jacket', 'structured', 'skirt'],
    casual: ['tee', 't-shirt', 'jeans', 'sneakers', 'sweatpants', 'jogger', 'backpack', 'tote', 'denim'],
    travel: ['backpack', 'jogger', 'sneakers', 'tote', 'sunglasses', 'jacket', 'comfortable'],
    gift: ['sunglasses', 'tote', 'backpack', 'poncho', '3-pack', 'bestseller', 'handcrafted'],
    minimalist: ['classic', 'crewneck', 'essential', 'clean', 'structured', 'tote', 'denim', 'everyday'],
    edgy: ['biker', 'leather', 'combat', 'boots', 'moto', 'black'],
    streetwear: ['sneakers', 'oversized', 'utility', 'jogger', 'biker', 'sweatpants', 'tee'],
    shoes: ['footwear', 'boots', 'sneakers', 'heels'],
    bag: ['backpack', 'tote', 'accessories'],
    pants: ['bottoms', 'jeans', 'jogger', 'sweatpants'],
    top: ['tops', 'tee', 't-shirt', 'sweater', 'dress', 'poncho'],
    coat: ['outerwear', 'jacket', 'biker', 'trucker', 'utility']
  }

  const stopWords = new Set([
    'for', 'the', 'and', 'with', 'that', 'this', 'from', 'under', 'below', 'less',
    'than', 'find', 'show', 'me', 'some', 'looking', 'want', 'need', 'something',
    'outfit', 'piece', 'pieces', 'items', 'zion', 'shop', 'atelier'
  ])

  const tokens = q
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !stopWords.has(t) && !/^\d+$/.test(t))

  const expandedTokens = new Set(tokens)
  Object.entries(conceptExpansions).forEach(([key, synonyms]) => {
    if (q.includes(key)) {
      synonyms.forEach(s => expandedTokens.add(s))
    }
  })

  const scored = list
    .filter(item => (maxBudget ? item.price <= maxBudget : true))
    .map(item => {
      const haystack = `${item.name} ${item.category} ${item.tag || ''} ${item.description || ''} ${JSON.stringify(item.specs || {})}`.toLowerCase()
      let score = 0

      // Direct phrase match
      if (haystack.includes(q.trim())) score += 10

      // Primary token matches
      tokens.forEach(tok => {
        if (item.name.toLowerCase().includes(tok)) score += 5
        if ((item.category || '').toLowerCase().includes(tok)) score += 4
        if (haystack.includes(tok)) score += 2.5
      })

      // Expanded semantic concept matches
      expandedTokens.forEach(tok => {
        if (!tokens.includes(tok) && haystack.includes(tok)) {
          score += 1.5
        }
      })

      // Slight boost for bestsellers/high rating when query is broad
      if (maxBudget && tokens.length === 0) {
        score += (item.rating || 4.5) * 0.5
      }

      return { item, score }
    })

  const matches = scored
    .filter(entry => entry.score > 0 || (maxBudget && entry.item.price <= maxBudget))
    .sort((a, b) => b.score - a.score || b.item.rating - a.item.rating)
    .map(entry => entry.item)

  return (matches.length > 0 ? matches : list).slice(0, maxResults)
}

/**
 * Guardrail: Prevents a single user from exhausting your 15 RPM free quota.
 * Supports both (clerkUserId, feature, client) and (clerkUserId, feature, maxPerMin, client).
 */
export async function checkAndLogRateLimit(
  clerkUserId = 'guest',
  feature = 'general',
  maxOrClient = null,
  maybeClient = null
) {
  const maxLimit = typeof maxOrClient === 'number' ? maxOrClient : 12
  const client =
    (typeof maxOrClient === 'object' && maxOrClient !== null ? maxOrClient : maybeClient) ||
    supabase

  const userKey = clerkUserId || 'guest'
  const now = Date.now()
  const oneMinuteAgoMs = now - 60 * 1000

  // 1. In-memory rate-limit check
  const recentTimestamps = (memoryRateWindow.get(userKey) || []).filter(ts => ts > oneMinuteAgoMs)
  if (recentTimestamps.length >= maxLimit) {
    throw new Error('You are making AI requests too quickly. Please wait a few seconds.')
  }
  recentTimestamps.push(now)
  memoryRateWindow.set(userKey, recentTimestamps)

  // 2. Supabase `ai_api_logs` check & audit insert (if configured and migrated)
  if (!isSupabaseConfigured || !client) return

  try {
    const oneMinuteAgoIso = new Date(oneMinuteAgoMs).toISOString()
    const { count, error } = await client
      .from('ai_api_logs')
      .select('*', { count: 'exact', head: true })
      .eq('clerk_user_id', userKey)
      .gte('created_at', oneMinuteAgoIso)

    if (!error && count >= maxLimit) {
      throw new Error('You are making AI requests too quickly. Please wait a few seconds.')
    }

    await client.from('ai_api_logs').insert([
      { clerk_user_id: userKey, feature }
    ])
  } catch (err) {
    if (err.message?.includes('too quickly')) throw err
    // Ignore if `ai_api_logs` table is not yet created
  }
}

/**
 * Helper: Convert a browser File object into a Base64 string for Gemini Vision
 */
export function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1]
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'image/jpeg'
        }
      })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Generate a 768-dimensional vector embedding using gemini-embedding-001 (Free)
 * Falls back to text-embedding-004 if needed.
 */
export async function generateTextEmbedding(text) {
  if (!isAiConfigured) {
    throw new Error('VITE_GEMINI_API_KEY is not configured.')
  }

  const embeddingModels = ['gemini-embedding-001', 'text-embedding-004']
  let lastError = null

  for (const modelName of embeddingModels) {
    try {
      const url = `${GEMINI_BASE_URL}/${modelName}:embedContent?key=${GEMINI_API_KEY}`
      const payload = {
        model: `models/${modelName}`,
        content: {
          parts: [{ text }]
        }
      }
      if (modelName === 'gemini-embedding-001') {
        payload.outputDimensionality = 768
      }
      const response = await axios.post(url, payload)
      const values = response.data?.embedding?.values
      if (Array.isArray(values) && values.length > 0) {
        return values
      }
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('Failed to generate text embedding.')
}

/**
 * Clean potential markdown code fences around JSON responses
 */
function parseStrictJson(rawText) {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return JSON.parse(cleaned)
}

/**
 * Call Gemini Flash for JSON or text responses (supports optional image input).
 * Supports both { prompt, imageParts, responseMimeType } and { userPrompt, imagePart, jsonMode }.
 * Automatically negotiates across Gemini 3.5/3.6/3.7/3.8 Flash models and retries on 404/503.
 */
export async function callGeminiFlash({
  systemInstruction,
  prompt,
  userPrompt,
  imagePart = null,
  imageParts = null,
  responseMimeType = null,
  jsonMode = true,
  temperature = 0.2
}) {
  if (!isAiConfigured) {
    throw new Error('VITE_GEMINI_API_KEY is not configured.')
  }

  const textPrompt = prompt ?? userPrompt ?? ''
  const isJson = responseMimeType
    ? responseMimeType === 'application/json'
    : Boolean(jsonMode)

  const parts = [{ text: textPrompt }]
  if (Array.isArray(imageParts) && imageParts.length > 0) {
    parts.push(...imageParts.filter(Boolean))
  } else if (imagePart) {
    parts.push(imagePart)
  }

  const payload = {
    systemInstruction: systemInstruction
      ? { parts: [{ text: systemInstruction }] }
      : undefined,
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature,
      responseMimeType: isJson ? 'application/json' : 'text/plain'
    }
  }

  const flashModels = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ]
  let rawText = ''
  let lastError = null

  for (const modelName of flashModels) {
    try {
      const url = `${GEMINI_BASE_URL}/${modelName}:generateContent?key=${GEMINI_API_KEY}`
      const response = await axios.post(url, payload)
      rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (rawText) break
    } catch (err) {
      lastError = err
      const status = err?.response?.status
      // Try next Flash model on 404 (retired), 400, 429, or 503 (temporary demand spike)
      if (status && ![400, 404, 429, 503].includes(status)) {
        break
      }
    }
  }

  if (!rawText) {
    throw lastError || new Error('No response received from Gemini AI.')
  }

  if (isJson) {
    try {
      return parseStrictJson(rawText)
    } catch (err) {
      console.error('[Zion AI] Failed to parse AI JSON:', rawText, err)
      throw new Error('Received an unexpected format from the AI assistant.')
    }
  }

  return rawText
}

