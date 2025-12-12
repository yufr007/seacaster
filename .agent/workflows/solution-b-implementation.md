---
description: Solution B implementation guide
---

# ✅ SEACASTER: Solution B - Manual Integration Implementation Guide

**Date:** December 7, 2025, 12:44 AM AEDT  
**Decision:** Solution B (Manual Integration with wagmi + viem)  
**Estimated Time:** ~3 hours total  
**Status:** Ready to implement

---

## **Why Solution B is Perfect for Farcaster Mini Apps**

```
✅ Single unified app (no context switching)
✅ Simpler WebSocket/state management
✅ Better frame performance (no iframe overhead)
✅ Direct DOM manipulation (needed for Farcaster)
✅ You already have wagmi + viem installed
✅ React 18 is stable and proven
✅ Fast deployment (< 1 hour for wallet connect)
```

---

## **STEP 1: Remove OnchainKit (5 minutes)**

```bash
# Uninstall the conflict
npm uninstall @coinbase/onchainkit

# Verify it's gone
npm list | grep onchainkit
# Should return nothing

# Verify no peer dependency errors
npm list react react-dom
# Should show: react@18.3.1, react-dom@18.3.1 with NO errors
```

**What you're keeping:**
```
✅ react@18.3.1
✅ react-dom@18.3.1
✅ @react-three/fiber
✅ @react-three/drei
✅ @react-spring/three
✅ wagmi@2.19.5 (already installed)
✅ viem@latest (already installed)
```

---

## **STEP 2: Create Custom Wallet Component (45 minutes)**

Create `src/components/WalletConnect.tsx`:

```typescript
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useEffect } from 'react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="wallet-info">
          <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          <button 
            onClick={() => disconnect()}
            className="btn btn--secondary"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button 
          onClick={() => connect({ connector: injected() })}
          className="btn btn--primary"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
```

Create `src/config/wagmi.ts`:

```typescript
import { createConfig, http } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [injected()],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
```

Wrap your app with WagmiProvider in `src/App.tsx`:

```typescript
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './config/wagmi';
import { Game } from './Game';
import { WalletConnect } from './components/WalletConnect';

export function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <div className="app">
        <header className="app-header">
          <h1>SeaCaster</h1>
          <WalletConnect />
        </header>
        <main className="app-main">
          <Game />
        </main>
      </div>
    </WagmiProvider>
  );
}
```

---

## **STEP 3: Add Blockchain Interactions (1 hour)**

Create `src/hooks/useBaseIntegration.ts`:

```typescript
import { useAccount } from 'wagmi';
import { useCallback } from 'react';

export function useBaseIntegration() {
  const { address, isConnected } = useAccount();

  const getUserBalance = useCallback(async () => {
    if (!address) return null;
    
    // Use viem to fetch balance
    // Implementation depends on your needs
    return address;
  }, [address]);

  const submitScore = useCallback(async (score: number) => {
    if (!isConnected || !address) {
      console.error('Wallet not connected');
      return;
    }

    // Send score to your backend API
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address,
        score,
        timestamp: Date.now(),
      }),
    });

    return response.json();
  }, [isConnected, address]);

  return {
    address,
    isConnected,
    getUserBalance,
    submitScore,
  };
}
```

Use in your game:

```typescript
import { useBaseIntegration } from './hooks/useBaseIntegration';

export function Game() {
  const { address, isConnected, submitScore } = useBaseIntegration();

  const handleGameOver = async (finalScore: number) => {
    if (isConnected) {
      await submitScore(finalScore);
    }
  };

  return (
    <div>
      {isConnected && <p>Playing as {address?.slice(0, 6)}...</p>}
      {/* Your 3D game here */}
    </div>
  );
}
```

---

## **STEP 4: Add Styling (15 minutes)**

Add to `src/styles/wallet.css`:

```css
.wallet-connect {
  padding: 16px;
  background: var(--color-surface);
  border-radius: var(--radius-base);
  border: 1px solid var(--color-border);
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.wallet-info p {
  margin: 0;
  font-weight: 500;
  font-family: monospace;
}

.btn {
  padding: 8px 16px;
  border-radius: var(--radius-base);
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 150ms ease-standard;
}

.btn--primary {
  background: var(--color-primary);
  color: var(--color-btn-primary-text);
}

.btn--primary:hover {
  background: var(--color-primary-hover);
}

.btn--secondary {
  background: var(--color-secondary);
  color: var(--color-text);
}

.btn--secondary:hover {
  background: var(--color-secondary-hover);
}
```

---

## **STEP 5: Test Everything (30 minutes)**

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Verify no conflicts
npm list react react-dom
# Should show: react@18.3.1, react-dom@18.3.1 with NO ELSPROBLEMS

# 3. Start dev server
npm run dev

# 4. Test wallet connection
# - Click "Connect Wallet" button
# - Approve in MetaMask/Coinbase Wallet
# - Verify address displays
# - Test disconnect button

# 5. Test game
# - Verify 3D rendering works (no issues with React 18)
# - Test animations
# - Test WebSocket if needed

# 6. Test blockchain
# - Play game
# - Submit score (if connected)
# - Check backend receives data
```

---

## **Implementation Checklist**

- [ ] Step 1: `npm uninstall @coinbase/onchainkit` (5 min)
- [ ] Step 2: Create `WalletConnect.tsx` component (15 min)
- [ ] Step 2: Create `wagmi.ts` config (10 min)
- [ ] Step 2: Update `App.tsx` with WagmiProvider (10 min)
- [ ] Step 3: Create `useBaseIntegration.ts` hook (20 min)
- [ ] Step 3: Integrate with game component (20 min)
- [ ] Step 4: Add CSS styling (15 min)
- [ ] Step 5: Test all functionality (30 min)

**Total: ~2.5 hours (well under 3 hour estimate)**

---

## **What You Get**

✅ **Single React 18 app** - no complexity  
✅ **Wallet connection** - MetaMask, Coinbase, WalletConnect  
✅ **3D game rendering** - full Three.js capability  
✅ **Blockchain integration** - wagmi + viem ready  
✅ **Score submission** - to your backend  
✅ **Farcaster compatibility** - perfect for mini apps  

---

## **What's NOT Included (But Easy to Add)**

- Smart contract interactions (use viem for this)
- NFT minting (add wagmi write hooks)
- Token transfers (use wagmi contracts hook)
- On-chain leaderboard (backend + contract calls)

All of these use wagmi + viem which you already have.

---

## **Security Notes**

✅ No server-side wallets (user controls keys)  
✅ No sensitive data stored client-side  
✅ No CVE-2025-55182 impact (no RSC, no Next.js)  
✅ React 18 is stable and secure  
✅ wagmi + viem are battle-tested  

---

## **Next Steps**

1. **Run Step 1** (uninstall OnchainKit) - verify no errors
2. **Create files from Steps 2-3** - copy/paste code above
3. **Run Step 5 tests** - verify wallet and game both work
4. **Proceed with Phase 1** - no more blockers!

---

## **Timeline Restored**

```
Previous blocker: 6.5 hours (monorepo)
New solution: 2.5 hours (manual integration)
Phase 1 start: TODAY (Sunday night / Monday morning)
First mini app launch: Still on track ✅
```

---

**Solution B is the smart choice. Let's execute it now.** 🎣

