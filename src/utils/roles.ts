// מערכת תפקידים מרכזית — מקור אמת יחיד

export interface RoleDef {
  key: string;
  label: string;
  emoji: string;
  desc: string;
}

/* תפקידי עובד — מה שעובד נרשם בתורו */
export const WORKER_ROLES: RoleDef[] = [
  { key: 'line_cook', label: 'טבח',          emoji: '🍳', desc: 'מטבח חם/קר · כולל משמרות טבח הכנות' },
  { key: 'cleaner',   label: 'עובד ניקיון',  emoji: '🧽', desc: 'ניקיון מטבח ושטיפת כלים' },
  { key: 'bartender', label: 'ברמן',         emoji: '🍸', desc: 'בר, קוקטיילים ומשקאות' },
  { key: 'barista',   label: 'בריסטה',       emoji: '☕', desc: 'קפה, אספרסו ובתי קפה' },
  { key: 'waiter',    label: 'מלצר',         emoji: '🍽️', desc: 'שירות שולחנות ומלצרות' },
];

/* תפקידי משמרת — מה שמסעדה מפרסמת */
export const SHIFT_ROLES: RoleDef[] = [
  { key: 'line_cook', label: 'טבח',         emoji: '🍳', desc: 'טבח קו · מטבח חם/קר' },
  { key: 'prep_cook', label: 'טבח הכנות',   emoji: '🔪', desc: 'הכנות מוקדמות · חיתוך · מיזנפלס' },
  { key: 'cleaner',   label: 'עובד ניקיון', emoji: '🧽', desc: 'ניקיון · שטיפת כלים' },
  { key: 'bartender', label: 'ברמן',        emoji: '🍸', desc: 'בר · קוקטיילים · משקאות' },
  { key: 'barista',   label: 'בריסטה',      emoji: '☕', desc: 'קפה · אספרסו · בית קפה' },
  { key: 'waiter',    label: 'מלצר',        emoji: '🍽️', desc: 'שירות · מלצרות' },
];

/* תוויות לכל המפתחות (כולל legacy) */
export const ROLE_LABELS: Record<string, string> = {
  line_cook: 'טבח',
  prep_cook: 'טבח הכנות',
  cleaner:   'עובד ניקיון',
  bartender: 'ברמן',
  barista:   'בריסטה',
  waiter:    'מלצר',
  // legacy
  chef:       'טבח',
  dishwasher: 'עובד ניקיון',
};

/**
 * אילו סוגי משמרת רואה עובד לפי תפקידו.
 * טבח רואה גם טבח רגיל וגם טבח הכנות (וגם 'chef' ישן).
 */
export function visibleShiftRoles(workerRole?: string): string[] {
  switch (workerRole) {
    case 'line_cook':
    case 'chef': // legacy
      return ['line_cook', 'prep_cook', 'chef'];
    case 'cleaner':
    case 'dishwasher': // legacy
      return ['cleaner', 'dishwasher'];
    case 'bartender':
      return ['bartender'];
    case 'barista':
      // בריסטה הוא מקצוע נפרד (בתי קפה) — לא מוצג לו בר ולהפך.
      return ['barista'];
    case 'waiter':
      return ['waiter'];
    default:
      return workerRole ? [workerRole] : [];
  }
}

/* האם תפקיד העובד הוא טבח (כולל legacy chef) */
export function isCookRole(workerRole?: string): boolean {
  return workerRole === 'line_cook' || workerRole === 'chef';
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
  cleaner: [
    { group: 'תחומי ניקיון', items: ['שטיפת כלים', 'ניקיון מטבח', 'ניקיון אולם', 'תפעול מדיח תעשייתי', 'פינוי וסידור', 'ניקיון סוף יום'] },
    { group: 'יתרונות', items: ['עמידה בקצב גבוה', 'עבודה במשמרות לילה', 'ניסיון במטבח מוסדי', 'הקפדה על תברואה'] },
  ],
};
