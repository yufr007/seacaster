import React, { useState, useEffect } from 'react';
import FishingScene from './components/FishingScene';
import GameHUD from './components/GameHUD';
import FishModal from './components/FishModal';
import TournamentBoard from './components/TournamentBoard';
import ShopScreen from './components/ShopScreen';
import ProfileScreen from './components/ProfileScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { Home, Trophy, ShoppingBag } from 'lucide-react';

import { MenuScreen } from './components/MenuScreen';
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
  const [screen, setScreen] = useState<'menu' | 'game' | 'shop'>('menu');
  const [isReady, setIsReady] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { userStats, regenerateCasts, checkDailyLogin, syncPremiumStatus } = useGameStore();
  const { addToast } = useUIStore();

  // Web3 state sync
  const { address, isConnected } = useAccount();
  const { checkSeasonPass } = useContracts();

  // PWA Features: Keep screen on during fishing
  useWakeLock(screen === 'game');

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
      const screenAny = window.screen as any;
      if (screenAny.orientation && screenAny.orientation.lock) {
        try {
          await screenAny.orientation.lock('portrait');
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

  // Haptic feedback wrapper
  const handleScreenChange = (newScreen: 'menu' | 'game' | 'shop') => {
    triggerHaptic(Haptics.soft);
    setScreen(newScreen);
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
      <div className="absolute top-4 right-4 z-50">
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
      <div className="flex-1 relative overflow-hidden bg-ocean-900 h-full">
        {screen === 'menu' && (
          <MenuScreen
            onCompete={() => handleScreenChange('game')}
            onShop={() => handleScreenChange('shop')}
            onConnect={() => console.log('Connect wallet clicked')}
            xp={userStats.xp}
            coins={userStats.coins}
          />
        )}

        {screen === 'game' && (
          <>
            <GameHUD onOpenProfile={handleOpenProfile} />
            <FishingScene onBack={() => handleScreenChange('menu')} />
            <FishModal />
          </>
        )}

        {/* Keeping TournamentBoard accessible via Compete flow if needed, or integrating into Menu later.
            For now, 'Compete' button on Menu goes to 'game' (Fishing) per user request, 
            Usage of TournamentBoard might be inside GameHUD or separate. 
            The workflow logic said "onCompete={() => setScreen('game')}", so sticking to that.
        */}

        {screen === 'shop' && (
          <ShopScreen onBack={() => handleScreenChange('menu')} />
        )}
      </div>

      {/* Modal Layer */}
      <ProfileScreen isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <LeaderboardScreen isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

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