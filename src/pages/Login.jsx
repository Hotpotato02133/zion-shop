import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { SignIn, useAuth } from '@clerk/clerk-react'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react'
import { luxuryClerkAppearance } from '../lib/clerkTheme'

const isClerkConfigured = Boolean(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY &&
  !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('placeholder')
)

const Login = () => {
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()

  useEffect(() => {
    if (isSignedIn) {
      navigate('/products')
    }
  }, [isSignedIn, navigate])
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [toastMessage, setToastMessage] = useState(null)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errorMessage) setErrorMessage('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setErrorMessage('Please enter both your email address and password.')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      showToast(`Welcome back, ${formData.email.split('@')[0]}! Accessing Atelier...`)
      setTimeout(() => {
        navigate('/products')
      }, 1200)
    }, 800)
  }

  const handleGoogleSignIn = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      showToast('Authenticated via Google. Welcome to Zion!')
      setTimeout(() => {
        navigate('/products')
      }, 1000)
    }, 700)
  }

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault()
    if (!forgotEmail) return
    setShowForgotModal(false)
    showToast(`Password recovery link dispatched to ${forgotEmail}`)
    setForgotEmail('')
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col lg:flex-row items-stretch bg-white overflow-x-clip">
      {/* Left Column: Editorial Auth Form or Clerk Component */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-6 sm:px-12 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {isClerkConfigured ? (
            <div className="w-full">
              <div className="mb-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
                  <Sparkles size={12} />
                  Atelier Privé
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 mb-1">
                  Atelier Client Access
                </h1>
                <p className="text-neutral-500 text-xs">
                  Authenticated via Clerk with Supabase database integration.
                </p>
              </div>

              <SignIn 
                routing="path" 
                path="/login" 
                signUpUrl="/signup" 
                fallbackRedirectUrl="/products"
                appearance={luxuryClerkAppearance} 
              />
            </div>
          ) : (
            <div>
              {/* Dev Notice Banner */}
              <div className="mb-6 p-4 rounded-xl bg-neutral-950 text-white border border-neutral-800 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-semibold flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Clerk Integration Engine Ready
                  </span>
                  <span className="text-[10px] text-neutral-400">Sandbox Preview</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Add <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">VITE_CLERK_PUBLISHABLE_KEY</code> to your <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200">.env.local</code> to activate live Clerk authentication.
                </p>
              </div>

              {/* Brand Monogram & Header */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
                  <Sparkles size={12} />
                  Atelier Privé
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mb-2">
                  Welcome Back
                </h1>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Sign in to manage your private acquisitions, reserved runway pieces, and bespoke measurements.
                </p>
              </div>

              {/* Social Sign In (OAuth / Google) */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 border border-neutral-200 hover:border-black rounded-xl text-neutral-800 font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-6">
                <div className="border-t border-neutral-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold tracking-wider uppercase text-neutral-400 absolute">
                  or credentials
                </span>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                    Atelier Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="client@atelier-zion.com"
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                      Private Key / Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-neutral-500 hover:text-black hover:underline transition-colors"
                    >
                      Forgot key?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                    />
                    <span className="text-xs text-neutral-600 select-none">
                      Remember this device for 30 days
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow group disabled:opacity-70 mt-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Atelier</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Signup */}
              <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
                <p className="text-xs text-neutral-500">
                  New to Zion?{' '}
                  <Link
                    to="/signup"
                    className="font-bold text-neutral-900 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Request Membership Access</span>
                    <ArrowRight size={12} />
                  </Link>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Right Column: Editorial Lifestyle Showcase */}
      <div className="hidden lg:block lg:w-1/2 relative bg-neutral-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop"
          alt="Zion Haute Horlogerie and Minimalist Atelier"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Floating Atelier Quote & Badges */}
        <div className="absolute inset-0 p-12 xl:p-16 flex flex-col justify-between text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-widest uppercase px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              Fall / Winter 2026
            </span>
            <span className="text-xs tracking-wider text-neutral-300">
              Paris • Milan • Tokyo
            </span>
          </div>

          <div className="max-w-md">
            <blockquote className="font-heading text-2xl xl:text-3xl font-light italic leading-snug mb-6">
              “Simplicity is not the lack of clutter, that's simply a consequence. True simplicity stems from pure purpose and exquisite proportion.”
            </blockquote>
            <div className="flex items-center gap-4 border-t border-white/20 pt-4">
              <div>
                <p className="text-sm font-bold tracking-wider">Atelier Zion International</p>
                <p className="text-xs text-neutral-400">Exclusive member privileges & private acquisitions</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-neutral-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>256-Bit SSL Encrypted Authentication & Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-2xl z-10"
            >
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black transition-colors"
              >
                <X size={18} />
              </button>
              <h3 className="font-heading text-xl font-bold text-neutral-900 mb-2">
                Reset Password
              </h3>
              <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
                Enter your registered atelier email address and our concierge will dispatch a secure single-use recovery token.
              </p>
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="client@atelier-zion.com"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-black text-white py-3 rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors"
                >
                  Send Recovery Link
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.aside
            aria-live="polite"
            role="status"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-medium border border-neutral-800"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Check size={14} className="text-white" />
            </div>
            <span>{toastMessage}</span>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Login
