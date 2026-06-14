// עזרי תצוגה משותפים למסכי המנהל

const MONTH_SHORT = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];

export const ils = (n: any): string => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000) return '₪' + Math.round(v).toLocaleString('he-IL');
  return '₪' + (Math.round(v * 10) / 10).toLocaleString('he-IL');
};

export const num = (n: any): string => (Number(n) || 0).toLocaleString('he-IL');

// 'yyyy-MM' → 'מאי'
export const monthLabel = (ym?: string): string => {
  if (!ym) return '';
  const m = parseInt(ym.split('-')[1], 10);
  return MONTH_SHORT[(m - 1) % 12] || ym;
};

export const dateShort = (d?: string): string => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch { return ''; }
};

export const LEVEL_LABELS: Record<string, string> = {
  bronze: 'ברונזה', silver: 'כסף', gold: 'זהב', platinum: 'פלטינום', diamond: 'יהלום', pro: 'מקצוען',
};
export const LEVEL_COLORS: Record<string, string> = {
  bronze: '#cd7f32', silver: '#9ca3af', gold: '#e8a020', platinum: '#60a5fa', diamond: '#22d3ee', pro: '#a78bfa',
};

export const STATUS_LABELS: Record<string, string> = {
  searching: 'בחיפוש', matched: 'הותאם', pending_approval: 'ממתין לאישור',
  confirmed: 'מאושר', active: 'פעיל', pending_completion: 'ממתין לסיום',
  completed: 'הושלם', cancelled: 'בוטל',
};
export const STATUS_COLORS: Record<string, string> = {
  searching: '#60a5fa', matched: '#60a5fa', pending_approval: '#f5c842',
  confirmed: '#34d399', active: '#34d399', pending_completion: '#f5c842',
  completed: '#10b981', cancelled: '#ef4444',
};

export const JOBTYPE_LABELS: Record<string, string> = {
  stage: "סטאז'", stage_shift: "משמרת סטאז'", direct: 'ישירה', regular: 'רגילה',
};
