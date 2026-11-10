// src/hooks/useSemanticSearch.js
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  generateTextEmbedding,
  checkAndLogRateLimit,
  callGeminiFlash,
  isAiConfigured,
  normalizeCatalogProduct,
  rankCatalogLocally
} from '../services/aiService'

export function useSemanticSearch(clerkUserId) {
  const [results, setResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [aiSummary, setAiSummary] = useState('')

  const clearSemanticResults = useCallback(() => {
    setResults(null)
    setAiSummary('')
  }, [])

  const searchByMeaning = useCallback(
    async (query, fallbackCatalog = []) => {
      const trimmed = (query || '').trim()
      if (!trimmed) {
        clearSemanticResults()
        return []
      }

      setIsSearching(true)
      setAiSummary('')

      try {
        await checkAndLogRateLimit(clerkUserId || 'guest', 'semantic_search')

        if (isAiConfigured) {
          // 1. Try pgvector similarity search first
          try {
            const queryEmbedding = await generateTextEmbedding(trimmed)
            const { data, error } = await supabase.rpc('match_products', {
              query_embedding: queryEmbedding,
              match_threshold: 0.38,
              match_count: 12
            })

            if (!error && Array.isArray(data) && data.length > 0) {
              const normalized = data.map(normalizeCatalogProduct)
              setResults(normalized)
              setAiSummary(`Matched ${normalized.length} atelier pieces by semantic meaning for "${trimmed}"`)
              return normalized
            }
          } catch (vecErr) {
            console.warn('[Zion AI] Vector RPC fallback to Gemini catalog ranking:', vecErr?.message)
          }

          // 2. If pgvector embeddings aren't seeded yet, ask Gemini Flash to semantically match from the catalog
          if (fallbackCatalog.length > 0) {
            const compactCatalog = fallbackCatalog.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
              tag: p.tag,
              description: p.description,
              specs: p.specs
            }))

            const aiRank = await callGeminiFlash({
              systemInstruction: `You are Zion Atelier's semantic search engine.
Given the shopper's natural-language query and the catalog JSON, select the products that best match the shopper's meaning, occasion, weather, style, or budget constraints (prices are in USD $).
Return STRICT JSON:
{
  "matchedIds": ["id1", "id2"],
  "interpretation": "Short 1-sentence summary of how you matched their query"
}`,
              userPrompt: `Shopper Query: "${trimmed}"\nCatalog: ${JSON.stringify(compactCatalog)}`,
              jsonMode: true
            })

            const idOrder = (aiRank?.matchedIds || []).map(String)
            const matched = idOrder
              .map(id => fallbackCatalog.find(p => String(p.id) === id || String(p.productId) === id))
              .filter(Boolean)
              .map(normalizeCatalogProduct)

            if (matched.length > 0) {
              setResults(matched)
              setAiSummary(aiRank.interpretation || `AI curated ${matched.length} pieces for "${trimmed}"`)
              return matched
            }
          }
        }

        // 3. Graceful fallback: local semantic + budget + SQL ILIKE matching
        const localRanked = rankCatalogLocally(fallbackCatalog, trimmed, 12)
        setResults(localRanked)
        setAiSummary(`Showing ${localRanked.length} pieces matching "${trimmed}"`)
        return localRanked
      } catch (err) {
        console.warn('[Zion AI] Semantic search fallback:', err?.message)
        const localRanked = rankCatalogLocally(fallbackCatalog, trimmed, 12)
        setResults(localRanked)
        setAiSummary(err?.message?.includes('too quickly') ? err.message : `Showing ${localRanked.length} pieces matching "${trimmed}"`)
        return localRanked
      } finally {
        setIsSearching(false)
      }
    },
    [clerkUserId, clearSemanticResults]
  )

  return {
    results,
    isSearching,
    aiSummary,
    searchByMeaning,
    clearSemanticResults,
    setResults,
    setAiSummary
  }
}

