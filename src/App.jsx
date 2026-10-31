import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { SupabaseProvider } from './context/SupabaseContext'
import { AppProvider } from './context/AppContext'
import { luxuryClerkAppearance } from './lib/clerkTheme'
import Layout from './components/Layout'
import Home from './pages/Home'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import { RequireAuth, RequireAdmin } from './components/RequireAuth'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCustomers from './pages/admin/AdminCustomers'
import './App.css'

const clerkPublishableKey = 
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
  'pk_test_dGVzdC1kb21haW4uY2xlcmsuYWNjb3VudHMuZGV2JA=='

function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={luxuryClerkAppearance}>
      <SupabaseProvider>
        <AppProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/login/*" element={<Login />} />
                <Route path="/signup/*" element={<Signup />} />
                <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                <Route path="/orders/:orderId" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="customers" element={<AdminCustomers />} />
                </Route>
              </Routes>
            </Layout>
          </Router>
        </AppProvider>
      </SupabaseProvider>
    </ClerkProvider>
  )
}

export default App
