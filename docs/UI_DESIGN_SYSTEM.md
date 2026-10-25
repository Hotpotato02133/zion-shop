# Zion UI & Design System

This guide outlines the visual language, design principles, typography, color palette, layout rules, and animation standards used across Zion E-Commerce.

---

## 1. Visual Philosophy: Luxury Monochrome

Zion implements a strict **minimalist luxury aesthetic** inspired by high-end design houses (e.g., Apple, Acne Studios, Balenciaga). The layout relies heavily on clean whitespace, precise typography scales, subtle glassmorphic elements, and micro-interactions rather than heavy color splashes.

### Core Visual Principles
1. **Monochrome Dominance**: High contrast pairing of pure black (`#000000`) and pure white (`#ffffff`).
2. **Subtle Neutrals**: Grays are strictly used for hierarchy (card borders `gray-100`, secondary text `gray-600`, placeholders `gray-400`).
3. **Elevated Motion**: Smooth, deliberate animations using `framer-motion` (springs, fades, layout transitions).
4. **Editorial Typography**: Wide tracking, bold headings and refined legibility powered universally by **Google Sans** & **Google Sans Flex**.

---

## 2. Typography

Font definitions are configured in [tailwind.config.cjs](file:///c:/Users/windows11/Documents/GitHub/zion-shop/tailwind.config.cjs) and [index.css](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/index.css):

| Token | Family | Fallbacks | Primary Usage |
|---|---|---|---|
| `font-heading` | **Google Sans** / **Google Sans Flex** | `system-ui, -apple-system, sans-serif` | Brand logos, H1/H2 titles, price tags, modal headers |
| `font-body` | **Google Sans** / **Google Sans Flex** | `system-ui, -apple-system, sans-serif` | Paragraphs, navigation menus, form labels, product descriptions |
| `font-sans` | **Google Sans** / **Google Sans Flex** | `system-ui, -apple-system, sans-serif` | Universal default across all UI elements and components |

```css
/* Configured in tailwind.config.cjs */
fontFamily: {
  sans: ['"Google Sans"', '"Google Sans Flex"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
  heading: ['"Google Sans"', '"Google Sans Flex"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
  body: ['"Google Sans"', '"Google Sans Flex"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
}
```

---

## 3. Color Palette & Semantic Tokens

```
Black:       #000000  (Primary buttons, active indicators, footer background, primary typography)
White:       #ffffff  (Page backgrounds, button text, card surfaces)
Gray-50:     #f9fafb  (Hero background gradient, subtle card hover)
Gray-100:    #f3f4f6  (Dividers, card borders, icon button hover backgrounds)
Gray-200:    #e5e7eb  (Input borders, disabled states)
Gray-400:    #9ca3af  (Footer copyright, input placeholders)
Gray-600:    #4b5563  (Secondary navigation links, metadata subtitles)
Gray-800:    #1f2937  (Dark card elements, input field backgrounds in footer)
```

---

## 4. Spacing, Layout & Responsive Grid

### Standard Horizontal Margin Scale
To guarantee consistent alignment across all pages (`Home`, `Products`, `Cart`, `Wishlist`, `Login`, `Signup`, and `Layout`), the following container padding scale is standard:

```jsx
className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[100px] 2xl:px-[120px]"
```

### Breakpoints
- `sm`: 640px (Mobile landscape / small tablets)
- `md`: 768px (Tablets, desktop navigation breakpoint)
- `lg`: 1024px (Small laptops, 2-column product/hero split)
- `xl`: 1280px (Desktops, 100px margins)
- `2xl`: 1536px (Ultra-wide displays, 120px margins)

---

## 5. Animation Standards (`framer-motion`)

Consistent animation variants should be used across pages:

### Fade In Up (Default Entrance)
```javascript
export const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: "easeOut" } 
  }
}
```

### Staggered Children Container
```javascript
export const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}
```

### Card Hover & Elevation
```javascript
export const cardHover = {
  scale: 1.02,
  boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
  transition: { duration: 0.3, ease: "easeOut" }
}
```

### Active Route Indicator
In [Layout.jsx](file:///c:/Users/windows11/Documents/GitHub/zion-shop/src/components/Layout.jsx), the desktop navigation item uses a smooth layout morph:
```jsx
{isActive(item.path) && (
  <motion.div
    layoutId="activeTab"
    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black"
  />
)}
```

---

## 6. Icons & Controls (`lucide-react`)

Icons are sourced from **Lucide React**. Standard sizing conventions:
- **Navbar & Floating Badges**: `size={18}` (ShoppingBag, Heart, Search)
- **Mobile Menu Triggers**: `size={24}` (Menu, X)
- **Inline Action Buttons & Stars**: `size={14}` to `size={16}`
