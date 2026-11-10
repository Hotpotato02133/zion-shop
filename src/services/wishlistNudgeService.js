import { isAiConfigured, callGeminiFlash } from './aiService';

export async function generateWishlistNudge(
  wishlistProducts = [],
  userFirstName = 'Guest'
) {
  if (!Array.isArray(wishlistProducts) || wishlistProducts.length === 0) {
    return null;
  }

  // Enrich items with stock & discount metrics
  const candidates = wishlistProducts.map((item) => {
    const id = item.productId ?? item.id;
    const price = Number(item.price || 0);
    const origPrice = Number(item.originalPrice ?? item.original_price ?? 0);
    const stock = Number(item.stock ?? 8);
    const threshold = Number(item.low_stock_threshold ?? 12);
    const savings = origPrice > price ? origPrice - price : 0;
    const discountPct =
      origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

    return {
      ...item,
      resolvedId: id,
      price,
      origPrice,
      stock,
      threshold,
      savings,
      discountPct,
      isLowStock: stock > 0 && stock <= threshold,
      isDiscounted: savings > 0,
    };
  });

  const urgentItems = candidates.filter(
    (p) => p.isLowStock || p.isDiscounted
  );
  const pool = urgentItems.length > 0 ? urgentItems : candidates;
  const primary = pool[0];

  const signature = pool
    .map((p) => `${p.resolvedId}:${p.price}:${p.stock}`)
    .join('|');
  const cacheKey = `zion_wishlist_nudge_${signature}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.message) return parsed;
    }
  } catch {
    // Ignore sessionStorage error
  }

  let nudgeResult = null;

  if (isAiConfigured) {
    try {
      const itemsSummary = pool
        .slice(0, 4)
        .map(
          (p) =>
            `- ID "${p.resolvedId}": ${p.name} ($${p.price.toFixed(2)}, ${
              p.isDiscounted
                ? `reduced ${p.discountPct}% from $${p.origPrice.toFixed(2)}`
                : 'standard atelier pricing'
            }, ${p.stock} units remaining in archive)`
        )
        .join('\n');

      const prompt = `Write a single, sophisticated 1-sentence notification for ${
        userFirstName || 'our client'
      } about their saved ZION Atelier wishlist items:
${itemsSummary}

Highlight the most urgent item (either low stock or recent price reduction) without sounding pushy.
Return JSON with:
- "message": the 1-sentence editorial alert
- "productId": exact ID string of the highlighted item
- "urgencyType": "low_stock" | "price_drop" | "atelier_reserve"`;

      const aiRes = await callGeminiFlash({
        prompt,
        responseMimeType: 'application/json',
      });

      if (aiRes?.message) {
        nudgeResult = {
          message: aiRes.message,
          productId: aiRes.productId ?? primary.resolvedId,
          productName: primary.name,
          urgencyType:
            aiRes.urgencyType ||
            (primary.isDiscounted
              ? 'price_drop'
              : primary.isLowStock
              ? 'low_stock'
              : 'atelier_reserve'),
        };
      }
    } catch {
      // Fallback below
    }
  }

  if (!nudgeResult) {
    const greeting = userFirstName && userFirstName !== 'Guest' ? `${userFirstName}, ` : '';
    let message = '';
    let urgencyType = 'atelier_reserve';

    if (primary.isDiscounted && primary.isLowStock) {
      urgencyType = 'price_drop';
      message = `${greeting}your saved ${primary.name} is currently ${
        primary.discountPct
      }% below original release ($${primary.price.toFixed(2)}) with only ${
        primary.stock
      } pieces remaining in the archive.`;
    } else if (primary.isDiscounted) {
      urgencyType = 'price_drop';
      message = `${greeting}the ${primary.name} in your private reserve is now available at $${primary.price.toFixed(
        2
      )} (a $${primary.savings.toFixed(0)} seasonal reduction from $${primary.origPrice.toFixed(
        0
      )}).`;
    } else if (primary.isLowStock) {
      urgencyType = 'low_stock';
      message = `${greeting}archive allocation for your saved ${primary.name} is down to ${primary.stock} remaining units before seasonal restock.`;
    } else {
      message = `${greeting}your saved ${primary.name} ($${primary.price.toFixed(
        2
      )}) is currently in stock and ready for immediate express dispatch.`;
    }

    nudgeResult = {
      message,
      productId: primary.resolvedId,
      productName: primary.name,
      urgencyType,
    };
  }

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(nudgeResult));
  } catch {
    // Ignore storage error
  }

  return nudgeResult;
}

