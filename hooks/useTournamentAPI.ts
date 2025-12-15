// hooks/useTournamentAPI.ts - React Query hooks for tournament operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentAPI, setAuthToken } from '../services/api';
import { socketService } from '../services/socket';
import { useEffect, useCallback } from 'react';

// Query keys for cache management
export const tournamentKeys = {
    all: ['tournaments'] as const,
    active: () => [...tournamentKeys.all, 'active'] as const,
    detail: (id: string) => [...tournamentKeys.all, id] as const,
    leaderboard: (id: string) => [...tournamentKeys.all, id, 'leaderboard'] as const,
    myEntries: () => [...tournamentKeys.all, 'my-entries'] as const,
};

/**
 * Fetch all active tournaments
 */
export function useActiveTournaments() {
    return useQuery({
        queryKey: tournamentKeys.active(),
        queryFn: async () => {
            const data = await tournamentAPI.getActive();
            return data.activeTournaments;
        },
        staleTime: 10000, // 10 seconds
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}

/**
 * Fetch a single tournament by ID
 */
export function useTournament(id: string | undefined) {
    return useQuery({
        queryKey: tournamentKeys.detail(id || ''),
        queryFn: async () => {
            if (!id) return null;
            const data = await tournamentAPI.getById(id);
            return data.tournament;
        },
        enabled: !!id,
        staleTime: 5000,
    });
}

/**
 * Fetch tournament leaderboard with real-time updates via Socket.IO
 */
export function useTournamentLeaderboard(tournamentId: string | undefined, limit = 50) {
    const queryClient = useQueryClient();

    // Set up Socket.IO listener for real-time updates
    useEffect(() => {
        if (!tournamentId) return;

        socketService.connect();
        socketService.joinTournamentRoom(tournamentId);

        // Listen for leaderboard updates
        socketService.onLeaderboardUpdate((data) => {
            console.log('[useTournamentLeaderboard] Real-time update received');
            queryClient.setQueryData(tournamentKeys.leaderboard(tournamentId), data);
        });

        // Listen for tournament updates
        socketService.onTournamentUpdate((update) => {
            console.log('[useTournamentLeaderboard] Tournament update:', update.action);
            // Trigger a refetch when tournament state changes
            if (update.action === 'SCORE_UPDATED' || update.action === 'NEW_ENTRY') {
                queryClient.invalidateQueries({ queryKey: tournamentKeys.leaderboard(tournamentId) });
            }
        });

        return () => {
            socketService.leaveTournamentRoom(tournamentId);
            socketService.offLeaderboardUpdate();
            socketService.offTournamentUpdate();
        };
    }, [tournamentId, queryClient]);

    return useQuery({
        queryKey: tournamentKeys.leaderboard(tournamentId || ''),
        queryFn: async () => {
            if (!tournamentId) return [];
            const data = await tournamentAPI.getLeaderboard(tournamentId, limit);
            return data.tournamentLeaderboard;
        },
        enabled: !!tournamentId,
        staleTime: 5000,
        refetchInterval: 10000, // Backup polling every 10s
    });
}

/**
 * Fetch user's tournament entries
 */
export function useMyTournaments() {
    return useQuery({
        queryKey: tournamentKeys.myEntries(),
        queryFn: async () => {
            const data = await tournamentAPI.getMyEntries();
            return data.myTournaments;
        },
        staleTime: 30000,
    });
}

/**
 * Enter a tournament mutation
 */
export function useEnterTournament() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tournamentId, entryMethod }: { tournamentId: string; entryMethod: 'USDC' | 'TICKET' }) => {
            const data = await tournamentAPI.enter(tournamentId, entryMethod);
            return data.enterTournament;
        },
        onSuccess: (data, { tournamentId }) => {
            // Invalidate and refetch relevant queries
            queryClient.invalidateQueries({ queryKey: tournamentKeys.active() });
            queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(tournamentId) });
            queryClient.invalidateQueries({ queryKey: tournamentKeys.leaderboard(tournamentId) });
            queryClient.invalidateQueries({ queryKey: tournamentKeys.myEntries() });

            console.log('[useEnterTournament] Successfully entered tournament:', data);
        },
        onError: (error) => {
            console.error('[useEnterTournament] Failed to enter tournament:', error);
        },
    });
}

/**
 * Combined hook for tournament room with real-time updates
 */
export function useTournamentRoom(tournamentId: string | undefined) {
    const tournament = useTournament(tournamentId);
    const leaderboard = useTournamentLeaderboard(tournamentId);
    const enterMutation = useEnterTournament();

    const enterTournament = useCallback(
        (entryMethod: 'USDC' | 'TICKET' = 'USDC') => {
            if (!tournamentId) return;
            return enterMutation.mutateAsync({ tournamentId, entryMethod });
        },
        [tournamentId, enterMutation]
    );

    return {
        tournament: tournament.data,
        leaderboard: leaderboard.data || [],
        isLoading: tournament.isLoading || leaderboard.isLoading,
        isEntering: enterMutation.isPending,
        enterError: enterMutation.error,
        enterTournament,
        refetchLeaderboard: leaderboard.refetch,
    };
}

/**
 * Auth token setup for API calls
 */
export function useAuthSetup(token: string | null) {
    useEffect(() => {
        setAuthToken(token);
    }, [token]);
}
