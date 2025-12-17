import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase, Rarity, Fish } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '../hooks/useSound';
import { Haptics, triggerHaptic } from '../utils/haptics';
import { ChevronLeft, Zap } from 'lucide-react';
import { useValidateCatch } from '../hooks/useGameAPI';
import { FISH_TYPES } from '../constants';

interface FishingSceneV2Props {
    onBack?: () => void;
}

// Fish swimming in water - positions for visible fish
interface SwimmingFish {
    id: string;
    fish: Fish;
    x: number;
    y: number;
    scale: number;
    speed: number;
    direction: 1 | -1;
}

/**
 * AAA Fishing Scene V2
 * - Premium rod render with casting animation
 * - Visible fish swimming in water
 * - Fishing line that connects rod to water
 * - Cast lands on actual fish position
 */
const FishingSceneV2: React.FC<FishingSceneV2Props> = ({ onBack }) => {
    const {
        phase,
        castLine,
        attemptCatch,
        failCatch,
        userStats,
        hookedFish,
        inventory,
        finishCatchAnimation
    } = useGameStore();

    const touchStartY = useRef<number | null>(null);
    const [castPower, setCastPower] = useState(0);
    const [isCasting, setIsCasting] = useState(false);
    const { play } = useSound();
    const validateCatchMutation = useValidateCatch();

    // Rod animation state
    const [rodAngle, setRodAngle] = useState(0);
    const [rodY, setRodY] = useState(0);

    // Fishing line state
    const [lineLength, setLineLength] = useState(0);
    const [bobberPosition, setBobberPosition] = useState({ x: 50, y: 30 });
    const [showBobber, setShowBobber] = useState(false);

    // Fish state
    const [swimmingFish, setSwimmingFish] = useState<SwimmingFish[]>([]);
    const [targetFish, setTargetFish] = useState<SwimmingFish | null>(null);
    const [showCaughtFish, setShowCaughtFish] = useState(false);

    // Effects
    const [showSplash, setShowSplash] = useState(false);
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
    const [screenShake, setScreenShake] = useState(false);

    // Generate swimming fish based on rarity weights
    useEffect(() => {
        const fish: SwimmingFish[] = [];
        const fishPool = FISH_TYPES.slice(0, 8); // Use common/uncommon fish for background

        for (let i = 0; i < 6; i++) {
            const randomFish = fishPool[Math.floor(Math.random() * fishPool.length)];
            fish.push({
                id: `fish-${i}`,
                fish: randomFish,
                x: Math.random() * 80 + 10,
                y: Math.random() * 30 + 55, // Lower half of screen (water area)
                scale: 0.4 + Math.random() * 0.4,
                speed: 0.5 + Math.random() * 1.5,
                direction: Math.random() > 0.5 ? 1 : -1,
            });
        }
        setSwimmingFish(fish);
    }, []);

    // Animate swimming fish
    useEffect(() => {
        const interval = setInterval(() => {
            setSwimmingFish((prev) =>
                prev.map((f) => {
                    let newX = f.x + f.speed * f.direction * 0.3;
                    let newDirection = f.direction;

                    // Bounce off edges
                    if (newX > 95) {
                        newX = 95;
                        newDirection = -1;
                    } else if (newX < 5) {
                        newX = 5;
                        newDirection = 1;
                    }

                    return {
                        ...f,
                        x: newX,
                        direction: newDirection,
                        y: f.y + Math.sin(Date.now() / 1000 + parseInt(f.id.split('-')[1])) * 0.2,
                    };
                })
            );
        }, 50);

        return () => clearInterval(interval);
    }, []);

    // Rod casting animation
    useEffect(() => {
        if (phase === GamePhase.CASTING) {
            // Wind-up
            setRodAngle(-40);
            setRodY(-20);

            setTimeout(() => {
                // Power swing forward
                setRodAngle(60);
                setRodY(0);
                triggerHaptic(Haptics.medium);

                // Deploy line
                setShowBobber(true);
                let currentLength = 0;
                const targetLength = 100;
                const lineInterval = setInterval(() => {
                    currentLength += 8;
                    setLineLength(Math.min(currentLength, targetLength));

                    if (currentLength >= targetLength) {
                        clearInterval(lineInterval);
                        // Splash effect
                        setShowSplash(true);
                        triggerHaptic(Haptics.heavy);
                        setTimeout(() => setShowSplash(false), 600);

                        // Add ripples
                        setRipples([{ x: bobberPosition.x, y: bobberPosition.y + 25, id: Date.now() }]);
                    }
                }, 30);

                // Settle rod
                setTimeout(() => {
                    setRodAngle(15);
                }, 400);
            }, 200);

            play('cast');
        } else if (phase === GamePhase.WAITING) {
            // Gentle sway while waiting
            setRodAngle(12);
            setShowBobber(true);
            setLineLength(100);

            // Pick a random fish as target
            if (swimmingFish.length > 0) {
                const target = swimmingFish[Math.floor(Math.random() * swimmingFish.length)];
                setTargetFish(target);
                setBobberPosition({ x: target.x, y: target.y - 10 });
            }
        } else if (phase === GamePhase.HOOKED) {
            // Rod bends when hooked
            setRodAngle(-30);
            setScreenShake(true);
            setShowCaughtFish(true);
            triggerHaptic(Haptics.bite);
            play('splash');

            setTimeout(() => setScreenShake(false), 300);
        } else if (phase === GamePhase.IDLE) {
            setRodAngle(0);
            setRodY(0);
            setLineLength(0);
            setShowBobber(false);
            setShowCaughtFish(false);
            setTargetFish(null);
        }
    }, [phase, play, swimmingFish, bobberPosition]);

    // API validation
    useEffect(() => {
        if (phase === GamePhase.REWARD && hookedFish && userStats.fid) {
            validateCatchMutation.mutate({
                fishId: hookedFish.id,
                rarity: hookedFish.rarity,
                weight: hookedFish.weight,
                baitUsed: inventory.activeBaitId,
                reactionTime: 500,
            });
        }
    }, [phase, hookedFish, userStats.fid, inventory.activeBaitId, validateCatchMutation]);

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (phase === GamePhase.IDLE && userStats.castsRemaining > 0) {
            touchStartY.current = e.touches[0].clientY;
            setIsCasting(true);
            setCastPower(0);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (phase === GamePhase.IDLE && touchStartY.current !== null) {
            const deltaY = touchStartY.current - e.touches[0].clientY;
            const power = Math.min(100, Math.max(0, (deltaY / 150) * 100));
            setCastPower(power);
        }
    };

    const handleTouchEnd = () => {
        setIsCasting(false);
        if (phase === GamePhase.IDLE && touchStartY.current !== null && castPower > 20) {
            triggerHaptic(Haptics.medium);
            castLine();
        }
        touchStartY.current = null;
        setCastPower(0);
    };

    const handleTap = () => {
        if (phase === GamePhase.HOOKED) {
            triggerHaptic(Haptics.success);
            attemptCatch();
        }
    };

    const getRarityColor = (rarity: Rarity) => {
        const colors = {
            [Rarity.COMMON]: '#9CA3AF',
            [Rarity.UNCOMMON]: '#10B981',
            [Rarity.RARE]: '#3B82F6',
            [Rarity.EPIC]: '#8B5CF6',
            [Rarity.LEGENDARY]: '#F59E0B',
            [Rarity.MYTHIC]: '#EC4899',
        };
        return colors[rarity] || '#9CA3AF';
    };

    return (
        <div
            className={`fishing-scene-v2 ${screenShake ? 'shake' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleTap}
        >
            {/* Underwater Background with visible fish */}
            <div className="water-layer">
                {/* Light rays from surface */}
                <div className="light-rays" />

                {/* Swimming fish */}
                {swimmingFish.map((sf) => (
                    <motion.div
                        key={sf.id}
                        className="swimming-fish"
                        animate={{
                            x: `${sf.x}%`,
                            y: `${sf.y}%`,
                        }}
                        transition={{ duration: 0.1 }}
                        style={{
                            transform: `scaleX(${sf.direction}) scale(${sf.scale})`,
                        }}
                    >
                        <img
                            src={sf.fish.image}
                            alt={sf.fish.name}
                            className="fish-img"
                            style={{
                                filter: `drop-shadow(0 0 10px ${getRarityColor(sf.fish.rarity)}40)`,
                            }}
                        />
                    </motion.div>
                ))}

                {/* Bubbles */}
                <div className="bubbles">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="bubble"
                            animate={{
                                y: [0, -100 - Math.random() * 100],
                                opacity: [0.8, 0],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 3,
                            }}
                            style={{
                                left: `${10 + Math.random() * 80}%`,
                                bottom: '10%',
                            }}
                        />
                    ))}
                </div>

                {/* Bobber in water */}
                <AnimatePresence>
                    {showBobber && (
                        <motion.div
                            className="bobber"
                            initial={{ y: -100, opacity: 0 }}
                            animate={{
                                x: `${bobberPosition.x}%`,
                                y: phase === GamePhase.HOOKED ? `${bobberPosition.y - 5}%` : `${bobberPosition.y}%`,
                                opacity: 1,
                                scale: phase === GamePhase.HOOKED ? [1, 1.3, 1] : 1,
                            }}
                            exit={{ opacity: 0, y: 50 }}
                            transition={{
                                y: { type: 'spring', damping: 10 },
                                scale: { duration: 0.2, repeat: phase === GamePhase.HOOKED ? Infinity : 0 },
                            }}
                        >
                            <img
                                src="/assets/ui/fishing_rod.png"
                                alt="Bobber"
                                className="bobber-img"
                            />
                            {phase === GamePhase.HOOKED && (
                                <motion.div
                                    className="hook-alert"
                                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                                    transition={{ duration: 0.3, repeat: Infinity }}
                                >
                                    !
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Splash effect */}
                <AnimatePresence>
                    {showSplash && (
                        <motion.div
                            className="splash"
                            initial={{ scale: 0.5, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            style={{ left: `${bobberPosition.x}%`, top: `${bobberPosition.y}%` }}
                        />
                    )}
                </AnimatePresence>

                {/* Ripples */}
                {ripples.map((ripple) => (
                    <motion.div
                        key={ripple.id}
                        className="ripple"
                        initial={{ scale: 0.5, opacity: 0.8 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 2 }}
                        style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
                        onAnimationComplete={() =>
                            setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
                        }
                    />
                ))}
            </div>

            {/* Water surface line */}
            <div className="water-surface" />

            {/* Fishing Rod - Positioned at bottom */}
            <motion.div
                className="rod-container"
                animate={{
                    rotate: rodAngle,
                    y: rodY,
                }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            >
                <img
                    src={userStats.premium ? '/assets/ui/golden_pirate_rod_1765863136497.png' : '/assets/ui/fishing_rod.png'}
                    alt="Fishing Rod"
                    className="rod-image"
                />

                {/* Fishing Line */}
                {showBobber && (
                    <svg className="fishing-line" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <motion.path
                            d={`M 85 5 Q 60 ${30 + lineLength * 0.3} ${bobberPosition.x} ${bobberPosition.y + 30}`}
                            stroke="rgba(255,255,255,0.6)"
                            strokeWidth="0.5"
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: lineLength / 100 }}
                        />
                    </svg>
                )}
            </motion.div>

            {/* Header UI */}
            <div className="fishing-header">
                <button className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>

                <div className="energy-display">
                    <Zap size={18} className="energy-icon" />
                    <span>{userStats.castsRemaining}/{userStats.maxCasts}</span>
                </div>

                <div className="streak-display">
                    <span>🔥 {userStats.streak}</span>
                </div>
            </div>

            {/* Cast Power Meter */}
            <AnimatePresence>
                {isCasting && (
                    <motion.div
                        className="power-meter"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="power-bar">
                            <motion.div
                                className="power-fill"
                                animate={{ height: `${castPower}%` }}
                            />
                        </div>
                        <span className="power-label">{Math.round(castPower)}%</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Swipe Hint */}
            <AnimatePresence>
                {phase === GamePhase.IDLE && !isCasting && userStats.castsRemaining > 0 && (
                    <motion.div
                        className="swipe-hint"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <motion.span
                            className="swipe-icon"
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            👆
                        </motion.span>
                        <span className="swipe-text">SWIPE UP TO CAST</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hooked UI */}
            <AnimatePresence>
                {phase === GamePhase.HOOKED && hookedFish && (
                    <motion.div
                        className="hooked-ui"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                    >
                        <motion.div
                            className="tap-prompt"
                            animate={{ scale: [0.95, 1.1, 0.95] }}
                            transition={{ duration: 0.3, repeat: Infinity }}
                        >
                            TAP TO CATCH!
                        </motion.div>

                        {/* Caught fish preview */}
                        <motion.div
                            className="caught-fish-preview"
                            animate={{
                                y: [0, -10, 0],
                                rotate: [-5, 5, -5],
                            }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            <img src={hookedFish.image} alt={hookedFish.name} />
                            <div
                                className="rarity-glow"
                                style={{ backgroundColor: getRarityColor(hookedFish.rarity) }}
                            />
                        </motion.div>

                        {/* Timer bar */}
                        <div className="catch-timer">
                            <motion.div
                                className="timer-fill"
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: hookedFish.catchWindow, ease: 'linear' }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bait Display */}
            <div className="bait-display">
                <span className="bait-label">BAIT</span>
                <img
                    src={`/assets/bait/bait_${inventory.activeBaitId}_*.png`.replace('*', '1765863155303')}
                    alt="Bait"
                    className="bait-icon"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/bait/bait_worm_1765863155303.png';
                    }}
                />
            </div>

            <style>{`
        .fishing-scene-v2 {
          position: relative;
          width: 100%;
          height: 100dvh;
          min-height: 100vh;
          overflow: hidden;
          touch-action: none;
          user-select: none;
          background: linear-gradient(180deg, 
            #87CEEB 0%, 
            #1E90FF 30%, 
            #0066CC 50%, 
            #003366 100%
          );
        }

        .fishing-scene-v2.shake {
          animation: shake 0.3s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* Water Layer */
        .water-layer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 65%;
          background: linear-gradient(180deg,
            rgba(0, 100, 180, 0.3) 0%,
            rgba(0, 50, 100, 0.8) 100%
          );
          overflow: hidden;
        }

        .light-rays {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: linear-gradient(180deg,
            rgba(255, 255, 255, 0.3) 0%,
            transparent 100%
          );
          mask-image: repeating-linear-gradient(
            100deg,
            black 0px,
            transparent 2px,
            transparent 20px,
            black 22px
          );
        }

        .water-surface {
          position: absolute;
          top: 35%;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg,
            rgba(255,255,255,0.2),
            rgba(255,255,255,0.5),
            rgba(255,255,255,0.2)
          );
        }

        /* Swimming Fish */
        .swimming-fish {
          position: absolute;
          pointer-events: none;
        }

        .fish-img {
          width: 80px;
          height: auto;
          object-fit: contain;
        }

        /* Bubbles */
        .bubble {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
        }

        /* Bobber */
        .bobber {
          position: absolute;
          transform: translate(-50%, -50%);
          z-index: 10;
        }

        .bobber-img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .hook-alert {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 32px;
          font-weight: 900;
          color: #FF4444;
          text-shadow: 0 0 10px #FF4444;
        }

        /* Splash & Ripples */
        .splash {
          position: absolute;
          width: 60px;
          height: 30px;
          background: radial-gradient(ellipse, rgba(255,255,255,0.8), transparent);
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .ripple {
          position: absolute;
          width: 40px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.5);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        /* Rod */
        .rod-container {
          position: absolute;
          bottom: 5%;
          right: 5%;
          width: 200px;
          height: 400px;
          transform-origin: bottom right;
          z-index: 20;
        }

        .rod-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom right;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        }

        .fishing-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        /* Header */
        .fishing-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 16px;
          padding-top: max(16px, env(safe-area-inset-top));
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 50;
        }

        .back-btn {
          width: 44px;
          height: 44px;
          background: rgba(0,0,0,0.4);
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 12px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
        }

        .energy-display, .streak-display {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 8px 16px;
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .energy-icon {
          color: #F4D03F;
        }

        /* Power Meter */
        .power-meter {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 30;
        }

        .power-bar {
          width: 24px;
          height: 150px;
          background: rgba(0,0,0,0.4);
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column-reverse;
        }

        .power-fill {
          width: 100%;
          background: linear-gradient(0deg, #27AE60, #F1C40F, #E74C3C);
          border-radius: 10px;
        }

        .power-label {
          color: white;
          font-weight: 700;
          font-size: 14px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        /* Swipe Hint */
        .swipe-hint {
          position: absolute;
          top: 35%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 25;
        }

        .swipe-icon {
          font-size: 48px;
        }

        .swipe-text {
          color: white;
          font-size: 18px;
          font-weight: 800;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
          letter-spacing: 2px;
        }

        /* Hooked UI */
        .hooked-ui {
          position: absolute;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          z-index: 40;
        }

        .tap-prompt {
          background: linear-gradient(180deg, #E74C3C, #C0392B);
          color: white;
          padding: 16px 32px;
          border-radius: 16px;
          font-size: 24px;
          font-weight: 900;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          box-shadow: 0 6px 0 #922B21, 0 10px 20px rgba(0,0,0,0.4);
        }

        .caught-fish-preview {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .caught-fish-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .rarity-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          opacity: 0.4;
          filter: blur(20px);
          z-index: -1;
        }

        .catch-timer {
          width: 200px;
          height: 12px;
          background: rgba(0,0,0,0.4);
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid rgba(255,255,255,0.3);
        }

        .timer-fill {
          height: 100%;
          background: linear-gradient(90deg, #E74C3C, #F1C40F, #27AE60);
        }

        /* Bait Display */
        .bait-display {
          position: absolute;
          bottom: 16px;
          left: 16px;
          padding-bottom: max(8px, env(safe-area-inset-bottom));
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          z-index: 30;
        }

        .bait-label {
          font-size: 10px;
          color: rgba(255,255,255,0.7);
          font-weight: 600;
          text-transform: uppercase;
        }

        .bait-icon {
          width: 48px;
          height: 48px;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
      `}</style>
        </div>
    );
};

export default FishingSceneV2;
