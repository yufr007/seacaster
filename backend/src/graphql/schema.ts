import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Query {
    # User queries
    me: User
    user(fid: Int!): User
    leaderboard(type: TournamentType, limit: Int): [LeaderboardEntry!]!

    # Tournament queries
    activeTournaments: [Tournament!]!
    tournament(id: ID!): Tournament
    tournamentLeaderboard(tournamentId: ID!, limit: Int): [TournamentEntry!]!
    myTournaments: [TournamentEntry!]!

    # Marketplace queries
    marketplaceListings(itemType: ItemType, status: ListingStatus, limit: Int, offset: Int): MarketplaceListingsResponse!
    myListings: [MarketplaceListing!]!

    # Game data
    catchHistory(userId: Int, limit: Int): [Catch!]!
    fishCollection(userId: Int!): [FishCollectionEntry!]!
  }

  type Mutation {
    # User mutations
    syncUserProfile(input: SyncProfileInput!): User!
    claimDailyReward: DailyRewardResponse!
    openPrestigeChest: ChestRewardResponse!

    # Fishing mutations
    validateCatch(input: ValidateCatchInput!): ValidateCatchResponse!

    # Tournament mutations
    enterTournament(tournamentId: ID!, entryMethod: EntryMethod!): TournamentEntry!

    # Marketplace mutations
    createListing(input: CreateListingInput!): MarketplaceListing!
    buyListing(listingId: ID!): MarketplacePurchase!
    cancelListing(listingId: ID!): MarketplaceListing!

    # Admin mutations (protected)
    createTournament(input: CreateTournamentInput!): Tournament!
    settleTournament(tournamentId: ID!): TournamentSettlement!
  }

  type Subscription {
    tournamentUpdated(tournamentId: ID!): TournamentUpdate!
    leaderboardChanged(tournamentId: ID!): [TournamentEntry!]!
  }

  # Types
  type User {
    fid: Int!
    username: String!
    walletAddress: String
    pfpUrl: String
    xp: Int!
    level: Int!
    coins: Int!
    premium: Boolean!
    premiumExpiresAt: DateTime
    streak: Int!
    highestStreak: Int!
    lastLogin: DateTime!
    castsRemaining: Int!
    maxCasts: Int!
    pendingChests: Int!
    inventory: Inventory
    catchCount: Int!
    tournamentWins: Int!
  }

  type Inventory {
    baits: JSON!
    rods: JSON!
    premiumParts: JSON!
    activeBaitId: String!
    activeRodId: String!
  }

  type Tournament {
    id: ID!
    type: TournamentType!
    title: String!
    prizePool: Float!
    entryFee: Float!
    houseCutPercent: Float!
    maxParticipants: Int!
    currentParticipants: Int!
    status: TournamentStatus!
    startTime: DateTime!
    endTime: DateTime!
    timeRemaining: Int
    entries: [TournamentEntry!]!
  }

  type TournamentEntry {
    id: ID!
    tournament: Tournament!
    user: User!
    score: Float!
    rank: Int!
    payout: Float
    entryMethod: EntryMethod!
    joinedAt: DateTime!
  }

  type Catch {
    id: ID!
    user: User!
    fishId: String!
    fishName: String!
    rarity: String!
    weight: Float!
    xpGained: Int!
    coinsGained: Int!
    baitUsed: String!
    reactionTime: Float!
    tournament: Tournament
    timestamp: DateTime!
  }

  type MarketplaceListing {
    id: ID!
    seller: User!
    itemType: ItemType!
    itemId: String!
    quantity: Int!
    priceCoins: Int!
    status: ListingStatus!
    createdAt: DateTime!
    expiresAt: DateTime!
  }

  type MarketplacePurchase {
    id: ID!
    listing: MarketplaceListing!
    buyer: User!
    pricePaid: Int!
    marketplaceFee: Int!
    purchasedAt: DateTime!
  }

  type LeaderboardEntry {
    user: User!
    score: Float!
    rank: Int!
  }

  type FishCollectionEntry {
    fishId: String!
    fishName: String!
    rarity: String!
    count: Int!
    firstCaught: DateTime!
    heaviest: Float!
  }

  type MarketplaceListingsResponse {
    listings: [MarketplaceListing!]!
    total: Int!
    hasMore: Boolean!
  }

  type TournamentSettlement {
    tournamentId: ID!
    grossPool: Float!
    netPool: Float!
    houseCutAmount: Float!
    winners: [Winner!]!
  }

  type Winner {
    fid: Int!
    score: Float!
    payout: Float!
    address: String!
  }

  type TournamentUpdate {
    tournament: Tournament!
    action: String!
  }

  type DailyRewardResponse {
    success: Boolean!
    message: String!
    coinsAwarded: Int!
    castsAwarded: Int!
    newStreak: Int!
  }

  type ChestRewardResponse {
    success: Boolean!
    message: String!
    coinsAwarded: Int!
    baitsAwarded: JSON!
  }

  type ValidateCatchResponse {
    valid: Boolean!
    message: String
    catch: Catch
  }

  # Enums
  enum TournamentType {
    Daily
    Weekly
    Boss
    Championship
  }

  enum TournamentStatus {
    OPEN
    LIVE
    ENDED
    CANCELLED
  }

  enum EntryMethod {
    TICKET
    USDC
  }

  enum ItemType {
    BAIT
    ROD
    TICKET
    LOOT
    FISH
  }

  enum ListingStatus {
    ACTIVE
    SOLD
    CANCELLED
    EXPIRED
  }

  # Input types
  input SyncProfileInput {
    fid: Int!
    username: String!
    walletAddress: String
    pfpUrl: String
  }

  input ValidateCatchInput {
    fid: Int!
    fishId: String!
    weight: Float!
    rarity: String!
    baitUsed: String!
    reactionTime: Float!
    timestamp: Float!
    clientSeed: String!
    tournamentId: ID
  }

  input CreateListingInput {
    itemType: ItemType!
    itemId: String!
    quantity: Int!
    priceCoins: Int!
  }

  input CreateTournamentInput {
    type: TournamentType!
    title: String!
    prizePool: Float!
    entryFee: Float!
    maxParticipants: Int!
    durationMinutes: Int!
  }
`;
