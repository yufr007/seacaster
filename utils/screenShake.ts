// Screen shake utility for game juice
// Provides configurable shake effects for catches, level-ups, and impacts

type ShakeIntensity = 'light' | 'medium' | 'heavy' | 'epic';

interface ShakeConfig {
    intensity: number;
    duration: number;
    decay: number;
}

const SHAKE_PRESETS: Record<ShakeIntensity, ShakeConfig> = {
    light: { intensity: 3, duration: 200, decay: 0.9 },
    medium: { intensity: 6, duration: 300, decay: 0.85 },
    heavy: { intensity: 12, duration: 400, decay: 0.8 },
    epic: { intensity: 20, duration: 600, decay: 0.75 },
};

// Get shake intensity based on fish rarity
export const getShakeForRarity = (rarity: string): ShakeIntensity => {
    switch (rarity.toUpperCase()) {
        case 'MYTHIC': return 'epic';
        case 'LEGENDARY': return 'heavy';
        case 'EPIC': return 'medium';
        case 'RARE': return 'light';
        default: return 'light';
    }
};

// CSS keyframes for screen shake
export const generateShakeKeyframes = (intensity: number): string => {
    const frames: string[] = [];
    const steps = 10;

    for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const currentIntensity = intensity * Math.pow(1 - progress, 2);
        const x = (Math.random() - 0.5) * currentIntensity * 2;
        const y = (Math.random() - 0.5) * currentIntensity * 2;
        const rotation = (Math.random() - 0.5) * currentIntensity * 0.5;

        frames.push(`${Math.round(progress * 100)}% { transform: translate(${x}px, ${y}px) rotate(${rotation}deg); }`);
    }

    return `@keyframes screenShake { ${frames.join(' ')} }`;
};

// Apply screen shake to an element
export const applyScreenShake = (
    element: HTMLElement | null,
    preset: ShakeIntensity = 'medium'
): void => {
    if (!element) return;

    const config = SHAKE_PRESETS[preset];

    // Create unique animation
    const animationName = `shake_${Date.now()}`;
    const keyframes = generateShakeKeyframes(config.intensity);

    // Inject keyframes
    const styleSheet = document.createElement('style');
    styleSheet.textContent = keyframes.replace('screenShake', animationName);
    document.head.appendChild(styleSheet);

    // Apply animation
    element.style.animation = `${animationName} ${config.duration}ms ease-out`;

    // Cleanup
    setTimeout(() => {
        element.style.animation = '';
        styleSheet.remove();
    }, config.duration + 50);
};

// Screen shake hook for React components
export const useScreenShake = () => {
    const shake = (preset: ShakeIntensity = 'medium') => {
        const gameContainer = document.getElementById('game-container') || document.body;
        applyScreenShake(gameContainer, preset);
    };

    const shakeForRarity = (rarity: string) => {
        shake(getShakeForRarity(rarity));
    };

    const shakeOnCatch = (rarity: string) => {
        shakeForRarity(rarity);
    };

    const shakeOnLevelUp = () => {
        shake('heavy');
    };

    const shakeOnBossHit = () => {
        shake('epic');
    };

    return {
        shake,
        shakeForRarity,
        shakeOnCatch,
        shakeOnLevelUp,
        shakeOnBossHit,
    };
};

export default useScreenShake;
