import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Shield, Zap, Heart, Trophy, Clock, Target } from 'lucide-react';
import { triggerHaptic, Haptics } from '../utils/haptics';

interface BossBattleProps {
    isOpen: boolean;
    onClose: () => void;
    onVictory: (rewards: BossRewards) => void;
}

interface BossRewards {
    xp: number;
    coins: number;
    specialItem?: string;
}

// Boss configurations for Weekend leagues
const BOSSES = [
    { id: 'kraken', name: 'The Kraken', emoji: '🦑', hp: 100, attack: 15, weakness: 'lightning', color: '#8B5CF6' },
    { id: 'leviathan', name: 'Leviathan', emoji: '🐉', hp: 150, attack: 20, weakness: 'ice', color: '#06B6D4' },
    { id: 'megalodon', name: 'Ghost Megalodon', emoji: '🦈', hp: 120, attack: 25, weakness: 'light', color: '#6B7280' },
    { id: 'siren', name: 'Siren Queen', emoji: '🧜‍♀️', hp: 80, attack: 30, weakness: 'music', color: '#EC4899' },
    { id: 'poseidon', name: 'Poseidon\'s Shade', emoji: '🔱', hp: 200, attack: 35, weakness: 'mortal', color: '#3B82F6' },
    { id: 'charybdis', name: 'Charybdis', emoji: '🌊', hp: 180, attack: 18, weakness: 'anchor', color: '#14B8A6' },
    { id: 'hydra', name: 'Sea Hydra', emoji: '🐍', hp: 160, attack: 22, weakness: 'fire', color: '#22C55E' },
    { id: 'davy', name: 'Davy Jones', emoji: '🏴‍☠️', hp: 250, attack: 40, weakness: 'love', color: '#EF4444' },
];

type BattlePhase = 'intro' | 'fighting' | 'victory' | 'defeat';

const BossBattle: React.FC<BossBattleProps> = ({ isOpen, onClose, onVictory }) => {
    const [phase, setPhase] = useState<BattlePhase>('intro');
    const [boss, setBoss] = useState(BOSSES[0]);
    const [bossHp, setBossHp] = useState(100);
    const [playerHp, setPlayerHp] = useState(100);
    const [attempts, setAttempts] = useState(2);
    const [isAttacking, setIsAttacking] = useState(false);
    const [combo, setCombo] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [showDamage, setShowDamage] = useState<{ value: number; x: number } | null>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            const randomBoss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
            setBoss(randomBoss);
            setBossHp(100);
            setPlayerHp(100);
            setPhase('intro');
            setCombo(0);
            setTimeLeft(30);
        }
    }, [isOpen]);

    // Battle timer
    useEffect(() => {
        if (phase !== 'fighting' || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setPhase('defeat');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    // Boss attacks player periodically
    useEffect(() => {
        if (phase !== 'fighting') return;

        const attackInterval = setInterval(() => {
            const damage = Math.floor(Math.random() * 15) + 5;
            setPlayerHp(prev => {
                const newHp = prev - damage;
                if (newHp <= 0) {
                    setPhase('defeat');
                    return 0;
                }
                return newHp;
            });
            triggerHaptic(Haptics.heavy);
        }, 2500);

        return () => clearInterval(attackInterval);
    }, [phase]);

    const handleStartBattle = () => {
        setPhase('fighting');
        setTimeLeft(30);
        triggerHaptic(Haptics.medium);
    };

    const handleAttack = useCallback(() => {
        if (isAttacking || phase !== 'fighting') return;

        setIsAttacking(true);
        triggerHaptic(Haptics.medium);

        // Calculate damage with combo bonus
        const baseDamage = 8 + Math.floor(Math.random() * 7);
        const comboMultiplier = 1 + (combo * 0.1);
        const totalDamage = Math.floor(baseDamage * comboMultiplier);

        // Show damage number
        setShowDamage({ value: totalDamage, x: 40 + Math.random() * 20 });
        setTimeout(() => setShowDamage(null), 600);

        // Update boss HP
        setBossHp(prev => {
            const newHp = prev - totalDamage;
            if (newHp <= 0) {
                setPhase('victory');
                triggerHaptic(Haptics.legendaryCatch);
                return 0;
            }
            return newHp;
        });

        // Increase combo
        setCombo(prev => Math.min(10, prev + 1));

        setTimeout(() => setIsAttacking(false), 200);
    }, [isAttacking, phase, combo]);

    const handleVictory = () => {
        const rewards: BossRewards = {
            xp: 500 + combo * 50,
            coins: 200 + combo * 20,
            specialItem: combo >= 5 ? 'Kraken Eye Bait' : undefined,
        };
        onVictory(rewards);
        onClose();
    };

    const handleDefeat = () => {
        setAttempts(prev => prev - 1);
        if (attempts > 1) {
            setBossHp(100);
            setPlayerHp(100);
            setPhase('intro');
            setCombo(0);
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                style={styles.container}
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
            >
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <X size={20} color="white" />
                    </button>
                    <h1 style={styles.title}>⚔️ BOSS BATTLE</h1>
                    <div style={styles.attempts}>
                        <span style={styles.attemptText}>{attempts}x</span>
                        <Heart size={16} color="#E74C3C" fill="#E74C3C" />
                    </div>
                </div>

                {/* Intro Phase */}
                {phase === 'intro' && (
                    <motion.div
                        style={styles.introScreen}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <motion.div
                            style={{ ...styles.bossIntro, borderColor: boss.color }}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span style={styles.bossEmoji}>{boss.emoji}</span>
                        </motion.div>

                        <h2 style={{ ...styles.bossName, color: boss.color }}>{boss.name}</h2>
                        <p style={styles.bossDesc}>Weakness: {boss.weakness}</p>

                        <motion.button
                            style={styles.startButton}
                            onClick={handleStartBattle}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Swords size={24} />
                            <span>FIGHT!</span>
                        </motion.button>
                    </motion.div>
                )}

                {/* Fighting Phase */}
                {phase === 'fighting' && (
                    <div style={styles.battleScreen}>
                        {/* Timer */}
                        <div style={styles.timer}>
                            <Clock size={16} />
                            <span style={{
                                ...styles.timerText,
                                color: timeLeft <= 10 ? '#E74C3C' : 'white'
                            }}>{timeLeft}s</span>
                        </div>

                        {/* Boss Area */}
                        <div style={styles.bossArea}>
                            <div style={styles.hpBar}>
                                <motion.div
                                    style={{ ...styles.hpFill, background: boss.color }}
                                    animate={{ width: `${bossHp}%` }}
                                />
                                <span style={styles.hpText}>{bossHp}%</span>
                            </div>

                            <motion.div
                                style={{ ...styles.bossSprite, borderColor: boss.color }}
                                animate={isAttacking ? { x: [-5, 5, -5, 0] } : { y: [0, -5, 0] }}
                                transition={{ duration: isAttacking ? 0.2 : 1.5, repeat: isAttacking ? 0 : Infinity }}
                            >
                                <span style={styles.bossEmojiFight}>{boss.emoji}</span>
                            </motion.div>

                            {/* Damage numbers */}
                            <AnimatePresence>
                                {showDamage && (
                                    <motion.div
                                        style={{ ...styles.damageNumber, left: `${showDamage.x}%` }}
                                        initial={{ y: 0, opacity: 1, scale: 1 }}
                                        animate={{ y: -40, opacity: 0, scale: 1.5 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        -{showDamage.value}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Player HP */}
                        <div style={styles.playerArea}>
                            <div style={styles.playerHpBar}>
                                <motion.div
                                    style={styles.playerHpFill}
                                    animate={{ width: `${playerHp}%` }}
                                />
                                <span style={styles.hpText}>You: {playerHp}%</span>
                            </div>

                            {/* Combo Counter */}
                            {combo > 0 && (
                                <motion.div
                                    style={styles.comboCounter}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    key={combo}
                                >
                                    <Zap size={16} color="#F4D03F" />
                                    <span style={styles.comboText}>{combo}x COMBO</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Attack Button */}
                        <motion.button
                            style={{
                                ...styles.attackButton,
                                ...(isAttacking ? styles.attackButtonDisabled : {}),
                            }}
                            onClick={handleAttack}
                            whileTap={{ scale: 0.9 }}
                            disabled={isAttacking}
                        >
                            <Target size={32} />
                            <span style={styles.attackText}>TAP TO ATTACK!</span>
                        </motion.button>
                    </div>
                )}

                {/* Victory */}
                {phase === 'victory' && (
                    <motion.div
                        style={styles.resultScreen}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <Trophy size={64} color="#F4D03F" />
                        <h2 style={styles.victoryText}>VICTORY!</h2>
                        <p style={styles.victoryDesc}>
                            {combo}x Combo Bonus!
                        </p>
                        <motion.button
                            style={styles.claimButton}
                            onClick={handleVictory}
                            whileTap={{ scale: 0.95 }}
                        >
                            CLAIM REWARDS
                        </motion.button>
                    </motion.div>
                )}

                {/* Defeat */}
                {phase === 'defeat' && (
                    <motion.div
                        style={styles.resultScreen}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <Shield size={64} color="#E74C3C" />
                        <h2 style={styles.defeatText}>DEFEATED</h2>
                        <p style={styles.defeatDesc}>
                            {attempts > 1 ? `${attempts - 1} attempt(s) remaining` : 'No attempts left'}
                        </p>
                        <motion.button
                            style={styles.retryButton}
                            onClick={handleDefeat}
                            whileTap={{ scale: 0.95 }}
                        >
                            {attempts > 1 ? 'TRY AGAIN' : 'EXIT'}
                        </motion.button>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    container: {
        width: '100%',
        maxWidth: 380,
        background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
        borderRadius: 24,
        border: '4px solid #0F3460',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        background: 'linear-gradient(180deg, #0F3460, #16213E)',
        borderBottom: '2px solid #0F3460',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    title: {
        fontSize: 18,
        fontWeight: 900,
        color: '#F4D03F',
        letterSpacing: 2,
        margin: 0,
    },
    attempts: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    },
    attemptText: {
        fontSize: 14,
        fontWeight: 800,
        color: 'white',
    },
    introScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 32,
        gap: 16,
    },
    bossIntro: {
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        border: '4px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 30px rgba(255,255,255,0.1)',
    },
    bossEmoji: {
        fontSize: 60,
    },
    bossName: {
        fontSize: 24,
        fontWeight: 900,
        margin: 0,
    },
    bossDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        margin: 0,
    },
    startButton: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 48px',
        background: 'linear-gradient(180deg, #E74C3C, #C0392B)',
        border: '4px solid #922B21',
        borderRadius: 16,
        color: 'white',
        fontSize: 20,
        fontWeight: 900,
        cursor: 'pointer',
        boxShadow: '0 6px 0 #7B241C',
        marginTop: 16,
    },
    battleScreen: {
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: 400,
    },
    timer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        color: 'white',
    },
    timerText: {
        fontSize: 24,
        fontWeight: 900,
    },
    bossArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
    },
    hpBar: {
        width: '100%',
        height: 24,
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    hpFill: {
        height: '100%',
        borderRadius: 12,
    },
    hpText: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 800,
        color: 'white',
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    },
    bossSprite: {
        width: 100,
        height: 100,
        borderRadius: 20,
        background: 'rgba(255,255,255,0.05)',
        border: '3px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bossEmojiFight: {
        fontSize: 50,
    },
    damageNumber: {
        position: 'absolute',
        top: 80,
        fontSize: 28,
        fontWeight: 900,
        color: '#E74C3C',
        textShadow: '2px 2px 0 #000',
        pointerEvents: 'none',
    },
    playerArea: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    playerHpBar: {
        width: '100%',
        height: 20,
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    playerHpFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #27AE60, #58D68D)',
        borderRadius: 10,
    },
    comboCounter: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '6px 16px',
        background: 'rgba(244, 208, 63, 0.2)',
        borderRadius: 20,
        alignSelf: 'center',
    },
    comboText: {
        fontSize: 14,
        fontWeight: 900,
        color: '#F4D03F',
    },
    attackButton: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 24,
        background: 'linear-gradient(180deg, #27AE60, #1E8449)',
        border: '4px solid #145A32',
        borderRadius: 20,
        color: 'white',
        cursor: 'pointer',
        boxShadow: '0 6px 0 #0B3D20',
    },
    attackButtonDisabled: {
        opacity: 0.7,
        transform: 'translateY(4px)',
        boxShadow: '0 2px 0 #0B3D20',
    },
    attackText: {
        fontSize: 18,
        fontWeight: 900,
        letterSpacing: 1,
    },
    resultScreen: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 48,
        gap: 16,
    },
    victoryText: {
        fontSize: 32,
        fontWeight: 900,
        color: '#F4D03F',
        margin: 0,
    },
    victoryDesc: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        margin: 0,
    },
    claimButton: {
        padding: '16px 48px',
        background: 'linear-gradient(180deg, #F4D03F, #D4AC0D)',
        border: '4px solid #9A7D0A',
        borderRadius: 16,
        color: '#5D4E0D',
        fontSize: 18,
        fontWeight: 900,
        cursor: 'pointer',
        boxShadow: '0 6px 0 #7E6608',
        marginTop: 16,
    },
    defeatText: {
        fontSize: 32,
        fontWeight: 900,
        color: '#E74C3C',
        margin: 0,
    },
    defeatDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        margin: 0,
    },
    retryButton: {
        padding: '16px 48px',
        background: 'linear-gradient(180deg, #5DADE2, #2E86C1)',
        border: '4px solid #1A5276',
        borderRadius: 16,
        color: 'white',
        fontSize: 18,
        fontWeight: 900,
        cursor: 'pointer',
        boxShadow: '0 6px 0 #0E3A5E',
        marginTop: 16,
    },
};

export default BossBattle;
