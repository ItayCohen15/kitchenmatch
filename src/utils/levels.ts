// מערכת רמות עובדים — מקור אמת יחיד בצד הלקוח (תואם ל-API/levels.js)
// הפרש של 30 משמרות בין רמה לרמה

export interface LevelInfo {
  key: string;
  label: string;
  min: number;          // משמרות מינימום לרמה
  commission: number;   // אחוז עמלת העובד
  exposure: number;     // משקל חשיפה למסעדות (1-5)
  earlyAccessMin: number; // כמה דקות גישה מוקדמת לפני ברונזה
  emoji: string;
  color: string;        // טקסט+רקע ל-badge
  gradient: string;     // גרדיאנט לאלמנטים בולטים
  perks: string[];      // הטבות הרמה (מצטברות)
}

export const LEVELS: LevelInfo[] = [
  { key: 'bronze',   label: 'ברונזה',  min: 0,   commission: 0.065, exposure: 1, earlyAccessMin: 0, emoji: '🥉',
    color: 'text-amber-700 bg-amber-50',  gradient: 'linear-gradient(135deg,#b45309,#92400e)',
    perks: ['גישה למשמרות זמינות', 'עמלה 6.5%'] },
  { key: 'silver',   label: 'כסף',     min: 30,  commission: 0.065, exposure: 2, earlyAccessMin: 3, emoji: '🥈',
    color: 'text-slate-600 bg-slate-100', gradient: 'linear-gradient(135deg,#94a3b8,#64748b)',
    perks: ['גישה מוקדמת ב-3 דק׳ למשמרות', 'חשיפה מוגברת למסעדות'] },
  { key: 'gold',     label: 'זהב',     min: 60,  commission: 0.060, exposure: 3, earlyAccessMin: 6, emoji: '🥇',
    color: 'text-yellow-600 bg-yellow-50', gradient: 'linear-gradient(135deg,#e8a020,#f5c842)',
    perks: ['עמלה מופחתת 6%', 'גישה מוקדמת ב-6 דק׳', 'עדיפות בשיבוץ'] },
  { key: 'platinum', label: 'פלטינום', min: 90,  commission: 0.060, exposure: 4, earlyAccessMin: 8, emoji: '💠',
    color: 'text-cyan-600 bg-cyan-50',    gradient: 'linear-gradient(135deg,#22d3ee,#0891b2)',
    perks: ['גישה מוקדמת ב-8 דק׳', 'חשיפה גבוהה מאוד', 'תמיכה מועדפת'] },
  { key: 'diamond',  label: 'דיימונד', min: 120, commission: 0.055, exposure: 5, earlyAccessMin: 10, emoji: '💎',
    color: 'text-indigo-600 bg-indigo-50', gradient: 'linear-gradient(135deg,#818cf8,#6366f1)',
    perks: ['עמלה הנמוכה ביותר 5.5%', 'גישה מיידית למשמרות חדשות', 'עדיפות עליונה בתוצאות', 'גישה ראשונה למשמרות חירום'] },
];

// כל ההטבות שנפתחו עד רמה מסוימת (מצטבר)
export function unlockedPerks(levelKey?: string): string[] {
  const idx = LEVELS.findIndex(l => l.key === (getLevel(levelKey).key));
  return LEVELS.slice(0, idx + 1).flatMap(l => l.perks);
}

export function getLevel(key?: string): LevelInfo {
  return LEVELS.find(l => l.key === key) || LEVELS[0];
}

export function levelFromShifts(shifts?: number): LevelInfo {
  const s = Number(shifts) || 0;
  let lvl = LEVELS[0];
  for (const l of LEVELS) if (s >= l.min) lvl = l;
  return lvl;
}

// אחוז עמלת העובד לפי רמה
export function workerCommissionRate(levelKey?: string): number {
  return getLevel(levelKey).commission;
}

// מכפיל הנטו שהעובד מקבל (1 - עמלה)
export function netMultiplier(levelKey?: string): number {
  return 1 - workerCommissionRate(levelKey);
}

// מידע על הרמה הבאה והתקדמות אליה
export function nextLevelProgress(shifts?: number): {
  current: LevelInfo;
  next: LevelInfo | null;
  shiftsNeeded: number;
  progress: number; // 0-100
} {
  const s = Number(shifts) || 0;
  const current = levelFromShifts(s);
  const idx = LEVELS.findIndex(l => l.key === current.key);
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  if (!next) return { current, next: null, shiftsNeeded: 0, progress: 100 };
  const span = next.min - current.min;          // תמיד 30
  const done = s - current.min;
  const shiftsNeeded = Math.max(next.min - s, 0);
  const progress = Math.min(Math.round((done / span) * 100), 100);
  return { current, next, shiftsNeeded, progress };
}
