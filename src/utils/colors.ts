// פלטת "חיים" — צבע כמידע, לא כקישוט. הכל שטוח: בלי גרדיאנט, בלי זוהר.
// משמש לאווטרים צבעוניים (לפי שם), נקודות-תפקיד ותגי-רמה.

export interface Tone { bg: string; fg: string }

// ── אווטרים: צבע יציב ונעים לכל שם (hash → אינדקס בפלטה) ──
const AVATAR_SET: Tone[] = [
  { bg: '#fde7e0', fg: '#cf4a29' }, // אלמוג
  { bg: '#d8f2ee', fg: '#0c8074' }, // טורקיז
  { bg: '#e2ecfb', fg: '#2c59aa' }, // כחול
  { bg: '#f3e7f4', fg: '#7e4685' }, // סגול
  { bg: '#dcf3ea', fg: '#147a52' }, // ירוק
  { bg: '#fdefd2', fg: '#a9760d' }, // ענבר
];

/** צבע אווטר יציב שנגזר מהשם — אותו שם תמיד מקבל אותו צבע */
export function avatarTone(seed?: string | number | null): Tone {
  const s = String(seed ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_SET[h % AVATAR_SET.length];
}

// ── תפקידים: נקודת-צבע קבועה לכל תפקיד ──
const ROLE_DOT: Record<string, string> = {
  waiter:     '#3b74d1', // כחול
  runner:     '#f2a71b', // ענבר
  bartender:  '#9a5ba6', // סגול
  barista:    '#b5701f', // קפה
  line_cook:  '#ef5f3c', // אלמוג
  chef:       '#ef5f3c', // legacy
  prep_cook:  '#12a594', // טורקיז
  cleaner:    '#1f9d6b', // ירוק
  dishwasher: '#3f7d86', // צפחה-טורקיז
};

/** נקודת-צבע לתפקיד (למשמרת רב-תפקיד — לפי התפקיד הראשון) */
export function roleDot(role?: string): string {
  const first = (role || '').split(',')[0].trim();
  return ROLE_DOT[first] || '#8a94a6';
}

// ── רמות: תג עשיר (טקסט + רקע רך) — מרגיש כמו פרס ──
const LEVEL_TONE: Record<string, Tone> = {
  bronze:   { bg: '#f6ece0', fg: '#9a5a24' },
  silver:   { bg: '#eef1f5', fg: '#5c6675' },
  gold:     { bg: '#fbf1d8', fg: '#a9760d' },
  platinum: { bg: '#e4f1f1', fg: '#2f6a72' },
  diamond:  { bg: '#e8eefb', fg: '#3a56b0' },
  pro:      { bg: '#f3e9f6', fg: '#7a4685' }, // legacy
};

/** תג-רמה עשיר */
export function levelTone(level?: string): Tone {
  return LEVEL_TONE[level || 'bronze'] || LEVEL_TONE.bronze;
}
