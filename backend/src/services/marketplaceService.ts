import { MarketplaceListing, MarketplacePurchase } from '@prisma/client';
import { getPrisma, isMockMode } from '../utils/db';

const MARKETPLACE_FEE_PERCENT = 0.10; // 10% fee

export const marketplaceService = {
  /**
   * Create a new marketplace listing
   */
  async createListing(
    sellerId: number,
    input: {
      itemType: 'BAIT' | 'ROD' | 'TICKET' | 'LOOT' | 'FISH';
      itemId: string;
      quantity: number;
      priceCoins: number;
    }
  ): Promise<MarketplaceListing> {
    const prisma = getPrisma();
    if (!prisma) {
      throw new Error('Database not configured for marketplace operations');
    }

    // 1. Verify seller has the item in inventory
    const seller = await prisma.user.findUnique({
      where: { fid: sellerId },
      include: { inventory: true }
    });

    if (!seller || !seller.inventory) {
      throw new Error('Seller not found');
    }

    // 2. Verify premium status for selling (only premium can sell)
    if (!seller.premium) {
      throw new Error('Premium subscription required to sell on marketplace');
    }

    // 3. Verify item ownership
    if (input.itemType === 'BAIT') {
      const baits = seller.inventory.baits as any;
      const available = baits[input.itemId] || 0;

      if (available < input.quantity) {
        throw new Error('Insufficient bait quantity');
      }

      // Reserve the bait (remove from inventory)
      baits[input.itemId] = available - input.quantity;
      await prisma.inventory.update({
        where: { userId: sellerId },
        data: { baits }
      });
    } else if (input.itemType === 'ROD') {
      const rods = seller.inventory.rods as string[];
      if (!rods.includes(input.itemId)) {
        throw new Error('Rod not owned');
      }

      // Check if rod is soulbound (premium parts cannot be sold)
      const premiumParts = seller.inventory.premiumParts as any;
      if (premiumParts[input.itemId]) {
        throw new Error('Soulbound items cannot be sold');
      }

      // Remove from inventory
      const updatedRods = rods.filter(r => r !== input.itemId);
      await prisma.inventory.update({
        where: { userId: sellerId },
        data: { rods: updatedRods }
      });
    }

    // 4. Create listing with 7-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId,
        itemType: input.itemType,
        itemId: input.itemId,
        quantity: input.quantity,
        priceCoins: input.priceCoins,
        status: 'ACTIVE',
        expiresAt
      },
      include: { seller: true }
    });

    console.log(`[Marketplace] Created listing ${listing.id} by user ${sellerId}`);

    return listing;
  },

  /**
   * Purchase a marketplace listing
   */
  async buyListing(listingId: string, buyerId: number): Promise<MarketplacePurchase> {
    const prisma = getPrisma();
    if (!prisma) {
      throw new Error('Database not configured for marketplace operations');
    }

    // 1. Get listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: { seller: true }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'ACTIVE') {
      throw new Error('Listing is not available');
    }

    if (listing.sellerId === buyerId) {
      throw new Error('Cannot buy your own listing');
    }

    // 2. Check expiration
    if (new Date() > listing.expiresAt) {
      await prisma.marketplaceListing.update({
        where: { id: listingId },
        data: { status: 'EXPIRED' }
      });
      throw new Error('Listing has expired');
    }

    // 3. Get buyer and verify funds
    const buyer = await prisma.user.findUnique({
      where: { fid: buyerId },
      include: { inventory: true }
    });

    if (!buyer || !buyer.inventory) {
      throw new Error('Buyer not found');
    }

    if (buyer.coins < listing.priceCoins) {
      throw new Error('Insufficient coins');
    }

    // 4. Calculate fees
    const marketplaceFee = Math.floor(listing.priceCoins * MARKETPLACE_FEE_PERCENT);
    const sellerProceeds = listing.priceCoins - marketplaceFee;

    // 5. Execute transaction
    const purchase = await prisma.$transaction(async (tx: any) => {
      // Deduct coins from buyer
      await tx.user.update({
        where: { fid: buyerId },
        data: { coins: buyer.coins - listing.priceCoins }
      });

      // Add coins to seller (minus fee)
      await tx.user.update({
        where: { fid: listing.sellerId },
        data: { coins: listing.seller.coins + sellerProceeds }
      });

      // Transfer item to buyer inventory
      if (listing.itemType === 'BAIT') {
        const buyerBaits = buyer.inventory!.baits as any;
        buyerBaits[listing.itemId] = (buyerBaits[listing.itemId] || 0) + listing.quantity;

        await tx.inventory.update({
          where: { userId: buyerId },
          data: { baits: buyerBaits }
        });
      } else if (listing.itemType === 'ROD') {
        const buyerRods = buyer.inventory!.rods as string[];
        buyerRods.push(listing.itemId);

        await tx.inventory.update({
          where: { userId: buyerId },
          data: { rods: buyerRods }
        });
      }

      // Mark listing as sold
      await tx.marketplaceListing.update({
        where: { id: listingId },
        data: { status: 'SOLD' }
      });

      // Create purchase record
      const purchaseRecord = await tx.marketplacePurchase.create({
        data: {
          listingId,
          buyerId,
          pricePaid: listing.priceCoins,
          marketplaceFee
        },
        include: {
          listing: { include: { seller: true } },
          buyer: true
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: buyerId,
          action: 'MARKETPLACE_PURCHASE',
          details: {
            listingId,
            itemType: listing.itemType,
            itemId: listing.itemId,
            price: listing.priceCoins,
            fee: marketplaceFee,
            sellerId: listing.sellerId
          }
        }
      });

      return purchaseRecord;
    });

    console.log(`[Marketplace] Purchase ${purchase.id}: User ${buyerId} bought from ${listing.sellerId}`);

    return purchase;
  },

  /**
   * Cancel a marketplace listing
   */
  async cancelListing(listingId: string, userId: number): Promise<MarketplaceListing> {
    const prisma = getPrisma();
    if (!prisma) {
      throw new Error('Database not configured for marketplace operations');
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
      include: { seller: true }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.sellerId !== userId) {
      throw new Error('Not authorized to cancel this listing');
    }

    if (listing.status !== 'ACTIVE') {
      throw new Error('Listing is not active');
    }

    // Return item to seller's inventory
    const seller = await prisma.user.findUnique({
      where: { fid: userId },
      include: { inventory: true }
    });

    if (!seller || !seller.inventory) {
      throw new Error('Seller not found');
    }

    if (listing.itemType === 'BAIT') {
      const baits = seller.inventory.baits as any;
      baits[listing.itemId] = (baits[listing.itemId] || 0) + listing.quantity;

      await prisma.inventory.update({
        where: { userId },
        data: { baits }
      });
    } else if (listing.itemType === 'ROD') {
      const rods = seller.inventory.rods as string[];
      rods.push(listing.itemId);

      await prisma.inventory.update({
        where: { userId },
        data: { rods }
      });
    }

    // Mark listing as cancelled
    const updated = await prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { status: 'CANCELLED' },
      include: { seller: true }
    });

    console.log(`[Marketplace] Cancelled listing ${listingId}`);

    return updated;
  },

  /**
   * Expire old listings (called by cron)
   */
  async expireOldListings(): Promise<void> {
    const prisma = getPrisma();
    if (!prisma) {
      console.log('[Marketplace] Skipping expire - no database configured');
      return;
    }

    try {
      const expiredListings = await prisma.marketplaceListing.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lte: new Date() }
        },
        include: { seller: { include: { inventory: true } } }
      });

      for (const listing of expiredListings) {
        try {
          // Return items to seller
          if (listing.seller.inventory) {
            if (listing.itemType === 'BAIT') {
              const baits = listing.seller.inventory.baits as any;
              baits[listing.itemId] = (baits[listing.itemId] || 0) + listing.quantity;

              await prisma.inventory.update({
                where: { userId: listing.sellerId },
                data: { baits }
              });
            } else if (listing.itemType === 'ROD') {
              const rods = listing.seller.inventory.rods as string[];
              rods.push(listing.itemId);

              await prisma.inventory.update({
                where: { userId: listing.sellerId },
                data: { rods }
              });
            }
          }

          // Mark as expired
          await prisma.marketplaceListing.update({
            where: { id: listing.id },
            data: { status: 'EXPIRED' }
          });

          console.log(`[Marketplace] Expired listing ${listing.id}`);
        } catch (error) {
          console.error(`[Marketplace] Error expiring listing ${listing.id}:`, error);
        }
      }
    } catch (error) {
      console.warn('[Marketplace] Error in expireOldListings:', error);
    }
  }
};
