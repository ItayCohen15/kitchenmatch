// רטט מישוש (haptics) — משוב פיזי קליל בפעולות מפתח.
// עובד באנדרואיד (Vibration API). ב-iOS Safari אין vibrate — נכשל בשקט (try/catch).
type Pattern = 'light' | 'medium' | 'selection' | 'success' | 'warning' | 'error';

const MAP: Record<Pattern, number | number[]> = {
  light:     10,
  medium:    20,
  selection: 8,
  success:   [12, 40, 12],
  warning:   [20, 60, 20],
  error:     [30, 50, 30],
};

export function haptic(pattern: Pattern = 'light') {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(MAP[pattern]);
    }
  } catch { /* לא נתמך — מתעלמים */ }
}
