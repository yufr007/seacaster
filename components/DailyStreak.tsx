import React from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Gift } from 'lucide-react';

interface DailyStreakProps {
    isOpen: boolean;
    onClose: () => void;
}

const STREAK_REWARDS = [
    { day: 1, label: 'Basic Bait', icon: '🪱', qty: 'x1' },
    { day: 2, label: 'Bonus Casts', icon: '⚡', qty: 'x3' },
    { day: 3, label: 'Premium Bait', icon: '🦐', qty: 'x1' },
    { day: 4, label: 'Basic Bait', icon: '🪱', qty: 'x2' },
    { day: 5, label: 'Bonus Casts', icon: '⚡', qty: 'x5' },
    { day: 6, label: 'XP Boost', icon: '✨', qty: '50 XP' },
    { day: 7, label: 'KRAKEN CHEST', icon: '🦑', qty: 'EPIC' },
];

const DailyStreak: React.FC<DailyStreakProps> = ({ isOpen, onClose }) => {
    const { userStats, checkDailyLogin } = useGameStore();
    const currentDay = userStats.streak;

    const handleClaim = () => {
        const msg = checkDailyLogin();
        if (msg) {
            // Close after a delay or show success
            setTimeout(onClose, 2000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-[#5E4F3C] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#3E2723]"
                    >
                        {/* Header - Wooden Plank Style */}
                        <div className="bg-[#3E2723] p-4 text-center border-b-4 border-[#271c19] relative shadow-lg">
                            <h2 className="text-2xl font-black text-[#D4AF37] uppercase tracking-widest drop-shadow-md font-display">
                                Daily Catch Streak
                            </h2>
                            <button onClick={onClose} className="absolute top-4 right-4 text-[#C9B89A] hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content - Pier Background */}
                        <div className="p-6 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#5E4F3C] relative">
                            <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                            <div className="relative z-10 grid grid-cols-4 gap-3 mb-6">
                                {STREAK_REWARDS.map((reward, index) => {
                                    const dayNum = index + 1;
                                    const isCompleted = dayNum < currentDay;
                                    const isCurrent = dayNum === currentDay;
                                    const isLocked = dayNum > currentDay;

                                    return (
                                        <div
                                            key={dayNum}
                                            className={`
                        relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1 shadow-inner
                        ${dayNum === 7 ? 'col-span-2 aspect-auto flex-row gap-4' : ''}
                        ${isCompleted ? 'bg-[#3E2723]/80 border-[#271c19] opacity-60' : ''}
                        ${isCurrent ? 'bg-[#D4AF37] border-yellow-200 shadow-[0_0_15px_rgba(212,175,55,0.5)] scale-105 z-10' : ''}
                        ${isLocked ? 'bg-[#271c19]/60 border-[#3E2723]' : ''}
                      `}
                                        >
                                            {isCompleted && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                                                    <Check className="text-green-400 w-8 h-8 drop-shadow-md" strokeWidth={4} />
                                                </div>
                                            )}

                                            <span className={`text-[10px] font-bold uppercase mb-1 ${isCurrent ? 'text-[#3E2723]' : 'text-[#C9B89A]'}`}>
                                                Day {dayNum}
                                            </span>

                                            <div className="text-2xl filter drop-shadow-sm">{reward.icon}</div>

                                            <span className={`text-[10px] font-bold mt-1 ${isCurrent ? 'text-[#3E2723]' : 'text-white/60'}`}>
                                                {reward.qty}
                                            </span>

                                            {isCurrent && (
                                                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleClaim}
                                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-xl rounded-xl shadow-lg shadow-green-900/50 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                                <Gift size={24} />
                                CLAIM REWARD
                            </button>

                            <p className="text-center text-[#C9B89A] text-xs mt-4 font-medium opacity-80">
                                Resets if you miss a day! Come back tomorrow.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DailyStreak;
