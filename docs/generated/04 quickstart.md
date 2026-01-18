# Quick Start - Phase 1 Dashboard (5 minutes)

## Step 1: Download Project
The complete project is in `dashboard-rebuild/` directory (also in outputs)

## Step 2: Set Up Environment (1 min)
```bash
cd dashboard-rebuild
cp .env.example .env
```

## Step 3: Edit Credentials (2 min)
Open `.env` and fill in:
```bash
VITE_OPENWEATHERMAP_API_KEY=your_api_key_from_openweathermap.org
VITE_NEXTCLOUD_URL=https://nextcloud.dawnfire.casa
VITE_NEXTCLOUD_USER=dashboard
VITE_NEXTCLOUD_PASSWORD=your_nextcloud_dashboard_password
VITE_PROMETHEUS_URL=https://prometheus.dawnfire.casa
```

## Step 4: Install & Run (2 min)
```bash
npm install
npm run dev
```

You'll see:
```
╔════════════════════════════════════════════╗
║    Dawnfire Dashboard Server Started       ║
╚════════════════════════════════════════════╝

Environment: development
Port: 3000
URL: http://localhost:3000
```

## Step 5: Open in Browser
- **Morning Dashboard:** http://localhost:3000?dashboard=morning
- **Health Check:** http://localhost:3000/health

---

## You Should See

1. **Large PST time** (e.g., "14:32") in mauve color
2. **Date** above it (e.g., "Friday, Jan 18")
3. **EST time** below (e.g., "EST: 17:32")
4. **Weather section** with:
   - Current temperature
   - Humidity, wind, AQI, pressure
   - Sunrise/sunset times
   - Hourly forecast table (today and tomorrow)
5. **Calendar section** with today's events
6. **Morning routine** task list
7. **Infrastructure** placeholder (mock data)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot find module 'dotenv'` | Run `npm install` |
| `Cannot GET /api/weather` | Check `.env` has valid OpenWeatherMap API key |
| `No events showing` | Check Nextcloud credentials in `.env` |
| `Config not initialized` error | See browser console (F12) for details |
| Page shows "Loading..." forever | Check server logs for errors |

---

## What to Try Next

✅ **Colors look right?** (soft gray bg, sky blue weather, etc.)  
✅ **Time updating?** (PST should change every second)  
✅ **Weather loading?** (shows temperature or error)  
✅ **Calendar loading?** (shows events or "No events")

If yes → Proceed to Phase 2 (Docker build + K3s deployment)  
If no → Check errors in browser console (F12 → Console tab)

---

## Customizing Before Phase 2

**Change PST time color:**
Edit `src/styles/theme.css`:
```css
:root {
  --pst-accent: #8839ef;  /* Change this color */
}
```
Then refresh browser.

**Change background shade:**
Edit `src/styles/theme.css`:
```css
:root {
  --bg-soft: #e6e9ef;  /* Try #e8eaef for lighter */
}
```

**View all theme colors:**
Open `src/styles/theme.css` and look for `:root { ... }`

---

## Next Steps After Testing

1. **Confirm everything works locally** (all components load)
2. **Build Docker image:**
   ```bash
   docker build -t babbage:5000/dashboard:latest .
   ```
3. **Push to registry:**
   ```bash
   docker push babbage:5000/dashboard:latest
   ```
4. **Deploy to K3s** (use deployment YAML in project)

---

## Questions?

- Check `README.md` for full documentation
- Check browser console (F12) for error messages
- Server logs show detailed info: `npm run dev` output
- Check `PHASE_1_COMPLETION_SUMMARY.md` for detailed guide

**You're ready!** Let me know when you hit any issues or want to proceed to Phase 2 (Docker + K3s). 🚀