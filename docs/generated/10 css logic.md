
## The Philosophy: **Separation of Concerns**

### What Goes in `theme.css`
**Global design system tokens** - things that define your brand/theme and should be consistent across the entire app:

✅ **Color variables** - All your Catppuccin colors
✅ **Typography scale** - Font sizes, line heights, font families
✅ **Spacing/sizing tokens** - If you had standardized spacing units
✅ **Global resets** - `* { margin: 0; padding: 0; }`
✅ **Base element styles** - How `<body>`, `<button>`, `<input>` look by default
✅ **Utility classes** - `.text-primary`, `.border-sky`, etc.

**Think of theme.css as:** Your design system's "vocabulary" - the building blocks everyone uses.

---

### What Goes in Component Styles
**Component-specific layout and structure** - things that are unique to how THIS component is built:

✅ **Layout/Grid** - `.infrastructure-grid { display: grid; grid-template-columns: ... }`
✅ **Component structure** - `.node-card { display: flex; flex-direction: column; }`
✅ **Component-specific classes** - `.metric-bar`, `.forecast-table`, `.time-container`
✅ **Positioning** - Margins, padding, gaps specific to this component's layout
✅ **Responsive breakpoints** - How THIS component responds to screen size

**BUT USES variables from theme.css for:**
- Colors: `color: var(--text-primary)` instead of `color: #c6d0f5`
- Sizes: `font-size: var(--size-body)` instead of `font-size: 24px`
- Fonts: `font-family: var(--font-family)` instead of `font-family: 'Courier New'`

**Think of component styles as:** The architectural blueprint for how to assemble those building blocks into this specific component.

---

## The Decision Tree

When writing a style, ask yourself:

```
Is this style...
├─ A color value?
│  └─ YES → Use variable from theme.css (e.g., var(--accent-sky))
│
├─ A font size?
│  └─ YES → Use variable from theme.css (e.g., var(--size-heading))
│
├─ Defining HOW this component is laid out?
│  └─ YES → Component style (e.g., display: grid; grid-template-columns: ...)
│
├─ Something I might want to change globally?
│  └─ YES → Add variable to theme.css, reference in component
│
└─ Unique to this component's structure?
   └─ YES → Component style
```

---

## Examples from Your Code

### ✅ **GOOD - Current Pattern**

```javascript
// infrastructure.js
const styles = `
  .infrastructure-grid {
    display: grid;                          // ✅ Component structure
    grid-template-columns: repeat(3, 1fr);  // ✅ Component layout
    gap: 20px;                              // ✅ Component spacing
  }

  .node-card {
    border-color: var(--accent-green);      // ✅ Using theme variable
    background: rgba(166, 209, 137, 0.1);   // ✅ Using theme color with opacity
    color: var(--text-primary);             // ✅ Using theme variable
    font-size: var(--size-body);            // ✅ Using theme variable
  }
`;
```

This is **correct** because:
- Layout/structure is in component (grid setup, flex, gaps)
- All actual values (colors, sizes) come from theme variables

---

### ❌ **BAD - What to Avoid**

```javascript
// DON'T DO THIS
const styles = `
  .node-card {
    color: #c6d0f5;           // ❌ Hardcoded color
    font-size: 24px;          // ❌ Hardcoded size
    --accent-sky: #99d1db;    // ❌ Redefining theme variable
  }
`;
```

---

## Could We Move MORE to theme.css?

You could, but there's a tradeoff:

### Option A: Current (Component-Scoped Styles) ✅ **RECOMMENDED**
**Pros:**
- Each component is self-contained
- Easy to understand what styles affect this component
- Can be moved/reused independently
- Shadow DOM isolation protects from style conflicts

**Cons:**
- Some duplication of structural patterns (multiple components use flex/grid)

### Option B: More Shared Styles in theme.css
**Pros:**
- Less duplication
- Potentially smaller total CSS

**Cons:**
- Harder to understand dependencies
- Components become fragile (changes in theme.css might break components)
- Loses encapsulation benefits of Web Components

---

## Practical Guidelines for You

### When editing:

1. **Changing colors/sizes?**
   ```javascript
   // Don't change this in components:
   color: var(--accent-sky);
   
   // Change this in theme.css:
   --accent-sky: #99d1db;  // ← Edit here
   ```

2. **Changing layout of a component?**
   ```javascript
   // Edit in the component file:
   .infrastructure-grid {
     grid-template-columns: repeat(2, 1fr);  // ← Edit here
   }
   ```

3. **Adding a new color accent?**
   ```javascript
   // 1. Add to theme.css:
   --accent-purple: #ca9ee6;
   
   // 2. Use in component:
   border-color: var(--accent-purple);
   ```

4. **Want all headings bigger globally?**
   ```javascript
   // Change in theme.css:
   --size-heading: clamp(40px, 5vw, 60px);  // ← Edit here
   
   // All components automatically update!
   ```

---

## The Pattern You Should Follow

```javascript
// Component style structure:
const styles = `
  /* Component layout/structure */
  .component-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 20px;
    padding: 30px;
  }
  
  /* Component elements - using theme variables */
  .component-title {
    color: var(--text-primary);           // ✅ Theme color
    font-size: var(--size-heading);       // ✅ Theme size
    font-family: var(--font-family);      // ✅ Theme font
    margin-bottom: 15px;                  // ✅ Component spacing
  }
  
  /* State variations - using theme variables */
  .component-card.active {
    border-color: var(--accent-green);    // ✅ Theme color
    background: rgba(166, 209, 137, 0.1); // ✅ Theme color with opacity
  }
`;
```

---

## Quick Reference Card

| **Type** | **Location** | **Example** |
|----------|-------------|-------------|
| Brand colors | `theme.css` | `--accent-sky: #99d1db;` |
| Font sizes | `theme.css` | `--size-heading: clamp(32px, 4vw, 48px);` |
| Component grid | Component | `display: grid; grid-template-columns: 1fr 1fr;` |
| Component layout | Component | `.card { display: flex; flex-direction: column; }` |
| Using a color | Component | `color: var(--accent-sky);` |
| Using a size | Component | `font-size: var(--size-heading);` |
| Hardcoded value | **NEVER** | ❌ `color: #99d1db;` |

---

**TL;DR**: Theme.css = design tokens (colors, sizes). Component styles = structure/layout using those tokens. Never hardcode values that should be themeable!
