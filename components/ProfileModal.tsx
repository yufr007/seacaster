
import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { X, Shield, Wallet, CircleUser, Lock, Crown } from 'lucide-react';
import { FISH_TYPES, RARITY_BG, RARITY_COLORS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { userStats, history } = useGameStore();
  const [activeTab, setActiveTab] = useState<'gear' | 'dex'>('gear');
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);

  // Wagmi Hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  // Rod Progression Logic
  // IMPORTANT: Parts are Premium Soulbound rewards. Free users only get basic progression stats, not the visual parts.
  const getRodParts = () => {
    const isPremium = userStats.premium;
    const parts = [
      { level: 1, name: "Bamboo Rod", icon: "🎋", unlocked: true, premiumOnly: false },
      { level: 10, name: "Pirate Handle", icon: "🗡️", unlocked: userStats.level >= 10, premiumOnly: true },
      { level: 20, name: "Carbon Shaft", icon: "🥢", unlocked: userStats.level >= 20, premiumOnly: true },
      { level: 30, name: "Golden Hook", icon: "🪝", unlocked: userStats.level >= 30, premiumOnly: true },
      { level: 40, name: "Kraken Reel", icon: "⚙️", unlocked: userStats.level >= 40, premiumOnly: true },
      { level: 50, name: "Ship Cannon", icon: "💣", unlocked: userStats.level >= 50, premiumOnly: true },
    ];
    return parts;
  };

  // Dex Logic
  const caughtSet = new Set(history.map(f => f.id));
  const uniqueFishCaught = caughtSet.size;
  const totalFishTypes = FISH_TYPES.length;

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) connect({ connector });
  };

  const selectedFishData = selectedFishId ? FISH_TYPES.find(f => f.id === selectedFishId) : null;
  const isSelectedCaught = selectedFishData ? caughtSet.has(selectedFishData.id) : false;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full h-full max-h-[800px] bg-ocean-900 rounded-2xl flex flex-col overflow-hidden relative border border-ocean-700 shadow-2xl">

        {/* Header */}
        <div className="p-4 border-b border-ocean-700 flex justify-between items-center bg-ocean-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white/20">
              {userStats.premium ? <span className="text-xl">👑</span> : <CircleUser className="text-white" size={20} />}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none">{userStats.username}</h2>
              <div className="text-xs text-ocean-400 font-mono">FID: {userStats.fid || '---'}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-ocean-700 rounded-full hover:bg-ocean-600 transition-colors">
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Wallet & Stats Bar */}
        <div className="p-4 grid grid-cols-2 gap-3 bg-ocean-900">
          {isConnected ? (
            <div className="flex gap-2">
              <button
                onClick={() => disconnect()}
                className="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all bg-green-900/50 border-green-500 text-green-400"
              >
                <Wallet size={16} />
                {address?.slice(0, 6)}...
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all bg-blue-900/50 border-blue-500 text-blue-400 hover:bg-blue-900"
            >
              <Wallet size={16} />
              Connect Wallet
            </button>
          )}

          <div className="p-3 rounded-xl border border-ocean-700 bg-ocean-800 flex items-center justify-between px-4">
            <span className="text-xs text-ocean-400 uppercase font-bold">Fish Dex</span>
            <span className="text-sm font-black text-white">{uniqueFishCaught}/{totalFishTypes}</span>
          </div>
        </div>

        {isConnected && balance && (
          <div className="px-4 pb-2 text-xs text-ocean-400 flex justify-end">
            Balance: {Number(formatUnits(balance.value, balance.decimals)).toFixed(4)} {balance.symbol}
          </div>
        )}

        {/* Season Pass Banner */}
        {!userStats.premium && (
          <div className="mx-4 mb-2 p-3 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl border border-purple-500/50 shadow-lg flex items-center justify-between group relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                <h3 className="font-black text-white italic tracking-wider">SEASON PASS</h3>
              </div>
              <p className="text-[10px] text-purple-200 font-medium mt-0.5">2x XP • Unlimited Casts • Premium Rewards</p>
            </div>

            <button
              onClick={() => useGameStore.getState().purchaseSeasonPass()}
              className="relative z-10 bg-white text-purple-900 font-black text-xs px-4 py-2 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              GET IT ($9.99)
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-ocean-700 bg-ocean-800/50">
          <button
            onClick={() => setActiveTab('gear')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'gear' ? 'text-white border-b-2 border-sky-500 bg-ocean-800' : 'text-ocean-400 hover:text-ocean-200'}`}
          >
            Rod Builder
          </button>
          <button
            onClick={() => setActiveTab('dex')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'dex' ? 'text-white border-b-2 border-sky-500 bg-ocean-800' : 'text-ocean-400 hover:text-ocean-200'}`}
          >
            Fish Dex
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">

          {activeTab === 'gear' && (
            <div className="space-y-6">
              {/* Rod Visualizer */}
              <div className="h-48 bg-gradient-to-b from-sky-900/50 to-ocean-900 rounded-2xl border border-ocean-700 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                {/* Visual Representation of Rod Logic matching FishingScene */}
                <div className="relative w-2 h-40 bg-gray-700 rounded-full rotate-45 shadow-2xl flex flex-col justify-end">
                  {/* Dynamic Parts - Only show if Premium AND Unlocked */}
                  {userStats.level >= 10 && userStats.premium && <div className="absolute -bottom-2 -left-1 w-4 h-12 bg-red-900 rounded-md border border-red-700"></div>} {/* Handle */}
                  {userStats.level >= 20 && userStats.premium && <div className="absolute bottom-10 left-0 w-full h-24 bg-gradient-to-t from-gray-800 to-black opacity-80"></div>} {/* Carbon */}
                  {userStats.level >= 30 && userStats.premium && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_gold]"></div>} {/* Hook Tip */}
                  {userStats.level >= 40 && userStats.premium && <div className="absolute bottom-8 -right-4 w-8 h-8 bg-gray-800 border-2 border-cyan-500 rounded-full"></div>} {/* Reel */}
                </div>

                {!userStats.premium && (
                  <div className="absolute bottom-4 flex flex-col items-center gap-1 animate-pulse">
                    <Lock className="text-yellow-400" size={16} />
                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded">Premium Gear Locked</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 text-[10px] text-ocean-400">Current Loadout</div>
              </div>

              {/* Parts List */}
              <div className="space-y-3">
                {getRodParts().map((part) => {
                  const isLockedByPremium = part.premiumOnly && !userStats.premium;
                  const isLockedByLevel = !part.unlocked;
                  const isActuallyUnlocked = !isLockedByLevel && !isLockedByPremium;

                  return (
                    <div key={part.level} className={`flex items-center gap-4 p-3 rounded-xl border ${isActuallyUnlocked ? 'bg-ocean-800 border-ocean-600' : 'bg-ocean-900/50 border-ocean-800 opacity-70'}`}>
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl relative ${isActuallyUnlocked ? 'bg-ocean-700' : 'bg-ocean-800 grayscale'}`}>
                        {part.icon}
                        {isLockedByPremium && !isLockedByLevel && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border border-black shadow-md">
                            <Lock size={10} className="text-black fill-black" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-bold ${isActuallyUnlocked ? 'text-white' : 'text-ocean-400'}`}>{part.name}</span>
                          <div className="flex gap-2">
                            {part.premiumOnly && (
                              <span className="text-[10px] bg-purple-900/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700 flex items-center gap-1">
                                <Crown size={8} /> Premium
                              </span>
                            )}
                            {!part.unlocked && <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-ocean-400">Lvl {part.level}</span>}
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-ocean-950 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: isActuallyUnlocked ? '100%' : `${Math.min(100, (userStats.level / part.level) * 100)}%` }}
                            className={`h-full ${isActuallyUnlocked ? 'bg-green-500' : isLockedByPremium ? 'bg-yellow-600' : 'bg-blue-600'}`}
                          />
                        </div>
                      </div>
                      {isActuallyUnlocked && <div className="text-green-400"><Shield size={16} className="fill-current" /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'dex' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {FISH_TYPES.map((fish) => {
                  const isCaught = caughtSet.has(fish.id);
                  const isSelected = selectedFishId === fish.id;

                  return (
                    <button
                      key={fish.id}
                      onClick={() => setSelectedFishId(fish.id)}
                      className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-between border transition-all active:scale-95 ${isSelected ? 'ring-2 ring-sky-400 border-sky-400 bg-sky-900/30' :
                          isCaught ? `bg-ocean-800 ${RARITY_COLORS[fish.rarity]} hover:border-ocean-500` :
                            'bg-ocean-900/50 border-ocean-800 opacity-50 grayscale'
                        }`}
                    >
                      <div className={`w-full h-full flex items-center justify-center text-4xl rounded-lg ${isCaught ? '' : 'brightness-0 opacity-20'}`}>
                        {fish.image}
                      </div>
                      <div className="w-full text-center">
                        <div className="text-[10px] font-bold truncate text-white">{isCaught ? fish.name : '???'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Fish Detail Popup */}
              <AnimatePresence>
                {selectedFishData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-6 bg-ocean-800 rounded-xl p-4 border border-ocean-700 shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-inner border-2 border-ocean-600 ${isSelectedCaught ? RARITY_BG[selectedFishData.rarity] : 'bg-black/50'}`}>
                        {isSelectedCaught ? selectedFishData.image : '?'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">
                          {isSelectedCaught ? selectedFishData.name : 'Unknown Fish'}
                        </h3>
                        <div className={`text-xs font-bold uppercase mb-2 ${isSelectedCaught ? RARITY_COLORS[selectedFishData.rarity].split(' ')[0] : 'text-gray-500'}`}>
                          {isSelectedCaught ? selectedFishData.rarity : '???'}
                        </div>
                        <p className="text-sm text-ocean-300 italic leading-snug">
                          {isSelectedCaught ? `"${selectedFishData.description}"` : "Catch this fish to unlock its secrets."}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
