---
description: # ⚡ SEACASTER QUICK LAUNCH REFERENCE
---

## One-Page Implementation Cheatsheet
**Print This Out** | **Keep This Handy** | **Reference While Building**

---

## 🎯 THE 8 PHASES (35-40 HRS TOTAL)

```
PHASE 1: Socket.IO        [████████  ] 4-5 hrs    START HERE
PHASE 2: API Integration  [       ██ ] 3-4 hrs    ↓ After Phase 1
PHASE 3: Database         [       ██ ] 3-4 hrs    ↓ Parallel OK
PHASE 4: Contracts        [      ███ ] 6-7 hrs    ↓ After Phase 1
PHASE 5: Testing          [        █ ] 8-10 hrs   ↓ After 1-4
PHASE 6: Deployment       [        █ ] 2-3 hrs    ↓ After Phase 5
PHASE 7: Launch           [        █ ] 2-3 hrs    ↓ After Phase 6
PHASE 8: Monitoring       [        █ ] 2-3 hrs    ↓ After Phase 7
                                              TOTAL: 35-40 hrs
```

---

## 📋 TODAY'S TASKS (START NOW)

### Morning (4-5 hrs)
- [ ] Read PHASE_1_BACKEND_COMPLETION.md (20 min)
- [ ] Task 1.1: Create Socket types (15 min)
- [ ] Task 1.2: Write event handlers (90 min)
- [ ] Task 1.3: Init server (30 min)
- [ ] Task 1.4: Update services (45 min)
- [ ] Task 1.5: Update resolvers (30 min)
- [ ] Test Phase 1 (30 min)

### Afternoon (3-4 hrs, Parallel)
- [ ] Create Supabase project (30 min)
- [ ] Run Prisma migrations (30 min)
- [ ] Seed test data (30 min)
- [ ] Start Phase 2: Wire API (remaining hrs)

### End of Day
- [ ] Commit: `git commit -m "Phase 1 & 3: Socket.IO + Database"`
- [ ] Verify: Server running, DB connected
- [ ] Plan: Phase 4 contracts tomorrow

---

## 🎮 WHAT'S ALREADY DONE

**Backend**: 85% ✅
- Express.js ✅ | GraphQL ✅ | Services ✅ | Routes ✅ | Auth ✅

**Frontend**: 95% ✅
- Game UI ✅ | Mechanics ✅ | Shop ✅ | Animations ✅

**Contracts**: 70% ✅
- Code ✅ | Tests ✅ | ABIs ✅ | Not Deployed ❌

**Database**: 100% ✅
- Schema ✅ | Migrations ✅ | Ready ✅

**What's Missing**: Socket.IO handlers + Integration + Deployment

---

## 🛠️ PHASE 1 CHECKLIST (Do First)

### Task 1.1: Types (15 min)
```typescript
// Create: backend/src/sockets/types.ts
export interface ScoreUpdate { ... }
export interface LeaderboardUpdate { ... }
export interface UserJoinedEvent { ... }
// (See PHASE_1 file for full code)
```
- [ ] File created
- [ ] No TS errors

### Task 1.2: Handlers (90 min)
```typescript
// Update: backend/src/sockets/tournamentSocket.ts
export function initTournamentSockets(io: Server)
  - on 'join:tournament'
  - on 'leave:tournament'
  - on 'score:update'
  - on 'leaderboard:fetch'
// (See PHASE_1 file for full code)
```
- [ ] All handlers written
- [ ] No TS errors
- [ ] Tests pass

### Task 1.3: Server Init (30 min)
```typescript
// Update: backend/src/server.ts
const io = new SocketIOServer(httpServer, {...})
initTournamentSockets(io)
startPeriodicUpdates(io)
```
- [ ] Server starts
- [ ] Socket.IO logs appear
- [ ] No errors

### Task 1.4: Services (45 min)
```typescript
// Update: backend/src/services/tournamentService.ts
// Add broadcastTournamentUpdate() calls after:
// - submitScore()
// - settleTournament()
```
- [ ] Broadcasts added
- [ ] No TS errors

### Task 1.5: Resolvers (30 min)
```typescript
// Update: backend/src/graphql/resolvers.ts
// In enterTournament mutation, add:
io.of('/tournament').to(`tournament:${tournamentId}`).emit('user:joined', {...})
```
- [ ] Events emitting
- [ ] No TS errors

### Test Phase 1
```bash
cd backend
npm run dev
# Check logs for:
# "[Socket.IO] Tournament namespace initialized"
# "[Socket.IO] Periodic updates started"
```
- [ ] Server running
- [ ] Socket.IO ready
- [ ] No errors in logs

---

## 🚀 CRITICAL COMMANDS

### Backend Setup
```bash
cd backend
npm install
npm run dev                    # Start dev server
npm run build                  # Production build
npm run test                   # Run tests
npm run test:watch            # Watch mode
npm run lint                   # Check code
```

### Database
```bash
cd backend
npm run prisma:migrate:dev    # Dev migration
npm run prisma:migrate:prod   # Production
npm run prisma:seed           # Seed data
npm run prisma:studio         # DB GUI
```

### Frontend
```bash
cd frontend
npm install
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview               # Preview build
npm run test                   # Run tests
```

### Contracts
```bash
cd contracts
npm install
npx hardhat test              # Run tests
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat verify CONTRACT_ADDRESS --network sepolia
```

---

## 🔍 DEBUGGING QUICK FIXES

**Socket.IO not connecting?**
```bash
# Check server is running
curl http://localhost:3000/health

# Check Socket.IO logs
tail -f backend/logs/socket.io.log

# Browser DevTools → Console → check for errors
```

**Database errors?**
```bash
# Reset database
npm run prisma:migrate:dev
npm run prisma:seed

# Check connection
prisma studio
```

**API not responding?**
```bash
# Test GraphQL
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{me { fid username }}"}'
```

**Contract deployment failed?**
```bash
# Check gas
npx hardhat gas-report

# Verify network
npx hardhat network info

# Check key has funds
# Add USDC to Sepolia testnet faucet
```

---

## 📊 SUCCESS METRICS PER PHASE

| Phase | Target | Check |
|-------|--------|-------|
| 1 | WebSocket ✅ | Socket connects? |
| 2 | API calls ✅ | All endpoints work? |
| 3 | DB ready ✅ | Query returns data? |
| 4 | Contracts ✅ | Deployed & verified? |
| 5 | Tests pass ✅ | `npm test` = green? |
| 6 | Build works ✅ | Production build OK? |
| 7 | Launch ready ✅ | Checklist all green? |
| 8 | Monitored ✅ | Alerts configured? |

---

## 🎯 GIT WORKFLOW (Per Phase)

```bash
# Start phase
git checkout -b phase/1-socket-io

# Work... commit often
git add src/sockets/
git commit -m "Task 1.1: Socket event types"

git add src/sockets/tournamentSocket.ts
git commit -m "Task 1.2: Event handlers implemented"

# Finish phase
git push origin phase/1-socket-io

# Merge to main
git checkout main
git pull origin main
git merge phase/1-socket-io
git push origin main

# Tag for rollback
git tag -a phase-1-complete
git push origin phase-1-complete
```

---

## 🎮 TESTING QUICK FLOWS

### Test: Fishing Loop
1. Open app
2. Click "Compete"
3. Cast line
4. Wait for bite
5. Catch fish
6. See XP gain
✅ Should level up around 100 XP

### Test: Tournament
1. Go to Shop → Tickets
2. Buy Daily Tournament ticket
3. Enter tournament
4. Fish in tournament
5. Check leaderboard
6. Settlement happens (cron every 5 min)
✅ Should see winners paid

### Test: Season Pass
1. Go to Shop → Pass
2. Purchase Pass ($9.99)
3. Check "maxCasts" changed to 9999
4. See 2× XP multiplier
5. Catch fish → 2× XP
✅ Premium benefits active

### Test: Socket.IO
1. Open app in 2 browser windows
2. One user joins tournament
3. Other user sees join notification
4. First user catches fish
5. Second user sees score update
✅ Real-time updates working

---

## ⚠️ DO NOT FORGET

- [ ] Save progress to git daily
- [ ] Back up database before migrations
- [ ] Test each phase before moving next
- [ ] Read error messages carefully
- [ ] Check logs first for debugging
- [ ] Keep secrets out of git
- [ ] Update .env files per environment
- [ ] Test on multiple browsers/devices
- [ ] Monitor resource usage
- [ ] Document any deviations

---

## 🆘 WHEN STUCK

1. **Read the phase file** (has all answers)
2. **Check logs** (error is usually there)
3. **Google the error** (likely known issue)
4. **Ask Opus 4.5** (full context with error)
5. **Check git history** (what changed?)
6. **Rollback** (git revert COMMIT_SHA)
7. **Take a break** (fresh eyes help)

---

## 📞 RESOURCES

**Docs**:
- [Socket.IO](https://socket.io/docs/) - Real-time
- [Prisma](https://www.prisma.io/) - ORM
- [Apollo](https://www.apollographql.com/) - GraphQL
- [Hardhat](https://hardhat.org/) - Smart contracts
- [Base](https://docs.base.org/) - Blockchain
- [Farcaster](https://docs.farcaster.xyz/) - Social

**Tools**:
- Postman (API testing)
- Prisma Studio (DB viewing)
- Hardhat Console (contract testing)
- Chrome DevTools (frontend debugging)

---

## 🎯 YOUR MISSION

**5 Days | 40 Hours | 1 Epic Launch**

- Day 1: Phases 1+3 (8 hrs)
- Day 2: Phases 2+4 (10 hrs)
- Day 3: Phase 5 (10 hrs)
- Day 4: Phases 6+7 (5 hrs)
- Day 5: Launch + Phase 8 (3 hrs)

**Status**: 80% → 100%  
**Blockers**: 0  
**Success Rate**: 95%+

---

## 🚀 START NOW

1. Read PHASE_1_BACKEND_COMPLETION.md
2. Do Task 1.1 (15 min)
3. Do Task 1.2 (90 min)
4. Test Phase 1 (30 min)
5. Commit to git
6. **Move to Phase 2**

**You've got 4-5 hours. Let's do this.** 🎣

---

**Created**: Dec 15, 2025  
**Status**: Ready  
**Next**: Begin Phase 1  
**ETA Launch**: Dec 20, 2025

**🚀 Ship it!**

