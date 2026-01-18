# 🔧 FIX: MIME Type Loading Errors

## Problem

Your browser console showed:
```
The script from "http://localhost:3000/src/config-manager.js" was loaded 
even though its MIME type ("text/html") is not a valid JavaScript MIME type.
```

And similar errors for CSS and dashboard-router.

## Root Cause

**Express was only serving files from the `public/` folder**, not from `src/`.

When your HTML tried to load `src/config-manager.js`, Express couldn't find it, so it fell back to serving `index.html` instead (which is text/html). That's why all your `.js` and `.css` files were being loaded as HTML!

## The Fix

Two changes needed:

### 1. Fix `server.js` (Lines 20-22)

**BEFORE:**
```javascript
// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
```

**AFTER:**
```javascript
// Middleware
app.use(express.json());
// Serve static files from root (for HTML, CSS, JS in src/)
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    // Ensure correct MIME types
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));
// Serve public folder (for any generated files)
app.use(express.static(path.join(__dirname, 'public')));
```

**What this does:**
- Serves **all files from project root** (includes `src/` subfolder)
- Explicitly sets correct MIME types for `.js`, `.css`, `.json` files
- Still serves from `public/` for any generated files

### 2. Fix `index.html` (Lines 21-26)

**BEFORE:**
```html
    <!-- Configuration Management -->
    <script src="src/config-manager.js"></script>

    <!-- Components will be loaded here -->
    <script type="module">
        import { loadDashboard } from './src/dashboard-router.js';
```

**AFTER:**
```html
    <!-- Components will be loaded here -->
    <script type="module">
        // Load config manager first
        import './src/config-manager.js';
        import { loadDashboard } from './src/dashboard-router.js';
```

**What this does:**
- Removes the regular `<script src>` tag (was being served as HTML!)
- Uses ES6 module import instead (proper way to load modules)
- Imports config-manager as a module (which creates `window.configManager` globally)

## How to Apply the Fix

### Option A: Use the Fixed Files (Easiest)

I've created fixed versions:
- **`FIXED_05_index.html`** - Replace your `index.html`
- **`FIXED_06_server.js`** - Replace your `server.js`

Just download and use them (rename to remove "FIXED_" prefix).

### Option B: Manual Fix

1. Open `server.js`
2. Find lines 20-22 (the middleware section)
3. Replace with the "AFTER" code above
4. Save

Then:

1. Open `index.html`
2. Find lines 21-26 (around the script tags)
3. Replace with the "AFTER" code above
4. Save

### Option C: My Quick Script

```bash
# If you're in your project directory:
npm run dev  # Kill the server first (Ctrl+C)
# Make the changes above
npm run dev  # Restart
```

## Test It

After applying the fix:

1. **Kill the server:** Press `Ctrl+C` in the terminal
2. **Restart:** `npm run dev`
3. **Open browser:** `http://localhost:3000?dashboard=morning`
4. **Check console:** F12 → Console tab should show:
   ```
   ✓ ConfigManager: Using backend /api/config (development mode)
   ✓ Configuration ready
   Loading dashboard: morning
   ✓ Dashboard loaded: morning
   ```

## Why This Happened

The original `server.js` was designed for:
- A `public/` folder with pre-built assets
- K3s deployment with ConfigMaps storing HTML/CSS/JS

But for **local development**, we need:
- To serve the source files directly from `src/`
- Proper MIME types so the browser loads them correctly

The fix bridges both: it serves files from the project root during development AND works with K3s in production.

## If You Still Get Errors

### Error: "Cannot find module 'express'"
```bash
npm install
```

### Error: "Configuration failed to load"
Check that:
1. `.env` file exists (create with `cp .env.example .env`)
2. `.env` has credentials filled in
3. Look at server logs (console output from `npm run dev`)

### Error: Still getting MIME type errors after fix
1. Restart the server: `Ctrl+C`, then `npm run dev`
2. Clear browser cache: F12 → Application → Clear site data
3. Refresh the page

### Error: "config-manager is not defined"
Make sure your `index.html` imports it correctly (should be the "AFTER" version above).

## Download the Fixed Files

✓ **FIXED_05_index.html** - Download and rename to `index.html`  
✓ **FIXED_06_server.js** - Download and rename to `server.js`

Both are in outputs folder ready to download.

---

## Summary

The problem was **Express wasn't serving `src/` files**, so the browser got HTML instead of JavaScript/CSS.

The fix is:
1. Make Express serve from project root (not just `public/`)
2. Set correct MIME types explicitly
3. Load config-manager as a module (not a regular script)

After the fix, everything should load correctly! 🚀