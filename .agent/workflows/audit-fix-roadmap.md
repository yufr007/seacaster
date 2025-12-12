---
description: # 🚨 SEACASTER: CRITICAL FIX ROADMAP
---

# 🚨 SEACASTER: CRITICAL FIX ROADMAP

**Audit Date:** December 12, 2025  
**Total Issues:** 22  
**Time to Fix All:** ~2 hours  
**Time to Fix Critical/High:** ~30 minutes  

---

## **STOP - FIX THESE NOW (Next 30 min)**

### **🔴 Issue #1: Duplicate Script Loading in index.html**

**File:** `index.html`

**Current (BROKEN):**
```html
<head>
  <!-- Line 78 -->
  <script type="module" src="./index.tsx"></script>
</head>
<body>
  <!-- Line 83 -->
  <script type="module" src="/index.tsx"></script>
</body>
```

**Fix:**
```diff
<head>
  <!-- DELETE THIS LINE -->
- <script type="module" src="./index.tsx"></script>
</head>
<body>
  <!-- KEEP THIS ONE ONLY -->
  <script type="module" src="/index.tsx"></script>
</body>
```

**Why:** Double initialization causes memory leaks and race conditions.

**Time:** 1 minute

---

### **🔴 Issue #2: Conflicting Import Maps with Version Mismatches**

**File:** `index.html` lines 43-77

**Current (BROKEN):**
```json
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",           // v18
    "react/": "https://aistudiocdn.com/react@^19.2.0/",  // v19 ❌
    "wagmi": "https://esm.sh/wagmi@2.12.0",              // v2.12
    "wagmi/": "https://aistudiocdn.com/wagmi@^3.0.2/",   // v3 ❌
    "zustand": "https://esm.sh/zustand@4.5.0",           // v4
    "zustand/": "https://aistudiocdn.com/zustand@^5.0.8/", // v5 ❌
    "express": "https://aistudiocdn.com/express@^5.1.0",  // ❌ Backend!
    "cors": "https://aistudiocdn.com/cors@^2.8.5",        // ❌ Backend!
    "helmet": "https://aistudiocdn.com/helmet@^8.1.0",    // ❌ Backend!
    "hardhat": "https://aistudiocdn.com/hardhat@^3.0.16"  // ❌ Backend!
  }
}
```

**Fix - REMOVE ALL aistudiocdn entries:**
```diff
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
-   "react/": "https://aistudiocdn.com/react@^19.2.0/",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
-   "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
    "wagmi": "https://esm.sh/wagmi@2.12.0",
-   "wagmi/": "https://aistudiocdn.com/wagmi@^3.0.2/",
    "zustand": "https://esm.sh/zustand@4.5.0",
-   "zustand/": "https://aistudiocdn.com/zustand@^5.0.8/",
-   "express": "https://aistudiocdn.com/express@^5.1.0",
-   "cors": "https://aistudiocdn.com/cors@^2.8.5",
-   "dotenv": "https://aistudiocdn.com/dotenv@^17.2.3",
-   "chai": "https://aistudiocdn.com/chai@^6.2.1",
-   "helmet": "https://aistudiocdn.com/helmet@^8.1.0",
-   "hardhat": "https://aistudiocdn.com/hardhat@^3.0.16",
-   "@nomicfoundation/hardhat-toolbox/": "https://aistudiocdn.com/@nomicfoundation/hardhat-toolbox@^6.1.0/"
  }
}
```

**Why:** Vite handles bundling. These CDN imports conflict with your actual versions.

**Time:** 5 minutes

---

### **🔴 Issue #3: Dual Backend Route Files (STUB vs REAL)**

**Files:** 
- `backend/routes/game.ts` (17 lines - STUB)
- `backend/src/routes/game.ts` (169 lines - REAL)
- `backend/routes/webhook.ts` (59 lines - STUB)
- `backend/src/routes/webhook.ts` (92 lines - REAL)

**Problem:** Server imports from `./routes/game` which loads the STUB, not the real implementation!

**Fix:**

Option A (Recommended - Clean):
```bash
# Delete the stubs
rm backend/routes/game.ts
rm backend/routes/webhook.ts
rm -rf backend/routes/  # Remove entire stub directory if empty

# Move real routes to root
mv backend/src/routes/* backend/routes/

# Update imports in server.ts
# from: import gameRouter from './src/routes/game';
# to:   import gameRouter from './routes/game';
```

Option B (Keep structure):
Update `backend/src/server.ts`:
```typescript
// Change from:
import gameRouter from './routes/game';

// To:
import gameRouter from './src/routes/game';
```

**Why:** Currently loading non-functional stub code that logs nothing to database.

**Time:** 5 minutes

---

### **🟠 Issue #4: Fix Manifest contractAddresses Field**

**File:** `.well-known/farcaster.json`

**Current (WRONG):**
```json
{
  "contracts": {
    "network": "base-sepolia"
  }
}
```

**Fix (CORRECT):**
```json
{
  "contractAddresses": {
    "base-sepolia": {
      "SeaCasterPass": "0xYourDeployedAddress",
      "TournamentEscrow": "0xYourDeployedAddress"
    }
  }
}
```

**Why:** Farcaster builder rewards won't attribute contract interactions without correct field name.

**Time:** 5 minutes

---

### **🟠 Issue #5: Remove Prisma from Backend**

**File:** `backend/src/server.ts` line 9

**Current (BROKEN):**
```typescript
import { PrismaClient } from '@prisma/client';
// ...
const prisma = new PrismaClient();  // ← This fails without DATABASE_URL
```

**Fix - Option A (Complete removal):**
```bash
# Uninstall Prisma entirely
npm uninstall prisma @prisma/client
rm -rf backend/prisma/
rm backend/.env  # Old Prisma .env

# Update server.ts - REMOVE these lines:
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
```

**Fix - Option B (Make optional):**
```typescript
let prisma: PrismaClient | null = null;

if (process.env.USE_PRISMA === 'true') {
  prisma = new PrismaClient();
  console.log('✅ Using Prisma for database');
} else {
  console.log('✅ Using Supabase for database');
}
```

**Why:** You're using Supabase-js (REST), not Prisma. Prisma tries to connect to port 5432 (causes connection issues).

**Time:** 10 minutes

---

### **🟠 Issue #6: Add Missing Supabase Env Vars**

**File:** `backend/.env.example`

**Add these:**
```bash
# Supabase Configuration
SUPABASE_URL="https://vabaqkpslqyeipbssbin.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Backend Server
PORT=3001
NODE_ENV=production
```

**Time:** 2 minutes

---

### **🟠 Issue #7: Fix purchasePass Contract Call**

**File:** `hooks/useContracts.ts` around line 54

**Current (BROKEN):**
```typescript
writeContract({
  address: CONTRACT_ADDRESSES.SEASON_PASS,
  abi: SEASON_PASS_ABI,
  functionName: 'purchasePass',
  args: [CONTRACT_ADDRESSES.USDC as `0x${string}`],  // ❌ Extra arg!
});
```

**Fix:**
```typescript
writeContract({
  address: CONTRACT_ADDRESSES.SEASON_PASS,
  abi: SEASON_PASS_ABI,
  functionName: 'purchasePass',
  args: [],  // ✅ No arguments for purchasePass()
});
```

**Why:** Contract `purchasePass()` takes no arguments. Extra arg causes revert.

**Time:** 2 minutes

---

## **TOTAL TIME: CRITICAL + HIGH PRIORITY FIXES**

```
Issue #1 (Dup Scripts):    1 min
Issue #2 (Importmap):      5 min
Issue #3 (Route files):    5 min
Issue #4 (Manifest):       5 min
Issue #5 (Prisma):        10 min
Issue #6 (Env vars):       2 min
Issue #7 (Contract):       2 min
────────────────────────
TOTAL:                    30 minutes
```

---

## **THEN FIX THESE (Medium Priority - 30 min)**

### **🟡 Issue #8: Replace External Icon Service**

Create local icons:
```bash
# Create icons folder
mkdir -p public/icons

# Add PNG files:
# public/icons/icon-192.png (192x192)
# public/icons/icon-512.png (512x512)
```

Update `manifest.json`:
```json
"icons": [
  {
    "src": "/icons/icon-192.png",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "/icons/icon-512.png",
    "sizes": "512x512",
    "type": "image/png"
  }
]
```

**Time:** 15 minutes

---

### **🟡 Issue #9: Fix Service Worker Sound Files**

**File:** `sw.js` lines 9-12

**Current (MISSING FILES):**
```javascript
const ASSETS = [
  '/sounds/cast.mp3',      // ❌ Doesn't exist
  '/sounds/splash.mp3',    // ❌ Doesn't exist
  '/sounds/reel-spin.mp3', // ❌ Doesn't exist
  '/sounds/success.mp3',   // ❌ Doesn't exist
];
```

**Fix - Option A (Remove if not using):**
```javascript
const ASSETS = [
  // Sound files removed - using web audio instead
];
```

**Fix - Option B (Add actual files):**
```bash
mkdir -p public/sounds
# Add your sound files: cast.mp3, splash.mp3, reel-spin.mp3, success.mp3
```

**Time:** 10 minutes

---

### **🟡 Issue #10: Implement USDC Approval Flow**

**File:** `hooks/useContracts.ts` around line 41

**Add this before purchasePass:**
```typescript
const approveUSDC = async (amount: string) => {
  return new Promise((resolve, reject) => {
    writeContract({
      address: CONTRACT_ADDRESSES.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [
        CONTRACT_ADDRESSES.SEASON_PASS as `0x${string}`,
        parseUnits(amount, 6),  // USDC has 6 decimals
      ],
    });
    // Handle tx confirmation, then resolve
  });
};

const buySeasonPass = async (usdcAmount: string) => {
  try {
    // 1. Request approval
    await approveUSDC(usdcAmount);
    
    // 2. Once approved, purchase
    writeContract({
      address: CONTRACT_ADDRESSES.SEASON_PASS,
      abi: SEASON_PASS_ABI,
      functionName: 'purchasePass',
      args: [],
    });
  } catch (e) {
    console.error('Purchase failed:', e);
  }
};
```

**Time:** 30 minutes

---

## **EXECUTION ORDER**

```
RIGHT NOW (30 min):
1. Delete duplicate script in index.html        ✓ 1 min
2. Remove aistudiocdn from importmap            ✓ 5 min
3. Delete/move route stub files                 ✓ 5 min
4. Fix manifest contractAddresses               ✓ 5 min
5. Remove Prisma import                         ✓ 10 min
6. Add Supabase env vars                        ✓ 2 min
7. Fix purchasePass args                        ✓ 2 min

THEN (30 min):
8. Add local icons                              ✓ 15 min
9. Fix SW sound files                           ✓ 10 min
10. Implement USDC approval                     ✓ 30 min

POLISH (30 min):
- Test build (npm run build)
- Test all routes
- Verify Supabase connection
- Commit to GitHub
```

---

## **Verification Checklist**

After fixes, verify:

- [ ] `npm run build` succeeds without errors
- [ ] No console errors on app load
- [ ] Wallet connect works
- [ ] Game renders 3D scene
- [ ] Score submission works
- [ ] Backend `/api/leaderboard` returns data
- [ ] Backend `/api/sync` accepts user data
- [ ] All routes use Supabase (not Prisma)
- [ ] GitHub commits pushed

---

**Start with Issue #1. When all 7 critical/high fixes are done, you're ready for Phase 1 launch.** 🎣

