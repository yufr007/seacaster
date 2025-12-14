// Sound effects manager for SeaCaster
// Handles audio playback, volume control, and sound preloading

type SoundName =
    | 'cast'
    | 'splash'
    | 'reel'
    | 'catch_common'
    | 'catch_rare'
    | 'catch_epic'
    | 'catch_legendary'
    | 'catch_mythic'
    | 'level_up'
    | 'button_tap'
    | 'coin_collect'
    | 'xp_gain'
    | 'tournament_join'
    | 'victory'
    | 'defeat'
    | 'boss_roar'
    | 'countdown';

interface SoundConfig {
    src: string;
    volume: number;
    loop?: boolean;
}

// Sound URLs - using royalty-free sound effect placeholders
// In production, replace with actual audio files in /public/sounds/
const SOUND_LIBRARY: Record<SoundName, SoundConfig> = {
    cast: { src: '/sounds/cast.mp3', volume: 0.6 },
    splash: { src: '/sounds/splash.mp3', volume: 0.7 },
    reel: { src: '/sounds/reel.mp3', volume: 0.5, loop: true },
    catch_common: { src: '/sounds/catch_common.mp3', volume: 0.5 },
    catch_rare: { src: '/sounds/catch_rare.mp3', volume: 0.6 },
    catch_epic: { src: '/sounds/catch_epic.mp3', volume: 0.7 },
    catch_legendary: { src: '/sounds/catch_legendary.mp3', volume: 0.8 },
    catch_mythic: { src: '/sounds/catch_mythic.mp3', volume: 1.0 },
    level_up: { src: '/sounds/level_up.mp3', volume: 0.8 },
    button_tap: { src: '/sounds/tap.mp3', volume: 0.3 },
    coin_collect: { src: '/sounds/coin.mp3', volume: 0.5 },
    xp_gain: { src: '/sounds/xp.mp3', volume: 0.4 },
    tournament_join: { src: '/sounds/tournament.mp3', volume: 0.7 },
    victory: { src: '/sounds/victory.mp3', volume: 0.8 },
    defeat: { src: '/sounds/defeat.mp3', volume: 0.6 },
    boss_roar: { src: '/sounds/roar.mp3', volume: 0.9 },
    countdown: { src: '/sounds/countdown.mp3', volume: 0.5 },
};

class SoundManager {
    private audioCache: Map<SoundName, HTMLAudioElement> = new Map();
    private masterVolume: number = 0.7;
    private muted: boolean = false;
    private initialized: boolean = false;
    private currentLoops: Map<SoundName, HTMLAudioElement> = new Map();

    constructor() {
        // Load mute preference from localStorage
        if (typeof window !== 'undefined') {
            const savedMute = localStorage.getItem('seacaster_sound_muted');
            this.muted = savedMute === 'true';

            const savedVolume = localStorage.getItem('seacaster_sound_volume');
            if (savedVolume) this.masterVolume = parseFloat(savedVolume);
        }
    }

    // Initialize and preload critical sounds
    async init(): Promise<void> {
        if (this.initialized) return;

        const criticalSounds: SoundName[] = ['button_tap', 'catch_common', 'level_up'];

        await Promise.all(
            criticalSounds.map(name => this.preload(name))
        );

        this.initialized = true;
        console.log('[Sound] Manager initialized');
    }

    // Preload a sound into cache
    private async preload(name: SoundName): Promise<void> {
        if (this.audioCache.has(name)) return;

        const config = SOUND_LIBRARY[name];
        if (!config) return;

        try {
            const audio = new Audio();
            audio.src = config.src;
            audio.volume = config.volume * this.masterVolume;
            audio.preload = 'auto';

            await new Promise<void>((resolve) => {
                audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                audio.addEventListener('error', () => resolve(), { once: true }); // Fail silently
                audio.load();
            });

            this.audioCache.set(name, audio);
        } catch (e) {
            console.warn(`[Sound] Failed to preload ${name}`);
        }
    }

    // Play a sound effect
    play(name: SoundName): void {
        if (this.muted) return;

        const config = SOUND_LIBRARY[name];
        if (!config) return;

        try {
            // Clone cached audio or create new
            let audio: HTMLAudioElement;
            const cached = this.audioCache.get(name);

            if (cached) {
                audio = cached.cloneNode() as HTMLAudioElement;
            } else {
                audio = new Audio(config.src);
            }

            audio.volume = config.volume * this.masterVolume;
            audio.play().catch(() => { }); // Ignore autoplay errors
        } catch (e) {
            // Fail silently - sounds are non-critical
        }
    }

    // Play looping sound (like reel tension)
    playLoop(name: SoundName): void {
        if (this.muted) return;
        if (this.currentLoops.has(name)) return;

        const config = SOUND_LIBRARY[name];
        if (!config) return;

        const audio = new Audio(config.src);
        audio.volume = config.volume * this.masterVolume;
        audio.loop = true;
        audio.play().catch(() => { });

        this.currentLoops.set(name, audio);
    }

    // Stop a looping sound
    stopLoop(name: SoundName): void {
        const audio = this.currentLoops.get(name);
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            this.currentLoops.delete(name);
        }
    }

    // Stop all looping sounds
    stopAllLoops(): void {
        this.currentLoops.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        this.currentLoops.clear();
    }

    // Play catch sound based on rarity
    playCatchSound(rarity: string): void {
        const rarityLower = rarity.toLowerCase();

        switch (rarityLower) {
            case 'mythic':
                this.play('catch_mythic');
                break;
            case 'legendary':
                this.play('catch_legendary');
                break;
            case 'epic':
                this.play('catch_epic');
                break;
            case 'rare':
                this.play('catch_rare');
                break;
            default:
                this.play('catch_common');
        }
    }

    // Volume control
    setVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('seacaster_sound_volume', this.masterVolume.toString());

        // Update any playing loops
        this.currentLoops.forEach((audio, name) => {
            const config = SOUND_LIBRARY[name];
            audio.volume = config.volume * this.masterVolume;
        });
    }

    getVolume(): number {
        return this.masterVolume;
    }

    // Mute control
    setMuted(muted: boolean): void {
        this.muted = muted;
        localStorage.setItem('seacaster_sound_muted', muted.toString());

        if (muted) {
            this.stopAllLoops();
        }
    }

    isMuted(): boolean {
        return this.muted;
    }

    toggleMute(): boolean {
        this.setMuted(!this.muted);
        return this.muted;
    }
}

// Singleton instance
export const soundManager = new SoundManager();

// React hook for sound effects
export const useSounds = () => {
    return {
        play: (name: SoundName) => soundManager.play(name),
        playCatch: (rarity: string) => soundManager.playCatchSound(rarity),
        playLoop: (name: SoundName) => soundManager.playLoop(name),
        stopLoop: (name: SoundName) => soundManager.stopLoop(name),
        setVolume: (v: number) => soundManager.setVolume(v),
        toggleMute: () => soundManager.toggleMute(),
        isMuted: () => soundManager.isMuted(),
    };
};

// Initialize on first import
if (typeof window !== 'undefined') {
    soundManager.init();
}

export default soundManager;
