// ייצוא נתונים לקובץ CSV (נפתח באקסל) — עם BOM לתמיכה מלאה בעברית
export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))];
  const csv = '﻿' + lines.join('\r\n'); // BOM — מאלץ את Excel לקרוא UTF-8 (עברית תקינה)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
