// polling רק כשהמסך גלוי. טאב ברקע או מסך נעול לא ימשיכו לדפוק על השרת —
// כל בקשה כזו מעירה את מסד הנתונים ב-Azure ומחייבת עליו (ספטמבר 2026: טאב פתוח
// השאיר את ה-DB ער סביב השעון ושרף את המכסה החינמית).
// מחזיר מזהה רגיל של setInterval, כך ש-clearInterval הקיים ממשיך לעבוד.
export function setVisibleInterval(fn: () => void, ms: number): number {
  return window.setInterval(() => {
    if (document.visibilityState === 'visible') fn();
  }, ms);
}
