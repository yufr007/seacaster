import express, { Request, Response } from 'express';

const router = express.Router();

// ═══════════════════════════════════════════════════════════
// BUTTON TITLE LIBRARY
// ═══════════════════════════════════════════════════════════

const TITLE_CATEGORIES = {
    morning: [
        "☀️ Rise & Cast",
        "🌅 Early Bird Gets the Fish",
        "☕ Coffee & Catches",
        "🌄 Morning Lines",
        "☀️ Dawn Patrol",
    ],
    afternoon: [
        "🌊 Hook, Line & Crypto",
        "🐟 Get Hooked",
        "🎣 Reel 'Em In",
        "⚓ Drop a Line",
        "🎣 Cast for Cash",
        "💰 Fish for USDC",
        "🐟 Catch & Earn",
        "⚡ Net Some Gains",
    ],
    evening: [
        "🌙 Night Bite",
        "⭐ Midnight Catch",
        "🌃 Late Night Lines",
        "🌙 Moonlight Fishing",
        "🌆 Sunset Session",
    ],
    weekend: [
        "🎉 Weekend Warrior",
        "🏆 Tournament Time",
        "💎 Big Fish Energy",
        "🥇 Weekend Grind",
        "🎯 Saturday Catches",
    ],
    pirate: [
        "🏴‍☠️ Catch the Loot",
        "⚓ Plunder the Seas",
        "🗺️ Hunt for Treasure",
        "☠️ Hoist the Rod",
        "🏴‍☠️ Sail & Scale",
    ],
    playful: [
        "🐟 Something's Fishy",
        "🎣 Catch of the Day",
        "🌊 Seas the Day",
        "🐟 Holy Mackerel!",
        "🎣 One More Cast",
        "🐟 Fish Happens",
        "🎣 Bait & Wait",
    ],
};

// ═══════════════════════════════════════════════════════════
// HELPER: GET CONTEXTUAL TITLE
// ═══════════════════════════════════════════════════════════

function getContextualTitle(): string {
    const hour = new Date().getHours();
    const day = new Date().getDay();

    let titles = TITLE_CATEGORIES.afternoon; // default

    // Time-based selection
    if (hour >= 5 && hour < 12) {
        titles = TITLE_CATEGORIES.morning;
    } else if (hour >= 18 || hour < 5) {
        titles = TITLE_CATEGORIES.evening;
    }

    // Weekend override
    if (day === 0 || day === 6) {
        titles = TITLE_CATEGORIES.weekend;
    }

    // 20% chance to show pirate theme (Season 1)
    if (Math.random() < 0.2) {
        titles = TITLE_CATEGORIES.pirate;
    }

    // 10% chance to show playful
    if (Math.random() < 0.1) {
        titles = TITLE_CATEGORIES.playful;
    }

    return titles[Math.floor(Math.random() * titles.length)];
}

// ═══════════════════════════════════════════════════════════
// ROUTE: /.well-known/farcaster.json
// ═══════════════════════════════════════════════════════════

router.get('/.well-known/farcaster.json', (req: Request, res: Response) => {
    const randomTitle = getContextualTitle();

    const manifest = {
        accountAssociation: {
            header: process.env.FARCASTER_HEADER || "",
            payload: process.env.FARCASTER_PAYLOAD || "",
            signature: process.env.FARCASTER_SIGNATURE || "",
        },
        frame: {
            version: "1",
            name: "SeaCaster",
            iconUrl: `${process.env.APP_URL || 'https://seacaster.app'}/icon-200x200.png`,
            homeUrl: process.env.APP_URL || 'https://seacaster.app',
            imageUrl: `${process.env.APP_URL || 'https://seacaster.app'}/og-1200x800.png`,
            buttonTitle: randomTitle,
            splashImageUrl: `${process.env.APP_URL || 'https://seacaster.app'}/splash-200x200.png`,
            splashBackgroundColor: "#0A3A52",
            webhookUrl: `${process.env.API_URL || 'https://api.seacaster.app'}/webhook`,
        },
        baseBuilderAddress: process.env.DEPLOYER_ADDRESS || "0xa98b74fa85C3cD4c3E214beBac8E4511A964c1f0",
        contractAddresses: {
            seasonPass: process.env.SEACASTER_PASS_ADDRESS || "0x1EBa3dDA0AFd1c20A61627730439249752180432",
            tournamentPool: process.env.TOURNAMENT_ESCROW_ADDRESS || "0x8Dc5bEdC24315F9f18111843FCA7Ecf86Af73013",
            marketplace: process.env.MARKETPLACE_ADDRESS || "0xd4D0dcfe3424A7F55f850767f9A5B85f083F38E1",
        },
    };

    // CORS headers for Farcaster
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // No caching - ensure fresh titles
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(manifest);

    console.log(`[Manifest] Served title: "${randomTitle}" at ${new Date().toISOString()}`);
});

export default router;
