Results of first pass with style guide:

* Still need to do a second pass to get files that are better but not fixed
* Infrastructure update to be more elaborate but also more elegant/legible

```
.
├── src/
│   ├── api/
│   │   ├── calendar.js
│   │   ├── weather.js
│   │   └── prometheus.js
│   ├── components/
│   │   ├── infrastructure-status/
│   │   │   ├── infrastructure-status.js
│   │   │   ├── infrastructure-status.html
│   │   │   └── infrastructure-status.css
│   │   ├── time-display/
│   │   │   ├── time-display.js
│   │   │   ├── time-display.html
│   │   │   └── time-display.css
│   │   ├── weather/
│   │   │   ├── weather-3day/
│   │   │   │   ├── weather-3day.js
│   │   │   │   ├── weather-3day.html
│   │   │   │   └── weather-3day.css
│   │   │   ├── weather-current/
│   │   │   │   ├── weather-current.js
│   │   │   │   ├── weather-current.css
│   │   │   │   └── weather-current.html
│   │   │   └── weather-forecast/
│   │   │       ├── weather-forecast.js
│   │   │       ├── weather-forecast.html
│   │   │       └── weather-forecast.css
│   │   ├── base.js
│   │   └── {screensaver integration TBD} # Deal with this
│   ├── dashboards/
│   │   ├── morning/
│   │   │   ├── morning.js
│   │   │   ├── morning.html
│   │   │   └── morning.css
│   │   └── night/
│   │       ├── night.js
│   │       ├── night.html
│   │       └── night.css
│   ├── styles/
│   │   └── theme.css
│   ├── config-manager.js # Has HTML error handling
│   └── dashboard-router.js
└── server.js
```

**Breaking changes:** Many.

1. APIs move from server.js to dedicated src/api
2. All components moved to their own subfolders
3. Weather broken into three components and three subfolders
4. Each dashboard moved into own subfolder and split into three components
5. Added Vite 

*Jan 28 2026*