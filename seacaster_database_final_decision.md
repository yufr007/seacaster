# 🎣 DATABASE CHOICE: SUPABASE (NOT DOCKER, NOT NEON)

## **Why Supabase?**

```
✅ Managed PostgreSQL (no server setup)
✅ Free tier: 500MB (more than enough for MVP)
✅ Built-in connection pooling (optimized for Prisma)
✅ Real-time subscriptions (perfect for Socket.IO)
✅ Authentication included (Farcaster integration ready)
✅ Works everywhere (local + production + Farcaster)
✅ Automatic backups
✅ 5-minute setup
```

## **Why NOT the other options?**

```
❌ Docker (local)
   - Only works on your machine
   - Farcaster mini app can't reach localhost
   - Won't work when deployed

❌ Neon
   - Connection pooling not optimized for Socket.IO
   - Overkill for MVP
   - Better for serverless microservices
```

---

## **SUPABASE SETUP (5 MINUTES)**

### **Step 1: Create Account**
```
https://supabase.com/dashboard
Sign in with GitHub
```

### **Step 2: Create Project**
```
Name: seacaster
Region: Closest to you (or us-east-1)
Wait 2-3 min for deployment
```

### **Step 3: Get Connection String**
```
Settings → Database → Connection Pooling
Select "Prisma" tab
Copy the connection string
```

### **Step 4: Add to .env**
```bash
DATABASE_URL="postgresql://postgres.YOUR-REF:PASSWORD@YOUR-REGION.pooler.supabase.com:6543/postgres"
```

### **Step 5: Run Migrations**
```bash
npx prisma migrate dev --name init
```

### **Step 6: Start Backend**
```bash
npm run dev
```

---

## **COST**

```
Free tier: 500MB storage
Your MVP: ~50-100MB
Cost: $0 for 6+ months

If you scale past free tier:
$5/mo per 100GB additional storage
Very cheap for success
```

---

## **WHY SUPABASE BEATS NEON FOR SEACASTER**

| Feature | Supabase | Neon |
|---------|----------|------|
| Connection pooling | Optimized for Socket.IO | Standard |
| Real-time subscriptions | Built-in | Requires setup |
| Authentication | Included | Separate |
| Cost for MVP | $0 | $0 |
| **Your use case** | **Perfect fit** | Overkill |

---

## **RECOMMENDATION**

```
Skip Docker (won't work for Farcaster)
Skip Neon (connection pooling suboptimal)
Use Supabase (perfect for everything)

5 minutes setup
$0 cost
Works everywhere
Ready for Phase 1 🚀
```
