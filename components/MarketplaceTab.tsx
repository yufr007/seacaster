
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Lock, Coins, Crown, Zap, Video, Check, Loader2, ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { BAITS } from '../constants';
import { useSound } from '../hooks/useSound';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { SEASON_PASS_ABI, CONTRACT_ADDRESSES } from '@/contracts/abis';
import { parseEther } from 'viem';
import AdOverlay from './AdOverlay';
import { Haptics, triggerHaptic } from '../utils/haptics';

interface MarketplaceTabProps {
  onBack: () => void;
}

const MarketplaceTab: React.FC<MarketplaceTabProps> = ({ onBack }) => {
  const { userStats, buyItem, purchaseSeasonPass, watchAd } = useGameStore();
  const { addToast } = useUIStore();
  const { play } = useSound();
  const [showAd, setShowAd] = useState(false);

  // Web3 Hooks
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Watch for transaction success
  useEffect(() => {
    if (isConfirmed) {
      purchaseSeasonPass(); // Update local store
      play('levelUp');
      triggerHaptic(Haptics.levelUp);
      addToast('Season Pass Activated on Base!', 'success');
    }
  }, [isConfirmed, purchaseSeasonPass, play, addToast]);

  const SHOP_BAITS = [
    { ...BAITS['shrimp'], price: 50 },
    { ...BAITS['lure'], price: 100 },
    { ...BAITS['squid'], price: 150 },
    { ...BAITS['chum'], price: 300 },
    { ...BAITS['kraken_eye'], price: 1000 },
  ];

  const handleBuy = (id: string, price: number, type: 'bait') => {
    if (userStats.coins >= price) {
      buyItem(id, price, type);
      play('click');
      triggerHaptic(Haptics.medium);
      addToast(`Purchased ${type === 'bait' ? BAITS[id].name : id}!`, 'success');
    } else {
      play('click');
      triggerHaptic(Haptics.error);
      addToast('Not enough coins!', 'error');
    }
  };

  const handlePurchasePass = () => {
    if (!isConnected || !address) {
      triggerHaptic(Haptics.error);
      addToast('Please connect wallet in Profile first!', 'warning');
      return;
    }

    triggerHaptic(Haptics.heavy);

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.SEASON_PASS as `0x${string}`,
        abi: SEASON_PASS_ABI,
        functionName: 'purchasePass',
        account: address,
        chain: undefined,
      });
    } catch (e) {
      console.error(e);
      triggerHaptic(Haptics.error);
      addToast('Transaction failed to initiate', 'error');
    }
  };

  const handleAdClick = () => {
    triggerHaptic(Haptics.medium);
    setShowAd(true);
  };

  const handleAdComplete = () => {
    watchAd();
    play('success');
    triggerHaptic(Haptics.success);
    addToast('Reward granted: +25 coins & energy!', 'success');
    // Delay closing slightly to show the completion
    setTimeout(() => setShowAd(false), 500);
  };

  const isProcessing = isWritePending || isConfirming;

  // Helper for Soulbound Item Status
  const getGearStatus = (levelReq: number) => {
    const hasLevel = userStats.level >= levelReq;
    const hasPremium = userStats.premium;

    if (hasLevel && hasPremium) return 'owned';
    if (hasLevel && !hasPremium) return 'premium_locked';
    return 'level_locked';
  };

  return (
    <div className="flex flex-col h-full bg-ocean-900 p-4 space-y-6 overflow-y-auto no-scrollbar pb-32 relative">
      {showAd && <AdOverlay onComplete={handleAdComplete} onCancel={() => setShowAd(false)} />}

      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-ocean-900/95 backdrop-blur z-20 py-3 border-b border-ocean-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 -ml-2 text-ocean-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="text-green-400" /> Marketplace
          </h2>
        </div>
        <div className="bg-ocean-800 px-4 py-1.5 rounded-full text-sm font-mono text-gold border border-ocean-700 flex items-center gap-2 shadow-inner">
          <Coins size={14} className="fill-gold" />
          {userStats.coins.toLocaleString()}
        </div>
      </div>

      {/* Free Rewards */}
      {!userStats.premium && (
        <div onClick={handleAdClick} className="bg-gradient-to-r from-emerald-800 to-teal-800 p-4 rounded-xl border border-emerald-500 shadow-lg flex items-center justify-between active:scale-95 transition-transform cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center">
              <Video className="text-white" />
            </div>
            <div>
              <div className="font-bold text-white">Watch Ad</div>
              <div className="text-xs text-emerald-200">Get +25 Coins & 2 Casts</div>
            </div>
          </div>
          <div className="bg-white text-emerald-900 px-3 py-1.5 rounded-lg font-bold text-xs uppercase">
            Watch
          </div>
        </div>
      )}

      {/* Season Pass Banner */}
      {!userStats.premium ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-500 shadow-2xl p-4">
          <div className="absolute top-0 right-0 p-1 bg-yellow-400 text-black text-[10px] font-bold">BEST VALUE</div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h3 className="text-xl font-black text-white italic flex items-center gap-2">
                SEASON PASS <Crown size={18} className="fill-yellow-400 text-yellow-600" />
              </h3>
              <ul className="text-xs text-purple-200 mt-2 space-y-1">
                <li className="flex items-center gap-1">✅ Unlimited Casts</li>
                <li className="flex items-center gap-1">✅ 2x XP Gain</li>
                <li className="flex items-center gap-1">✅ Soulbound Rod Set</li>
              </ul>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-2xl font-black text-white">$9.99</div>
              <button
                onClick={handlePurchasePass}
                disabled={isProcessing}
                className="bg-white text-purple-900 font-bold px-4 py-2 rounded-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Buy Now'}
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-600/30 flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500">
            <Crown size={24} className="text-yellow-400 fill-yellow-400" />
          </div>
          <div>
            <div className="text-yellow-400 font-bold uppercase tracking-wider text-sm">Season Pass Active</div>
            <div className="text-xs text-yellow-200/60">Unlimited casts & 2x XP enabled</div>
          </div>
        </div>
      )}

      {/* Baits Grid */}
      <div>
        <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-ocean-300">
          <Zap size={14} /> Premium Bait
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {SHOP_BAITS.map(item => (
            <button
              key={item.id}
              onClick={() => handleBuy(item.id, item.price, 'bait')}
              className="p-3 rounded-xl border border-ocean-700 bg-ocean-800 flex flex-col items-center text-center relative group active:scale-95 transition-transform hover:border-sky-500"
            >
              <div className="text-4xl mb-2 drop-shadow-md group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="font-bold text-white text-sm">{item.name}</h3>
              <p className="text-[10px] text-ocean-300 mb-3 h-6 flex items-center justify-center leading-tight px-2">{item.description}</p>

              <div className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-lg bg-sky-700 group-hover:bg-sky-600 text-white transition-colors">
                <Coins size={12} className="fill-white/80" /> {item.price}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Soulbound Rods */}
      <div>
        <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-ocean-300">
          <Lock size={14} /> Soulbound Gear
        </h3>
        <div className="space-y-2">
          {/* Item Generator Helper */}
          {[
            { name: "Carbon Fiber Rod", level: 20, icon: "🎣" },
            { name: "Poseidon's Fork", level: 50, icon: "🔱" }
          ].map((gear) => {
            const status = getGearStatus(gear.level);

            return (
              <div key={gear.name} className={`rounded-xl p-3 border flex items-center justify-between ${status === 'owned' ? 'bg-ocean-800 border-ocean-600' : 'bg-ocean-900 border-ocean-800 opacity-80'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center text-2xl border border-ocean-600">{gear.icon}</div>
                  <div>
                    <div className="text-sm font-bold text-white">{gear.name}</div>
                    <div className="text-[10px] text-ocean-400">Level {gear.level} + Season Pass</div>
                  </div>
                </div>

                {status === 'owned' && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-900/50 text-green-400 rounded text-xs font-bold border border-green-600">
                    <Check size={12} /> Owned
                  </div>
                )}

                {status === 'premium_locked' && (
                  <button disabled className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded text-xs font-bold border border-purple-700 flex items-center gap-1">
                    <Crown size={10} /> Pass Req.
                  </button>
                )}

                {status === 'level_locked' && (
                  <button disabled className="px-3 py-1 bg-ocean-950 text-ocean-500 rounded text-xs font-bold border border-ocean-800">
                    Lvl {gear.level}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Trading (Coming Soon) */}
      <div className="mt-8 p-4 rounded-xl border border-white/10 bg-black/20 text-center">
        <h3 className="text-white font-bold mb-1">Player Market</h3>
        <p className="text-xs text-ocean-400 mb-3">Buy and sell rare items with other players.</p>
        <div className="inline-block px-3 py-1 rounded bg-ocean-800 text-[10px] font-mono text-ocean-300 border border-ocean-700">
          ⚠️ 10% Protocol Fee on Transfers
        </div>
        <button disabled className="w-full mt-3 py-2 bg-white/5 text-white/40 font-bold rounded-lg text-xs uppercase tracking-wider cursor-not-allowed">
          Coming Soon
        </button>
      </div>
    </div>
  );
};

export default MarketplaceTab;
