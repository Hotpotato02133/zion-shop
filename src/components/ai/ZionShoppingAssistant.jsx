import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  ShoppingBag,
  Loader2,
  X,
  Check,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSupabase } from '../../context/SupabaseContext';
import {
  isAiConfigured,
  generateTextEmbedding,
  callGeminiFlash,
  checkAndLogRateLimit,
  getLiveOrFallbackCatalog,
  rankCatalogLocally,
  normalizeCatalogProduct,
} from '../../services/aiService';

const QUICK_PROMPTS = [
  'Minimalist weekend outfit under $150',
  'Rainy day architectural layering',
  'Monochrome travel essentials',
  'Tailored evening look with leather accents',
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  text: "Welcome to ZION Atelier Privé. Tell me the occasion, silhouette, weather, or budget you have in mind — I'll curate a monochrome look and can add pieces directly to your bag.",
  recommendedProducts: [],
};

function buildLocalStylistReply(userQuery, matchedProducts) {
  if (!matchedProducts || matchedProducts.length === 0) {
    return "I couldn't find an exact match in our current capsule, but explore our Tops, Outerwear, and Accessories for foundational monochrome silhouettes.";
  }
  const names = matchedProducts
    .slice(0, 3)
    .map((p) => `${p.name} ($${Number(p.price || 0).toFixed(0)})`)
    .join(', ');
  const total = matchedProducts
    .slice(0, 3)
    .reduce((sum, p) => sum + Number(p.price || 0), 0);

  return `For "${userQuery}", I've curated ${matchedProducts.length} architectural ${
    matchedProducts.length === 1 ? 'piece' : 'pieces'
  } from our collection: ${names}. Together they form a cohesive monochrome silhouette totaling $${total.toFixed(
    0
  )}. You can add individual pieces or the complete edit to your bag below.`;
}

export function ZionShoppingAssistant() {
  const { user } = useUser();
  const { addToCart } = useApp();
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  const markAdded = (key) => {
    setAddedIds((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [key]: false }));
    }, 1800);
  };

  const handleAddSingle = (product, key) => {
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
    markAdded(key);
  };

  const handleAddAllToCart = (products, bundleKey) => {
    products.forEach((product) => {
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
    });
    markAdded(bundleKey);
  };

  const handleSendMessage = async (promptText) => {
    const userMessage = (promptText ?? input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      await checkAndLogRateLimit(user?.id, 'shopping_assistant', 25, supabase);

      // Step 1: Retrieve candidate products (try pgvector RPC first, then fallback to live/fallback catalog)
      let candidates = [];

      if (isAiConfigured && supabase) {
        try {
          const queryVector = await generateTextEmbedding(userMessage);
          const { data: matched, error: rpcErr } = await supabase.rpc('match_products', {
            query_embedding: queryVector,
            match_threshold: 0.3,
            match_count: 8,
          });
          if (!rpcErr && Array.isArray(matched) && matched.length > 0) {
            candidates = matched.map(normalizeCatalogProduct).filter((p) => p.stock > 0);
          }
        } catch {
          // Fallback to catalog ranking below
        }
      }

      if (candidates.length === 0) {
        const fullCatalog = await getLiveOrFallbackCatalog(supabase);
        const ranked = rankCatalogLocally(fullCatalog, userMessage, 8);
        candidates = (ranked.length > 0 ? ranked : fullCatalog.slice(0, 6)).filter(
          (p) => p.stock > 0
        );
      }

      // Step 2: Reason over candidate products with Gemini Flash (or local stylist fallback)
      let replyText = '';
      let finalProducts = candidates.slice(0, 3);

      if (isAiConfigured && candidates.length > 0) {
        try {
          const catalogContext = JSON.stringify(
            candidates.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              category: p.category,
              description: p.description,
              specs: p.specs,
            }))
          );

          const systemPrompt = `You are "Zion AI", a refined, minimalist luxury fashion advisor for ZION Atelier Privé.
Here are the available in-stock pieces matching the customer's request:
${catalogContext}

Customer request: "${userMessage}"

Instructions:
1. Recommend 1 to 4 specific products ONLY from the list above.
2. Respect any budget or occasion constraints mentioned by the customer (all prices are in USD $).
3. Keep your response concise (2 to 3 sentences), warm, and editorial.
4. Return JSON with:
   - "replyText": your stylist recommendation
   - "selectedProductIds": array of exact product IDs you recommend`;

          const aiResponse = await callGeminiFlash({
            prompt: systemPrompt,
            systemInstruction:
              'You are an editorial luxury fashion stylist. Never invent products outside the provided JSON catalog.',
            responseMimeType: 'application/json',
          });

          const selectedIds = Array.isArray(aiResponse?.selectedProductIds)
            ? aiResponse.selectedProductIds.map((id) => String(id))
            : [];
          const picked = candidates.filter((p) => selectedIds.includes(String(p.id)));
          if (picked.length > 0) {
            finalProducts = picked.slice(0, 4);
          }
          if (aiResponse?.replyText) {
            replyText = aiResponse.replyText;
          }
        } catch (aiErr) {
          console.warn('Gemini assistant fallback:', aiErr?.message);
        }
      }

      if (!replyText) {
        replyText = buildLocalStylistReply(userMessage, finalProducts);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: replyText,
          recommendedProducts: finalProducts,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            err?.message ||
            'Our atelier stylist is momentarily unavailable. Please try again shortly.',
          recommendedProducts: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
  };

  return (
    <>
      {/* Floating Atelier AI Trigger Button (bottom-right rounded pill button) */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2.5 bg-black text-white px-5 py-3 sm:px-6 sm:py-3.5 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.32)] border border-white/20 hover:bg-neutral-900 hover:border-white/40 transition-all duration-200 group cursor-pointer"
        aria-label="Open Zion AI Stylist"
      >
        <Sparkles className="w-4 h-4 text-white transition-transform duration-300 group-hover:rotate-12" />
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">
          Ask Zion AI
        </span>
      </motion.button>

      {/* Slide-Over Atelier Stylist Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setIsOpen(false)}
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full sm:w-[440px] max-w-full h-full bg-white text-black flex flex-col shadow-2xl border-l border-neutral-200"
              role="dialog"
              aria-modal="true"
              aria-label="Zion AI Shopping Stylist"
            >
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between bg-black text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-white/25 flex items-center justify-center bg-white/5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-semibold tracking-[0.22em] uppercase">
                        Zion AI Stylist
                      </h2>
                      <span className="text-[9px] tracking-[0.16em] uppercase px-1.5 py-0.5 border border-white/25 text-neutral-300">
                        {isAiConfigured ? 'Gemini Live' : 'Atelier Mode'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Personal curation &amp; 1-click bag builder
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleResetChat}
                    title="Reset conversation"
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    title="Close stylist"
                    className="p-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Starter Prompts */}
              <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] tracking-wide px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 hover:border-black hover:text-black transition-colors disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Feed */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-white"
              >
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 mb-1.5">
                      {msg.role === 'user' ? 'You' : 'Zion Stylist'}
                    </span>

                    <div
                      className={`max-w-[90%] px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-black text-white'
                          : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Recommended Product Cards */}
                    {msg.recommendedProducts?.length > 0 && (
                      <div className="mt-3 w-full space-y-2">
                        {msg.recommendedProducts.map((product) => {
                          const itemKey = `${idx}-${product.id}`;
                          const isAdded = Boolean(addedIds[itemKey]);
                          const imgSrc = product.image || product.image_url;

                          return (
                            <div
                              key={product.id}
                              className="flex items-center justify-between gap-3 p-2.5 border border-neutral-200 bg-white hover:border-black transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={product.name}
                                    className="w-12 h-14 object-cover bg-neutral-100 shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-14 bg-neutral-100 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                                    {product.category}
                                  </p>
                                  <p className="text-xs font-medium text-black truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-xs font-semibold text-neutral-800 mt-0.5">
                                    ${Number(product.price || 0).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsOpen(false);
                                    navigate(
                                      `/products?search=${encodeURIComponent(product.name)}`
                                    );
                                  }}
                                  title="View in collection"
                                  className="p-2 border border-neutral-200 text-neutral-600 hover:border-black hover:text-black transition-colors"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddSingle(product, itemKey)}
                                  className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors flex items-center gap-1 ${
                                    isAdded
                                      ? 'bg-neutral-800 text-white'
                                      : 'bg-black text-white hover:bg-neutral-800'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3 h-3" /> Added
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="w-3 h-3" /> Add
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {msg.recommendedProducts.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAddAllToCart(msg.recommendedProducts, `bundle-${idx}`)
                            }
                            className="w-full py-2.5 px-4 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors text-[11px] font-semibold uppercase tracking-[0.18em] flex items-center justify-center gap-2"
                          >
                            {addedIds[`bundle-${idx}`] ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Complete Edit Added to Bag
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" /> Add All (
                                {msg.recommendedProducts.length} Pieces) to Bag
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2.5 text-xs text-neutral-500 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span className="tracking-wide">
                      Curating pieces from the ZION archive...
                    </span>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe an occasion, fit, or budget..."
                  className="flex-1 bg-white border border-neutral-300 px-3.5 py-2.5 text-xs sm:text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ZionShoppingAssistant;

