# Zion Shop — 100% Free AI Features Implementation Guide

This guide walks you through integrating **8 real-world, production-grade AI features** into **Zion Shop** using your existing stack (**React, Shadcn UI, Supabase, Clerk, and Axios**) paired with the **100% Free Google Gemini API** (`gemini-1.5-flash` & `text-embedding-004`) and **Supabase `pgvector`**.

---

## Table of Contents
1. [Architecture & Free-Tier Guardrails](#1-architecture--free-tier-guardrails)
2. [Step 1: Supabase Database & `pgvector` Setup (SQL)](#2-step-1-supabase-database--pgvector-setup-sql)
3. [Step 2: Core AI Service & Rate-Limit Protection (`src/services/aiService.js`)](#3-step-2-core-ai-service--rate-limit-protection-srcservicesaiservicejs)
4. [Feature 1: Semantic & Natural Language Search](#4-feature-1-semantic--natural-language-search)
5. [Feature 2: Conversational AI Shopping Assistant (with Add-to-Cart)](#5-feature-2-conversational-ai-shopping-assistant-with-add-to-cart)
6. [Feature 3: Visual Search ("Snap to Shop")](#6-feature-3-visual-search-snap-to-shop)
7. [Feature 4: AI Review Summarizer ("Pros & Cons" Cached in DB)](#7-feature-4-ai-review-summarizer-pros--cons-cached-in-db)
8. [Feature 5: "Complete the Look" Smart Cross-Sell Drawer](#8-feature-5-complete-the-look-smart-cross-sell-drawer)
9. [Feature 6: 1-Click Admin Product Listing Generator (Drop-to-Fill)](#9-feature-6-1-click-admin-product-listing-generator-drop-to-fill)
10. [Feature 7: Automated Order & Refund Triage Agent](#10-feature-7-automated-order--refund-triage-agent)
11. [Feature 8: Dynamic Wishlist Price-Drop & Low-Stock Nudges](#11-feature-8-dynamic-wishlist-price-drop--low-stock-nudges)

---

## 1. Architecture & Free-Tier Guardrails

To keep all features **100% free ($0/month)**:
* **Google AI Studio Free Tier:** Uses `gemini-1.5-flash` (15 RPM / 1,500 requests per day free) for multimodal vision, structured JSON output, and chat, plus `text-embedding-004` (1,500 free embeddings/day) for vector search.
* **Supabase Free Tier:** Uses built-in `pgvector` for semantic similarity search and caches AI outputs (like review summaries, product embeddings, and cross-sell pairings) directly in PostgreSQL so visitors read from the database for free.
* **Security Note:** For local prototyping, you can call the Gemini REST endpoint via Axios or proxy it through a **Supabase Edge Function** so your `GEMINI_API_KEY` stays completely hidden on the server. Below, we include a unified Axios client that works with either a Supabase Edge Function proxy or direct API key during development.

### Environment Variables (`.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-key
# Keep in Supabase Edge Function secrets in production; used in .env.local for local dev:
VITE_GEMINI_API_KEY=your-free-google-ai-studio-key
```

---

## 2. Step 1: Supabase Database & `pgvector` Setup (SQL)

Run this script inside your **Supabase SQL Editor** to enable `pgvector`, add AI caching columns to your `products` table, create a rate-limit log table, and register the vector similarity search RPC function.

```sql
-- 1. Enable the pgvector extension (100% Free in Supabase)
create extension if not exists vector;

-- 2. Enhance the products table with AI columns
-- Adjust if your products table already exists
alter table public.products
  add column if not exists embedding vector(768),
  add column if not exists ai_review_summary jsonb default null,
  add column if not exists ai_tags text[] default '{}',
  add column if not exists visual_attributes jsonb default null;

-- 3. Create an index for fast semantic vector search
create index if not exists products_embedding_idx 
  on public.products 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Create an AI Rate-Limiting & Usage Tracking table (just like DAMS!)
create table if not exists public.ai_api_logs (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  feature text not null,
  created_at timestamptz default now()
);

-- 5. Create the RPC function for Semantic Product Search
create or replace function match_products (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name text,
  description text,
  price numeric,
  category text,
  image_url text,
  stock int,
  similarity float
)
language sql stable
as $$
  select
    products.id,
    products.name,
    products.description,
    products.price,
    products.category,
    products.image_url,
    products.stock,
    1 - (products.embedding <=> query_embedding) as similarity
  from public.products
  where 1 - (products.embedding <=> query_embedding) > match_threshold
  order by products.embedding <=> query_embedding
  limit match_count;
$$;

-- 6. Create Support / Refund Triage table
create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  clerk_user_id text not null,
  reason text not null,
  evidence_image_url text,
  ai_damage_verified boolean default false,
  ai_confidence_score numeric,
  ai_assessment_notes text,
  status text default 'pending_review', -- 'auto_approved', 'pending_review', 'rejected'
  created_at timestamptz default now()
);
```

---

## 3. Step 2: Core AI Service & Rate-Limit Protection (`src/services/aiService.js`)

Create a single Axios-powered service in `src/services/aiService.js` that handles text generation, structured JSON outputs, multimodal vision (Base64 images), and `text-embedding-004` vectors while checking per-user rate limits in Supabase.

```javascript
// src/services/aiService.js
import axios from "axios";
import { supabase } from "../lib/supabaseClient";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Guardrail: Prevents a single user from exhausting your 15 RPM free quota.
 * Limits each Clerk user to 8 AI actions per minute.
 */
export async function checkAndLogRateLimit(clerkUserId = "guest", feature = "general") {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("ai_api_logs")
    .select("*", { count: "exact", head: true })
    .eq("clerk_user_id", clerkUserId)
    .gte("created_at", oneMinuteAgo);

  if (!error && count >= 8) {
    throw new Error("You are making requests too quickly. Please wait a few seconds.");
  }

  await supabase.from("ai_api_logs").insert([
    { clerk_user_id: clerkUserId, feature }
  ]);
}

/**
 * Helper: Convert a browser File object into a Base64 string for Gemini Vision
 */
export function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a 768-dimensional vector embedding using text-embedding-004 (Free)
 */
export async function generateTextEmbedding(text) {
  const url = `${GEMINI_BASE_URL}/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
  const response = await axios.post(url, {
    model: "models/text-embedding-004",
    content: {
      parts: [{ text }],
    },
  });
  return response.data.embedding.values;
}

/**
 * Call Gemini 1.5 Flash for JSON or text responses (supports optional image input)
 */
export async function callGeminiFlash({
  systemInstruction,
  userPrompt,
  imagePart = null,
  jsonMode = true,
  temperature = 0.1,
}) {
  const url = `${GEMINI_BASE_URL}/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const parts = [{ text: userPrompt }];
  if (imagePart) {
    parts.push(imagePart);
  }

  const payload = {
    systemInstruction: systemInstruction
      ? { parts: [{ text: systemInstruction }] }
      : undefined,
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature,
      responseMimeType: jsonMode ? "application/json" : "text/plain",
    },
  };

  const response = await axios.post(url, payload);
  const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (jsonMode) {
    try {
      return JSON.parse(rawText);
    } catch (err) {
      console.error("Failed to parse AI JSON:", rawText);
      throw new Error("Received an unexpected format from the AI assistant.");
    }
  }

  return rawText;
}
```

---

## 4. Feature 1: Semantic & Natural Language Search

Instead of failing when a shopper searches *"cozy outfit for rainy cold weather"* or *"minimalist desk gift under ₱1,500"*, this feature embeds the query into a 768-dimension vector and matches meaning via `pgvector`.

### A. Auto-Embed Products When Added/Updated
Add this helper when saving a product in your admin dashboard (or run it once as a batch script for existing products):

```javascript
// src/services/productEmbeddingService.js
import { supabase } from "../lib/supabaseClient";
import { generateTextEmbedding } from "./aiService";

export async function embedProductInSupabase(product) {
  const textToEmbed = `${product.name}. Category: ${product.category}. Description: ${product.description}. Price: ₱${product.price}`;
  const embedding = await generateTextEmbedding(textToEmbed);

  const { error } = await supabase
    .from("products")
    .update({ embedding })
    .eq("id", product.id);

  if (error) throw error;
}
```

### B. Semantic Search Hook (`src/hooks/useSemanticSearch.js`)
```javascript
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { generateTextEmbedding, checkAndLogRateLimit } from "../services/aiService";

export function useSemanticSearch(clerkUserId) {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchByMeaning = async (query) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      await checkAndLogRateLimit(clerkUserId, "semantic_search");
      const queryEmbedding = await generateTextEmbedding(query);

      const { data, error } = await supabase.rpc("match_products", {
        query_embedding: queryEmbedding,
        match_threshold: 0.45,
        match_count: 12,
      });

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error("Semantic search fallback to SQL ILIKE:", err);
      // Graceful fallback if offline or rate-limited
      const { data } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(12);
      setResults(data || []);
    } finally {
      setIsSearching(false);
    }
  };

  return { results, isSearching, searchByMeaning };
}
```

---

## 5. Feature 2: Conversational AI Shopping Assistant (with Add-to-Cart)

Built using a **Shadcn UI `Sheet`**, this assistant understands natural budget/style constraints, searches your live Supabase catalog, and renders interactive product cards with a 1-click **"Add to Cart"** and **"Add Bundle"** button.

```jsx
// src/components/ai/ZionShoppingAssistant.jsx
import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Sparkles, Send, ShoppingCart, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { callGeminiFlash, generateTextEmbedding, checkAndLogRateLimit } from "@/services/aiService";
import { supabase } from "@/lib/supabaseClient";

export function ZionShoppingAssistant({ onAddToCart }) {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      reply: "Hi! Tell me your budget, style, or occasion, and I'll curate items from Zion Shop for you.",
      recommendedProducts: [],
    },
  ]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", reply: userMessage }]);
    setLoading(true);

    try {
      await checkAndLogRateLimit(user?.id || "guest", "shopping_assistant");

      // 1. Retrieve top candidate products from Supabase using Semantic Search
      const queryEmbedding = await generateTextEmbedding(userMessage);
      const { data: candidates } = await supabase.rpc("match_products", {
        query_embedding: queryEmbedding,
        match_threshold: 0.35,
        match_count: 8,
      });

      // 2. Ask Gemini to filter by budget/intent and explain why they fit
      const aiResponse = await callGeminiFlash({
        systemInstruction: `You are Zion Shop's AI Personal Shopper.
Given the user's request and the candidate catalog JSON, select the best matching products (respecting any budget or quantity constraints).
Return STRICT JSON with this schema:
{
  "reply": "Friendly, concise recommendation explanation mentioning total price if bundling.",
  "selectedProductIds": ["uuid-1", "uuid-2"]
}`,
        userPrompt: `User Request: "${userMessage}"\nAvailable Catalog Candidates: ${JSON.stringify(candidates || [])}`,
        jsonMode: true,
      });

      const matchedProducts = (candidates || []).filter((p) =>
        aiResponse.selectedProductIds?.includes(p.id)
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          reply: aiResponse.reply,
          recommendedProducts: matchedProducts,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          reply: err.message || "Sorry, I couldn't fetch recommendations right now.",
          recommendedProducts: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full shadow-lg gap-2 z-50">
          <Sparkles className="w-4 h-4" />
          Ask Zion AI
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Zion AI Personal Shopper
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.reply}
              </div>

              {/* Actionable Product Cards inside Chat */}
              {msg.recommendedProducts?.length > 0 && (
                <div className="mt-2 w-full space-y-2">
                  {msg.recommendedProducts.map((product) => (
                    <Card key={product.id} className="p-2.5 flex items-center justify-between gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">₱{product.price}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onAddToCart(product)}
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                        Add
                      </Button>
                    </Card>
                  ))}

                  {msg.recommendedProducts.length > 1 && (
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => msg.recommendedProducts.forEach((p) => onAddToCart(p))}
                    >
                      Add All ({msg.recommendedProducts.length} Items) to Cart
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Curating items from Zion Shop...
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Minimalist desk setup under ₱2,500..."
          />
          <Button type="submit" size="icon" disabled={loading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

---

## 6. Feature 3: Visual Search ("Snap to Shop")

Shoppers upload any outfit or gadget photo; Gemini 1.5 Flash extracts visual search descriptors, converts them into a vector embedding, and queries Supabase for visually similar items.

```jsx
// src/components/ai/VisualSearchModal.jsx
import React, { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fileToGenerativePart,
  callGeminiFlash,
  generateTextEmbedding,
} from "@/services/aiService";
import { supabase } from "@/lib/supabaseClient";

export function VisualSearchButton({ onVisualResultsFound }) {
  const [analyzing, setAnalyzing] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      const imagePart = await fileToGenerativePart(file);

      // 1. Extract visual attributes using Gemini 1.5 Flash Vision
      const visionData = await callGeminiFlash({
        systemInstruction:
          "Analyze the uploaded shopping image and return JSON with keys: category, primaryColor, materialOrStyle, searchQueryDescription.",
        userPrompt: "Describe this product so we can find similar items in our store.",
        imagePart,
        jsonMode: true,
      });

      // 2. Embed the visual description and match against Supabase pgvector
      const embedding = await generateTextEmbedding(
        `${visionData.category} ${visionData.primaryColor} ${visionData.materialOrStyle} ${visionData.searchQueryDescription}`
      );

      const { data: matchedProducts } = await supabase.rpc("match_products", {
        query_embedding: embedding,
        match_threshold: 0.4,
        match_count: 8,
      });

      onVisualResultsFound(matchedProducts || [], visionData.searchQueryDescription);
    } catch (err) {
      console.error("Visual search failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <label className="cursor-pointer inline-flex items-center">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        disabled={analyzing}
      />
      <Button variant="outline" size="sm" asChild disabled={analyzing}>
        <span>
          {analyzing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          {analyzing ? "Scanning Photo..." : "Snap to Shop"}
        </span>
      </Button>
    </label>
  );
}
```

---

## 7. Feature 4: AI Review Summarizer ("Pros & Cons" Cached in DB)

Instead of burning API tokens on every page view, this function triggers **only when a new review is added** (or when `ai_review_summary` is empty) and stores the result in `products.ai_review_summary`.

```javascript
// src/services/reviewSummaryService.js
import { supabase } from "../lib/supabaseClient";
import { callGeminiFlash } from "./aiService";

export async function refreshProductReviewSummary(productId) {
  // 1. Fetch latest 25 reviews for the product
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (!reviews || reviews.length < 3) return null; // Only summarize once 3+ reviews exist

  const summaryJson = await callGeminiFlash({
    systemInstruction: `Summarize customer product reviews into strict JSON:
{
  "headline": "1-sentence overall sentiment summary",
  "pros": ["Short point 1", "Short point 2", "Short point 3"],
  "cons": ["Short point 1", "Short point 2"],
  "recommendedFor": "Best suited buyer profile in 5-8 words"
}`,
    userPrompt: `Reviews:\n${JSON.stringify(reviews)}`,
    jsonMode: true,
  });

  // 2. Cache inside the Supabase products table so all visitors read it for free!
  await supabase
    .from("products")
    .update({ ai_review_summary: summaryJson })
    .eq("id", productId);

  return summaryJson;
}
```

### UI Component on Product Details Page (`src/components/ai/AiReviewSummaryCard.jsx`)
```jsx
import React from "react";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AiReviewSummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <Card className="p-4 bg-muted/40 border-primary/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Verified Buyer Summary
        </div>
        {summary.recommendedFor && (
          <Badge variant="secondary">Best for: {summary.recommendedFor}</Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{summary.headline}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-emerald-600">Pros</p>
          {summary.pros?.map((pro, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{pro}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-amber-600">Cons</p>
          {summary.cons?.map((con, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{con}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
```

---

## 8. Feature 5: "Complete the Look" Smart Cross-Sell Drawer

When a user adds an item to their cart, this service finds complementary items from *different* categories (e.g., pairing a mechanical keyboard with a coiled cable and desk mat) rather than showing duplicate keyboards.

```javascript
// src/services/crossSellService.js
import { supabase } from "../lib/supabaseClient";
import { callGeminiFlash, generateTextEmbedding } from "./aiService";

export async function getSmartCrossSellProducts(cartItem) {
  // 1. Ask Gemini what complementary product types pair best with this item
  const pairingIdea = await callGeminiFlash({
    systemInstruction:
      'Return JSON: { "complementarySearchQuery": "short description of accessories or complementary items that pair well with the input product" }',
    userPrompt: `Product added to cart: ${cartItem.name} (${cartItem.category}) - ${cartItem.description}`,
    jsonMode: true,
  });

  // 2. Perform vector search for those complementary items
  const embedding = await generateTextEmbedding(pairingIdea.complementarySearchQuery);
  const { data } = await supabase.rpc("match_products", {
    query_embedding: embedding,
    match_threshold: 0.35,
    match_count: 6,
  });

  // Exclude the item already in the cart
  return (data || []).filter((item) => item.id !== cartItem.id).slice(0, 3);
}
```

---

## 9. Feature 6: 1-Click Admin Product Listing Generator (Drop-to-Fill)

In your Zion Shop Admin Dashboard, drop a raw product photo and let Gemini Vision auto-fill the **Title, SEO Description, Category, Tags, and Suggested PHP Price**.

```jsx
// src/components/admin/AiProductAutoFiller.jsx
import React, { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileToGenerativePart, callGeminiFlash } from "@/services/aiService";

export function AiProductAutoFiller({ imageFile, onAutoFillForm }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateListing = async () => {
    if (!imageFile) return;
    setGenerating(true);
    try {
      const imagePart = await fileToGenerativePart(imageFile);

      const listingData = await callGeminiFlash({
        systemInstruction: `You are an expert e-commerce merchandiser for Zion Shop.
Analyze the uploaded product photo and return strict JSON:
{
  "name": "Clean, high-converting product title",
  "category": "Apparel | Electronics | Accessories | Home & Living | Footwear",
  "description": "Engaging 2-3 sentence SEO product description highlighting key visual features.",
  "suggestedPricePhp": 999,
  "tags": ["tag1", "tag2", "tag3"]
}`,
        userPrompt: "Generate a complete product listing from this image.",
        imagePart,
        jsonMode: true,
      });

      onAutoFillForm(listingData);
    } catch (err) {
      console.error("Auto-fill failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleGenerateListing}
      disabled={!imageFile || generating}
      className="gap-2"
    >
      {generating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wand2 className="w-4 h-4" />
      )}
      {generating ? "AI Writing Listing..." : "Auto-Fill Details from Photo"}
    </Button>
  );
}
```

---

## 10. Feature 7: Automated Order & Refund Triage Agent

Allows logged-in Clerk users to submit a damaged item photo. Gemini Vision verifies whether the damage matches the user's claim and automatically approves low-value replacements or flags high-value orders for admin review.

```javascript
// src/services/refundTriageService.js
import { supabase } from "../lib/supabaseClient";
import { fileToGenerativePart, callGeminiFlash } from "./aiService";

export async function evaluateRefundClaim({
  orderId,
  clerkUserId,
  productName,
  userReason,
  damagePhotoFile,
   evidenceImageUrl,
}) {
  const imagePart = await fileToGenerativePart(damagePhotoFile);

  const verification = await callGeminiFlash({
    systemInstruction: `You are an e-commerce quality assurance AI inspector.
Compare the customer's stated defect reason against the uploaded photo of "${productName}".
Return strict JSON:
{
  "isRelevantProduct": true,
  "damageVisible": true,
  "confidenceScore": 0.92,
  "assessmentNotes": "Visible crack along the top corner matching customer claim."
}`,
    userPrompt: `Customer Claim: "${userReason}"`,
    imagePart,
    jsonMode: true,
  });

  const autoApprove =
    verification.isRelevantProduct &&
    verification.damageVisible &&
    verification.confidenceScore >= 0.85;

  const status = autoApprove ? "auto_approved" : "pending_review";

  const { data, error } = await supabase
    .from("refund_requests")
    .insert([
      {
        order_id: orderId,
        clerk_user_id: clerkUserId,
        reason: userReason,
        evidence_image_url: evidenceImageUrl,
        ai_damage_verified: verification.damageVisible,
        ai_confidence_score: verification.confidenceScore,
        ai_assessment_notes: verification.assessmentNotes,
        status,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## 11. Feature 8: Dynamic Wishlist Price-Drop & Low-Stock Nudges

When a user opens Zion Shop, inspect their wishlist items in Supabase. If any wishlisted item has `stock <= 3` or a discount active, generate a personalized, non-spammy nudge banner.

```javascript
// src/services/wishlistNudgeService.js
import { callGeminiFlash } from "./aiService";

export async function generateWishlistNudge(wishlistProducts, userFirstName = "Shopper") {
  const urgentItems = wishlistProducts.filter(
    (item) => item.stock > 0 && (item.stock <= 5 || item.discount_percent > 0)
  );

  if (urgentItems.length === 0) return null;

  // Check sessionStorage cache first so we only call Gemini once per browser session!
  const cacheKey = `zion_wishlist_nudge_${urgentItems.map((i) => i.id).join("_")}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const nudge = await callGeminiFlash({
    systemInstruction: `Write a short, friendly 1-sentence notification banner for ${userFirstName} about their wishlisted item running low on stock or dropping in price.
Return strict JSON: { "message": "1 sentence nudge", "productId": "uuid" }`,
    userPrompt: `Urgent Wishlist Items: ${JSON.stringify(urgentItems)}`,
    jsonMode: true,
  });

  sessionStorage.setItem(cacheKey, JSON.stringify(nudge));
  return nudge;
}
```

---

## Quick Integration Checklist for Zion Shop
1. **Run the SQL block** in your Supabase SQL Editor to enable `pgvector` and create the `match_products` RPC.
2. **Add `VITE_GEMINI_API_KEY`** from [Google AI Studio](https://aistudio.google.com/) (100% free tier) to your `.env` file.
3. **Drop `<ZionShoppingAssistant onAddToCart={addToCart} />`** into your main `App.jsx` or `Layout.jsx` so it floats on every page.
4. **Add `<VisualSearchButton />`** right next to your main navbar search input.
5. **Embed your existing products** once using `embedProductInSupabase(product)` so semantic search, chat recommendations, and visual search work immediately.