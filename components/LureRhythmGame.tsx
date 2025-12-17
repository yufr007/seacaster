import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rarity } from '../types';
import { triggerHaptic, Haptics } from '../utils/haptics';
import { useSound } from '../hooks/useSound';

interface LureRhythmGameProps {
    targetRarity: Rarity;
    onComplete: (perfectHits: number, totalHits: number) => void;
    isActive: boolean;
}

interface RhythmNote {
    id: number;
    position: number; // 0-100 (progress across screen)
    hit: boolean | null; // null = not judged, true = hit, false = missed
}

/**
 * Lure Rhythm Mini-Game
 * 
 * - Notes flow toward a hit zone
 * - Tap when note is in zone for "Perfect" hits
 * - More perfects = Higher rarity fish chance
 * - Creates skill expression during WAITING phase
 */
const LureRhythmGame: React.FC<LureRhythmGameProps> = ({
    targetRarity,
    onComplete,
    isActive,
}) => {
    const [notes, setNotes] = useState<RhythmNote[]>([]);
    const [score, setScore] = useState({ perfect: 0, good: 0, miss: 0 });
    const [combo, setCombo] = useState(0);
    const [showFeedback, setShowFeedback] = useState<'perfect' | 'good' | 'miss' | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [totalNotes, setTotalNotes] = useState(0);
    const noteIdRef = useRef(0);
    const { play } = useSound();

    // Hit zone position (%)
    const HIT_ZONE = 75;
    const PERFECT_RANGE = 5;
    const GOOD_RANGE = 12;

    // Get difficulty based on rarity
    const getDifficulty = useCallback(() => {
        const difficulties = {
            [Rarity.COMMON]: { noteCount: 4, noteSpeed: 1.5, interval: 1000 },
            [Rarity.UNCOMMON]: { noteCount: 5, noteSpeed: 2, interval: 900 },
            [Rarity.RARE]: { noteCount: 6, noteSpeed: 2.5, interval: 800 },
            [Rarity.EPIC]: { noteCount: 8, noteSpeed: 3, interval: 700 },
            [Rarity.LEGENDARY]: { noteCount: 10, noteSpeed: 3.5, interval: 600 },
            [Rarity.MYTHIC]: { noteCount: 12, noteSpeed: 4, interval: 500 },
        };
        return difficulties[targetRarity] || difficulties[Rarity.COMMON];
    }, [targetRarity]);

    // Start game
    useEffect(() => {
        if (!isActive) return;

        const difficulty = getDifficulty();
        setTotalNotes(difficulty.noteCount);
        setGameStarted(true);

        // Spawn notes at intervals
        let spawned = 0;
        const spawnInterval = setInterval(() => {
            if (spawned >= difficulty.noteCount) {
                clearInterval(spawnInterval);
                return;
            }

            noteIdRef.current += 1;
            setNotes((prev) => [
                ...prev,
                { id: noteIdRef.current, position: 0, hit: null },
            ]);
            spawned += 1;
        }, difficulty.interval);

        return () => clearInterval(spawnInterval);
    }, [isActive, getDifficulty]);

    // Move notes across screen
    useEffect(() => {
        if (!gameStarted) return;

        const difficulty = getDifficulty();
        const moveInterval = setInterval(() => {
            setNotes((prev) => {
                const updated = prev.map((note) => ({
                    ...note,
                    position: note.position + difficulty.noteSpeed,
                }));

                // Check for missed notes
                updated.forEach((note) => {
                    if (note.position > HIT_ZONE + GOOD_RANGE && note.hit === null) {
                        note.hit = false;
                        setScore((s) => ({ ...s, miss: s.miss + 1 }));
                        setCombo(0);
                        setShowFeedback('miss');
                        setTimeout(() => setShowFeedback(null), 300);
                    }
                });

                // Remove notes that are off screen
                const filtered = updated.filter((note) => note.position < 110);

                // Check if game is complete
                const hitNotes = updated.filter((n) => n.hit !== null).length;
                if (hitNotes >= totalNotes && totalNotes > 0) {
                    setTimeout(() => {
                        onComplete(score.perfect, score.perfect + score.good);
                    }, 500);
                }

                return filtered;
            });
        }, 50);

        return () => clearInterval(moveInterval);
    }, [gameStarted, getDifficulty, HIT_ZONE, GOOD_RANGE, totalNotes, score, onComplete]);

    // Handle tap
    const handleTap = () => {
        if (!gameStarted) return;

        // Find the closest unhit note to the hit zone
        const hittableNotes = notes.filter(
            (n) => n.hit === null && Math.abs(n.position - HIT_ZONE) <= GOOD_RANGE
        );

        if (hittableNotes.length === 0) {
            // Tapped with no note nearby
            setCombo(0);
            return;
        }

        const closest = hittableNotes.reduce((a, b) =>
            Math.abs(a.position - HIT_ZONE) < Math.abs(b.position - HIT_ZONE) ? a : b
        );

        const distance = Math.abs(closest.position - HIT_ZONE);

        if (distance <= PERFECT_RANGE) {
            // Perfect hit
            setNotes((prev) =>
                prev.map((n) => (n.id === closest.id ? { ...n, hit: true } : n))
            );
            setScore((s) => ({ ...s, perfect: s.perfect + 1 }));
            setCombo((c) => c + 1);
            setShowFeedback('perfect');
            triggerHaptic(Haptics.success);
            play('tap');
        } else if (distance <= GOOD_RANGE) {
            // Good hit
            setNotes((prev) =>
                prev.map((n) => (n.id === closest.id ? { ...n, hit: true } : n))
            );
            setScore((s) => ({ ...s, good: s.good + 1 }));
            setCombo((c) => c + 1);
            setShowFeedback('good');
            triggerHaptic(Haptics.soft);
            play('tap');
        }

        setTimeout(() => setShowFeedback(null), 300);
    };

    const getRarityColor = (): string => {
        const colors = {
            [Rarity.COMMON]: '#9CA3AF',
            [Rarity.UNCOMMON]: '#10B981',
            [Rarity.RARE]: '#3B82F6',
            [Rarity.EPIC]: '#8B5CF6',
            [Rarity.LEGENDARY]: '#F59E0B',
            [Rarity.MYTHIC]: '#EC4899',
        };
        return colors[targetRarity] || '#9CA3AF';
    };

    if (!isActive) return null;

    return (
        <motion.div
            className="rhythm-game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleTap}
        >
            {/* Background */}
            <div className="rhythm-bg" />

            {/* Title */}
            <div className="rhythm-title">
                <span>LURE THE FISH</span>
                <span className="subtitle">Tap when notes hit the zone!</span>
            </div>

            {/* Track */}
            <div className="rhythm-track">
                {/* Hit Zone */}
                <div
                    className="hit-zone"
                    style={{ left: `${HIT_ZONE}%` }}
                >
                    <div className="zone-glow" style={{ backgroundColor: getRarityColor() }} />
                </div>

                {/* Notes */}
                {notes.map((note) => (
                    <motion.div
                        key={note.id}
                        className={`note ${note.hit === true ? 'hit' : ''} ${note.hit === false ? 'missed' : ''}`}
                        style={{
                            left: `${note.position}%`,
                            backgroundColor: getRarityColor(),
                        }}
                        initial={{ scale: 0 }}
                        animate={{
                            scale: note.hit === null ? 1 : note.hit ? 1.5 : 0.5,
                            opacity: note.hit === null ? 1 : 0,
                        }}
                    />
                ))}
            </div>

            {/* Score Display */}
            <div className="score-display">
                <div className="score-item">
                    <span className="score-label">PERFECT</span>
                    <span className="score-value perfect">{score.perfect}</span>
                </div>
                <div className="score-item">
                    <span className="score-label">GOOD</span>
                    <span className="score-value good">{score.good}</span>
                </div>
                <div className="score-item">
                    <span className="score-label">MISS</span>
                    <span className="score-value miss">{score.miss}</span>
                </div>
            </div>

            {/* Combo Display */}
            <AnimatePresence>
                {combo >= 3 && (
                    <motion.div
                        className="combo-display"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                    >
                        {combo}x COMBO!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback */}
            <AnimatePresence>
                {showFeedback && (
                    <motion.div
                        className={`feedback ${showFeedback}`}
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {showFeedback.toUpperCase()}!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress */}
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{
                        width: `${((score.perfect + score.good + score.miss) / totalNotes) * 100}%`,
                        backgroundColor: getRarityColor(),
                    }}
                />
            </div>

            <style>{`
        .rhythm-game {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
        }

        .rhythm-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, 
            rgba(0, 50, 100, 0.9) 0%, 
            rgba(0, 30, 60, 0.95) 100%
          );
          backdrop-filter: blur(10px);
        }

        .rhythm-title {
          position: relative;
          text-align: center;
          margin-bottom: 40px;
        }

        .rhythm-title span {
          display: block;
          color: white;
          font-size: 28px;
          font-weight: 900;
          text-shadow: 0 4px 8px rgba(0,0,0,0.5);
        }

        .rhythm-title .subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          margin-top: 8px;
        }

        .rhythm-track {
          position: relative;
          width: 90%;
          height: 80px;
          background: rgba(0,0,0,0.3);
          border-radius: 40px;
          overflow: visible;
        }

        .hit-zone {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 60px;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          border-radius: 16px;
          z-index: 5;
        }

        .zone-glow {
          position: absolute;
          inset: -10px;
          border-radius: 20px;
          opacity: 0.4;
          filter: blur(15px);
        }

        .note {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 2;
        }

        .note.hit {
          opacity: 0;
        }

        .note.missed {
          opacity: 0;
        }

        .score-display {
          position: relative;
          display: flex;
          gap: 30px;
          margin-top: 40px;
        }

        .score-item {
          text-align: center;
        }

        .score-label {
          display: block;
          font-size: 10px;
          color: #9CA3AF;
          letter-spacing: 1px;
        }

        .score-value {
          font-size: 28px;
          font-weight: 900;
        }

        .score-value.perfect {
          color: #F59E0B;
        }

        .score-value.good {
          color: #10B981;
        }

        .score-value.miss {
          color: #EF4444;
        }

        .combo-display {
          position: absolute;
          top: 20%;
          font-size: 32px;
          font-weight: 900;
          color: #F1C40F;
          text-shadow: 0 4px 8px rgba(0,0,0,0.5);
        }

        .feedback {
          position: absolute;
          font-size: 36px;
          font-weight: 900;
          text-shadow: 0 4px 8px rgba(0,0,0,0.5);
        }

        .feedback.perfect {
          color: #F59E0B;
        }

        .feedback.good {
          color: #10B981;
        }

        .feedback.miss {
          color: #EF4444;
        }

        .progress-bar {
          position: absolute;
          bottom: 40px;
          left: 20px;
          right: 20px;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.2s ease-out;
          border-radius: 4px;
        }
      `}</style>
        </motion.div>
    );
};

export default LureRhythmGame;
