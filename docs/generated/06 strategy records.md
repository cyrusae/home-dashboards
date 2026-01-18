# Dashboard Architecture Strategy - Analysis & Recommendations

**Date:** January 18, 2026  
**Context:** Evaluating expansion of morning.dawnfire.casa dashboard system  
**Scope:** Architecture decisions for morning/afternoon/evening dashboards + new features

---

## Current State Assessment

### What Works Well ✅
- **Clean, focused morning routine** - Single-purpose dashboard with weather, time zones, calendar, tasks
- **Solid technical foundation** - Express backend, proper auth handling (via env injection), clean separation of concerns
- **Responsive design** - Catppuccin theming, accessible layout (though minor viewport clipping issue noted)
- **Extensible architecture** - Adding new API endpoints is straightforward; front-end widget approach is clean

### Current Limitations ⚠️
- **Credential testing friction** - Only works with Kubernetes injection (can't test locally)
- **Viewport clipping** - Small bottom-of-screen cutoff suggests CSS height issue
- **Code duplication risk** - Three similar dashboards using copy-paste pattern = maintenance nightmare
- **Limited monitoring** - No infrastructure visibility (Prometheus integration is stubbed out)
- **Single widget type** - All sections use same styling (good consistency, but limits visual variety for TV mode)

---

## Option Analysis

### Option A: Refine Current + Copy Pattern

**What it is:** Polish morning dashboard further, copy entire codebase 3x, customize each copy

**Pros:**
- No architecture refactor needed
- Can start immediately
- Each dashboard can diverge freely if needs differ

**Cons:** ❌ **Avoid this**
- Three nearly-identical codebases = triple the bugs
- Any fix to `server.js` means updating 3 files
- CSS tweaks need applying in 3 places
- Configuration management nightmare (3x environment variables)
- Scaling to 4+ dashboards becomes unsustainable
- TV dashboard becomes "one more copy" instead of something special
- Nightmare to onboard anyone else to maintain this

**Verdict:** This becomes technical debt fast. You'll regret it when timezone calc has a bug.

---

### Option B: Single Subdomain with Routes + Web Components

**What it is:** `dash.dawnfire.casa/{morning|afternoon|evening|tv}` with shared backend, component-based frontend

**Architecture:**

```
Frontend:
  └─ index.html (router, loads components dynamically)
     ├─ <dashboard-morning>
     ├─ <dashboard-afternoon>
     ├─ <dashboard-evening>
     └─ <dashboard-tv>

Backend:
  └─ server.js (same 4 endpoints for all dashboards)
     ├─ /api/prometheus/query
     ├─ /api/calendar/events
     ├─ /api/weather
     └─ /api/dashboard/config (returns which widgets for this dashboard)
```

**Component Structure:**
- `<widget-weather>` - Reusable, configurable (forecast detail, week view, etc.)
- `<widget-calendar>` - Reusable, configurable (day view, week view, etc.)
- `<widget-prometheus>` - Reusable, configurable (node status, pod health, etc.)
- `<widget-tasks>` - Reusable, configurable (morning routine, TV quick links, etc.)
- `<widget-clock>` - Reusable (multiple timezones, large PST for morning, small for TV)

**Pros:** ✅ **This is the winner**
- Single codebase, single server
- Shared components = no duplication
- Easy to add dashboards (just define a new layout)
- Each dashboard can request config: `GET /api/dashboard/config?dashboard=tv`
- Components are testable in isolation
- TV mode can use different styling without affecting morning
- Can test locally by setting `dashboard=morning` query param
- Future dashboards (bathroom, kitchen, study?) just add a new route
- Credentials still injected (no local testing yet) but infra is cleaner

**Cons:**
- Requires refactoring (but cleaner long-term)
- Web components have browser compatibility considerations (all modern browsers though)
- Slightly more complex startup logic (route selection)

**Recommended Approach:**
1. Build a `DashboardConfig` abstraction that defines layouts
2. Move widget styles to component-scoped CSS (or shared with CSS variables)
3. Backend `/api/dashboard/config` returns { widgets, layout, theme, refreshIntervals }
4. Frontend router loads dashboard and creates appropriate widgets

---

### Option C: Homepage + Custom Theme

**What it is:** Use the existing Homepage solution, customize it heavily for your use case

**Pros:**
- Pre-built widget ecosystem
- Integrates cleanly with *arr/*Jellyfin when media stack arrives
- Active maintained project
- You already have it running!

**Cons:** ❌ **For now, not the right choice**
- Overkill for simple morning dashboard (lots of features you don't need)
- Homepage is "dashboard for all your services" not "optimized for time of day"
- TV mode widgets would be cramped in Homepage's paradigm
- Customization requires learning Homepage config format (vs. your own codebase)
- Less control over layout/styling for custom widgets like Prometheus health

**When to reconsider:** Once media stack exists, Homepage becomes more valuable. Could do:
- Homepage for "service discovery + media browsing"
- Custom dashboards for "morning routine / TV / status monitoring"
- Both available, different purposes

---

## Feature Priority Matrix

### Must-Have (blocks other features)
- **Local testing support** - Can't iterate with container injection only
  - Solution: Load config from localStorage with fallback to window.__DASHBOARD_CONFIG__
  - Add a simple config modal: "Enter credentials" → localStorage
  - Persists locally, doesn't affect prod
- **Viewport fix** - That clipping is annoying
  - Solution: `height: 100vh` on body, `overflow: hidden` on dashboard

### High-Value, Medium-Effort
- **Prometheus monitoring** - Glance-ability is the goal
  - Basic: Node status (up/down) with color coding
  - Next: Pod counts by node, resource % usage
  - Visualization: Simple grid of cards with status colors
- **Multi-day weather forecast** - Better planning
  - Daily cards: High/Low, condition, rain %
  - 7-day view would be nice but 5-day is fine
- **Week calendar view** - See patterns/density
  - Grid layout showing what's booked when

### Nice-to-Have (lower priority)
- **Custom task management** - Currently hardcoded, could use task API
- **Network speed widget** - Interesting but let's validate TV mode first

### TV-Mode Specific
- **Justwatch integration** - Makes sense as starting point (search bar + results)
- **Quick links** - YouTube, Netflix, etc.
- **Network speed test results** - Status widget
- **Large, minimal design** - Bold fonts, high contrast, glance-friendly
- **Auto-refresh** - TV dashboard should cycle widgets or refresh frequently

---

## Recommended Implementation Path

### Phase 1: Local Testing + Architecture Refactor (1-2 sessions)
1. **Fix local testing**
   - Add localStorage-based config fallback
   - Config modal for credentials
   - Backend checks env vars first, then accepts header-based config if testing
2. **Refactor to web components**
   - Convert sections to components: `<weather-widget>`, `<calendar-widget>`, etc.
   - Keep styles but scope them to components
   - Test that morning dashboard still works
3. **Implement router**
   - Single `index.html` loads different dashboard based on URL
   - Fallback to "morning" for backward compatibility
4. **Move to shared subdomain**
   - Update DNS to `dash.dawnfire.casa`
   - Old `morning.dawnfire.casa` redirects here with `?dashboard=morning`

**Deliverable:** Same visual experience, but code is now maintainable and testable locally

### Phase 2: Prometheus Monitoring (1 session)
1. **Implement Prometheus widget**
   - Query: Node status (each node up/down, CPU%, memory%)
   - Visual: 3-card grid for Babbage/Epimetheus/Kabandha
   - Color coding: green (healthy), yellow (warning), red (critical)
   - Refresh every 30s
2. **Add to morning dashboard**
   - New bottom row or small widget in top-right corner
   - Glanceable: "Is there a problem I should fix?"

### Phase 3: TV Dashboard (1 session)
1. **Design different layout**
   - Large clock (center), minimal
   - 4 quick-access cards: YouTube, Netflix, Jellyfin (when exists), Justwatch
   - Below: Network status, system health, current weather
   - Rotation: Show weather forecast one minute, switch to something else
2. **Justwatch integration**
   - Embed search box with basic styling
   - Link results to Justwatch (easier than building player)
3. **Auto-cycle widgets**
   - Every 2-3 minutes, rotate which widget is prominent
   - Keep status visible always (small corner)

### Phase 4: Afternoon/Evening Dashboards (1 session)
1. **Afternoon** - Professional / productivity focused
   - Calendar week view
   - Task breakdown for day
   - Weather (rain risk for outdoor plans)
   - Pomodoro timer widget (nice to have)
2. **Evening** - Relaxation / planning
   - Tomorrow's agenda (what's coming)
   - Evening weather
   - Personal notes / reflections space
   - Reading recommendations from Goodreads (if feeling fancy)

### Phase 5: Enhanced Features (as needed)
- Multi-day weather graphs
- Task completion tracking
- Mood/energy logging
- Meal planning

---

## Local Testing Implementation (Quick Win)

Here's the fastest path to testable code:

```javascript
// In dashboard.js, early in file:
const getConfig = () => {
  // Try injected config first (production)
  if (window.__DASHBOARD_CONFIG__) {
    return window.__DASHBOARD_CONFIG__;
  }
  
  // Try localStorage (local testing)
  const stored = localStorage.getItem('dashboardConfig');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Stored config invalid, showing modal');
    }
  }
  
  // Show config modal
  showConfigModal();
  return null;
};

const showConfigModal = () => {
  // Simple form: ask for API key, Nextcloud user/password
  // Save to localStorage on submit
  // Reload page
};
```

**For server.js:**
```javascript
// Accept config via X-Dashboard-Config header (JSON-encoded)
// Useful for testing without container injection
if (req.headers['x-dashboard-config']) {
  Object.assign(CONFIG, JSON.parse(req.headers['x-dashboard-config']));
}
```

This lets you test locally without touching Kubernetes, and prod still uses env injection.

---

## Widget Ideas Not in Original Spec

### Morning-Specific
- **Medication reminder** - Visual checklist (you mention meds in routine)
- **Energy level tracker** - Quick 1-5 rating, shows trend
- **Gym class schedule** - If you have recurring classes

### TV-Specific
- **Currently watching** - Integration with Jellyfin (when available)
- **What's new on subscriptions** - Polls streaming services (JustWatch has this)
- **Household calendar view** - So everyone knows what's going on
- **Motion detector** - Lights up when motion seen (with camera integration)
- **Birthday/anniversary countdown** - Fun, glanceable dates

### General
- **Sunrise/sunset times** - Useful for seasonal awareness
- **Air quality index** - You care about outdoor air
- **Hydration reminder** - "Have you had water today?"
- **Music now playing** - If you use music service
- **Quote of the day** - Inspirational or funny

### Infrastructure (homelab-specific)
- **Storage usage** - How much space left on each drive
- **Backup status** - Last successful backup timestamp
- **VPN status** - Tailscale connected?
- **Alerts** - Any Prometheus alerts firing?

---

## Recommendation Summary

**Go with Option B (Single Subdomain + Web Components)**

**Reasoning:**
1. Your infrastructure is clean enough (K3s, env injection) that shared backend makes sense
2. Web components fit your skill level (JavaScript you already know + encapsulation)
3. Scales from 3 dashboards to 10+ without adding complexity
4. Each dashboard can have wildly different layouts (morning vs. TV) using same code
5. Long-term maintainability is worth the upfront refactor
6. Enables local testing (solves a real friction point)

**Quick wins in order:**
1. Fix viewport clipping (5 min)
2. Add local testing via localStorage (30 min)
3. Convert to web components (2-3 hours)
4. Test that morning dashboard works with new architecture
5. Then add new dashboards one at a time

**TV dashboard notes:**
- Start simple (clock + links + weather)
- Justwatch integration is nice-to-have, not blocker
- Network speed test can come later
- MVP: Something you can open on a Roku or Fire Stick and see useful info

---

## Next Steps

Would you like me to:
1. **Start Phase 1** - Build out web component infrastructure + local testing?
2. **Discuss any of the widget ideas** - Anything particularly appealing?
3. **Plan the Prometheus monitoring widget** - What metrics matter most for "is something broken?"
4. **Sketch out TV layout** - What should be prominent vs. secondary?

I'm ready to start coding whenever you are. What's most exciting to you?

---

# Dashboard Architecture - Refined Requirements

**Date:** January 18, 2026  
**Status:** Updated with user refinements  
**Scope:** Concrete widget library, layout specifications, implementation phases

---

## Dashboard Layout Map

### Morning Dashboard (morning.dawnfire.casa)
**Purpose:** Time-sensitive routine management + status check  
**Color Scheme:** Catppuccin Latte (current)  
**Target Device:** 4K TV (via Epimetheus)

**Layout (3-row grid):**
```
┌─────────────────────────────────────────────────────────────┐
│  DATE / EST TIME (L)  │  PST TIME LARGE (R)                 │
├─────────────────────────────────────────────────────────────┤
│  WEATHER CURRENT (Full width - see Weather Widget section)  │
├──────────────────────┬──────────────────┬────────────────────┤
│  MORNING ROUTINE     │  CALENDAR DAY    │  INFRASTRUCTURE    │
│  (Tasks)             │  (Today events)  │  (Health status)   │
│                      │                  │  Babbage/Epimetheus│
│                      │                  │  Kabandha status   │
└──────────────────────┴──────────────────┴────────────────────┘
```

**Row 2 Detail (Weather):**
- Current conditions widget (temp, humidity, AQI, wind, precipitation indicator)
- Hourly forecast (next 12 hours, 4-col grid as-is)
- **Future:** Barometric pressure + migraine sensitivity indicator

**Row 3 Right (Infrastructure) - NEW:**
- 3 cards: Babbage, Epimetheus, Kabandha
- Each shows: Status (🟢/🟡/🔴), CPU%, Memory%, Pod count
- Clickable → links to Grafana (future enhancement)
- Color codes: Green (healthy), Yellow (warning), Red (critical/down)

**Row 3 Left (Morning Routine):**
- Keeps current hardcoded checklist
- **Future:** Interactivity via Discord bot (external system)
- **Future:** Medication reminders + tracking (marks taken, shows next dose time)

**Row 3 Middle (Calendar):**
- Today's events only (current behavior, keep as-is)

**New optional item (pending decision):**
- PT exercises reminder widget (probably doesn't belong on morning display if doing them throughout day, needs research on timing)

---

### Afternoon Dashboard (afternoon.dawnfire.casa)
**Purpose:** Task planning + weather awareness + streaming decision point  
**Color Scheme:** Catppuccin Latte (or Mocha? TBD)  
**Target Device:** 4K TV (via Epimetheus)

**Layout (suggested):**
```
┌──────────────────────────────────────────────────────────────┐
│  TIME / DATE (optional, smaller than morning)               │
├──────────────────────────────────────────────────────────────┤
│  WEATHER OVERVIEW (Current conditions + AQI + Pressure)      │
├──────────────────────┬──────────────────────────────────────┤
│  CALENDAR WEEK       │  DAILY WEATHER FORECAST              │
│  (Next 7 days,       │  (Conditions by hour for today,      │
│   showing busy-ness) │   plan errands around weather)       │
├──────────────────────┼──────────────────────────────────────┤
│  HARDCODED REMINDERS │  INFRASTRUCTURE STATUS               │
│  (Martin meds, etc)  │  + Network Speed                     │
└──────────────────────┴──────────────────────────────────────┘

│  [→ TV DASHBOARD] link (or button to switch?)               │
```

**Row 3 Left (Hardcoded Reminders):**
- "Martin should have taken his meds by now"
- "Cyrus: do you need to...?"
- Time-based (only shows if relevant to current time)
- **Future:** Discord-bot managed

**Row 3 Right (Infrastructure + Network):**
- Same 3-card node status as morning
- Below: Network speed (current speed test result OR last-run timestamp + value)
- Network speed priority: Include on all non-morning displays

**Jump Link:**
- Prominent button/link: "→ Watch something? (TV Dashboard)"
- Or auto-suggested based on time (afternoon after X time?)

---

### Evening Dashboard (evening.dawnfire.casa)
**Purpose:** Tomorrow planning + relaxation + routine closure  
**Color Scheme:** Catppuccin Mocha (darker for evening mode)  
**Target Device:** 4K TV (via Epimetheus)

**Layout (suggested):**
```
┌──────────────────────────────────────────────────────────────┐
│  TIME / DATE (small)                                         │
├──────────────────────────────────────────────────────────────┤
│  WEATHER TONIGHT + TOMORROW (Conditions + Sunset time)       │
├──────────────────────┬──────────────────────────────────────┤
│  TOMORROW'S AGENDA   │  WEEKLY WEATHER OUTLOOK              │
│  (Next day events    │  (Conditions by day, AQI forecast,   │
│   start times)       │   highs/lows, best day for outdoor?) │
├──────────────────────┼──────────────────────────────────────┤
│  HARDCODED REMINDERS │  INFRASTRUCTURE STATUS               │
│  (Cyrus: dinner meds,│  + Network Speed                     │
│   dressings, Sunday: │                                      │
│   injection)         │  Sunrise/Sunset times                │
└──────────────────────┴──────────────────────────────────────┘

│  [→ TV DASHBOARD] link                                       │
```

**Row 3 Left (Hardcoded Reminders):**
- "Cyrus: Take dinner meds + evening meds"
- "Cyrus: Replace wound dressings"
- "Sunday: Do injection" (conditional on day-of-week)
- Time-based activation (appears when relevant)

**Row 3 Right (Infrastructure + Network + Astronomy):**
- Same 3-card node status
- Network speed widget
- Sunrise/Sunset times (good for planning next day)
- AQI forecast (migraine planning)

**Jump Link:**
- "→ Watch something? (TV Dashboard)"
- Or auto-suggested if evening is relaxation time

---

### TV Dashboard (tv.dawnfire.casa or dash.dawnfire.casa?tv=tv)
**Purpose:** Streaming decision + system health check  
**Color Scheme:** Catppuccin Mocha (high contrast for TV viewing)  
**Target Device:** 4K TV (via Epimetheus, or theoretically a Roku/Fire stick if needed later)

**Layout (bold, minimal, glanceable):**
```
┌──────────────────────────────────────────────────────────────┐
│                    LARGE PST TIME                            │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│  [🔍 YouTube Search]        [JustWatch Search]              │
│     (embed search bar)           (link or embed)             │
├──────────┬────────────────┬────────────────┬─────────────────┤
│ Currently│ What's New on  │ Network Status │ Infrastructure  │
│ Watching │ Subscriptions  │ (speed test)   │ Status          │
│ (Jellyfin│ (JustWatch     │ (is streaming  │ (quick look:    │
│ when     │ future widget) │ viable?)       │ all 3 nodes up?)│
│ exists)  │ (future)       │                │                 │
├──────────┴────────────────┴────────────────┴─────────────────┤
│  Weather Right Now (current conditions + next 3 hours)       │
│  (conditions emphasize: is it raining/snowing/etc)           │
└──────────────────────────────────────────────────────────────┘
```

**Key Design Principles:**
- Large, readable at distance
- Search bars reduce friction (find → select source → start watching)
- Status widgets are small but prominent (answer: "should I stream?")
- Weather is "nice to have" context (not main focus)
- **Auto-cycle is NOT MVP** - Just have it be a landing page
- Intentionally omits calendar/tasks/personal items (keep it about *finding something to watch + system health*)

**MVP Components:**
1. ✅ PST time (large)
2. ✅ YouTube search bar (friction-reducer for searches)
3. ✅ JustWatch link/search (decision making)
4. ✅ Network speed widget (is internet working for streaming?)
5. ✅ Infrastructure status (can/should you stream?)
6. ✅ Current weather (context, not primary)

**Future Enhancements (not MVP):**
- JustWatch embed (currently just link)
- Currently watching from Jellyfin (when Jellyfin exists)
- What's new on subscriptions aggregator (when JustWatch API explored)
- Auto-cycle between info panels

---

## Widget Component Library

### Weather Widgets

#### 1. Weather Current Conditions (Reusable)
**Props:** location, units (imperial/metric), showPressure, showAQI, showWind

**Displays:**
- Current temperature (large)
- Current condition (text)
- Humidity %
- Wind speed + direction
- AQI (with color coding: green/yellow/red/purple)
- **NEW:** Barometric pressure (important for migraine sensitivity)
- Precipitation indicator (is it raining/snow? immediate visual indicator)

**Refresh:** Every 10 minutes

**Styling variants:** Morning (compact), TV (larger fonts)

---

#### 2. Weather Hourly Forecast (Reusable)
**Props:** hours=12, location, condensed=false

**Displays:**
- Grid of hourly cards: time, icon, temp, precipitation %
- Current: 4-column grid
- Can be 3-col or 2-col variant for space constraints

**Refresh:** Every 15 minutes

---

#### 3. Weather Daily Forecast (Reusable)
**Props:** days=5, location, showDetails=true

**Displays:**
- One card per day: Day name, icon, High/Low, condition, AQI forecast
- Can expand to show hourly breakdown within day (afternoon use case)

**Refresh:** Every 30 minutes

---

#### 4. Weather Overview (NEW - combines multiple)
**Purpose:** "Which day this week should I plan outdoors?"

**Displays:**
- 7-day cards showing: Day, condition, high/low, rain risk, AQI
- Color-coded for planning (green = good outdoor day, yellow = maybe, red = stay in)

**Refresh:** Every 30 minutes

---

#### 5. Sunrise/Sunset Times (NEW, Reusable)
**Props:** location, showTimes=true

**Displays:**
- Sunrise time + icon
- Sunset time + icon
- Optional: daylight hours remaining (good for "how much daylight left?")

**Refresh:** Once daily

---

### Calendar Widgets

#### 1. Calendar Day View (Current - keep as-is)
**Props:** includeTime=true, maxEvents=10

**Displays:**
- Today's events, sorted by start time
- Shows start/end times
- Calendar name indicator

**Refresh:** Every 5 minutes

---

#### 2. Calendar Week View (NEW - Reusable)
**Props:** includeTime=false, highlightToday=true

**Displays:**
- 7-day grid (or 5-day M-F variant)
- Shows density: "Tuesday is busy", "Friday is clear"
- Click to expand day? (Future enhancement)

**Refresh:** Every 10 minutes

---

#### 3. Calendar Tomorrow's Agenda (NEW - Reusable)
**Props:** none

**Displays:**
- Tomorrow's events only
- Start times prominent
- Good for evening "what's coming tomorrow?"

**Refresh:** Every 10 minutes

---

### Task/Reminder Widgets

#### 1. Morning Routine (Current - keep as-is)
**Props:** tasks=[], interactive=false

**Displays:**
- Hardcoded list of tasks with checkmarks
- Currently non-interactive (future: Discord bot)

**Refresh:** Never

---

#### 2. Hardcoded Reminders (NEW - Reusable)
**Props:** reminders=[], timeBasedShow=true

**Displays:**
- List of reminder strings
- Only shows if relevant to current time (configurable)
- Examples: "Martin should have taken his meds by now" (afternoon), "Cyrus: Replace wound dressings" (evening)
- Day-of-week conditional: "Sunday: Do injection"

**Future:** Each reminder could have interactive checkbox (via Discord bot or local UI)

**Refresh:** Never (but can trigger re-render on hour change)

---

#### 3. PT Exercises (FUTURE - Reusable)
**Props:** exercises=[], timeOfDay, interactiveReminders=false

**Displays:**
- List of PT exercises with brief descriptions
- Time-of-day indicator: "Best done in the morning" vs "you probably forgot"
- **Future:** Interactive walk-through with rep counting

**Status:** TBD - depends on research into when Cyrus actually does PT

---

### Infrastructure Widgets

#### 1. Node Status Card (NEW - Reusable)
**Props:** nodeName, prometheusQuery

**Displays:**
- Node name (Babbage / Epimetheus / Kabandha)
- Status: 🟢 / 🟡 / 🔴 (up / warning / down)
- CPU %
- Memory %
- Pod count
- Clickable → Grafana dashboard (future)

**Refresh:** Every 30 seconds

**Color Coding:**
- 🟢 Green: CPU < 60%, Memory < 80%, all pods running, node responding
- 🟡 Yellow: CPU 60-85% OR Memory 80-95% OR 1+ pod not running
- 🔴 Red: CPU > 85% OR Memory > 95% OR node down OR multiple pod failures

---

#### 2. Alerts Widget (NEW - Reusable)
**Props:** maxAlerts=5

**Displays:**
- Count of active Prometheus alerts
- List of alert names (if open)
- 🔴 if any critical alerts
- 🟡 if any warnings

**Refresh:** Every 10 seconds (high priority)

---

#### 3. Tailscale Status (NEW - Reusable)
**Props:** none

**Displays:**
- Connection status (🟢 Connected / 🔴 Disconnected)
- Current exit node (optional)

**Refresh:** Every 60 seconds

---

### Network Widgets

#### 1. Network Speed (NEW - Reusable)
**Props:** showLatency=false, showUpload=false

**Displays:**
- Download speed (primary metric)
- Last test timestamp
- Optional: Upload speed, latency
- Visual indicator: 🟢 (>50 Mbps), 🟡 (20-50), 🔴 (<20)
- Animated: "Testing..." state while speed test runs

**Behavior:**
- Runs speed test on-demand (manual button) OR periodically (nightly at 2 AM? configurable)
- Stores last result in localStorage (survives page refresh)

**Refresh:** As-needed (manual or periodic, not continuous)

---

### Entertainment Widgets

#### 1. YouTube Search Bar (NEW - TV mode)
**Props:** none

**Displays:**
- Search input field with YouTube branding
- On submit: Opens YouTube with search query in new tab (SmartCast fallback)
- OR: Embeds YouTube embed? (TBD if that's better UX)

---

#### 2. JustWatch Search/Link (NEW - TV mode)
**Props:** showEmbed=false

**Displays:**
- Search bar (embeds JustWatch search)
- OR: Direct link to JustWatch main page
- Goal: Reduce friction to "where can I watch X?"

---

#### 3. Currently Watching (NEW - TV mode, FUTURE)
**Props:** jellyfinURL

**Displays:**
- Show/movie title (what Jellyfin says is currently playing)
- Resume button (continue from where you left off)
- Depends on: Jellyfin integration with Jellystat or similar

**Status:** TBD - depends on Jellyfin deployment

---

#### 4. What's New (NEW - TV mode, FUTURE)
**Props:** sources=['netflix', 'hulu', 'disney+']

**Displays:**
- Card per service showing new releases (probably via JustWatch API?)
- Rotation: Show different service each minute

**Status:** TBD - requires API exploration

---

## Layout Specifications

### Grid System (All Dashboards)
- Base: CSS Grid with max-width container on 4K displays
- Responsive: Stack vertically on smaller displays
- Gutters: 30px (current, adjust if needed)

### Typography (4K TV distances)
- **Minimal:** Labels, timestamps: 18-22px
- **Body:** Most text: 24-28px
- **Large:** Headers, section titles: 32-40px
- **Huge:** PST time (morning/TV): 200-280px
- **Massive:** PST time (TV, if size permits): 300-400px

### Color Scheme Decisions
- **Morning:** Catppuccin Latte (current ✅)
- **Afternoon:** TBD (Latte for consistency? Mocha for distinction?)
- **Evening:** Catppuccin Mocha (darker, winddown vibe)
- **TV:** Catppuccin Mocha (high contrast, visible from distance)
- **Weather coloring:** Conditional on precipitation (blue = rain, white = snow, yellow = clear, gray = cloudy)

### Accessibility
- Minimum contrast ratios for all text (WCAG AA)
- Large tap targets (if touch interaction added later)
- No flashing elements
- Auto-refresh won't disorient (happens quietly in background)

---

## Architecture Notes

### Backend Endpoints (Shared)

```
GET /api/dashboard/config?dashboard=morning
→ Returns: { widgets: [...], layout: {...}, refreshIntervals: {...} }

GET /api/weather?location=Seattle,US
→ Returns: { current: {...}, hourly: [...], daily: [...], aqi: {...}, pressure: {...} }

GET /api/calendar/events?date=today|tomorrow|week
→ Returns: Array of events

GET /api/prometheus/health
→ Returns: { babbage: {...}, epimetheus: {...}, kabandha: {...} }

GET /api/prometheus/alerts
→ Returns: Array of active alerts

GET /api/network/speed?test=true
→ Returns: { speed_mbps: 120, timestamp: X, latency_ms: 25, upload_mbps: 15 }

GET /api/tailscale/status
→ Returns: { connected: boolean, exitNode: string }

GET /api/justwatch/search?query=...
→ Returns: Redirect to JustWatch (or proxy results)
```

### Frontend Structure

```
/index.html (router)
/src/
  ├─ router.js (loads dashboard based on URL)
  ├─ config-manager.js (localStorage fallback + env injection)
  ├─ components/
  │  ├─ weather/
  │  │  ├─ weather-current.js
  │  │  ├─ weather-hourly.js
  │  │  ├─ weather-daily.js
  │  │  ├─ weather-overview.js
  │  │  └─ sunrise-sunset.js
  │  ├─ calendar/
  │  │  ├─ calendar-day.js
  │  │  ├─ calendar-week.js
  │  │  └─ calendar-tomorrow.js
  │  ├─ tasks/
  │  │  ├─ morning-routine.js
  │  │  ├─ hardcoded-reminders.js
  │  │  └─ pt-exercises.js (future)
  │  ├─ infrastructure/
  │  │  ├─ node-status.js
  │  │  ├─ alerts.js
  │  │  └─ tailscale-status.js
  │  ├─ network/
  │  │  └─ network-speed.js
  │  └─ entertainment/
  │     ├─ youtube-search.js
  │     ├─ justwatch-search.js
  │     ├─ currently-watching.js (future)
  │     └─ whats-new.js (future)
  ├─ styles/
  │  ├─ theme-latte.css
  │  ├─ theme-mocha.css
  │  └─ typography-4k.css
  └─ layouts/
     ├─ morning.js
     ├─ afternoon.js
     ├─ evening.js
     └─ tv.js

/dashboards/
  ├─ morning.html (load from index.html?dashboard=morning)
  ├─ afternoon.html (load from index.html?dashboard=afternoon)
  ├─ evening.html (load from index.html?dashboard=evening)
  └─ tv.html (load from index.html?dashboard=tv)
```

---

## Implementation Priority Matrix

### MVP Phase 1: Core Infrastructure (Must Have)
- [ ] Local testing support (localStorage + config modal)
- [ ] Web component structure + refactor current morning dashboard
- [ ] Fix viewport clipping
- [ ] Shared backend endpoints
- [ ] Route-based dashboard loading

**Deliverable:** morning.dawnfire.casa works as before, but code is maintainable

---

### Phase 2: Morning Expansion (High Priority)
- [ ] Infrastructure widget (node status + basic health)
- [ ] Prometheus integration (queries for node status)
- [ ] Move infrastructure to bottom-right (layout shift)
- [ ] Calendar stays in middle, shrink to 1/3 width
- [ ] Add barometric pressure to weather current widget

**Deliverable:** Morning dashboard shows homelab health at a glance

---

### Phase 3: Afternoon Dashboard (Medium Priority)
- [ ] Calendar week view widget
- [ ] Daily weather forecast widget (hourly breakdown)
- [ ] Hardcoded reminders widget (time-based)
- [ ] Network speed widget
- [ ] Jump link to TV dashboard
- [ ] Choose afternoon color scheme

**Deliverable:** afternoon.dawnfire.casa ready for use

---

### Phase 4: Evening Dashboard (Medium Priority)
- [ ] Calendar tomorrow's agenda widget
- [ ] Weather tonight + tomorrow widget
- [ ] Weekly weather outlook widget
- [ ] Sunrise/sunset times widget
- [ ] Hardcoded reminders widget (with Sunday conditional)
- [ ] Network speed widget
- [ ] Switch to Mocha color scheme

**Deliverable:** evening.dawnfire.casa ready for use

---

### Phase 5: TV Dashboard (Medium Priority, but full-featured)
- [ ] YouTube search bar (reduce friction)
- [ ] JustWatch integration (decision making)
- [ ] Network speed widget (streaming viability check)
- [ ] Infrastructure status (quick health check)
- [ ] Current weather (context)
- [ ] Large, bold typography for distance viewing
- [ ] Mocha color scheme

**Deliverable:** tv.dawnfire.casa is usable and worth opening vs. SmartCast

---

### Phase 6: Enhancements (Lower Priority)
- [ ] Alerts widget (Prometheus active alerts)
- [ ] Tailscale status widget
- [ ] Clickable infrastructure → Grafana
- [ ] Conditional weather coloring (blue = rain, etc.)
- [ ] PT exercises widget (after research on timing)
- [ ] Medication reminders + tracking (future: Discord bot integration)
- [ ] Energy tracker (future: Discord bot integration)
- [ ] What's new aggregator (future: JustWatch API exploration)
- [ ] Currently watching from Jellyfin (future: after Jellyfin deployment)

---

## Open Questions / TBD

1. **Afternoon color scheme:** Latte for consistency, or Mocha to distinguish from morning?
   - Recommendation: Try Latte first (simpler theme management), switch to Mocha if it feels too similar

2. **PT Exercises timing:** When are you most likely to actually do them?
   - Options: Morning display, Evening display, Both (with different messaging), Separate dashboard?
   - Decision needed before Phase 2 expansion

3. **Network speed test:**
   - Manual (button to test now) or periodic (nightly, then show cached result)?
   - Recommendation: Manual button MVP (no cron dependency), add periodic in Phase 6

4. **Speed test threshold colors:**
   - Current guess: 50 Mbps (🟢), 20-50 (🟡), <20 (🔴)
   - Adjust based on your actual needs?

5. **JustWatch embed vs. link:**
   - Embed their search (if API allows) vs. link to their site?
   - Recommendation: Start with link (simpler), embed later if UX feels clunky

6. **YouTube search behavior:**
   - Opens YouTube search in new tab (keeps TV dashboard open) or embedded?
   - Recommendation: New tab (respects preference to use SmartCast, just reduces friction for finding)

7. **Home Assistant future state:**
   - "Who's doing laundry?" and "dishes done?" widgets would need HA integration
   - Leave space in architecture (extra widget slot) but don't code yet?
   - Recommendation: Yes, reserve a future widget spot in evening dashboard

---

## Notes for Implementation

- **Theme switching:** Make theme a query parameter or configurable in dashboard config
- **Responsive breakpoints:** Define what happens on <1080p (unlikely but good to handle)
- **Refresh intervals:** Make all refresh rates configurable per-dashboard
- **Error handling:** Show graceful failures ("Weather unavailable", not stack traces)
- **Loading states:** Skeleton loaders while fetching data (especially Prometheus which might be slow)
- **Timezone handling:** All times should be explicit PST (morning/afternoon/evening) or PST with EST for morning
- **localStorage scope:** Use dashboard name as key prefix (morning_config, afternoon_config, etc.)
- **Credential security:** Never log credentials, only store in localStorage/env (never in sessionStorage)

---

## Next Steps

Ready for Phase 1? Here's what I'd build first:

1. **Config system** (localStorage fallback + modal) - 30 min
2. **Web component structure** - 45 min (establish patterns, port one component)
3. **Viewport fix** - 5 min
4. **Router setup** - 30 min
5. **Test that morning still works** - 15 min

**Total:** ~2 hours to get to a clean, testable starting point for Phase 2.

Want me to start coding this, or discuss any of these decisions first?

---

# Dashboard Layouts - Revised + Weather Design Deep Dive

**Date:** January 18, 2026  
**Focus:** Concrete layouts (visual ASCII), weather widget design, network speed architecture

---

## Morning Dashboard - Revised Layout

**Visual Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│  DATE (box)          │                                         │
│  ────────────────────│           PST TIME (no border)         │
│  EST TIME (box)      │           (mauve/TBD accent)           │
├────────────────────────────────────────────────────────────────┤
│                      │                                         │
│  WEATHER CURRENT     │        CALENDAR TODAY                   │
│  (AQI, Pressure)     │        (Events only)                    │
│  ────────────────────│                                         │
│  SUNRISE/SUNSET      │                                         │
│  ────────────────────│                                         │
│  HOURLY FORECAST     │                                         │
│  (with pressure, AQI)│                                         │
│  [grid TBD]          │                                         │
├────────────────────────────────────────────────────────────────┤
│  HARDCODED TASKS     │  INFRASTRUCTURE (3 cards):             │
│  (morning routine,   │  Babbage | Epimetheus | Kabandha      │
│   meds, etc)         │  [each: status, CPU%, mem%, pods]      │
└────────────────────────────────────────────────────────────────┘

Row 1: [50% | 50%]
  Left:  Date (stacked above EST) in border boxes, soft gray bg
  Right: PST time LARGE, no border, white outline accent (testing needed)

Row 2: [66.67% | 33.33%]
  Left:  Weather stack (current → sunrise/sunset → hourly)
  Right: Calendar day view (keep current behavior)

Row 3: [33.33% | 66.67%]
  Left:  Task list (morning routine, meds, etc)
  Right: Infrastructure (3 equal-width cards in row)
```

**Color Scheme - Morning:**
- Background: Soft light gray (Catppuccin Latte has `--latte-crust: #dce0e8` or maybe slightly lighter?)
- Text: Current (--text-primary: #4c4f69)
- Accent: TBD - PST time needs testing (currently mauve, but "not quite happy with it")
- Widget borders: Keep current (maroon, flamingo, sky, teal, lavender as per current CSS)

**Typography - Times:**
- PST: Primary (no label needed, context is clear)
- EST: Smaller, labeled "EST: HH:MM" (reference point for Tea's timezone)
- All times 24-hour format, consistent with current

---

## Weather Widget Design - Deep Exploration

### Current Problem Statement
- 4×3 grid (12 forecast slots) is unintuitive—users don't realize multiple days are present
- Wttr.in aesthetic is appealing (ASCII art, good information density)
- Need to support both Latte (light) and Mocha (dark) color schemes
- Default should be sky blue, not yellow
- Precipitation signaling via saturation (darker = rainier) instead of color change

### Weather Widget Family - Proposed Options

---

#### WIDGET 1: Current Conditions (Stay mostly as-is, enhance)

**What it shows:**
- Temperature (large, primary)
- Condition text (Cloudy, Rainy, etc)
- Humidity %
- Wind (speed + direction, if available)
- AQI with color indicator (green/yellow/orange/red/purple)
- **NEW:** Barometric pressure (mmHg or mb? user preference)
- Precipitation indicator (bold if currently raining/snowing)

**Visual Approach:**
```
┌─────────────────────────────┐
│  72°F                       │
│  Partly Cloudy              │
├─────────────────────────────┤
│  Humidity:   65%            │
│  Wind:       12 mph NW      │
│  AQI:        34 (🟢 Good)   │
│  Pressure:   30.12 inHg ⬆️  │
│  Precip:     None           │
└─────────────────────────────┘
```

**Color coding:**
- Pressure arrow: ⬆️ (rising, good), ➡️ (steady), ⬇️ (falling, migraine risk?)
- AQI: Green (0-50), Yellow (51-100), Orange (101-150), Red (150+), Purple (201+)
- Precip: Bold/emphasized if active

**Refresh:** 10 minutes

---

#### WIDGET 2: Sunrise/Sunset Times (Simple, new)

**What it shows:**
- Sunrise time with icon (🌅)
- Sunset time with icon (🌇)
- Optional: Minutes of daylight remaining

**Visual Approach:**
```
┌──────────────────────────┐
│  🌅 Sunrise: 7:34 AM     │
│  🌇 Sunset: 5:18 PM      │
│  Daylight: 9h 44m        │
└──────────────────────────┘
```

**Refresh:** Once per day

---

#### WIDGET 3: Hourly Forecast (REDESIGN - this is the main problem)

**Current Issue:** 4×3 grid with no clear day boundaries  
**Goal:** Make it obvious you're looking at multiple days, but still compact

**Option A: Day-separated groups**
```
┌─────────────────────────────────────────────┐
│  TODAY                                      │
├─────────────────────────────────────────────┤
│ 2PM │ 3PM │ 4PM │ 5PM │ 6PM │ 7PM         │
│  65° │ 64° │ 63° │ 62° │ 61° │ 60°        │
│  ☁️  │ ☁️  │ 🌧️  │ 🌧️  │ ☁️  │ ☁️         │
│  0%  │ 10% │ 60% │ 70% │ 20% │ 10%        │
├─────────────────────────────────────────────┤
│  TOMORROW                                   │
├─────────────────────────────────────────────┤
│ 8AM  │ 9AM │ 10AM│ 11AM│ 12PM│ 1PM        │
│  52° │ 55° │ 58° │ 61° │ 65° │ 68°        │
│  ☀️  │ ☀️  │ ☀️  │ ☀️  │ ☀️  │ ☀️         │
│  0%  │ 0%  │ 0%  │ 0%  │ 0%  │ 0%         │
└─────────────────────────────────────────────┘

(Can condense to 2-3 hour intervals if space is tight)
(Can show 5-7 hours per day rather than 12 to fit better)
```

**Pros:**
- Clear visual separation by day
- No ambiguity about which forecast is which
- Can show fewer hours per day if needed (e.g., 9 AM - 6 PM)

**Cons:**
- Takes more vertical space

---

**Option B: Compact card-based (redesign grid entirely)**
```
┌─────────────────────────────────────────────┐
│  TODAY (6 hours, 3-hour intervals)          │
├──────┬──────┬──────┬──────┬──────┬──────────┤
│ 3PM  │ 6PM  │ 9PM  │ 12AM │ 3AM  │ 6AM      │
│ 64°  │ 62°  │ 59°  │ 56°  │ 54°  │ 53°      │
│  ☁️  │ 🌧️  │ 🌧️  │ ☁️  │ ☁️  │ ☁️        │
│ 10%  │ 60%  │ 70%  │ 20%  │ 10%  │ 5%       │
│ 29.8 │ 29.7 │ 29.5 │ 29.4 │ 29.5 │ 29.6     │ (pressure)
├──────┴──────┴──────┴──────┴──────┴──────────┤
│  TOMORROW (same structure)                  │
├─────────────────────────────────────────────┤
│ 9AM  │ 12PM │ 3PM  │ 6PM  │ 9PM  │ 12AM     │
│ 61°  │ 68°  │ 70°  │ 66°  │ 61°  │ 58°      │
│  ☀️  │ ☀️  │ ☀️  │ ⛅  │ ⛅  │ ☁️         │
│ 0%   │ 0%   │ 0%   │ 5%   │ 10%  │ 20%      │
│ 29.8 │ 30.1 │ 30.2 │ 30.0 │ 29.8 │ 29.6     │
└─────────────────────────────────────────────┘
```

**Pros:**
- Shows day separation clearly
- Includes pressure per interval (tracking barometric trends)
- More compact than Option A if using 3-hour intervals
- Easy to scan both days at once

**Cons:**
- Narrower columns (harder to read on smaller displays)
- Need to decide: 3-hour or 6-hour intervals

---

**Option C: wttr.in-inspired (ASCII art, information-dense)**
```
┌─────────────────────────────────────────────┐
│  HOURLY FORECAST                            │
├─────────────────────────────────────────────┤
│  Time    Temp    Condition        Rain  Pr  │
│  ────────────────────────────────────────  │
│  Today:                                     │
│  3 PM    64°F    Cloudy           10%  29.8 │
│  6 PM    62°F    🌧️  Light Rain   60%  29.7 │
│  9 PM    59°F    🌧️  Moderate Rain 70%  29.5 │
│  12 AM   56°F    Cloudy           20%  29.4 │
│                                             │
│  Tomorrow:                                  │
│  9 AM    61°F    ☀️  Sunny         0%   29.8 │
│  12 PM   68°F    ☀️  Sunny         0%   30.1 │
│  3 PM    70°F    ☀️  Sunny         0%   30.2 │
│  6 PM    66°F    ⛅  Partly Cloudy  5%   30.0 │
└─────────────────────────────────────────────┘
```

**Pros:**
- Information-dense (shows day separation, pressure, detailed conditions)
- Resembles wttr.in (which you like aesthetically)
- Works well in monospace font (could be very readable)

**Cons:**
- Requires more horizontal space
- Might feel cluttered on a TV at distance

---

### Color Strategy for Weather

**Principle:** Sky blue default, yellow for sun only, saturation for precipitation

#### Latte (Light mode - Morning)
```
Conditions background: --accent-sky (#04a5e5) with opacity for state
  ☀️  Sunny:        Light blue bg (sky accent, high saturation)
  ⛅  Partly Cloudy: Light gray bg (neutral)
  ☁️  Cloudy:        Medium gray bg (muted)
  🌧️  Rainy:         Light blue bg (sky accent, HIGH saturation = darker)
  ⛈️  Stormy:        Dark blue/purple bg (very dark, HIGH saturation)

Sun icon: Always yellow (#df8e1d)
Moon icon: Light gray (#9ca0b0)

Precipitation %:
  0%:   No background color, pale text
  1-25%: Light blue wash (#04a5e5, 20% opacity)
  26-50%: Medium blue wash (#04a5e5, 50% opacity)
  51-75%: Dark blue wash (#04a5e5, 75% opacity)
  76%+: Dark blue wash (#04a5e5, 95% opacity) + emphasis (bold or border)

Pressure:
  Rising (⬆️):   Green text or icon (#40a02f)
  Steady (➡️):   Gray text or icon (#9ca0b0)
  Falling (⬇️):  Orange/red text or icon (#fe640b) [migraine warning]
```

#### Mocha (Dark mode - Afternoon/Evening/TV)
```
Conditions background: Similar logic but adjusted for dark
  ☀️  Sunny:        Very light accent (near white)
  ⛅  Partly Cloudy: Medium gray
  ☁️  Cloudy:        Dark gray
  🌧️  Rainy:         Medium-dark blue (high saturation for contrast)
  ⛈️  Stormy:        Very dark blue (highest saturation)

Sun icon: Yellow (#df8e1d) — same, keeps contrast
Moon icon: Very light gray

Precipitation %:
  0%:   No background
  1-25%: Light blue wash (lower opacity on dark bg)
  26-50%: Medium blue wash
  51-75%: Darker blue wash (bright enough for contrast)
  76%+: Darkest blue wash + emphasis

Pressure:
  Same as Latte (colors have good contrast in both modes)
```

#### Icon & Emoji Notes
- Use Unicode weather emojis (widely supported): ☀️ ⛅ ☁️ 🌧️ ⛈️ 🌨️ 🌫️
- Alt: Use SVG icons if emoji rendering is inconsistent
- Yellow (#df8e1d) should be reserved for: sun icon, "dry" indicator, maybe AQI good state

### Precipitation Visualization - Saturation Example

**Visual mockup (text representation):**

```
LATTE (Light mode):
┌──────────┬──────────┬──────────┬──────────┐
│ 3 PM 64° │ 6 PM 62° │ 9 PM 59° │ 12 AM 56°│
│    ☁️    │   🌧️    │   🌧️    │    ☁️    │
│    10%   │   60%    │   70%    │   20%    │
│  Lt Blue │ Med Blue │ Dark Blue│ Lt Blue  │
│ (light)  │(medium)  │(saturate)│(light)   │
└──────────┴──────────┴──────────┴──────────┘

MOCHA (Dark mode):
┌──────────┬──────────┬──────────┬──────────┐
│ 3 PM 64° │ 6 PM 62° │ 9 PM 59° │ 12 AM 56°│
│    ☁️    │   🌧️    │   🌧️    │    ☁️    │
│    10%   │   60%    │   70%    │   20%    │
│  Lt Blue │ Dark Blue│ Very Dark│  Lt Blue │
│ (subtle) │(contrast)│(bold)    │(subtle)  │
└──────────┴──────────┴──────────┴──────────┘
```

---

### Weather Widget Recommendation for MVP

**Start with Option B (Compact cards with day separation):**
- 3-hour intervals (more actionable than 1-hour, less overwhelming than 12-hour)
- Shows 6 hours per day (covers typical waking/planning window)
- Includes pressure per interval
- Clear day boundaries

**Then test locally with:**
- Saturation-based precipitation coloring
- Sky blue as default accent
- Yellow for sun icons only
- Pressure trend indicator (⬆️ / ➡️ / ⬇️)

**Fallback to Option C (wttr.in-inspired) if:**
- Option B feels too cramped on 4K TV
- Users want more information density
- Reading at distance is strained

---

## Network Speed Testing - Architecture Options

### Problem Statement
- Want periodic testing (not nightly, more frequent than current)
- Firefox not recommended for continuous testing (per OpenSpeedTest)
- Gigabit WiFi means thresholds should be high (100+ Mbps for green?)
- Current approach: Run on-demand from dashboard? Periodic via cron?

### Option 1: Periodic Speed Test Container (Recommended)

**Architecture:**
```
┌──────────────────────────────────────────────────────────┐
│  Kubernetes Cluster                                      │
├──────────────────────────────────────────────────────────┤
│  speedtest-container (CronJob or Pod)                    │
│  ├─ Runs speed test every N hours (e.g., 6 hours)       │
│  ├─ Uses librespeed or Speedtest CLI (Python)           │
│  ├─ Writes results to K3s ConfigMap or webhook          │
│  └─ OR: Writes results to a metrics exporter            │
│                                                           │
│  Prometheus (scrapes metrics)                            │
│  ├─ Collects speed test results                         │
│  ├─ Stores as time-series data                          │
│  └─ Dashboards query via PromQL                         │
│                                                           │
│  Dashboard backend                                       │
│  ├─ GET /api/network/speed → queries Prometheus        │
│  ├─ Returns: last_test_speed, last_test_time, status   │
│  └─ Shows current result (no testing in browser)        │
└──────────────────────────────────────────────────────────┘
```

**Pros:**
- No browser-based testing (Firefox issue avoided)
- Runs reliably on server/container (guaranteed env, no browser quirks)
- Can use Prometheus metrics (integrates with your existing monitoring)
- Can be triggered manually or on schedule
- Results available to all dashboards (not just when open)
- Could expose as Prometheus metric for alerting (if speed drops below threshold)

**Cons:**
- Adds complexity (need a new container)
- Requires choosing speed test service (librespeed, speedtest.net, ookla, etc.)
- May need API key for commercial services

**Implementation:**
1. Deploy `librespeed` container in K3s (or use speedtest-cli)
2. CronJob runs every 6 hours: `speedtest-cli --json → write to file or webhook`
3. Export results as Prometheus metric (custom exporter)
4. Dashboard queries `/api/network/speed` which returns cached result
5. Optional: Manual test button in UI (triggers one-off test, shows result)

---

### Option 2: On-Demand Browser Testing (Simpler but Limited)

**Architecture:**
```
Dashboard UI
  │
  └─ [Test Now] button
     └─ Calls speedtest-js library in browser
        └─ Runs speed test (takes 30-60 seconds)
        └─ Stores result in localStorage + backend
        └─ Displays result

Backend stores most recent test
  └─ GET /api/network/speed returns cached result + timestamp
```

**Pros:**
- No additional infrastructure
- User controls when tests run (reduces server load)
- Simple to implement

**Cons:**
- Firefox not recommended (might still work, but Ookla recommends Chrome)
- Takes 30-60 seconds to run (might be annoying if user expects instant feedback)
- Only tests when dashboard is actively viewed
- No periodic/scheduled testing

---

### Option 3: Hybrid (Recommended for your use case)

**Architecture:**
```
Backend:
  ├─ Periodic CronJob (every 6 hours)
  │  └─ Runs librespeed, stores result
  │
  ├─ Manual trigger endpoint
  │  └─ GET /api/network/speed?trigger=true
  │  └─ Spawns manual test, returns when done
  │
  └─ GET /api/network/speed (returns latest result)

Dashboard UI:
  ├─ Displays last result + timestamp ("Last tested: 2h ago")
  ├─ [Test Now] button (optional, manual trigger)
  └─ Auto-refresh every 5-10 min to check for new results
```

**Pros:**
- Gets periodic testing without browser limitation
- Manual test available if user wants immediate check
- Good UX (shows result without waiting, unless user opts in)
- Metrics available via Prometheus (can alert on low speed)

**Cons:**
- Adds complexity (two testing paths)
- CronJob + manual both possible = need error handling

---

### Threshold Recommendations for Gigabit WiFi

Given you have gigabit WiFi (1000 Mbps potential), adjust thresholds from "standard internet":

```
Standard thresholds (for reference):
  🟢 Green:  >50 Mbps (4K streaming possible)
  🟡 Yellow: 25-50 Mbps (1080p streaming OK)
  🔴 Red:    <25 Mbps (streaming struggles)

Gigabit WiFi thresholds (RECOMMENDED):
  🟢 Green:  >300 Mbps (approaching gigabit, very good)
  🟡 Yellow: 100-300 Mbps (adequate, but degraded)
  🔴 Red:    <100 Mbps (something's wrong, check WiFi)
```

**Rationale:** If you have gigabit WiFi and testing shows <100 Mbps, something is definitely degraded (device, network interference, ISP issue).

---

### Network Speed Widget Implementation

**MVP:**
```
┌─────────────────────────────────────┐
│  Network Speed                      │
├─────────────────────────────────────┤
│  Download: 450 Mbps  🟢             │
│  Last tested: 3h ago                │
│  [Test Now] (optional button)       │
└─────────────────────────────────────┘
```

**Enhanced (Phase 2):**
```
┌─────────────────────────────────────┐
│  Network Speed                      │
├─────────────────────────────────────┤
│  ⬇️  450 Mbps  🟢                   │
│  ⬆️  480 Mbps  🟢                   │
│  ⏱️  12 ms latency                   │
│  Last tested: 3h ago                │
│  [Test Now]                         │
└─────────────────────────────────────┘
```

---

## Revised PT Exercises Widget Decision

**Based on your feedback:** "Evening because that's when I'm likely to be in bed and remembering I have a routine for that"

**Placement:**
- **Evening dashboard:** Primary location (PT reminder + "here's what to do")
- **Morning dashboard:** Optional link? ("→ View PT routine" in corner)
- **Separate dedicated screen?** (linked from both morning/evening?)

**Recommendation:** Start with Evening dashboard only. If you find yourself wanting to do PT in the morning or afternoon, we can add links then.

**Widget Design (Evening):**
```
┌─────────────────────────────────┐
│  PT Exercises                   │
├─────────────────────────────────┤
│  Now's a good time to do these: │
│                                 │
│  ☐ Wrist stretches (2 min)      │
│  ☐ Shoulder rolls (1 min)       │
│  ☐ Neck tilts (2 min)           │
│  ☐ Ankle circles (1 min)        │
│  ☐ Light walking (5 min)        │
│                                 │
│  → [Detailed view]              │
└─────────────────────────────────┘
```

**Future enhancement:** Click "Detailed view" → opens dedicated PT routine screen with timer, rep counting, form tips.

---

## Summary: What's Decided, What Needs Testing

### Decided ✅
- Morning dashboard layout (50/50 top, 66/33 middle, 33/66 bottom)
- Background: Soft light gray (Latte) instead of white
- Times: PST primary, EST as smaller reference label
- Infrastructure widget: 3 cards (Babbage/Epimetheus/Kabandha)
- Network speed: Periodic (Option 3 Hybrid) + gigabit thresholds
- PT exercises: Evening dashboard primary
- Weather: Option B (day-separated, 3-hour intervals, includes pressure)
- Precipitation color: Saturation-based (darker = rainier)

### Needs Local Testing 🔨
- PST time accent color (currently mauve, you're "not quite happy")
- Soft gray background shade (which gray? how does it feel?)
- Weather widget layout details (sizing, spacing)
- Weather saturation coloring (does it actually look good light/dark?)
- Afternoon color scheme (Latte vs Mocha? need to see side-by-side)
- Typography sizes on 4K TV at viewing distance

### Ready to Build 🚀
- Phase 1: Local testing infrastructure + web components
- Then can iterate on colors/sizes/layouts in real-time

---

## Next Steps

1. **Shall I start Phase 1** (local testing + web components + fix viewport)?
2. **Or would you prefer to sketch/design locally first?** (I can provide starter CSS with theme variables so you can experiment)
3. **Question on speed testing:** Do you want me to implement Option 3 (hybrid) now, or start with Option 2 (on-demand button) as simpler MVP?

Which feels like the right priority?