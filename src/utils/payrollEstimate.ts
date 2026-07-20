// הערכת נטו לעובד — משקף את כל הניכויים לפני אישור משמרת.
// חשוב: השיעורים כאן חייבים להיות זהים לשרת (payroll/invoiceForEmployeeProvider.js).
// עצמאי: מקבל את היתרה (אחרי עמלת Staffly), מוציא חשבונית בעצמו.
// לא-עצמאי: היתרה עוברת לשירות "חשבונית לשכיר" → 5% עמלת שירות + מס/ב"ל/בריאות.

export const PAYROLL_RATES = {
  providerFee: 0.05,   // עמלת שירות "חשבונית לשכיר" (חוזי)
  niHealth:    0.035,  // ביטוח לאומי + בריאות (הערכה)
  incomeTax:   0.07,   // מס הכנסה (הערכה — תלוי נקודות זיכוי)
};

export interface NetBreakdownData {
  base: number;               // ברוטו המשמרת
  stafflyCommission: number;  // עמלת Staffly (לפי רמה)
  remainder: number;          // אחרי עמלת Staffly
  providerFee: number;        // עמלת שירות (לא-עצמאי בלבד)
  niHealth: number;           // ב"ל + בריאות (הערכה)
  incomeTax: number;          // מס הכנסה (הערכה)
  net: number;                // נטו סופי/משוער לעובד
  isSelfEmployed: boolean;
}

export function estimateNet(base: number, stafflyRate: number, isSelfEmployed: boolean): NetBreakdownData {
  const b = Math.max(Number(base) || 0, 0);
  const stafflyCommission = b * stafflyRate;
  const remainder = Math.max(b - stafflyCommission, 0);

  if (isSelfEmployed) {
    return {
      base: b, stafflyCommission, remainder,
      providerFee: 0, niHealth: 0, incomeTax: 0,
      net: remainder, isSelfEmployed: true,
    };
  }

  const providerFee = remainder * PAYROLL_RATES.providerFee;
  const niHealth    = remainder * PAYROLL_RATES.niHealth;
  const incomeTax   = remainder * PAYROLL_RATES.incomeTax;
  const net = Math.max(remainder - providerFee - niHealth - incomeTax, 0);

  return { base: b, stafflyCommission, remainder, providerFee, niHealth, incomeTax, net, isSelfEmployed: false };
}
