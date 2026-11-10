// Public demo credentials for the portfolio. These accounts hold no real data and
// no real payments (PayMongo test mode), so exposing them in the client is intentional.
// Create them once with:  npm run seed:demo
export const DEMO_ACCOUNTS = {
  customer: {
    role: 'customer',
    label: 'Demo Customer',
    firstName: 'Demo',
    lastName: 'Customer',
    email: 'demo.customer@example.com',
    password: 'ZionDemo#Customer2026',
    redirect: '/',
  },
  admin: {
    role: 'admin',
    label: 'Demo Admin',
    firstName: 'Demo',
    lastName: 'Admin',
    email: 'demo.admin@example.com',
    password: 'ZionDemo#Admin2026',
    redirect: '/admin',
  },
}
