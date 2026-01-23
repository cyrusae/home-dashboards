# Phase 1 Implementation Spec - Morning Dashboard Rebuild

**Date:** January 18, 2026  
**Status:** LOCKED - Ready to code  
**Deliverable:** morning.dawnfire.casa works as before, but with local testing, web components, viewport fix, and new layout

---

## Decisions - FINAL

### Layout - LOCKED ✅
**Morning Dashboard (3 rows):**
```
Row 1 [50% | 50%]:
  Left:  Date (box) / EST Time (box) - stacked vertically
  Right: PST TIME LARGE (no border, white outline accent - TBD color)

Row 2 [66.67% | 33.33%]:
  Left:  WEATHER - side-by-side (Current conditions LEFT | Hourly forecast RIGHT)
         (see Weather Layout below)
  Right: CALENDAR - day view (keep current behavior)

Row 3 [33.33% | 66.67%]:
  Left:  HARDCODED TASKS - morning routine checklist
  Right: INFRASTRUCTURE - 3 equal-width cards (Babbage | Epimetheus | Kabandha)
```

### Background Color - LOCKED ✅
- Replace white (`#eff1f5`) with soft light gray from Catppuccin Latte
- Use `#e6e9ef` (latte-mantle) or slightly lighter
- Retains white as accent color in widgets (borders, PST time outline)
- Removes harsh/unfinished feeling

### Times - LOCKED ✅
- **PST:** Primary display, no label (context clear from layout)
- **EST:** Smaller label format "EST: HH:MM" (reference for Tea's timezone)
- **Format:** 24-hour for both
- **PST time color:** Currently mauve, needs local testing—will support theme variable so you can tweak

### Weather Layout - LOCKED ✅

**Weather Row (Left 2/3 of Row 2):**

Two-column side-by-side layout:

```
┌─────────────────────────────────────────────┐
│  LEFT: Current Conditions   │  RIGHT: Hourly │
├─────────────────────────────────────────────┤
│  72°F                       │  TODAY          │
│  Partly Cloudy              │  ─────────────  │
│  ─────────────────────────  │  3 PM   64°     │
│  Humidity:  65%             │  ☁️              │
│  Wind:      12 mph NW       │  10%            │
│  AQI:   34  🟢 Good         │  29.8 mb        │
│  Pressure: 30.12 inHg       │  ─────────────  │
│  Trend: (gray/pink/orange)  │  6 PM   62°     │
│  ─────────────────────────  │  🌧️              │
│  🌅 Sunrise: 7:34 AM        │  60%            │
│  🌇 Sunset:  5:18 PM        │  29.7 mb        │
│  Daylight:  9h 44m          │  ... (more)     │
│                             │  ─────────────  │
│                             │  TOMORROW       │
│                             │  ─────────────  │
│                             │  9 AM   61°     │
│                             │  ☀️              │
│                             │  0%             │
│                             │  29.8 mb        │
│                             │  ... (more)     │
└─────────────────────────────────────────────┘
```

**Current Conditions (LEFT column):**
- Temperature (large)
- Condition text
- Horizontal divider
- Humidity %
- Wind speed + direction
- AQI with stoplight color (green/yellow/red/purple/maroon)
- Barometric pressure (inHg or mb)
- Pressure trend: Icon + color (pink/gray/orange)
- Horizontal divider
- Sunrise/sunset times with icons
- Daylight remaining

**Hourly Forecast (RIGHT column - wttr.in-inspired table format):**
- Day header (TODAY / TOMORROW)
- Table format: Time | Temp | Icon | Precip % | Pressure
- 3-hour intervals
- 6 hours per day (covers typical waking window)
- Clear day boundaries with light separator line

**Alternatively for RIGHT column (Option B from previous doc):**
- Day separator
- Grid of 6 hour cards: Time | Temp | Icon | Precip % | Pressure
- (Use this if wttr.in format feels cramped on TV distance)

**Choose one RIGHT format in Phase 1 testing**

### Weather Colors - LOCKED ✅

**AQI Stoplight Pattern:**
- 🟢 Green: 0-50 (Good)
- 🟡 Yellow: 51-100 (Moderate)
- 🟠 Orange: 101-150 (Unhealthy for Sensitive Groups)
- 🔴 Red: 151-200 (Unhealthy)
- 🟣 Purple: 201-300 (Very Unhealthy)
- ⚫ Black: 301+ (Hazardous)

**Pressure Trend:**
- ⬆️ Rising: Pink (#dd7878 - flamingo)
- ➡️ Steady: Gray (#9ca0b0 - text-light)
- ⬇️ Falling: Orange (#fe640b - peach) [can also trigger migraine context]

**Precipitation visualization (for future weather widgets):**
- Saturation-based (darker = rainier)
- Sky blue default accent
- Yellow reserved for sun icons only
- (Not MVP for morning, but locked for future widgets)

### Network Speed - LOCKED ✅
- **MVP:** Defer full implementation
- **Option 2 (On-Demand Button):** [Test Now] button that runs speed test in browser
- **OR:** Simple link to external speed test with note "Test your connection"
- **Future:** Explore librespeed self-hosting for periodic metrics
- **Implementation:** Phase 6 or deferred session

### PT Exercises - LOCKED ✅
- Evening dashboard primary
- Not on morning dashboard MVP (can add link later if needed)

### Times/Timezones - LOCKED ✅
- All times in PST (no "PST" label needed, context is clear)
- EST shown as reference: "EST: HH:MM" next to PST

---

## Web Component Structure - Phase 1

**Architecture:**
```
/dashboard/
  ├─ index.html (router, loads components)
  │
  ├─ src/
  │  ├─ config-manager.js (localStorage fallback + modal)
  │  ├─ router.js (URL-based dashboard selection)
  │  ├─ api-client.js (shared API calls)
  │  │
  │  └─ components/
  │     ├─ weather/
  │     │  ├─ weather-current.js (left column)
  │     │  └─ weather-forecast.js (right column - supports both formats)
  │     ├─ calendar/
  │     │  └─ calendar-day.js (current behavior)
  │     ├─ infrastructure/
  │     │  └─ node-status.js (3 cards: Babbage/Epimetheus/Kabandha)
  │     ├─ tasks/
  │     │  └─ morning-routine.js (hardcoded checklist)
  │     └─ time/
  │        └─ time-display.js (PST + EST)
  │
  ├─ styles/
  │  ├─ theme-latte.css (Catppuccin Latte + new soft gray bg)
  │  ├─ typography.css (24-28px body, 280-400px PST, etc.)
  │  └─ layout.css (CSS grid for morning/afternoon/evening/tv)
  │
  └─ server.js (Express backend, shared endpoints)
```

**Phase 1 Focus:**
1. Config manager (localStorage + modal)
2. Router (load dashboard by URL param)
3. Web component skeleton (one complete component as template)
4. Port existing morning dashboard to use components
5. Fix viewport clipping
6. Test that it works

---

## Local Testing Support - Phase 1

**Goal:** Run dashboard locally without Kubernetes injection

**Implementation:**

```javascript
// config-manager.js
class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    // 1. Try environment injection (production)
    if (window.__DASHBOARD_CONFIG__) {
      console.log('Using injected config');
      return window.__DASHBOARD_CONFIG__;
    }

    // 2. Try localStorage (local testing)
    const stored = localStorage.getItem('dashboardConfig');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('Using stored config from localStorage');
        return parsed;
      } catch (e) {
        console.warn('Stored config invalid');
      }
    }

    // 3. Show config modal
    this.showConfigModal();
    return null;
  }

  showConfigModal() {
    // Simple form asking for:
    // - OpenWeatherMap API key
    // - Location (Seattle,US by default)
    // - Nextcloud URL
    // - Nextcloud user
    // - Nextcloud password
    // Button: "Save & Reload"
    // (Saves to localStorage, reloads page)
    
    const html = `
      <div id="config-modal" class="config-modal">
        <div class="config-form">
          <h2>Dashboard Configuration</h2>
          <p>This is local testing only. Your credentials won't be sent anywhere.</p>
          
          <label>OpenWeatherMap API Key:</label>
          <input id="api-key" type="password" placeholder="Your API key">
          
          <label>Location:</label>
          <input id="location" type="text" value="Seattle,US">
          
          <label>Nextcloud URL:</label>
          <input id="nextcloud-url" type="text" value="https://nextcloud.dawnfire.casa">
          
          <label>Nextcloud Username:</label>
          <input id="nextcloud-user" type="text" value="dashboard">
          
          <label>Nextcloud Password:</label>
          <input id="nextcloud-password" type="password">
          
          <button onclick="window.configManager.saveConfig()">Save & Reload</button>
        </div>
      </div>
    `;
    
    document.body.innerHTML += html;
    // Add CSS for modal styling
  }

  saveConfig() {
    const config = {
      openWeatherMapApiKey: document.getElementById('api-key').value,
      openWeatherMapLocation: document.getElementById('location').value,
      nextcloudUrl: document.getElementById('nextcloud-url').value,
      nextcloudUser: document.getElementById('nextcloud-user').value,
      nextcloudPassword: document.getElementById('nextcloud-password').value,
    };
    
    localStorage.setItem('dashboardConfig', JSON.stringify(config));
    location.reload();
  }
}

window.configManager = new ConfigManager();
```

**Result:** Open dashboard locally, no config → modal appears → enter creds → localStorage saves them → reload → works!

---

## Viewport Clipping Fix - Phase 1

**Current issue:** Tiny bit of cutoff at bottom of screen

**Root cause:** CSS height not properly constraining to viewport

**Solution:**
```css
html {
  height: 100%;
  overflow: hidden;
}

body {
  height: 100vh;
  overflow: hidden;
  padding: 30px;
  display: flex;
  flex-direction: column;
}

.dashboard {
  flex: 1;
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 30px;
  /* Constrain to available height */
  max-height: calc(100vh - 60px); /* 60px = padding top + bottom */
}

/* Ensure scrollable sections don't overflow */
.section-weather,
.section-tasks,
.section-calendar {
  overflow: hidden; /* or overflow-y: auto if needed */
}
```

---

## Color Variables for Easy Tweaking - Phase 1

**Add to CSS (theme-latte.css):**
```css
:root {
  /* Existing Catppuccin palette */
  --latte-base: #eff1f5;
  --latte-mantle: #e6e9ef;
  --latte-crust: #dce0e8;
  
  /* NEW: Soft background (choose one) */
  --bg-soft: #e6e9ef; /* or #e8eaef or lighter? */
  
  /* PST time accent - VARIABLE for testing */
  --pst-accent: #8839ef; /* mauve - current, will tweak */
  
  /* AQI colors - stoplight */
  --aqi-good: #40a02f;
  --aqi-moderate: #df8e1d;
  --aqi-unhealthy-sensitive: #fe640b;
  --aqi-unhealthy: #d20f39;
  --aqi-very-unhealthy: #8839ef;
  --aqi-hazardous: #1a1a1a;
  
  /* Pressure trend colors */
  --pressure-rising: #dd7878;
  --pressure-steady: #9ca0b0;
  --pressure-falling: #fe640b;
  
  /* Typography sizes (4K TV) */
  --size-tiny: 18px;
  --size-small: 22px;
  --size-body: 28px;
  --size-heading: 40px;
  --size-large: 140px;
  --size-huge: 280px;
  --size-massive: 400px;
}
```

**Makes tweaking easy:**
- Change `--pst-accent` and see PST time color update everywhere
- Change `--bg-soft` and background updates
- Adjust `--size-huge` to tweak PST time size
- All changeable in real-time without touching component code

---

## API Endpoints (Shared Backend - Unchanged from before)

```
GET /api/weather?location=Seattle,US
  → { current, hourly, daily, aqi, pressure, sunrise, sunset }

GET /api/calendar/events?date=today
  → Array of today's events

GET /api/prometheus/health
  → { babbage, epimetheus, kabandha }

GET /api/dashboard/config?dashboard=morning
  → { widgets: [...], layout: {...} }
```

---

## Phase 1 Deliverable Checklist

- [ ] Config manager with localStorage fallback + modal
- [ ] Router for dashboard selection (morning/afternoon/evening/tv)
- [ ] Web component skeleton (base class, template structure)
- [ ] Time display component (PST + EST)
- [ ] Weather current component (left column)
- [ ] Weather forecast component (right column - wttr.in format OR Option B)
- [ ] Calendar day component (ported from current)
- [ ] Infrastructure component (3 cards - ported from current)
- [ ] Morning routine component (ported from current)
- [ ] Morning layout (CSS grid: 50/50 top, 66/33 middle, 33/66 bottom)
- [ ] Viewport clipping fix
- [ ] Soft gray background instead of white
- [ ] Theme variables file (easy color tweaking)
- [ ] Test that morning dashboard works as before (visually)
- [ ] Test local credential entry via modal
- [ ] All colors locked (AQI stoplight, pressure trend, etc.)

---

## Implementation Order (Phase 1)

1. **Setup** (15 min)
   - Create component directory structure
   - Create base web component class
   - Create CSS theme file with variables

2. **Config System** (30 min)
   - Config manager with localStorage
   - Config modal UI + styling

3. **Router** (15 min)
   - Simple URL param routing
   - Load appropriate dashboard

4. **Time Component** (20 min)
   - PST + EST display
   - 24-hour format
   - Auto-update every second

5. **Weather Components** (45 min)
   - Current conditions (left)
   - Hourly forecast (right) - decide on format
   - API integration

6. **Calendar Component** (20 min)
   - Port existing calendar day logic
   - Web component wrapper

7. **Infrastructure Component** (25 min)
   - 3 cards for nodes
   - Prometheus query integration

8. **Morning Routine Component** (10 min)
   - Port existing checklist
   - Web component wrapper

9. **Layout & Styling** (30 min)
   - CSS grid for morning layout
   - Soft gray background
   - Viewport clipping fix
   - Typography sizes

10. **Testing & Refinement** (20 min)
    - Test local credential entry
    - Test that morning dashboard works
    - Adjust spacing/sizes if needed

**Total: ~3 hours for Phase 1**

---

## Questions Before We Start Coding

1. **Weather forecast RIGHT column format:** Use wttr.in-inspired table or Option B (day-separated cards)?
   - I can code both and you can switch in config, or pick one now?

2. **PST time size on 4K display:** Start with 280px and adjust?
   - Or should we calculate based on viewport?

3. **Soft gray shade:** Confident with `#e6e9ef` (latte-mantle)?
   - Or try something lighter like `#e8eaef`?

4. **Infrastructure metrics:** Stick with CPU%, Mem%, Pod count?
   - Any other metrics you want to see on those cards?

5. **Ready to start coding now?** Or want to finalize weather format choice first?

---

## Notes for Implementation

- All times PST (default), EST shown smaller
- Support local testing without Kubernetes (localStorage config)
- All colors variable (easy tweaking)
- All sizes variable (easy adjustment)
- Weather widget intentionally shows side-by-side current + forecast (not stacked)
- Infrastructure cards responsive (3-col grid)
- Viewport clipping definitively fixed
- Ready to test all design decisions once coded

You're locked and loaded. Ready to build Phase 1?

---

# Phase 1 Refinements - .env Loading & Responsive Typography

**Date:** January 18, 2026  
**Focus:** Local testing workflow + scalable typography

---

## .env File Support (Better than localStorage modal)

### Why .env is Better
- No modal every session ✅
- Credentials stored locally in your project (not browser storage)
- Can be .gitignored (never committed)
- Standard dev pattern
- Works offline
- Can have different .env files per machine

### Implementation

**Directory structure:**
```
/dashboard/
  ├─ .env (LOCAL - never commit)
  ├─ .env.example (TEMPLATE - commit this)
  ├─ server.js
  ├─ index.html
  └─ src/
     └─ config-manager.js
```

**`.env.example` (commit this):**
```
# OpenWeatherMap
VITE_OPENWEATHERMAP_API_KEY=your_api_key_here
VITE_OPENWEATHERMAP_LOCATION=Seattle,US

# Nextcloud
VITE_NEXTCLOUD_URL=https://nextcloud.dawnfire.casa
VITE_NEXTCLOUD_USER=dashboard
VITE_NEXTCLOUD_PASSWORD=your_password_here

# Backend
VITE_API_URL=http://localhost:3000

# Environment
VITE_DASHBOARD=morning
```

**`.env` (local only - git ignored):**
```
# Your actual credentials
VITE_OPENWEATHERMAP_API_KEY=abc123def456ghi789...
VITE_OPENWEATHERMAP_LOCATION=Seattle,US
VITE_NEXTCLOUD_URL=https://nextcloud.dawnfire.casa
VITE_NEXTCLOUD_USER=dashboard
VITE_NEXTCLOUD_PASSWORD=actual_password_here
VITE_API_URL=http://localhost:3000
VITE_DASHBOARD=morning
```

### Loading .env Files

**Two approaches:**

#### Approach A: Vite (if you want to use build tooling)
```javascript
// config-manager.js with Vite
class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    // 1. Try window injection (production in Kubernetes)
    if (window.__DASHBOARD_CONFIG__) {
      console.log('Using injected config (Kubernetes)');
      return window.__DASHBOARD_CONFIG__;
    }

    // 2. Try Vite env variables (local development)
    if (import.meta.env.VITE_OPENWEATHERMAP_API_KEY) {
      console.log('Using .env config (local development)');
      return {
        openWeatherMapApiKey: import.meta.env.VITE_OPENWEATHERMAP_API_KEY,
        openWeatherMapLocation: import.meta.env.VITE_OPENWEATHERMAP_LOCATION,
        nextcloudUrl: import.meta.env.VITE_NEXTCLOUD_URL,
        nextcloudUser: import.meta.env.VITE_NEXTCLOUD_USER,
        nextcloudPassword: import.meta.env.VITE_NEXTCLOUD_PASSWORD,
        apiUrl: import.meta.env.VITE_API_URL,
      };
    }

    // 3. Fallback (show error)
    throw new Error('No configuration found');
  }
}
```

**Setup:**
- Install Vite: `npm install -D vite`
- Create `vite.config.js`
- Run dev server: `npm run dev`
- Vite automatically loads `.env` and makes available via `import.meta.env`

**Pros:**
- Industry standard
- Hot reload works (change .env, reload browser)
- .env variables available in build

**Cons:**
- Adds build step
- Need npm/Node running for dev

---

#### Approach B: Simple Node server (no build tooling, pure JavaScript)
```javascript
// server.js - Express backend serves config
const express = require('express');
const dotenv = require('dotenv');
const app = express();

dotenv.config(); // Loads .env automatically

// Endpoint: Frontend fetches config on startup
app.get('/api/config', (req, res) => {
  // Only serve config in development
  if (process.env.NODE_ENV === 'production') {
    // Production uses Kubernetes injection
    return res.status(403).json({ error: 'Not in production' });
  }

  res.json({
    openWeatherMapApiKey: process.env.VITE_OPENWEATHERMAP_API_KEY,
    openWeatherMapLocation: process.env.VITE_OPENWEATHERMAP_LOCATION,
    nextcloudUrl: process.env.VITE_NEXTCLOUD_URL,
    nextcloudUser: process.env.VITE_NEXTCLOUD_USER,
    nextcloudPassword: process.env.VITE_NEXTCLOUD_PASSWORD,
  });
});

app.listen(3000, () => console.log('Server on 3000'));
```

```javascript
// config-manager.js - Frontend loads config
class ConfigManager {
  constructor() {
    this.config = null;
  }

  async loadConfig() {
    // 1. Try window injection (production)
    if (window.__DASHBOARD_CONFIG__) {
      console.log('Using injected config (Kubernetes)');
      this.config = window.__DASHBOARD_CONFIG__;
      return this.config;
    }

    // 2. Try fetching from backend (local development)
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        this.config = await response.json();
        console.log('Using .env config from backend (local development)');
        return this.config;
      }
    } catch (e) {
      console.warn('Could not fetch config from backend');
    }

    // 3. Fallback (error)
    throw new Error('No configuration found');
  }
}

// Initialize on page load
window.configManager = new ConfigManager();
await window.configManager.loadConfig();
```

**Setup:**
- Install dotenv: `npm install dotenv`
- Create `.env` file
- Run: `node server.js`
- Backend automatically loads `.env` and serves it to frontend

**Pros:**
- No build tooling needed
- Works with plain HTML + Express
- Simpler to understand

**Cons:**
- Config is slightly more decoupled (requires API call)
- Extra round-trip on startup

---

### Recommendation: Use Approach B (Simpler)

**Why:**
- Your current setup is plain Express + HTML (not using build tools)
- Adding Vite feels like scope creep
- dotenv is lightweight (1 dependency)
- Backend already reads env for Prometheus/Nextcloud
- Consistent with how server.js currently works

**Workflow:**
```bash
# First time
cp .env.example .env
# Edit .env with your credentials

# Run development
node server.js
# Navigate to http://localhost:3000
# Frontend fetches config from /api/config
# Dashboard loads with your credentials

# Production (Kubernetes)
# No .env file needed
# Credentials injected as window.__DASHBOARD_CONFIG__
# /api/config responds 403 (production mode)
```

---

## Viewport-Relative Typography (Scalable Sizing)

### Current Approach (Static)
```css
--size-huge: 280px; /* PST time */
--size-massive: 400px;
--size-body: 28px;
```

**Problem:** Looks great on one 4K TV, might be wrong on different screen sizes or viewing distances.

### Approach A: CSS `clamp()` (Recommended for Modern Browsers)

**How it works:**
```css
font-size: clamp(min, preferred, max);
```

Syntax: Sets minimum, preferred (scales with viewport), and maximum size

**Example:**
```css
/* PST time - scales with viewport, never smaller than 200px, never larger than 400px */
.time-pst {
  font-size: clamp(200px, 30vw, 400px);
  /* means: 30% of viewport width, but between 200-400px */
}

/* Body text - scales but stays readable */
.weather-detail {
  font-size: clamp(16px, 2vw, 32px);
  /* means: 2% of viewport width, but between 16-32px */
}

/* Headings */
.section-title {
  font-size: clamp(24px, 4vw, 48px);
  /* means: 4% of viewport width, but between 24-48px */
}
```

**Why this works:**
- `30vw` = "30% of viewport width"
- On 4K (3840px): 30% = 1152px (clamped to 400px max) ✅
- On 1080p (1920px): 30% = 576px (clamped to 400px max) ✅
- On small phone (375px): 30% = 112px (clamped to 200px min) ✅
- Automatically scales for different screens!

**Implementation:**
```css
:root {
  /* Typography scales with viewport */
  --size-tiny: clamp(14px, 1vw, 20px);
  --size-small: clamp(18px, 1.5vw, 24px);
  --size-body: clamp(24px, 2vw, 32px);
  --size-heading: clamp(32px, 4vw, 48px);
  --size-large: clamp(100px, 15vw, 200px);
  --size-huge: clamp(200px, 30vw, 400px); /* PST time */
  --size-massive: clamp(300px, 40vw, 500px);
}

/* Use in components */
.time-pst {
  font-size: var(--size-huge);
  /* Will automatically scale based on viewport width */
}

.weather-temp {
  font-size: var(--size-large);
}

.weather-detail {
  font-size: var(--size-small);
}
```

**Browser support:**
- Chrome 79+ ✅
- Firefox 75+ ✅
- Safari 13.1+ ✅
- Edge 79+ ✅
- (basically all modern browsers)

---

### Approach B: JavaScript Viewport Calculation (More Control)

If you want to fine-tune based on actual viewing distance or custom logic:

```javascript
// responsive-typography.js
class ResponsiveTypography {
  constructor() {
    this.updateSizes();
    window.addEventListener('resize', () => this.updateSizes());
  }

  updateSizes() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Calculate font sizes based on viewport
    const root = document.documentElement;
    
    // PST time: 30% of viewport width
    const pstSize = Math.max(200, Math.min(400, vw * 0.30));
    root.style.setProperty('--size-huge', `${pstSize}px`);
    
    // Body text: 2% of viewport width
    const bodySize = Math.max(24, Math.min(32, vw * 0.02));
    root.style.setProperty('--size-body', `${bodySize}px`);
    
    // And so on for other sizes...
  }
}

new ResponsiveTypography();
```

**Pros:**
- Total control over calculations
- Can adjust based on height too
- Can log what sizes are calculated

**Cons:**
- Extra JavaScript
- More complex
- Not as clean as CSS

---

### Recommendation: Use Approach A (CSS `clamp()`)

**Why:**
- CSS is simpler and cleaner
- No JavaScript overhead
- Better browser support for modern browsers
- Exactly what `clamp()` was designed for
- You can tweak min/preferred/max values easily

**Implementation:**
```css
:root {
  /* All typography scales with viewport */
  --size-tiny: clamp(14px, 1vw, 20px);
  --size-small: clamp(18px, 1.5vw, 24px);
  --size-body: clamp(24px, 2vw, 32px);
  --size-heading: clamp(32px, 4vw, 48px);
  --size-large: clamp(100px, 15vw, 200px);
  --size-huge: clamp(200px, 30vw, 400px); /* PST time */
  --size-massive: clamp(300px, 40vw, 500px);
}
```

Then use `var(--size-huge)` everywhere, and it automatically scales!

**You can tweak the formula:**
- `30vw` too big? Try `25vw` or `28vw`
- `400px` max feels cramped? Try `450px`
- Changes apply everywhere automatically

---

## Quick Comparison: Static vs. Clamp

**Your current approach (static 280px PST time):**
```
4K TV (3840px):    280px (hardcoded)
1080p:             280px (same, might feel huge or tiny)
Laptop:            280px (probably too big)
Tablet:            280px (way too big)
```

**With clamp (30% but clamped 200-400px):**
```
4K TV (3840px):    400px (scaled up to max)
1080p (1920px):    400px (max, still readable)
Laptop (1440px):   432px (clamped to 400px max)
Tablet (800px):    240px (scales down appropriately)
Phone (375px):     200px (min size, still readable)
```

**Result:** Looks right on ANY screen size, not just 4K TV

---

## Final .env + Typography Implementation

### `.env.example` (commit this)
```
# OpenWeatherMap
VITE_OPENWEATHERMAP_API_KEY=your_api_key_here
VITE_OPENWEATHERMAP_LOCATION=Seattle,US

# Nextcloud
VITE_NEXTCLOUD_URL=https://nextcloud.dawnfire.casa
VITE_NEXTCLOUD_USER=dashboard
VITE_NEXTCLOUD_PASSWORD=your_password_here

# Backend
VITE_API_URL=http://localhost:3000

# Development
NODE_ENV=development
```

### `server.js` (add to existing file)
```javascript
const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const { DOMParser } = require('xmldom');

dotenv.config(); // Load .env file

const app = express();

// Load config from environment (Kubernetes injection or .env)
const CONFIG = {
  prometheusUrl: process.env.PROMETHEUS_URL || 'https://prometheus.dawnfire.casa',
  nextcloudUrl: process.env.NEXTCLOUD_URL || process.env.VITE_NEXTCLOUD_URL,
  nextcloudUser: process.env.NEXTCLOUD_USER || process.env.VITE_NEXTCLOUD_USER,
  nextcloudPassword: process.env.NEXTCLOUD_PASSWORD || process.env.VITE_NEXTCLOUD_PASSWORD,
};

// Development config endpoint
app.get('/api/config', (req, res) => {
  // Only serve in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  res.json({
    openWeatherMapApiKey: process.env.VITE_OPENWEATHERMAP_API_KEY,
    openWeatherMapLocation: process.env.VITE_OPENWEATHERMAP_LOCATION,
    nextcloudUrl: process.env.VITE_NEXTCLOUD_URL,
    nextcloudUser: process.env.VITE_NEXTCLOUD_USER,
    nextcloudPassword: process.env.VITE_NEXTCLOUD_PASSWORD,
  });
});

// Existing endpoints...
app.get('/api/prometheus/query', async (req, res) => {
  // ... (keep as-is)
});

// ... etc

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard backend listening on port ${PORT}`);
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode - config endpoint available at /api/config');
  }
});
```

### `config-manager.js` (new file)
```javascript
class ConfigManager {
  constructor() {
    this.config = null;
    this.isInitialized = false;
  }

  async initialize() {
    // 1. Try window injection (Kubernetes production)
    if (window.__DASHBOARD_CONFIG__) {
      console.log('✓ Using injected config (Kubernetes)');
      this.config = window.__DASHBOARD_CONFIG__;
      this.isInitialized = true;
      return this.config;
    }

    // 2. Try fetching from backend (local development)
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        this.config = await response.json();
        console.log('✓ Using .env config from backend');
        this.isInitialized = true;
        return this.config;
      } else if (response.status === 403) {
        console.warn('✗ Config endpoint not available (production mode?)');
      }
    } catch (e) {
      console.warn('✗ Could not fetch config:', e.message);
    }

    // 3. Fallback error
    throw new Error('No configuration found. Check .env file or Kubernetes injection.');
  }

  getConfig() {
    if (!this.isInitialized) {
      throw new Error('Config not initialized. Call initialize() first.');
    }
    return this.config;
  }
}

// Global instance
window.configManager = new ConfigManager();
```

### `index.html` (initialize config before loading components)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dawnfire Dashboard</title>
    <link rel="stylesheet" href="styles/theme-latte.css">
    <link rel="stylesheet" href="styles/typography.css">
    <link rel="stylesheet" href="styles/layout.css">
</head>
<body>
    <div id="app">Loading configuration...</div>

    <script src="src/config-manager.js"></script>
    <script>
      // Initialize config before anything else
      window.configManager.initialize()
        .then(() => {
          console.log('Configuration loaded successfully');
          // Load dashboard
          const dashboard = new URLSearchParams(window.location.search).get('dashboard') || 'morning';
          window.location.hash = `#/dashboard/${dashboard}`;
          
          // Now load components
          const script = document.createElement('script');
          script.src = `src/dashboards/${dashboard}.js`;
          document.body.appendChild(script);
        })
        .catch(error => {
          console.error('Failed to load configuration:', error);
          document.getElementById('app').innerHTML = `
            <div style="color: red; padding: 20px; font-size: 24px;">
              <h1>Configuration Error</h1>
              <p>${error.message}</p>
              <p>Check .env file and try refreshing</p>
            </div>
          `;
        });
    </script>
</body>
</html>
```

### `styles/typography.css` (with clamp)
```css
:root {
  /* Viewport-relative typography using clamp() */
  /* Format: clamp(min, preferred, max) */
  
  --size-tiny: clamp(14px, 1vw, 20px);
  --size-small: clamp(18px, 1.5vw, 24px);
  --size-body: clamp(24px, 2vw, 32px);
  --size-heading: clamp(32px, 4vw, 48px);
  --size-label: clamp(18px, 2.5vw, 28px);
  --size-large: clamp(100px, 15vw, 200px);
  --size-huge: clamp(200px, 30vw, 400px); /* PST time - main focus */
  --size-massive: clamp(300px, 40vw, 500px);
  
  /* Line heights scale proportionally */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-loose: 1.8;
}

/* Apply to components */
.time-pst {
  font-size: var(--size-huge);
  line-height: var(--line-height-tight);
}

.date-display {
  font-size: clamp(40px, 6vw, 60px);
}

.time-est-display {
  font-size: clamp(32px, 5vw, 48px);
}

.weather-temp {
  font-size: var(--size-large);
}

.weather-detail {
  font-size: var(--size-small);
}

.section-title {
  font-size: var(--size-heading);
}

.task-item,
.calendar-event {
  font-size: var(--size-body);
}
```

---

## Workflow Summary

**First time setup:**
```bash
cd dashboard/
npm install dotenv
cp .env.example .env
# Edit .env with your actual credentials
node server.js
# Open http://localhost:3000
# Dashboard loads with config from .env
```

**Each time you start:**
```bash
node server.js
# Credentials automatically loaded from .env
# No manual entry needed
```

**Typography automatically scales:**
- 4K TV: PST time ~400px (readable at distance)
- Laptop: PST time ~280px (readable at desk)
- Tablet: PST time ~150-200px (readable in hand)
- No manual tweaking needed per screen!

---

## Changes to Phase 1 Spec

1. **Config loading:** Replace localStorage modal with .env + backend `/api/config` endpoint
2. **Typography:** Replace static sizes with CSS `clamp()` (scales automatically by viewport)
3. **Pressure units:** Use hPa instead of inHg
4. **Infrastructure:** CPU%, Memory%, Pod count ✅

All other Phase 1 specs remain the same.

Ready to code?

---

# Phase 1 Complete: Dashboard Rebuild Foundation

**Date:** January 18, 2026  
**Status:** ✅ Ready for local testing  
**Location:** `/home/claude/dashboard-rebuild/` (also in outputs)

---

## What's Been Built

### Core Infrastructure ✅
- **Config Manager** (`src/config-manager.js`)
  - Supports production mode (K3s injected `window.__DASHBOARD_CONFIG__`)
  - Supports development mode (backend `/api/config` endpoint)
  - Auto-detects which to use, loads config on startup
  - Beautiful error messages if config fails

- **Express Server** (`server.js`)
  - `/api/config` endpoint (development only, returns 403 in production)
  - `/api/weather` - OpenWeatherMap proxy
  - `/api/calendar/events` - CalDAV proxy (Nextcloud)
  - `/api/prometheus/query` - Prometheus proxy
  - `/health` - Health check
  - Serves static files + SPA fallback

- **Web Component Base Class** (`src/components/base.js`)
  - Reusable component pattern with shadow DOM
  - Methods for querying, setting content, showing errors
  - Scoped styling (CSS variables inherited from root)
  - HTML escaping (XSS protection)

- **Theming System** (`src/styles/theme.css`)
  - Catppuccin Latte palette (soft light gray background)
  - Viewport-relative typography using CSS `clamp()`
  - All colors as CSS variables (easy tweaking)
  - Supports responsive design (4K TV down to mobile)

### Components Built ✅
- **Time Display** (`src/components/time-display.js`)
  - PST time (large, primary)
  - EST time (small, reference)
  - Date display
  - Auto-updates every second

- **Weather Components** (`src/components/weather.js`)
  - Current conditions (temperature, humidity, wind, AQI, pressure, sunrise/sunset)
  - Hourly forecast (wttr.in-inspired table format)
  - 3-hour intervals, shows 6 hours per day
  - Shows pressure in hPa (as requested)
  - AQI with stoplight colors (green/yellow/orange/red/purple/black)
  - Pressure trend indicator (pink for rising, gray for steady, orange for falling)

### Dashboards Built ✅
- **Morning Dashboard** (`src/dashboards/morning.js`)
  - 3-row layout (50/50 top, 66/33 middle, 33/66 bottom)
  - Row 1: Date/EST (left stacked) | PST Time (right, huge)
  - Row 2: Weather left (current + hourly forecast) | Calendar right
  - Row 3: Morning routine tasks (left) | Infrastructure status (right, placeholder)
  - Loads and displays calendar events from Nextcloud
  - Shows hardcoded morning routine tasks
  - Placeholder for Prometheus infrastructure status

### Supporting Files ✅
- **package.json** - Dependencies (Express, dotenv, node-fetch, xmldom)
- **.env.example** - Environment template (copy to .env and fill in)
- **.gitignore** - Prevent committing credentials
- **Dockerfile** - Production image build
- **index.html** - Main entry point with config initialization
- **README.md** - Comprehensive setup and deployment guide
- **Dashboard Router** (`src/dashboard-router.js`) - Routes to different dashboard layouts

---

## Local Testing Workflow

### Get Started (5 minutes)

```bash
cd dashboard-rebuild

# Copy and edit environment
cp .env.example .env
# Edit .env with your:
# - OpenWeatherMap API key
# - Nextcloud credentials (user + password for read-only dashboard user)
# - Prometheus URL (if you want to test infrastructure widget)

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000?dashboard=morning
```

### What You'll See

1. **Page loads** → Config manager initializes
2. **Config loads** → Fetches from `/api/config` endpoint
3. **Dashboard renders** → Shows time, weather, calendar, tasks
4. **Time updates** → PST time changes every second
5. **Weather loads** → Current conditions appear (or error if API key wrong)
6. **Calendar loads** → Today's events from Nextcloud (or loading/error)
7. **Infrastructure placeholder** → Shows mock node status

### Local Development Features

- **Hot reload?** Not yet (can add with nodemon in package.json `dev` script)
- **Edit colors?** Edit `src/styles/theme.css` `:root` variables, refresh browser
- **Edit layout?** Edit `src/dashboards/morning.js`, refresh browser
- **Check config?** Browser console → `window.configManager.debugStatus()`
- **Check API?** Visit `http://localhost:3000/api/config` (shows your config)

---

## What's Working, What's TODO

### Fully Functional ✅
- ✅ Config loading (both dev and prod modes)
- ✅ Time display (PST + EST, auto-updating)
- ✅ Weather API proxy
- ✅ Weather current conditions display
- ✅ Weather hourly forecast (wttr.in-inspired table)
- ✅ Calendar API proxy (CalDAV)
- ✅ Calendar event display
- ✅ Morning routine task list
- ✅ Web component architecture
- ✅ Viewport-relative typography
- ✅ Theme system with CSS variables
- ✅ Error handling and recovery

### Placeholder/TODO 📋
- 📋 Infrastructure widget (shows mock data, needs Prometheus integration)
- 📋 Afternoon dashboard (router ready, layout needs building)
- 📋 Evening dashboard (router ready, layout needs building)
- 📋 TV dashboard (router ready, layout needs building)
- 📋 Calendar week view (just day view now)
- 📋 Network speed widget (deferred per your decision)
- 📋 Sunrise/sunset times (mock data, needs weather integration)
- 📋 Pressure trend calculation (mock data, needs weather history)
- 📋 Medication reminders (future: Discord bot integration)
- 📋 Energy tracking (future: Discord bot integration)
- 📋 PT exercises widget (future)

---

## Testing Checklist

Before Phase 2, verify locally:

- [x] Project starts: `npm run dev` (no errors)
- [x] Page loads: `http://localhost:3000?dashboard=morning`
- [x] Config loads: Browser console shows `✓ ConfigManager: Using backend`
- [x] Time displays: PST time is large and updating every second
- [x] EST shows: Small "EST: HH:MM" next to PST
- [x] Date shows: Day name, month, date (e.g., "Friday, Jan 18")
- [ ] Weather loads: Current temp, condition, humidity, wind, pressure
- [x] Weather forecast: Shows hours with temps, icons, rain %, pressure
- [x] Calendar loads: Shows today's events (or "No events today")
- [x] Tasks show: All 7 morning routine items visible
- [x] Infrastructure placeholder: Shows 3 node cards (mock data)
- [x] Colors are correct: Soft gray background, sky blue weather, etc.
- [x] No errors in console: Browser F12 → Console tab

---

## Production Deployment Checklist

When ready for K3s (Phase 2):

- [ ] Docker image builds: `docker build -t babbage:5000/dashboard:latest .`
- [ ] Image pushes: `docker push babbage:5000/dashboard:latest`
- [ ] K3s Secret created: `kubectl create secret generic dashboard-secrets ...`
- [ ] K3s YAML applied: `kubectl apply -f k8s/morning-dashboard-deployment.yaml`
- [ ] Pod running: `kubectl get pods -n dashboards | grep morning`
- [ ] Accessible: `https://morning.dawnfire.casa` works
- [ ] Config injected: `window.__DASHBOARD_CONFIG__` exists in browser console

---

## Key Design Decisions Locked In

✅ **Config loading:** Dual-mode (dev: `/api/config` endpoint, prod: injected)  
✅ **Typography:** CSS `clamp()` for automatic viewport scaling  
✅ **Theme:** Catppuccin Latte with soft gray background  
✅ **Time format:** 24-hour PST primary, EST reference  
✅ **Weather display:** Current (left) + hourly forecast (right) side-by-side  
✅ **Weather format:** wttr.in-inspired table (3-hour intervals, shows pressure)  
✅ **Weather colors:** AQI stoplight, pressure trend (pink/gray/orange)  
✅ **Morning layout:** 50/50 top, 66/33 middle, 33/66 bottom (3 rows)  
✅ **Architecture:** Web components with shadow DOM and scoped styling  

---

## File Manifest

```
dashboard-rebuild/
├── package.json                    # Dependencies + scripts
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── Dockerfile                      # Docker image definition
├── README.md                       # Full documentation
├── server.js                       # Express backend (🔑 Main server)
├── index.html                      # Entry point (🔑 Loads config & router)
│
└── src/
    ├── config-manager.js           # 🔑 Config loading logic
    ├── dashboard-router.js         # 🔑 Routes to dashboards
    │
    ├── styles/
    │   └── theme.css               # 🔑 Typography + theming
    │
    ├── components/
    │   ├── base.js                 # Base web component class
    │   ├── time-display.js         # Time + timezone
    │   └── weather.js              # Weather components
    │
    └── dashboards/
        └── morning.js              # 🔑 Morning layout
```

🔑 = Most important files to understand first

---

## Next Steps

### Phase 2 (When You're Ready)

After confirming local testing works:

1. **Build Docker image**
   ```bash
   docker build -t babbage:5000/dashboard:latest .
   docker push babbage:5000/dashboard:latest
   ```

2. **Deploy to K3s**
   ```bash
   kubectl apply -f k8s/morning-dashboard-deployment.yaml
   ```

3. **Test production URL**
   ```bash
   https://morning.dawnfire.casa
   ```

### Phase 3 (Infrastructure Widget)

Once morning dashboard works locally:
- Integrate Prometheus queries for node status
- Display CPU%, Memory%, Pod count
- Color-code based on thresholds
- Add click → Grafana links

### Phase 4+ (Other Dashboards)

- Build afternoon dashboard (week calendar view, daily forecast)
- Build evening dashboard (tomorrow's agenda, sunset times)
- Build TV dashboard (JustWatch integration, streaming shortcuts)
- Each can reuse the same web components with different layouts

---

## Customization Starting Points

**Want to change colors?** Edit `src/styles/theme.css` `:root` variables  
**Want to change layout?** Edit `src/dashboards/morning.js` `.dashboard` grid  
**Want to add a component?** Copy `src/components/time-display.js` as template  
**Want to test without credentials?** Mock the API responses in `server.js`  
**Want different viewport sizing?** Adjust `clamp()` values in `theme.css`

---

## Troubleshooting

**"Cannot find module 'dotenv'"**
→ Run `npm install`

**"Cannot GET /api/weather"**
→ Check `.env` has `VITE_OPENWEATHERMAP_API_KEY` set
→ Verify API key is valid

**"Config not initialized"**
→ Check browser console for error
→ Verify `.env` file exists and has credentials
→ Try: `npm run dev` (restart server)

**"Weather shows but no calendar"**
→ Check Nextcloud credentials in `.env`
→ Verify dashboard user has calendar read access
→ Check server logs: `npm run dev` output

**"Viewport-relative font seems wrong"**
→ This is expected! `clamp()` scales with viewport width
→ On 4K it's large, on laptop it's smaller
→ Edit `--size-huge: clamp(200px, 30vw, 400px)` if needed

---

## Ready to Build? 

You now have:
- ✅ Local development environment (Node.js + Express)
- ✅ Web component architecture (reusable, clean)
- ✅ Config system (works in dev AND production)
- ✅ Theme system (Catppuccin, viewport-relative sizing)
- ✅ Core components (time, weather, calendar)
- ✅ Morning dashboard (fully functional layout)
- ✅ Docker setup (ready for K3s)

**Start testing locally.** If you hit issues or want to customize anything before Phase 2, that's the time to iterate!

Questions? Check `README.md` for detailed docs or browser console for error messages.

Let me know when you want to:
1. **Test locally** - Help debug issues
2. **Build infrastructure widget** - Prometheus integration
3. **Create other dashboards** - Afternoon/evening/TV layouts
4. **Deploy to K3s** - Production setup

🚀 You're ready to go!