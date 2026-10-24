import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  AlertCircle,
  Truck,
  Scissors,
  Clock
} from 'lucide-react'

const Signup = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
    subscribeNewsletter: true
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [toastMessage, setToastMessage] = useState(null)

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

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
  const passwordsMismatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setErrorMessage('Please complete all mandatory fields.')
      return
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both entries.')
      return
    }

    if (!formData.agreeTerms) {
      setErrorMessage('Please accept the Terms of Atelier Service to continue.')
      return
    }

    setIsLoading(true)
    // Simulate luxury account provisioning
    setTimeout(() => {
      setIsLoading(false)
      showToast(`Welcome to Zion, ${formData.firstName}! Account successfully established.`)
      setTimeout(() => {
        navigate('/products')
      }, 1200)
    }, 900)
  }

  const handleGoogleSignup = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      showToast('Account successfully provisioned with Google. Welcome to Zion!')
      setTimeout(() => {
        navigate('/products')
      }, 1000)
    }, 700)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col lg:flex-row items-stretch bg-white overflow-x-clip">
      {/* Left Column: Editorial Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-6 sm:px-12 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold tracking-wider uppercase mb-3">
              <Sparkles size={12} />
              Private Salon Invitation
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mb-2">
              Join The Zion Circle
            </h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Create an account to unlock complimentary global courier, private runway previews, and bespoke tailoring services.
            </p>
          </div>

          {/* Social Sign Up */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignup}
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
              or register with email
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Alexander"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Vance"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="client@atelier-zion.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                Create Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  Confirm Password
                </label>
                {passwordsMatch && (
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <Check size={12} /> Matching
                  </span>
                )}
                {passwordsMismatch && (
                  <span className="text-[11px] font-semibold text-red-500">
                    Mismatch
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter password"
                  className={`w-full pl-9 pr-10 py-2.5 bg-neutral-50 border rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    passwordsMismatch 
                      ? 'border-red-400 focus:ring-red-500' 
                      : 'border-neutral-200 focus:ring-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5 pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                  className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                />
                <span className="text-xs text-neutral-600 leading-snug">
                  I accept the <a href="#terms" className="text-neutral-900 font-semibold underline">Terms of Atelier Service</a> and acknowledge the <a href="#privacy" className="text-neutral-900 font-semibold underline">Privacy Code</a>.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="subscribeNewsletter"
                  checked={formData.subscribeNewsletter}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                />
                <span className="text-xs text-neutral-600 leading-snug">
                  Receive private salon runway invitations and seasonal capsule notifications.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow group disabled:opacity-70 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Atelier Account</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-500">
              Already have an atelier account?{' '}
              <Link
                to="/login"
                className="font-bold text-neutral-900 hover:underline inline-flex items-center gap-1"
              >
                <span>Sign In</span>
                <ArrowRight size={12} />
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Editorial Visual & Atelier Privileges */}
      <div className="hidden lg:block lg:w-1/2 relative bg-neutral-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop"
          alt="Zion Runway Atelier"
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-12 xl:p-16 flex flex-col justify-between text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono tracking-widest uppercase px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              The Private Circle
            </span>
            <span className="text-xs tracking-wider text-neutral-300">
              Member Privileges
            </span>
          </div>

          <div className="max-w-md">
            <h3 className="font-heading text-2xl xl:text-3xl font-light mb-6">
              Privileges of Atelier Membership
            </h3>
            
            <div className="space-y-4 text-xs text-neutral-300">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg text-white shrink-0 mt-0.5">
                  <Truck size={16} />
                </div>
                <div>
                  <p className="font-semibold text-white">Complimentary Global Express Courier</p>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">Insured expedited delivery to your door across 65 territories.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg text-white shrink-0 mt-0.5">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="font-semibold text-white">48-Hour Priority Capsule Access</p>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">Early allocations to limited runway drops before public release.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/10 rounded-lg text-white shrink-0 mt-0.5">
                  <Scissors size={16} />
                </div>
                <div>
                  <p className="font-semibold text-white">Complimentary Tailoring & Alterations</p>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">Lifetime garment care and bespoke fit adjustments at any Zion boutique.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/20 flex items-center gap-2 text-xs text-neutral-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Verified Atelier Authentication • Strict Privacy Protection</span>
            </div>
          </div>
        </div>
      </div>

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

export default Signup
