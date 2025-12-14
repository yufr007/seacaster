import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useSounds } from '../utils/soundManager';
import { triggerHaptic, Haptics } from '../utils/haptics';

interface SoundToggleProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const SoundToggle: React.FC<SoundToggleProps> = ({ position = 'top-right' }) => {
    const { isMuted, toggleMute } = useSounds();
    const [muted, setMuted] = useState(isMuted());

    const handleToggle = () => {
        const newMuted = toggleMute();
        setMuted(newMuted);
        triggerHaptic(Haptics.soft);
    };

    const positionStyles: Record<string, React.CSSProperties> = {
        'top-left': { top: 16, left: 16 },
        'top-right': { top: 16, right: 16 },
        'bottom-left': { bottom: 16, left: 16 },
        'bottom-right': { bottom: 16, right: 16 },
    };

    return (
        <motion.button
            onClick={handleToggle}
            whileTap={{ scale: 0.9 }}
            style={{
                position: 'fixed',
                ...positionStyles[position],
                zIndex: 100,
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: muted
                    ? 'linear-gradient(180deg, #E74C3C 0%, #C0392B 100%)'
                    : 'linear-gradient(180deg, #27AE60 0%, #1E8449 100%)',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
            }}
        >
            {muted ? (
                <VolumeX size={22} color="white" />
            ) : (
                <Volume2 size={22} color="white" />
            )}
        </motion.button>
    );
};

export default SoundToggle;
