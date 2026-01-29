Looking at your codebase and problem statement, I think this is a **moderate change** that builds nicely on your existing calendar infrastructure. Let me break down the approach:

## Assessment

### What's Already Working Well

Your current CalDAV implementation in `src/api/calendar.js` is actually quite close to what you need:

1. ✅ Already discovers calendars via PROPFIND
2. ✅ Already uses REPORT queries with time ranges
3. ✅ Already parses iCalendar data
4. ✅ Has clean separation between API layer and display layer

### Required Changes

#### 1. **API Layer** (`src/api/calendar.js`) - **Medium Effort**

You'll need to:

- Add a separate function `getCalendarTasks()` that queries for VTODO instead of VEVENT
- Modify your REPORT query to filter for VTODO components
- Add a VTODO parser (similar to your existing `parseICalEvent()`)

The key difference in the query:

```xml
<!-- Current (events) -->
<c:comp-filter name="VEVENT">
  <c:time-range start="..." end="..."/>
</c:comp-filter>

<!-- New (tasks) -->
<c:comp-filter name="VTODO">
  <c:time-range start="..." end="..."/>
</c:comp-filter>
```

#### 2. **Data Model** - **Small Effort**

Tasks have slightly different properties:

```javascript
// Event
{
  summary: "Meeting",
  start: "2025-01-29T10:00:00Z",
  end: "2025-01-29T11:00:00Z",
  calendar: "Work"
}

// Task
{
  summary: "Buy groceries",
  due: "2025-01-29T17:00:00Z",  // vs start/end
  status: "NEEDS-ACTION",        // new field
  completed: null,               // new field
  calendar: "Personal",
  type: "task"                   // distinguish from events
}
```

#### 3. **Display Layer** (`src/dashboards/morning/morning.js`) - **Medium Effort**

You'll need to:
- Fetch both events AND tasks
- Merge and sort them chronologically
- Use different templates for tasks vs events

The existing template system makes this straightforward:

```html
<!-- Add to morning.html -->
<template id="taskItemTemplate">
  <div class="task-item">
    <span class="task-checkbox">☐</span>
    <div class="task-time" data-task-time></div>
    <div class="task-title" data-task-title></div>
    <div class="task-calendar" data-task-calendar></div>
  </div>
</template>
```

#### 4. **Styling** - **Small Effort**

Add task-specific styles to `src/dashboards/morning/morning.css`:

```css
.task-item {
  /* Similar to .event-item but with checkbox styling */
}

.task-checkbox {
  color: var(--accent-teal);
  font-size: var(--size-heading);
}

.task-item.completed {
  opacity: 0.5;
  text-decoration: line-through;
}
```

## Proposed Implementation Path

### Phase 1: Basic VTODO Support (Highest Priority)

**Goal**: Show "today" tasks alongside events in the calendar card

1. Add `getCalendarTasks()` to `src/api/calendar.js`
2. Add `parseICalTask()` parser
3. Add `/api/calendar/tasks` endpoint to `server.js`
4. Modify `loadCalendarEvents()` in `morning.js` to fetch both
5. Add task template and styling
6. Merge and display chronologically

**Estimated effort**: 2-3 hours

### Phase 2: Task List Filtering (Lower Priority)

**Goal**: Support separate task lists for routines vs one-offs

1. Add list/calendar filtering in the query
2. Create separate dashboard components:
   - Keep hardcoded morning routine temporarily
   - Add new `<nextcloud-tasks list="morning-routine">` component
3. Gradually migrate from hardcoded to Nextcloud-backed lists

**Estimated effort**: 1-2 hours

## Code Structure Recommendation

I'd suggest creating a new file `src/api/tasks.js` rather than bloating `calendar.js`:

```
src/api/
├── calendar.js    (events only - VEVENT)
├── tasks.js       (tasks only - VTODO)  ← NEW
└── caldav.js      (shared CalDAV utilities)  ← NEW (optional)
```

This keeps concerns separated and makes it easier to have different refresh intervals (events might refresh every 15 min, tasks might be more interactive/real-time).

## Key Design Decision: Unified vs Separate Display

**Option A: Unified Timeline** (Recommended for Phase 1)
- Single `#calendar-content` container
- Mixed events + tasks in chronological order
- Visual distinction via styling

**Option B: Separate Sections**
- Events in one card
- Tasks in another card
- Easier to add task-specific features (mark complete, etc.)

I'd start with Option A since your "today's events" card is often empty anyway—filling it with tasks makes good use of the space.

## Gotchas to Watch For

1. **Time zones**: Tasks might not have time components (`DUE:20250129` vs `DUE:20250129T170000Z`)
2. **Recurring tasks**: VTODO supports recurrence rules too—might want to handle or ignore initially
3. **Completion status**: Decide now whether dashboard is read-only or interactive (marking complete)
4. **Task lists in Nextcloud**: They're just calendar collections—filtering by calendar name will work

## My Recommendation

Start with a **minimal viable implementation**:

1. Fetch tasks with due dates for "today"
2. Display them mixed with events, clearly styled as tasks
3. Show completion status but don't make interactive yet
4. Filter for a specific task list (e.g., "Today" or "Quick Capture")

This gets you 80% of the value with 20% of the effort, and you can iterate from there based on actual usage patterns.

Would you like me to start implementing Phase 1? I can create the task API handler and show you how it integrates with your existing calendar code.