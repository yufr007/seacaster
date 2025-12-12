---
description: # 🎣 SEACASTER: MOBILE & UI FIX GUIDE
---

**Issue 1:** App not loading correctly on mobile (viewport/scaling)  
**Issue 2:** UI needs redesign to match new menu graphics  
**Status:** Critical for Phase 1 launch  

---

## **ISSUE 1: MOBILE VIEWPORT SCALING**

### **Root Cause**

Most likely one of these:

1. **Missing/incorrect `<meta viewport>` tag**
2. **Three.js canvas not responsive to mobile viewport changes**
3. **CSS fixed widths** instead of percentage-based
4. **DevicePixelRatio** not handled on high-DPI mobile screens

### **Quick Fix: Check index.html**

Open `index.html` and ensure this is in `<head>`:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#1a3a4a">
  <title>SeaCaster</title>
</head>
```

Key attributes:
- `width=device-width` - match phone width
- `initial-scale=1.0` - no auto-zoom
- `viewport-fit=cover` - notch support (iPhone)

### **Quick Fix: CSS Body/HTML**

In `index.css` or your main styles:

```css
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a1929;
}

#root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
```

**DO NOT use:**
```css
width: 1280px;  /* ❌ BREAKS mobile */
height: 720px;  /* ❌ BREAKS mobile */
```

### **Fix Three.js Responsive Rendering**

In `components/FishingScene.tsx` (or wherever Three.js canvas is created):

```typescript
useEffect(() => {
  // Adaptive sizing
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio); // ← Handle mobile DPI
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  // Handle window resize + orientation change
  const handleResize = () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    renderer.setSize(newWidth, newHeight);
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize); // ← Mobile rotation
  
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
}, []);
```

### **Test on Mobile**

```bash
# Build locally
npm run build

# Serve
npx serve -s dist

# Open on phone: http://your-laptop-ip:3000
# Or use Vercel deployment: https://seacaster.vercel.app

# Check browser console (F12 on phone):
# - No errors about canvas/viewport
# - Game fills entire screen
# - No horizontal scrolling
```

---

## **ISSUE 2: UI REDESIGN WITH NEW GRAPHICS**

Your new menu screen shows:

```
[Menu-Screen.jpg]
├─ XP bar (top left, blue)
├─ Coins count (top right, 100 coins)
├─ BASE MAINNET badge (bottom left)
├─ CONNECT WALLET button (center, bright blue)
├─ Three nav buttons:
│  ├─ Compete (left - trophy icon)
│  ├─ Home center icon (house icon)
│  └─ Shop (right - shopping bag icon)
└─ Deep blue/ocean gradient background
```

### **UI Component Replacement**

Create `components/MenuScreen.tsx`:

```typescript
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import './MenuScreen.css';

interface MenuScreenProps {
  onCompete: () => void;
  onShop: () => void;
  onConnect: () => void;
  xp: number;
  coins: number;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  onCompete,
  onShop,
  onConnect,
  xp,
  coins,
}) => {
  const { user } = useAuth();

  return (
    <div className="menu-screen">
      {/* Top bar */}
      <div className="menu-header">
        <div className="xp-section">
          <div className="level-box">1</div>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: '0%' }}></div>
            <span className="xp-text">XP 0%</span>
          </div>
          <button className="xp-settings">⚙️</button>
        </div>

        <div className="coins-section">
          <span className="coins-count">{coins}</span>
          <span className="coins-icon">🪙</span>
        </div>
      </div>

      {/* Main content */}
      <div className="menu-content">
        <div className="network-badge">📍 BASE MAINNET</div>

        <div className="main-circle">
          <span className="house-icon">🏠</span>
        </div>

        <button
          className="connect-wallet-btn"
          onClick={onConnect}
          disabled={!!user}
        >
          {user ? `Connected: ${user.wallet}` : 'Connect Wallet'}
        </button>
      </div>

      {/* Bottom navigation */}
      <div className="menu-nav">
        <button className="nav-btn compete-btn" onClick={onCompete}>
          <span className="nav-icon">🏆</span>
          <span className="nav-label">Compete</span>
        </button>

        <button className="nav-btn home-btn">
          <span className="nav-icon">🎣</span>
        </button>

        <button className="nav-btn shop-btn" onClick={onShop}>
          <span className="nav-icon">🛍️</span>
          <span className="nav-label">Shop</span>
        </button>
      </div>
    </div>
  );
};
```

### **Menu Styling: MenuScreen.css**

```css
.menu-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a1929 0%, #1a3a4a 50%, #0d2a3d 100%);
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
}

/* Header */
.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
}

.xp-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.level-box {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  border-radius: 8px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.xp-bar {
  position: relative;
  flex: 1;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
  transition: width 0.3s ease;
}

.xp-text {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 600;
}

.xp-settings {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s ease;
}

.xp-settings:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.coins-section {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  padding: 8px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.coins-count {
  font-size: 18px;
  font-weight: bold;
}

.coins-icon {
  font-size: 24px;
}

/* Main content */
.menu-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  position: relative;
  padding: 40px 20px;
}

.network-badge {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(37, 99, 235, 0.2);
  border: 1px solid rgba(37, 99, 235, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.main-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.4);
  border: 4px solid rgba(255, 255, 255, 0.2);
}

.connect-wallet-btn {
  padding: 16px 40px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  min-width: 240px;
}

.connect-wallet-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(37, 99, 235, 0.5);
}

.connect-wallet-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Bottom navigation */
.menu-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 16px 20px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  gap: 16px;
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: rgba(37, 99, 235, 0.2);
  border-color: rgba(37, 99, 235, 0.5);
  transform: translateY(-2px);
}

.nav-icon {
  font-size: 28px;
}

.nav-label {
  font-size: 12px;
  font-weight: 600;
}

.home-btn {
  flex: 0;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.home-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

/* Mobile responsive */
@media (max-width: 480px) {
  .menu-header {
    padding: 16px;
  }

  .xp-section {
    gap: 8px;
  }

  .level-box {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .main-circle {
    width: 100px;
    height: 100px;
    font-size: 60px;
  }

  .connect-wallet-btn {
    padding: 14px 32px;
    font-size: 14px;
    min-width: 200px;
  }

  .menu-nav {
    gap: 8px;
  }

  .nav-icon {
    font-size: 24px;
  }

  .nav-label {
    font-size: 11px;
  }
}
```

---

## **INTEGRATION STEPS**

### **Step 1: Replace Main Game Component**

In `App.tsx` or your main entry:

```typescript
import { MenuScreen } from './components/MenuScreen';
import { FishingScene } from './components/FishingScene';
import { useState } from 'react';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game' | 'shop'>('menu');
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(100);

  return (
    <div className="app-container">
      {screen === 'menu' && (
        <MenuScreen
          onCompete={() => setScreen('game')}
          onShop={() => setScreen('shop')}
          onConnect={() => console.log('Connect wallet')}
          xp={xp}
          coins={coins}
        />
      )}
      {screen === 'game' && (
        <FishingScene onBack={() => setScreen('menu')} />
      )}
      {screen === 'shop' && (
        <div className="shop-placeholder">Shop - Coming Soon</div>
      )}
    </div>
  );
}
```

### **Step 2: Commit Changes**

```bash
cd ~/Documents/SeaCaster

git add components/MenuScreen.tsx components/MenuScreen.css
git add src/App.tsx

git commit -m "feat: redesign menu UI with new graphics

- New MenuScreen component matching seacaster branding
- Responsive mobile-first design
- XP bar, coin counter, network badge
- Three-button navigation (Compete, Home, Shop)
- Three.js canvas adaptive viewport handling
- Support for mobile rotation/resize events

UI matches: menu-screen.jpg specifications"

git push origin main
```

### **Step 3: Vercel Auto-Deploy**

- Vercel detects push
- Builds with new components
- Deploys to https://seacaster.vercel.app
- Check deployment status in Vercel dashboard

---

## **TESTING MOBILE**

```bash
# On desktop
npm run dev
# Open DevTools (F12) → Device Emulation (tablet + phone)
# Test all screen sizes