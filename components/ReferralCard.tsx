import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Share2, Gift, Users, Check, ChevronRight } from 'lucide-react';
import { useSocial } from '../hooks/useSocial';
import { useUIStore } from '../store/uiStore';
import { triggerHaptic, Haptics } from '../utils/haptics';

interface ReferralCardProps {
    expanded?: boolean;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ expanded = false }) => {
    const { referralStats, referralCode, shareReferralCode, applyReferralCode, isLoading } = useSocial();
    const { addToast } = useUIStore();
    const [inputCode, setInputCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [showInput, setShowInput] = useState(false);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        triggerHaptic(Haptics.soft);
        addToast('Referral code copied!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        const result = shareReferralCode();
        if (result) {
            addToast(result, 'success');
        }
        triggerHaptic(Haptics.medium);
    };

    const handleApplyCode = async () => {
        if (!inputCode.trim()) return;
        const result = await applyReferralCode(inputCode.trim());
        if (result.success) {
            addToast(result.message, 'success');
            triggerHaptic(Haptics.success);
            setInputCode('');
            setShowInput(false);
        } else {
            addToast(result.message, 'error');
            triggerHaptic(Haptics.error);
        }
    };

    return (
        <motion.div
            style={styles.container}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.iconBadge}>
                        <Gift size={18} color="#F4D03F" />
                    </div>
                    <div>
                        <h3 style={styles.title}>Invite Friends</h3>
                        <p style={styles.subtitle}>Earn 50 XP + rewards per friend</p>
                    </div>
                </div>
                <div style={styles.statsBox}>
                    <span style={styles.statValue}>{referralStats.totalReferrals}</span>
                    <span style={styles.statLabel}>Invited</span>
                </div>
            </div>

            {/* Your Referral Code */}
            <div style={styles.codeSection}>
                <span style={styles.codeLabel}>Your Code</span>
                <div style={styles.codeRow}>
                    <div style={styles.codeBox}>
                        <span style={styles.codeText}>{referralCode}</span>
                    </div>
                    <motion.button
                        style={styles.copyBtn}
                        onClick={handleCopyCode}
                        whileTap={{ scale: 0.95 }}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </motion.button>
                    <motion.button
                        style={styles.shareBtn}
                        onClick={handleShare}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Share2 size={16} />
                        <span>Share</span>
                    </motion.button>
                </div>
            </div>

            {/* Rewards Preview */}
            <div style={styles.rewardsRow}>
                <div style={styles.rewardItem}>
                    <span style={styles.rewardIcon}>⚡</span>
                    <span style={styles.rewardText}>+50 XP</span>
                </div>
                <div style={styles.rewardItem}>
                    <span style={styles.rewardIcon}>🎣</span>
                    <span style={styles.rewardText}>+5 Casts</span>
                </div>
                <div style={styles.rewardItem}>
                    <span style={styles.rewardIcon}>🔧</span>
                    <span style={styles.rewardText}>Rod Part</span>
                </div>
            </div>

            {/* Apply Code Section */}
            {showInput ? (
                <div style={styles.inputSection}>
                    <input
                        style={styles.input}
                        placeholder="Enter friend's code..."
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        maxLength={15}
                    />
                    <motion.button
                        style={styles.applyBtn}
                        onClick={handleApplyCode}
                        whileTap={{ scale: 0.95 }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Applying...' : 'Apply'}
                    </motion.button>
                </div>
            ) : (
                <button
                    style={styles.haveCodeBtn}
                    onClick={() => setShowInput(true)}
                >
                    Have a friend's code? <ChevronRight size={14} />
                </button>
            )}

            {/* Milestones (Expanded View) */}
            {expanded && referralStats.totalReferrals > 0 && (
                <div style={styles.milestonesSection}>
                    <span style={styles.milestonesTitle}>Milestones</span>
                    <div style={styles.milestonesList}>
                        <MilestoneItem target={5} current={referralStats.totalReferrals} reward="Uncommon Cosmetic" />
                        <MilestoneItem target={10} current={referralStats.totalReferrals} reward="$5 USDC" />
                        <MilestoneItem target={25} current={referralStats.totalReferrals} reward="Epic Cosmetic" />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const MilestoneItem: React.FC<{ target: number; current: number; reward: string }> = ({ target, current, reward }) => {
    const achieved = current >= target;
    const progress = Math.min(100, (current / target) * 100);

    return (
        <div style={styles.milestoneItem}>
            <div style={styles.milestoneInfo}>
                <span style={{ ...styles.milestoneTarget, color: achieved ? '#27AE60' : 'white' }}>
                    {achieved ? '✓' : target} friends
                </span>
                <span style={styles.milestoneReward}>{reward}</span>
            </div>
            <div style={styles.milestoneProgress}>
                <div style={{ ...styles.milestoneBar, width: `${progress}%` }} />
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        background: 'linear-gradient(180deg, rgba(244, 208, 63, 0.1) 0%, rgba(183, 149, 11, 0.05) 100%)',
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(244, 208, 63, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        background: 'rgba(244, 208, 63, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 800,
        color: 'white',
        margin: 0,
    },
    subtitle: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.6)',
        margin: 0,
    },
    statsBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(244, 208, 63, 0.15)',
        padding: '8px 14px',
        borderRadius: 10,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 900,
        color: '#F4D03F',
    },
    statLabel: {
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        fontWeight: 700,
    },
    codeSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    codeLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: 700,
        textTransform: 'uppercase',
    },
    codeRow: {
        display: 'flex',
        gap: 8,
    },
    codeBox: {
        flex: 1,
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 10,
        padding: '12px 16px',
        border: '2px dashed rgba(244, 208, 63, 0.3)',
    },
    codeText: {
        fontSize: 16,
        fontWeight: 900,
        color: '#F4D03F',
        letterSpacing: 2,
        fontFamily: 'monospace',
    },
    copyBtn: {
        width: 44,
        height: 44,
        borderRadius: 10,
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    shareBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 16px',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #27AE60, #1E8449)',
        border: 'none',
        color: 'white',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
    },
    rewardsRow: {
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 10,
    },
    rewardItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    rewardIcon: {
        fontSize: 16,
    },
    rewardText: {
        fontSize: 12,
        fontWeight: 700,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    inputSection: {
        display: 'flex',
        gap: 8,
    },
    input: {
        flex: 1,
        padding: '12px 14px',
        borderRadius: 10,
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white',
        fontSize: 14,
        fontWeight: 600,
        outline: 'none',
    },
    applyBtn: {
        padding: '0 20px',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #5DADE2, #2E86C1)',
        border: 'none',
        color: 'white',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
    },
    haveCodeBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '10px',
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 10,
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
    },
    milestonesSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        paddingTop: 10,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    },
    milestonesTitle: {
        fontSize: 12,
        fontWeight: 700,
        color: 'white',
    },
    milestonesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    milestoneItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    milestoneInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    milestoneTarget: {
        fontSize: 12,
        fontWeight: 700,
    },
    milestoneReward: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    milestoneProgress: {
        height: 4,
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    milestoneBar: {
        height: '100%',
        background: 'linear-gradient(90deg, #27AE60, #58D68D)',
        borderRadius: 2,
    },
};

export default ReferralCard;
