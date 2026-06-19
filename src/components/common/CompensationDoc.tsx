import React from 'react';
import { X, Printer, ArrowLeftRight } from 'lucide-react';
import { printHTML } from '../../utils/print';
import { ROLE_LABELS } from '../../data/mockData';

interface Props {
  job: any;                       // כולל CancellationFee, CancelledBy, StartTime, CancelledAt, Role, Id
  viewer: 'worker' | 'restaurant';
  workerName: string;
  restaurantName: string;
  onClose: () => void;
}

export const CompensationDoc: React.FC<Props> = ({ job, viewer, workerName, restaurantName, onClose }) => {
  const fee = Number(job.CancellationFee ?? 0);
  const cancelledBy: 'worker' | 'restaurant' = job.CancelledBy;

  // מי שילם ומי קיבל
  const payerName    = cancelledBy === 'worker' ? workerName : restaurantName;
  const receiverName = cancelledBy === 'worker' ? restaurantName : workerName;
  const viewerReceived =
    (viewer === 'worker'     && cancelledBy === 'restaurant') ||
    (viewer === 'restaurant' && cancelledBy === 'worker');

  const dateSrc = job.CancelledAt || job.StartTime;
  const dateStr = dateSrc
    ? new Date(dateSrc).toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'numeric' })
    : '';
  const shiftDateStr = job.StartTime
    ? new Date(job.StartTime).toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'numeric' })
    : '';
  const docId = `COMP-${(job.Id ?? 0).toString().padStart(6, '0')}`;
  const roleLabel = ROLE_LABELS[job.Role] ?? job.Role ?? '';

  const title = viewerReceived ? 'אסמכתת פיצוי ביטול' : 'אסמכתת תשלום קנס ביטול';
  const amountColor = viewerReceived ? '#059669' : '#dc2626';
  const amountSign  = viewerReceived ? '+' : '-';

  const handlePrint = () => {
    printHTML(`
      <html dir="rtl"><head><meta charset="UTF-8"><title>${title} ${docId}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;max-width:460px;margin:30px auto;padding:24px;color:#111;
             border:2px solid #e8a020;border-radius:12px}
        .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
        .logo{font-size:20px;font-weight:900}.gold{color:#c8840a}
        .logo-sub{font-size:10px;color:#9ca3af}
        .doc-title{font-size:15px;font-weight:700;text-align:left}
        .doc-num{font-size:11px;color:#9ca3af;text-align:left}
        .flow{display:flex;align-items:center;justify-content:space-between;gap:8px;
              background:#f9fafb;border-radius:10px;padding:14px;margin:14px 0}
        .party{flex:1;text-align:center}
        .party .label{font-size:10px;color:#9ca3af;margin-bottom:3px}
        .party .name{font-size:13px;font-weight:700}
        .arrow{font-size:18px;color:#e8a020}
        .amount-box{background:linear-gradient(135deg,#0d1420,#1a2744);color:white;
                    padding:16px;border-radius:10px;margin:14px 0;text-align:center}
        .amount-label{font-size:12px;color:#9ca3af;margin-bottom:4px}
        .amount{font-size:30px;font-weight:900;color:${amountColor}}
        .row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #f5f5f5}
        .note{font-size:11px;color:#374151;background:#f0fdf4;border:1px solid #86efac;
              border-radius:8px;padding:10px;margin:12px 0;line-height:1.6}
        .legal{font-size:11px;color:#92400e;background:#fef9ec;border:1px solid #fcd34d;
               border-radius:8px;padding:10px;margin:10px 0;line-height:1.6}
        .footer{margin-top:16px;font-size:10px;color:#9ca3af;text-align:center;
                border-top:1px solid #e5e7eb;padding-top:10px;line-height:1.7}
        @media print{body{margin:0;border:2px solid #e8a020}}
      </style></head><body>
      <div class="top">
        <div>
          <div class="logo">Staff<span class="gold">ly</span></div>
          <div class="logo-sub">פלטפורמת שיבוץ כוח אדם</div>
        </div>
        <div>
          <div class="doc-title">${title}</div>
          <div class="doc-num">מס׳ ${docId}</div>
          <div class="doc-num">${dateStr}</div>
        </div>
      </div>

      <div class="flow">
        <div class="party"><div class="label">משלם</div><div class="name">${payerName}</div></div>
        <div class="arrow">←</div>
        <div class="party"><div class="label">מקבל</div><div class="name">${receiverName}</div></div>
      </div>

      <div class="amount-box">
        <div class="amount-label">סכום הפיצוי</div>
        <div class="amount">₪${fee.toFixed(2)}</div>
      </div>

      <div class="row"><span>סיבה</span><span>פיצוי בגין ביטול משמרת מאוחר</span></div>
      <div class="row"><span>תפקיד במשמרת</span><span>${roleLabel}</span></div>
      <div class="row"><span>תאריך המשמרת</span><span>${shiftDateStr}</span></div>
      <div class="row"><span>צד מבטל</span><span>${cancelledBy === 'worker' ? 'העובד' : 'המסעדה'}</span></div>

      <div class="note">
        ✅ סכום זה הועבר <b>ישירות בין הצדדים</b> כפיצוי על ביטול מאוחר.<br/>
        <b>Staffly לא גבתה עמלה</b> על תשלום זה.
      </div>

      <div class="legal">
        ⚠️ אסמכתא זו אינה חשבונית מס רשמית. אם הינך עוסק, ייתכן שעליך להוציא קבלה/חשבונית בגין סכום זה בהתאם להנחיות רואה החשבון שלך.
      </div>

      <div class="footer">
        Staffly Platform | getstaffly.vercel.app<br/>
        אסמכתא זו הופקה אוטומטית עם ביצוע הפיצוי.
      </div>
      </body></html>`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 z-50 flex items-center justify-center px-4 pointer-events-none"
        style={{
          top: 'calc(env(safe-area-inset-top) + 64px)',
          bottom: 'calc(78px + env(safe-area-inset-bottom))',
        }}>
        <div className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm pointer-events-auto"
          style={{ maxHeight: '100%' }}>

          {/* Header */}
          <div className="flex-shrink-0 p-4 text-white" style={{ background:'linear-gradient(135deg,#0d1420,#1a2744)' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-black text-sm">{title}</div>
                <div className="text-gray-400 text-xs mt-0.5">{docId}</div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/15">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-gray-400 text-xs">{viewerReceived ? 'פיצוי שקיבלת' : 'קנס ששילמת'}</div>
              <div className="text-2xl font-black" style={{ color: amountColor }}>{amountSign}₪{fee.toFixed(0)}</div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling:'touch' as any }}>
            {/* תרשים זרימה */}
            <div className="flex items-center justify-between gap-2 rounded-xl p-3" style={{ background:'#f9fafb', border:'1px solid #e5e7eb' }}>
              <div className="flex-1 text-center">
                <div className="text-[10px] text-gray-400">משלם</div>
                <div className="text-sm font-bold text-gray-900">{payerName}</div>
              </div>
              <ArrowLeftRight size={16} style={{ color:'#e8a020' }} />
              <div className="flex-1 text-center">
                <div className="text-[10px] text-gray-400">מקבל</div>
                <div className="text-sm font-bold text-gray-900">{receiverName}</div>
              </div>
            </div>

            {[
              { l:'סיבה',          v:'פיצוי ביטול מאוחר' },
              { l:'תפקיד',         v: roleLabel },
              { l:'תאריך משמרת',   v: shiftDateStr },
              { l:'צד מבטל',       v: cancelledBy === 'worker' ? 'העובד' : 'המסעדה' },
            ].map(r => (
              <div key={r.l} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-400">{r.l}</span>
                <span className="font-semibold text-gray-900">{r.v}</span>
              </div>
            ))}

            <div className="rounded-xl p-3 text-xs leading-relaxed"
              style={{ background:'#f0fdf4', border:'1px solid #86efac', color:'#166534' }}>
              ✅ הסכום הועבר <strong>ישירות בין הצדדים</strong> — Staffly לא גבתה עמלה.
            </div>

            <div className="rounded-xl p-3 text-xs leading-relaxed"
              style={{ background:'#fef9ec', border:'1px solid #fcd34d', color:'#92400e' }}>
              ⚠️ אסמכתא זו אינה חשבונית מס רשמית.
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
            <button onClick={handlePrint}
              className="w-full text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 text-sm"
              style={{ background:'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow:'0 4px 16px rgba(232,160,32,0.3)' }}>
              <Printer size={16} /> הדפס אסמכתא
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
