import React from 'react';
import { estimateNet } from '../../utils/payrollEstimate';

// פירוק תשלום שקוף — עצמאי מול לא-עצמאי.
// לא-עצמאי: מציג את *כל* הניכויים (עמלת Staffly, 5% שירות, ב"ל+בריאות, מס) + נטו משוער.

interface Props {
  base: number;
  stafflyRate: number;
  isSelfEmployed: boolean;
  title?: string;
}

const money = (n: number) => `₪${Math.round(n).toLocaleString()}`;

export const NetBreakdown: React.FC<Props> = ({ base, stafflyRate, isSelfEmployed, title }) => {
  const b = estimateNet(base, stafflyRate, isSelfEmployed);

  const Row = ({ label, value, red }: { label: string; value: string; red?: boolean }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`font-semibold text-sm ${red ? 'text-red-500' : 'text-gray-900'}`}>{value}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-4 card-shadow">
      {title && <h3 className="font-bold text-gray-800 mb-2 text-sm">{title}</h3>}

      <Row label="שכר ברוטו" value={money(b.base)} />
      <Row label={`עמלת Staffly (${(stafflyRate * 100).toFixed(1)}%)`} value={`-${money(b.stafflyCommission)}`} red />

      {isSelfEmployed ? (
        <>
          <div className="flex justify-between items-center py-2.5 bg-green-50 rounded-xl px-2 mt-2">
            <span className="text-gray-700 font-bold text-sm">תקבל נטו</span>
            <span className="font-bold text-green-600 text-lg">{money(b.net)}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            כעצמאי — התשלום ישיר אליך; עליך להוציא חשבונית למסעדה על הברוטו ({money(b.base)}).
          </p>
        </>
      ) : (
        <>
          <Row label='מועבר לשירות "חשבונית לשכיר"' value={money(b.remainder)} />
          <Row label="עמלת שירות (5%)" value={`-${money(b.providerFee)}`} red />
          <Row label="ביטוח לאומי + בריאות (הערכה)" value={`-${money(b.niHealth)}`} red />
          <Row label="מס הכנסה (הערכה)" value={`-${money(b.incomeTax)}`} red />
          <div className="flex justify-between items-center py-2.5 bg-green-50 rounded-xl px-2 mt-2">
            <span className="text-gray-700 font-bold text-sm">נטו משוער לעובד</span>
            <span className="font-bold text-green-600 text-lg">≈ {money(b.net)}</span>
          </div>
          <div className="mt-2 rounded-xl p-2.5 text-[11px] leading-relaxed"
            style={{ background: '#fff8e1', border: '1px solid #f59e0b', color: '#92400e' }}>
            ℹ️ הערכה בלבד — הנטו הסופי (מס/ב"ל/בריאות) נקבע ע"י שירות "חשבונית לשכיר" לפי נקודות הזיכוי והסטטוס שלך.
          </div>
        </>
      )}
    </div>
  );
};
