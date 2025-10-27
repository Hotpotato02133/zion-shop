import React, { createContext, useContext, useReducer } from 'react'
import { 
  ADD_TO_CART, 
  REMOVE_FROM_CART, 
  UPDATE_CART_QUANTITY, 
  ADD_TO_WISHLIST, 
  REMOVE_FROM_WISHLIST, 
  CLEAR_CART, 
  CLEAR_WISHLIST,
  initialState 
} from './constants'

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ADD_TO_CART: {
      const existingCartItem = state.cart.find(item => item.productId === action.payload.productId)
      if (existingCartItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: 1 }]
      }
    }

    case REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter(item => item.productId !== action.payload)
      }

    case UPDATE_CART_QUANTITY:
      return {
        ...state,
        cart: state.cart.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      }

    case ADD_TO_WISHLIST: {
      const existingWishlistItem = state.wishlist.find(item => item.productId === action.payload.productId)
      if (existingWishlistItem) {
        return state
      }
      return {
        ...state,
        wishlist: [...state.wishlist, action.payload]
      }
    }

    case REMOVE_FROM_WISHLIST:
      return {
        ...state,
        wishlist: state.wishlist.filter(item => item.productId !== action.payload)
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
  const [state, dispatch] = useReducer(appReducer, initialState)

  const addToCart = (product) => {
    dispatch({ type: ADD_TO_CART, payload: product })
  }

  const removeFromCart = (productId) => {
    dispatch({ type: REMOVE_FROM_CART, payload: productId })
  }

  const updateCartQuantity = (productId, quantity) => {
    dispatch({ type: UPDATE_CART_QUANTITY, payload: { productId, quantity } })
  }

  const addToWishlist = (product) => {
    dispatch({ type: ADD_TO_WISHLIST, payload: product })
  }

  const removeFromWishlist = (productId) => {
    dispatch({ type: REMOVE_FROM_WISHLIST, payload: productId })
  }

  const clearCart = () => {
    dispatch({ type: CLEAR_CART })
  }

  const clearWishlist = () => {
    dispatch({ type: CLEAR_WISHLIST })
  }

  const moveToCart = (product) => {
    addToCart(product)
    removeFromWishlist(product.productId)
  }

  const value = {
    cart: state.cart,
    wishlist: state.wishlist,
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
