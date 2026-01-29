# Problem Statement: Integrating Nextcloud Tasks into Bedroom Dashboard

## Context

I'm running Nextcloud on my homelab K3s cluster with CalDAV working successfully for calendar sync. I want to use Nextcloud Tasks for quick task entry ("I should do X today") and have those dated tasks appear on my bedroom dashboard alongside calendar events. 

Separately, I want to be able to use custom Nextcloud Tasks lists for repeatable routines ("morning routine", "evening routine") that are currently hardcoded. The quick to-do-today tasks and the repeated routine tasks would need to be separated.

Quick task entry for "I should do X today" is a higher priority than refactoring/upgrading the hardcoded routine tasks.

## Research Findings

### The Core Technical Issue

Nextcloud Tasks and Calendar share the same CalDAV backend, but they use different iCal component types:
- **Calendar Events**: `VEVENT` components
- **Tasks**: `VTODO` components

Nextcloud's web interface has a "show tasks in calendar" feature that displays both together, but this is a **UI-only overlay, not a data transformation**. When external applications query Nextcloud via CalDAV, they receive separate VEVENT and VTODO objects. Most calendar applications and dashboards only display VEVENT, silently ignoring VTODO.

## Opportunity

Since I'm building a custom dashboard with direct control over data queries, I can:

1. Query the Nextcloud CalDAV endpoint directly for both VEVENT and VTODO
2. Parse and display them together in chronological order
3. Style them distinctly (e.g., tasks with checkboxes, events without)
4. Filter/organize however makes sense for the bedroom display

## Technical Requirements

### CalDAV Endpoint

```
Base URL: https://nextcloud.dawnfire.casa/remote.php/dav/
Calendar URL: https://nextcloud.dawnfire.casa/remote.php/dav/calendars/{username}/{calendar-name}/
```

Already working for VEVENT sync; same endpoint contains VTODO data.

### Query Approach

Most CalDAV libraries support filtering by component type:
- Request VEVENT for events
- Request VTODO for tasks
- Both can be filtered by date range

### Data Structure Differences

**VEVENT (Events)**:
- Has `DTSTART` (start time) and `DTEND` (end time)
- Can be all-day or timed
- Location, attendees, recurrence rules

**VTODO (Tasks)**:
- Has `DUE` (due date/time) - this is what makes them show on specific dates
- Has `STATUS` (NEEDS-ACTION, IN-PROCESS, COMPLETED, CANCELLED)
- Has `COMPLETED` date when finished
- Can have priority, percent-complete
- Can have parent/child relationships (subtasks)

### Display Considerations for Dashboard

**Visual distinction needed:**
- Tasks should show completion status (checkbox or checkmark)
- Events might show time duration, tasks show due time
- Overdue tasks might need special styling
- Completed tasks: hide entirely? Show struck through? Configurable? Differing by widget?

**Chronological organization:**
- Tasks with `DUE` date sort by that date/time
- Tasks without `DUE` could go in separate "unscheduled" section or be omitted
- All-day events vs timed events vs timed tasks - sort order?
- Different tasks lists - "morning routine" tasks superseding the hardcoded ones, versus "do today" one-off tasks that appear as events?

## Success Criteria

- [ ] Dashboard queries Nextcloud CalDAV for both VEVENT and VTODO
- [ ] Tasks with due dates appear chronologically alongside events
- [ ] Visual distinction between tasks and events is clear
- [ ] Routine tasks are untangled from "today" tasks
- [ ] Tasks can be marked complete (if interactive) or show completion status (if read-only)
- [ ] Performance is acceptable (CalDAV queries don't slow dashboard load significantly)

## References

- CalDAV RFC 4791: https://datatracker.ietf.org/doc/html/rfc4791
- iCalendar RFC 5545: https://datatracker.ietf.org/doc/html/rfc5545
- Nextcloud CalDAV docs: https://docs.nextcloud.com/server/latest/developer_manual/client_apis/CalDAV/
- Example VTODO structure: https://icalendar.org/iCalendar-RFC-5545/3-6-2-to-do-component.html