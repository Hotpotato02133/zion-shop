import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login attempt:', formData)
    // TODO: Implement login functionality
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen py-8">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
        <div className="max-w-md mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
          >
            <motion.div variants={fadeInUp} className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your Zion account</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={fadeInUp} className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-black focus:ring-black" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-black hover:underline">
                  Forgot password?
                </Link>
              </motion.div>

              <motion.button
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors duration-300"
              >
                Sign In
              </motion.button>
            </form>

            <motion.div variants={fadeInUp} className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-black font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Login
