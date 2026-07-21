/**
 * אסקייפ ל-HTML.
 *
 * ⚠️ חובה לכל ערך שמקורו במשתמש ונכנס לתבנית שמועברת ל-printHTML.
 * printHTML כותב את המחרוזת עם document.write לתוך iframe ללא src —
 * כלומר about:blank שיורש את ה-origin של האפליקציה. סקריפט שנכנס לשם
 * רץ בהרשאות שלנו ויכול לקרוא את הטוקן מ-localStorage.
 *
 * שמות מסעדות, שמות עובדים, ערים ותפקידים מגיעים מהשרת בלי סינון תווים,
 * ולכן הם *לא* בטוחים לשרשור ישיר.
 *
 * זהו התאום בצד הלקוח של esc() ב-mailer.js בשרת.
 */
export function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
