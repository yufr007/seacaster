import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { COSMETIC_ITEMS, CosmeticItem, RARITY_GLOW_COLORS } from '../lootSystem';
import { Rarity } from '../types';
import { triggerHaptic, Haptics } from '../utils/haptics';
import { ChevronLeft, Crown, Medal, Wand2, Target, Sparkles, Check, Lock } from 'lucide-react';

interface CosmeticsScreenProps {
    onBack: () => void;
}

type CosmeticType = 'title' | 'badge' | 'rod_skin' | 'bobber' | 'trail_effect';

const CosmeticsScreen: React.FC<CosmeticsScreenProps> = ({ onBack }) => {
    const { inventory, equipCosmetic } = useGameStore();
    const [activeTab, setActiveTab] = useState<CosmeticType>('title');
    const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);

    // Filter cosmetics by type
    const filteredCosmetics = useMemo(() => {
        return COSMETIC_ITEMS.filter((item) => item.type === activeTab);
    }, [activeTab]);

    // Check if cosmetic is unlocked
    const isUnlocked = (item: CosmeticItem): boolean => {
        return inventory.unlockedCosmetics.includes(item.id);
    };

    // Check if cosmetic is equipped
    const isEquipped = (item: CosmeticItem): boolean => {
        switch (item.type) {
            case 'title': return inventory.equippedTitle === item.id;
            case 'badge': return inventory.equippedBadge === item.id;
            case 'rod_skin': return inventory.equippedRodSkin === item.id;
            case 'bobber': return inventory.equippedBobber === item.id;
            case 'trail_effect': return inventory.equippedTrail === item.id;
            default: return false;
        }
    };

    // Handle equip
    const handleEquip = (item: CosmeticItem) => {
        if (!isUnlocked(item)) return;

        triggerHaptic(Haptics.success);
        equipCosmetic(item.id, item.type as CosmeticType);
        setSelectedItem(null);
    };

    const getTabIcon = (type: CosmeticType) => {
        switch (type) {
            case 'title': return <Crown size={20} />;
            case 'badge': return <Medal size={20} />;
            case 'rod_skin': return <Wand2 size={20} />;
            case 'bobber': return <Target size={20} />;
            case 'trail_effect': return <Sparkles size={20} />;
        }
    };

    const getRarityColor = (rarity: Rarity): string => {
        return RARITY_GLOW_COLORS[rarity] || '#9CA3AF';
    };

    // Get currently equipped item display
    const getEquippedForType = (type: CosmeticType): CosmeticItem | null => {
        let equippedId: string | null = null;
        switch (type) {
            case 'title': equippedId = inventory.equippedTitle; break;
            case 'badge': equippedId = inventory.equippedBadge; break;
            case 'rod_skin': equippedId = inventory.equippedRodSkin; break;
            case 'bobber': equippedId = inventory.equippedBobber; break;
            case 'trail_effect': equippedId = inventory.equippedTrail; break;
        }
        if (!equippedId) return null;
        return COSMETIC_ITEMS.find((c) => c.id === equippedId) || null;
    };

    const equippedItem = getEquippedForType(activeTab);

    return (
        <div className="cosmetics-screen">
            {/* Header */}
            <div className="screen-header">
                <button className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <span className="header-title">COSMETICS</span>
                <div className="unlock-count">
                    {inventory.unlockedCosmetics.length}/{COSMETIC_ITEMS.length}
                </div>
            </div>

            {/* Currently Equipped Display */}
            <div className="equipped-section">
                <span className="section-label">EQUIPPED</span>
                {equippedItem ? (
                    <motion.div
                        className="equipped-display"
                        style={{ borderColor: getRarityColor(equippedItem.rarity) }}
                    >
                        {equippedItem.image ? (
                            <img src={equippedItem.image} alt={equippedItem.name} />
                        ) : (
                            <span className="equipped-name">{equippedItem.name}</span>
                        )}
                    </motion.div>
                ) : (
                    <div className="equipped-empty">None Equipped</div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="tab-nav">
                {(['title', 'badge', 'rod_skin', 'bobber', 'trail_effect'] as CosmeticType[]).map((type) => (
                    <button
                        key={type}
                        className={`tab-btn ${activeTab === type ? 'active' : ''}`}
                        onClick={() => setActiveTab(type)}
                    >
                        {getTabIcon(type)}
                        <span>{type.replace('_', ' ')}</span>
                    </button>
                ))}
            </div>

            {/* Cosmetics Grid */}
            <div className="cosmetics-grid">
                {filteredCosmetics.map((item) => {
                    const unlocked = isUnlocked(item);
                    const equipped = isEquipped(item);

                    return (
                        <motion.div
                            key={item.id}
                            className={`cosmetic-card ${unlocked ? 'unlocked' : 'locked'} ${equipped ? 'equipped' : ''}`}
                            onClick={() => unlocked && setSelectedItem(item)}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                borderColor: unlocked ? getRarityColor(item.rarity) : '#4B5563',
                            }}
                        >
                            {!unlocked && (
                                <div className="lock-overlay">
                                    <Lock size={24} />
                                </div>
                            )}

                            <div
                                className="rarity-glow"
                                style={{ backgroundColor: unlocked ? getRarityColor(item.rarity) : 'transparent' }}
                            />

                            {item.image ? (
                                <img src={item.image} alt={item.name} className="cosmetic-icon" />
                            ) : (
                                <div className="cosmetic-text">{item.name}</div>
                            )}

                            <span className="cosmetic-name">{item.name}</span>
                            <span className="cosmetic-rarity">{item.rarity}</span>

                            {equipped && (
                                <div className="equipped-badge">
                                    <Check size={14} />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Selected Item Details */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        className="item-details"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                    >
                        <div className="details-header">
                            <span
                                className="item-name"
                                style={{ color: getRarityColor(selectedItem.rarity) }}
                            >
                                {selectedItem.name}
                            </span>
                            <span className="item-rarity">{selectedItem.rarity}</span>
                        </div>

                        {selectedItem.image && (
                            <img src={selectedItem.image} alt="" className="item-preview" />
                        )}

                        <p className="item-desc">{selectedItem.description}</p>

                        <div className="detail-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => setSelectedItem(null)}
                            >
                                CANCEL
                            </button>
                            <button
                                className={`equip-btn ${isEquipped(selectedItem) ? 'equipped' : ''}`}
                                onClick={() => handleEquip(selectedItem)}
                            >
                                {isEquipped(selectedItem) ? 'EQUIPPED' : 'EQUIP'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        .cosmetics-screen {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
          overflow-y: auto;
          padding-bottom: 40px;
        }

        .screen-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          padding-top: max(16px, env(safe-area-inset-top));
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .back-btn {
          width: 44px;
          height: 44px;
          background: rgba(255,255,255,0.1);
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-title {
          font-size: 20px;
          font-weight: 800;
          color: white;
        }

        .unlock-count {
          background: rgba(139, 92, 246, 0.3);
          color: #A78BFA;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
        }

        .equipped-section {
          padding: 20px;
          text-align: center;
        }

        .section-label {
          display: block;
          font-size: 12px;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }

        .equipped-display {
          width: 120px;
          height: 120px;
          margin: 0 auto;
          background: rgba(255,255,255,0.05);
          border: 3px solid;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .equipped-display img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .equipped-name {
          color: white;
          font-weight: 700;
          text-align: center;
        }

        .equipped-empty {
          color: #6B7280;
          font-style: italic;
        }

        .tab-nav {
          display: flex;
          gap: 8px;
          padding: 0 16px;
          overflow-x: auto;
          margin-bottom: 16px;
        }

        .tab-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #9CA3AF;
          white-space: nowrap;
          font-size: 10px;
          text-transform: uppercase;
          min-width: 70px;
        }

        .tab-btn.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: #8B5CF6;
          color: #A78BFA;
        }

        .cosmetics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 0 16px;
        }

        .cosmetic-card {
          position: relative;
          background: rgba(255,255,255,0.05);
          border: 2px solid;
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }

        .cosmetic-card.locked {
          opacity: 0.5;
        }

        .cosmetic-card.equipped {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
        }

        .lock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6B7280;
          z-index: 5;
        }

        .rarity-glow {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          opacity: 0.2;
          filter: blur(40px);
          pointer-events: none;
        }

        .cosmetic-icon {
          width: 48px;
          height: 48px;
          object-fit: contain;
          position: relative;
          z-index: 1;
        }

        .cosmetic-text {
          font-size: 12px;
          color: white;
          font-weight: 700;
          text-align: center;
        }

        .cosmetic-name {
          font-size: 10px;
          color: white;
          font-weight: 600;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .cosmetic-rarity {
          font-size: 8px;
          color: #9CA3AF;
          text-transform: uppercase;
          position: relative;
          z-index: 1;
        }

        .equipped-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          background: #10B981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 6;
        }

        .item-details {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, #1E293B 0%, #0F172A 100%);
          border-top: 2px solid rgba(255,255,255,0.1);
          border-radius: 24px 24px 0 0;
          padding: 24px;
          padding-bottom: max(24px, env(safe-area-inset-bottom));
          z-index: 20;
        }

        .details-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .item-name {
          display: block;
          font-size: 24px;
          font-weight: 800;
        }

        .item-rarity {
          font-size: 12px;
          color: #9CA3AF;
          text-transform: uppercase;
        }

        .item-preview {
          display: block;
          width: 80px;
          height: 80px;
          object-fit: contain;
          margin: 0 auto 16px;
        }

        .item-desc {
          color: #9CA3AF;
          text-align: center;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .detail-actions {
          display: flex;
          gap: 12px;
        }

        .cancel-btn {
          flex: 1;
          padding: 14px;
          background: rgba(255,255,255,0.1);
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          color: white;
          font-weight: 700;
        }

        .equip-btn {
          flex: 2;
          padding: 14px;
          background: linear-gradient(135deg, #8B5CF6, #7C3AED);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 800;
          font-size: 16px;
        }

        .equip-btn.equipped {
          background: #10B981;
        }
      `}</style>
        </div>
    );
};

export default CosmeticsScreen;
