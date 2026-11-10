import { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, Check, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSupabase } from '../../context/SupabaseContext';
import { getSmartCrossSellProducts } from '../../services/crossSellService';
import { normalizeCatalogProduct } from '../../services/aiService';

export function SmartCrossSellSection() {
  const { cart, addToCart } = useApp();
  const { supabase } = useSupabase();

  const [recommendations, setRecommendations] = useState([]);
  const [stylistNote, setStylistNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedMap, setAddedMap] = useState({});

  const cartSignature = cart
    .map((item) => `${item.productId ?? item.id}`)
    .sort()
    .join(',');

  useEffect(() => {
    let isMounted = true;
    if (!cart || cart.length === 0) {
      setRecommendations([]);
      setStylistNote('');
      return undefined;
    }

    setLoading(true);
    getSmartCrossSellProducts(cart, supabase)
      .then(({ products, stylistNote: note }) => {
        if (!isMounted) return;
        setRecommendations(products || []);
        setStylistNote(note || '');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cart, cartSignature, supabase]);

  const handleAddCrossSell = (product) => {
    const normalized = normalizeCatalogProduct(product);
    addToCart(
      {
        id: normalized.id,
        productId: normalized.id,
        name: normalized.name,
        price: normalized.price,
        originalPrice: normalized.originalPrice,
        image: normalized.image,
        category: normalized.category,
        stock: normalized.stock,
      },
      1
    );
    setAddedMap((prev) => ({ ...prev, [normalized.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [normalized.id]: false }));
    }, 1500);
  };

  if (!cart || cart.length === 0) return null;

  return (
    <div className="p-6 sm:p-7 rounded-[28px] border border-neutral-200 bg-neutral-50/70 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 block">
              AI Stylist Pairing
            </span>
            <h3 className="text-sm sm:text-base font-semibold tracking-tight text-neutral-950">
              Complete the Look
            </h3>
          </div>
        </div>
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        )}
      </div>

      {stylistNote && (
        <p className="text-xs text-neutral-600 leading-relaxed">
          {stylistNote}
        </p>
      )}

      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {recommendations.map((product) => {
            const imgSrc = product.image || product.image_url;
            const isAdded = Boolean(addedMap[product.id]);

            return (
              <div
                key={product.id}
                className="flex sm:flex-col justify-between gap-3 p-3 rounded-2xl bg-white border border-neutral-200/80 hover:border-black transition-all"
              >
                <div className="flex sm:flex-col gap-3 min-w-0">
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt={product.name}
                      className="w-16 h-20 sm:w-full sm:h-36 object-cover rounded-xl bg-neutral-100 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 block">
                      {product.category}
                    </span>
                    <p className="text-xs font-semibold text-neutral-950 truncate mt-0.5">
                      {product.name}
                    </p>
                    <p className="text-xs font-semibold text-neutral-800 mt-1 tabular-nums">
                      ${Number(product.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCrossSell(product)}
                  className="self-center sm:self-stretch px-3 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 text-[10px] font-semibold uppercase tracking-[0.16em] inline-flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" /> Add to Bag
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SmartCrossSellSection;
