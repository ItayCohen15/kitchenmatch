// אומדני שכר שעתי בשוק הישראלי (פרילנס/משמרות, ללא טיפים) — 2025
// מבוסס על פרסומי שכר ענפיים: taxman.co.il (שכר טבח/ברמן), alljobs, brutoneto,
// בתוספת פרמיית פרילנס מקובלת (עבודה מזדמנת ללא תנאים סוציאליים) ורצפת הפלטפורמה (₪40).
// שכר שכיר בסיס לטבח נע ~₪27-39 לוותיקים, גרילמן מנוסה ₪40-50 — פרילנס למשמרת מתומחר מעל זה.

export interface MarketRate {
  min: number;        // טווח תחתון מקובל
  max: number;        // טווח עליון מקובל
  avg: number;        // ממוצע משוער
  noTips?: boolean;   // תפקיד עם טיפים — הטווח לא כולל אותם
}

export const MIN_WAGE_HOURLY = 32.3; // שכר מינימום שעתי במשק (2025)

// שכר אקסטרות — עובדי משמרת מזדמנים (פרילנס), לא שכר חודשי של עובד קבוע
export const MARKET_RATES: Record<string, MarketRate> = {
  chef:       { min: 60, max: 90, avg: 70 },                // שף / סו-שף אקסטרה
  line_cook:  { min: 45, max: 60, avg: 52 },                // טבח קו אקסטרה
  prep_cook:  { min: 40, max: 50, avg: 45 },                // טבח הכנות
  bartender:  { min: 50, max: 70, avg: 58, noTips: true },  // ברמן אקסטרה — לא כולל טיפים
  barista:    { min: 42, max: 55, avg: 48, noTips: true },  // בריסטה בית קפה — לא כולל טיפים
  waiter:     { min: 40, max: 55, avg: 47, noTips: true },  // מלצר אקסטרה — לא כולל טיפים
  cleaner:    { min: 38, max: 48, avg: 42 },                // עובד ניקיון מטבח
  dishwasher: { min: 38, max: 48, avg: 42 },                // שוטף כלים
};

export function marketFor(role?: string): MarketRate | null {
  return (role && MARKET_RATES[role]) || null;
}

// מקור ההשוואה: נתוני הפלטפורמה כשיש מספיק משמרות, אחרת אומדן השוק
export function blendedMarket(role: string, platformAvg?: number, platformCnt?: number): { avg: number; range?: string; noTips?: boolean; source: 'platform' | 'market' } | null {
  const m = marketFor(role);
  if (platformAvg && (platformCnt || 0) >= 15) {
    return { avg: platformAvg, noTips: m?.noTips, source: 'platform' };
  }
  if (!m) return platformAvg ? { avg: platformAvg, source: 'platform' } : null;
  return { avg: m.avg, range: `₪${m.min}–${m.max}`, noTips: m.noTips, source: 'market' };
}
