import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { BAITS } from '../constants';
import {
    BAIT_RECIPES,
    CRAFTED_BAITS,
    getAvailableRecipes,
    craftBait,
    getBaitRarityColor,
    BaitRecipe,
} from '../baitCrafting';
import { Rarity } from '../types';
import { triggerHaptic, Haptics } from '../utils/haptics';
import { ChevronLeft, Beaker, Check, Lock, Sparkles } from 'lucide-react';

interface BaitCraftingScreenProps {
    onBack: () => void;
}

const BaitCraftingScreen: React.FC<BaitCraftingScreenProps> = ({ onBack }) => {
    const { userStats, inventory } = useGameStore();
    const [selectedRecipe, setSelectedRecipe] = useState<BaitRecipe | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Get available recipes based on inventory and level
    const availableRecipes = useMemo(
        () => getAvailableRecipes(inventory.baits, userStats.level),
        [inventory.baits, userStats.level]
    );

    // Check if recipe can be crafted
    const canCraft = (recipe: BaitRecipe): boolean => {
        return availableRecipes.some((r) => r.id === recipe.id);
    };

    // Check if recipe is unlocked (level requirement met)
    const isUnlocked = (recipe: BaitRecipe): boolean => {
        return userStats.level >= recipe.unlockLevel;
    };

    // Handle craft button
    const handleCraft = () => {
        if (!selectedRecipe) return;

        const result = craftBait(selectedRecipe, inventory.baits);
        if (result.success) {
            // Update inventory
            useGameStore.setState((state) => ({
                inventory: {
                    ...state.inventory,
                    baits: result.newInventory,
                },
            }));

            triggerHaptic(Haptics.success);
            setSuccessMessage(result.message);
            setShowSuccess(true);

            setTimeout(() => {
                setShowSuccess(false);
                setSelectedRecipe(null);
            }, 2000);
        } else {
            triggerHaptic(Haptics.fail);
        }
    };

    const getIngredientIcon = (baitId: string): string => {
        return BAITS[baitId]?.icon || '/assets/bait/bait_worm_1765863155303.png';
    };

    const getIngredientName = (baitId: string): string => {
        return BAITS[baitId]?.name || baitId;
    };

    return (
        <div className="crafting-screen">
            {/* Header */}
            <div className="screen-header">
                <button className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <div className="header-title">
                    <Beaker size={24} />
                    <span>BAIT CRAFTING</span>
                </div>
                <div className="level-badge">Lv.{userStats.level}</div>
            </div>

            {/* Recipe Grid */}
            <div className="recipe-grid">
                {BAIT_RECIPES.map((recipe) => {
                    const unlocked = isUnlocked(recipe);
                    const available = canCraft(recipe);
                    const craftedBait = CRAFTED_BAITS[recipe.result.baitId];

                    return (
                        <motion.div
                            key={recipe.id}
                            className={`recipe-card ${unlocked ? '' : 'locked'} ${available ? 'available' : ''} ${selectedRecipe?.id === recipe.id ? 'selected' : ''
                                }`}
                            onClick={() => unlocked && setSelectedRecipe(recipe)}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                borderColor: unlocked ? getBaitRarityColor(recipe.rarity) : '#4B5563',
                            }}
                        >
                            {!unlocked && (
                                <div className="lock-overlay">
                                    <Lock size={24} />
                                    <span>Level {recipe.unlockLevel}</span>
                                </div>
                            )}

                            <div className="recipe-icon">
                                {craftedBait && <img src={craftedBait.icon} alt={recipe.name} />}
                            </div>

                            <span
                                className="recipe-name"
                                style={{ color: getBaitRarityColor(recipe.rarity) }}
                            >
                                {recipe.name}
                            </span>

                            <span className="recipe-rarity">{recipe.rarity}</span>

                            {available && (
                                <div className="available-badge">
                                    <Check size={14} />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Selected Recipe Details */}
            <AnimatePresence>
                {selectedRecipe && (
                    <motion.div
                        className="recipe-details"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                    >
                        <div className="details-header">
                            <span
                                className="details-title"
                                style={{ color: getBaitRarityColor(selectedRecipe.rarity) }}
                            >
                                {selectedRecipe.name}
                            </span>
                            <span className="details-desc">{selectedRecipe.description}</span>
                        </div>

                        {/* Ingredients */}
                        <div className="ingredients">
                            <div className="ingredient">
                                <img
                                    src={getIngredientIcon(selectedRecipe.ingredients[0])}
                                    alt=""
                                />
                                <span>{getIngredientName(selectedRecipe.ingredients[0])}</span>
                                <span className="count">
                                    {inventory.baits[selectedRecipe.ingredients[0]] || 0}
                                </span>
                            </div>

                            <span className="plus">+</span>

                            <div className="ingredient">
                                <img
                                    src={getIngredientIcon(selectedRecipe.ingredients[1])}
                                    alt=""
                                />
                                <span>{getIngredientName(selectedRecipe.ingredients[1])}</span>
                                <span className="count">
                                    {inventory.baits[selectedRecipe.ingredients[1]] || 0}
                                </span>
                            </div>

                            <span className="equals">=</span>

                            <div className="result">
                                <img
                                    src={CRAFTED_BAITS[selectedRecipe.result.baitId]?.icon || ''}
                                    alt=""
                                />
                                <span>x{selectedRecipe.result.quantity}</span>
                            </div>
                        </div>

                        {/* Effect Preview */}
                        {CRAFTED_BAITS[selectedRecipe.result.baitId] && (
                            <div className="effect-preview">
                                <Sparkles size={16} />
                                <span>{CRAFTED_BAITS[selectedRecipe.result.baitId].effect}</span>
                            </div>
                        )}

                        {/* Craft Button */}
                        <motion.button
                            className={`craft-btn ${canCraft(selectedRecipe) ? '' : 'disabled'}`}
                            onClick={handleCraft}
                            disabled={!canCraft(selectedRecipe)}
                            whileTap={{ scale: 0.95 }}
                        >
                            {canCraft(selectedRecipe) ? 'CRAFT' : 'NOT ENOUGH INGREDIENTS'}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Animation */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        className="success-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="success-content"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <Check size={48} />
                            <span>{successMessage}</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inventory Bar */}
            <div className="inventory-bar">
                <span className="inv-title">YOUR BAIT</span>
                <div className="inv-items">
                    {Object.entries(BAITS).map(([id, bait]) => (
                        <div key={id} className="inv-item">
                            <img src={bait.icon} alt={bait.name} />
                            <span className="inv-count">{inventory.baits[id] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        .crafting-screen {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
          overflow-y: auto;
          padding-bottom: 120px;
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
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          font-size: 20px;
          font-weight: 800;
        }

        .level-badge {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
        }

        .recipe-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          padding: 16px;
        }

        .recipe-card {
          position: relative;
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .recipe-card.locked {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .recipe-card.available {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }

        .recipe-card.selected {
          background: rgba(255,255,255,0.1);
          transform: scale(1.02);
        }

        .lock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.7);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #9CA3AF;
        }

        .recipe-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .recipe-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .recipe-name {
          font-size: 14px;
          font-weight: 700;
          text-align: center;
        }

        .recipe-rarity {
          font-size: 10px;
          color: #9CA3AF;
          text-transform: uppercase;
        }

        .available-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: #10B981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .recipe-details {
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
          margin-bottom: 20px;
        }

        .details-title {
          display: block;
          font-size: 24px;
          font-weight: 800;
        }

        .details-desc {
          display: block;
          color: #9CA3AF;
          font-size: 14px;
          margin-top: 4px;
        }

        .ingredients {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .ingredient {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .ingredient img {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .ingredient span {
          font-size: 12px;
          color: white;
        }

        .ingredient .count {
          color: #10B981;
          font-weight: 700;
        }

        .plus, .equals {
          font-size: 24px;
          color: #9CA3AF;
          font-weight: 700;
        }

        .result {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .result img {
          width: 64px;
          height: 64px;
          object-fit: contain;
        }

        .result span {
          color: #F59E0B;
          font-weight: 700;
        }

        .effect-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #8B5CF6;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .craft-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #10B981, #059669);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
        }

        .craft-btn.disabled {
          background: #4B5563;
          cursor: not-allowed;
        }

        .success-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .success-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #10B981;
          font-size: 24px;
          font-weight: 700;
        }

        .inventory-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(10px);
          padding: 12px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .inv-title {
          display: block;
          text-align: center;
          font-size: 10px;
          color: #9CA3AF;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .inv-items {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .inv-item {
          position: relative;
          width: 40px;
          height: 40px;
        }

        .inv-item img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .inv-count {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background: #10B981;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
        }
      `}</style>
        </div>
    );
};

export default BaitCraftingScreen;
