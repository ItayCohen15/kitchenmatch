// מערכת רמות עובדים — מקור אמת יחיד בצד הלקוח (תואם ל-API/levels.js)
// הפרש של 30 משמרות בין רמה לרמה

export interface LevelInfo {
  key: string;
  label: string;
  min: number;          // משמרות מינימום לרמה
  commission: number;   // אחוז עמלת העובד
  exposure: number;     // משקל חשיפה למסעדות (1-5)
  emoji: string;
  color: string;        // טקסט+רקע ל-badge
  gradient: string;     // גרדיאנט לאלמנטים בולטים
  perks: string[];      // הטבות הרמה (מצטברות)
}

export const LEVELS: LevelInfo[] = [
  { key: 'bronze',   label: 'ברונזה',  min: 0,   commission: 0.065, exposure: 1, emoji: '🥉',
    color: 'text-amber-700 bg-amber-50',  gradient: 'linear-gradient(135deg,#b45309,#92400e)',
    perks: ['גישה לכל המשמרות הזמינות', 'עמלה 6.5%'] },
  { key: 'silver',   label: 'כסף',     min: 30,  commission: 0.065, exposure: 2, emoji: '🥈',
    color: 'text-slate-600 bg-slate-100', gradient: 'linear-gradient(135deg,#94a3b8,#64748b)',
    perks: ['חשיפה מוגברת למסעדות', 'תג כסף בפרופיל'] },
  { key: 'gold',     label: 'זהב',     min: 60,  commission: 0.060, exposure: 3, emoji: '🥇',
    color: 'text-yellow-600 bg-yellow-50', gradient: 'linear-gradient(135deg,#e8a020,#f5c842)',
    perks: ['עמלה מופחתת 6%', 'עדיפות בתוצאות החיפוש', 'תג זהב בולט'] },
  { key: 'platinum', label: 'פלטינום', min: 90,  commission: 0.060, exposure: 4, emoji: '💠',
    color: 'text-cyan-600 bg-cyan-50',    gradient: 'linear-gradient(135deg,#22d3ee,#0891b2)',
    perks: ['חשיפה גבוהה מאוד למסעדות', 'תמיכה מועדפת', 'תג פלטינום'] },
  { key: 'diamond',  label: 'דיימונד', min: 120, commission: 0.055, exposure: 5, emoji: '💎',
    color: 'text-indigo-600 bg-indigo-50', gradient: 'linear-gradient(135deg,#818cf8,#6366f1)',
    perks: ['עמלה הנמוכה ביותר 5.5%', 'עדיפות עליונה בתוצאות', 'פרופיל מומלץ למסעדות', 'תג יוקרה 💎'] },
];

// כל ההטבות שנפתחו עד רמה מסוימת (מצטבר)
export function unlockedPerks(levelKey?: string): string[] {
  const idx = LEVELS.findIndex(l => l.key === (getLevel(levelKey).key));
  return LEVELS.slice(0, idx + 1).flatMap(l => l.perks);
}

// ── עובד חדש ── עד שמסיים את המשמרת השלישית הוא מסומן כ"חדש"
export const NEW_WORKER_SHIFTS = 3;
export function isNewWorker(completedShifts?: number | null): boolean {
  // בלי נתון אמיתי — לא מסמנים כחדש (עדיף לא לתייג מאשר לתייג בטעות)
  if (completedShifts === undefined || completedShifts === null) return false;
  return Number(completedShifts) < NEW_WORKER_SHIFTS;
}
// כמה משמרות נותרו עד להסרת תג "עובד חדש"
export function shiftsUntilEstablished(completedShifts?: number): number {
  return Math.max(NEW_WORKER_SHIFTS - (Number(completedShifts) || 0), 0);
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

// ── עמלות חירום ── משמרת חירום: מסעדה 9%, עובד 5% (קבוע). אחרת: מסעדה 6.5%, עובד לפי רמה.
export const BASE_RESTAURANT_COMMISSION = 0.065;
export const EMERGENCY_RESTAURANT_COMMISSION = 0.12;
export const EMERGENCY_WORKER_COMMISSION = 0.04;
// שותפות (אחרי סטאז' + ₪300): עמלה מופחתת 4.5% לכל צד
export const PARTNERSHIP_COMMISSION = 0.045;
// בתקופת הסטאז' (3 שבועות): מסעדה 4.5%, עובד 6.5%
export const STAGE_RESTAURANT_COMMISSION = 0.045;
export const STAGE_WORKER_COMMISSION = 0.065;

export function restaurantRate(isEmergency?: boolean): number {
  return isEmergency ? EMERGENCY_RESTAURANT_COMMISSION : BASE_RESTAURANT_COMMISSION;
}
export function effectiveWorkerRate(levelKey?: string, isEmergency?: boolean): number {
  return isEmergency ? EMERGENCY_WORKER_COMMISSION : workerCommissionRate(levelKey);
}
export function effectiveNetMultiplier(levelKey?: string, isEmergency?: boolean): number {
  return 1 - effectiveWorkerRate(levelKey, isEmergency);
}

/**
 * האם עובד עומד בדרישות הסינון של המשמרת (רלוונטי בעיקר לחירום).
 * - עובד חדש (פחות מ-3 משמרות) → תלוי במתג "הצע לעובדים חדשים".
 * - עובד מבוסס → חייב לעמוד בדירוג המינימלי.
 * משמרת רגילה (ללא דרישות) — תמיד עובר.
 */
export function meetsShiftRequirements(
  workerRating?: number,
  workerCompletedShifts?: number,
  minRating?: number,
  allowNewWorkers?: boolean | number | null,
): boolean {
  const allowNew = allowNewWorkers == null ? true : Boolean(allowNewWorkers);
  if (isNewWorker(workerCompletedShifts)) return allowNew;
  const min = Number(minRating) || 0;
  return (Number(workerRating) || 0) >= min;
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
