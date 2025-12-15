// hooks/useGameAPI.ts - React Query hooks for fishing game operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameAPI, userAPI } from '../services/api';

// Query keys for cache management
export const gameKeys = {
    all: ['game'] as const,
    catches: () => [...gameKeys.all, 'catches'] as const,
    user: () => ['user'] as const,
    me: () => [...gameKeys.user(), 'me'] as const,
};

/**
 * Fetch current user profile
 */
export function useMe() {
    return useQuery({
        queryKey: gameKeys.me(),
        queryFn: async () => {
            const data = await userAPI.getMe();
            return data.me;
        },
        staleTime: 30000, // 30 seconds
        retry: 1,
    });
}

/**
 * Sync user profile with Farcaster data
 */
export function useSyncProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            fid: number;
            username: string;
            walletAddress?: string;
            pfpUrl?: string
        }) => {
            const data = await userAPI.syncProfile(input);
            return data.syncUserProfile;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(gameKeys.me(), data);
            console.log('[useSyncProfile] Profile synced:', data.username);
        },
        onError: (error) => {
            console.error('[useSyncProfile] Failed to sync profile:', error);
        },
    });
}

/**
 * Claim daily reward mutation
 */
export function useClaimDailyReward() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const data = await userAPI.claimDailyReward();
            return data.claimDailyReward;
        },
        onSuccess: (data) => {
            // Invalidate user data to reflect new coins/streak
            queryClient.invalidateQueries({ queryKey: gameKeys.me() });
            console.log('[useClaimDailyReward] Reward claimed:', data.message);
        },
        onError: (error) => {
            console.error('[useClaimDailyReward] Failed to claim:', error);
        },
    });
}

/**
 * Validate and submit a catch
 */
export function useValidateCatch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: {
            fishId: string;
            rarity: string;
            weight: number;
            baitUsed: string;
            reactionTime: number;
            tournamentId?: string;
        }) => {
            const data = await gameAPI.validateCatch(input);
            return data.validateCatch;
        },
        onSuccess: (data) => {
            if (data.valid) {
                // Invalidate user data to reflect XP/coins gained
                queryClient.invalidateQueries({ queryKey: gameKeys.me() });
                // Invalidate catch history
                queryClient.invalidateQueries({ queryKey: gameKeys.catches() });
                console.log('[useValidateCatch] Catch validated:', data.catch?.fishName);
            } else {
                console.warn('[useValidateCatch] Catch rejected:', data.message);
            }
        },
        onError: (error) => {
            console.error('[useValidateCatch] Validation failed:', error);
        },
    });
}

/**
 * Fetch catch history
 */
export function useCatchHistory(limit = 50) {
    return useQuery({
        queryKey: gameKeys.catches(),
        queryFn: async () => {
            const data = await gameAPI.getCatchHistory(limit);
            return data.catchHistory;
        },
        staleTime: 60000, // 1 minute
    });
}

/**
 * Combined game state hook
 */
export function useGameState() {
    const user = useMe();
    const syncProfile = useSyncProfile();
    const claimDaily = useClaimDailyReward();
    const validateCatch = useValidateCatch();

    return {
        user: user.data,
        isLoading: user.isLoading,
        error: user.error,

        // Profile sync
        syncProfile: syncProfile.mutate,
        isSyncing: syncProfile.isPending,

        // Daily reward
        claimDailyReward: claimDaily.mutate,
        isClaiming: claimDaily.isPending,

        // Catch validation
        submitCatch: validateCatch.mutate,
        isSubmitting: validateCatch.isPending,
        lastCatchResult: validateCatch.data,

        // Refetch
        refetchUser: user.refetch,
    };
}
