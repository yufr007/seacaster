// Analytics service for tracking user events
// Uses PostHog for event tracking when configured, else logs to console

interface AnalyticsConfig {
    apiKey: string;
    apiHost: string;
}

type EventProperties = Record<string, any>;

class AnalyticsService {
    private initialized: boolean = false;
    private posthog: any = null;
    private userId: string | null = null;

    async init(config?: AnalyticsConfig): Promise<void> {
        if (this.initialized) return;

        const apiKey = config?.apiKey || import.meta.env.VITE_POSTHOG_KEY;
        const apiHost = config?.apiHost || 'https://app.posthog.com';

        if (!apiKey) {
            console.log('[Analytics] PostHog key not configured, using console logging');
            this.initialized = true;
            return;
        }

        try {
            const posthog = await import('posthog-js');
            posthog.default.init(apiKey, {
                api_host: apiHost,
                persistence: 'localStorage',
                autocapture: true,
                capture_pageview: true,
                capture_pageleave: true,
            });
            this.posthog = posthog.default;
            this.initialized = true;
            console.log('[Analytics] PostHog initialized');
        } catch (error) {
            console.warn('[Analytics] Failed to initialize PostHog:', error);
            this.initialized = true; // Mark as initialized to prevent retries
        }
    }

    identify(userId: string, properties?: EventProperties): void {
        this.userId = userId;

        if (this.posthog) {
            this.posthog.identify(userId, properties);
        } else {
            console.log('[Analytics] Identify:', userId, properties);
        }
    }

    track(eventName: string, properties?: EventProperties): void {
        const enrichedProperties = {
            ...properties,
            timestamp: Date.now(),
            userId: this.userId,
        };

        if (this.posthog) {
            this.posthog.capture(eventName, enrichedProperties);
        } else {
            console.log('[Analytics] Track:', eventName, enrichedProperties);
        }
    }

    // Game-specific tracking helpers
    trackCatch(fish: { name: string; rarity: string; weight: number; xp: number }) {
        this.track('fish_caught', {
            fish_name: fish.name,
            rarity: fish.rarity,
            weight: fish.weight,
            xp_gained: fish.xp,
        });
    }

    trackLevelUp(level: number) {
        this.track('level_up', { level });
    }

    trackTournamentEntry(tournamentId: string, tournamentType: string, entryFee: number) {
        this.track('tournament_entry', {
            tournament_id: tournamentId,
            tournament_type: tournamentType,
            entry_fee: entryFee,
        });
    }

    trackSeasonPassPurchase(price: number) {
        this.track('season_pass_purchase', { price });
    }

    trackShare(platform: string, content: string) {
        this.track('share', { platform, content });
    }

    trackReferralCodeUsed(code: string) {
        this.track('referral_code_used', { code });
    }

    trackBossBattleComplete(bossName: string, victory: boolean, damage: number) {
        this.track('boss_battle_complete', {
            boss_name: bossName,
            victory,
            damage_dealt: damage,
        });
    }

    trackDailyLogin(streak: number) {
        this.track('daily_login', { streak });
    }

    trackError(error: string, context?: EventProperties) {
        this.track('error', { error, ...context });
    }

    // Page views
    trackPageView(pageName: string) {
        this.track('page_view', { page: pageName });
    }

    // Session management
    reset(): void {
        this.userId = null;
        if (this.posthog) {
            this.posthog.reset();
        }
    }
}

export const analytics = new AnalyticsService();

// Auto-init if key is available
if (typeof window !== 'undefined') {
    analytics.init();
}
