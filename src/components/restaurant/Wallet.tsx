import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CreditCard, FileText, X, Printer, Lightbulb, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { printHTML } from '../../utils/print';
import { esc } from '../../utils/escapeHtml';
import { CompensationDoc } from '../common/CompensationDoc';
import { restaurantRate } from '../../utils/levels';

/* ═══════════════════════════════════════════════════════════
   מסמך 3 – קבלת עמלת תיווך (Staffly → מסעדה)
   הסכום: 6.5% מסכום המשמרת הבסיסי
═══════════════════════════════════════════════════════════ */
const CommissionReceiptDoc = ({ job, restaurant, onClose }: { job: any; restaurant: any; onClose: () => void }) => {
  const start      = new Date(job.StartTime);
  const end        = new Date(job.EndTime);
  const hoursNum   = (end.getTime() - start.getTime()) / 3600000;
  const base       = hoursNum * job.HourlyRate;          // סכום בסיסי
  const commRate   = restaurantRate(job.IsEmergency);    // חירום=12%, אחרת 6.5%
  const commPct    = +(commRate * 100).toFixed(1);
  const commission = base * commRate;                    // עמלת מסעדה
  const totalPaid  = base + commission;                  // מה המסעדה שילמה בפועל
  const baseStr    = base.toFixed(2);
  const commStr    = commission.toFixed(2);
  const totalStr   = totalPaid.toFixed(2);
  const dateStr    = start.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'numeric' });
  const receiptNum = `KM-COM-${(job.Id ?? 0).toString().padStart(6, '0')}`;

  const handlePrint = () => {
    printHTML(`
      <html dir="rtl"><head><meta charset="UTF-8"><title>קבלת עמלה ${receiptNum}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;max-width:480px;margin:30px auto;padding:24px;color:#111;
             border:2px solid #5354d3;border-radius:12px}
        .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
        .logo{font-size:20px;font-weight:900}.gold{color:#4244b8}
        .logo-sub{font-size:10px;color:#9ca3af}
        .rec-title{font-size:15px;font-weight:700;text-align:left}
        .rec-num{font-size:11px;color:#9ca3af;text-align:left}
        .section{margin:12px 0;padding:12px 14px;background:#f9fafb;border-radius:8px;border-right:3px solid #5354d3}
        .sec-label{font-weight:700;font-size:12px;color:#374151;margin-bottom:7px}
        .field{font-size:13px;margin:3px 0;color:#374151}
        .field b{font-weight:700}
        .calc-table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}
        .calc-table td{padding:7px 4px;border-bottom:1px solid #f5f5f5}
        .calc-table .total-row td{font-weight:900;font-size:15px;color:#4244b8;
                                   border-top:2px solid #5354d3;border-bottom:none;padding-top:10px}
        .total-box{background:#1b1e38;color:white;
                   padding:14px;border-radius:10px;margin:14px 0}
        .total-label{font-size:11px;color:#9ca3af;margin-bottom:3px}
        .total-amount{font-size:26px;font-weight:900;color:#5354d3}
        .legal{font-size:11px;color:#374151;background:#fef9ec;border:1px solid #fcd34d;
               border-radius:8px;padding:10px 12px;margin:10px 0;line-height:1.7}
        .footer{margin-top:16px;font-size:10px;color:#9ca3af;text-align:center;
                border-top:1px solid #e5e7eb;padding-top:10px;line-height:1.7}
        @media print{body{margin:0;border:2px solid #5354d3}}
      </style></head><body>
      <div class="top">
        <div>
          <div class="logo">Staff<span class="gold">ly</span></div>
          <div class="logo-sub">פלטפורמת שיבוץ כוח אדם</div>
        </div>
        <div>
          <div class="rec-title">קבלת עמלת תיווך</div>
          <div class="rec-num">מס׳ ${receiptNum}</div>
          <div class="rec-num">${dateStr}</div>
        </div>
      </div>

      <div class="section">
        <div class="sec-label">ספק שירות התיווך</div>
        <div class="field"><b>שם:</b> Staffly Platform</div>
        <div class="field"><b>תיאור:</b> פלטפורמת שיבוץ כוח אדם למטבחים</div>
        <div class="field"><b>אתר:</b> getstaffly.vercel.app</div>
      </div>

      <div class="section" style="border-right-color:#10b981">
        <div class="sec-label">ללקוח (מסעדה)</div>
        <div class="field"><b>שם:</b> ${esc(restaurant?.Name ?? job.RestaurantName ?? '___________')}</div>
        <div class="field"><b>עיר:</b> ${esc(restaurant?.City ?? '___________')}</div>
      </div>

      <div class="section" style="border-right-color:#3b82f6">
        <div class="sec-label">פירוט שיבוץ</div>
        <div class="field">עמלת תיווך לשיבוץ עובד מטבח – משמרת חד-פעמית</div>
        <div class="field"><b>תאריך משמרת:</b> ${esc(dateStr)}</div>
        <div class="field"><b>תפקיד:</b> ${esc(ROLE_LABELS[job.Role] ?? job.Role)}</div>
        <div class="field"><b>שם עובד:</b> ${esc(job.WorkerName ?? 'לא זמין')}</div>
        <div class="field"><b>שעות:</b> ${hoursNum.toFixed(2)} שעות</div>
      </div>

      <table class="calc-table">
        <tr><td>סכום משמרת בסיסי</td><td align="left">₪${baseStr}</td></tr>
        <tr><td>שיעור עמלת פלטפורמה</td><td align="left">${commPct}%</td></tr>
        <tr class="total-row"><td>סה"כ עמלת תיווך</td><td align="left">₪${commStr}</td></tr>
      </table>

      <div class="total-box">
        <div class="total-label">שולם לפלטפורמה</div>
        <div class="total-amount">₪${commStr}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:4px">
          (מתוך סה"כ עסקה: ₪${totalStr})
        </div>
      </div>

      <div class="legal">
        ⚖️ <b>הבהרה משפטית:</b><br/>
        קבלה זו מהווה אסמכתא לעמלת תיווך בלבד.<br/>
        <b>Staffly אינה המעסיקה של העובד.</b><br/>
        חוזה העבודה הינו בין המסעדה לעובד העצמאי באופן ישיר.<br/>
        הפלטפורמה משמשת כמתווך מקצועי בלבד.
      </div>

      <div class="footer">
        Staffly Platform | getstaffly.vercel.app<br/>
        קבלה זו הופקה אוטומטית עם סיום המשמרת.<br/>
        לשאלות: support@staffly.com
      </div>
      </body></html>`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 z-50 flex items-center justify-center px-4 pointer-events-none"
        style={{
          top: 'calc(env(safe-area-inset-top) + 64px)',
          bottom: 'calc(78px + env(safe-area-inset-bottom))',
        }}>
      <div className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm pointer-events-auto"
        style={{ maxHeight: '100%' }}>

        {/* Header – דביק */}
        <div className="flex-shrink-0 p-4 text-white" style={{ background:'#1b1e38' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-bold text-sm">קבלת עמלת תיווך</div>
              <div className="text-gray-400 text-xs mt-0.5">Staffly · {receiptNum}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color:'#b9c0d8' }}>עמלת תיווך ({commPct}%){job.IsEmergency ? ' · חירום' : ''}</div>
            <div className="text-2xl font-black" style={{ color:'#f4b62c' }}>₪{commStr}</div>
          </div>
        </div>

        {/* תוכן גלילתי */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling:'touch' as any }}>
          <div className="mx-4 mt-3 p-3 rounded-xl text-xs leading-relaxed"
            style={{ background:'#fef9ec', border:'1px solid #fcd34d', color:'#92400e' }}>
            <strong>קבלה זו לעמלת תיווך בלבד.</strong> Staffly אינה המעסיקה. חוזה העבודה הוא בינך לבין העובד.
          </div>

          <div className="p-4 space-y-3">
            <div className="rounded-xl p-3" style={{ background:'#f4f5f9', border:'1px solid #eceef4' }}>
              <div className="text-xs font-bold mb-2" style={{ color:'#7a8199' }}>פירוט שיבוץ</div>
              {[
                { l:'תפקיד', v: ROLE_LABELS[job.Role] ?? job.Role ?? '' },
                { l:'עובד',  v: job.WorkerName ?? '—' },
                { l:'תאריך', v: dateStr },
                { l:'שעות',  v: `${hoursNum.toFixed(2)} ש׳` },
              ].map(r => (
                <div key={r.l} className="flex justify-between py-1.5 text-sm last:border-0" style={{ borderBottom:'1px solid #eceef4' }}>
                  <span style={{ color:'#7a8199' }}>{r.l}</span>
                  <span className="font-semibold" style={{ color:'#141a2e' }}>{r.v}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between py-2.5 text-sm" style={{ borderBottom:'1px solid #f4f5f9' }}>
                <span style={{ color:'#7a8199' }}>סכום משמרת בסיסי</span>
                <span className="font-semibold" style={{ color:'#141a2e' }}>₪{baseStr}</span>
              </div>
              <div className="flex justify-between py-2.5 text-sm" style={{ borderBottom:'1px solid #f4f5f9' }}>
                <span style={{ color:'#7a8199' }}>שיעור עמלה</span>
                <span className="font-semibold" style={{ color:'#141a2e' }}>{commPct}%</span>
              </div>
              <div className="flex justify-between py-2.5 text-sm" style={{ borderBottom:'1px solid #f4f5f9' }}>
                <span style={{ color:'#7a8199' }}>עמלת Staffly</span>
                <span className="font-semibold" style={{ color:'#cf3030' }}>₪{commStr}</span>
              </div>
              <div className="flex justify-between pt-3 pb-1">
                <span className="font-bold" style={{ color:'#141a2e' }}>סה"כ ששילמת</span>
                <span className="font-black text-lg" style={{ color:'#141a2e' }}>₪{totalStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* כפתור – דביק */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <button onClick={handlePrint}
            className="w-full rounded-2xl py-3 font-bold flex items-center justify-center gap-2 text-sm"
            style={{ background:'#5354d3', color:'#ffffff' }}>
            <Printer size={16} /> הדפס קבלת עמלה
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   ראשי – ארנק מסעדה
═══════════════════════════════════════════════════════════ */
export const RestaurantWallet: React.FC = () => {
  const { userProfile } = useApp();
  const [jobs, setJobs]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [receiptJob, setReceiptJob]   = useState<any>(null);
  const [compJob, setCompJob]         = useState<any>(null);

  const walletBalance = userProfile?.WalletBalance ?? 0;
  const name          = userProfile?.Name ?? '';

  useEffect(() => {
    if (userProfile?.Id) {
      api.getRestaurantJobs(userProfile.Id)
        .then(data => setJobs(Array.isArray(data) ? data : []))
        .catch(() => setJobs([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const completedJobs = jobs.filter(j => j.Status === 'completed');
  const totalSpend    = completedJobs.reduce((sum, j) => {
    const schedH = (new Date(j.EndTime).getTime() - new Date(j.StartTime).getTime()) / 3600000;
    // בסיס לפי שכר בפועל מהשרת (אם קיים), עמלה על הסכום המקורי — בדיוק כמו חישוב השרת
    const base = Number(j.TotalPay) || schedH * j.HourlyRate;
    const restComm = schedH * j.HourlyRate * restaurantRate(j.IsEmergency); // עמלת מסעדה (חירום 12%)
    return sum + base + restComm;
  }, 0);
  const avgPerShift = completedJobs.length > 0 ? (totalSpend / completedJobs.length).toFixed(0) : 0;

  // ── טעינת ארנק (סליקה) ──
  // מנוטרל בכוונה: חיבור הסליקה המאובטח (PayMe escrow funding) עדיין לא חובר,
  // ולכן אין דרך אמיתית לגבות כרטיס. עד אז לא מציגים כפתור טעינה כדי שלא ייטען
  // כסף פיקטיבי לארנק. כשהסליקה תחובר — מחזירים כאן handleTopUp שקורא ל-api.restaurantTopUp.

  return (
    <div className="screen-enter space-y-4">

      {/* Balance card */}
      <div className="relative rounded-3xl overflow-hidden text-white" style={{ background:'#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 260, height: 260, borderRadius: '50%', bottom: -120, left: -80, background: 'radial-gradient(circle, rgba(244,182,44,.20), transparent 66%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '50%', top: -80, left: 40, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />
        <div className="relative p-5">
          <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-2" style={{ color:'#cdd3e8' }}>
            <Wallet size={14} style={{ color:'#f4b62c' }} /> יתרה בארנק
          </div>
          <div className="font-black mb-1" style={{ fontSize: 40, lineHeight: 1.05, color:'#f4b62c' }}>
            ₪{walletBalance.toLocaleString()}
          </div>
          {name && <div className="text-[13px] font-semibold mb-3" style={{ color:'#b9c0d8' }}>{name}</div>}

          {/* טעינת ארנק — חיבור סליקה מאובטח בתהליך. מנוטרל בכוונה כדי שלא ייטען כסף עד שהסליקה תחובר. */}
          <div className="rounded-2xl py-3 px-4 mt-2 flex items-center justify-center gap-2 font-semibold text-sm"
            style={{ background:'rgba(255,255,255,0.06)', color:'#8899bb', cursor:'not-allowed' }}>
            <CreditCard size={16} /> בקרוב — חיבור סליקה מאובטח
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'סה״כ הוצאות',  value:`₪${Math.round(totalSpend).toLocaleString()}` },
          { label:'ממוצע למשמרת', value:`₪${avgPerShift}` },
          { label:'משמרות',       value: jobs.length },
        ].map(s => (
          <div key={s.label} className="text-center"
            style={{ background:'#fff', border:'1px solid #eceef4', borderRadius: 20, padding:'14px 8px', boxShadow:'0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
            <div className="font-black" style={{ fontSize: 18, color:'#141a2e' }}>{s.value}</div>
            <div className="font-semibold mt-0.5" style={{ fontSize: 10.5, color:'#7a8199' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Commission explainer */}
      <div style={{ background:'#fff', border:'1px solid #eceef4', borderRadius: 20, padding: 16, boxShadow:'0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background:'rgba(83,84,211,0.12)' }}>
            <Lightbulb size={15} style={{ color:'#5354d3' }} />
          </div>
          <span className="font-black text-sm" style={{ color:'#141a2e' }}>מבנה עמלות</span>
        </div>
        <div className="space-y-1.5 text-xs" style={{ color:'#7a8199' }}>
          <div className="flex justify-between">
            <span>שכר עובד (ישיר)</span>
            <span className="font-semibold" style={{ color:'#2b3350' }}>סכום בסיסי</span>
          </div>
          <div className="flex justify-between">
            <span>עמלת Staffly (ממסעדה)</span>
            <span className="font-bold" style={{ color:'#5354d3' }}>+ 6.5%</span>
          </div>
          <div className="flex justify-between">
            <span>עמלת Staffly (מעובד)</span>
            <span className="font-semibold" style={{ color:'#7a8199' }}>6.5% (נגבה מהעובד)</span>
          </div>
          <div className="h-px my-1" style={{ background:'#eceef4' }}/>
          <div className="flex justify-between font-bold" style={{ color:'#2b3350' }}>
            <span>סה"כ עלות ממסעדה</span>
            <span style={{ color:'#5354d3' }}>× 1.065</span>
          </div>
          <div className="flex justify-between mt-1" style={{ color:'#cf3030' }}>
            <span>משמרת חירום</span>
            <span className="font-semibold">מסעדה 12% · עובד 4%</span>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="relative rounded-3xl overflow-hidden text-white" style={{ background:'#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 220, height: 220, borderRadius: '50%', bottom: -110, left: -70, background: 'radial-gradient(circle, rgba(244,182,44,.18), transparent 66%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 160, height: 160, borderRadius: '50%', top: -70, left: 30, background: 'radial-gradient(circle, rgba(83,84,211,.20), transparent 68%)' }} />
        <div className="relative p-5">
          <div className="font-black text-base mb-1">מנוי Pro מסעדות</div>
          <div className="text-[13px] leading-relaxed mb-4" style={{ color:'#b9c0d8' }}>
            חסוך עד 5% עמלות · עדיפות בשיבוץ · תמיכה 24/7
          </div>
          <button className="inline-flex items-center gap-2 font-extrabold text-sm px-5 py-3 rounded-2xl active:scale-95 transition-transform"
            style={{ background:'#f4b62c', color:'#3a2c00', boxShadow:'0 8px 20px -6px rgba(244,182,44,.5)' }}>
            רק ₪199/חודש – נסה חינם
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h3 className="font-black mb-3" style={{ fontSize: 17, color:'#141a2e' }}>היסטוריית משמרות</h3>

        {loading && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-[#5354d3] border-t-transparent rounded-full animate-spin mx-auto"/>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="text-center p-6" style={{ background:'#fff', border:'1px solid #eceef4', borderRadius: 20, boxShadow:'0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
            <FileText size={26} className="mx-auto mb-2" style={{ color:'#c2c7da' }} />
            <p className="text-sm font-semibold" style={{ color:'#7a8199' }}>אין משמרות עדיין</p>
            <p className="text-xs mt-1" style={{ color:'#a7adc4' }}>פרסמו משמרת ראשונה כדי להתחיל</p>
          </div>
        )}

        <div className="space-y-2">
          {jobs.map((j: any, i: number) => {
            const start     = new Date(j.StartTime);
            const end       = new Date(j.EndTime);
            const hours     = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
            const base      = parseFloat(hours) * j.HourlyRate;
            const isCompleted = j.Status === 'completed';
            const isCancelled = j.Status === 'cancelled';
            // משמרת מבוטלת: רק קנס (אם היה ביטול מאוחר), אחרת ₪0
            // משמרת שהושלמה: עלות מלאה כולל עמלה. אחרת: עדיין לא חויב
            const cancelFee = Number(j.CancellationFee ?? 0);
            // ביטול: אם המסעדה ביטלה מאוחר → שילמה קנס (-). אם העובד ביטל מאוחר → המסעדה קיבלה פיצוי (+)
            const restaurantPaidFee = isCancelled && cancelFee > 0 && j.CancelledBy === 'restaurant';
            const restaurantGotComp = isCancelled && cancelFee > 0 && j.CancelledBy === 'worker';
            const charged   = isCompleted ? base * (1 + restaurantRate(j.IsEmergency)) : 0;
            const statusBadge = isCompleted ? { bg:'#e4f7ee', fg:'#1f8f5f' } : isCancelled ? { bg:'#fde3e3', fg:'#cf3030' } : j.Status === 'searching' ? { bg:'#fdf0cf', fg:'#8a6300' } : { bg:'#ece9fe', fg:'#5b4bd0' };
            const statusLabel = isCompleted ? 'הושלם' : isCancelled ? 'בוטל' : j.Status === 'searching' ? 'מחפש' : j.Status === 'active' ? 'פעיל' : j.Status === 'confirmed' ? 'מאושר' : j.Status;

            return (
              <div key={i} className="p-3"
                style={{ background:'#fff', border:'1px solid #eceef4', borderRadius: 16, boxShadow:'0 1px 2px rgba(20,26,46,.04), 0 6px 18px -10px rgba(20,26,46,.10)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:'#ece9fe' }}>
                    <ArrowUpRight size={18} style={{ color:'#5354d3' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color:'#141a2e' }}>
                      {ROLE_LABELS[j.Role] ?? j.Role} · {hours} ש׳
                      {j.WorkerName && <span className="font-normal" style={{ color:'#7a8199' }}> · {j.WorkerName}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold" style={{ color:'#7a8199' }}>
                        {start.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit' })}
                      </span>
                      <span className="inline-block font-extrabold" style={{ fontSize: 10.5, padding:'3px 9px', borderRadius: 6, background: statusBadge.bg, color: statusBadge.fg }}>{statusLabel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {charged > 0 ? (
                      <div className="font-black text-sm" style={{ color:'#cf3030' }}>-₪{charged.toFixed(0)}</div>
                    ) : restaurantPaidFee ? (
                      <>
                        <div className="font-black text-sm" style={{ color:'#cf3030' }}>-₪{cancelFee.toFixed(0)}</div>
                        <span className="text-[10px] font-semibold" style={{ color:'#cf3030' }}>קנס ביטול</span>
                      </>
                    ) : restaurantGotComp ? (
                      <>
                        <div className="font-black text-sm" style={{ color:'#1f8f5f' }}>+₪{cancelFee.toFixed(0)}</div>
                        <span className="text-[10px] font-semibold" style={{ color:'#1f8f5f' }}>פיצוי ביטול</span>
                      </>
                    ) : (
                      <div className="font-black text-sm" style={{ color:'#c2c7da' }}>₪0</div>
                    )}
                    {isCompleted && (
                      <button onClick={() => setReceiptJob(j)}
                        className="flex items-center gap-1 text-xs font-extrabold px-2 py-1 rounded-lg active:scale-95 transition-transform"
                        style={{ background:'#ece9fe', color:'#5b4bd0' }}>
                        <FileText size={11} /> עמלה
                      </button>
                    )}
                    {(restaurantPaidFee || restaurantGotComp) && (
                      <button onClick={() => setCompJob(j)}
                        className="flex items-center gap-1 text-xs font-extrabold px-2 py-1 rounded-lg active:scale-95 transition-transform"
                        style={{ background:'#e4f7ee', color:'#1f8f5f' }}>
                        <FileText size={11} /> אסמכתא
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {receiptJob && (
        <CommissionReceiptDoc
          job={receiptJob}
          restaurant={userProfile}
          onClose={() => setReceiptJob(null)}
        />
      )}
      {compJob && (
        <CompensationDoc
          job={compJob}
          viewer="restaurant"
          workerName={compJob.WorkerName ?? 'העובד'}
          restaurantName={userProfile?.Name ?? 'המסעדה'}
          onClose={() => setCompJob(null)}
        />
      )}
    </div>
  );
};
