export const Haptics = {
  // UI Interactions
  soft: 10,       // Tab switch, simple click
  medium: 40,     // Button press
  heavy: 70,      // Important action
  light: 20,      // Subtle feedback

  // Gameplay Events
  castRelease: [30, 0, 10], // Quick tick-tick
  bite: [50, 50, 50, 50, 50], // Buzz-buzz-buzz (waiting for reaction)
  hook: [100, 30, 80], // Strong thud
  fail: [300], // Long heavy buzz

  // Reeling Mini-Game
  reelTension: [20, 30], // Short pulse during tension
  reelPull: [40, 20, 40], // Fish pulling
  perfectTiming: [80], // Perfect swipe timing
  comboHit: [60, 30, 60], // Combo streak
  lineTension: [30, 50, 30, 50], // Line getting tight

  // Rewards
  success: [50, 50, 50], // Standard catch
  rareCatch: [80, 50, 80, 50, 150], // Distinct rhythm
  epicCatch: [90, 40, 90, 40, 90, 40, 200], // Epic tier
  legendaryCatch: [100, 50, 100, 50, 100, 50, 400], // Long celebration
  levelUp: [50, 30, 50, 30, 100, 30, 100, 30, 300], // Fanfare rhythm

  // Streak & Bonus
  streakPulse: [30, 20, 30], // Daily streak increment
  xpGain: [40, 30], // XP gained
  coinGain: [30, 20, 30], // Coins earned

  // Errors
  error: [50, 50, 50, 50, 200],
  lineBreak: [200, 100, 200], // Line snapped
  fishEscape: [100, 100, 100, 100] // Fish got away
};

export const triggerHaptic = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore errors on devices that don't support it or if user hasn't interacted
    }
  }
};