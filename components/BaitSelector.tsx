import React from 'react';
import { useGameStore } from '../store/gameStore';
import { BAITS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Lock } from 'lucide-react';
import { triggerHaptic, Haptics } from '../utils/haptics';
import { Rarity } from '../types';

interface BaitSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const RARITY_STYLES: Record<Rarity, { border: string; glow: string; badge: string }> = {
  [Rarity.COMMON]: {
    border: '#95A5A6',
    glow: 'none',
    badge: 'linear-gradient(180deg, #BDC3C7 0%, #95A5A6 100%)'
  },
  [Rarity.UNCOMMON]: {
    border: '#27AE60',
    glow: '0 0 10px rgba(39, 174, 96, 0.3)',
    badge: 'linear-gradient(180deg, #58D68D 0%, #27AE60 100%)'
  },
  [Rarity.RARE]: {
    border: '#3498DB',
    glow: '0 0 15px rgba(52, 152, 219, 0.4)',
    badge: 'linear-gradient(180deg, #5DADE2 0%, #3498DB 100%)'
  },
  [Rarity.EPIC]: {
    border: '#9B59B6',
    glow: '0 0 20px rgba(155, 89, 182, 0.5)',
    badge: 'linear-gradient(180deg, #BB8FCE 0%, #9B59B6 100%)'
  },
  [Rarity.LEGENDARY]: {
    border: '#F39C12',
    glow: '0 0 25px rgba(243, 156, 18, 0.6)',
    badge: 'linear-gradient(180deg, #F4D03F 0%, #F39C12 100%)'
  },
  [Rarity.MYTHIC]: {
    border: '#E74C3C',
    glow: '0 0 30px rgba(231, 76, 60, 0.7)',
    badge: 'linear-gradient(180deg, #F1948A 0%, #E74C3C 100%)'
  }
};

// Premium bait image mappings
const BAIT_IMAGES: Record<string, string> = {
  'worm': '/assets/bait/bait_worm_1765863155303.png',
  'shrimp': '/assets/bait/bait_shrimp_1765863173083.png',
  'squid': '/assets/bait/bait_squid_1765863189969.png',
  'lure': '/assets/bait/bait_minnow_1765863236305.png', // Using minnow for lure
  'chum': '/assets/bait/bait_legendary_chum_1765863253233.png',
  'kraken_eye': '/assets/bait/bait_kraken_eye.png.jpg',
};



const BaitSelector: React.FC<BaitSelectorProps> = ({ isOpen, onClose }) => {
  const { inventory, setActiveBait } = useGameStore();
  const activeBaitId = inventory.activeBaitId;

  const handleSelect = (id: string) => {
    triggerHaptic(Haptics.soft);
    setActiveBait(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="bait-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bait-modal"
            initial={{ y: 100, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 100, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Tackle Box Image */}
            <div className="modal-header">
              <img
                src="/assets/ui/bait_box.png"
                alt="Tackle Box"
                className="header-icon"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <h2 className="modal-title">⚓ Tackle Box</h2>
              <button className="close-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {/* Bait Grid */}
            <div className="bait-grid">
              {Object.values(BAITS).map((bait) => {
                const count = inventory.baits[bait.id] || 0;
                const isActive = activeBaitId === bait.id;
                const isLocked = count <= 0 && bait.id !== 'worm';
                const rarityStyle = RARITY_STYLES[bait.rarity as Rarity] || RARITY_STYLES[Rarity.COMMON];

                return (
                  <motion.button
                    key={bait.id}
                    className={`bait-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                    onClick={() => !isLocked && handleSelect(bait.id)}
                    disabled={isLocked}
                    whileTap={{ scale: isLocked ? 1 : 0.95 }}
                    style={{
                      borderColor: isActive ? rarityStyle.border : 'rgba(255,255,255,0.2)',
                      boxShadow: isActive ? rarityStyle.glow : 'none'
                    }}
                  >
                    {/* Rarity Badge */}
                    <div
                      className="rarity-badge"
                      style={{ background: rarityStyle.badge }}
                    >
                      {bait.rarity}
                    </div>

                    {/* Bait Icon */}
                    <div className="bait-icon">
                      {BAIT_IMAGES[bait.id] ? (
                        <img
                          src={BAIT_IMAGES[bait.id]}
                          alt={bait.name}
                          className="bait-img"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span style={{ display: BAIT_IMAGES[bait.id] ? 'none' : 'block' }}>{bait.icon}</span>
                    </div>

                    {/* Bait Name */}
                    <div className="bait-name">{bait.name}</div>

                    {/* Effect */}
                    <div className="bait-effect">{bait.description}</div>

                    {/* Count */}
                    <div className="bait-count">
                      {bait.id === 'worm' ? '∞' : `x${count}`}
                    </div>

                    {/* Active Checkmark */}
                    {isActive && (
                      <div className="active-check">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}

                    {/* Lock Overlay */}
                    {isLocked && (
                      <div className="lock-overlay">
                        <Lock size={24} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer Tip */}
            <div className="modal-footer">
              💡 Better bait = better fish chances!
            </div>
          </motion.div>

          <style>{`
            .bait-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.85);
              backdrop-filter: blur(8px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 100;
              padding: 20px;
            }

            .bait-modal {
              width: 100%;
              max-width: 380px;
              max-height: 85vh;
              background: linear-gradient(180deg, #2C3E50 0%, #1A252F 100%);
              border: 4px solid #5D4E37;
              border-radius: 24px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              box-shadow: 0 10px 0 #3D3426, 0 15px 40px rgba(0, 0, 0, 0.6);
            }

            .modal-header {
              position: relative;
              background: linear-gradient(180deg, #5D4E37 0%, #3D3426 100%);
              padding: 16px 20px;
              display: flex;
              align-items: center;
              gap: 12px;
              border-bottom: 3px solid #2D2419;
            }

            .header-icon {
              width: 48px;
              height: 48px;
              object-fit: contain;
            }

            .modal-title {
              flex: 1;
              color: #F4D03F;
              font-size: 22px;
              font-weight: 800;
              margin: 0;
              text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
            }

            .close-btn {
              width: 36px;
              height: 36px;
              background: linear-gradient(180deg, #E74C3C 0%, #C0392B 100%);
              border: 3px solid #922B21;
              border-radius: 10px;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              box-shadow: 0 3px 0 #641E16;
            }

            .close-btn:active {
              transform: translateY(3px);
              box-shadow: none;
            }

            .bait-grid {
              flex: 1;
              overflow-y: auto;
              padding: 16px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }

            .bait-card {
              position: relative;
              background: linear-gradient(180deg, #34495E 0%, #2C3E50 100%);
              border: 3px solid rgba(255,255,255,0.2);
              border-radius: 16px;
              padding: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .bait-card.active {
              background: linear-gradient(180deg, #2E4053 0%, #1C2833 100%);
            }

            .bait-card.locked {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .rarity-badge {
              position: absolute;
              top: -6px;
              right: -6px;
              padding: 2px 8px;
              border-radius: 8px;
              font-size: 9px;
              font-weight: 800;
              color: white;
              text-transform: uppercase;
              text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
              border: 2px solid rgba(255,255,255,0.3);
            }

            .bait-icon {
              width: 56px;
              height: 56px;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              margin-bottom: 8px;
              overflow: hidden;
            }

            .bait-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              border-radius: 10px;
            }

            .bait-name {
              color: white;
              font-size: 13px;
              font-weight: 700;
              text-align: center;
              margin-bottom: 4px;
            }

            .bait-effect {
              color: rgba(255,255,255,0.6);
              font-size: 10px;
              text-align: center;
              line-height: 1.3;
              margin-bottom: 8px;
            }

            .bait-count {
              background: rgba(0,0,0,0.4);
              padding: 4px 12px;
              border-radius: 10px;
              color: white;
              font-size: 12px;
              font-weight: 700;
            }

            .active-check {
              position: absolute;
              top: 8px;
              left: 8px;
              width: 24px;
              height: 24px;
              background: linear-gradient(180deg, #27AE60 0%, #1E8449 100%);
              border: 2px solid #196F3D;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            }

            .lock-overlay {
              position: absolute;
              inset: 0;
              background: rgba(0,0,0,0.6);
              border-radius: 13px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: rgba(255,255,255,0.5);
            }

            .modal-footer {
              padding: 12px 16px;
              background: rgba(0,0,0,0.3);
              text-align: center;
              color: rgba(255,255,255,0.7);
              font-size: 12px;
              font-weight: 600;
              border-top: 2px solid rgba(255,255,255,0.1);
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BaitSelector;
