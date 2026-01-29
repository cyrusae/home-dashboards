# Dashboard Refresh System

## Problem Solved

The dashboard now automatically refreshes to prevent:
- Stale calendar/weather data after API errors
- Old deployments staying cached in kiosk browsers
- Browser cache serving outdated static assets

## How It Works

### 1. Daily Hard Refresh (4:30 AM PST)
- Scheduled refresh before morning dashboard starts at 5:00 AM
- Clears all browser caches and localStorage
- Ensures fresh start each day

### 2. Deployment Detection (Every 5 Minutes)
- Polls `/api/version` endpoint for new deployments
- When version changes, waits 10 seconds then refreshes
- Ensures kiosk picks up new rollouts automatically

### 3. Error Recovery (After 3 Consecutive Errors)
- Monitors all API calls for failures
- If 3 consecutive API errors occur, forces refresh
- Prevents dashboard from staying broken due to stale state

### 4. Rate Limiting
- Minimum 1 minute between refreshes to prevent loops
- Refresh reasons logged to console for debugging

## Files Modified

### New Files
- `src/refresh-manager.js` - Core refresh logic
- `build-and-push.sh` - Helper script for versioned builds

### Modified Files
- `index.html` - Initializes refresh manager on load
- `server.js` - Added `/api/version` endpoint
- `Dockerfile` - Accepts `BUILD_TIMESTAMP` build arg

## Usage

### Development
No changes needed - refresh manager is active but won't interfere with development.

### Production Deployment

#### Option 1: Automatic Build Script
```bash
./build-and-push.sh
# Responds with version tag and prompts to push
# Then: kubectl rollout restart deployment/morning-dashboard -n dashboards
```

#### Option 2: Manual Docker Build
```bash
BUILD_TS=$(date -u +"%Y%m%d-%H%M%S")
docker build --build-arg BUILD_TIMESTAMP="${BUILD_TS}" \
  -t registry.dawnfire.casa/dashboard:${BUILD_TS} \
  -t registry.dawnfire.casa/dashboard:latest .
docker push registry.dawnfire.casa/dashboard:${BUILD_TS}
docker push registry.dawnfire.casa/dashboard:latest
kubectl rollout restart deployment/morning-dashboard -n dashboards
```

The dashboard will automatically detect the new deployment within 5 minutes and refresh.

## Configuration

You can customize refresh behavior in `index.html` where `RefreshManager` is initialized:

```javascript
window.refreshManager = new RefreshManager({
  dailyRefreshHour: 4,                      // Hour for daily refresh (PST)
  dailyRefreshMinute: 30,                   // Minute for daily refresh
  deploymentCheckInterval: 5 * 60 * 1000,   // Check every 5 minutes
  consecutiveErrorThreshold: 3,             // Errors before forcing refresh
});
```

## Debugging

Check browser console for refresh manager logs:
- `🔄 RefreshManager: Initializing...` - Startup
- `RefreshManager: Current version is YYYYMMDD-HHMMSS` - Version detected
- `RefreshManager: Next daily refresh at ...` - Schedule confirmation
- `🔄 RefreshManager: New deployment detected` - Version changed
- `🔄 RefreshManager: Hard refresh triggered (reason: ...)` - Refresh happening

## Testing

### Test Daily Refresh
1. Change `dailyRefreshHour` and `dailyRefreshMinute` to 1 minute from now
2. Reload page
3. Wait - console will show countdown and trigger refresh

### Test Deployment Detection
1. Deploy a new version
2. Wait up to 5 minutes
3. Console will show "New deployment detected" and refresh

### Test Error Recovery
1. Temporarily break an API endpoint
2. Refresh page
3. After 3 failed API calls, automatic refresh triggers

## Notes

- Refresh manager skips execution on the night dashboard (10 PM - 5 AM) to avoid disturbing sleep
- All refreshes bypass browser cache (`window.location.reload(true)`)
- Version tracking uses build timestamp, ensuring each deployment is unique