// config/assets.ts
// Centralized asset path configuration for SeaCaster
// All game assets should reference paths from here

// ════════════════════════════════════════════════════════════════════════════
// BAIT ASSETS
// ════════════════════════════════════════════════════════════════════════════
export const BAIT_ASSETS = {
    worm: '/assets/bait/bait_worm_v2.png',
    shrimp: '/assets/bait/bait_shrimp_1765863173083.png',
    squid: '/assets/bait/bait_squid_1765863189969.png',
    minnow: '/assets/bait/bait_minnow_1765863236305.png',
    lure: '/assets/bait/bait_minnow_1765863236305.png', // Alias for minnow
    crab: '/assets/bait/bait_crab_1765863219000.png',
    chum: '/assets/bait/bait_legendary_chum_1765863253233.png',
    kraken_eye: '/assets/bait/bait_kraken_eye.png.jpg',
} as const;

export function getBaitAsset(baitId: string): string {
    return BAIT_ASSETS[baitId as keyof typeof BAIT_ASSETS] || BAIT_ASSETS.worm;
}

// ════════════════════════════════════════════════════════════════════════════
// FISH ASSETS
// ════════════════════════════════════════════════════════════════════════════
export const FISH_ASSETS = {
    // Common
    sardine: '/assets/fish/sardine.png',
    mackerel: '/assets/fish/mackerel.png',
    seabass: '/assets/fish/seabass.png',
    // Uncommon
    snapper: '/assets/fish/snapper.png',
    grouper: '/assets/fish/grouper.png',
    cod: '/assets/fish/cod.png',
    // Rare
    tuna: '/assets/fish/tuna.png',
    mahi: '/assets/fish/mahi.png',
    swordfish: '/assets/fish/swordfish.png',
    // Epic
    marlin: '/assets/fish/marlin.png',
    sailfish: '/assets/fish/sailfish.png',
    bluefin: '/assets/fish/bluefin.png',
    // Legendary
    megalodon: '/assets/fish/megalodon.png',
    kraken: '/assets/fish/kraken.png',
    // Mythic
    leviathan: '/assets/fish/leviathan.png',
} as const;

export function getFishAsset(fishId: string): string {
    const normalizedId = fishId.toLowerCase().replace(/[^a-z]/g, '');
    return FISH_ASSETS[normalizedId as keyof typeof FISH_ASSETS] || '/assets/fish/sardine.png';
}

// ════════════════════════════════════════════════════════════════════════════
// UI ASSETS
// ════════════════════════════════════════════════════════════════════════════
export const UI_ASSETS = {
    // Buttons
    buttonCast: '/assets/ui/ui_button_cast_1765959254593.png',
    buttonCastGreen: '/assets/ui/button_cast_green_1765863050201.png',
    buttonActionBlue: '/assets/ui/button_action_blue_1765863069560.png',
    buttonDangerRed: '/assets/ui/button_danger_red_1765863089212.png',
    buttonPremiumGold: '/assets/ui/button_premium_gold_1765863105533.png',
    buttonShop: '/assets/ui/ui_button_shop_1765959396654.png',
    // Icons
    energyBolt: '/assets/ui/energy_bolt_v2.png',
    dailyGift: '/assets/ui/daily_gift_v3.png',
    tournamentTrophy: '/assets/ui/trophy_gold_v2.png',
    coinDoubloon: '/assets/ui/gold_coin_v2.png',
    treasureChest: '/assets/ui/treasure_chest_v2.png',
    baitBox: '/assets/ui/bait_box.png',
    // Misc
    fishingRod: '/assets/ui/fishing_rod_v4.png',
    goldenPirateRod: '/assets/ui/golden_pirate_rod_1765863136497.png',
    pirateCaptain: '/assets/ui/pirate_captain_v3.png',
    shopBag: '/assets/ui/shop_bag_v2.png',
    tournamentBanner: '/assets/ui/tournament_banner_1765863356617.png',
    oceanBg: '/assets/ui/ocean_bg.png',
    // Rod parts
    rodComplete: '/assets/ui/rod_complete.png.jpg',
    rodHandle: '/assets/ui/rod_handle.png.jpg',
    rodShaft: '/assets/ui/rod_shaft.png.jpg',
    rodReel: '/assets/ui/rod_reel.png.jpg',
    rodHook: '/assets/ui/rod_hook.png.jpg',
} as const;

// ════════════════════════════════════════════════════════════════════════════
// BACKGROUND ASSETS
// ════════════════════════════════════════════════════════════════════════════
export const BACKGROUNDS = {
    ocean: '/assets/ui/ocean_bg.png',
    menuBg: '/assets/backgrounds/menu_bg.jpg',
    underwaterFishing: '/assets/backgrounds/underwater_fishing.png',
    loadingUnderwater: '/assets/backgrounds/loading_underwater.jpg',
    splashHero: '/assets/backgrounds/splash_hero.jpg',
    bossKraken: '/assets/backgrounds/boss_kraken.jpg',
    tournamentBanner: '/assets/backgrounds/tournament_banner.jpg',
} as const;

// ════════════════════════════════════════════════════════════════════════════
// BADGE ASSETS
// ════════════════════════════════════════════════════════════════════════════
export const BADGES = {
    gold: '/assets/badges/leaderboard_badge_gold_1765863298734.png',
    silver: '/assets/badges/leaderboard_badge_silver_1765863318657.png',
    bronze: '/assets/badges/leaderboard_badge_bronze_1765863334872.png',
} as const;

export function getRankBadge(rank: number): string {
    if (rank === 1) return BADGES.gold;
    if (rank === 2) return BADGES.silver;
    if (rank === 3) return BADGES.bronze;
    return '';
}

// ════════════════════════════════════════════════════════════════════════════
// BRAND ASSETS (for manifest, social, etc.)
// ════════════════════════════════════════════════════════════════════════════
export const BRAND_ASSETS = {
    icon200: '/icon-200x200.png',
    og1200: '/og-1200x800.png',
    splash200: '/splash-200x200.png',
    textLogo: '/seacaster-text-logo.png',
    fishLogo: '/seacaster-logo-fish.png',
} as const;

// Helper to get any asset with fallback
export function getAsset(category: 'bait' | 'fish' | 'ui', id: string): string {
    switch (category) {
        case 'bait':
            return getBaitAsset(id);
        case 'fish':
            return getFishAsset(id);
        case 'ui':
            return UI_ASSETS[id as keyof typeof UI_ASSETS] || '/assets/ui/fishing_rod.png';
        default:
            return '/assets/ui/fishing_rod.png';
    }
}
