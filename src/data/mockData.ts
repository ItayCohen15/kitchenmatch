// ── מפות תוויות / צבעים משותפות ──
// נתוני הדמו הישנים (עובדים / משמרות / תנועות / אנליטיקס / צ'אט) הוסרו — לא היו בשימוש
// בשום קומפוננטה חיה; האפליקציה מושכת נתונים אמיתיים מה-API. כאן נשארות רק מפות עזר.

// מקור האמת לתפקידים הוא utils/roles.ts — כאן רק ייצוא חוזר, כדי שקבצים
// שמייבאים ROLE_LABELS מכאן לא יקבלו רשימה ישנה כשמוסיפים תפקיד.
// (לפני האיחוד היו כאן שתי רשימות נפרדות שנטו להתפצל.)
export { ROLE_LABELS } from '../utils/roles';

// ── סוגי עסק (צד-המעסיק) — מסעדה / בר / בית קפה / אולם אירועים / קייטרינג ──
// key יציב באנגלית; label בעברית לתצוגה. ברירת מחדל: 'restaurant'.
export const BUSINESS_TYPES: { key: string; label: string; emoji: string; desc: string }[] = [
  { key: 'restaurant', label: 'מסעדה',       emoji: '🍽️', desc: 'מסעדה / ביסטרו' },
  { key: 'bar',        label: 'בר / פאב',     emoji: '🍸', desc: 'בר · פאב · מועדון' },
  { key: 'cafe',       label: 'בית קפה',      emoji: '☕', desc: 'קפה · מאפייה' },
  { key: 'event_hall', label: 'אולם אירועים', emoji: '🎉', desc: 'חתונות · אירועים' },
  { key: 'catering',   label: 'קייטרינג',     emoji: '🍾', desc: 'הסעדת אירועים' },
];
export const BUSINESS_TYPE_LABELS: Record<string, string> =
  Object.fromEntries(BUSINESS_TYPES.map(b => [b.key, b.label]));

export const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'מתחיל',
  mid: 'בינוני',
  senior: 'מנוסה',
};

export const LEVEL_LABELS: Record<string, string> = {
  bronze: 'ברונזה',
  silver: 'כסף',
  gold: 'זהב',
  platinum: 'פלטינום',
  diamond: 'דיימונד',
  pro: 'פרו', // legacy
};

// תגי-רמה עשירים — מרגישים כמו פרס (רקע רך + טקסט עשיר)
export const LEVEL_COLORS: Record<string, string> = {
  bronze: 'text-amber-800 bg-amber-100',
  silver: 'text-slate-600 bg-slate-100',
  gold: 'text-yellow-800 bg-yellow-100',
  platinum: 'text-teal-700 bg-teal-50',
  diamond: 'text-indigo-700 bg-indigo-50',
  pro: 'text-purple-700 bg-purple-50', // legacy
};
