// services/api.ts - GraphQL API Client for SeaCaster

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const GRAPHQL_URL = `${API_URL}/graphql`;

// Auth token management
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
}

export function getAuthToken(): string | null {
    return authToken;
}

// GraphQL request helper
export async function graphqlRequest<T>(
    query: string,
    variables?: Record<string, any>
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors?.length) {
        const errorMessage = json.errors.map((e: any) => e.message).join(', ');
        throw new Error(errorMessage);
    }

    return json.data as T;
}

// ============================================
// GraphQL Queries
// ============================================

export const QUERIES = {
    ME: `
    query Me {
      me {
        fid
        username
        walletAddress
        pfpUrl
        xp
        level
        coins
        streak
        premium
        castsRemaining
        maxCasts
        catchCount
        tournamentWins
        inventory {
          baits
          rods
          premiumParts
          activeBaitId
          activeRodId
        }
      }
    }
  `,

    ACTIVE_TOURNAMENTS: `
    query ActiveTournaments {
      activeTournaments {
        id
        type
        title
        prizePool
        entryFee
        houseCutPercent
        maxParticipants
        currentParticipants
        status
        startTime
        endTime
        timeRemaining
      }
    }
  `,

    TOURNAMENT: `
    query Tournament($id: ID!) {
      tournament(id: $id) {
        id
        type
        title
        prizePool
        entryFee
        maxParticipants
        currentParticipants
        status
        startTime
        endTime
        timeRemaining
        entries {
          userId
          score
          rank
          user {
            fid
            username
            pfpUrl
            level
          }
        }
      }
    }
  `,

    TOURNAMENT_LEADERBOARD: `
    query TournamentLeaderboard($tournamentId: ID!, $limit: Int) {
      tournamentLeaderboard(tournamentId: $tournamentId, limit: $limit) {
        userId
        score
        rank
        user {
          fid
          username
          pfpUrl
          level
        }
      }
    }
  `,

    MY_TOURNAMENTS: `
    query MyTournaments {
      myTournaments {
        id
        tournamentId
        score
        rank
        payout
        tournament {
          id
          title
          type
          status
        }
      }
    }
  `,

    MARKETPLACE_LISTINGS: `
    query MarketplaceListings($itemType: String, $limit: Int, $offset: Int) {
      marketplaceListings(itemType: $itemType, limit: $limit, offset: $offset) {
        listings {
          id
          itemType
          itemId
          price
          status
          seller {
            fid
            username
          }
        }
        total
        hasMore
      }
    }
  `,

    LEADERBOARD: `
    query Leaderboard($type: String, $limit: Int) {
      leaderboard(type: $type, limit: $limit) {
        user {
          fid
          username
          pfpUrl
          level
          xp
        }
        score
        rank
      }
    }
  `,

    CATCH_HISTORY: `
    query CatchHistory($limit: Int) {
      catchHistory(limit: $limit) {
        id
        fishId
        fishName
        rarity
        weight
        xpGained
        coinsGained
        timestamp
      }
    }
  `,
};

// ============================================
// GraphQL Mutations
// ============================================

export const MUTATIONS = {
    SYNC_USER_PROFILE: `
    mutation SyncUserProfile($input: SyncUserInput!) {
      syncUserProfile(input: $input) {
        fid
        username
        walletAddress
        xp
        level
        coins
        premium
      }
    }
  `,

    ENTER_TOURNAMENT: `
    mutation EnterTournament($tournamentId: ID!, $entryMethod: String!) {
      enterTournament(tournamentId: $tournamentId, entryMethod: $entryMethod) {
        id
        tournamentId
        score
        rank
        tournament {
          id
          title
          currentParticipants
        }
      }
    }
  `,

    VALIDATE_CATCH: `
    mutation ValidateCatch($input: CatchInput!) {
      validateCatch(input: $input) {
        valid
        message
        catch {
          id
          fishId
          fishName
          rarity
          weight
          xpGained
          coinsGained
        }
      }
    }
  `,

    CLAIM_DAILY_REWARD: `
    mutation ClaimDailyReward {
      claimDailyReward {
        success
        message
        coinsAwarded
        castsAwarded
        newStreak
      }
    }
  `,

    CREATE_LISTING: `
    mutation CreateListing($input: CreateListingInput!) {
      createListing(input: $input) {
        id
        itemType
        itemId
        price
        status
      }
    }
  `,

    BUY_LISTING: `
    mutation BuyListing($listingId: ID!) {
      buyListing(listingId: $listingId) {
        success
        message
        listing {
          id
          status
        }
      }
    }
  `,

    CANCEL_LISTING: `
    mutation CancelListing($listingId: ID!) {
      cancelListing(listingId: $listingId) {
        id
        status
      }
    }
  `,
};

// ============================================
// API Helper Functions
// ============================================

// User API
export const userAPI = {
    getMe: () => graphqlRequest<{ me: any }>(QUERIES.ME),

    syncProfile: (input: { fid: number; username: string; walletAddress?: string; pfpUrl?: string }) =>
        graphqlRequest<{ syncUserProfile: any }>(MUTATIONS.SYNC_USER_PROFILE, { input }),

    claimDailyReward: () =>
        graphqlRequest<{ claimDailyReward: any }>(MUTATIONS.CLAIM_DAILY_REWARD),
};

// Tournament API
export const tournamentAPI = {
    getActive: () =>
        graphqlRequest<{ activeTournaments: any[] }>(QUERIES.ACTIVE_TOURNAMENTS),

    getById: (id: string) =>
        graphqlRequest<{ tournament: any }>(QUERIES.TOURNAMENT, { id }),

    getLeaderboard: (tournamentId: string, limit = 50) =>
        graphqlRequest<{ tournamentLeaderboard: any[] }>(QUERIES.TOURNAMENT_LEADERBOARD, { tournamentId, limit }),

    getMyEntries: () =>
        graphqlRequest<{ myTournaments: any[] }>(QUERIES.MY_TOURNAMENTS),

    enter: (tournamentId: string, entryMethod: 'USDC' | 'TICKET') =>
        graphqlRequest<{ enterTournament: any }>(MUTATIONS.ENTER_TOURNAMENT, { tournamentId, entryMethod }),
};

// Game API
export const gameAPI = {
    validateCatch: (input: {
        fishId: string;
        rarity: string;
        weight: number;
        baitUsed: string;
        reactionTime: number;
        tournamentId?: string;
    }) => graphqlRequest<{ validateCatch: any }>(MUTATIONS.VALIDATE_CATCH, { input }),

    getCatchHistory: (limit = 50) =>
        graphqlRequest<{ catchHistory: any[] }>(QUERIES.CATCH_HISTORY, { limit }),
};

// Marketplace API
export const marketplaceAPI = {
    getListings: (itemType?: string, limit = 50, offset = 0) =>
        graphqlRequest<{ marketplaceListings: any }>(QUERIES.MARKETPLACE_LISTINGS, { itemType, limit, offset }),

    createListing: (input: { itemType: string; itemId: string; price: number }) =>
        graphqlRequest<{ createListing: any }>(MUTATIONS.CREATE_LISTING, { input }),

    buyListing: (listingId: string) =>
        graphqlRequest<{ buyListing: any }>(MUTATIONS.BUY_LISTING, { listingId }),

    cancelListing: (listingId: string) =>
        graphqlRequest<{ cancelListing: any }>(MUTATIONS.CANCEL_LISTING, { listingId }),
};

// Leaderboard API
export const leaderboardAPI = {
    getGlobal: (type?: string, limit = 100) =>
        graphqlRequest<{ leaderboard: any[] }>(QUERIES.LEADERBOARD, { type, limit }),
};
