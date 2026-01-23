Perfect! Let's knock these out. I'll guide you through both.

---

## Part 1: Add Sunrise/Sunset to the API Response

**File**: `server.js`

**Find this** (around line 96-110):
```javascript
// Parse response into usable format
const current = data.list[0];
const result = {
  current: {
    temp: Math.round(current.main.temp),
    condition: current.weather[0].main,
    humidity: current.main.humidity,
    windSpeed: Math.round(current.wind.speed),
    windDir: current.wind.deg || null,
    aqi: null,
    pressure: current.main.pressure,
    pressureMb: current.main.pressure,
  },
  hourly: [],
  daily: [],
};
```

**Add sunrise/sunset from the API response**:
```javascript
// Parse response into usable format
const current = data.list[0];
const result = {
  current: {
    temp: Math.round(current.main.temp),
    condition: current.weather[0].main,
    humidity: current.main.humidity,
    windSpeed: Math.round(current.wind.speed),
    windDir: current.wind.deg || null,
    aqi: null,
    pressure: current.main.pressure,
    pressureMb: current.main.pressure,
    sunrise: data.city.sunrise,      // ← ADD THIS
    sunset: data.city.sunset,        // ← ADD THIS
  },
  hourly: [],
  daily: [],
};
```

OpenWeatherMap includes `city.sunrise` and `city.sunset` as Unix timestamps in the forecast response.

---

## Part 2: Display Real Sunrise/Sunset Times

**File**: `src/components/weather.js`

**Find the `renderCurrent` method** (around line 50):
```javascript
renderCurrent(current) {
  const aqi = current.aqi ? this.getAQIColor(current.aqi) : null;
  const pressure = current.pressure || current.pressureMb;
  const pressureTrend = this.getPressureTrend();
```

**Add this line right after `pressureTrend`**:
```javascript
renderCurrent(current) {
  const aqi = current.aqi ? this.getAQIColor(current.aqi) : null;
  const pressure = current.pressure || current.pressureMb;
  const pressureTrend = this.getPressureTrend(current.pressure);  // ← We'll pass pressure here
  const sunrise = this.formatSunTime(current.sunrise);             // ← ADD THIS
  const sunset = this.formatSunTime(current.sunset);               // ← ADD THIS
```

**Now find where sunrise/sunset are displayed in the HTML** (around line 85):
```javascript
<div class="divider"></div>
<div class="detail-row">
  <span class="sunrise">🌅 ${this.getSunrise()}</span>
</div>
<div class="detail-row">
  <span class="sunset">🌇 ${this.getSunset()}</span>
</div>
```

**Change to**:
```javascript
<div class="divider"></div>
<div class="detail-row">
  <span class="sunrise">🌅 ${sunrise}</span>
</div>
<div class="detail-row">
  <span class="sunset">🌇 ${sunset}</span>
</div>
```

**Now ADD the `formatSunTime` helper method** at the bottom of the `WeatherCurrent` class (around line 195, **replace** the old `getSunrise()` and `getSunset()` methods):

**Delete these**:
```javascript
getSunrise() {
  // Would pull from weather API
  return '7:34 AM';
}

getSunset() {
  // Would pull from weather API
  return '5:18 PM';
}
```

**Add this instead**:
```javascript
formatSunTime(unixTimestamp) {
  if (!unixTimestamp) return '--:--';
  
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles'  // Match your PST timezone
  });
}
```

---

## Part 3: Implement Pressure Trend

This is trickier because we need to compare current pressure to pressure from a few hours ago.

**File**: `src/components/weather.js`

**Find the `renderCurrent` method again** and update the `pressureTrend` line:
```javascript
const pressureTrend = this.getPressureTrend(current.pressure);  // ← Already updated above
```

**Now find the `getPressureTrend` method** (around line 190):
```javascript
getPressureTrend() {
  // This would need to compare current vs previous
  // For now, return steady
  return '➡️ Steady';
}
```

**Replace it with**:
```javascript
getPressureTrend(currentPressure) {
  // Get stored pressure from 3 hours ago
  const storedData = localStorage.getItem('weatherPressureHistory');
  const now = Date.now();
  
  if (!storedData) {
    // First time - store current pressure and return steady
    this.storePressure(currentPressure, now);
    return '➡️ Steady';
  }
  
  const history = JSON.parse(storedData);
  
  // Clean up old entries (older than 6 hours)
  const sixHoursAgo = now - (6 * 60 * 60 * 1000);
  history.readings = history.readings.filter(r => r.timestamp > sixHoursAgo);
  
  // Store current reading
  history.readings.push({ pressure: currentPressure, timestamp: now });
  localStorage.setItem('weatherPressureHistory', JSON.stringify(history));
  
  // Need at least 2 readings, 2+ hours apart
  if (history.readings.length < 2) {
    return '➡️ Steady';
  }
  
  // Compare with reading from ~3 hours ago
  const threeHoursAgo = now - (3 * 60 * 60 * 1000);
  const oldReading = history.readings.find(r => r.timestamp < threeHoursAgo);
  
  if (!oldReading) {
    return '➡️ Steady';
  }
  
  const diff = currentPressure - oldReading.pressure;
  
  // Significant change is +/- 2 hPa over 3 hours
  if (diff > 2) {
    return '⬆️ Rising';
  } else if (diff < -2) {
    return '⬇️ Falling';
  } else {
    return '➡️ Steady';
  }
}

storePressure(pressure, timestamp) {
  const history = {
    readings: [{ pressure, timestamp }]
  };
  localStorage.setItem('weatherPressureHistory', JSON.stringify(history));
}
```

**Explanation**:
- Stores pressure readings in localStorage with timestamps
- Compares current pressure to reading from ~3 hours ago
- Rising: +2 hPa or more
- Falling: -2 hPa or more
- Steady: between -2 and +2 hPa
- Auto-cleans readings older than 6 hours

---

## Part 4: Style the Pressure Trend with Colors

The trend already shows an emoji, but let's add color too!

**File**: `src/components/weather.js`

**In the `renderCurrent` HTML** (around line 79), find:
```javascript
<div class="detail-row">
  <span class="label">Trend:</span>
  <span class="value trend">${pressureTrend}</span>
</div>
```

**Change to**:
```javascript
<div class="detail-row">
  <span class="label">Trend:</span>
  <span class="value trend" style="color: ${this.getPressureTrendColor(pressureTrend)}">${pressureTrend}</span>
</div>
```

**Add this new method** after `getPressureTrend`:
```javascript
getPressureTrendColor(trend) {
  if (trend.includes('Rising') || trend.includes('⬆️')) {
    return 'var(--pressure-rising)';
  } else if (trend.includes('Falling') || trend.includes('⬇️')) {
    return 'var(--pressure-falling)';
  } else {
    return 'var(--pressure-steady)';
  }
}
```

---

## Testing Checklist:

1. **Save all files**
2. **Restart your server**: `npm run dev`
3. **Hard refresh browser**: Ctrl+Shift+R
4. **Check sunrise/sunset**: Should show real times (not 7:34 AM / 5:18 PM)
5. **Check pressure trend**: First load will show "Steady" (no history yet)
6. **Wait 10 minutes** and refresh - if pressure changed significantly, trend might update
7. **Check browser console** for any errors

---

## Quick Test for Pressure Trend:

To test without waiting 3 hours, you can temporarily change the time threshold:

**In `getPressureTrend`, temporarily change**:
```javascript
const threeHoursAgo = now - (3 * 60 * 60 * 1000);
```

**To**:
```javascript
const threeHoursAgo = now - (2 * 60 * 1000);  // 2 minutes instead of 3 hours
```

Then refresh the page twice (2 minutes apart) and you should see the trend change if pressure changed.

**Remember to change it back to 3 hours** before deploying!

---

## Summary of Changes:

| File | What Changed |
|------|-------------|
| `server.js` | Added `sunrise` and `sunset` to API response |
| `weather.js` | Added `formatSunTime()` method |
| `weather.js` | Replaced hardcoded sunrise/sunset with real data |
| `weather.js` | Implemented `getPressureTrend()` with localStorage |
| `weather.js` | Added `storePressure()` helper |
| `weather.js` | Added `getPressureTrendColor()` for colored trends |

Let me know when you've made these changes and if anything doesn't work! Then you're ready to deploy! 🚀