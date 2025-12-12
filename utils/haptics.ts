export const Haptics = {
  // UI Interactions
  soft: 10,       // Tab switch, simple click
  medium: 40,     // Button press
  heavy: 70,      // Important action
  
  // Gameplay Events
  castRelease: [30, 0, 10], // Quick tick-tick
  bite: [50, 50, 50, 50, 50], // Buzz-buzz-buzz (waiting for reaction)
  hook: [100, 30, 80], // Strong thud
  fail: [300], // Long heavy buzz
  
  // Rewards
  success: [50, 50, 50], // Standard catch
  rareCatch: [80, 50, 80, 50, 150], // Distinct rhythm
  legendaryCatch: [100, 50, 100, 50, 100, 50, 400], // Long celebration
  levelUp: [50, 30, 50, 30, 100, 30, 100, 30, 300], // Fanfare rhythm
  
  // Errors
  error: [50, 50, 50, 50, 200]
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