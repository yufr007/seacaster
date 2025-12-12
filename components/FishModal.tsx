import React from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase } from '../types';
import { RARITY_COLORS, RARITY_BG } from '../constants';
import { Star, Share2, Check } from 'lucide-react';

const FishModal: React.FC = () => {
  const { phase, lastCatch, collectReward, isNewCatch } = useGameStore();

  if (phase !== GamePhase.REWARD || !lastCatch) return null;

  const isRare = ['Rare', 'Epic', 'Legendary', 'Mythic'].includes(lastCatch.rarity);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-ocean-900 border border-ocean-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center gap-4 text-center">
        
        {/* Background shine effect for rare items */}
        {isRare && (
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 animate-pulse pointer-events-none"></div>
        )}

        <div className="space-y-1 z-10">
          <h3 className={`text-sm uppercase tracking-widest font-bold ${RARITY_COLORS[lastCatch.rarity].split(' ')[0]}`}>
            {lastCatch.rarity} CATCH
          </h3>
          <h2 className="text-3xl font-black text-white drop-shadow-md">{lastCatch.name}</h2>
          
          {/* New Catch Badge */}
          {isNewCatch && (
            <div className="absolute top-4 left-0 -rotate-45 bg-yellow-500 text-black font-black text-[10px] py-1 px-8 shadow-lg border border-yellow-400">
               NEW!
            </div>
          )}
        </div>

        <div className={`w-32 h-32 ${RARITY_BG[lastCatch.rarity]} rounded-full flex items-center justify-center text-6xl shadow-inner border-4 border-ocean-800 z-10 animate-bounce-gentle`}>
          {lastCatch.image}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full z-10">
          <div className="bg-ocean-800 p-3 rounded-lg flex flex-col items-center border border-ocean-700">
            <span className="text-xs text-ocean-300 uppercase">Weight</span>
            <span className="text-xl font-bold text-white">{lastCatch.weight} lbs</span>
          </div>
          <div className="bg-ocean-800 p-3 rounded-lg flex flex-col items-center border border-ocean-700">
            <span className="text-xs text-ocean-300 uppercase">XP</span>
            <span className="text-xl font-bold text-green-400">+{lastCatch.xp}</span>
          </div>
        </div>

        <div className="flex w-full gap-3 mt-4 z-10">
          <button 
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-900/50 active:scale-95 transition-transform"
            onClick={collectReward}
          >
            <Check size={20} /> Keep
          </button>
          <button 
            className="w-12 bg-ocean-700 hover:bg-ocean-600 text-white font-bold py-3 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            onClick={() => alert("Simulating Farcaster cast sharing...")}
          >
            <Share2 size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default FishModal;