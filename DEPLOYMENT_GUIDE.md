# 🚀 SeaCaster Deployment Guide

## 1. Supabase Setup (Immediate Action Required)

### Database Connection
Your project is configured to use **Supabase REST API** via `backend/src/supabase.ts` to bypass direct SQL connection issues.

**Required Action:**
1. Get your **Service Role Key** from Supabase Dashboard > Project Settings > API.
2. Update `backend/.env` locally and in your production headers:
```ini
SUPABASE_URL="https://vabaqkpslqyeipbssbin.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhRg..." # <--- Paste Key Here
```

### Database Schema
Run the migration manually in the Supabase SQL Editor:
- **Source:** `backend/migrations.sql`
- **Dashboard:** [SQL Editor](https://supabase.com/dashboard/project/vabaqkpslqyeipbssbin/sql/new)

---

## 2. Docker Deployment (Backend)

A production-optimized `Dockerfile` is included in `backend/Directory`.

### Build & Run Locally
```bash
cd backend
docker build -t seacaster-backend .
docker run -p 8080:8080 --env-file .env seacaster-backend
```

### Cloud Run / Railway
1. **Connect Repo:** Link your GitHub repo.
2. **Root Directory:** Set Root Directory to `backend` (if supported) or use the Dockerfile path.
3. **Env Vars:** Add all variables from `backend/.env` (especially `SUPABASE_SERVICE_ROLE_KEY`).
4. **Port:** Cloud Run expects port `8080` (exposed in Dockerfile).

---

## 3. Frontend Deployment (Vercel)

1. **Framework Preset:** Vite
2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`
4. **Environment Variables:**
   - `VITE_BACKEND_URL`: `https://your-deployed-backend.com`
   - `VITE_SUPABASE_URL`: `https://vabaqkpslqyeipbssbin.supabase.co`

---

## 4. Verification
- **Leaderboard:** Check `/api/leaderboard` on your deployed backend.
- **Wallet:** Connect generic wallet or Smart Wallet on frontend.
- **Game:** Verify 3D assets load and score submits to Supabase.
