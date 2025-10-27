# Zion E-Commerce Web Application

A modern, responsive e-commerce web application built with React, Vite, TailwindCSS, and ShadCN UI components.

## 🚀 Features

### Core Pages
- **🏠 Home Page** - Hero section with featured products and call-to-action
- **🛍️ Products Page** - Complete product catalog with search, filters, and sorting
- **🛒 Cart Page** - Shopping cart with quantity controls and order summary
- **💖 Wishlist Page** - Save and manage favorite products

### Key Features
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Modern UI/UX** - Clean, professional design with smooth animations
- **State Management** - Context API for cart and wishlist management
- **Routing** - Client-side routing with React Router
- **Animations** - Framer Motion for smooth transitions and interactions
- **Search & Filters** - Product search and category filtering
- **Mock Data** - Ready-to-use product data for development

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: TailwindCSS, ShadCN UI
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context API
- **Backend**: Supabase (ready for integration)

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout.jsx          # Main layout with navigation and footer
│   └── LandingPage.jsx     # Original landing page (legacy)
├── pages/
│   ├── Home.jsx            # Home page with hero and featured products
│   ├── Products.jsx        # Products catalog with filters
│   ├── Cart.jsx            # Shopping cart page
│   └── Wishlist.jsx        # Wishlist page
├── context/
│   └── AppContext.jsx      # Global state management
├── App.jsx                 # Main app component with routing
├── main.jsx               # App entry point
└── index.css              # Global styles and Tailwind imports
```

## 🎨 Design System

### Color Palette
- **Primary**: Black (#000000)
- **Secondary**: White (#ffffff)
- **Accent**: Gray variations
- **Success**: Green for positive actions
- **Error**: Red for warnings/sales

### Typography
- **Headings**: Urbanist font family
- **Body**: Hauora Sans font family
- **Responsive**: Scales from mobile to desktop

### Layout
- **Margins**: 100px on desktop, responsive scaling
- **Grid**: Responsive grid system
- **Spacing**: Consistent spacing scale

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-ecom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px - 1280px
- **Large Desktop**: 1280px - 1536px
- **Ultra-wide**: 1536px+

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Future Enhancements

### Planned Features
- **Supabase Integration** - Real product data and user authentication
- **Payment Processing** - Checkout flow with payment gateway
- **User Accounts** - Registration, login, and order history
- **Product Reviews** - Customer reviews and ratings
- **Inventory Management** - Stock tracking and availability
- **Admin Dashboard** - Product and order management

### Technical Improvements
- **Performance Optimization** - Code splitting and lazy loading
- **SEO Optimization** - Meta tags and structured data
- **Accessibility** - WCAG compliance improvements
- **Testing** - Unit and integration tests
- **PWA Features** - Offline support and app-like experience

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Zion E-Commerce** - Premium products for a premium lifestyle.