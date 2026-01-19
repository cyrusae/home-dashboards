import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { DOMParser } from '@xmldom/xmldom';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
// Serve static files from root (for HTML, CSS, JS in src/)
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    // Ensure correct MIME types
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));
// Serve public folder (for any generated files)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// CONFIGURATION ENDPOINT (Development Only)
// ============================================

app.get('/api/config', (req, res) => {
  // Only serve in development mode
  if (NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Config endpoint not available in production',
      hint: 'Configuration is injected via window.__DASHBOARD_CONFIG__ by K3s init container'
    });
  }

  // Serve config from .env file
  res.json({
    openWeatherMapApiKey: process.env.VITE_OPENWEATHERMAP_API_KEY || '',
    openWeatherMapLocation: process.env.VITE_OPENWEATHERMAP_LOCATION || 'Seattle,US',
    nextcloudUrl: process.env.VITE_NEXTCLOUD_URL || '',
    nextcloudUser: process.env.VITE_NEXTCLOUD_USER || '',
    nextcloudPassword: process.env.VITE_NEXTCLOUD_PASSWORD || '',
    prometheusUrl: process.env.VITE_PROMETHEUS_URL || '',
  });
});

// ============================================
// WEATHER API PROXY
// ============================================

app.get('/api/weather', async (req, res) => {
  try {
    const location = req.query.location || process.env.VITE_OPENWEATHERMAP_LOCATION || 'Seattle,US';
    const apiKey = process.env.VITE_OPENWEATHERMAP_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenWeatherMap API key not configured' });
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=imperial&appid=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();

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

    // Process hourly forecast (today only)
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    for (let i = 0; i < data.list.length && result.hourly.length < 12; i++) {
      const item = data.list[i];
      const itemTime = new Date(item.dt * 1000);
      
      // Only include today's hours
      if (itemTime > now && itemTime <= todayEnd) {
        result.hourly.push({
          time: itemTime.toISOString(),
          temp: Math.round(item.main.temp),
          condition: item.weather[0].main,
          icon: item.weather[0].icon,
          precipProbability: Math.round(item.pop * 100),
          pressure: item.main.pressure,
          pressureMb: item.main.pressure,
        });
      }
    }

    // Process daily forecast (next 3 days)
    const dailyMap = {};
    for (const item of data.list) {
      const itemTime = new Date(item.dt * 1000);
      const dayKey = itemTime.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = {
          date: dayKey,
          temps: [],
          precip: [],
          pressures: [],
          aqi: [],
          conditions: new Set(),
        };
      }

      dailyMap[dayKey].temps.push(item.main.temp);
      dailyMap[dayKey].precip.push(item.pop * 100);
      dailyMap[dayKey].pressures.push(item.main.pressure);
      dailyMap[dayKey].conditions.add(item.weather[0].main);
    }

    // Convert to array, skip today, take next 3 days
    const dailyDates = Object.keys(dailyMap).sort();
    for (let i = 1; i < Math.min(4, dailyDates.length); i++) {
      const day = dailyMap[dailyDates[i]];
      result.daily.push({
        date: day.date,
        high: Math.round(Math.max(...day.temps)),
        low: Math.round(Math.min(...day.temps)),
        precipMax: Math.round(Math.max(...day.precip)),
        pressureAvg: Math.round(Math.average(...day.pressures) || 0),
        condition: Array.from(day.conditions).join(', '),
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CALENDAR API PROXY (CalDAV)
// ============================================

app.get('/api/calendar/events', async (req, res) => {
  try {
    const date = req.query.date || 'today';
    const nextcloudUrl = process.env.VITE_NEXTCLOUD_URL;
    const nextcloudUser = process.env.VITE_NEXTCLOUD_USER;
    const nextcloudPassword = process.env.VITE_NEXTCLOUD_PASSWORD;

    if (!nextcloudUrl || !nextcloudUser || !nextcloudPassword) {
      return res.status(400).json({ error: 'Nextcloud credentials not configured' });
    }

    // Determine date range
    let startDate = new Date();
    let endDate = new Date();

    switch (date) {
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
    res.json(allEvents);
  } catch (error) {
    console.error('Calendar API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PROMETHEUS API PROXY
// ============================================

app.get('/api/prometheus/query', async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    const prometheusUrl = process.env.VITE_PROMETHEUS_URL;
    if (!prometheusUrl) {
      return res.status(400).json({ error: 'Prometheus URL not configured' });
    }

    const url = `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Prometheus error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Prometheus error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    configReady: !!process.env.VITE_OPENWEATHERMAP_API_KEY,
  });
});

// ============================================
// STATIC FILES & SPA FALLBACK
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// SPA fallback: serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Dawnfire Dashboard Server Started                      ║
╚════════════════════════════════════════════════════════════════╝

Environment: ${NODE_ENV}
Port: ${PORT}
URL: http://localhost:${PORT}

API Endpoints:
  GET  /api/config              (development only)
  GET  /api/weather             (OpenWeatherMap proxy)
  GET  /api/calendar/events     (CalDAV proxy)
  GET  /api/prometheus/query    (Prometheus proxy)
  GET  /health                  (health check)

Configuration Status:
  OpenWeatherMap API: ${process.env.VITE_OPENWEATHERMAP_API_KEY ? '✓ Configured' : '✗ Missing'}
  Nextcloud: ${process.env.VITE_NEXTCLOUD_PASSWORD ? '✓ Configured' : '✗ Missing'}
  Prometheus: ${process.env.VITE_PROMETHEUS_URL ? '✓ Configured' : '✗ Missing'}

Local Development:
  cp .env.example .env
  # Edit .env with your credentials
  npm run dev
  # Open http://localhost:${PORT}
  `);
});

// ============================================
// HELPER: Parse iCal Event
// ============================================

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

export default app;