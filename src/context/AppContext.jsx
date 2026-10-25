import React, { createContext, useContext, useReducer, useEffect } from 'react'
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
      const existingCartItem = state.cart.find(item => item.productId === normalized.productId)
      if (existingCartItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.productId === normalized.productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
      }
      return {
        ...state,
        cart: [...state.cart, { ...normalized, quantity: 1 }]
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

  // Synchronize with Supabase database when user authenticates via Clerk
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
          full_name: user.fullName || user.firstName || 'Atelier Client',
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
              'Ensure Clerk Third-Party Auth or "supabase" JWT template is configured in dashboard. Falling back to local storage.'
            )
            return
          }
          console.warn('[Zion Atelier] Profile sync warning:', profileError.message)
        }

        // 2. Fetch existing cloud cart items
        const { data: cloudCart, error: cartError } = await supabase
          .from('cart_items')
          .select('quantity, added_at, products (*)')
          .eq('user_id', user.id)

        if (!cartError && cloudCart && isMounted) {
          if (cloudCart.length > 0) {
            const mappedCart = cloudCart.map(item => ({
              ...item.products,
              productId: item.products.id,
              quantity: item.quantity
            }))
            dispatch({ type: SET_CART, payload: mappedCart })
          }
        }

        // 3. Fetch existing cloud wishlist items
        const { data: cloudWishlist, error: wishlistError } = await supabase
          .from('wishlist_items')
          .select('added_at, products (*)')
          .eq('user_id', user.id)

        if (!wishlistError && cloudWishlist && isMounted) {
          if (cloudWishlist.length > 0) {
            const mappedWishlist = cloudWishlist.map(item => ({
              ...item.products,
              productId: item.products.id
            }))
            dispatch({ type: SET_WISHLIST, payload: mappedWishlist })
          }
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

  const addToCart = (product) => {
    dispatch({ type: ADD_TO_CART, payload: product })
    if (isSignedIn && user && isConfigured) {
      const pid = product.productId ?? product.id
      ;(async () => {
        try {
          const { error } = await supabase.from('cart_items').upsert({
            user_id: user.id,
            product_id: pid,
            quantity: 1
          })
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
    if (isSignedIn && user && isConfigured) {
      const pid = product.productId ?? product.id
      ;(async () => {
        try {
          const { error } = await supabase.from('wishlist_items').upsert({
            user_id: user.id,
            product_id: pid
          })
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
