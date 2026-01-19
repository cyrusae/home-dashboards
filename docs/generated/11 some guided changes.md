
## Change 1: Adjust Weather Widget Widths (33/33/33 → 25/37.5/37.5)

**File**: `src/dashboards/morning.js`

**Find this line** (around line 107):
```javascript
grid-template-columns: 1fr 1fr 1fr;
```

**Change it to**:
```javascript
grid-template-columns: 1fr 1.5fr 1.5fr;
```

**Explanation**: 
- `1fr` = 1 fractional unit
- `1.5fr` = 1.5 fractional units
- Total: 1 + 1.5 + 1.5 = 4 units
- Current conditions: 1/4 = 25%
- Today forecast: 1.5/4 = 37.5%
- Next 3 days: 1.5/4 = 37.5%

**If you want exactly 20% instead of 25%**:
```javascript
grid-template-columns: 1fr 2fr 2fr;
```
This gives you: 1/5 = 20%, 2/5 = 40%, 2/5 = 40%

---

## Change 2: Make 3-Day Forecast Horizontal Cards

**File**: `src/components/weather-3day.js`

### Step 1: Change the container layout

**Find this** (around line 57):
```javascript
.daily-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}
```

**Change to**:
```javascript
.daily-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  height: 100%;
}
```

### Step 2: Adjust the card layout

**Find this** (around line 63):
```javascript
.day-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 15px;
  padding: 12px;
  background: rgba(153, 209, 219, 0.05);
  border: 1px solid var(--frappe-crust);
  border-radius: 4px;
  font-size: var(--size-tiny);
}
```

**Change to**:
```javascript
.day-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: rgba(153, 209, 219, 0.05);
  border: 1px solid var(--frappe-crust);
  border-radius: 4px;
  font-size: var(--size-tiny);
}
```

### Step 3: Adjust the date style

**Find this** (around line 72):
```javascript
.day-date {
  font-weight: bold;
  color: var(--text-secondary);
  white-space: nowrap;
  min-width: 80px;
}
```

**Change to**:
```javascript
.day-date {
  font-weight: bold;
  color: var(--text-secondary);
  text-align: center;
  border-bottom: 1px solid var(--frappe-crust);
  padding-bottom: 8px;
  margin-bottom: 5px;
}
```

### Step 4: Change the details grid

**Find this** (around line 78):
```javascript
.day-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
```

**Change to**:
```javascript
.day-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

### Step 5: Adjust detail items

**Find this** (around line 84):
```javascript
.day-detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
```

**Change to**:
```javascript
.day-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
```

### Step 6: Update label/value styles

**Find this** (around line 89):
```javascript
.detail-label {
  color: var(--text-light);
  font-size: var(--size-tiny);
}

.detail-value {
  color: var(--text-primary);
  font-weight: bold;
  font-size: var(--size-small);
}
```

**Change to**:
```javascript
.detail-label {
  color: var(--text-light);
  font-size: var(--size-tiny);
  flex: 0 0 auto;
}

.detail-value {
  color: var(--text-primary);
  font-weight: bold;
  font-size: var(--size-tiny);
  text-align: right;
}
```

---

## Visual Summary

**Before** (vertical stack):
```
┌─────────────────┐
│ Mon, Jan 20     │
│ High/Low: 45/32 │
│ Precip: 20%     │
│ Pressure: 1013  │
│ Condition: Rain │
├─────────────────┤
│ Tue, Jan 21     │
│ ...             │
├─────────────────┤
│ Wed, Jan 22     │
│ ...             │
└─────────────────┘
```

**After** (horizontal cards):
```
┌────────┐  ┌────────┐  ┌────────┐
│Mon Jan │  │Tue Jan │  │Wed Jan │
│  20    │  │  21    │  │  22    │
├────────┤  ├────────┤  ├────────┤
│High/Low│  │High/Low│  │High/Low│
│  45/32 │  │  48/34 │  │  52/38 │
│        │  │        │  │        │
│Precip  │  │Precip  │  │Precip  │
│    20% │  │    10% │  │     5% │
│        │  │        │  │        │
│Pressure│  │Pressure│  │Pressure│
│   1013 │  │   1015 │  │   1016 │
└────────┘  └────────┘  └────────┘
```

---

## Bonus: Responsive Behavior

If you want the cards to stack on smaller screens, add this at the end of the styles in `weather-3day.js`:

```javascript
@media (max-width: 1200px) {
  .daily-container {
    grid-template-columns: 1fr;
  }
}
```

This will make them stack vertically on smaller screens but stay horizontal on larger ones.

---

## Testing Your Changes

1. Save both files
2. Refresh your browser (may need hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
3. You should see:
   - Current weather narrower on the left
   - Forecast sections wider
   - 3-day cards laid out horizontally

