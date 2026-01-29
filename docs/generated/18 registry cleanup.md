# Registry Image Cleanup Guide

With the new versioned build system (`YYYYMMDD-HHMMSS` tags), your registry will accumulate images over time. Here are three approaches to clean them up:

## Quick Comparison

| Approach | Complexity | Automation | Best For |
|----------|-----------|------------|----------|
| **Simple Script** | Low | Manual | Occasional cleanup |
| **Advanced Script** | Medium | Manual/Cron | Full control & testing |
| **K8s CronJob** | Medium | Automatic | Set-and-forget |

---

## Option 1: Simple Manual Cleanup (Recommended for Most Users)

**Best for:** Quick, occasional cleanup when you notice the registry getting large.

### Usage

```bash
./simple-prune.sh
```

This script:
- Keeps the 5 most recent versioned images
- Deletes older versions
- Uses Docker CLI (simple and safe)
- Prompts for confirmation before deleting

### Configuration

Edit the top of `simple-prune.sh`:
```bash
KEEP_LAST_N=5  # Change to keep more/fewer versions
```

### Limitations
- Only removes images from your local Docker cache
- Doesn't reclaim disk space on the registry server
- Requires Docker login to your registry

---

## Option 2: Advanced Manual Cleanup

**Best for:** More control, dry-run testing, or scripted automation.

### Usage

```bash
# Dry run (see what would be deleted)
./prune-registry.sh --dry-run

# Actually delete (keeps last 5 versions)
./prune-registry.sh

# Custom retention
./prune-registry.sh --keep-last 10 --keep-days 30
```

### Features

- **Dual retention policy**: Keeps both recent versions AND recent dates
- **Dry run mode**: Test before deleting
- **Direct API access**: Works without local Docker images
- **Detailed logging**: See exactly what's being kept/deleted

### Retention Logic

An image is kept if it meets ANY of these criteria:
1. It's one of the last N versions (default: 5)
2. It's less than N days old (default: 7)

Example with `--keep-last 5 --keep-days 7`:
```
Tag             | Age    | Keep Reason
----------------------------------------
20250129-143000 | 0 days | Recent #1 ✓
20250129-120000 | 0 days | Recent #2 ✓
20250128-090000 | 1 day  | Recent #3 ✓
20250127-150000 | 2 days | Recent #4 ✓
20250126-100000 | 3 days | Recent #5 ✓
20250125-120000 | 4 days | Within 7d ✓
20250124-080000 | 5 days | Within 7d ✓
20250115-100000 | 14 days| DELETE ✗
20250101-120000 | 28 days| DELETE ✗
```

### Configuration

Edit the top of `prune-registry.sh`:
```bash
KEEP_LAST_N=5    # Keep N most recent versions
KEEP_DAYS=7      # Keep images from last N days
DRY_RUN=false    # Set to true for default dry-run mode
```

### Cron Automation

Add to your crontab to run weekly:
```bash
# Run every Sunday at 3 AM
0 3 * * 0 /path/to/prune-registry.sh --keep-last 5 --keep-days 7
```

---

## Option 3: Kubernetes CronJob (Set and Forget)

**Best for:** Fully automated cleanup with zero manual intervention.

### Setup

```bash
# Deploy the CronJob
kubectl apply -f registry-cleanup-cronjob.yaml

# Check status
kubectl get cronjobs -n kube-system

# View last run
kubectl get jobs -n kube-system | grep registry-cleanup

# Check logs from last run
kubectl logs -n kube-system job/registry-cleanup-<timestamp>
```

### Configuration

Edit `registry-cleanup-cronjob.yaml`:

```yaml
spec:
  # Cron schedule (default: Sundays at 3 AM)
  schedule: "0 3 * * 0"
  
  # In the script section:
  KEEP_LAST_N=5
  KEEP_DAYS=7
```

**Common schedules:**
- `0 3 * * 0` - Every Sunday at 3 AM
- `0 2 * * 1` - Every Monday at 2 AM
- `0 4 1 * *` - First day of each month at 4 AM
- `0 3 */3 * *` - Every 3 days at 3 AM

### Monitoring

Set up alerts if the job fails:
```bash
# Check for failed jobs
kubectl get jobs -n kube-system --field-selector status.successful=0
```

---

## Reclaiming Disk Space on Registry Server

All three approaches mark images for deletion, but **don't immediately reclaim disk space**. The registry needs to run garbage collection:

### Manual Garbage Collection

```bash
# Find your registry pod
kubectl get pods -n kube-system | grep registry

# Run garbage collection
kubectl exec -n kube-system deployment/registry -- \
  registry garbage-collect /etc/docker/registry/config.yml
```

### Automatic Garbage Collection (Recommended)

The Kubernetes CronJob (Option 3) automatically runs garbage collection after cleanup.

For manual scripts, add this to your workflow:
```bash
./prune-registry.sh
kubectl exec -n kube-system deployment/registry -- \
  registry garbage-collect /etc/docker/registry/config.yml
```

---

## Testing Your Cleanup Strategy

### 1. Dry Run First
```bash
./prune-registry.sh --dry-run
```

### 2. Check Current Tag Count
```bash
curl -s "https://registry.dawnfire.casa/v2/dashboard/tags/list" | jq '.tags | length'
```

### 3. Test with Conservative Settings
Start with higher retention, then reduce:
```bash
./prune-registry.sh --keep-last 10 --keep-days 30
```

### 4. Verify :latest Tag
The `:latest` tag is never deleted by these scripts (it's excluded by the version pattern filter).

---

## Troubleshooting

### "No versioned tags found"
Your registry might not have any timestamp-based tags yet. First deployment with the new build system will create them.

### "Could not get digest for tag"
Your registry might require authentication. Add credentials to the scripts or configure Docker login.

### "Registry garbage-collect: command not found"
Your registry deployment might use a different path or command. Check:
```bash
kubectl exec -n kube-system deployment/registry -- ls /bin
```

### Cleanup isn't reclaiming disk space
You need to run garbage collection (see "Reclaiming Disk Space" above).

---

## Recommendations

### For Development
- Use **simple-prune.sh** when you notice the registry getting full
- Run manually every few weeks
- Keep last 3-5 versions

### For Production
- Use **Kubernetes CronJob** for automation
- Keep last 5-10 versions
- Keep 7-14 days of history
- Monitor job status weekly

### For High-Activity Projects
- Increase retention: `--keep-last 10 --keep-days 14`
- Run cleanup more frequently (every 3 days)
- Set up alerting for failed cleanup jobs

---

## Disk Space Calculation

Rough estimates for the dashboard image:
- Each versioned image: ~100-200 MB
- 5 versions = ~500 MB - 1 GB
- 20 versions = ~2-4 GB
- 100 versions = ~10-20 GB

Cleanup becomes important when you deploy multiple times per day over weeks/months.