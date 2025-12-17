import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GamePhase, UserStats, Fish, Rarity, Inventory, Bait } from '../types';
import { FISH_TYPES, LEVEL_BASE_XP, LEVEL_EXPONENT, BAITS, RARITY_WEIGHTS } from '../constants';
import confetti from 'canvas-confetti';
import { Haptics, triggerHaptic } from '../utils/haptics';

interface GameState {
  phase: GamePhase;
  userStats: UserStats;
  inventory: Inventory;
  lastCatch: Fish | null;
  history: Fish[];
  hookedFish: Fish | null;
  hookTime: number;
  isNewCatch: boolean; // Track if the current catch is a new species

  // Actions
  setPhase: (phase: GamePhase) => void;
  castLine: () => void;
  triggerBite: () => void;
  attemptCatch: () => void;
  startReeling: () => void;      // New: Transition to REELING phase
  completeReeling: (success: boolean) => void;  // New: Handle reel result
  finishCatchAnimation: () => void;
  failCatch: () => void;
  collectReward: () => void;

  setActiveBait: (baitId: string) => void;
  buyItem: (itemId: string, price: number, type: 'bait' | 'other', amount?: number) => void;
  purchaseSeasonPass: () => void;
  syncPremiumStatus: (isActive: boolean) => void;
  regenerateCasts: () => void;
  watchAd: () => void;
  checkDailyLogin: () => string | null;
  openChest: () => string;
  addXP: (amount: number) => void;
  addCasts: (amount: number) => void;

  // Loot & Cosmetics
  unlockCosmetic: (cosmeticId: string) => boolean;
  equipCosmetic: (cosmeticId: string, type: 'title' | 'badge' | 'rod_skin' | 'bobber' | 'trail_effect') => void;
  addBonusDrop: (type: 'coins' | 'xp' | 'bait', quantity: number, baitId?: string) => void;
}

// XP Calculation Helper
const getNextLevelXp = (level: number) => Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, level - 1));

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: GamePhase.IDLE,
      lastCatch: null,
      hookedFish: null,
      hookTime: 0,
      history: [],
      isNewCatch: false,

      userStats: {
        fid: 0,
        username: 'Fisher',
        xp: 0,
        level: 1,
        castsRemaining: 5,
        maxCasts: 15, // Free tier default
        lastCastRefill: Date.now(),
        lastLogin: Date.now(),
        coins: 100,
        premium: false,
        streak: 1,
        highestStreak: 1,
        pendingChests: 0,
      },

      inventory: {
        baits: { 'worm': 999 },
        rods: ['bamboo'],
        activeBaitId: 'worm',
        activeRodId: 'bamboo',
        // Cosmetics
        unlockedCosmetics: [],
        equippedTitle: null,
        equippedBadge: null,
        equippedRodSkin: null,
        equippedBobber: null,
        equippedTrail: null,
      },

      setPhase: (phase) => set({ phase }),

      setActiveBait: (baitId) => {
        triggerHaptic(Haptics.soft);
        set(state => ({ inventory: { ...state.inventory, activeBaitId: baitId } }));
      },

      purchaseSeasonPass: () => {
        triggerHaptic(Haptics.levelUp);
        set(state => ({
          userStats: { ...state.userStats, premium: true, maxCasts: 9999, coins: state.userStats.coins - 999 }
        }));
      },

      syncPremiumStatus: (isActive) => set(state => ({
        userStats: {
          ...state.userStats,
          premium: isActive,
          maxCasts: isActive ? 9999 : 15
        }
      })),

      watchAd: () => {
        set(state => ({
          userStats: {
            ...state.userStats,
            coins: state.userStats.coins + 25,
            castsRemaining: Math.min(state.userStats.maxCasts, state.userStats.castsRemaining + 2)
          }
        }));
      },

      addXP: (amount) => {
        const { userStats } = get();
        const newXp = userStats.xp + amount;
        const nextLevelXp = getNextLevelXp(userStats.level + 1);

        if (newXp >= nextLevelXp) {
          confetti({ particleCount: 100, spread: 60, origin: { y: 0.7 } });
          triggerHaptic(Haptics.levelUp);
          set(state => ({
            userStats: {
              ...state.userStats,
              xp: newXp,
              level: state.userStats.level + 1
            }
          }));
        } else {
          set(state => ({
            userStats: { ...state.userStats, xp: newXp }
          }));
        }
      },

      addCasts: (amount) => {
        set(state => ({
          userStats: {
            ...state.userStats,
            castsRemaining: state.userStats.premium ? 9999 : Math.min(state.userStats.maxCasts, state.userStats.castsRemaining + amount)
          }
        }));
      },

      checkDailyLogin: () => {
        const { userStats } = get();
        const now = new Date();
        const last = new Date(userStats.lastLogin);

        // Reset hours to compare dates only
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const lastMidnight = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();

        // If same day, do nothing
        if (todayMidnight === lastMidnight) return null;

        const oneDay = 24 * 60 * 60 * 1000;
        let newStreak = userStats.streak;

        // If consecutive day (allow up to 48h to be generous with timezones)
        if (todayMidnight - lastMidnight <= oneDay + 1000) {
          newStreak += 1;
        } else {
          newStreak = 1; // Reset
        }

        // Reward Logic
        const rewardCoins = 20 * newStreak;

        set(state => ({
          userStats: {
            ...state.userStats,
            lastLogin: Date.now(),
            streak: newStreak,
            highestStreak: Math.max(state.userStats.highestStreak, newStreak),
            coins: state.userStats.coins + rewardCoins,
            castsRemaining: Math.min(state.userStats.maxCasts, state.userStats.castsRemaining + 5)
          }
        }));

        triggerHaptic(Haptics.success);
        return `Daily Bonus! +${rewardCoins} Coins & +5 Casts!`;
      },

      openChest: () => {
        const { userStats, inventory } = get();
        if (userStats.pendingChests <= 0) return "No chests available";

        // Grant Prestige Rewards
        const coinsReward = 5000;
        const baitReward = 5; // 5 Kraken Eyes
        const baitId = 'kraken_eye';

        confetti({
          particleCount: 200,
          spread: 90,
          colors: ['#FFD700', '#FFA500', '#ffffff']
        });
        triggerHaptic(Haptics.legendaryCatch);

        set(state => ({
          userStats: {
            ...state.userStats,
            pendingChests: state.userStats.pendingChests - 1,
            coins: state.userStats.coins + coinsReward,
            castsRemaining: state.userStats.premium ? 9999 : state.userStats.maxCasts // Full refill
          },
          inventory: {
            ...state.inventory,
            baits: {
              ...state.inventory.baits,
              [baitId]: (state.inventory.baits[baitId] || 0) + baitReward
            }
          }
        }));

        return `Prestige Rewards! +${coinsReward} Coins & 5 Kraken Eyes!`;
      },

      buyItem: (itemId, price, type, amount = 1) => {
        const { userStats, inventory } = get();
        if (userStats.coins >= price) {
          const newCoins = userStats.coins - price;
          if (type === 'bait') {
            const currentAmount = inventory.baits[itemId] || 0;
            set({
              userStats: { ...userStats, coins: newCoins },
              inventory: {
                ...inventory,
                baits: { ...inventory.baits, [itemId]: currentAmount + amount }
              }
            });
          }
        }
      },

      regenerateCasts: () => {
        const { userStats } = get();
        if (userStats.premium) return; // Unlimited for premium

        const now = Date.now();
        // 1 cast every 2 hours (2 * 60 * 60 * 1000 ms)
        const msPerCast = 2 * 60 * 60 * 1000;

        if (userStats.castsRemaining < userStats.maxCasts) {
          const timePassed = now - userStats.lastCastRefill;

          if (timePassed >= msPerCast) {
            const castsRestored = Math.floor(timePassed / msPerCast);
            const remainderTime = timePassed % msPerCast;

            // Don't overflow max casts
            const newCasts = Math.min(userStats.maxCasts, userStats.castsRemaining + castsRestored);

            // Update timestamp to 'now' minus remainder so we don't lose progress on the next cast
            const newLastRefill = now - remainderTime;

            if (castsRestored > 0) {
              set({
                userStats: {
                  ...userStats,
                  castsRemaining: newCasts,
                  lastCastRefill: newLastRefill
                }
              });
            }
          }
        } else {
          // If full, just keep updating the timestamp so logic works when we spend one
          set({ userStats: { ...userStats, lastCastRefill: now } });
        }
      },

      castLine: () => {
        const { userStats, inventory } = get();

        if (userStats.castsRemaining <= 0 && !userStats.premium) {
          triggerHaptic(Haptics.error);
          return;
        }

        // Consume bait
        const baitId = inventory.activeBaitId;
        const currentBaitCount = inventory.baits[baitId] || 0;

        if (baitId !== 'worm' && currentBaitCount <= 0) {
          set(state => ({ inventory: { ...state.inventory, activeBaitId: 'worm' } }));
          return;
        }

        const newBaits = { ...inventory.baits };
        if (baitId !== 'worm') {
          newBaits[baitId] = currentBaitCount - 1;
        }

        set((state) => ({
          phase: GamePhase.CASTING,
          inventory: { ...state.inventory, baits: newBaits },
          userStats: {
            ...state.userStats,
            castsRemaining: state.userStats.premium ? 9999 : state.userStats.castsRemaining - 1
          },
        }));

        // Animation sequence
        setTimeout(() => {
          set({ phase: GamePhase.WAITING });

          const bait = BAITS[get().inventory.activeBaitId];
          // Blueprint: 5-15 seconds random wait
          let waitTime = Math.random() * 10000 + 5000;
          if (bait?.effect === 'Speed') waitTime *= 0.85; // 15% faster (Blueprint)

          setTimeout(() => {
            get().triggerBite();
          }, waitTime);
        }, 3000); // Blueprint: 3 seconds cast animation
      },

      triggerBite: () => {
        const { phase, inventory } = get();
        if (phase !== GamePhase.WAITING) return;

        const bait = BAITS[inventory.activeBaitId];

        // Modifiers logic
        let m_mythic = RARITY_WEIGHTS[Rarity.MYTHIC];       // 1
        let m_leg = RARITY_WEIGHTS[Rarity.LEGENDARY];       // 9
        let m_epic = RARITY_WEIGHTS[Rarity.EPIC];           // 40
        let m_rare = RARITY_WEIGHTS[Rarity.RARE];           // 100

        if (bait?.effect === 'Legendary') m_leg *= 1.5; // +50% (Blueprint)
        if (bait?.effect === 'Epic+') m_epic *= 1.25;   // +25% (Blueprint)
        if (bait?.effect === 'Rare++') m_rare *= 1.15;  // +15% (Blueprint)
        if (bait?.effect === 'Rare+') m_rare *= 1.10;   // +10% (Blueprint)

        const r = Math.random() * 1000;

        let selectedRarity = Rarity.COMMON;

        // Cumulative probability check
        let currentThreshold = 0;
        currentThreshold += m_mythic;
        if (r < currentThreshold) selectedRarity = Rarity.MYTHIC;
        else {
          currentThreshold += m_leg;
          if (r < currentThreshold) selectedRarity = Rarity.LEGENDARY;
          else {
            currentThreshold += m_epic;
            if (r < currentThreshold) selectedRarity = Rarity.EPIC;
            else {
              currentThreshold += m_rare;
              if (r < currentThreshold) selectedRarity = Rarity.RARE;
              else if (r < 350) selectedRarity = Rarity.UNCOMMON; // 350 threshold for UC
              else selectedRarity = Rarity.COMMON;
            }
          }
        }

        // Pick fish of that rarity
        const availableFish = FISH_TYPES.filter(f => f.rarity === selectedRarity);
        const selectedFish = availableFish[Math.floor(Math.random() * availableFish.length)] || FISH_TYPES[0];

        set({
          phase: GamePhase.HOOKED,
          hookedFish: selectedFish,
          hookTime: Date.now()
        });

        triggerHaptic(Haptics.bite);

        // Fail safety timeout
        setTimeout(() => {
          const { phase } = get();
          if (phase === GamePhase.HOOKED) {
            get().failCatch();
          }
        }, (selectedFish.catchWindow * 1000) + 1000);
      },

      attemptCatch: () => {
        const { phase, hookedFish, hookTime, userStats, history } = get();
        if (phase !== GamePhase.HOOKED || !hookedFish) return;

        const reactionTime = (Date.now() - hookTime) / 1000;

        // Rod/Level scaling: Higher level = Slightly wider catch window
        const levelFactor = Math.min(0.5, userStats.level / 100);
        const difficultyModifier = 1 + levelFactor;

        const adjustedWindow = hookedFish.catchWindow * difficultyModifier;

        if (reactionTime <= adjustedWindow) {

          // Check if new catch (not in history)
          const isNew = !history.some(f => f.id === hookedFish.id);

          // Determine Haptic Intensity based on Rarity
          if (hookedFish.rarity === Rarity.MYTHIC || hookedFish.rarity === Rarity.LEGENDARY) {
            triggerHaptic(Haptics.legendaryCatch);
          } else if (hookedFish.rarity === Rarity.EPIC || hookedFish.rarity === Rarity.RARE) {
            triggerHaptic(Haptics.rareCatch);
          } else {
            triggerHaptic(Haptics.success);
          }

          // Check for Level 50 Premium Animation Requirement
          if (userStats.level >= 50 && userStats.premium) {
            set({
              phase: GamePhase.ANIMATING_CATCH,
              lastCatch: hookedFish,
              isNewCatch: isNew,
              history: [hookedFish, ...history],
              hookedFish: null
            });
          } else {
            set({
              phase: GamePhase.REWARD,
              lastCatch: hookedFish,
              isNewCatch: isNew,
              history: [hookedFish, ...history],
              hookedFish: null
            });
          }

        } else {
          get().failCatch();
        }
      },

      // New: Start the reeling mini-game phase
      startReeling: () => {
        const { phase, hookedFish } = get();
        if (phase !== GamePhase.HOOKED || !hookedFish) return;

        triggerHaptic(Haptics.medium);
        set({ phase: GamePhase.REELING });
      },

      // New: Complete the reeling mini-game with success/fail result
      completeReeling: (success: boolean) => {
        const { hookedFish, history, userStats } = get();
        if (!hookedFish) return;

        if (success) {
          const isNew = !history.some(f => f.id === hookedFish.id);

          // Haptic feedback based on rarity
          if (hookedFish.rarity === Rarity.MYTHIC || hookedFish.rarity === Rarity.LEGENDARY) {
            triggerHaptic(Haptics.legendaryCatch);
          } else if (hookedFish.rarity === Rarity.EPIC || hookedFish.rarity === Rarity.RARE) {
            triggerHaptic(Haptics.rareCatch);
          } else {
            triggerHaptic(Haptics.success);
          }

          // Check for Level 50+ Premium Animation
          if (userStats.level >= 50 && userStats.premium) {
            set({
              phase: GamePhase.ANIMATING_CATCH,
              lastCatch: hookedFish,
              isNewCatch: isNew,
              history: [hookedFish, ...history],
              hookedFish: null
            });
          } else {
            set({
              phase: GamePhase.REWARD,
              lastCatch: hookedFish,
              isNewCatch: isNew,
              history: [hookedFish, ...history],
              hookedFish: null
            });
          }
        } else {
          // Failed the mini-game
          triggerHaptic(Haptics.fail);
          set({ phase: GamePhase.IDLE, hookedFish: null });
        }
      },

      finishCatchAnimation: () => {
        triggerHaptic(Haptics.success);
        set({ phase: GamePhase.REWARD });
      },

      failCatch: () => {
        set({ phase: GamePhase.IDLE, hookedFish: null });
        triggerHaptic(Haptics.fail);
      },

      collectReward: () => {
        const { lastCatch, userStats, inventory } = get();
        if (!lastCatch) return;

        // Rod XP Perks
        let rodMultiplier = 1;
        if (userStats.level >= 50) rodMultiplier += 0.5;      // Gold Rod: +50%
        else if (userStats.level >= 20) rodMultiplier += 0.1; // Carbon Rod: +10%
        else if (userStats.level >= 10) rodMultiplier += 0.05;// Fiberglass: +5%

        const baseXp = lastCatch.xp * rodMultiplier;
        const xpGain = Math.floor(userStats.premium ? baseXp * 2 : baseXp);

        const newXp = userStats.xp + xpGain;
        const nextLevelXp = getNextLevelXp(userStats.level + 1);

        let newLevel = userStats.level;
        let leveledUp = false;
        let pendingChestsToAdd = 0;
        let newBaits = { ...inventory.baits };
        let newCasts = userStats.castsRemaining;

        if (newXp >= nextLevelXp) {
          newLevel++;
          leveledUp = true;

          // Prestige Logic: Grant Loot Chest at 60, 70, 80, 90, 100
          if ([60, 70, 80, 90, 100].includes(newLevel)) {
            pendingChestsToAdd = 1;
          }

          confetti({
            particleCount: 150,
            spread: 60,
            origin: { y: 0.7 }
          });
          triggerHaptic(Haptics.levelUp);

          // Level Up Rewards (Blueprint)
          const isPrem = userStats.premium;
          let bonusCasts = 0;
          let rewardBaitId = 'worm';
          let rewardBaitQty = 1;

          if (newLevel <= 9) {
            bonusCasts = isPrem ? 5 : 2;
            rewardBaitId = isPrem ? 'shrimp' : 'worm';
          } else if (newLevel <= 19) {
            bonusCasts = isPrem ? 7 : 3;
            rewardBaitId = isPrem ? 'shrimp' : 'worm';
          } else if (newLevel <= 29) {
            bonusCasts = isPrem ? 10 : 4;
            rewardBaitId = isPrem ? 'lure' : 'shrimp'; // Blueprint says Uncommon for Free
          } else if (newLevel <= 39) {
            bonusCasts = isPrem ? 12 : 5;
            rewardBaitId = isPrem ? 'squid' : 'lure';
          } else if (newLevel <= 49) {
            bonusCasts = isPrem ? 15 : 6;
            rewardBaitId = isPrem ? 'chum' : 'squid';
          } else {
            // Level 50+
            bonusCasts = isPrem ? 20 : 10;
            rewardBaitId = isPrem ? 'kraken_eye' : 'chum';
          }

          // Apply Rewards
          if (!isPrem) {
            newCasts = Math.min(userStats.maxCasts, userStats.castsRemaining + bonusCasts);
          }

          if (rewardBaitId !== 'worm') {
            newBaits[rewardBaitId] = (newBaits[rewardBaitId] || 0) + 1;
          }
        } else {
          triggerHaptic(Haptics.soft);
        }

        const coinsGain = Math.floor(lastCatch.weight * 10);

        set((state) => ({
          phase: GamePhase.IDLE,
          lastCatch: null,
          isNewCatch: false,
          inventory: { ...state.inventory, baits: newBaits },
          userStats: {
            ...state.userStats,
            xp: newXp,
            level: newLevel,
            coins: state.userStats.coins + coinsGain,
            pendingChests: state.userStats.pendingChests + pendingChestsToAdd,
            castsRemaining: newCasts
          }
        }));
      },

      // Loot & Cosmetics Actions
      unlockCosmetic: (cosmeticId: string) => {
        const { inventory } = get();
        if (inventory.unlockedCosmetics.includes(cosmeticId)) {
          return false; // Already owned
        }
        triggerHaptic(Haptics.success);
        set(state => ({
          inventory: {
            ...state.inventory,
            unlockedCosmetics: [...state.inventory.unlockedCosmetics, cosmeticId]
          }
        }));
        return true;
      },

      equipCosmetic: (cosmeticId: string, type: 'title' | 'badge' | 'rod_skin' | 'bobber' | 'trail_effect') => {
        const { inventory } = get();
        if (!inventory.unlockedCosmetics.includes(cosmeticId)) return;

        triggerHaptic(Haptics.soft);
        set(state => {
          const updates: Partial<typeof state.inventory> = {};
          switch (type) {
            case 'title': updates.equippedTitle = cosmeticId; break;
            case 'badge': updates.equippedBadge = cosmeticId; break;
            case 'rod_skin': updates.equippedRodSkin = cosmeticId; break;
            case 'bobber': updates.equippedBobber = cosmeticId; break;
            case 'trail_effect': updates.equippedTrail = cosmeticId; break;
          }
          return { inventory: { ...state.inventory, ...updates } };
        });
      },

      addBonusDrop: (type: 'coins' | 'xp' | 'bait', quantity: number, baitId?: string) => {
        set(state => {
          if (type === 'coins') {
            return { userStats: { ...state.userStats, coins: state.userStats.coins + quantity } };
          } else if (type === 'xp') {
            const newXp = state.userStats.xp + quantity;
            return { userStats: { ...state.userStats, xp: newXp } };
          } else if (type === 'bait' && baitId) {
            const newBaits = { ...state.inventory.baits };
            newBaits[baitId] = (newBaits[baitId] || 0) + quantity;
            return { inventory: { ...state.inventory, baits: newBaits } };
          }
          return {};
        });
      }
    }),
    {
      name: 'seacaster-storage-v1',
      partialize: (state) => ({
        userStats: state.userStats,
        inventory: state.inventory,
        history: state.history
      }),
    }
  )
);