import React from 'react';
import { useGameStore } from '../store/gameStore';
import { BAITS, RARITY_COLORS, RARITY_BG } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface BaitSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

const BaitSelector: React.FC<BaitSelectorProps> = ({ isOpen, onClose }) => {
    const { inventory, setActiveBait } = useGameStore();
    const activeBaitId = inventory.activeBaitId;

    const handleSelect = (id: string) => {
        setActiveBait(id);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-ocean-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border-t border-white/10 max-h-[80vh] flex flex-col"
                    >
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-ocean-800">
                            <h2 className="text-xl font-bold text-white font-display">Tackle Box</h2>
                            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white bg-white/5 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto space-y-3">
                            {Object.values(BAITS).map((bait) => {
                                const count = inventory.baits[bait.id] || 0;
                                const isActive = activeBaitId === bait.id;
                                const isLocked = count <= 0 && bait.id !== 'worm';

                                return (
                                    <button
                                        key={bait.id}
                                        onClick={() => !isLocked && handleSelect(bait.id)}
                                        disabled={isLocked}
                                        className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all relative overflow-hidden group
                      ${isActive
                                                ? 'bg-ocean-700 border-ocean-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                                                : isLocked
                                                    ? 'bg-ocean-900/50 border-white/5 opacity-50 grayscale'
                                                    : 'bg-ocean-800/50 border-white/10 hover:bg-ocean-800'
                                            }
                    `}
                                    >
                                        {/* Icon Container */}
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-black/20 ${isActive ? 'scale-110' : ''}`}>
                                            {bait.icon}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${isActive ? 'text-white' : 'text-gray-200'}`}>{bait.name}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${RARITY_COLORS[bait.rarity]} ${RARITY_BG[bait.rarity]}`}>
                                                    {bait.rarity}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5">{bait.description}</p>
                                        </div>

                                        {/* Quantity / Status */}
                                        <div className="text-right">
                                            {isActive && (
                                                <div className="absolute top-2 right-2 text-ocean-400">
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                            )}
                                            <span className={`font-mono font-bold ${count > 0 ? 'text-white' : 'text-red-400'}`}>
                                                x{count >= 999 ? '∞' : count}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BaitSelector;
