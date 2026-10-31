import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useSupabase } from './SupabaseContext'
import { 
  ADD_TO_CART, 
  REMOVE_FROM_CART, 
  UPDATE_CART_QUANTITY, 
  ADD_TO_WISHLIST, 
  REMOVE_FROM_WISHLIST, 
  CLEAR_CART, 
  CLEAR_WISHLIST,
  SET_CART,
  SET_WISHLIST,
  SET_SYNC_LOADING,
  initialState 
} from './constants'

const LOCAL_STORAGE_CART_KEY = 'zion_atelier_cart'
const LOCAL_STORAGE_WISHLIST_KEY = 'zion_atelier_wishlist'

// Helper to normalize product objects
const normalizeProduct = (item) => {
  const productId = item.productId ?? item.id
  let price = item.price
  if (typeof price === 'string') {
    const parsed = parseFloat(price.replace(/[^0-9.-]+/g, ''))
    if (!isNaN(parsed)) price = parsed
  }
  return {
    ...item,
    productId,
    price
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (value) => UUID_RE.test(String(value))

// Map a `products` row from Supabase onto the shape the UI uses
const mapDbProduct = (row) => ({
  ...row,
  productId: row.id,
  price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
  originalPrice: row.original_price ? parseFloat(row.original_price) : null,
  image: row.image_url || row.image,
  reviews: row.reviews_count ?? row.reviews ?? 0
})

// Initial state with local storage fallback
const getInitialState = () => {
  try {
    const savedCart = localStorage.getItem(LOCAL_STORAGE_CART_KEY)
    const savedWishlist = localStorage.getItem(LOCAL_STORAGE_WISHLIST_KEY)
    return {
      ...initialState,
      cart: savedCart ? JSON.parse(savedCart).map(normalizeProduct) : [],
      wishlist: savedWishlist ? JSON.parse(savedWishlist).map(normalizeProduct) : []
    }
  } catch (err) {
    console.warn('[Zion Atelier] Error loading local storage cache:', err)
    return initialState
  }
}

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case SET_CART:
      return {
        ...state,
        cart: action.payload.map(normalizeProduct)
      }

    case SET_WISHLIST:
      return {
        ...state,
        wishlist: action.payload.map(normalizeProduct)
      }

    case SET_SYNC_LOADING:
      return {
        ...state,
        isSyncing: action.payload
      }

    case ADD_TO_CART: {
      const normalized = normalizeProduct(action.payload)
      const amount = action.quantity || 1
      const existingCartItem = state.cart.find(item => item.productId === normalized.productId)
      if (existingCartItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.productId === normalized.productId
              ? { ...item, quantity: item.quantity + amount }
              : item
          )
        }
      }
      return {
        ...state,
        cart: [...state.cart, { ...normalized, quantity: amount }]
      }
    }

    case REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter(item => item.productId !== action.payload && item.id !== action.payload)
      }

    case UPDATE_CART_QUANTITY:
      return {
        ...state,
        cart: state.cart.map(item =>
          (item.productId === action.payload.productId || item.id === action.payload.productId)
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      }

    case ADD_TO_WISHLIST: {
      const normalized = normalizeProduct(action.payload)
      const existingWishlistItem = state.wishlist.find(item => item.productId === normalized.productId)
      if (existingWishlistItem) {
        return state
      }
      return {
        ...state,
        wishlist: [...state.wishlist, normalized]
      }
    }

    case REMOVE_FROM_WISHLIST:
      return {
        ...state,
        wishlist: state.wishlist.filter(item => item.productId !== action.payload && item.id !== action.payload)
      }

    case CLEAR_CART:
      return {
        ...state,
        cart: []
      }

    case CLEAR_WISHLIST:
      return {
        ...state,
        wishlist: []
      }

    default:
      return state
  }
}

// Context
const AppContext = createContext()

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState)
  const { user, isSignedIn } = useUser()
  const { supabase, isConfigured } = useSupabase()

  // Always mirror state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(state.cart))
      localStorage.setItem(LOCAL_STORAGE_WISHLIST_KEY, JSON.stringify(state.wishlist))
    } catch (err) {
      console.warn('[Zion Atelier] Error syncing with localStorage:', err)
    }
  }, [state.cart, state.wishlist])

  // Latest state for async handlers (avoids stale closures when computing upsert quantities)
  const stateRef = useRef(state)
  stateRef.current = state
  const wasSignedIn = useRef(false)

  // Shared devices: do not leave a member's bag visible after they sign out
  useEffect(() => {
    if (wasSignedIn.current && !isSignedIn) {
      dispatch({ type: CLEAR_CART })
      dispatch({ type: CLEAR_WISHLIST })
    }
    wasSignedIn.current = Boolean(isSignedIn)
  }, [isSignedIn])

  // Synchronize with Supabase when the user authenticates via Clerk.
  // The guest bag is MERGED into the account so nothing is lost at the login step of checkout.
  useEffect(() => {
    if (!isSignedIn || !user || !isConfigured) return

    let isMounted = true

    const syncUserData = async () => {
      try {
        dispatch({ type: SET_SYNC_LOADING, payload: true })

        // 1. Sync or create user profile
        const { error: profileError, status: profileStatus } = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          full_name: user.fullName || user.firstName || 'Zion Client',
          avatar_url: user.imageUrl,
          updated_at: new Date().toISOString()
        })

        if (profileError) {
          if (
            profileStatus === 401 ||
            profileError.code === '42501' ||
            profileError.code === 'PGRST301' ||
            profileError.message?.includes('violates row-level security policy')
          ) {
            console.warn(
              '[Zion Atelier] Supabase authentication notice: JWT unauthorized or RLS check failed. ' +
              'Ensure Clerk Third-Party Auth is configured in the Supabase dashboard. Falling back to local storage.'
            )
            return
          }
          console.warn('[Zion Atelier] Profile sync warning:', profileError.message)
        }

        // 2. Merge guest bag with the cloud bag (higher quantity wins, so repeated logins never double up)
        const guestCart = stateRef.current.cart
        const { data: cloudCart, error: cartError } = await supabase
          .from('cart_items')
          .select('quantity, products (*)')
          .eq('user_id', user.id)

        if (!cartError && cloudCart && isMounted) {
          const merged = new Map()
          cloudCart.forEach(row => {
            if (row.products) merged.set(row.products.id, { product: mapDbProduct(row.products), quantity: row.quantity })
          })

          // Only products that really exist in the database can be ordered
          const guestIds = guestCart.map(i => i.productId).filter(isUuid)
          if (guestIds.length > 0) {
            const { data: liveProducts } = await supabase.from('products').select('*').in('id', guestIds)
            const live = new Map((liveProducts || []).map(p => [p.id, p]))
            const toUpsert = []
            guestCart.forEach(item => {
              const row = live.get(item.productId)
              if (!row) return
              const current = merged.get(row.id)
              const quantity = Math.max(current?.quantity ?? 0, item.quantity)
              merged.set(row.id, { product: mapDbProduct(row), quantity })
              if (quantity !== current?.quantity) {
                toUpsert.push({ user_id: user.id, product_id: row.id, quantity })
              }
            })
            if (toUpsert.length > 0) {
              const { error } = await supabase.from('cart_items').upsert(toUpsert, { onConflict: 'user_id,product_id' })
              if (error) console.warn('[Zion Atelier] Guest bag merge warning:', error.message)
            }
          }

          if (isMounted) {
            dispatch({
              type: SET_CART,
              payload: [...merged.values()].map(({ product, quantity }) => ({ ...product, quantity }))
            })
          }
        }

        // 3. Merge wishlist (union)
        const guestWishlist = stateRef.current.wishlist
        const { data: cloudWishlist, error: wishlistError } = await supabase
          .from('wishlist_items')
          .select('products (*)')
          .eq('user_id', user.id)

        if (!wishlistError && cloudWishlist && isMounted) {
          const merged = new Map()
          cloudWishlist.forEach(row => {
            if (row.products) merged.set(row.products.id, mapDbProduct(row.products))
          })
          const guestIds = guestWishlist.map(i => i.productId).filter(id => isUuid(id) && !merged.has(id))
          if (guestIds.length > 0) {
            const { data: liveProducts } = await supabase.from('products').select('*').in('id', guestIds)
            const rows = liveProducts || []
            rows.forEach(row => merged.set(row.id, mapDbProduct(row)))
            if (rows.length > 0) {
              await supabase.from('wishlist_items').upsert(
                rows.map(row => ({ user_id: user.id, product_id: row.id })),
                { onConflict: 'user_id,product_id' }
              )
            }
          }
          if (isMounted) dispatch({ type: SET_WISHLIST, payload: [...merged.values()] })
        }
      } catch (err) {
        console.warn('[Zion Atelier] Cloud sync warning:', err)
      } finally {
        if (isMounted) {
          dispatch({ type: SET_SYNC_LOADING, payload: false })
        }
      }
    }

    syncUserData()

    return () => {
      isMounted = false
    }
  }, [isSignedIn, user, isConfigured, supabase])

  const addToCart = (product, quantity = 1) => {
    const pid = product.productId ?? product.id
    const existing = stateRef.current.cart.find(item => item.productId === pid)
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    dispatch({ type: ADD_TO_CART, payload: product, quantity })
    if (isSignedIn && user && isConfigured && isUuid(pid)) {
      ;(async () => {
        try {
          const { error } = await supabase.from('cart_items').upsert(
            { user_id: user.id, product_id: pid, quantity: nextQuantity },
            { onConflict: 'user_id,product_id' }
          )
          if (error) console.warn('[Zion Atelier] Supabase cart sync warning:', error.message)
        } catch (err) {
          console.warn('[Zion Atelier] Unexpected cart sync error:', err)
        }
      })()
    }
  }

  const removeFromCart = (productId) => {
    dispatch({ type: REMOVE_FROM_CART, payload: productId })
    if (isSignedIn && user && isConfigured) {
      ;(async () => {
        try {
          const { error } = await supabase.from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId)
          if (error) console.warn('[Zion Atelier] Supabase cart remove warning:', error.message)
        } catch (err) {
          console.warn('[Zion Atelier] Unexpected cart remove error:', err)
        }
      })()
    }
  }

  const updateCartQuantity = (productId, quantity) => {
    dispatch({ type: UPDATE_CART_QUANTITY, payload: { productId, quantity } })
    if (isSignedIn && user && isConfigured) {
      ;(async () => {
        try {
          const query = quantity <= 0
            ? supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId)
            : supabase.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('product_id', productId)

          const { error } = await query
          if (error) console.warn('[Zion Atelier] Supabase cart update warning:', error.message)
        } catch (err) {
          console.warn('[Zion Atelier] Unexpected cart update error:', err)
        }
      })()
    }
  }

  const addToWishlist = (product) => {
    dispatch({ type: ADD_TO_WISHLIST, payload: product })
    const pid = product.productId ?? product.id
    if (isSignedIn && user && isConfigured && isUuid(pid)) {
      ;(async () => {
        try {
          const { error } = await supabase.from('wishlist_items').upsert({
            user_id: user.id,
            product_id: pid
          }, { onConflict: 'user_id,product_id' })
          if (error) console.warn('[Zion Atelier] Supabase wishlist sync warning:', error.message)
        } catch (err) {
          console.warn('[Zion Atelier] Unexpected wishlist sync error:', err)
        }
      })()
    }
  }

  const removeFromWishlist = (productId) => {
    dispatch({ type: REMOVE_FROM_WISHLIST, payload: productId })
    if (isSignedIn && user && isConfigured) {
      ;(async () => {
        try {
          const { error } = await supabase.from('wishlist_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId)
          if (error) console.warn('[Zion Atelier] Supabase wishlist remove warning:', error.message)
        } catch (err) {
          console.warn('[Zion Atelier] Unexpected wishlist remove error:', err)
        }
      })()
    }
  }

  // Local-only reset, used after place_order() has already emptied the cloud bag
  const resetLocalCart = () => dispatch({ type: CLEAR_CART })

  const clearCart = () => {
    dispatch({ type: CLEAR_CART })
    if (isSignedIn && user && isConfigured) {
      ;(async () => {
        try {
          const { error } = await supabase.from('cart_items')
            .delete()
            .eq('user_id', user.id)
          if (error) console.warn('[Zion Atelier] Supabase clear cart warning:', error.message)
        } catch (err) {
          console.warn('[Zion Atelier] Unexpected clear cart error:', err)
        }
      })()
    }
  }

  const clearWishlist = () => {
    dispatch({ type: CLEAR_WISHLIST })
    if (isSignedIn && user && isConfigured) {
      ;(async () => {
        try {
          const { error } = await supabase.from('wishlist_items')
            .delete()
            .eq('user_id', user.id)
          if (error) console.warn('[Zion Atelier] Supabase clear wishlist warning:', error.message)
        } catch (err) {
          console.warn('[Zion Atelier] Unexpected clear wishlist error:', err)
        }
      })()
    }
  }

  const moveToCart = (product) => {
    addToCart(product)
    removeFromWishlist(product.productId ?? product.id)
  }

  const value = {
    cart: state.cart,
    wishlist: state.wishlist,
    isSyncing: state.isSyncing,
    cartCount: state.cart.reduce((total, item) => total + item.quantity, 0),
    wishlistCount: state.wishlist.length,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    addToWishlist,
    removeFromWishlist,
    clearCart,
    resetLocalCart,
    clearWishlist,
    moveToCart
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
