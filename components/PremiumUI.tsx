import React from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic, Haptics } from '../utils/haptics';

// ============================================
// PREMIUM BUTTON - 3D Pressable CoC Style
// ============================================

type ButtonVariant = 'primary' | 'gold' | 'success' | 'danger' | 'secondary' | 'legendary';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface PremiumButton3DProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    pulse?: boolean;
    glow?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    className?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, {
    bg: string;
    border: string;
    bottomShadow: string;
    textColor: string;
    textShadow: string;
}> = {
    primary: {
        bg: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 50%, #1A5276 100%)',
        border: '#154360',
        bottomShadow: '#0E2F44',
        textColor: '#FFFFFF',
        textShadow: '0 2px 0 #154360',
    },
    gold: {
        bg: 'linear-gradient(180deg, #F4D03F 0%, #D4AF37 50%, #9A7D0A 100%)',
        border: '#7D6608',
        bottomShadow: '#5D4E06',
        textColor: '#3D2F06',
        textShadow: '0 1px 0 rgba(255,255,255,0.3)',
    },
    success: {
        bg: 'linear-gradient(180deg, #58D68D 0%, #27AE60 50%, #1E8449 100%)',
        border: '#145A32',
        bottomShadow: '#0B3D20',
        textColor: '#FFFFFF',
        textShadow: '0 2px 0 #145A32',
    },
    danger: {
        bg: 'linear-gradient(180deg, #EC7063 0%, #E74C3C 50%, #C0392B 100%)',
        border: '#922B21',
        bottomShadow: '#641E16',
        textColor: '#FFFFFF',
        textShadow: '0 2px 0 #922B21',
    },
    secondary: {
        bg: 'linear-gradient(180deg, #ABB2B9 0%, #808B96 50%, #566573 100%)',
        border: '#2C3E50',
        bottomShadow: '#1A252F',
        textColor: '#FFFFFF',
        textShadow: '0 2px 0 #2C3E50',
    },
    legendary: {
        bg: 'linear-gradient(180deg, #FFE066 0%, #FFD700 30%, #FFA500 70%, #FFD700 100%)',
        border: '#B8860B',
        bottomShadow: '#8B6914',
        textColor: '#4A3500',
        textShadow: '0 1px 0 rgba(255,255,255,0.4)',
    },
};

const SIZE_STYLES: Record<ButtonSize, {
    padding: string;
    fontSize: string;
    borderWidth: number;
    shadowDepth: number;
    borderRadius: number;
}> = {
    sm: { padding: '10px 20px', fontSize: '14px', borderWidth: 3, shadowDepth: 4, borderRadius: 10 },
    md: { padding: '14px 28px', fontSize: '16px', borderWidth: 4, shadowDepth: 5, borderRadius: 12 },
    lg: { padding: '18px 36px', fontSize: '18px', borderWidth: 4, shadowDepth: 6, borderRadius: 14 },
    xl: { padding: '22px 44px', fontSize: '22px', borderWidth: 5, shadowDepth: 8, borderRadius: 16 },
};

export const PremiumButton3D: React.FC<PremiumButton3DProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    onClick,
    disabled = false,
    loading = false,
    pulse = false,
    glow = false,
    fullWidth = false,
    icon,
    className = '',
}) => {
    const variantStyle = VARIANT_STYLES[variant];
    const sizeStyle = SIZE_STYLES[size];

    const handleClick = () => {
        if (disabled || loading) return;
        triggerHaptic(Haptics.medium);
        onClick?.();
    };

    return (
        <motion.button
            onClick={handleClick}
            disabled={disabled || loading}
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: fullWidth ? '100%' : 'auto',
                padding: sizeStyle.padding,
                background: disabled ? '#666' : variantStyle.bg,
                border: `${sizeStyle.borderWidth}px solid ${variantStyle.border}`,
                borderRadius: sizeStyle.borderRadius,
                boxShadow: disabled ? 'none' : `
          0 ${sizeStyle.shadowDepth}px 0 ${variantStyle.bottomShadow},
          0 ${sizeStyle.shadowDepth + 4}px 16px rgba(0,0,0,0.3),
          inset 0 2px 0 rgba(255,255,255,0.3),
          inset 0 -2px 0 rgba(0,0,0,0.2)
          ${glow ? `, 0 0 20px ${variantStyle.border}80` : ''}
        `,
                fontFamily: "'Lilita One', 'Fredoka One', cursive",
                fontSize: sizeStyle.fontSize,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: variantStyle.textColor,
                textShadow: variantStyle.textShadow,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
            }}
            whileHover={disabled ? {} : {
                y: -2,
                boxShadow: `
          0 ${sizeStyle.shadowDepth + 4}px 0 ${variantStyle.bottomShadow},
          0 ${sizeStyle.shadowDepth + 8}px 24px rgba(0,0,0,0.4),
          inset 0 2px 0 rgba(255,255,255,0.4),
          inset 0 -2px 0 rgba(0,0,0,0.2)
          ${glow ? `, 0 0 30px ${variantStyle.border}` : ''}
        `
            }}
            whileTap={disabled ? {} : {
                y: sizeStyle.shadowDepth - 1,
                boxShadow: `
          0 2px 0 ${variantStyle.bottomShadow},
          0 4px 8px rgba(0,0,0,0.2),
          inset 0 2px 0 rgba(255,255,255,0.2),
          inset 0 -1px 0 rgba(0,0,0,0.1)
        `
            }}
            animate={pulse ? {
                boxShadow: [
                    `0 ${sizeStyle.shadowDepth}px 0 ${variantStyle.bottomShadow}, 0 0 0 0 ${variantStyle.border}80`,
                    `0 ${sizeStyle.shadowDepth}px 0 ${variantStyle.bottomShadow}, 0 0 0 15px ${variantStyle.border}00`,
                ]
            } : {}}
            transition={pulse ? { duration: 0.6, repeat: Infinity } : { duration: 0.1 }}
        >
            {/* Shine effect */}
            <motion.div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    pointerEvents: 'none',
                }}
                animate={{ left: ['−100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />

            {loading ? (
                <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    ⏳
                </motion.span>
            ) : (
                <>
                    {icon && <span>{icon}</span>}
                    <span>{children}</span>
                </>
            )}
        </motion.button>
    );
};

// ============================================
// PREMIUM CARD - Layered Depth CoC Style
// ============================================

interface PremiumCardProps {
    children: React.ReactNode;
    variant?: 'default' | 'gold' | 'dark' | 'glass';
    glow?: boolean;
    hover?: boolean;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
    children,
    variant = 'default',
    glow = false,
    hover = true,
    onClick,
    className = '',
    style = {},
}) => {
    const variants = {
        default: {
            background: 'linear-gradient(180deg, #4A6741 0%, #3D5335 50%, #2E4228 100%)',
            border: '4px solid #1D2A19',
            overlay: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        },
        gold: {
            background: 'linear-gradient(180deg, #F4D03F 0%, #D4AC0D 50%, #9A7D0A 100%)',
            border: '4px solid #7D6608',
            overlay: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
        },
        dark: {
            background: 'linear-gradient(180deg, #2C3E50 0%, #1A252F 50%, #0D1318 100%)',
            border: '4px solid #0A0F14',
            overlay: 'radial-gradient(circle at 30% 20%, rgba(93,173,226,0.1) 0%, transparent 50%)',
        },
        glass: {
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            overlay: 'none',
        },
    };

    const v = variants[variant];

    return (
        <motion.div
            onClick={onClick}
            className={className}
            style={{
                position: 'relative',
                background: v.background,
                border: v.border,
                borderRadius: 16,
                padding: 20,
                boxShadow: `
          0 10px 0 rgba(0,0,0,0.3),
          0 15px 30px rgba(0,0,0,0.4)
          ${glow ? ', 0 0 25px rgba(212,175,55,0.4)' : ''}
        `,
                overflow: 'hidden',
                cursor: onClick ? 'pointer' : 'default',
                ...style,
            }}
            whileHover={hover && onClick ? {
                y: -4,
                boxShadow: `
          0 14px 0 rgba(0,0,0,0.3),
          0 20px 40px rgba(0,0,0,0.5)
          ${glow ? ', 0 0 35px rgba(212,175,55,0.6)' : ''}
        `,
            } : {}}
            whileTap={onClick ? { y: 2 } : {}}
        >
            {/* Atmospheric overlay */}
            {v.overlay !== 'none' && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: v.overlay,
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </motion.div>
    );
};

// ============================================
// PREMIUM STAT DISPLAY
// ============================================

interface PremiumStatProps {
    icon: string;
    value: string | number;
    label: string;
    color?: string;
    glow?: boolean;
}

export const PremiumStat: React.FC<PremiumStatProps> = ({
    icon,
    value,
    label,
    color = '#F4D03F',
    glow = false,
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '12px 16px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)',
            borderRadius: 12,
            border: '2px solid rgba(255,255,255,0.1)',
        }}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <motion.span
                style={{
                    fontFamily: "'Lilita One', cursive",
                    fontSize: 28,
                    fontWeight: 900,
                    color: color,
                    textShadow: glow ? `0 0 12px ${color}80` : `0 2px 0 rgba(0,0,0,0.3)`,
                }}
                animate={glow ? {
                    textShadow: [`0 0 12px ${color}80`, `0 0 20px ${color}`, `0 0 12px ${color}80`]
                } : {}}
                transition={glow ? { duration: 1.5, repeat: Infinity } : {}}
            >
                {value}
            </motion.span>
            <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'rgba(255,255,255,0.6)',
            }}>
                {label}
            </span>
        </div>
    );
};

// ============================================
// PREMIUM BADGE
// ============================================

interface PremiumBadgeProps {
    level: number;
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
    level,
    size = 'md',
    animated = false,
}) => {
    const sizes = {
        sm: { outer: 50, inner: 40, font: 18, border: 3 },
        md: { outer: 80, inner: 64, font: 28, border: 4 },
        lg: { outer: 120, inner: 96, font: 42, border: 6 },
    };
    const s = sizes[size];
    const isMilestone = level % 10 === 0;

    return (
        <motion.div
            style={{
                position: 'relative',
                width: s.outer,
                height: s.outer,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            animate={animated ? { rotate: [0, 5, -5, 0] } : {}}
            transition={animated ? { duration: 2, repeat: Infinity } : {}}
        >
            {/* Glow ring */}
            {isMilestone && (
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: -8,
                        borderRadius: '50%',
                        border: '3px solid rgba(244,208,63,0.5)',
                    }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}

            {/* Main badge */}
            <div style={{
                width: s.inner,
                height: s.inner,
                borderRadius: '50%',
                background: isMilestone
                    ? 'linear-gradient(180deg, #F4D03F 0%, #D4AC0D 50%, #9A7D0A 100%)'
                    : 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 50%, #1A5276 100%)',
                border: `${s.border}px solid ${isMilestone ? '#FFD700' : '#F4D03F'}`,
                boxShadow: `
          0 ${s.border + 2}px 0 ${isMilestone ? '#B7950B' : '#C19A00'},
          0 ${s.border + 6}px 20px rgba(0,0,0,0.4),
          inset 0 2px 4px rgba(255,255,255,0.3)
        `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <span style={{
                    fontFamily: "'Lilita One', cursive",
                    fontSize: s.font,
                    fontWeight: 900,
                    color: isMilestone ? '#3D2F06' : '#FFFFFF',
                    textShadow: isMilestone
                        ? '0 1px 0 rgba(255,255,255,0.3)'
                        : '0 2px 0 rgba(0,0,0,0.3)',
                }}>
                    {level}
                </span>
            </div>
        </motion.div>
    );
};

export default {
    PremiumButton3D,
    PremiumCard,
    PremiumStat,
    PremiumBadge,
};
