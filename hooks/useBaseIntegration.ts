import { useAccount } from 'wagmi';
import { useCallback } from 'react';

export function useBaseIntegration() {
    const { address, isConnected } = useAccount();

    const getUserBalance = useCallback(async () => {
        if (!address) return null;
        return address;
    }, [address]);

    const submitScore = useCallback(
        async (score: number) => {
            if (!isConnected || !address) return;

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, score }),
            });

            if (!res.ok) {
                console.error('Failed to submit score');
            }
        },
        [isConnected, address],
    );

    const fetchLeaderboard = useCallback(async () => {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/leaderboard`);
        if (!res.ok) {
            console.error('Failed to fetch leaderboard');
            return [];
        }

        const json = await res.json();
        return json.leaderboard as { address: string; score: number; created_at: string }[];
    }, []);

    return {
        address,
        isConnected,
        getUserBalance,
        submitScore,
        fetchLeaderboard
    };
}
