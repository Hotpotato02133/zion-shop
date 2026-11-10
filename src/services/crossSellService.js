import { supabase as defaultSupabase } from '../lib/supabaseClient';
import {
  isAiConfigured,
  callGeminiFlash,
  generateTextEmbedding,
  getLiveOrFallbackCatalog,
  rankCatalogLocally,
  normalizeCatalogProduct,
} from './aiService';

const COMPLEMENTARY_CATEGORY_MAP = {
  Tops: ['Bottoms', 'Outerwear', 'Accessories', 'Footwear'],
  Bottoms: ['Tops', 'Footwear', 'Outerwear', 'Accessories'],
  Outerwear: ['Tops', 'Bottoms', 'Footwear', 'Accessories'],
  Footwear: ['Bottoms', 'Tops', 'Accessories', 'Outerwear'],
  Accessories: ['Outerwear', 'Tops', 'Bottoms', 'Footwear'],
};

export async function getSmartCrossSellProducts(
  cartItems = [],
  client = defaultSupabase
) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { products: [], stylistNote: '' };
  }

  const cartIds = new Set(
    cartItems.map((item) => String(item.productId ?? item.id))
  );
  const cartNames = new Set(
    cartItems.map((item) => String(item.name || '').toLowerCase())
  );
  const cartCategories = new Set(
    cartItems.map((item) => item.category).filter(Boolean)
  );

  const isNotInCart = (product) =>
    !cartIds.has(String(product.id)) &&
    !cartIds.has(String(product.productId)) &&
    !cartNames.has(String(product.name || '').toLowerCase()) &&
    Number(product.stock ?? 10) > 0;

  let idealDescription = '';
  let stylistNote = '';

  if (isAiConfigured) {
    try {
      const cartSummary = cartItems
        .map((item) => `${item.name} (${item.category || 'Apparel'})`)
        .join(', ');

      const prompt = `A ZION Atelier customer currently has these items in their shopping bag: ${cartSummary}.
Available store categories: Tops, Bottoms, Outerwear, Footwear, Accessories.
Return a JSON object with:
- "searchDescription": A 1-sentence search description of 2-3 complementary pieces from DIFFERENT categories that complete this monochrome outfit.
- "stylistNote": A 1-sentence editorial styling note explaining why these complementary pieces balance the silhouette.`;

      const aiRes = await callGeminiFlash({
        prompt,
        responseMimeType: 'application/json',
      });

      if (aiRes?.searchDescription) {
        idealDescription = aiRes.searchDescription;
      }
      if (aiRes?.stylistNote) {
        stylistNote = aiRes.stylistNote;
      }
    } catch {
      // Fallback below
    }
  }

  let matchedProducts = [];

  if (isAiConfigured && idealDescription && client) {
    try {
      const vector = await generateTextEmbedding(idealDescription);
      const { data, error } = await client.rpc('match_products', {
        query_embedding: vector,
        match_threshold: 0.28,
        match_count: 8,
      });
      if (!error && Array.isArray(data) && data.length > 0) {
        matchedProducts = data.map(normalizeCatalogProduct).filter(isNotInCart);
      }
    } catch {
      // Fallback to catalog selection below
    }
  }

  if (matchedProducts.length < 3) {
    const fullCatalog = (await getLiveOrFallbackCatalog(client)).filter(isNotInCart);

    if (idealDescription) {
      const ranked = rankCatalogLocally(fullCatalog, idealDescription, 6);
      matchedProducts = [...matchedProducts, ...ranked];
    }

    // Prioritize complementary categories not currently in the bag
    const primaryCartCategory = cartItems[0]?.category || 'Tops';
    const preferredOrder = COMPLEMENTARY_CATEGORY_MAP[primaryCartCategory] || [
      'Outerwear',
      'Bottoms',
      'Footwear',
      'Accessories',
      'Tops',
    ];

    const complementary = [...fullCatalog].sort((a, b) => {
      const aInCartCat = cartCategories.has(a.category) ? 1 : 0;
      const bInCartCat = cartCategories.has(b.category) ? 1 : 0;
      if (aInCartCat !== bInCartCat) return aInCartCat - bInCartCat;

      const aIdx = preferredOrder.indexOf(a.category);
      const bIdx = preferredOrder.indexOf(b.category);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    const seen = new Set(matchedProducts.map((p) => String(p.id)));
    for (const item of complementary) {
      if (matchedProducts.length >= 3) break;
      if (!seen.has(String(item.id))) {
        seen.add(String(item.id));
        matchedProducts.push(item);
      }
    }
  }

  const finalThree = matchedProducts.slice(0, 3);

  if (!stylistNote && finalThree.length > 0) {
    const firstCartName = cartItems[0]?.name || 'your selection';
    const suggestedCategories = [
      ...new Set(finalThree.map((p) => p.category).filter(Boolean)),
    ].join(' & ');
    stylistNote = `Curated ${suggestedCategories.toLowerCase()} pieces to balance and complete the silhouette of ${firstCartName}.`;
  }

  return {
    products: finalThree,
    stylistNote,
  };
}

