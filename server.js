import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API handlers
import { getWeather } from './src/api/weather.js';
import { getCalendarEvents } from './src/api/calendar.js';
import { queryPrometheus } from './src/api/prometheus.js';

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

// Prevent aggressive browser caching in production
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Don't cache HTML or API responses
    if (req.path.endsWith('.html') || req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Static assets can be cached for 1 hour
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    next();
  });
}

// Static file serving
const staticDir = NODE_ENV === 'production' ? path.join(__dirname, 'dist') : __dirname;

app.use(express.static(staticDir, {
  setHeaders: (res, filePath) => {
    // Ensure correct MIME types
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
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

    const result = await getWeather(location, apiKey);
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
    const dateRange = req.query.date || 'today';
    const nextcloudUrl = process.env.VITE_NEXTCLOUD_URL;
    const nextcloudUser = process.env.VITE_NEXTCLOUD_USER;
    const nextcloudPassword = process.env.VITE_NEXTCLOUD_PASSWORD;

    const events = await getCalendarEvents(
      nextcloudUrl,
      nextcloudUser,
      nextcloudPassword,
      dateRange
    );

    res.json(events);
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
    const prometheusUrl = process.env.VITE_PROMETHEUS_URL;

    const result = await queryPrometheus(prometheusUrl, query);
    res.json(result);
  } catch (error) {
    console.error('Prometheus error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// VERSION ENDPOINT (for deployment detection)
// ============================================

app.get('/api/version', (req, res) => {
  // Use build timestamp or pod start time as version identifier
  const version = process.env.BUILD_VERSION || new Date().toISOString();
  res.json({
    version,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
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

if (NODE_ENV === 'production') {
  // SPA fallback: serve index.html for unknown routes in production
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // In development, serve index.html from root
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

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

${NODE_ENV === 'development' ? `
Development Mode:
  Backend API: http://localhost:${PORT}
  Frontend (Vite): http://localhost:5173
  Run: npm run dev:all
` : ''}

API Endpoints:
  GET  /api/config              (development only)
  GET  /api/weather             (OpenWeatherMap proxy)
  GET  /api/calendar/events     (CalDAV proxy)
  GET  /api/prometheus/query    (Prometheus proxy)
  GET  /api/version             (deployment detection)
  GET  /health                  (health check)

Configuration Status:
  OpenWeatherMap API: ${process.env.VITE_OPENWEATHERMAP_API_KEY ? '✓ Configured' : '✗ Missing'}
  Nextcloud: ${process.env.VITE_NEXTCLOUD_PASSWORD ? '✓ Configured' : '✗ Missing'}
  Prometheus: ${process.env.VITE_PROMETHEUS_URL ? '✓ Configured' : '✗ Missing'}

Local Development:
  cp .env.example .env
  # Edit .env with your credentials
  npm run dev:all
  # Open http://localhost:5173 (Vite with HMR)
  `);
});

export default app;