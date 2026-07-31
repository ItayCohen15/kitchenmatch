import React, { useState } from 'react';
import { X, Info, FileSignature, Landmark, ShieldAlert, ReceiptText } from 'lucide-react';

interface Props {
  /** אישר והבין — ממשיך כלא-עצמאי */
  onAccept: () => void;
  /** ביטל / סגר — לא ממשיך כלא-עצמאי */
  onCancel: () => void;
}

/**
 * גילוי נאות לעובד שאין לו עוסק (תשלום דרך "חשבונית לשכיר").
 * מסביר את המשמעות מול מס הכנסה / ביטוח לאומי לפי הדרישה של ספק ה"חשבונית לשכיר",
 * ודורש אישור מפורש לפני המשך ההרשמה.
 * רספונסיבי — מוגבל בגובה עם גלילה פנימית, מתאים גם למסכים קטנים.
 */
export const NonSelfEmployedDisclosure: React.FC<Props> = ({ onAccept, onCancel }) => {
  const [ack, setAck] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="fixed inset-x-0 z-50 flex items-center justify-center px-3 pointer-events-none"
        style={{
          top: 'calc(env(safe-area-inset-top) + 24px)',
          bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
        }}
      >
        <div
          className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm pointer-events-auto"
          style={{ maxHeight: '100%' }}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 text-white" style={{ background: 'linear-gradient(135deg,#b45309,#e8a020)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Info size={18} className="flex-shrink-0" />
                <span className="font-black text-base truncate">חשוב שתדע — תשלום ללא עוסק</span>
              </div>
              <button
                onClick={onCancel}
                aria-label="סגור"
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15 active:bg-white/30 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' as any }}>
            <p className="text-sm text-gray-700 leading-relaxed">
              בחרת שאין לך עוסק, כך שהתשלום עבור המשמרות שלך יעבור דרך שירות <strong>"חשבונית לשכיר"</strong>.
              לפני שנמשיך — כך זה עובד, לפי מה שהשירות דורש שנציג לך:
            </p>

            {/* 1. איך משלמים לך */}
            <div className="rounded-xl p-3 flex gap-3" style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}>
              <ReceiptText size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed">
                <div className="font-bold text-gray-900 text-sm mb-0.5">איך תקבל תשלום</div>
                השירות מנפיק את החשבונית ומעביר לך את הכסף. מנוכים ~5% עמלת שירות + מס הכנסה / ביטוח לאומי / מס בריאות.
                תראה הערכת נטו לפני כל משמרת.
              </div>
            </div>

            {/* 2. מעמד מול הרשויות */}
            <div className="rounded-xl p-3 flex gap-3" style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}>
              <Landmark size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed">
                <div className="font-bold text-gray-900 text-sm mb-0.5">המעמד שלך מול הרשויות</div>
                אתה <strong>לא עובד שכיר</strong> של השירות — התלוש אינו יוצר יחסי עובד-מעביד.
                <ul className="mt-1.5 space-y-1 list-disc pr-4">
                  <li><strong>מס הכנסה:</strong> מונפק לך תלוש.</li>
                  <li><strong>ביטוח לאומי:</strong> אתה נחשב <strong>עצמאי</strong>, ומעמדך נקבע לפי היקף השעות / ההכנסה.</li>
                </ul>
              </div>
            </div>

            {/* 3. מה תצטרך לחתום */}
            <div className="rounded-xl p-3 flex gap-3" style={{ background: '#f8fafc', border: '1px solid #e5e7eb' }}>
              <FileSignature size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 leading-relaxed">
                <div className="font-bold text-gray-900 text-sm mb-0.5">מה תצטרך לחתום</div>
                כדי לפתוח את המעמד תתבקש לחתום על <strong>טופס 6101</strong> ועל <strong>ייפוי כוח</strong> מול השירות.
                זהו תהליך חד-פעמי, רובו דיגיטלי.
              </div>
            </div>

            {/* 4. מה חשוב לדעת — ההשלכות */}
            <div className="rounded-xl p-3 flex gap-3" style={{ background: '#fff8e1', border: '1px solid #f59e0b' }}>
              <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#b45309' }} />
              <div className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
                <div className="font-black text-sm mb-0.5">מה חשוב לדעת</div>
                <ul className="space-y-1 list-disc pr-4">
                  <li><strong>אין דמי אבטלה</strong> על עבודה זו (אינך שכיר).</li>
                  <li>
                    <strong>כיסוי פגיעה בעבודה</strong> קיים רק אם נרשמת ומשלמת כעצמאי בביטוח לאומי לפני הפגיעה
                    ואתה עומד ברף המינימלי. בעבודה בהיקף נמוך ייתכן שלא יהיה לך כיסוי פגיעה בעבודה.
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              המידע כללי בלבד ואינו מהווה ייעוץ מס או משפטי. הפרטים המדויקים והמחייבים יימסרו לך על-ידי שירות
              "חשבונית לשכיר" בעת ההרשמה. אם יש לך עוסק — חזור ובחר "יש לי עוסק".
            </p>

            {/* אישור מפורש */}
            <button
              type="button"
              onClick={() => setAck(v => !v)}
              className="w-full flex items-start gap-2.5 rounded-xl p-3 text-right transition-colors"
              style={{
                background: ack ? '#ecfdf5' : '#f8fafc',
                border: `1px solid ${ack ? '#6ee7b7' : '#e5e7eb'}`,
              }}
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: ack ? '#10b981' : '#fff',
                  border: `2px solid ${ack ? '#10b981' : '#cbd5e1'}`,
                }}
              >
                {ack && <span className="text-white text-xs leading-none">✓</span>}
              </span>
              <span className="text-xs font-semibold text-gray-700 leading-relaxed">
                קראתי, הבנתי ואני מאשר את התנאים והמשמעויות שלעיל.
              </span>
            </button>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl font-bold text-sm bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"
            >
              חזור
            </button>
            <button
              onClick={onAccept}
              disabled={!ack}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}
            >
              הבנתי, המשך
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
