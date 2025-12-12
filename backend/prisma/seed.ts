import { PrismaClient, TournamentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (be careful in production!)
  if (process.env.NODE_ENV === 'development') {
    await prisma.marketplacePurchase.deleteMany();
    await prisma.marketplaceListing.deleteMany();
    await prisma.catch.deleteMany();
    await prisma.tournamentEntry.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.rateLimitEntry.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared existing data');
  }

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        fid: 1,
        username: 'captain_dev',
        xp: 50000,
        level: 35,
        coins: 5000,
        premium: true,
        premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        streak: 15,
        highestStreak: 20,
        castsRemaining: 9999,
        maxCasts: 9999,
        lastLogin: new Date(),
        pendingChests: 2,
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5',
        inventory: {
          create: {
            baits: {
              worm: 999,
              shrimp: 25,
              lure: 15,
              squid: 8,
              chum: 3,
              kraken_eye: 1
            },
            rods: ['bamboo', 'fiberglass', 'carbon', 'gold'],
            premiumParts: {
              handle: true,
              body: true,
              hook: true
            },
            activeBaitId: 'kraken_eye',
            activeRodId: 'carbon'
          }
        }
      }
    }),

    prisma.user.create({
      data: {
        fid: 2,
        username: 'fishmaster_pro',
        xp: 25000,
        level: 25,
        coins: 2500,
        premium: false,
        streak: 7,
        highestStreak: 12,
        castsRemaining: 10,
        maxCasts: 15,
        lastLogin: new Date(),
        pendingChests: 0,
        walletAddress: '0x8F8e8b3C4De6E7c7bBfE5a8e3A2c1d9F4e5b6a7c',
        inventory: {
          create: {
            baits: {
              worm: 999,
              shrimp: 10,
              lure: 5
            },
            rods: ['bamboo', 'fiberglass'],
            premiumParts: {},
            activeBaitId: 'lure',
            activeRodId: 'fiberglass'
          }
        }
      }
    }),

    prisma.user.create({
      data: {
        fid: 3,
        username: 'rookie_angler',
        xp: 1500,
        level: 8,
        coins: 350,
        premium: false,
        streak: 2,
        highestStreak: 3,
        castsRemaining: 5,
        maxCasts: 15,
        lastLogin: new Date(),
        pendingChests: 0,
        inventory: {
          create: {
            baits: {
              worm: 999,
              shrimp: 2
            },
            rods: ['bamboo'],
            premiumParts: {},
            activeBaitId: 'worm',
            activeRodId: 'bamboo'
          }
        }
      }
    })
  ]);

  console.log(`✅ Created ${users.length} test users`);

  // Create active tournaments
  const now = new Date();
  const tournaments = await Promise.all([
    prisma.tournament.create({
      data: {
        type: TournamentType.Daily,
        title: 'Daily Catch Challenge',
        prizePool: 30,
        entryFee: 0.5,
        houseCutPercent: 10,
        maxParticipants: 60,
        currentParticipants: 15,
        status: 'LIVE',
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Started 2 hours ago
        endTime: new Date(now.getTime() + 22 * 60 * 60 * 1000) // Ends in 22 hours
      }
    }),

    prisma.tournament.create({
      data: {
        type: TournamentType.Weekly,
        title: 'Weekly Masters',
        prizePool: 150,
        entryFee: 2,
        houseCutPercent: 10,
        maxParticipants: 75,
        currentParticipants: 35,
        status: 'OPEN',
        startTime: new Date(now.getTime() - 12 * 60 * 60 * 1000), // Started 12 hours ago
        endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000) // Ends in 6 days
      }
    }),

    prisma.tournament.create({
      data: {
        type: TournamentType.Boss,
        title: 'Kraken Boss Battle',
        prizePool: 247.69,
        entryFee: 7.99,
        houseCutPercent: 20,
        maxParticipants: 31,
        currentParticipants: 8,
        status: 'OPEN',
        startTime: now,
        endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Ends in 24 hours
      }
    })
  ]);

  console.log(`✅ Created ${tournaments.length} active tournaments`);

  // Create tournament entries
  const entries = await Promise.all([
    prisma.tournamentEntry.create({
      data: {
        tournamentId: tournaments[0].id,
        userId: users[0].fid,
        score: 125.5,
        rank: 1,
        entryMethod: 'USDC'
      }
    }),
    prisma.tournamentEntry.create({
      data: {
        tournamentId: tournaments[0].id,
        userId: users[1].fid,
        score: 98.3,
        rank: 2,
        entryMethod: 'TICKET'
      }
    }),
    prisma.tournamentEntry.create({
      data: {
        tournamentId: tournaments[0].id,
        userId: users[2].fid,
        score: 45.2,
        rank: 3,
        entryMethod: 'USDC'
      }
    }),
    prisma.tournamentEntry.create({
      data: {
        tournamentId: tournaments[1].id,
        userId: users[1].fid,
        score: 250.8,
        rank: 1,
        entryMethod: 'USDC'
      }
    }),
    prisma.tournamentEntry.create({
      data: {
        tournamentId: tournaments[1].id,
        userId: users[0].fid,
        score: 235.5,
        rank: 2,
        entryMethod: 'USDC'
      }
    })
  ]);

  console.log(`✅ Created ${entries.length} tournament entries`);

  // Create catch history
  const catches = await Promise.all([
    prisma.catch.create({
      data: {
        userId: users[0].fid,
        fishId: 'megalodon',
        fishName: 'Megalodon',
        rarity: 'Legendary',
        weight: 48.5,
        xpGained: 500,
        coinsGained: 485,
        baitUsed: 'kraken_eye',
        reactionTime: 450,
        tournamentId: tournaments[0].id,
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      }
    }),
    prisma.catch.create({
      data: {
        userId: users[1].fid,
        fishId: 'tuna',
        fishName: 'Tuna',
        rarity: 'Rare',
        weight: 5.2,
        xpGained: 50,
        coinsGained: 52,
        baitUsed: 'squid',
        reactionTime: 890,
        tournamentId: tournaments[0].id,
        timestamp: new Date(now.getTime() - 45 * 60 * 1000)
      }
    })
  ]);

  console.log(`✅ Created ${catches.length} catch records`);

  // Create marketplace listings
  const listings = await Promise.all([
    prisma.marketplaceListing.create({
      data: {
        sellerId: users[0].fid,
        itemType: 'BAIT',
        itemId: 'chum',
        quantity: 5,
        priceCoins: 500,
        status: 'ACTIVE',
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    }),
    prisma.marketplaceListing.create({
      data: {
        sellerId: users[1].fid,
        itemType: 'BAIT',
        itemId: 'squid',
        quantity: 3,
        priceCoins: 200,
        status: 'ACTIVE',
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    })
  ]);

  console.log(`✅ Created ${listings.length} marketplace listings`);

  console.log('\n🎉 Database seeding completed!');
  console.log(`\n📊 Summary:`);
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Tournaments: ${tournaments.length}`);
  console.log(`  - Entries: ${entries.length}`);
  console.log(`  - Catches: ${catches.length}`);
  console.log(`  - Listings: ${listings.length}`);
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });