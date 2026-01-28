/**
 * Calendar API Handler
 * Interfaces with Nextcloud CalDAV to fetch calendar events
 */

import fetch from 'node-fetch';
import { DOMParser } from '@xmldom/xmldom';

/**
 * Get calendar events for a date range
 * @param {string} nextcloudUrl - Base Nextcloud URL
 * @param {string} nextcloudUser - Nextcloud username
 * @param {string} nextcloudPassword - Nextcloud password
 * @param {string} dateRange - 'today', 'tomorrow', or 'week'
 * @returns {Promise<Array>} Array of calendar events
 */
export async function getCalendarEvents(nextcloudUrl, nextcloudUser, nextcloudPassword, dateRange = 'today') {
  if (!nextcloudUrl || !nextcloudUser || !nextcloudPassword) {
    throw new Error('Nextcloud credentials not configured');
  }

  // Determine date range
  let startDate = new Date();
  let endDate = new Date();

  switch (dateRange) {
    case 'tomorrow':
      startDate.setDate(startDate.getDate() + 1);
      endDate.setDate(endDate.getDate() + 1);
      break;
    case 'week':
      endDate.setDate(endDate.getDate() + 7);
      break;
    // 'today' is default
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const caldavUrl = `${nextcloudUrl}/remote.php/dav/calendars/${nextcloudUser}/`;
  const auth = Buffer.from(`${nextcloudUser}:${nextcloudPassword}`).toString('base64');

  // PROPFIND to discover calendars
  const discoverResponse = await fetch(caldavUrl, {
    method: 'PROPFIND',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/xml',
      'Depth': '1',
    },
    body: `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop>
    <d:resourcetype />
    <d:displayname />
  </d:prop>
</d:propfind>`
  });

  if (!discoverResponse.ok) {
    throw new Error(`CalDAV discovery failed: ${discoverResponse.status}`);
  }

  const discoverText = await discoverResponse.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(discoverText, 'text/xml');

  const responses = doc.getElementsByTagNameNS('DAV:', 'response');
  const calendars = [];

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    const href = response.getElementsByTagNameNS('DAV:', 'href')[0]?.textContent;
    const resourcetype = response.getElementsByTagNameNS('DAV:', 'resourcetype')[0];
    const displayname = response.getElementsByTagNameNS('DAV:', 'displayname')[0]?.textContent;

    const isCalendar = resourcetype?.getElementsByTagNameNS('urn:ietf:params:xml:ns:caldav', 'calendar').length > 0;

    if (isCalendar && href && !href.endsWith(`/${nextcloudUser}/`)) {
      calendars.push({
        href: href,
        name: displayname || href.split('/').filter(x => x).pop()
      });
    }
  }

  // Fetch events from calendars
  const allEvents = [];

  for (const calendar of calendars) {
    const calendarUrl = `${nextcloudUrl}${calendar.href}`;
    const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const eventsResponse = await fetch(calendarUrl, {
      method: 'REPORT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/xml',
        'Depth': '1',
      },
      body: `<?xml version="1.0" encoding="utf-8" ?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${formatDate(startDate)}" end="${formatDate(endDate)}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`
    });

    if (!eventsResponse.ok) {
      console.warn(`Could not fetch events from ${calendar.name}: ${eventsResponse.status}`);
      continue;
    }

    const eventsText = await eventsResponse.text();
    const eventsDoc = parser.parseFromString(eventsText, 'text/xml');
    const eventResponses = eventsDoc.getElementsByTagNameNS('DAV:', 'response');

    for (let i = 0; i < eventResponses.length; i++) {
      const eventResponse = eventResponses[i];
      const calendarData = eventResponse.getElementsByTagNameNS('urn:ietf:params:xml:ns:caldav', 'calendar-data')[0]?.textContent;

      if (calendarData) {
        const event = parseICalEvent(calendarData);
        if (event) {
          event.calendar = calendar.name;
          allEvents.push(event);
        }
      }
    }
  }

  // Sort by start time
  allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
  return allEvents;
}

/**
 * Parse iCal event data
 * @param {string} icalData - Raw iCal data
 * @returns {Object|null} Parsed event or null if invalid
 */
function parseICalEvent(icalData) {
  try {
    const lines = icalData.split(/\r?\n/);
    const event = {};

    let inEvent = false;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        continue;
      }
      if (line === 'END:VEVENT') {
        break;
      }

      if (!inEvent) continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const fullProp = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);
      const semicolonIndex = fullProp.indexOf(';');
      const prop = semicolonIndex === -1 ? fullProp : fullProp.substring(0, semicolonIndex);

      if (prop === 'SUMMARY') {
        event.summary = value;
      } else if (prop === 'DTSTART') {
        event.start = parseICalDate(value);
      } else if (prop === 'DTEND') {
        event.end = parseICalDate(value);
      }
    }

    if (event.summary && event.start) {
      return event;
    }

    return null;
  } catch (error) {
    console.error('Error parsing iCal event:', error);
    return null;
  }
}

/**
 * Parse iCal date string to ISO format
 * @param {string} dateStr - iCal date string
 * @returns {string} ISO date string
 */
function parseICalDate(dateStr) {
  if (dateStr.includes('T')) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);

    const isUTC = dateStr.endsWith('Z');

    if (isUTC) {
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
    } else {
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toISOString();
    }
  } else {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(`${year}-${month}-${day}T00:00:00`).toISOString();
  }
}