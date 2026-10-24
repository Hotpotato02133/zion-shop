// Action types
export const ADD_TO_CART = 'ADD_TO_CART'
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART'
export const UPDATE_CART_QUANTITY = 'UPDATE_CART_QUANTITY'
export const ADD_TO_WISHLIST = 'ADD_TO_WISHLIST'
export const REMOVE_FROM_WISHLIST = 'REMOVE_FROM_WISHLIST'
export const CLEAR_CART = 'CLEAR_CART'
export const CLEAR_WISHLIST = 'CLEAR_WISHLIST'
export const SET_CART = 'SET_CART'
export const SET_WISHLIST = 'SET_WISHLIST'
export const SET_SYNC_LOADING = 'SET_SYNC_LOADING'

// Initial state
export const initialState = {
  cart: [],
  wishlist: [],
  isSyncing: false
}
