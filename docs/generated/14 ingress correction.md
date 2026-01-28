# Dashboard Deployment Fix

## Root Cause
You have **two conflicting Ingress resources** both claiming the same TLS secret (`dashboard-tls`), which breaks cert-manager's certificate issuance. Additionally, applying middleware via annotations to an Ingress that also has direct TLS rules confuses Traefik's routing.

## What's Happening Now
1. `dashboard-ingress` and `dashboard-ingress-morning-redirect` are fighting over the same TLS secret
2. cert-manager can't issue the certificate properly because the resources are conflicting
3. Your browser sees an insecure certificate (or no certificate)
4. Both domains technically route to the service, but HTTPS routing fails

---

## Fix Steps

### Step 1: Delete the Old Conflicting Resources

```bash
# Delete the old conflicting ingress manifests
kubectl delete ingress dashboard-ingress-morning-redirect -n dashboards
kubectl delete ingress dashboard-ingress -n dashboards

# Also delete any orphaned TLS secret (cert-manager will recreate it)
kubectl delete secret dashboard-tls -n dashboards 2>/dev/null || true

# Wait a moment for cleanup
sleep 5
```

### Step 2: Apply the Fixed Manifests

```bash
# Apply the corrected ingress/ingressroute configuration
kubectl apply -f ingress-fixed.yaml

# Verify they were created
kubectl get ingress,ingressroute -n dashboards
```

### Step 3: Verify cert-manager Issues the Certificate

```bash
# Check if the certificate is being issued
kubectl get certificate -n dashboards

# Wait for certificate to be Ready (this may take 30-60 seconds)
kubectl get certificate -n dashboards --watch

# Once Ready: True, check the secret
kubectl get secret dashboard-tls -n dashboards
```

### Step 4: Verify TLS Cert Details

```bash
# Extract and inspect the certificate
kubectl get secret dashboard-tls -n dashboards -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -text | grep -A 2 "Subject Alternative Name"

# Should show:
# DNS:dash.dawnfire.casa, DNS:morning.dawnfire.casa
```

### Step 5: Test the Domains

```bash
# Test dash.dawnfire.casa
curl -v https://dash.dawnfire.casa/

# Test morning.dawnfire.casa (should redirect)
curl -v https://morning.dawnfire.casa/

# Both should show:
# - 200 OK (or 301/302 for the redirect)
# - Certificate validity
```

### Step 6: Check Traefik Dashboard (Optional)

If you have Traefik dashboard exposed:
```bash
# Port forward to Traefik dashboard
kubectl port-forward -n kube-system svc/traefik 9000:9000 &

# Visit: http://localhost:9000/dashboard/
# Look for your routes in the HTTP Routers and HTTPS Routers sections
```

---

## Key Changes in the Fixed Manifests

1. **Single Ingress Resource**: Both domains are in one standard Ingress with one TLS block
   - This prevents cert-manager conflicts
   - Cleaner and more maintainable

2. **Separate IngressRoute for Middleware**: 
   - `morning.dawnfire.casa` routing handled by TraefikIngressRoute instead
   - Applies the redirect middleware cleanly
   - Uses Traefik's native CRD for better middleware support

3. **Correct Middleware Regex**:
   - Added optional `/` in regex: `^https://morning\\.dawnfire\\.casa/?(.*)` 
   - Ensures it catches both `/` and no-path cases

4. **Entrypoints Specification**:
   - IngressRoute explicitly specifies `websecure` entrypoint
   - Makes Traefik routing more predictable

---

## Troubleshooting If Still Broken

### Certificate Not Being Issued
```bash
# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Check for Certificate resource (not Secret)
kubectl get certificate -n dashboards -o yaml

# Look for warnings in the Certificate status
kubectl describe certificate -n dashboards
```

### 404 Still Appears
The image and app are fine. If you still get 404:
1. Verify the service has endpoints: `kubectl get endpoints -n dashboards`
2. Verify the pod is running: `kubectl get pods -n dashboards`
3. Port-forward and test directly: `kubectl port-forward -n dashboards svc/dashboard-service 3000:80`
4. Then: `curl http://localhost:3000/` should show HTML (not 404)

### Middleware Not Being Applied
Check that IngressRoute is recognized:
```bash
kubectl get ingressroute -n dashboards
kubectl describe ingressroute dashboard-morning-redirect -n dashboards
```

If the route shows in Traefik dashboard but middleware isn't applied:
- Verify middleware name matches exactly (case-sensitive)
- Verify namespace is correct
- Try `kubectl describe middleware morning-redirect -n dashboards`

---

## Deployment Order

```bash
# Do NOT apply both old and new at the same time
# Follow these steps in order:

1. kubectl delete ingress dashboard-ingress -n dashboards
2. kubectl delete ingress dashboard-ingress-morning-redirect -n dashboards
3. kubectl delete secret dashboard-tls -n dashboards
4. sleep 10
5. kubectl apply -f ingress-fixed.yaml
6. kubectl get certificate -n dashboards --watch  # Wait for Ready
7. Test with curl
```

---

## Quick Status Check Command

```bash
# All-in-one status check
echo "=== Certificate Status ===" && \
kubectl get certificate -n dashboards && \
echo "" && echo "=== TLS Secret ===" && \
kubectl get secret dashboard-tls -n dashboards && \
echo "" && echo "=== Ingress/IngressRoute ===" && \
kubectl get ingress,ingressroute -n dashboards && \
echo "" && echo "=== Service Endpoints ===" && \
kubectl get endpoints -n dashboards && \
echo "" && echo "=== Pod Status ===" && \
kubectl get pods -n dashboards
```

Run this to see your full status at any point.