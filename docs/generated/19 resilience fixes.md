# Network Resilience Improvements

## Problem
The dashboard was experiencing null reference errors (`can't access property "innerHTML", t is null`) when WiFi connections hiccuped. Components were attempting to update DOM elements that no longer existed, causing crashes.

## Root Causes Identified

1. **No null-safety in DOM operations**: Direct access to `innerHTML` and `textContent` without checking if elements exist
2. **No retry logic**: Single fetch failures caused permanent errors
3. **No data caching**: Components lost all data on network failure
4. **Destructive error handling**: `showError()` and `showLoading()` cleared entire shadowRoot, destroying component state

## Solutions Implemented

### 1. Base Component (`src/components/base.js`)

**New Features:**
- `setText()` - Null-safe text content setter (returns boolean success)
- `fetchWithRetry()` - Automatic retry with exponential backoff (3 attempts by default)
- `showTransientError()` - Non-destructive error display (toast-style overlay)
- Null-checks in all DOM query methods
- Try-catch protection in `showError()` and `showLoading()`

**Key Changes:**
```javascript
// Old (unsafe):
this.query('#element').textContent = value;

// New (null-safe):
this.setText('#element', value); // Returns true/false

// Old (no retry):
const response = await fetch(url);

// New (with retry):
const response = await this.fetchWithRetry(url); // Auto-retries 3x with backoff
```

### 2. Weather Components

**All three weather components enhanced:**
- `weather-current.js`
- `weather-forecast.js`  
- `weather-3day.js`

**New Features:**
- Data caching via `this.lastSuccessfulData`
- Graceful degradation: Show cached data with warning when network fails
- Null-safe DOM updates using new `setText()` method
- Retry logic via `fetchWithRetry()`
- Try-catch blocks around all display update logic

**Example Pattern:**
```javascript
async fetchWeather() {
  try {
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    
    // Cache on success
    this.lastSuccessfulData = data.current;
    this.updateDisplay(data.current);
    
  } catch (error) {
    console.error('Weather error:', error);
    
    // Fall back to cached data
    if (this.lastSuccessfulData) {
      this.updateDisplay(this.lastSuccessfulData, true); // true = stale
    } else {
      this.showError(error.message);
    }
  }
}

updateDisplay(data, isStale = false) {
  // All DOM updates are null-safe
  this.setText('#temp', `${data.temp}°F${isStale ? ' ⚠' : ''}`);
  
  // Show non-destructive warning
  if (isStale) {
    this.showTransientError('Using cached data (connection issue)');
  }
}
```

### 3. Infrastructure Status Component (`infrastructure-status.js`)

**Enhancements:**
- Data caching for cluster metrics
- Null-safe card creation
- Per-node error handling (one node failing doesn't crash entire component)
- Reduced retry attempts per metric (faster failure detection)
- Graceful fallback to cached cluster state

### 4. Retry Strategy

**Configuration (in base.js):**
```javascript
this.maxRetries = 3;           // Number of retry attempts
this.retryDelay = 5000;        // Base delay: 5 seconds
```

**Backoff Pattern:**
- Attempt 1: Immediate
- Attempt 2: Wait 5 seconds
- Attempt 3: Wait 10 seconds
- Attempt 4: Wait 15 seconds
- After 3 failures: Show permanent error OR cached data

### 5. User Feedback

**Transient Errors (temporary network issues):**
- Small toast notification in top-right corner
- Auto-dismisses after 5 seconds
- Doesn't destroy component state
- Shows retry counter: "Connection issue. Retrying... (2/3)"

**Cached Data Warning:**
- Stale data marked with ⚠ icon
- Toast shows: "Using cached weather data (connection issue)"
- Component remains functional with old data

**Permanent Errors (max retries exceeded):**
- Full error box (only if no cached data)
- Red border, clear error message
- Suggests checking connection

## Files Changed

1. `src/components/base.js` - Core resilience infrastructure
2. `src/components/weather/weather-current/weather-current.js`
3. `src/components/weather/weather-forecast/weather-forecast.js`
4. `src/components/weather/weather-3day/weather-3day.js`
5. `src/components/infrastructure-status/infrastructure-status.js`

## Testing Recommendations

1. **Simulate Network Failure:**
   ```bash
   # On the kiosk, temporarily block API access
   sudo iptables -A OUTPUT -p tcp --dport 3000 -j DROP
   # Wait 30 seconds, observe retry behavior
   sudo iptables -D OUTPUT -p tcp --dport 3000 -j DROP
   ```

2. **Check Console:**
   - Should see "Retrying in X seconds..." messages
   - Should see "Using cached data" messages
   - No uncaught exceptions or null reference errors

3. **Verify Graceful Degradation:**
   - Components should show cached data with warnings
   - No blank screens or crashes
   - Dashboard remains usable

4. **Test Recovery:**
   - When network returns, components should auto-update
   - Cached data warnings should disappear
   - No page reload required

## Deployment

Replace these files in your repository:
```bash
cp base.js src/components/base.js
cp weather-current.js src/components/weather/weather-current/weather-current.js
cp weather-forecast.js src/components/weather/weather-forecast/weather-forecast.js
cp weather-3day.js src/components/weather/weather-3day/weather-3day.js
cp infrastructure-status.js src/components/infrastructure-status/infrastructure-status.js
```

Then rebuild and deploy:
```bash
npm run build
npm run docker:build
npm run docker:push
kubectl rollout restart deployment/morning-dashboard -n dashboards
```

## Additional Recommendations

1. **Add Network Status Indicator:**
   Could create a small WiFi icon in corner that shows connection state

2. **Persist Cache to localStorage:**
   Current caching is in-memory only. Could survive page reloads with localStorage

3. **Add Manual Refresh Button:**
   Let users force a refresh when they know network is back

4. **Monitor Retry Metrics:**
   Log retry attempts to help diagnose network issues

5. **Adjust Retry Timing:**
   For kiosk use, you might want longer delays or more retries