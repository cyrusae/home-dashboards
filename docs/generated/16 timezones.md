# Timezone Bug Fixes for Dawnfire Dashboard

## Summary of Issues

### Issue 1: Calendar Events Show Wrong Times
**Problem:** Events show with 16-hour positive offset (12:30 PM → 4:30 AM next day)
**Root Cause:** Double timezone conversion in `parseICalDate()` function

### Issue 2: 3-Day Weather Shows Tomorrow Too Early
**Problem:** Late in the evening, the "next 3 days" advances a day early
**Root Cause:** Using UTC date for "today" comparison instead of PST

### Issue 3: Hourly Forecast Stops Updating
**Problem:** Morning shows only 11:00 and 13:00, doesn't add more hours as day progresses
**Root Cause:** Using local time boundaries instead of PST for "rest of today"

---

## Detailed Fixes

### Fix 1: Calendar Timezone Parsing (`src/api/calendar.js`)

**Problem Location:** `parseICalDate()` function, lines 216-233

**Original Code:**
```javascript
if (isUTC) {
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
} else {
  // ⚠️ BUG: Treats as local browser time, then converts to UTC
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
}
```

**Why it failed:**
1. Nextcloud sends PST times without 'Z' (e.g., "20250129T123000")
2. `new Date("2025-01-29T12:30:00")` treats this as **local browser time**
3. `.toISOString()` converts local → UTC, adding timezone offset
4. Result: 12:30 PST → 20:30 UTC → displayed as 4:30 AM next day

**Fixed Code:**
```javascript
if (isUTC) {
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
} else {
  // Explicitly treat as PST by appending timezone offset
  const localDateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  const pstDate = new Date(localDateStr + '-08:00'); // PST = UTC-8
  return pstDate.toISOString();
}
```

**Additional Fix:** Date range calculation also uses PST
```javascript
// OLD: const now = new Date();
// NEW: Convert to PST before calculating date ranges
const now = new Date();
const pstNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
let startDate = new Date(pstNow);
```

---

### Fix 2: 3-Day Weather Date Comparison (`src/api/weather.js`)

**Problem Location:** Lines 95-98

**Original Code:**
```javascript
const today = now.toISOString().split('T')[0];  // ⚠️ BUG: Uses UTC date
const dailyDates = Object.keys(dailyMap).sort();
const futureDates = dailyDates.filter(date => date > today);
```

**Why it failed:**
- At 9 PM PST on Jan 28 → UTC is 5 AM Jan 29
- `now.toISOString()` returns "2025-01-29T05:00:00Z"
- `today` becomes "2025-01-29"
- Filter excludes Jan 29, starts with Jan 30 (a day early!)

**Fixed Code:**
```javascript
// Get current date in PST timezone
const pstNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
const todayPST = pstNow.toISOString().split('T')[0];
const dailyDates = Object.keys(dailyMap).sort();
const futureDates = dailyDates.filter(date => date > todayPST);
```

**Additional Fix:** Daily aggregation also uses PST dates
```javascript
// Convert each forecast item to PST before bucketing by date
const itemTimePST = new Date(itemTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
const dayKey = itemTimePST.toISOString().split('T')[0];
```

---

### Fix 3: Hourly Forecast PST Boundaries (`src/api/weather.js`)

**Problem Location:** Lines 46-52

**Original Code:**
```javascript
const now = new Date();
const todayEnd = new Date(now);
todayEnd.setHours(23, 59, 59, 999);  // ⚠️ BUG: Local time, not PST

for (let i = 0; i < data.list.length && result.hourly.length < 12; i++) {
  const itemTime = new Date(item.dt * 1000);
  if (itemTime > now && itemTime <= todayEnd) {  // Compares UTC times
```

**Why it failed:**
- `now` is current UTC time
- `todayEnd` is "end of today in local time"
- As the day progresses, the window shrinks
- At 7 AM PST, only sees 11:00 and 13:00 because those are the only future times

**Fixed Code:**
```javascript
// Get current time and end-of-day in PST
const now = new Date();
const pstNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
const todayEndPST = new Date(pstNow);
todayEndPST.setHours(23, 59, 59, 999);

for (let i = 0; i < data.list.length && result.hourly.length < 12; i++) {
  const item = data.list[i];
  const itemTime = new Date(item.dt * 1000);
  
  // Convert item time to PST for comparison
  const itemTimePST = new Date(itemTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  
  // Only include future hours today (in PST)
  if (itemTimePST > pstNow && itemTimePST <= todayEndPST) {
```

---

## Implementation Instructions

### Step 1: Replace `src/api/calendar.js`
Copy the contents of `calendar-fixed.js` to replace the original file.

**Key changes:**
- Line ~20: Calculate date ranges in PST
- Line ~216: Parse iCal dates with explicit PST offset

### Step 2: Replace `src/api/weather.js`
Copy the contents of `weather-fixed.js` to replace the original file.

**Key changes:**
- Line ~48: Get current time and boundaries in PST
- Line ~60: Convert forecast items to PST for comparison
- Line ~85: Aggregate daily forecasts using PST dates
- Line ~95: Compare "today" using PST date

### Step 3: Test the Fixes

**Test 1: Calendar Events**
1. Create an event for "Today at 2:30 PM PST"
2. Verify it displays as "14:30" (not 4:30 or 22:30)

**Test 2: 3-Day Weather**
1. Check at 9 PM PST (when UTC is already tomorrow)
2. Verify first day is still "tomorrow" not "day after tomorrow"

**Test 3: Hourly Forecast**
1. Check in the morning (e.g., 7 AM)
2. Verify it shows hours from now until 11 PM today
3. Check again in the afternoon
4. Verify it still shows remaining hours of today

---

## Notes

### PST vs PDT
The current fix uses a hardcoded `-08:00` offset for PST. This doesn't automatically handle PDT (Daylight Saving Time, which is `-07:00`).

**Options:**
1. **Simple:** Use a library like `luxon` or `date-fns-tz` for proper timezone handling
2. **Manual:** Detect DST boundaries and switch between -07:00 and -08:00
3. **Accept limitation:** The current fix works for PST; during PDT it will be 1 hour off

**Recommended:** Since you're already using `toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })` elsewhere, the fixes use this same approach which handles PST/PDT automatically.

### Why `toLocaleString()` Works
```javascript
const pstNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
```
This:
1. Takes the current UTC time
2. Formats it as a string in PST (e.g., "1/29/2025, 11:45:32 AM")
3. Parses that string back into a Date object
4. Result: A Date object with the "correct" wall-clock time in PST

It's a bit of a hack, but it avoids needing a timezone library.

---

## Verification Checklist

- [ ] Calendar events show correct times (12:30 PM → 12:30, not 4:30 AM)
- [ ] All-day events show reasonable times (midnight or 8 AM, not 4 PM)
- [ ] 3-day forecast shows correct "tomorrow" even late at night
- [ ] Hourly forecast includes all remaining hours of today
- [ ] Hourly forecast updates throughout the day to show new hours