# 🎯 Sentry Setup Guide (5 minutes)

## Step 1: Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up (Free plan is sufficient)
3. Choose "React" as your platform (for frontend errors)

## Step 2: Create Project

1. In Sentry dashboard, click "Create Project"
2. Platform: **Node.js** (for backend)
3. Project name: `seacaster-backend`
4. Click "Create Project"

## Step 3: Get DSN

After creating the project, you'll see your DSN:

```
https://YOUR_KEY@o1234567.ingest.sentry.io/1234567
```

Copy this entire URL.

## Step 4: Add to Environment

Add to `backend/.env`:
```bash
SENTRY_DSN=https://YOUR_KEY@o1234567.ingest.sentry.io/1234567
```

## Step 5: Test Integration

```bash
cd backend
npx tsx scripts/test-sentry.ts
```

You should see:
- ✅ Sentry initialized
- ✅ Test message sent
- ✅ Test exception captured
- ✅ Events flushed

## Step 6: Verify in Dashboard

1. Go to https://sentry.io/
2. Click on `seacaster-backend` project
3. You should see 2 events:
   - Info message: "SeaCaster test event..."
   - Error: "SeaCaster test exception..."

## Optional: Configure Alerts

1. In Sentry: Settings → Alerts
2. Create alert:
   - Condition: "Error rate > 5%"
   - Action: Email notification
   - Save

---

**That's it!** Sentry is ready for production error tracking.
