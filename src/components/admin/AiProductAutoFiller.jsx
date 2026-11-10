import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  isAiConfigured,
  fileToGenerativePart,
  callGeminiFlash,
} from '../../services/aiService';

export function AiProductAutoFiller({
  imageFile,
  imageUrl,
  currentName = '',
  onAutoFillForm,
}) {
  const [generating, setGenerating] = useState(false);

  const handleAutoGenerate = async () => {
    if (!imageFile && !imageUrl && !currentName) return;
    setGenerating(true);

    try {
      let listingData = null;

      if (isAiConfigured) {
        try {
          const imageParts = imageFile
            ? [await fileToGenerativePart(imageFile)]
            : [];

          const prompt = `You are an expert e-commerce merchandiser for ZION Atelier Privé, a minimalist black-and-white luxury fashion store.
${
  imageFile
    ? 'Inspect this uploaded product image.'
    : `Generate a product listing for image URL "${imageUrl || ''}" ${
        currentName ? `named "${currentName}"` : ''
      }.`
}
Generate a complete, ready-to-publish product listing.
Return a JSON object with:
- "name": Clean, editorial product title (max 55 chars)
- "category": Must be one of: "Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"
- "description": Persuasive 2-sentence luxury product description highlighting material, silhouette, and finish
- "suggestedPriceUsd": Realistic numeric retail price in USD (between 35 and 220)
- "compareAtPriceUsd": Optional numeric compare-at price in USD (or null)
- "tag": Short badge such as "New In", "Bestseller", "Atelier Exclusive", or "Limited Edition"
- "specs": Object with keys "Material", "Fit", "Sizes", and "Care"
- "aiTags": Array of 5 lowercase search keywords`;

          listingData = await callGeminiFlash({
            prompt,
            imageParts,
            responseMimeType: 'application/json',
          });
        } catch (aiErr) {
          console.warn('Gemini Auto-Fill fallback:', aiErr?.message);
        }
      }

      if (!listingData || !listingData.name) {
        const rawBase =
          currentName?.trim() ||
          imageFile?.name
            ?.replace(/\.[^/.]+$/, '')
            ?.replace(/[-_]+/g, ' ')
            ?.trim() ||
          'Atelier Monochrome Piece';

        const titleCased = rawBase.replace(/\b\w/g, (c) => c.toUpperCase());
        listingData = {
          name: titleCased,
          category: 'Outerwear',
          description: `Architectural ${titleCased.toLowerCase()} crafted from heavyweight monochrome textile with clean tailored seams and an understated matte finish. Designed for effortless year-round layering.`,
          suggestedPriceUsd: 128,
          compareAtPriceUsd: 155,
          tag: 'New In',
          specs: {
            Material: 'Heavyweight Brushed Cotton Twill',
            Fit: 'Relaxed Architectural Fit',
            Sizes: 'S, M, L, XL',
            Care: 'Dry Clean or Cold Hand Wash',
          },
          aiTags: ['monochrome', 'minimalist', 'tailored', 'luxury', 'atelier'],
        };
      }

      const specsObj =
        listingData.specs && typeof listingData.specs === 'object'
          ? listingData.specs
          : {
              Material: 'Premium Atelier Textile',
              Sizes: 'S, M, L, XL',
              Care: 'Cold Wash / Line Dry',
            };

      const specsText = Object.entries(specsObj)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');

      onAutoFillForm?.({
        name: listingData.name,
        category: listingData.category || 'Tops',
        description: listingData.description || '',
        price: listingData.suggestedPriceUsd ?? 95,
        original_price: listingData.compareAtPriceUsd ?? '',
        tag: listingData.tag || 'New In',
        specsText,
        ai_tags: Array.isArray(listingData.aiTags) ? listingData.aiTags : [],
      });
    } catch (err) {
      console.error('Auto-fill error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = Boolean(imageFile || imageUrl || currentName?.trim());

  return (
    <button
      type="button"
      disabled={!canGenerate || generating}
      onClick={handleAutoGenerate}
      title={
        canGenerate
          ? 'Use Gemini Vision AI to auto-fill title, description, price, category, and specs'
          : 'Upload an image, paste an image URL, or enter a title first'
      }
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-black dark:hover:bg-neutral-200 disabled:opacity-40 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
    >
      {generating ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>AI Writing Listing…</span>
        </>
      ) : (
        <>
          <Sparkles size={14} />
          <span>Auto-Fill with AI Vision</span>
        </>
      )}
    </button>
  );
}

export default AiProductAutoFiller;

