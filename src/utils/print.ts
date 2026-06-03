/**
 * הדפסת HTML דרך iframe נסתר.
 * מונע את הבאג של window.open שנתקע בקריאה שנייה,
 * ומונע את הקפיצה/פתיחת טאב חדש במובייל.
 */
export function printHTML(html: string) {
  // הסר iframe קודם אם נשאר תקוע
  const prev = document.getElementById('km-print-frame');
  if (prev) prev.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'km-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) { iframe.remove(); return; }

  doc.open();
  doc.write(html);
  doc.close();

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    // השהיה קצרה לפני הסרה כדי לא לקטוע את דיאלוג ההדפסה
    setTimeout(() => { iframe.remove(); }, 500);
  };

  const triggerPrint = () => {
    const win = iframe.contentWindow;
    if (!win) { cleanup(); return; }
    try {
      win.focus();
      // נקה לאחר סגירת דיאלוג ההדפסה
      win.onafterprint = cleanup;
      win.print();
      // fallback אם onafterprint לא נורה (סדרי דפדפנים)
      setTimeout(cleanup, 60000);
    } catch {
      cleanup();
    }
  };

  // המתן לטעינת התוכן לפני הדפסה
  if (iframe.contentWindow) {
    iframe.contentWindow.onload = triggerPrint;
  }
  // fallback אם onload כבר עבר
  setTimeout(() => { if (!done) triggerPrint(); }, 300);
}
