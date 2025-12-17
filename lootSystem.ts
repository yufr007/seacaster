// ============================================
// LOOT DROP SYSTEM - RNG Tables & Rewards
// ============================================

import { Rarity } from './types';

// ============================================
// COSMETIC ITEMS
// ============================================
export interface CosmeticItem {
    id: string;
    name: string;
    type: 'title' | 'badge' | 'rod_skin' | 'bobber' | 'trail_effect';
    rarity: Rarity;
    description: string;
    image: string;
    dropRate: number; // Out of 10000 (0.01% precision)
}

export const COSMETIC_ITEMS: CosmeticItem[] = [
    // Titles (display next to username)
    { id: 'title_fisher', name: 'Fisher', type: 'title', rarity: Rarity.COMMON, description: 'Caught 10 fish', image: '', dropRate: 0 }, // Achievement unlock
    { id: 'title_angler', name: 'Angler', type: 'title', rarity: Rarity.UNCOMMON, description: 'Caught 50 fish', image: '', dropRate: 0 },
    { id: 'title_captain', name: 'Captain', type: 'title', rarity: Rarity.RARE, description: 'Reached level 25', image: '', dropRate: 0 },
    { id: 'title_legend', name: 'Legend of the Deep', type: 'title', rarity: Rarity.LEGENDARY, description: 'Caught a Mythic fish', image: '', dropRate: 0 },
    { id: 'title_pirate_king', name: 'Pirate King', type: 'title', rarity: Rarity.MYTHIC, description: 'Reached level 100', image: '', dropRate: 0 },

    // Badges (profile display)
    { id: 'badge_rookie', name: 'Rookie Badge', type: 'badge', rarity: Rarity.COMMON, description: 'First steps', image: '/assets/badges/badge_rookie.png', dropRate: 500 },
    { id: 'badge_splash', name: 'Splash Master', type: 'badge', rarity: Rarity.UNCOMMON, description: 'Made waves', image: '/assets/badges/badge_splash.png', dropRate: 300 },
    { id: 'badge_storm', name: 'Storm Chaser', type: 'badge', rarity: Rarity.RARE, description: 'Weather any storm', image: '/assets/badges/badge_storm.png', dropRate: 100 },
    { id: 'badge_kraken', name: 'Kraken Slayer', type: 'badge', rarity: Rarity.EPIC, description: 'Defeated the beast', image: '/assets/badges/badge_kraken.png', dropRate: 40 },
    { id: 'badge_leviathan', name: 'Leviathan Hunter', type: 'badge', rarity: Rarity.LEGENDARY, description: 'Conquered the deep', image: '/assets/badges/badge_leviathan.png', dropRate: 10 },

    // Rod Skins
    { id: 'rod_bamboo', name: 'Bamboo Classic', type: 'rod_skin', rarity: Rarity.COMMON, description: 'Simple but reliable', image: '/assets/rods/rod_bamboo.png', dropRate: 400 },
    { id: 'rod_carbon', name: 'Carbon Fiber', type: 'rod_skin', rarity: Rarity.UNCOMMON, description: 'Lightweight and strong', image: '/assets/rods/rod_carbon.png', dropRate: 250 },
    { id: 'rod_coral', name: 'Coral Reef', type: 'rod_skin', rarity: Rarity.RARE, description: 'Made from ocean treasures', image: '/assets/rods/rod_coral.png', dropRate: 80 },
    { id: 'rod_golden', name: 'Golden Treasure', type: 'rod_skin', rarity: Rarity.EPIC, description: 'Fit for royalty', image: '/assets/rods/rod_golden.png', dropRate: 25 },
    { id: 'rod_ghostship', name: 'Ghost Ship', type: 'rod_skin', rarity: Rarity.LEGENDARY, description: 'From the Flying Dutchman', image: '/assets/rods/rod_ghostship.png', dropRate: 5 },
    { id: 'rod_kraken', name: 'Kraken Tentacle', type: 'rod_skin', rarity: Rarity.MYTHIC, description: 'Still alive...', image: '/assets/rods/rod_kraken.png', dropRate: 1 },

    // Bobber Styles
    { id: 'bobber_classic', name: 'Classic Red', type: 'bobber', rarity: Rarity.COMMON, description: 'Traditional bobber', image: '/assets/bobbers/bobber_red.png', dropRate: 600 },
    { id: 'bobber_skull', name: 'Skull Float', type: 'bobber', rarity: Rarity.UNCOMMON, description: 'Spooky vibes', image: '/assets/bobbers/bobber_skull.png', dropRate: 300 },
    { id: 'bobber_gem', name: 'Gem Bobber', type: 'bobber', rarity: Rarity.RARE, description: 'Sparkles in water', image: '/assets/bobbers/bobber_gem.png', dropRate: 100 },
    { id: 'bobber_flame', name: 'Flame Float', type: 'bobber', rarity: Rarity.EPIC, description: 'Burns on water', image: '/assets/bobbers/bobber_flame.png', dropRate: 30 },
    { id: 'bobber_rainbow', name: 'Rainbow Orb', type: 'bobber', rarity: Rarity.LEGENDARY, description: 'Colors of the sea', image: '/assets/bobbers/bobber_rainbow.png', dropRate: 8 },

    // Trail Effects (line animation)
    { id: 'trail_bubbles', name: 'Bubble Trail', type: 'trail_effect', rarity: Rarity.UNCOMMON, description: 'Leave bubbles behind', image: '/assets/trails/trail_bubbles.png', dropRate: 250 },
    { id: 'trail_sparkle', name: 'Sparkle Trail', type: 'trail_effect', rarity: Rarity.RARE, description: 'Magical shimmer', image: '/assets/trails/trail_sparkle.png', dropRate: 100 },
    { id: 'trail_fire', name: 'Fire Trail', type: 'trail_effect', rarity: Rarity.EPIC, description: 'Hot pursuit', image: '/assets/trails/trail_fire.png', dropRate: 40 },
    { id: 'trail_lightning', name: 'Lightning Trail', type: 'trail_effect', rarity: Rarity.LEGENDARY, description: 'Electric speed', image: '/assets/trails/trail_lightning.png', dropRate: 10 },
    { id: 'trail_void', name: 'Void Trail', type: 'trail_effect', rarity: Rarity.MYTHIC, description: 'From another dimension', image: '/assets/trails/trail_void.png', dropRate: 2 },
];

// ============================================
// LOOT TABLES
// ============================================
export interface LootDrop {
    type: 'coins' | 'xp' | 'bait' | 'cosmetic' | 'ticket' | 'nothing';
    id?: string;
    quantity: number;
    rarity?: Rarity;
}

export interface LootTable {
    id: string;
    name: string;
    drops: {
        weight: number; // Out of 10000
        reward: Omit<LootDrop, 'rarity'> & { rarityPool?: Rarity[] };
    }[];
}

// Post-catch bonus drop table
export const CATCH_BONUS_LOOT: LootTable = {
    id: 'catch_bonus',
    name: 'Catch Bonus',
    drops: [
        { weight: 7000, reward: { type: 'nothing', quantity: 0 } }, // 70% nothing extra
        { weight: 1500, reward: { type: 'coins', quantity: 50 } }, // 15% bonus coins
        { weight: 800, reward: { type: 'xp', quantity: 25 } }, // 8% bonus XP
        { weight: 400, reward: { type: 'bait', id: 'shrimp', quantity: 1 } }, // 4% shrimp
        { weight: 200, reward: { type: 'bait', id: 'squid', quantity: 1 } }, // 2% squid
        { weight: 80, reward: { type: 'bait', id: 'chum', quantity: 1 } }, // 0.8% chum
        { weight: 20, reward: { type: 'cosmetic', quantity: 1, rarityPool: [Rarity.COMMON, Rarity.UNCOMMON] } }, // 0.2% cosmetic
    ],
};

// Daily streak chest loot table
export const STREAK_CHEST_LOOT: LootTable = {
    id: 'streak_chest',
    name: 'Streak Chest',
    drops: [
        { weight: 3000, reward: { type: 'coins', quantity: 200 } },
        { weight: 2500, reward: { type: 'xp', quantity: 100 } },
        { weight: 2000, reward: { type: 'bait', id: 'squid', quantity: 3 } },
        { weight: 1500, reward: { type: 'bait', id: 'chum', quantity: 2 } },
        { weight: 700, reward: { type: 'cosmetic', quantity: 1, rarityPool: [Rarity.UNCOMMON, Rarity.RARE] } },
        { weight: 200, reward: { type: 'bait', id: 'kraken_eye', quantity: 1 } },
        { weight: 100, reward: { type: 'cosmetic', quantity: 1, rarityPool: [Rarity.EPIC, Rarity.LEGENDARY] } },
    ],
};

// Premium chest loot table (Day 7 premium / Level 50+ prestige)
export const PREMIUM_CHEST_LOOT: LootTable = {
    id: 'premium_chest',
    name: 'Premium Chest',
    drops: [
        { weight: 2500, reward: { type: 'coins', quantity: 500 } },
        { weight: 2000, reward: { type: 'xp', quantity: 200 } },
        { weight: 1500, reward: { type: 'bait', id: 'chum', quantity: 5 } },
        { weight: 1500, reward: { type: 'bait', id: 'kraken_eye', quantity: 2 } },
        { weight: 1500, reward: { type: 'cosmetic', quantity: 1, rarityPool: [Rarity.RARE, Rarity.EPIC] } },
        { weight: 800, reward: { type: 'cosmetic', quantity: 1, rarityPool: [Rarity.LEGENDARY] } },
        { weight: 150, reward: { type: 'cosmetic', quantity: 1, rarityPool: [Rarity.MYTHIC] } },
        { weight: 50, reward: { type: 'ticket', id: 'boss', quantity: 1 } },
    ],
};

// Prestige chest (level 60, 70, 80, 90, 100)
export const PRESTIGE_CHEST_LOOT: LootTable = {
    id: 'prestige_chest',
    name: 'Prestige Chest',
    drops: [
        { weight: 2000, reward: { type: 'coins', quantity: 1000 } },
        { weight: 1500, reward: { type: 'xp', quantity: 300 } },
        { weight: 1500, reward: { type: 'bait', id: 'kraken_eye', quantity: 5 } },
        { weight: 2000, reward: { type: 'cosmetic', quantity: 1, rarityPool: [Rarity.EPIC, Rarity.LEGENDARY] } },
        { weight: 2000, reward: { type: 'cosmetic', quantity: 1, rarityPool: [Rarity.LEGENDARY, Rarity.MYTHIC] } },
        { weight: 800, reward: { type: 'ticket', id: 'boss', quantity: 1 } },
        { weight: 200, reward: { type: 'ticket', id: 'championship', quantity: 1 } },
    ],
};

// ============================================
// LOOT FUNCTIONS
// ============================================

/**
 * Roll a random drop from a loot table
 */
export function rollLootTable(table: LootTable): LootDrop {
    const totalWeight = table.drops.reduce((sum, d) => sum + d.weight, 0);
    let roll = Math.floor(Math.random() * totalWeight);

    for (const drop of table.drops) {
        roll -= drop.weight;
        if (roll < 0) {
            const result: LootDrop = {
                type: drop.reward.type,
                id: drop.reward.id,
                quantity: drop.reward.quantity,
            };

            // If it's a cosmetic drop, pick a random cosmetic from the rarity pool
            if (result.type === 'cosmetic' && drop.reward.rarityPool) {
                const cosmetic = rollCosmeticFromPool(drop.reward.rarityPool);
                if (cosmetic) {
                    result.id = cosmetic.id;
                    result.rarity = cosmetic.rarity;
                }
            }

            return result;
        }
    }

    return { type: 'nothing', quantity: 0 };
}

/**
 * Roll a random cosmetic from a rarity pool
 */
export function rollCosmeticFromPool(rarities: Rarity[]): CosmeticItem | null {
    const eligibleItems = COSMETIC_ITEMS.filter(
        (item) => rarities.includes(item.rarity) && item.dropRate > 0
    );

    if (eligibleItems.length === 0) return null;

    const totalWeight = eligibleItems.reduce((sum, item) => sum + item.dropRate, 0);
    let roll = Math.floor(Math.random() * totalWeight);

    for (const item of eligibleItems) {
        roll -= item.dropRate;
        if (roll < 0) return item;
    }

    return eligibleItems[0];
}

/**
 * Check for bonus drop after a catch
 */
export function rollCatchBonus(fishRarity: Rarity): LootDrop {
    // Higher rarity fish have better bonus drop chances
    const rarityMultiplier = {
        [Rarity.COMMON]: 1,
        [Rarity.UNCOMMON]: 1.2,
        [Rarity.RARE]: 1.5,
        [Rarity.EPIC]: 2,
        [Rarity.LEGENDARY]: 3,
        [Rarity.MYTHIC]: 5,
    };

    const drop = rollLootTable(CATCH_BONUS_LOOT);

    // Multiply quantity by rarity bonus
    if (drop.type !== 'nothing' && drop.type !== 'cosmetic') {
        drop.quantity = Math.floor(drop.quantity * rarityMultiplier[fishRarity]);
    }

    return drop;
}

/**
 * Open a chest and get multiple drops
 */
export function openChestLoot(chestType: 'streak' | 'premium' | 'prestige', rolls: number = 3): LootDrop[] {
    const table = chestType === 'streak'
        ? STREAK_CHEST_LOOT
        : chestType === 'premium'
            ? PREMIUM_CHEST_LOOT
            : PRESTIGE_CHEST_LOOT;

    const drops: LootDrop[] = [];
    for (let i = 0; i < rolls; i++) {
        const drop = rollLootTable(table);
        if (drop.type !== 'nothing') {
            drops.push(drop);
        }
    }

    // Guarantee at least one drop
    if (drops.length === 0) {
        drops.push({ type: 'coins', quantity: 100 });
    }

    return drops;
}

// ============================================
// RARITY COLORS & EFFECTS
// ============================================
export const RARITY_GLOW_COLORS = {
    [Rarity.COMMON]: '#9CA3AF',     // Gray
    [Rarity.UNCOMMON]: '#10B981',   // Green
    [Rarity.RARE]: '#3B82F6',       // Blue
    [Rarity.EPIC]: '#8B5CF6',       // Purple
    [Rarity.LEGENDARY]: '#F59E0B',  // Gold
    [Rarity.MYTHIC]: '#EC4899',     // Pink/Rainbow
};

export const RARITY_PARTICLE_COUNT = {
    [Rarity.COMMON]: 5,
    [Rarity.UNCOMMON]: 10,
    [Rarity.RARE]: 15,
    [Rarity.EPIC]: 25,
    [Rarity.LEGENDARY]: 40,
    [Rarity.MYTHIC]: 60,
};
