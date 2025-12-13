import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import { LEVEL_BASE_XP, LEVEL_EXPONENT, BAITS } from '../constants';
import { Zap, Settings, Gift, Home, ChevronDown, ArrowLeft } from 'lucide-react';
import DailyStreak from './DailyStreak';
import BaitSelector from './BaitSelector';

interface GameHUDProps {
  onOpenProfile: () => void;
  onBack?: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({ onOpenProfile, onBack }) => {
  const { userStats, inventory, openChest } = useGameStore();
  const { addToast } = useUIStore();
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const [isBaitOpen, setIsBaitOpen] = useState(false);
  const [isChestOpening, setIsChestOpening] = useState(false);

  const nextLevelXp = Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_EXPONENT, userStats.level));
  const progressPercent = Math.min(100, (userStats.xp / nextLevelXp) * 100);
  const activeBait = BAITS[inventory.activeBaitId];

  const handleOpenChest = async () => {
    setIsChestOpening(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const msg = openChest();
    addToast(msg, 'success');
    setIsChestOpening(false);
  };

  return (
    <>
      {/* Top HUD */}
      <div style={styles.topHud}>
        {/* Back Button */}
        {onBack && (
          <motion.button
            style={styles.backButton}
            onClick={onBack}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft size={24} color="white" />
          </motion.button>
        )}

        {/* Level & XP */}
        <motion.div
          style={styles.levelSection}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <motion.button
            onClick={onOpenProfile}
            style={styles.levelBadge}
            whileTap={{ scale: 0.95 }}
          >
            <span style={styles.levelNumber}>{userStats.level}</span>
            {userStats.premium && <span style={styles.crown}>👑</span>}
          </motion.button>

          <div style={styles.xpContainer}>
            <div style={styles.xpTrack}>
              <motion.div
                style={{ ...styles.xpFill, width: `${progressPercent}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
              />
              <span style={styles.xpPercent}>{Math.floor(progressPercent)}%</span>
            </div>
          </div>
        </motion.div>

        {/* Resources */}
        <motion.div
          style={styles.resourcesContainer}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          {/* Coins */}
          <div style={styles.resourcePill}>
            <span style={styles.coinSpin}>🪙</span>
            <span style={styles.resourceAmount}>{userStats.coins.toLocaleString()}</span>
            <button style={styles.addButton}>+</button>
          </div>

          {/* Streak */}
          <motion.button
            onClick={() => setIsStreakOpen(true)}
            style={styles.streakButton}
            whileTap={{ scale: 0.95 }}
          >
            <span style={styles.fireEmoji}>🔥</span>
            <span style={styles.streakNum}>{userStats.streak}</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Chest Alert */}
      <AnimatePresence>
        {userStats.pendingChests > 0 && (
          <motion.button
            onClick={handleOpenChest}
            disabled={isChestOpening}
            style={styles.chestButton}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileTap={{ scale: 0.95 }}
          >
            <Gift size={18} color="white" />
            <span style={styles.chestText}>
              {isChestOpening ? 'Opening...' : `Open Chest (${userStats.pendingChests})`}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom HUD */}
      <div style={styles.bottomHud}>
        {/* Energy */}
        <div style={{
          ...styles.energyPill,
          ...(userStats.castsRemaining === 0 && !userStats.premium ? styles.energyEmpty : {})
        }}>
          <Zap
            size={22}
            color={userStats.premium ? "#F4D03F" : "#5DADE2"}
            fill={userStats.premium ? "#F4D03F" : "#5DADE2"}
          />
          <div style={styles.energyInfo}>
            <span style={styles.energyLabel}>Energy</span>
            <span style={styles.energyValue}>
              {userStats.premium ? "∞" : `${userStats.castsRemaining}/${userStats.maxCasts}`}
            </span>
          </div>
        </div>

        {/* Bait Selector */}
        <motion.button
          onClick={() => setIsBaitOpen(true)}
          style={styles.baitButton}
          whileTap={{ scale: 0.98 }}
        >
          <span style={styles.baitIcon}>{activeBait?.icon || '🪱'}</span>
          <div style={styles.baitInfo}>
            <span style={styles.baitLabel}>Bait</span>
            <span style={styles.baitCount}>
              {inventory.baits[inventory.activeBaitId] >= 999 ? "∞" : inventory.baits[inventory.activeBaitId]}
            </span>
          </div>
          <ChevronDown size={16} color="rgba(255,255,255,0.5)" />
        </motion.button>
      </div>

      <DailyStreak isOpen={isStreakOpen} onClose={() => setIsStreakOpen(false)} />
      <BaitSelector isOpen={isBaitOpen} onClose={() => setIsBaitOpen(false)} />
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '12px 16px',
    paddingTop: 'max(12px, env(safe-area-inset-top))',
    zIndex: 40,
    pointerEvents: 'auto',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%)',
    border: '3px solid #1A5276',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 3px 0 #0E3A5E',
    marginRight: 8,
  },

  levelSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%)',
    border: '4px solid #F4D03F',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 0 #C19A00',
    position: 'relative',
  },

  levelNumber: {
    fontSize: 22,
    fontWeight: 900,
    color: 'white',
    textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
  },

  crown: {
    position: 'absolute',
    top: -10,
    right: -4,
    fontSize: 16,
  },

  xpContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },

  xpTrack: {
    width: 70,
    height: 14,
    background: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    overflow: 'hidden',
    border: '2px solid rgba(0,0,0,0.3)',
    position: 'relative',
  },

  xpFill: {
    height: '100%',
    background: 'linear-gradient(180deg, #58D68D 0%, #27AE60 100%)',
    borderRadius: 6,
  },

  xpPercent: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    fontWeight: 800,
    color: 'white',
    textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
  },

  resourcesContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },

  resourcePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    background: 'linear-gradient(180deg, #3D3D3D 0%, #2A2A2A 100%)',
    borderRadius: 16,
    border: '2px solid #1A1A1A',
  },

  coinSpin: {
    fontSize: 18,
    animation: 'spin 3s linear infinite',
  },

  resourceAmount: {
    fontSize: 14,
    fontWeight: 800,
    color: 'white',
    minWidth: 40,
    textAlign: 'center',
  },

  addButton: {
    width: 18,
    height: 18,
    borderRadius: 4,
    background: 'linear-gradient(180deg, #27AE60, #1E8449)',
    border: 'none',
    color: 'white',
    fontWeight: 900,
    fontSize: 12,
    cursor: 'pointer',
  },

  streakButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    background: 'linear-gradient(180deg, #F5B041 0%, #E67E22 100%)',
    border: '3px solid #AF601A',
    borderRadius: 10,
    cursor: 'pointer',
    boxShadow: '0 3px 0 #7E4510',
  },

  fireEmoji: {
    fontSize: 16,
  },

  streakNum: {
    fontSize: 14,
    fontWeight: 900,
    color: 'white',
    textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
  },

  chestButton: {
    position: 'absolute',
    top: 80,
    right: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'linear-gradient(180deg, #9B59B6 0%, #6C3483 100%)',
    border: '3px solid #4A235A',
    borderRadius: 12,
    cursor: 'pointer',
    boxShadow: '0 3px 0 #2E1A3E',
    zIndex: 40,
  },

  chestText: {
    fontSize: 12,
    fontWeight: 800,
    color: 'white',
  },

  bottomHud: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 40,
    pointerEvents: 'auto',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },

  energyPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'linear-gradient(180deg, #3D3D3D 0%, #2A2A2A 100%)',
    borderRadius: 14,
    border: '3px solid #1A1A1A',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },

  energyEmpty: {
    background: 'linear-gradient(180deg, #E74C3C 0%, #C0392B 100%)',
    borderColor: '#922B21',
  },

  energyInfo: {
    display: 'flex',
    flexDirection: 'column',
  },

  energyLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 700,
    textTransform: 'uppercase',
  },

  energyValue: {
    fontSize: 18,
    fontWeight: 900,
    color: 'white',
  },

  baitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'linear-gradient(180deg, #4A6741 0%, #3D5335 100%)',
    borderRadius: 14,
    border: '3px solid #2E4228',
    cursor: 'pointer',
    boxShadow: '0 4px 0 #1D2A19, 0 6px 12px rgba(0,0,0,0.4)',
  },

  baitIcon: {
    fontSize: 24,
  },

  baitInfo: {
    display: 'flex',
    flexDirection: 'column',
  },

  baitLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 700,
    textTransform: 'uppercase',
  },

  baitCount: {
    fontSize: 18,
    fontWeight: 900,
    color: 'white',
  },
};

export default GameHUD;