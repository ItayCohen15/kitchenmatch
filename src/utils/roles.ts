// מערכת תפקידים מרכזית — מקור אמת יחיד

export interface RoleDef {
  key: string;
  label: string;
  emoji: string;
  desc: string;
  entry?: boolean; // תפקיד כניסה — פתוח גם לחסרי ניסיון בתחום
}

/* תפקידי עובד — מה שעובד נרשם בתורו.
   מחולק לשני חלקים: תפקידים מקצועיים (דורשי ניסיון) ותפקידי כניסה (entry:true)
   הפתוחים גם למי שאין לו ניסיון כלל. עובד מנוסה יכול לבחור גם וגם. */
export const WORKER_ROLES: RoleDef[] = [
  { key: 'line_cook', label: 'טבח',          emoji: '🍳', desc: 'מטבח חם/קר · כולל משמרות טבח הכנות' },
  { key: 'cleaner',   label: 'עובד ניקיון',  emoji: '🧽', desc: 'ניקיון מטבח ושטיפת כלים' },
  { key: 'bartender', label: 'ברמן',         emoji: '🍸', desc: 'בר, קוקטיילים ומשקאות' },
  { key: 'barista',   label: 'בריסטה',       emoji: '☕', desc: 'קפה, אספרסו ובתי קפה' },
  { key: 'waiter',    label: 'מלצר',         emoji: '🍽️', desc: 'שירות שולחנות ומלצרות' },
  { key: 'pastry_chef', label: 'קונדיטור',   emoji: '🍰', desc: 'קינוחים · מאפים · עוגות אירועים' },
  { key: 'host',      label: 'מארח/ת',       emoji: '🤵', desc: 'קבלת אורחים · כיווני ישיבה · מלתחה' },
  // ── תפקידי כניסה — ללא צורך בניסיון ──
  { key: 'runner',     label: 'ראנר',        emoji: '🏃', desc: 'העברת מנות · סידור שולחנות · לא צריך ניסיון', entry: true },
  { key: 'dishwasher', label: 'שוטף כלים',   emoji: '🧼', desc: 'שטיפת כלים · תפעול מדיח · לא צריך ניסיון',   entry: true },
  { key: 'prep_cook',  label: 'טבח הכנות',   emoji: '🔪', desc: 'חיתוך · מיזנפלס · הכנות · לא צריך ניסיון',   entry: true },
];

/* תפקידי משמרת — מה שמסעדה מפרסמת */
export const SHIFT_ROLES: RoleDef[] = [
  { key: 'line_cook', label: 'טבח',         emoji: '🍳', desc: 'טבח קו · מטבח חם/קר' },
  { key: 'cleaner',   label: 'עובד ניקיון', emoji: '🧽', desc: 'ניקיון · שטיפת כלים' },
  { key: 'bartender', label: 'ברמן',        emoji: '🍸', desc: 'בר · קוקטיילים · משקאות' },
  { key: 'barista',   label: 'בריסטה',      emoji: '☕', desc: 'קפה · אספרסו · בית קפה' },
  { key: 'waiter',    label: 'מלצר',        emoji: '🍽️', desc: 'שירות · מלצרות' },
  { key: 'pastry_chef', label: 'קונדיטור',  emoji: '🍰', desc: 'קינוחים · מאפים · עוגות' },
  { key: 'host',      label: 'מארח/ת',      emoji: '🤵', desc: 'קבלת אורחים · אירוח' },
  // ── תפקידי כניסה — מתאימים גם לעובד ללא ניסיון ──
  { key: 'prep_cook', label: 'טבח הכנות',   emoji: '🔪', desc: 'הכנות מוקדמות · חיתוך · מיזנפלס', entry: true },
  { key: 'runner',    label: 'ראנר',        emoji: '🏃', desc: 'העברת מנות · סידור וניקוי שולחנות', entry: true },
  { key: 'dishwasher',label: 'שוטף כלים',   emoji: '🧼', desc: 'שטיפת כלים · תפעול מדיח · פינוי', entry: true },
];

/* תוויות לכל המפתחות (כולל legacy) */
export const ROLE_LABELS: Record<string, string> = {
  line_cook:  'טבח',
  prep_cook:  'טבח הכנות',
  cleaner:    'עובד ניקיון',
  bartender:  'ברמן',
  barista:    'בריסטה',
  waiter:     'מלצר',
  pastry_chef:'קונדיטור',
  host:       'מארח/ת',
  runner:     'ראנר',
  dishwasher: 'שוטף כלים',
  // legacy
  chef:       'טבח',
};

/* מפתחות תפקידי הכניסה — פתוחים גם לחסרי ניסיון */
export const ENTRY_ROLE_KEYS = new Set(['runner', 'dishwasher', 'prep_cook']);

/** האם תפקיד הוא תפקיד כניסה (פתוח לעובד ללא ניסיון) */
export function isEntryRole(key?: string): boolean {
  return !!key && ENTRY_ROLE_KEYS.has(key);
}

/** האם *כל* תפקידי העובד הם תפקידי כניסה (עובד ללא ניסיון) */
export function isEntryOnly(role?: string): boolean {
  const list = parseRoles(role);
  return list.length > 0 && list.every(r => ENTRY_ROLE_KEYS.has(r));
}

/**
 * פיצול תפקידי עובד ל-list. עובד יכול להיות רב-תפקיד — התפקידים
 * נשמרים כ-CSV בשדה Role (למשל "waiter,barista"). עובד יחיד-תפקיד
 * (בלי פסיק) עובד בדיוק כמו קודם — תאימות לאחור מלאה.
 */
export function parseRoles(role?: string): string[] {
  return (role || '').split(',').map(s => s.trim()).filter(Boolean);
}

/** תוויות מרובות לתצוגה — "מלצר · בריסטה" */
export function roleLabels(role?: string): string {
  const list = parseRoles(role).map(r => ROLE_LABELS[r] || r);
  return list.length ? list.join(' · ') : '';
}

/** סוגי המשמרת שרואה תפקיד עובד *יחיד* (טבח רואה גם טבח הכנות, וכו') */
function visibleForSingleRole(workerRole?: string): string[] {
  switch (workerRole) {
    case 'line_cook':
    case 'chef': // legacy
      // טבח מנוסה רואה גם משמרות "טבח הכנות" (תפקיד כניסה שהוא כשיר לו)
      return ['line_cook', 'prep_cook', 'chef'];
    case 'prep_cook':
      // טבח הכנות (כניסה) — רק משמרות הכנות, לא משמרות טבח קו המקצועיות
      return ['prep_cook'];
    case 'cleaner':
      // עובד ניקיון רואה גם משמרות שטיפת כלים
      return ['cleaner', 'dishwasher'];
    case 'dishwasher':
      // שוטף כלים (כניסה) רואה גם משמרות ניקיון (עבודה קרובה)
      return ['dishwasher', 'cleaner'];
    case 'bartender':
      return ['bartender'];
    case 'barista':
      // בריסטה הוא מקצוע נפרד (בתי קפה) — לא מוצג לו בר ולהפך.
      return ['barista'];
    case 'waiter':
      // מלצר מנוסה רואה גם משמרות ראנר (תפקיד כניסה שהוא כשיר לו)
      return ['waiter', 'runner'];
    case 'runner':
      // ראנר (כניסה) — רק משמרות ראנר, לא מלצרות המקצועית
      return ['runner'];
    case 'pastry_chef':
      return ['pastry_chef'];
    case 'host':
      return ['host'];
    default:
      return workerRole ? [workerRole] : [];
  }
}

/**
 * אילו סוגי משמרת רואה עובד לפי *כל* תפקידיו (איחוד — תומך ברב-תפקיד).
 */
export function visibleShiftRoles(workerRole?: string): string[] {
  const set = new Set<string>();
  for (const r of parseRoles(workerRole)) for (const s of visibleForSingleRole(r)) set.add(s);
  return [...set];
}

/* האם אחד מתפקידי העובד הוא טבח (כולל legacy chef) */
export function isCookRole(workerRole?: string): boolean {
  return parseRoles(workerRole).some(r => r === 'line_cook' || r === 'chef');
}

/**
 * כישורים/התמחויות מותאמים לכל תפקיד עובד — לשאלות הרישום.
 * כל קבוצה היא רשימת אופציות לבחירה מרובה.
 */
export const SKILLS_BY_ROLE: Record<string, { group: string; items: string[] }[]> = {
  line_cook: [
    { group: 'סוג מסעדה', items: ['מסעדת שף / גורמה', 'בית קפה', 'ביסטרו', 'מזון מהיר', 'קייטרינג / אירועים'] },
    { group: 'סגנון מטבח', items: ['ים תיכוני', 'איטלקי / פסטה', 'יפני / סושי', 'אסייתי', 'מזרח תיכוני', 'צרפתי / אירופאי', 'אמריקאי / בורגרים'] },
    { group: 'תחנת עבודה', items: ['מטבח חם', 'מטבח קר / סלטים', 'גריל / פלאנצ׳ה', 'טיגון', 'פיצה / טאבון', 'קינוחים', 'הכנות / מיזנפלס'] },
  ],
  bartender: [
    { group: 'סוג מקום', items: ['בר קוקטיילים', 'פאב / בירות', 'מסעדה', 'אירועים / קייטרינג', 'מועדון'] },
    { group: 'מומחיות', items: ['קוקטיילים קלאסיים', 'מיקסולוגיה / קוקטיילים חתומים', 'בירות מהחבית', 'יין', 'קפה / בריסטה', 'פלייר / מהירות'] },
  ],
  barista: [
    { group: 'סוג מקום', items: ['בית קפה שכונתי', 'רשת קפה', 'בית קלייה / ספיישלטי', 'מסעדה', 'מאפייה / קונדיטוריה', 'אירועים / קייטרינג'] },
    { group: 'מומחיות', items: ['אספרסו ידני', 'לאטה ארט', 'כיול טחינה', 'שיטות חליטה (V60 / קמקס / אירופרס)', 'קולד ברו', 'תפעול מכונה וניקוי', 'קופה / סליקה', 'מאפים וכריכים'] },
  ],
  waiter: [
    { group: 'סוג מסעדה', items: ['פיין דיינינג / שף', 'מסעדה קז׳ואל', 'בית קפה', 'אירועים / קייטרינג', 'בר / פאב'] },
    { group: 'מיומנויות', items: ['ידע ביין', 'הגשה רב-שולחנית', 'קופה / סליקה', 'אנגלית שוטפת', 'מכירה / אפסייל', 'מגשים / הגשת אירועים'] },
  ],
  pastry_chef: [
    { group: 'התמחות', items: ['עוגות אירועים', 'קינוחים במנה (Plated)', 'מאפים ובצקים', 'שוקולד ופרלינים', 'טארטים ועוגות גבינה', 'קישוט וסוכר'] },
    { group: 'התאמות מיוחדות', items: ['ללא גלוטן', 'טבעוני', 'ללא סוכר', 'כשרות'] },
  ],
  host: [
    { group: 'מיומנויות', items: ['קבלת אורחים', 'ניהול רשימת הזמנות', 'כיווני ישיבה', 'מלתחה', 'אנגלית שוטפת', 'ייצוגיות ולבוש הולם'] },
  ],
  cleaner: [
    { group: 'תחומי ניקיון', items: ['שטיפת כלים', 'ניקיון מטבח', 'ניקיון אולם', 'תפעול מדיח תעשייתי', 'פינוי וסידור', 'ניקיון סוף יום'] },
    { group: 'יתרונות', items: ['עמידה בקצב גבוה', 'עבודה במשמרות לילה', 'ניסיון במטבח מוסדי', 'הקפדה על תברואה'] },
  ],
  // ── תפקידי כניסה — בלי דרישת ניסיון, רק יתרונות/זמינות ──
  runner: [
    { group: 'יתרונות', items: ['זריזות וקצב מהיר', 'עמידה בעומס', 'שירותיות ויחס לאורח', 'ראש גדול', 'עבודת צוות'] },
  ],
  dishwasher: [
    { group: 'יתרונות', items: ['עמידה בקצב גבוה', 'סדר וניקיון', 'תפעול מדיח תעשייתי', 'עבודה במשמרות לילה', 'הקפדה על תברואה'] },
  ],
  prep_cook: [
    { group: 'יתרונות', items: ['חיתוך ירקות', 'סדר ומיזנפלס', 'עבודה מסודרת ונקייה', 'הקפדה על תברואה', 'עמידה בהוראות'] },
  ],
};
