import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Eye, EyeOff, Loader2, Pencil, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { useAdminAlerts } from './AdminAlerts'
import { useSupabase } from '../../context/SupabaseContext'
import { friendlyError, money } from '../../lib/orders'
import { AiProductAutoFiller } from '../../components/admin/AiProductAutoFiller'
import { embedProductInSupabase, embedAllProductsInSupabase } from '../../services/productEmbeddingService'

const DEFAULT_CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories']
const EMPTY = {
  name: '', description: '', price: '', original_price: '', category: 'Tops', tag: '',
  stock: 10, low_stock_threshold: 5, image_url: '', gallery: '', specs: '', is_active: true
}

const inputClass = 'w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors'

// "Material: Cotton" per line  <->  { Material: 'Cotton' }
const parseSpecs = (text) =>
  Object.fromEntries(
    text.split('\n').map(line => line.split(/:(.*)/s)).filter(([k, v]) => k?.trim() && v?.trim()).map(([k, v]) => [k.trim(), v.trim()])
  )
const formatSpecs = (specs) => Object.entries(specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n')

const Field = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</span>
    {children}
  </label>
)

const ProductForm = ({ product, categories, onClose, onSaved }) => {
  const { supabase } = useSupabase()
  const [form, setForm] = useState(() => product
    ? {
        ...EMPTY, ...product,
        price: product.price, original_price: product.original_price ?? '',
        tag: product.tag ?? '', image_url: product.image_url ?? '',
        gallery: (product.gallery || []).join('\n'), specs: formatSpecs(product.specs)
      }
    : EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleUpload = async (file) => {
    if (!file) return
    setImageFile(file)
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '31536000' })
    if (uploadError) {
      setError(friendlyError(uploadError))
    } else {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm(prev => ({ ...prev, image_url: data.publicUrl }))
    }
    setUploading(false)
  }

  const handleAiAutoFill = (aiListing) => {
    setForm(prev => ({
      ...prev,
      name: aiListing.name || prev.name,
      category: aiListing.category || prev.category,
      description: aiListing.description || prev.description,
      price: aiListing.price ?? prev.price,
      original_price: aiListing.original_price ?? prev.original_price,
      tag: aiListing.tag ?? prev.tag,
      specs: aiListing.specsText || prev.specs
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      original_price: form.original_price === '' ? null : Number(form.original_price),
      category: form.category.trim(),
      tag: form.tag.trim() || null,
      stock: Math.max(0, parseInt(form.stock, 10) || 0),
      low_stock_threshold: Math.max(0, parseInt(form.low_stock_threshold, 10) || 0),
      image_url: form.image_url.trim() || null,
      gallery: form.gallery.split('\n').map(s => s.trim()).filter(Boolean),
      specs: parseSpecs(form.specs),
      is_active: form.is_active
    }

    const query = product
      ? supabase.from('products').update(payload).eq('id', product.id).select().single()
      : supabase.from('products').insert(payload).select().single()
    const { data: savedRow, error: saveError } = await query
    setSaving(false)
    if (saveError) {
      setError(friendlyError(saveError))
      return
    }
    if (savedRow) {
      embedProductInSupabase(savedRow, supabase).catch(err =>
        console.warn('Background AI embedding skipped:', err?.message)
      )
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-auto">
        <button type="button" onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400" aria-label="Close">
          <X size={16} />
        </button>
        <h2 className="font-heading text-2xl font-semibold text-neutral-950 dark:text-white">{product ? 'Edit product' : 'Add product'}</h2>

        <Field label="Name"><input required className={inputClass} value={form.name} onChange={update('name')} /></Field>
        <Field label="Description">
          <textarea rows={3} className={inputClass} value={form.description} onChange={update('description')} />
        </Field>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Field label="Price ($)">
            <input required type="number" min="0" step="0.01" className={inputClass} value={form.price} onChange={update('price')} />
          </Field>
          <Field label="Compare-at ($)">
            <input type="number" min="0" step="0.01" className={inputClass} value={form.original_price} onChange={update('original_price')} />
          </Field>
          <Field label="Stock">
            <input required type="number" min="0" step="1" className={inputClass} value={form.stock} onChange={update('stock')} />
          </Field>
          <Field label="Alert at">
            <input required type="number" min="0" step="1" title="Notify me when stock falls to this number" className={inputClass} value={form.low_stock_threshold} onChange={update('low_stock_threshold')} />
          </Field>
          <Field label="Tag">
            <input placeholder="New In" className={inputClass} value={form.tag} onChange={update('tag')} />
          </Field>
        </div>

        <Field label="Category">
          <input required list="product-categories" className={inputClass} value={form.category} onChange={update('category')} />
          <datalist id="product-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
        </Field>

        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Main image</span>
          <div className="flex gap-3 items-start">
            {form.image_url && <img src={form.image_url} alt="" className="w-20 h-24 rounded-xl object-cover bg-neutral-100 dark:bg-neutral-800 shrink-0" />}
            <div className="flex-1 space-y-2">
              <input placeholder="https://… image URL" className={inputClass} value={form.image_url} onChange={update('image_url')} />
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload image'}
                  <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={e => handleUpload(e.target.files?.[0])} />
                </label>
                <AiProductAutoFiller
                  imageFile={imageFile}
                  imageUrl={form.image_url}
                  currentName={form.name}
                  onAutoFillForm={handleAiAutoFill}
                />
              </div>
            </div>
          </div>
        </div>

        <Field label="Gallery image URLs (one per line)">
          <textarea rows={2} className={inputClass} value={form.gallery} onChange={update('gallery')} />
        </Field>
        <Field label="Specs (one per line, “Label: value”)">
          <textarea rows={4} placeholder={'Material: 100% Cotton\nSizes: S, M, L'} className={`${inputClass} font-mono text-xs`} value={form.specs} onChange={update('specs')} />
        </Field>

        <label className="flex items-center gap-3 text-sm text-neutral-800 dark:text-neutral-200">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} className="w-5 h-5 rounded text-black focus:ring-black dark:focus:ring-white dark:bg-neutral-800 dark:border-neutral-700" />
          Visible in the store
        </label>

        {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl p-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider transition-colors">Cancel</button>
          <button type="submit" disabled={saving || uploading} className="px-5 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold uppercase tracking-wider disabled:opacity-60 hover:bg-black dark:hover:bg-neutral-200 transition-colors">
            {saving ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </form>
    </div>
  )
}

const AdminProducts = () => {
  const { supabase } = useSupabase()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const [searchParams, setSearchParams] = useSearchParams()
  const { refresh: refreshAlerts, lastUpdated } = useAdminAlerts()
  const lowOnly = searchParams.get('filter') === 'low'
  const [restockId, setRestockId] = useState(null)
  const [restockQty, setRestockQty] = useState(10)
  const [embeddingProgress, setEmbeddingProgress] = useState(null)

  const handleSyncAllEmbeddings = useCallback(async () => {
    if (embeddingProgress) return
    setEmbeddingProgress({ current: 0, total: products.length || 19, status: 'Starting…' })
    try {
      const result = await embedAllProductsInSupabase(supabase, ({ current, total, name }) => {
        setEmbeddingProgress({ current, total, status: `Indexing ${current}/${total}: ${name}` })
      })
      setEmbeddingProgress({
        current: result.total,
        total: result.total,
        status: `Indexed ${result.embedded}/${result.total} products`
      })
      setTimeout(() => setEmbeddingProgress(null), 3500)
    } catch (err) {
      setError(err?.message || 'Failed to sync AI vector embeddings')
      setEmbeddingProgress(null)
    }
  }, [embeddingProgress, products.length, supabase])

  const load = useCallback(async () => {
    const { data, error: fetchError } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (fetchError) setError(fetchError.message)
    const rows = data || []
    setProducts(rows)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load, lastUpdated])

  const categories = useMemo(
    () => [...new Set([...DEFAULT_CATEGORIES, ...products.map(p => p.category).filter(Boolean)])],
    [products]
  )

  const isLow = (p) => p.stock <= (p.low_stock_threshold ?? 5)
  const lowCount = products.filter(p => p.is_active && isLow(p)).length
  const visible = products
    .filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .filter(p => !lowOnly || (p.is_active && isLow(p)))
    .sort((a, b) => (lowOnly ? a.stock - b.stock : 0))

  const restock = async (product) => {
    const qty = parseInt(restockQty, 10)
    if (!qty || qty < 1) return
    const { error: updateError } = await supabase.from('products').update({ stock: product.stock + qty }).eq('id', product.id)
    if (updateError) {
      setError(friendlyError(updateError))
      return
    }
    setRestockId(null)
    load()
    refreshAlerts()
  }

  const toggleActive = async (product) => {
    const { error: updateError } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    if (updateError) setError(friendlyError(updateError))
    else load()
  }

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? Past orders keep their own copy of the item.`)) return
    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id)
    if (deleteError) setError(friendlyError(deleteError))
    else load()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products…"
            className="flex-1 sm:w-72 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white"
          />
          <button
            onClick={() => setSearchParams(lowOnly ? {} : { filter: 'low' })}
            aria-pressed={lowOnly}
            className={`inline-flex items-center gap-2 px-4 rounded-xl border text-xs font-semibold transition-colors ${
              lowOnly 
                ? 'bg-amber-500 border-amber-500 text-white' 
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <AlertTriangle size={14} /> Low stock {lowCount > 0 && `(${lowCount})`}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={Boolean(embeddingProgress)}
            onClick={handleSyncAllEmbeddings}
            title="Generate 768-dim Gemini vector embeddings for all products in Supabase"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-60"
          >
            {embeddingProgress ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{embeddingProgress.status}</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Sync AI Embeddings</span>
              </>
            )}
          </button>
          <button
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-black dark:hover:bg-neutral-200 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Plus size={14} /> Add product
          </button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-xs overflow-x-auto transition-colors">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium border-b border-neutral-100 dark:border-neutral-800">
            <tr>
              <th className="p-4">Product</th><th className="p-4">Category</th>
              <th className="p-4 text-right">Price</th><th className="p-4 text-right">Stock</th>
              <th className="p-4">Status</th><th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-400 dark:text-neutral-500">Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-400 dark:text-neutral-500">{lowOnly ? 'Nothing needs restocking. 🎉' : 'No products yet. Add your first one.'}</td></tr>
            ) : visible.map(p => (
              <tr key={p.id} className={`${p.is_active ? '' : 'opacity-60'} hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50 transition-colors`}>
                <td className="p-4">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    {p.image_url && <img src={p.image_url} alt="" className="w-10 h-12 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800" />}
                    <span className="font-semibold text-neutral-900 dark:text-white">{p.name}</span>
                  </div>
                </td>
                <td className="p-4 text-neutral-500 dark:text-neutral-400">{p.category}</td>
                <td className="p-4 text-right text-neutral-900 dark:text-white">{money(p.price)}</td>
                <td className="p-4 text-right">
                  {restockId === p.id ? (
                    <form onSubmit={e => { e.preventDefault(); restock(p) }} className="inline-flex items-center gap-1">
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">+</span>
                      <input
                        autoFocus type="number" min="1" value={restockQty} onChange={e => setRestockQty(e.target.value)}
                        className="w-16 p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm text-right" aria-label={`Units to add to ${p.name}`}
                      />
                      <button type="submit" className="px-2 py-1.5 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold">Add</button>
                      <button type="button" onClick={() => setRestockId(null)} className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" aria-label="Cancel restock"><X size={13} /></button>
                    </form>
                  ) : (
                    <div className="inline-flex items-center gap-2 justify-end">
                      <span className={`font-semibold ${p.stock === 0 ? 'text-red-600 dark:text-red-400' : isLow(p) ? 'text-amber-700 dark:text-amber-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                        {p.stock === 0 ? 'Sold out' : p.stock}
                      </span>
                      <button
                        onClick={() => { setRestockId(p.id); setRestockQty(10) }}
                        className={`px-2 py-1 rounded-lg border text-xs font-medium transition-colors ${
                          isLow(p) 
                            ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' 
                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        + Restock
                      </button>
                    </div>
                  )}
                </td>
                <td className="p-4 text-xs text-neutral-600 dark:text-neutral-400">{p.is_active ? 'Visible' : 'Hidden'}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(p)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400" title="Edit" aria-label={`Edit ${p.name}`}><Pencil size={15} /></button>
                    <button onClick={() => toggleActive(p)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400" title={p.is_active ? 'Hide' : 'Show'} aria-label={p.is_active ? `Hide ${p.name}` : `Show ${p.name}`}>
                      {p.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => remove(p)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400" title="Delete" aria-label={`Delete ${p.name}`}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); refreshAlerts() }}
        />
      )}
    </div>
  )
}

export default AdminProducts
