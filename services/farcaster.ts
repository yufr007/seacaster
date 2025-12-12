import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterUser {
  fid: number;
  username: string;
  pfpUrl: string;
}

class FarcasterService {
  private user: FarcasterUser | null = null;
  private isReady: boolean = false;

  async init(): Promise<void> {
    if (this.isReady) return;

    try {
      // Small timeout to prevent hanging if SDK doesn't respond
      const readyPromise = sdk.actions.ready();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SDK Timeout')), 2000));

      await Promise.race([readyPromise, timeoutPromise]);

      const context = await sdk.context;
      if (context && context.user) {
        this.user = {
          fid: context.user.fid,
          username: context.user.username || `fisher_${context.user.fid}`,
          pfpUrl: context.user.pfpUrl || '',
        };
      } else {
        throw new Error("No context found");
      }
      this.isReady = true;
    } catch (error) {
      console.warn('Farcaster SDK init failed (running in browser?):', error);
      // Fallback for development/browser
      this.user = {
        fid: 123456,
        username: 'Captain_Dev',
        pfpUrl: '',
      };
      this.isReady = true;
    }
  }

  getUser(): FarcasterUser | null {
    return this.user;
  }

  async shareCatch(text: string, embedUrl?: string) {
    try {
      await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(embedUrl || 'https://seacaster.app')}`);
    } catch (e) {
      console.error('Share failed', e);
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`, '_blank');
    }
  }

  async addMiniApp() {
    try {
      await sdk.actions.addFrame();
    } catch (e) {
      console.error('Add MiniApp failed', e);
    }
  }
}

export const farcaster = new FarcasterService();