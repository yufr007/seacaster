import React from 'react';

interface TournamentCardProps {
    title: string;
    prizePool: number;
    entryFee: number;
    timeRemaining: string;
    participants: number;
    maxParticipants: number;
    status: 'live' | 'open' | 'upcoming';
    isBossRaid?: boolean;
    isChampionship?: boolean;
    onJoin?: () => void;
    disabled?: boolean;
    isProcessing?: boolean;
}

export function TournamentCard({
    title,
    prizePool,
    entryFee,
    timeRemaining,
    participants,
    maxParticipants,
    status,
    isBossRaid,
    isChampionship,
    onJoin,
    disabled,
    isProcessing
}: TournamentCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-card to-dark-hover border border-gray-800/50 hover:border-ocean-500/50 transition-all duration-300 hover:shadow-glow">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-ocean-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Badge */}
            {(isBossRaid || isChampionship) && (
                <div className="absolute top-4 right-4 z-10">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isBossRaid
                            ? 'bg-danger-500 text-white shadow-lg shadow-danger-500/50'
                            : 'bg-warning-500 text-white shadow-lg shadow-warning-500/50'
                        }`}>
                        {isBossRaid ? '🔥 Boss Raid' : '💎 Championship'}
                    </span>
                </div>
            )}

            {/* Content */}
            <div className="relative p-6 space-y-4">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status === 'live'
                                ? 'bg-success-500/20 text-success-500'
                                : 'bg-ocean-500/20 text-ocean-500'
                            }`}>
                            {status === 'live' && <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />}
                            {status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">ID: #{Math.random().toString(36).substring(7).toUpperCase()}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white font-display">{title}</h3>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Prize Pool */}
                    <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Prize Pool</p>
                        <p className="text-xl font-bold text-ocean-400">
                            ${prizePool.toLocaleString()}
                        </p>
                    </div>

                    {/* Time */}
                    <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            ⏱️ Remaining
                        </p>
                        <p className="text-xl font-bold text-white">{timeRemaining}</p>
                    </div>

                    {/* Participants */}
                    <div className="space-y-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            👥 Players
                        </p>
                        <p className="text-xl font-bold text-white">
                            {participants}/{maxParticipants}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-ocean-500 to-ocean-400 rounded-full transition-all duration-500"
                            style={{ width: `${(participants / maxParticipants) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        {Math.round((participants / maxParticipants) * 100)}% Full
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={onJoin}
                    disabled={disabled}
                    className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-ocean-500/30 hover:shadow-ocean-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    <span className="flex items-center justify-center gap-2">
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                Enter Tournament
                                <span className="text-sm opacity-90">(${entryFee.toFixed(2)})</span>
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </span>
                </button>
            </div>
        </div>
    );
}
