# Deployment Guide

## Overview

Curriculum Media Hunter is deployed using:
- **GitHub** - Source code repository & version control
- **Railway** - Hosting platform with automatic deployments
- **PostgreSQL** - Database (hosted on Railway)

```
┌─────────────┐      push       ┌─────────────┐     auto-deploy    ┌─────────────┐
│   Local     │ ──────────────► │   GitHub    │ ─────────────────► │   Railway   │
│   Dev       │                 │   Repo      │                    │   (Live)    │
└─────────────┘                 └─────────────┘                    └─────────────┘
```

---

## Live URLs

| Environment | URL |
|-------------|-----|
| **Production** | https://historymediahunter-production.up.railway.app |
| **GitHub Repo** | https://github.com/andytrench/history_media_hunter |
| **Railway Dashboard** | https://railway.com/project/3d8fbf92-10b2-4166-907e-f22d699811f9 |

---

## How Deployment Works

1. You make changes locally
2. Commit and push to GitHub (`main` branch)
3. Railway automatically detects the push
4. Railway builds and deploys the new version
5. Live in ~2-3 minutes

**No manual deployment steps needed!** Just push to GitHub.

---

## Quick Deploy Commands

```bash
# Navigate to project
cd /Users/master15/Desktop/Software/curiculum

# Stage all changes
git add -A

# Commit with message
git commit -m "Your change description"

# Push to GitHub (triggers auto-deploy)
git push
```

---

## Manual Deploy (if needed)

If auto-deploy isn't working, you can manually trigger:

```bash
# Using Railway CLI
railway up
```

---

## Environment Variables

These are configured in Railway (Settings → Variables):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NODE_ENV` | Set to `production` |
| `PORT` | Automatically set by Railway (8080) |

**To update variables:**
```bash
railway variables --set "VARIABLE_NAME=value"
```

---

## Monitoring

### View Logs
```bash
railway logs
```

### Check Service Status
Visit: https://railway.com/project/3d8fbf92-10b2-4166-907e-f22d699811f9

---

## Rollback

If a deployment breaks something:

1. Go to Railway Dashboard
2. Click on the service
3. Go to **Deployments** tab
4. Find a previous working deployment
5. Click **Redeploy**

Or via Git:
```bash
git revert HEAD
git push
```

