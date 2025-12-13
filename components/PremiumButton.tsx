import React from 'react';
import { motion } from 'framer-motion';

interface PremiumButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'gold' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    glow?: boolean;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    glow = false,
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 50%, #1A5276 100%)',
                    borderColor: 'rgba(93, 173, 226, 0.5)',
                    shadowColor: 'rgba(46, 134, 193, 0.4)',
                    textColor: 'white',
                };
            case 'secondary':
                return {
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    shadowColor: 'rgba(255, 255, 255, 0.1)',
                    textColor: 'white',
                };
            case 'gold':
                return {
                    background: 'linear-gradient(180deg, #F4D03F 0%, #D4AC0D 50%, #B7950B 100%)',
                    borderColor: 'rgba(244, 208, 63, 0.5)',
                    shadowColor: 'rgba(244, 208, 63, 0.4)',
                    textColor: '#1A1A2E',
                };
            case 'danger':
                return {
                    background: 'linear-gradient(180deg, #E74C3C 0%, #C0392B 50%, #922B21 100%)',
                    borderColor: 'rgba(231, 76, 60, 0.5)',
                    shadowColor: 'rgba(231, 76, 60, 0.4)',
                    textColor: 'white',
                };
            case 'success':
                return {
                    background: 'linear-gradient(180deg, #27AE60 0%, #1E8449 50%, #145A32 100%)',
                    borderColor: 'rgba(39, 174, 96, 0.5)',
                    shadowColor: 'rgba(39, 174, 96, 0.4)',
                    textColor: 'white',
                };
            default:
                return {
                    background: 'linear-gradient(180deg, #5DADE2 0%, #2E86C1 100%)',
                    borderColor: 'rgba(93, 173, 226, 0.5)',
                    shadowColor: 'rgba(46, 134, 193, 0.4)',
                    textColor: 'white',
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return { padding: '8px 16px', fontSize: 12, height: 36, iconSize: 14 };
            case 'md':
                return { padding: '12px 24px', fontSize: 14, height: 46, iconSize: 18 };
            case 'lg':
                return { padding: '16px 32px', fontSize: 16, height: 56, iconSize: 22 };
            default:
                return { padding: '12px 24px', fontSize: 14, height: 46, iconSize: 18 };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
        <motion.button
            onClick={disabled || loading ? undefined : onClick}
            disabled={disabled || loading}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: sizeStyles.padding,
                minHeight: sizeStyles.height,
                width: fullWidth ? '100%' : 'auto',
                background: disabled ? 'rgba(128, 128, 128, 0.3)' : variantStyles.background,
                border: `2px solid ${disabled ? 'rgba(128, 128, 128, 0.3)' : variantStyles.borderColor}`,
                borderRadius: 12,
                color: disabled ? 'rgba(255, 255, 255, 0.4)' : variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
                fontWeight: 800,
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: 1,
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: glow && !disabled
                    ? `0 4px 15px ${variantStyles.shadowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.15)',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
            }}
            whileHover={!disabled && !loading ? {
                scale: 1.02,
                boxShadow: `0 6px 20px ${variantStyles.shadowColor}`,
            } : undefined}
            whileTap={!disabled && !loading ? {
                scale: 0.98,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
            } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {/* Shine Effect */}
            {!disabled && (
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '60%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        transform: 'skewX(-25deg)',
                    }}
                    initial={{ left: '-100%' }}
                    animate={{ left: '200%' }}
                    transition={{
                        repeat: Infinity,
                        repeatDelay: 3,
                        duration: 1,
                        ease: 'easeInOut',
                    }}
                />
            )}

            {/* Loading Spinner */}
            {loading && (
                <motion.div
                    style={{
                        width: sizeStyles.iconSize,
                        height: sizeStyles.iconSize,
                        border: `2px solid ${variantStyles.textColor}`,
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />
            )}

            {/* Icon */}
            {!loading && icon && (
                <span style={{ display: 'flex', alignItems: 'center' }}>
                    {icon}
                </span>
            )}

            {/* Text */}
            {!loading && children}
        </motion.button>
    );
};

export default PremiumButton;
