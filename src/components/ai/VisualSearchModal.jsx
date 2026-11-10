import { useState, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Camera, Loader2 } from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';
import {
  isAiConfigured,
  fileToGenerativePart,
  callGeminiFlash,
  generateTextEmbedding,
  checkAndLogRateLimit,
  getLiveOrFallbackCatalog,
  rankCatalogLocally,
  normalizeCatalogProduct,
} from '../../services/aiService';

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export function VisualSearchButton({
  onVisualResultsFound,
  catalogFallback = null,
  compact = false,
  className = '',
}) {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      await checkAndLogRateLimit(user?.id, 'visual_search', 15, supabase);
      const previewUrl = await readFileAsDataUrl(file);

      let visionResult = null;

      if (isAiConfigured) {
        try {
          const imagePart = await fileToGenerativePart(file);
          const visionPrompt = `Analyze this fashion or product photo for a luxury minimalist monochrome store (categories: Tops, Bottoms, Outerwear, Footwear, Accessories).
Return a JSON object with:
- "category": Closest matching category ("Tops", "Bottoms", "Outerwear", "Footwear", or "Accessories")
- "primaryColor": Main color tone
- "materialOrStyle": Key fabric, silhouette, and design traits
- "searchQueryDescription": A rich 1-sentence product search query capturing the garment type, cut, texture, and occasion.`;

          visionResult = await callGeminiFlash({
            prompt: visionPrompt,
            imageParts: [imagePart],
            responseMimeType: 'application/json',
          });
        } catch (visionErr) {
          console.warn('Gemini vision fallback:', visionErr?.message);
        }
      }

      if (!visionResult || !visionResult.searchQueryDescription) {
        const cleanFileName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .trim();
        visionResult = {
          category: 'Outerwear',
          primaryColor: 'Monochrome Black',
          materialOrStyle: 'Architectural minimalist silhouette',
          searchQueryDescription:
            cleanFileName.length > 3
              ? `${cleanFileName} minimalist monochrome luxury apparel`
              : 'Tailored monochrome coat jacket shirt trouser leather accessory',
        };
      }

      const descriptionQuery = `${visionResult.category || ''} ${
        visionResult.materialOrStyle || ''
      } ${visionResult.searchQueryDescription || ''}`.trim();

      let matchedProducts = [];

      if (isAiConfigured && supabase) {
        try {
          const vector = await generateTextEmbedding(descriptionQuery);
          const { data, error } = await supabase.rpc('match_products', {
            query_embedding: vector,
            match_threshold: 0.28,
            match_count: 8,
          });
          if (!error && Array.isArray(data) && data.length > 0) {
            matchedProducts = data.map(normalizeCatalogProduct);
          }
        } catch {
          // Fallback to catalog ranking below
        }
      }

      if (matchedProducts.length === 0) {
        const catalog = await getLiveOrFallbackCatalog(supabase, catalogFallback);
        const ranked = rankCatalogLocally(catalog, descriptionQuery, 8);
        if (ranked.length > 0) {
          matchedProducts = ranked;
        } else {
          // Filter by detected category if available
          const byCategory = catalog.filter(
            (p) =>
              p.category?.toLowerCase() ===
              String(visionResult.category || '').toLowerCase()
          );
          matchedProducts = (byCategory.length > 0 ? byCategory : catalog).slice(0, 6);
        }
      }

      const summaryLabel = `${visionResult.primaryColor || 'Monochrome'} ${
        visionResult.category || 'Piece'
      } — ${visionResult.materialOrStyle || visionResult.searchQueryDescription}`;

      onVisualResultsFound?.(matchedProducts, summaryLabel, previewUrl, visionResult);
    } catch (err) {
      console.error('Visual Search failed:', err);
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleImageUpload}
      />
      <button
        type="button"
        disabled={analyzing}
        onClick={() => fileInputRef.current?.click()}
        title="Snap to Shop — Upload a photo to find visually similar pieces"
        className={
          className ||
          `inline-flex items-center justify-center gap-2 border border-neutral-300 bg-white text-black hover:border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50 ${
            compact
              ? 'px-3 py-2 text-[10px] tracking-[0.16em] uppercase font-semibold'
              : 'px-4 py-2.5 text-[11px] tracking-[0.18em] uppercase font-semibold'
          }`
        }
      >
        {analyzing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5" />
        )}
        <span>{analyzing ? 'Scanning Photo...' : compact ? 'Snap to Shop' : 'Visual Search'}</span>
      </button>
    </>
  );
}

export default VisualSearchButton;

