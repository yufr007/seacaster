import { Rarity } from './types';

/**
 * Bait Crafting System
 * - Combine 2 base baits to create special baits
 * - Each crafted bait has unique effects
 * - Legendary baits only from bosses/events
 */

export interface BaitRecipe {
    id: string;
    name: string;
    ingredients: [string, string]; // Two bait IDs
    result: {
        baitId: string;
        quantity: number;
    };
    description: string;
    rarity: Rarity;
    unlockLevel: number;
}

export interface CraftedBait {
    id: string;
    name: string;
    rarity: Rarity;
    effect: string;
    bonusType: 'speed' | 'rarity' | 'xp' | 'coins' | 'special';
    bonusValue: number;
    icon: string;
    description: string;
    durability: number; // Uses before consumed
}

// Base baits that can be combined
export const BASE_BAITS = ['worm', 'shrimp', 'squid', 'lure'];

// Crafted bait definitions
export const CRAFTED_BAITS: Record<string, CraftedBait> = {
    'surf_worm': {
        id: 'surf_worm',
        name: 'Surf Worm',
        rarity: Rarity.UNCOMMON,
        effect: '+20% coastal fish chance',
        bonusType: 'rarity',
        bonusValue: 1.2,
        icon: '/assets/bait/bait_worm_1765863155303.png',
        description: 'Wriggling bait that attracts shore fish.',
        durability: 5,
    },
    'ink_cloud': {
        id: 'ink_cloud',
        name: 'Ink Cloud',
        rarity: Rarity.RARE,
        effect: '+25% Epic+ fish chance',
        bonusType: 'rarity',
        bonusValue: 1.25,
        icon: '/assets/bait/bait_squid_1765863189969.png',
        description: 'Creates an irresistible ink trail.',
        durability: 4,
    },
    'glow_bait': {
        id: 'glow_bait',
        name: 'Glow Bait',
        rarity: Rarity.RARE,
        effect: '+30% night fishing bonus',
        bonusType: 'special',
        bonusValue: 1.3,
        icon: '/assets/bait/bait_shrimp_1765863173083.png',
        description: 'Bioluminescent bait for deep waters.',
        durability: 4,
    },
    'speed_lure': {
        id: 'speed_lure',
        name: 'Speed Lure',
        rarity: Rarity.UNCOMMON,
        effect: '-25% wait time',
        bonusType: 'speed',
        bonusValue: 0.75,
        icon: '/assets/bait/bait_minnow_1765863236305.png',
        description: 'Fish bite faster with this flashy lure.',
        durability: 5,
    },
    'golden_chum': {
        id: 'golden_chum',
        name: 'Golden Chum',
        rarity: Rarity.EPIC,
        effect: '+50% coin drops',
        bonusType: 'coins',
        bonusValue: 1.5,
        icon: '/assets/bait/bait_legendary_chum_1765863253233.png',
        description: 'Attracts fish carrying treasure.',
        durability: 3,
    },
    'xp_feast': {
        id: 'xp_feast',
        name: 'XP Feast',
        rarity: Rarity.EPIC,
        effect: '+75% XP gain',
        bonusType: 'xp',
        bonusValue: 1.75,
        icon: '/assets/bait/bait_crab_1765863219000.png',
        description: 'Perfect for leveling up fast.',
        durability: 3,
    },
    'kraken_lure': {
        id: 'kraken_lure',
        name: 'Kraken Lure',
        rarity: Rarity.LEGENDARY,
        effect: '+100% Legendary chance',
        bonusType: 'rarity',
        bonusValue: 2.0,
        icon: '/assets/bait/bait_kraken_eye.png.jpg',
        description: 'The legendary hunters bait.',
        durability: 2,
    },
};

// Recipe definitions
export const BAIT_RECIPES: BaitRecipe[] = [
    {
        id: 'recipe_surf_worm',
        name: 'Surf Worm',
        ingredients: ['worm', 'shrimp'],
        result: { baitId: 'surf_worm', quantity: 2 },
        description: 'Combine worm and shrimp for coastal fishing',
        rarity: Rarity.UNCOMMON,
        unlockLevel: 5,
    },
    {
        id: 'recipe_ink_cloud',
        name: 'Ink Cloud',
        ingredients: ['squid', 'squid'],
        result: { baitId: 'ink_cloud', quantity: 1 },
        description: 'Double squid creates powerful ink bait',
        rarity: Rarity.RARE,
        unlockLevel: 10,
    },
    {
        id: 'recipe_glow_bait',
        name: 'Glow Bait',
        ingredients: ['shrimp', 'squid'],
        result: { baitId: 'glow_bait', quantity: 2 },
        description: 'Bioluminescent combination',
        rarity: Rarity.RARE,
        unlockLevel: 15,
    },
    {
        id: 'recipe_speed_lure',
        name: 'Speed Lure',
        ingredients: ['lure', 'shrimp'],
        result: { baitId: 'speed_lure', quantity: 2 },
        description: 'Fast-acting lure combination',
        rarity: Rarity.UNCOMMON,
        unlockLevel: 8,
    },
    {
        id: 'recipe_golden_chum',
        name: 'Golden Chum',
        ingredients: ['lure', 'squid'],
        result: { baitId: 'golden_chum', quantity: 1 },
        description: 'Attracts treasure-carrying fish',
        rarity: Rarity.EPIC,
        unlockLevel: 20,
    },
    {
        id: 'recipe_xp_feast',
        name: 'XP Feast',
        ingredients: ['worm', 'squid'],
        result: { baitId: 'xp_feast', quantity: 1 },
        description: 'Perfect for power leveling',
        rarity: Rarity.EPIC,
        unlockLevel: 25,
    },
    {
        id: 'recipe_kraken_lure',
        name: 'Kraken Lure',
        ingredients: ['squid', 'lure'],
        result: { baitId: 'kraken_lure', quantity: 1 },
        description: 'Ultimate legendary hunter bait',
        rarity: Rarity.LEGENDARY,
        unlockLevel: 40,
    },
];

/**
 * Find available recipes based on player inventory
 */
export function getAvailableRecipes(
    inventory: Record<string, number>,
    playerLevel: number
): BaitRecipe[] {
    return BAIT_RECIPES.filter((recipe) => {
        // Check level requirement
        if (playerLevel < recipe.unlockLevel) return false;

        // Check ingredient availability
        const [ing1, ing2] = recipe.ingredients;
        const count1 = inventory[ing1] || 0;
        const count2 = inventory[ing2] || 0;

        // Same ingredient needs 2, different needs 1 each
        if (ing1 === ing2) {
            return count1 >= 2;
        }
        return count1 >= 1 && count2 >= 1;
    });
}

/**
 * Craft a bait from recipe
 */
export function craftBait(
    recipe: BaitRecipe,
    inventory: Record<string, number>
): { success: boolean; newInventory: Record<string, number>; message: string } {
    const [ing1, ing2] = recipe.ingredients;
    const newInventory = { ...inventory };

    // Remove ingredients
    if (ing1 === ing2) {
        if ((newInventory[ing1] || 0) < 2) {
            return { success: false, newInventory: inventory, message: 'Not enough ingredients' };
        }
        newInventory[ing1] = (newInventory[ing1] || 0) - 2;
    } else {
        if ((newInventory[ing1] || 0) < 1 || (newInventory[ing2] || 0) < 1) {
            return { success: false, newInventory: inventory, message: 'Not enough ingredients' };
        }
        newInventory[ing1] = (newInventory[ing1] || 0) - 1;
        newInventory[ing2] = (newInventory[ing2] || 0) - 1;
    }

    // Add result
    const resultId = recipe.result.baitId;
    newInventory[resultId] = (newInventory[resultId] || 0) + recipe.result.quantity;

    return {
        success: true,
        newInventory,
        message: `Crafted ${recipe.result.quantity}x ${recipe.name}!`,
    };
}

/**
 * Get rarity color for UI display
 */
export function getBaitRarityColor(rarity: Rarity): string {
    const colors = {
        [Rarity.COMMON]: '#9CA3AF',
        [Rarity.UNCOMMON]: '#10B981',
        [Rarity.RARE]: '#3B82F6',
        [Rarity.EPIC]: '#8B5CF6',
        [Rarity.LEGENDARY]: '#F59E0B',
        [Rarity.MYTHIC]: '#EC4899',
    };
    return colors[rarity] || '#9CA3AF';
}
