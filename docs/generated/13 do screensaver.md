Great question! Let me think through the architecture here.

## Recommendation: Put it in `index.html`

**Why?** The screensaver needs to:
1. Overlay the **entire page** (not just the dashboard component)
2. Persist across **different dashboard views** (morning, afternoon, evening, tv)
3. Track activity at the **document level** (not component level)
4. Live outside the **Shadow DOM** of your Web Components

If you put it in `morning.js`, it would:
- ❌ Only work for the morning dashboard
- ❌ Get destroyed when switching dashboards
- ❌ Be isolated inside Shadow DOM (harder to overlay everything)

---

## Integration Plan

### Step 1: Add the Scripts to Your Project

**Create these files:**
```
src/
├── screensaver/
│   ├── starfield-screensaver.js
│   └── dashboard-screensaver-integration.js
```

Copy the uploaded files into those locations.

---

### Step 2: Load Scripts in `index.html`

**File**: `index.html`

**Find the existing `<script type="module">` section** (around line 23) and **add these imports at the top**:

```html
<script type="module">
    // Load screensaver (non-module scripts)
    import './src/screensaver/starfield-screensaver.js';
    import './src/screensaver/dashboard-screensaver-integration.js';
    
    // Load config manager first
    import './src/config-manager.js';
    import { loadDashboard } from './src/dashboard-router.js';

    // ... rest of initialization code ...
```

**Wait, there's an issue** - those files aren't ES modules, they use global scope. Let's fix that.

---

### Step 3: Convert to ES Modules (Better Approach)

**File**: `src/screensaver/starfield-screensaver.js`

**At the very bottom**, change this:
```javascript
// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StarfieldScreensaver;
}
```

**To**:
```javascript
// ES Module export
export { StarfieldScreensaver };
```

---

**File**: `src/screensaver/dashboard-screensaver-integration.js`

**At the very top**, add:
```javascript
import { StarfieldScreensaver } from './starfield-screensaver.js';
```

**At the very bottom**, change this:
```javascript
// Initialize when DOM is ready
let dashboardScreensaver;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dashboardScreensaver = new DashboardScreensaver({
      idleThreshold: 3 * 60 * 60 * 1000, // 3 hours
    });
  });
} else {
  // DOM already loaded
  dashboardScreensaver = new DashboardScreensaver({
    idleThreshold: 3 * 60 * 60 * 1000, // 3 hours
  });
}
```

**To**:
```javascript
// Export for initialization
export function initScreensaver(options = {}) {
  return new DashboardScreensaver(options);
}

// Export class too in case needed
export { DashboardScreensaver };
```

---

### Step 4: Initialize in `index.html`

**File**: `index.html`

**In the `<script type="module">` section**, add this **after** the dashboard loads successfully:

```html
<script type="module">
    // Load config manager first
    import './src/config-manager.js';
    import { loadDashboard } from './src/dashboard-router.js';
    import { initScreensaver } from './src/screensaver/dashboard-screensaver-integration.js';

    // Wait for config to be ready
    async function initializeDashboard() {
        try {
            console.log('Waiting for configuration...');
            
            // ... existing config loading code ...
            
            console.log('✓ Configuration ready');
            window.configManager.debugStatus();

            // Load the appropriate dashboard
            const dashboard = new URLSearchParams(window.location.search).get('dashboard') || 'morning';
            console.log(`Loading dashboard: ${dashboard}`);
            
            await loadDashboard(dashboard);
            console.log(`✓ Dashboard loaded: ${dashboard}`);
            
            // Initialize screensaver AFTER dashboard loads
            window.dashboardScreensaver = initScreensaver({
                idleThreshold: 3 * 60 * 60 * 1000, // 3 hours
            });
            console.log('✓ Screensaver initialized');
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            // ... existing error handling ...
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }
</script>
```

---

## Alternative: Simple Script Tags (If Module Approach is Annoying)

If the ES module conversion is too much hassle, you can just use script tags:

**File**: `index.html`

**In the `<head>` section**, add:
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dawnfire Dashboard</title>
    <link rel="stylesheet" href="src/styles/theme.css">
    
    <!-- Screensaver scripts (load before module scripts) -->
    <script src="src/screensaver/starfield-screensaver.js"></script>
    <script src="src/screensaver/dashboard-screensaver-integration.js"></script>
</head>
```

This works because the original files are written to work in global scope.

---

## Color Scheme Note

I notice the screensaver uses **Catppuccin Mocha** (different from your Frappé theme). Want to update it to match?

**File**: `src/screensaver/starfield-screensaver.js`

**Find this** (around line 49):
```javascript
// Catppuccin Mocha colors
this.colors = {
  base: '#1e1e2e',
  brightGray: '#f5f5f5',
  lavender: '#b4befe',
  sapphire: '#89b4fa',
  text: '#cdd6f4',
  surface: '#313244',
};
```

**Change to Frappé**:
```javascript
// Catppuccin Frappé colors (match dashboard theme)
this.colors = {
  base: '#303446',        // Frappé base
  brightGray: '#c6d0f5',  // Frappé text
  lavender: '#babbf1',    // Frappé lavender
  sapphire: '#8caaee',    // Frappé blue
  text: '#c6d0f5',        // Frappé text
  surface: '#414559',     // Frappé surface
};
```

---

## Testing

### Quick Test (Don't Wait 3 Hours):

**File**: `src/screensaver/dashboard-screensaver-integration.js`

**Temporarily change**:
```javascript
idleThreshold: 3 * 60 * 60 * 1000, // 3 hours
```

**To**:
```javascript
idleThreshold: 10 * 1000, // 10 seconds (for testing)
```

Or uncomment the test line at the bottom:
```javascript
// For testing: uncomment to trigger immediately
setTimeout(() => dashboardScreensaver.triggerScreensaver(), 2000);
```

---

## Summary

**Recommended approach:**

1. ✅ Put screensaver files in `src/screensaver/`
2. ✅ Convert to ES modules OR use script tags in `<head>`
3. ✅ Initialize in `index.html` after dashboard loads

**My vote: ES modules** (cleaner, consistent with your existing code)

Want me to walk you through any of these steps in more detail?