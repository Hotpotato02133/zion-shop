// src/services/productEmbeddingService.js
import { supabase as defaultSupabase } from '../lib/supabase'
import { generateTextEmbedding, isAiConfigured } from './aiService'

/**
 * Generate and store a 768-dim vector embedding for a single product in Supabase.
 */
export async function embedProductInSupabase(product, client = defaultSupabase) {
  if (!isAiConfigured || !product?.id) return null

  const specsText = product.specs
    ? Object.entries(product.specs)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : ''

  const textToEmbed = [
    product.name,
    `Category: ${product.category || 'Apparel'}`,
    product.tag ? `Tag: ${product.tag}` : '',
    `Description: ${product.description || ''}`,
    specsText ? `Specs: ${specsText}` : '',
    `Price: $${product.price}`
  ]
    .filter(Boolean)
    .join('. ')

  const embedding = await generateTextEmbedding(textToEmbed)

  const { error } = await client
    .from('products')
    .update({ embedding })
    .eq('id', product.id)

  if (error) throw error
  return embedding
}

/**
 * Batch-embed all active products in Supabase (used by the 1-Click Admin Sync button).
 */
export async function embedAllProductsInSupabase(client = defaultSupabase, onProgress) {
  if (!isAiConfigured) {
    throw new Error('Please set VITE_GEMINI_API_KEY in .env.local to generate vector embeddings.')
  }

  const { data: products, error } = await client
    .from('products')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  const list = products || []
  let completed = 0

  for (const product of list) {
    await embedProductInSupabase(product, client)
    completed += 1
    onProgress?.({ current: completed, total: list.length, name: product.name })
  }

  return { embedded: completed, total: list.length }
}

