# Agentic Development & Engineering Playbook

This document serves as the primary operational guide for AI agents (and human developers) working on the Zion E-Commerce repository. It captures conventions, guardrails, dependency invariants, and workflow procedures to accelerate development without regressions.

---

## 1. Golden Rules & Invariants

> [!IMPORTANT]
> **1. React 19 & Framer Motion Invariant**:
> This project runs on **React 19** (`^19.1.1`). Always keep `framer-motion` at version **`^11.18.2` or later**. Never downgrade `framer-motion` to v10, as v10 only supports React 18 and causes immediate `ERESOLVE` npm install failures.

> [!WARNING]
> **2. Do NOT Run `npm audit fix --force`**:
> Running `npm audit fix --force` will attempt to upgrade `tailwindcss` to v4. This repository is configured for **Tailwind CSS v3** (`^3.4.18`). Upgrading to v4 is a major breaking change that breaks `tailwind.config.cjs`, `postcss.config.cjs`, and custom utility classes.

> [!NOTE]
> **3. Single Source of Truth for State**:
> All cart and wishlist state **must** flow through [src/context/AppContext.jsx](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/context/AppContext.jsx). Never create local duplicate states for items in pages or components.

---

## 2. Standard Workflows for Agents

### 2.1 Adding a New Page Route
When adding a new page (e.g., `ProductDetail.jsx`, `OrderHistory.jsx`, `CheckoutSuccess.jsx`):
1. **Create the Page Component**:
   Place it in `src/pages/<PageName>.jsx`.
   Adhere to the standard layout padding:
   ```jsx
   <div className="min-h-screen py-8">
     <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]">
       {/* Page Content */}
     </div>
   </div>
   ```
2. **Register Route in [src/App.jsx](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/App.jsx)**:
   ```jsx
   import NewPage from './pages/NewPage'
   // Inside <Routes>:
   <Route path="/new-page" element={<NewPage />} />
   ```
3. **Update Navigation (if applicable)**:
   Add entry to `navItems` or `authItems` in [src/components/Layout.jsx](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/components/Layout.jsx).

### 2.2 Extending Global State
When adding a new state property or action (e.g., user authentication state, order history, discount coupons):
1. **Declare Action Constants** in [src/context/constants.js](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/context/constants.js):
   ```javascript
   export const SET_USER = 'SET_USER'
   export const LOGOUT = 'LOGOUT'
   ```
2. **Extend `initialState`** in [src/context/constants.js](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/context/constants.js):
   ```javascript
   export const initialState = {
     cart: [],
     wishlist: [],
     user: null
   }
   ```
3. **Handle in `appReducer`** in [src/context/AppContext.jsx](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/context/AppContext.jsx):
   Keep reducer cases pure and immutable.
4. **Expose Helpers** in `AppProvider`:
   Add functions to the `value` object returned by `AppContext.Provider`.

---

## 3. Component Architecture & Patterns

### 3.1 Styling Standards
- Always use utility classes from Tailwind CSS.
- For luxury styling, prefer monochrome elements: `bg-black`, `text-white`, `border-gray-100`, `text-gray-600`.
- Apply `font-heading` (Urbanist) for titles and `font-body` (Hauora Sans) for text.

### 3.2 Motion Patterns
- Animate entrances using `<motion.div variants={fadeInUp}>`.
- Apply hover feedback on cards with `whileHover={{ scale: 1.02 }}`.
- Apply tap feedback on interactive buttons with `whileTap={{ scale: 0.98 }}`.

---

## 4. Verification Checklist Before Finishing Tasks

Before concluding any modification or feature branch, execute:
1. **Validate Build**:
   ```bash
   npm run build
   ```
   Ensures Vite bundles all JSX modules and CSS without errors.
2. **Verify Lint**:
   ```bash
   npm run lint
   ```
3. **Check Git Status**:
   ```bash
   git status
   ```
   Ensure no untracked scratch files remain.
