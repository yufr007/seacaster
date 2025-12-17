/**
 * Centralized Database Access Layer
 * 
 * Provides lazy-initialized database access that:
 * - Checks USE_PRISMA environment variable on first use
 * - Returns either Prisma ORM or Supabase REST client
 * - Prevents crashes when database is not configured
 * - Enables "mock mode" for frontend-only development
 */

import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ===== SINGLETON INSTANCES =====
let prismaInstance: PrismaClient | null = null;
let supabaseInstance: SupabaseClient | null = null;
let dbMode: 'prisma' | 'supabase' | 'mock' | null = null;

/**
 * Determine which database mode to use based on environment
 */
function determineDbMode(): 'prisma' | 'supabase' | 'mock' {
    if (dbMode) return dbMode;

    const usePrisma = process.env.USE_PRISMA === 'true';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasSupabaseUrl = !!process.env.SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (usePrisma && hasDatabaseUrl) {
        dbMode = 'prisma';
        console.log('[DB] Mode: Prisma ORM');
    } else if (hasSupabaseUrl && hasSupabaseKey) {
        dbMode = 'supabase';
        console.log('[DB] Mode: Supabase REST API');
    } else {
        dbMode = 'mock';
        console.warn('[DB] Mode: MOCK (no database configured - using in-memory data)');
    }

    return dbMode;
}

/**
 * Get Prisma client instance (lazy-initialized)
 * Returns null if not in Prisma mode
 */
export function getPrisma(): PrismaClient | null {
    const mode = determineDbMode();
    if (mode !== 'prisma') return null;

    if (!prismaInstance) {
        try {
            prismaInstance = new PrismaClient({
                log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
            });
            console.log('[DB] Prisma client initialized');
        } catch (error) {
            console.error('[DB] Failed to initialize Prisma:', error);
            dbMode = 'mock'; // Fallback to mock mode
            return null;
        }
    }

    return prismaInstance;
}

/**
 * Get Supabase client instance (lazy-initialized)
 * Returns null if not in Supabase mode
 */
export function getSupabase(): SupabaseClient | null {
    const mode = determineDbMode();
    if (mode !== 'supabase') return null;

    if (!supabaseInstance) {
        const url = process.env.SUPABASE_URL!;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        try {
            supabaseInstance = createClient(url, key, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
            console.log('[DB] Supabase client initialized');
        } catch (error) {
            console.error('[DB] Failed to initialize Supabase:', error);
            dbMode = 'mock';
            return null;
        }
    }

    return supabaseInstance;
}

/**
 * Check if we're in mock mode (no real database)
 */
export function isMockMode(): boolean {
    return determineDbMode() === 'mock';
}

/**
 * Get the current database mode
 */
export function getDbMode(): 'prisma' | 'supabase' | 'mock' {
    return determineDbMode();
}

// ===== MOCK DATA FOR DEVELOPMENT =====
// This allows the backend to run without a database for UI development

export const MOCK_TOURNAMENTS = [
    {
        id: 'mock-daily-1',
        type: 'Daily',
        title: 'Daily Catch Challenge',
        prizePool: 30,
        entryFee: 0.5,
        houseCutPercent: 10,
        maxParticipants: 60,
        currentParticipants: 12,
        status: 'OPEN',
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        entries: [],
    },
    {
        id: 'mock-weekly-1',
        type: 'Weekly',
        title: 'Weekly Masters',
        prizePool: 150,
        entryFee: 2,
        houseCutPercent: 10,
        maxParticipants: 75,
        currentParticipants: 25,
        status: 'LIVE',
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        entries: [],
    },
];

export const MOCK_LEADERBOARD = [
    { rank: 1, userId: 1, username: 'CaptainHook', score: 1250, avatar: null },
    { rank: 2, userId: 2, username: 'SaltyDog', score: 1100, avatar: null },
    { rank: 3, userId: 3, username: 'SeaWolf', score: 980, avatar: null },
    { rank: 4, userId: 4, username: 'AnchorAce', score: 850, avatar: null },
    { rank: 5, userId: 5, username: 'TideRider', score: 720, avatar: null },
];

// ===== CLEANUP =====

export async function disconnectDB(): Promise<void> {
    if (prismaInstance) {
        await prismaInstance.$disconnect();
        prismaInstance = null;
        console.log('[DB] Prisma disconnected');
    }
}
