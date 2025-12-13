import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useUIStore } from '../store/uiStore';
import {
    Crown, Zap, Gift, Ticket, Fish, Star,
    ChevronLeft, Check, Lock, Sparkles, X
} from 'lucide-react';
import { BAITS } from '../constants';

interface ShopScreenProps {
    onBack: () => void;
}

type Tab = 'pass' | 'bait' | 'tickets' | 'items';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: 'USDC' | 'coins';
    icon: string;
    quantity?: number;
    popular?: boolean;
    bestValue?: boolean;
    type: 'bait' | 'ticket' | 'item';
}

const SHOP_ITEMS: ShopItem[] = [
    // Bait Bundles
    { id: 'bait_shrimp_5', name: 'Shrimp Pack', description: '5× Premium Shrimp', price: 100, currency: 'coins', icon: '🦐', quantity: 5, type: 'bait' },
    { id: 'bait_shrimp_20', name: 'Shrimp Bundle', description: '20× Premium Shrimp', price: 350, currency: 'coins', icon: '🦐', quantity: 20, popular: true, type: 'bait' },
    { id: 'bait_squid_5', name: 'Squid Pack', description: '5× Rare Squid', price: 250, currency: 'coins', icon: '🦑', quantity: 5, type: 'bait' },
    { id: 'bait_squid_20', name: 'Squid Bundle', description: '20× Rare Squid', price: 850, currency: 'coins', icon: '🦑', quantity: 20, bestValue: true, type: 'bait' },
    { id: 'bait_chum_3', name: 'Epic Chum', description: '3× Epic Chum', price: 500, currency: 'coins', icon: '🥩', quantity: 3, type: 'bait' },
    { id: 'bait_kraken_1', name: 'Kraken Bait', description: '1× Legendary Bait', price: 1000, currency: 'coins', icon: '👁️', quantity: 1, type: 'bait' },

    // Tournament Tickets
    { id: 'ticket_daily', name: 'Daily Entry', description: 'Daily Tournament Ticket', price: 0.50, currency: 'USDC', icon: '🎫', type: 'ticket' },
    { id: 'ticket_weekly', name: 'Weekly Entry', description: 'Weekly Tournament Ticket', price: 2.00, currency: 'USDC', icon: '🎟️', type: 'ticket' },
    { id: 'ticket_boss', name: 'Boss Battle', description: 'Weekend Boss Entry', price: 7.99, currency: 'USDC', icon: '👹', popular: true, type: 'ticket' },
    { id: 'ticket_champ', name: 'Championship', description: 'Grand Championship Entry', price: 50.00, currency: 'USDC', icon: '🏆', type: 'ticket' },
];

const ShopScreen: React.FC<ShopScreenProps> = ({ onBack }) => {
    const { userStats, purchaseSeasonPass, buyItem } = useGameStore();
    const { addToast } = useUIStore();
    const [activeTab, setActiveTab] = useState<Tab>('pass');
    const [purchaseModal, setPurchaseModal] = useState<ShopItem | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePurchase = async (item: ShopItem) => {
        setIsProcessing(true);

        // Simulate purchase delay
        await new Promise(r => setTimeout(r, 1000));

        if (item.currency === 'coins') {
            if (userStats.coins >= item.price) {
                // Map item type to store-compatible type
                const storeType = item.type === 'bait' ? 'bait' : 'other' as const;
                buyItem(item.id, item.price, storeType, item.quantity || 1);
                addToast(`Purchased ${item.name}!`, 'success');
            } else {
                addToast('Not enough coins!', 'error');
            }
        } else {
            // USDC purchase - would trigger wallet transaction
            addToast(`Processing ${item.name} purchase...`, 'info');
        }

        setIsProcessing(false);
        setPurchaseModal(null);
    };

    const handleSeasonPassPurchase = async () => {
        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 1500));
        purchaseSeasonPass();
        addToast('🎉 Season Pass Activated! Enjoy unlimited fishing!', 'success');
        setIsProcessing(false);
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'pass', label: 'Pass', icon: <Crown size={18} /> },
        { id: 'bait', label: 'Bait', icon: <span>🪱</span> },
        { id: 'tickets', label: 'Tickets', icon: <Ticket size={18} /> },
        { id: 'items', label: 'Items', icon: <Gift size={18} /> },
    ];

    return (
        <div className="shop-screen">
            {/* Background */}
            <div className="shop-bg" />

            {/* Header */}
            <motion.div
                className="shop-header"
                initial={{ y: -50 }}
                animate={{ y: 0 }}
            >
                <button className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="shop-title">TREASURE SHOP</h1>
                <div className="coins-display">
                    <span className="coin-icon">🪙</span>
                    <span className="coin-amount">{userStats.coins.toLocaleString()}</span>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="shop-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`shop-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="shop-content">
                <AnimatePresence mode="wait">
                    {/* Season Pass Tab */}
                    {activeTab === 'pass' && (
                        <motion.div
                            key="pass"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="pass-section"
                        >
                            {/* Season Pass Card */}
                            <div className={`season-pass-card ${userStats.premium ? 'owned' : ''}`}>
                                <div className="pass-header">
                                    <Crown className="pass-crown" />
                                    <h2>SEASON PASS</h2>
                                    <span className="pass-season">Season 1: Pirates</span>
                                </div>

                                <div className="pass-benefits">
                                    <div className="benefit-row">
                                        <Check className="check-icon" />
                                        <span>Unlimited Fishing (∞ casts)</span>
                                    </div>
                                    <div className="benefit-row">
                                        <Check className="check-icon" />
                                        <span>2× XP Multiplier</span>
                                    </div>
                                    <div className="benefit-row">
                                        <Check className="check-icon" />
                                        <span>Exclusive 5-Piece Pirate Rod</span>
                                    </div>
                                    <div className="benefit-row">
                                        <Check className="check-icon" />
                                        <span>Premium Daily Rewards</span>
                                    </div>
                                    <div className="benefit-row">
                                        <Check className="check-icon" />
                                        <span>Marketplace Selling Access</span>
                                    </div>
                                    <div className="benefit-row">
                                        <Check className="check-icon" />
                                        <span>1 Free Ad Skip Per Day</span>
                                    </div>
                                    <div className="benefit-row">
                                        <Check className="check-icon" />
                                        <span>Animated Badge & Title</span>
                                    </div>
                                </div>

                                {userStats.premium ? (
                                    <div className="pass-owned">
                                        <Sparkles className="sparkle-icon" />
                                        <span>PASS ACTIVE</span>
                                        <span className="days-left">54 days remaining</span>
                                    </div>
                                ) : (
                                    <motion.button
                                        className="purchase-pass-btn"
                                        onClick={handleSeasonPassPurchase}
                                        disabled={isProcessing}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isProcessing ? (
                                            <span>Processing...</span>
                                        ) : (
                                            <>
                                                <span className="price">$9.99</span>
                                                <span className="currency">USDC</span>
                                            </>
                                        )}
                                    </motion.button>
                                )}

                                <div className="pass-value">
                                    <span>💎 $100+ VALUE</span>
                                </div>
                            </div>

                            {/* Rod Preview */}
                            <div className="rod-preview">
                                <h3>Exclusive Pirate Rod</h3>
                                <div className="rod-pieces">
                                    <div className="rod-piece">
                                        <span className="piece-emoji">🦑</span>
                                        <span className="piece-name">Kraken Handle</span>
                                        <span className="piece-level">Lvl 10</span>
                                    </div>
                                    <div className="rod-piece">
                                        <span className="piece-emoji">⚓</span>
                                        <span className="piece-name">Barnacle Rod</span>
                                        <span className="piece-level">Lvl 20</span>
                                    </div>
                                    <div className="rod-piece">
                                        <span className="piece-emoji">🪝</span>
                                        <span className="piece-name">Anchor Hook</span>
                                        <span className="piece-level">Lvl 30</span>
                                    </div>
                                    <div className="rod-piece">
                                        <span className="piece-emoji">🔭</span>
                                        <span className="piece-name">Spyglass Reel</span>
                                        <span className="piece-level">Lvl 40</span>
                                    </div>
                                    <div className="rod-piece special">
                                        <span className="piece-emoji">🏴‍☠️</span>
                                        <span className="piece-name">Cannon Ship</span>
                                        <span className="piece-level">Lvl 50</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Bait Tab */}
                    {activeTab === 'bait' && (
                        <motion.div
                            key="bait"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="items-grid"
                        >
                            {SHOP_ITEMS.filter(i => i.type === 'bait').map(item => (
                                <motion.div
                                    key={item.id}
                                    className={`shop-item-card ${item.popular ? 'popular' : ''} ${item.bestValue ? 'best-value' : ''}`}
                                    onClick={() => setPurchaseModal(item)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {item.popular && <div className="tag popular-tag">POPULAR</div>}
                                    {item.bestValue && <div className="tag value-tag">BEST VALUE</div>}

                                    <span className="item-icon">{item.icon}</span>
                                    <h4 className="item-name">{item.name}</h4>
                                    <p className="item-desc">{item.description}</p>

                                    <div className="item-price">
                                        <span className="price-icon">{item.currency === 'coins' ? '🪙' : '💵'}</span>
                                        <span className="price-amount">{item.price.toLocaleString()}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Tickets Tab */}
                    {activeTab === 'tickets' && (
                        <motion.div
                            key="tickets"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="items-grid tickets"
                        >
                            {SHOP_ITEMS.filter(i => i.type === 'ticket').map(item => (
                                <motion.div
                                    key={item.id}
                                    className={`shop-item-card ticket-card ${item.popular ? 'popular' : ''}`}
                                    onClick={() => setPurchaseModal(item)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {item.popular && <div className="tag popular-tag">🔥 HOT</div>}

                                    <span className="item-icon">{item.icon}</span>
                                    <h4 className="item-name">{item.name}</h4>
                                    <p className="item-desc">{item.description}</p>

                                    <div className="item-price usdc">
                                        <span className="price-amount">${item.price.toFixed(2)}</span>
                                        <span className="price-currency">USDC</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Items Tab */}
                    {activeTab === 'items' && (
                        <motion.div
                            key="items"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="coming-soon"
                        >
                            <Gift size={64} className="coming-icon" />
                            <h3>More Items Coming Soon!</h3>
                            <p>Cosmetics, Rod Parts, and Special Items</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Purchase Modal */}
            <AnimatePresence>
                {purchaseModal && (
                    <motion.div
                        className="purchase-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isProcessing && setPurchaseModal(null)}
                    >
                        <motion.div
                            className="purchase-modal"
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 50 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                className="modal-close"
                                onClick={() => !isProcessing && setPurchaseModal(null)}
                            >
                                <X size={20} />
                            </button>

                            <span className="modal-icon">{purchaseModal.icon}</span>
                            <h3>{purchaseModal.name}</h3>
                            <p>{purchaseModal.description}</p>

                            <div className="modal-price">
                                {purchaseModal.currency === 'coins' ? (
                                    <>
                                        <span>🪙</span>
                                        <span>{purchaseModal.price.toLocaleString()}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>${purchaseModal.price.toFixed(2)}</span>
                                        <span className="usdc-label">USDC</span>
                                    </>
                                )}
                            </div>

                            {purchaseModal.currency === 'coins' && userStats.coins < purchaseModal.price && (
                                <p className="not-enough">Not enough coins!</p>
                            )}

                            <motion.button
                                className="confirm-purchase-btn"
                                onClick={() => handlePurchase(purchaseModal)}
                                disabled={isProcessing || (purchaseModal.currency === 'coins' && userStats.coins < purchaseModal.price)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isProcessing ? 'Processing...' : 'PURCHASE'}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        .shop-screen {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          font-family: 'Nunito', sans-serif;
        }

        .shop-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, #2C3E50 0%, #1A252F 50%, #0D1B2A 100%);
          z-index: 0;
        }

        .shop-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          position: relative;
          z-index: 10;
          background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
        }

        .back-btn {
          width: 44px;
          height: 44px;
          background: linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%);
          border: 3px solid #1A5276;
          border-radius: 12px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 0 #0E3A5E;
        }

        .back-btn:active {
          transform: translateY(4px);
          box-shadow: none;
        }

        .shop-title {
          font-family: 'Lilita One', cursive;
          font-size: 24px;
          color: #F4D03F;
          text-shadow: 2px 2px 0 #B7950B, 0 0 10px rgba(244,208,63,0.3);
          letter-spacing: 2px;
        }

        .coins-display {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(180deg, #3D3D3D 0%, #2A2A2A 100%);
          border: 3px solid #1A1A1A;
          border-radius: 20px;
          padding: 6px 14px;
        }

        .coin-icon { font-size: 20px; }
        .coin-amount {
          font-family: 'Lilita One', cursive;
          font-size: 16px;
          color: white;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        }

        .shop-tabs {
          display: flex;
          gap: 6px;
          padding: 0 16px 12px;
          position: relative;
          z-index: 10;
        }

        .shop-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: rgba(255,255,255,0.08);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: rgba(255,255,255,0.5);
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .shop-tab.active {
          background: linear-gradient(180deg, #F4D03F 0%, #D4AC0D 100%);
          border-color: #9A7D0A;
          color: #5D4E0D;
          box-shadow: 0 3px 0 #7D6608;
        }

        .shop-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px 24px;
          position: relative;
          z-index: 5;
        }

        /* Season Pass Card */
        .season-pass-card {
          background: linear-gradient(180deg, #5A7A52 0%, #4A6741 50%, #3D5335 100%);
          border: 5px solid #5D4E37;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 8px 0 #3D3426, 0 12px 25px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
        }

        .season-pass-card.owned {
          border-color: #27AE60;
        }

        .pass-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .pass-crown {
          width: 48px;
          height: 48px;
          color: #F4D03F;
          filter: drop-shadow(0 4px 8px rgba(244,208,63,0.4));
          margin-bottom: 8px;
        }

        .pass-header h2 {
          font-family: 'Lilita One', cursive;
          font-size: 28px;
          color: #F4D03F;
          text-shadow: 2px 2px 0 #B7950B;
          margin: 0;
        }

        .pass-season {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          font-weight: 600;
        }

        .pass-benefits {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .benefit-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .check-icon {
          width: 20px;
          height: 20px;
          color: #27AE60;
        }

        .purchase-pass-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: linear-gradient(180deg, #58D68D 0%, #27AE60 50%, #1E8449 100%);
          border: 4px solid #145A32;
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 5px 0 #0B3D20;
        }

        .purchase-pass-btn:active:not(:disabled) {
          transform: translateY(5px);
          box-shadow: none;
        }

        .purchase-pass-btn .price {
          font-family: 'Lilita One', cursive;
          font-size: 28px;
          color: white;
          text-shadow: 2px 2px 0 #145A32;
        }

        .purchase-pass-btn .currency {
          font-size: 14px;
          color: rgba(255,255,255,0.8);
          font-weight: 700;
        }

        .pass-owned {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 16px;
          background: linear-gradient(180deg, #27AE60 0%, #1E8449 100%);
          border-radius: 12px;
          color: white;
          font-family: 'Lilita One', cursive;
          font-size: 18px;
        }

        .sparkle-icon { color: #F4D03F; }
        .days-left { font-family: 'Nunito', sans-serif; font-size: 12px; opacity: 0.8; }

        .pass-value {
          text-align: center;
          margin-top: 12px;
          font-family: 'Lilita One', cursive;
          font-size: 14px;
          color: #F4D03F;
        }

        /* Rod Preview */
        .rod-preview {
          background: linear-gradient(180deg, #3D3D3D 0%, #2A2A2A 100%);
          border: 3px solid #1A1A1A;
          border-radius: 16px;
          padding: 16px;
        }

        .rod-preview h3 {
          text-align: center;
          font-family: 'Lilita One', cursive;
          font-size: 18px;
          color: #F4D03F;
          margin: 0 0 12px;
        }

        .rod-pieces {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rod-piece {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          border: 2px solid rgba(255,255,255,0.1);
        }

        .rod-piece.special {
          background: linear-gradient(90deg, rgba(244,208,63,0.2), rgba(244,208,63,0.05));
          border-color: rgba(244,208,63,0.4);
        }

        .piece-emoji { font-size: 24px; }
        .piece-name { flex: 1; color: white; font-weight: 700; font-size: 14px; }
        .piece-level { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600; }

        /* Items Grid */
        .items-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .items-grid.tickets {
          grid-template-columns: 1fr;
        }

        .shop-item-card {
          background: linear-gradient(180deg, #4A6741 0%, #3D5335 100%);
          border: 3px solid #2E4228;
          border-radius: 14px;
          padding: 16px;
          text-align: center;
          cursor: pointer;
          position: relative;
          box-shadow: 0 4px 0 #1D2A19;
        }

        .shop-item-card:active {
          transform: translateY(4px);
          box-shadow: none;
        }

        .shop-item-card.popular { border-color: #E67E22; }
        .shop-item-card.best-value { border-color: #27AE60; }

        .tag {
          position: absolute;
          top: -8px;
          right: -8px;
          padding: 4px 10px;
          font-size: 10px;
          font-weight: 800;
          color: white;
          border-radius: 8px;
        }

        .popular-tag { background: linear-gradient(180deg, #E67E22 0%, #D35400 100%); }
        .value-tag { background: linear-gradient(180deg, #27AE60 0%, #1E8449 100%); }

        .item-icon { font-size: 40px; display: block; margin-bottom: 8px; }
        .item-name { font-family: 'Lilita One', cursive; font-size: 16px; color: white; margin: 0 0 4px; }
        .item-desc { font-size: 11px; color: rgba(255,255,255,0.6); margin: 0 0 12px; }

        .item-price {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: linear-gradient(180deg, #3D3D3D 0%, #2A2A2A 100%);
          border: 2px solid #1A1A1A;
          border-radius: 10px;
          padding: 8px 14px;
        }

        .item-price.usdc {
          background: linear-gradient(180deg, #3498DB 0%, #2980B9 100%);
          border-color: #1F618D;
        }

        .price-icon { font-size: 18px; }
        .price-amount { font-family: 'Lilita One', cursive; font-size: 18px; color: white; }
        .price-currency { font-size: 10px; color: rgba(255,255,255,0.7); }

        .ticket-card {
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
          padding: 14px 20px;
        }

        .ticket-card .item-icon { font-size: 36px; margin: 0; }
        .ticket-card .item-name { font-size: 18px; }
        .ticket-card .item-desc { margin: 0; }
        .ticket-card .item-price { margin-left: auto; }

        /* Coming Soon */
        .coming-soon {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: rgba(255,255,255,0.5);
        }

        .coming-icon { margin-bottom: 16px; opacity: 0.4; }
        .coming-soon h3 { font-family: 'Lilita One', cursive; font-size: 20px; color: rgba(255,255,255,0.7); margin: 0 0 8px; }
        .coming-soon p { font-size: 14px; margin: 0; }

        /* Purchase Modal */
        .purchase-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 100;
        }

        .purchase-modal {
          width: 100%;
          max-width: 320px;
          background: linear-gradient(180deg, #5A7A52 0%, #4A6741 50%, #3D5335 100%);
          border: 5px solid #5D4E37;
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          position: relative;
          box-shadow: 0 8px 0 #3D3426;
        }

        .modal-close {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          background: linear-gradient(180deg, #E74C3C 0%, #C0392B 100%);
          border: 2px solid #922B21;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-icon { font-size: 56px; display: block; margin-bottom: 12px; }
        .purchase-modal h3 { font-family: 'Lilita One', cursive; font-size: 22px; color: white; margin: 0 0 4px; }
        .purchase-modal p { font-size: 14px; color: rgba(255,255,255,0.6); margin: 0 0 20px; }

        .modal-price {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Lilita One', cursive;
          font-size: 28px;
          color: #F4D03F;
          margin-bottom: 20px;
        }

        .usdc-label { font-size: 14px; color: rgba(255,255,255,0.7); }

        .not-enough {
          color: #E74C3C;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .confirm-purchase-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(180deg, #58D68D 0%, #27AE60 50%, #1E8449 100%);
          border: 4px solid #145A32;
          border-radius: 12px;
          font-family: 'Lilita One', cursive;
          font-size: 18px;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 0 #0B3D20;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .confirm-purchase-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .confirm-purchase-btn:active:not(:disabled) {
          transform: translateY(4px);
          box-shadow: none;
        }
      `}</style>
        </div>
    );
};

export default ShopScreen;
