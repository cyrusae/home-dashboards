# Production Migration: Local .env to K3s ConfigMap/Secret

**Date:** January 18, 2026  
**Context:** Moving Phase 1 rebuilt dashboard from local development to K3s production  
**Reference:** Your current morning-dashboard setup (dashboards namespace, dashboard-secrets Secret)

---

## Your Current Production Setup

### How It Currently Works

You have a running morning-dashboard deployment in the `dashboards` namespace that:
- Uses **ConfigMaps** to store HTML, CSS, JS files
- Uses a **Secret** (`dashboard-secrets`) to store sensitive credentials:
  - `openweathermap-api-key`
  - `nextcloud-dashboard-password`
- Has an **init container** that injects secrets into `config.js`
- Runs **Node.js backend** and **nginx frontend** as sidecar containers

**Current flow:**
```
K3s Secret (dashboard-secrets)
  ├─ OPENWEATHERMAP_API_KEY
  └─ NEXTCLOUD_PASSWORD
           ↓
    Init Container (busybox)
    Reads secrets, creates /app/config.js with:
    window.__DASHBOARD_CONFIG__ = { apiKey: "...", password: "..." }
           ↓
    Nginx serves static files (HTML/CSS/JS)
    Frontend loads /app/config.js which has credentials
           ↓
    Browser has window.__DASHBOARD_CONFIG__ ready
    Dashboard runs with credentials already loaded
```

### Current K3s YAML Structure

```yaml
# 1. ConfigMaps (HTML, CSS, JavaScript)
ConfigMap: morning-dashboard
  ├─ index.html
  ├─ dashboard.html
  ├─ styles.css
  └─ dashboard.js

# 2. Secret (Credentials)
Secret: dashboard-secrets
  ├─ openweathermap-api-key
  └─ nextcloud-dashboard-password

# 3. Deployment
Deployment: morning-dashboard
  ├─ Init Container: Injects secrets into config.js
  ├─ Container 1: Node.js backend (server.js)
  └─ Container 2: Nginx frontend (serves static files)

# 4. Services & Ingress
Service: morning-dashboard
Ingress: morning-dashboard → morning.dawnfire.casa
```

---

## New Local Development Setup (Phase 1)

### Local Workflow

```
.env file (LOCAL ONLY)
  ├─ VITE_OPENWEATHERMAP_API_KEY=...
  └─ VITE_NEXTCLOUD_PASSWORD=...
           ↓
    node server.js (development mode)
    Backend reads .env and serves /api/config endpoint
           ↓
    Frontend fetches /api/config on startup
           ↓
    window.configManager.config has credentials
    Dashboard runs locally ✅
```

### What's Different in Phase 1

| Aspect | Current Prod | Phase 1 Local |
|--------|--------------|---------------|
| Credentials | K3s Secret (encrypted) | `.env` file (local only, .gitignored) |
| Config injection | Init container + busybox | Backend `/api/config` endpoint |
| Frontend loading | Injects `window.__DASHBOARD_CONFIG__` at startup | Fetches `/api/config` at runtime |
| Local testing | Requires full K3s setup | Just `node server.js` |
| Development speed | Slow (rebuild image, kubectl apply) | Fast (changes instant, npm watch) |

---

## Migration Path: Phase 1 → Production

### Step 0: Prepare Your Code for Both Modes

Your Phase 1 code should already support both:

```javascript
// config-manager.js
class ConfigManager {
  async initialize() {
    // PRODUCTION MODE: Use Kubernetes injected config
    if (window.__DASHBOARD_CONFIG__) {
      console.log('✓ Using Kubernetes injected config');
      this.config = window.__DASHBOARD_CONFIG__;
      return;
    }

    // DEVELOPMENT MODE: Fetch from backend
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        this.config = await response.json();
        console.log('✓ Using .env config from backend');
        return;
      }
    } catch (e) {
      console.warn('✗ Could not fetch config');
    }

    throw new Error('No configuration available');
  }
}
```

```javascript
// server.js
const express = require('express');
const dotenv = require('dotenv');
const app = express();

dotenv.config();

// ONLY available in development
app.get('/api/config', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  res.json({
    openWeatherMapApiKey: process.env.VITE_OPENWEATHERMAP_API_KEY,
    nextcloudPassword: process.env.VITE_NEXTCLOUD_PASSWORD,
    // ... other config
  });
});

// ... rest of server
```

**Key principle:** Same code runs in both environments. The frontend logic determines which config source to use.

---

### Step 1: Build Docker Image

**Create `Dockerfile` (in your dashboard repo):**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY server.js .
COPY src/ ./src/
COPY styles/ ./styles/
COPY index.html .

# Create placeholder for K3s to mount
RUN mkdir -p /app/public && echo '// placeholder' > /app/public/config.js

EXPOSE 3000

# Start in production mode (disables /api/config endpoint)
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

**Build and push:**

```bash
# Build image
docker build -t babbage:5000/dashboard:latest .

# Push to your local registry
docker push babbage:5000/dashboard:latest

# OR to Docker Hub:
# docker tag dashboard:latest your-username/dashboard:latest
# docker push your-username/dashboard:latest
```

---

### Step 2: Update K3s Secret with New Credentials

Your `dashboard-secrets` Secret stays mostly the same, but update the key names:

```bash
# Option A: Update existing Secret
kubectl patch secret dashboard-secrets -n dashboards \
  --type merge \
  -p '{"data":{"OPENWEATHERMAP_API_KEY":"'$(echo -n "your_api_key" | base64)'"}}'

# Option B: Delete and recreate
kubectl delete secret dashboard-secrets -n dashboards
kubectl create secret generic dashboard-secrets \
  -n dashboards \
  --from-literal=OPENWEATHERMAP_API_KEY="your_api_key" \
  --from-literal=NEXTCLOUD_PASSWORD="your_password"

# Verify
kubectl get secret dashboard-secrets -n dashboards -o yaml
```

---

### Step 3: Create Updated Deployment YAML

This is where the key difference happens. Here's what changes from your current setup:

**Old approach (current):**
- Init container reads secrets, creates config.js
- Nginx serves static files
- Frontend uses injected window.__DASHBOARD_CONFIG__

**New approach (production-ready):**
- Backend reads env vars at startup
- Backend serves `/api/config` endpoint during startup (then disabled)
- Frontend fetches `/api/config` and gets config
- Simpler, cleaner, fewer containers

**`morning-dashboard-deployment.yaml`:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dashboard-init
  namespace: dashboards
data:
  init-config.sh: |
    #!/bin/sh
    # This script runs when container starts (optional)
    # Creates window.__DASHBOARD_CONFIG__ for Kubernetes-injected mode
    cat > /app/public/config.js << 'EOF'
    window.__DASHBOARD_CONFIG__ = {
      openWeatherMapApiKey: "${OPENWEATHERMAP_API_KEY}",
      nextcloudPassword: "${NEXTCLOUD_PASSWORD}",
      prometheusUrl: "${PROMETHEUS_URL}",
      nextcloudUrl: "${NEXTCLOUD_URL}",
      nextcloudUser: "${NEXTCLOUD_USER}"
    };
    EOF
    echo "Config initialized"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: morning-dashboard
  namespace: dashboards
  labels:
    app: morning-dashboard
spec:
  replicas: 1
  selector:
    matchLabels:
      app: morning-dashboard
  template:
    metadata:
      labels:
        app: morning-dashboard
    spec:
      serviceAccountName: morning-dashboard
      
      # Init container: Creates config.js from env vars
      initContainers:
      - name: init-config
        image: busybox:latest
        command: ['sh', '-c']
        args:
        - |
          mkdir -p /app/public
          cat > /app/public/config.js << 'EOF'
          window.__DASHBOARD_CONFIG__ = {
            openWeatherMapApiKey: "${OPENWEATHERMAP_API_KEY}",
            nextcloudPassword: "${NEXTCLOUD_PASSWORD}",
            prometheusUrl: "${PROMETHEUS_URL}",
            nextcloudUrl: "${NEXTCLOUD_URL}",
            nextcloudUser: "${NEXTCLOUD_USER}"
          };
          EOF
        env:
        # Load from Secret
        - name: OPENWEATHERMAP_API_KEY
          valueFrom:
            secretKeyRef:
              name: dashboard-secrets
              key: OPENWEATHERMAP_API_KEY
        - name: NEXTCLOUD_PASSWORD
          valueFrom:
            secretKeyRef:
              name: dashboard-secrets
              key: NEXTCLOUD_PASSWORD
        # Load from ConfigMap (if non-sensitive)
        - name: PROMETHEUS_URL
          valueFrom:
            configMapKeyRef:
              name: dashboard-config
              key: PROMETHEUS_URL
              optional: true
        volumeMounts:
        - name: config-volume
          mountPath: /app/public
      
      containers:
      - name: dashboard
        image: registry.dawnfire.casa/dashboard:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        
        # Load credentials from Secret
        env:
        - name: OPENWEATHERMAP_API_KEY
          valueFrom:
            secretKeyRef:
              name: dashboard-secrets
              key: OPENWEATHERMAP_API_KEY
        - name: NEXTCLOUD_PASSWORD
          valueFrom:
            secretKeyRef:
              name: dashboard-secrets
              key: NEXTCLOUD_PASSWORD
        - name: NODE_ENV
          value: "production"
        
        # Mount config.js created by init container
        volumeMounts:
        - name: config-volume
          mountPath: /app/public
        
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
      
      volumes:
      - name: config-volume
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: morning-dashboard
  namespace: dashboards
  labels:
    app: morning-dashboard
spec:
  selector:
    app: morning-dashboard
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: morning-dashboard
  namespace: dashboards
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  ingressClassName: traefik
  tls:
  - hosts:
    - morning.dawnfire.casa
    secretName: morning-dashboard-tls
  rules:
  - host: morning.dawnfire.casa
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: morning-dashboard
            port:
              number: 80
```

**Key differences from current setup:**
1. **Simpler init container:** Just creates config.js with env vars
2. **Single container:** No nginx sidecar needed (Node.js serves static files fine)
3. **Same Secret format:** No changes to dashboard-secrets
4. **Frontend-compatible:** Still injects `window.__DASHBOARD_CONFIG__` for production

---

### Step 4: Deploy to K3s

```bash
# 1. Update Secret if needed
kubectl delete secret dashboard-secrets -n dashboards 2>/dev/null || true
kubectl create secret generic dashboard-secrets \
  -n dashboards \
  --from-literal=OPENWEATHERMAP_API_KEY="your_key_here" \
  --from-literal=NEXTCLOUD_PASSWORD="your_password_here"

# 2. Apply new deployment
kubectl apply -f morning-dashboard-deployment.yaml

# 3. Monitor rollout
kubectl rollout status deployment/morning-dashboard -n dashboards

# 4. Check logs
kubectl logs -n dashboards deployment/morning-dashboard

# 5. Test
kubectl port-forward -n dashboards svc/morning-dashboard 8080:80
# Then visit http://localhost:8080
```

---

### Step 5: Replicate for Other Dashboards (Afternoon, Evening, TV)

Once morning works, replicate for other dashboards:

```bash
# afternoon-dashboard-deployment.yaml
# Same as above, but:
# - Change metadata.name to "afternoon-dashboard"
# - Change ingress host to "afternoon.dawnfire.casa"
# - Update any afternoon-specific config

# Deploy each
kubectl apply -f afternoon-dashboard-deployment.yaml
kubectl apply -f evening-dashboard-deployment.yaml
kubectl apply -f tv-dashboard-deployment.yaml
```

You can reuse the same Docker image for all dashboards (or use query param to switch).

---

## Comparison: Local vs Production

### Local Development (`npm run dev` or `node server.js`)

**What happens:**
```
1. .env file loaded by dotenv
2. server.js reads process.env.VITE_*
3. Frontend fetches /api/config
4. Frontend gets credentials from backend
5. Dashboard works ✅
```

**Advantages:**
- No Docker needed
- No K3s needed
- Changes instant (hot reload)
- Easy to iterate quickly

**Disadvantages:**
- Only works on localhost
- Requires all dependencies installed

---

### Production (`kubectl apply` on K3s)

**What happens:**
```
1. Secret mounted as env vars
2. Init container creates config.js with env vars
3. Config.js loaded in HTML (injects window.__DASHBOARD_CONFIG__)
4. Frontend checks for window.__DASHBOARD_CONFIG__
5. Frontend uses injected config (skips /api/config)
6. Dashboard works ✅
```

**Advantages:**
- Secure (Secrets encrypted at rest)
- Scalable (can replicate pods)
- Production-grade (health checks, resource limits)
- Multi-dashboard support

**Disadvantages:**
- Requires K3s running
- Slower iteration (rebuild image, apply YAML)
- More complex deployment

---

## What Stays the Same vs Changes

### What Your Code Needs to Handle

Your Phase 1 frontend code **must** support both:

```javascript
// This MUST work:
if (window.__DASHBOARD_CONFIG__) {
  // Production mode (K3s injected)
  config = window.__DASHBOARD_CONFIG__;
} else {
  // Development mode (fetch from backend)
  config = await fetch('/api/config').then(r => r.json());
}
```

### What Changes Infrastructure-Wise

| Aspect | Local Dev | Production K3s |
|--------|-----------|----------------|
| Config source | .env file + backend endpoint | Secret + init container |
| Credentials available at | Runtime (fetch `/api/config`) | Startup (init container) |
| Endpoint `/api/config` | ✅ Available (NODE_ENV=development) | ❌ Disabled (NODE_ENV=production) |
| window.__DASHBOARD_CONFIG__ | ❌ Not available | ✅ Injected by init container |
| Where to change config | Edit .env, restart server | Edit Secret, reapply YAML |
| How often you iterate | Fast (instant reload) | Slower (rebuild + deploy) |

---

## Migration Checklist

- [ ] Phase 1: Build local dashboard with .env support
- [ ] Phase 1: Verify local dashboard works with `node server.js`
- [ ] Build Docker image: `docker build -t babbage:5000/dashboard:latest .`
- [ ] Push to registry: `docker push babbage:5000/dashboard:latest`
- [ ] Update K3s Secret with new credentials
- [ ] Apply new deployment YAML
- [ ] Monitor rollout: `kubectl rollout status deployment/morning-dashboard -n dashboards`
- [ ] Test in browser: `morning.dawnfire.casa`
- [ ] Create afternoon/evening/tv deployments (copy + customize)
- [ ] Update rotation scripts to use new dashboard URLs

---

## Key Principle

**Same code, two config modes:**
- **Dev:** `node server.js` → .env file → backend endpoint → frontend fetches
- **Prod:** `kubectl apply` → K3s Secret → init container → frontend injects

Your frontend code automatically picks the right mode based on what's available.

This is the cleanest approach: zero code changes between environments, just different deployment methods.

Ready to build Phase 1?