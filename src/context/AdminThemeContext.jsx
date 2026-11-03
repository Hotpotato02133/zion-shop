import React, { createContext, useContext, useEffect, useState } from 'react'

const AdminThemeContext = createContext(null)

const STORAGE_KEY = 'zion_admin_theme'

export const AdminThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'dark' || saved === 'light') return saved
    } catch {
      // ignore localStorage security errors
    }
    return 'light'
  })

  const setTheme = (newTheme) => {
    const next = newTheme === 'dark' ? 'dark' : 'light'
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const isDark = theme === 'dark'

  // Apply dark class to document element for Tailwind dark: variants and Clerk popovers
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    return () => {
      // Clean up when unmounting so customer storefront remains light monochrome
      root.classList.remove('dark')
    }
  }, [isDark])

  return (
    <AdminThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  )
}

export const useAdminTheme = () => {
  const ctx = useContext(AdminThemeContext)
  if (!ctx) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider')
  }
  return ctx
}

