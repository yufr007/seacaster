import React, { useState, useEffect } from 'react';
import FishingScene from './components/FishingScene';
import GameHUD from './components/GameHUD';
import FishModal from './components/FishModal';
import TournamentBoard from './components/TournamentBoard';
import MarketplaceTab from './components/MarketplaceTab';
import ProfileModal from './components/ProfileModal';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { Home, Trophy, ShoppingBag } from 'lucide-react';
import { farcaster } from './services/farcaster';
import { useGameStore } from './store/gameStore';
import { useUIStore } from './store/uiStore';
import { Web3Provider } from './providers/Web3Provider';
import { useAccount } from 'wagmi';
import { useContracts } from './hooks/useContracts';
import { Haptics, triggerHaptic } from './utils/haptics';
import { useWakeLock } from './hooks/useWakeLock';

import { WalletConnect } from './components/WalletConnect';

const SeaCasterApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fish' | 'compete' | 'shop'>('fish');
  const [isReady, setIsReady] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { userStats, regenerateCasts, checkDailyLogin, syncPremiumStatus } = useGameStore();
  const { addToast } = useUIStore();

  // Web3 state sync
  const { address, isConnected } = useAccount();
  const { checkSeasonPass } = useContracts();

  // PWA Features: Keep screen on during fishing
  useWakeLock(activeTab === 'fish');

  // Verify Season Pass on wallet connect
  useEffect(() => {
    if (isConnected && address) {
      checkSeasonPass(address).then((isActive) => {
        if (isActive && !userStats.premium) {
          syncPremiumStatus(true);
          addToast("Restored Season Pass from On-Chain!", "success");
        }
      });
    }
  }, [isConnected, address, checkSeasonPass, userStats.premium, syncPremiumStatus, addToast]);

  // Lock orientation to portrait (mobile PWA)
  useEffect(() => {
    const lockOrientation = async () => {
      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('portrait');
          console.log('[Orientation] Locked to portrait');
        } catch (err) {
          console.warn('[Orientation] Lock failed (may require fullscreen):', err);
        }
      }
    };
    lockOrientation();
  }, []);

  useEffect(() => {
    const initApp = async () => {
      // 1. Init Farcaster SDK
      await farcaster.init();
      const user = farcaster.getUser();
      if (user) {
        useGameStore.setState(state => ({
          userStats: { ...state.userStats, fid: user.fid, username: user.username }
        }));
      }

      // 2. Trigger initial energy calculation (resume from idle)
      regenerateCasts();

      // 3. Check Daily Login
      const loginReward = checkDailyLogin();
      if (loginReward) {
        setTimeout(() => addToast(loginReward, 'success'), 2000);
      }

      // Simulate loading time for suspense
      setTimeout(() => setIsReady(true), 1000);
    };
    initApp();

    // 4. Heartbeat Loop (Check every minute)
    const interval = setInterval(() => {
      regenerateCasts();
    }, 60000);

    return () => clearInterval(interval);
  }, [regenerateCasts, checkDailyLogin, addToast]);

  const handleTabChange = (tab: 'fish' | 'compete' | 'shop') => {
    triggerHaptic(Haptics.soft);
    setActiveTab(tab);
  };

  const handleOpenProfile = () => {
    triggerHaptic(Haptics.soft);
    setShowProfile(true);
  };

  if (!isReady) {
    return (
      <div className="h-screen w-screen bg-ocean-900 flex items-center justify-center text-white flex-col gap-4">
        <div className="text-6xl animate-bounce">🎣</div>
        <div className="font-black text-2xl tracking-[0.5em] animate-pulse text-sky-400">SEACASTER</div>
        <div className="text-xs text-ocean-400 uppercase tracking-widest mt-8">Loading Assets...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto relative bg-ocean-900 shadow-2xl overflow-hidden font-sans">
      <div className="absolute top-16 right-4 z-50">
        <WalletConnect />
      </div>
      {/* Landscape orientation warning */}
      <div className="landscape-warning">
        <div className="text-6xl mb-4">📱</div>
        <div className="text-xl font-bold">Please rotate to portrait mode</div>
        <div className="text-sm text-gray-400 mt-2">SeaCaster is designed for portrait orientation</div>
      </div>

      <ToastContainer />

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-ocean-900">
        {activeTab === 'fish' && (
          <>
            <GameHUD onOpenProfile={handleOpenProfile} />
            <FishingScene />
            <FishModal />
          </>
        )}
        {activeTab === 'compete' && <TournamentBoard onBack={() => handleTabChange('fish')} />}
        {activeTab === 'shop' && <MarketplaceTab onBack={() => handleTabChange('fish')} />}
      </div>

      {/* Modal Layer */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {/* Bottom Navigation */}
      <div className="h-24 bg-ocean-900/95 backdrop-blur-md border-t border-ocean-700 flex justify-around items-start pt-3 px-4 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <button
          onClick={() => handleTabChange('compete')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${activeTab === 'compete' ? 'text-yellow-400 scale-105' : 'text-ocean-400 hover:text-ocean-200'}`}
        >
          <Trophy size={26} strokeWidth={activeTab === 'compete' ? 3 : 2} className="transition-transform active:scale-90" />
          <span className="text-[10px] font-bold tracking-wide">Compete</span>
        </button>

        <button
          onClick={() => handleTabChange('fish')}
          className={`flex flex-col items-center justify-center -mt-10 w-20 h-20 rounded-full border-[6px] border-ocean-900 shadow-2xl transition-all ${activeTab === 'fish' ? 'bg-gradient-to-b from-sky-400 to-sky-600 text-white scale-110 ring-4 ring-sky-500/20 shadow-[0_0_20px_rgba(56,189,248,0.4)]' : 'bg-ocean-700 text-ocean-300'}`}
        >
          <Home size={32} fill={activeTab === 'fish' ? 'currentColor' : 'none'} className="drop-shadow-md" />
        </button>

        <button
          onClick={() => handleTabChange('shop')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${activeTab === 'shop' ? 'text-green-400 scale-105' : 'text-ocean-400 hover:text-ocean-200'}`}
        >
          <ShoppingBag size={26} strokeWidth={activeTab === 'shop' ? 3 : 2} className="transition-transform active:scale-90" />
          <span className="text-[10px] font-bold tracking-wide">Shop</span>
        </button>
      </div>

    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <Web3Provider>
      <SeaCasterApp />
    </Web3Provider>
  </ErrorBoundary>
);

export default App;