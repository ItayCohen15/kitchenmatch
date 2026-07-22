import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, CreditCard, CheckCircle2, FileText, X, Printer, Lightbulb } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { printHTML } from '../../utils/print';
import { esc } from '../../utils/escapeHtml';
import { CompensationDoc } from '../common/CompensationDoc';
import { restaurantRate } from '../../utils/levels';
import { haptic } from '../../utils/haptics';

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
             border:2px solid #e8a020;border-radius:12px}
        .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
        .logo{font-size:20px;font-weight:900}.gold{color:#c8840a}
        .logo-sub{font-size:10px;color:#9ca3af}
        .rec-title{font-size:15px;font-weight:700;text-align:left}
        .rec-num{font-size:11px;color:#9ca3af;text-align:left}
        .section{margin:12px 0;padding:12px 14px;background:#f9fafb;border-radius:8px;border-right:3px solid #e8a020}
        .sec-label{font-weight:700;font-size:12px;color:#374151;margin-bottom:7px}
        .field{font-size:13px;margin:3px 0;color:#374151}
        .field b{font-weight:700}
        .calc-table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}
        .calc-table td{padding:7px 4px;border-bottom:1px solid #f5f5f5}
        .calc-table .total-row td{font-weight:900;font-size:15px;color:#d97706;
                                   border-top:2px solid #e8a020;border-bottom:none;padding-top:10px}
        .total-box{background:linear-gradient(135deg,#0d1420,#1a2744);color:white;
                   padding:14px;border-radius:10px;margin:14px 0}
        .total-label{font-size:11px;color:#9ca3af;margin-bottom:3px}
        .total-amount{font-size:26px;font-weight:900;color:#e8a020}
        .legal{font-size:11px;color:#374151;background:#fef9ec;border:1px solid #fcd34d;
               border-radius:8px;padding:10px 12px;margin:10px 0;line-height:1.7}
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
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 z-50 flex items-center justify-center px-4 pointer-events-none"
        style={{
          top: 'calc(env(safe-area-inset-top) + 64px)',
          bottom: 'calc(78px + env(safe-area-inset-bottom))',
        }}>
      <div className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm pointer-events-auto"
        style={{ maxHeight: '100%' }}>

        {/* Header – דביק */}
        <div className="flex-shrink-0 p-4 text-white" style={{ background:'linear-gradient(135deg,#0d1420,#1a2744)' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-black text-sm">קבלת עמלת תיווך</div>
              <div className="text-gray-400 text-xs mt-0.5">Staffly · {receiptNum}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-xs">עמלת תיווך ({commPct}%){job.IsEmergency ? ' · חירום' : ''}</div>
            <div className="text-2xl font-black" style={{ color:'#e8a020' }}>₪{commStr}</div>
          </div>
        </div>

        {/* תוכן גלילתי */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling:'touch' as any }}>
          <div className="mx-4 mt-3 p-3 rounded-xl text-xs leading-relaxed"
            style={{ background:'#fef9ec', border:'1px solid #fcd34d', color:'#92400e' }}>
            ⚖️ <strong>קבלה זו לעמלת תיווך בלבד.</strong> Staffly אינה המעסיקה. חוזה העבודה הוא בינך לבין העובד.
          </div>

          <div className="p-4 space-y-3">
            <div className="rounded-xl p-3" style={{ background:'#f9fafb', border:'1px solid #e5e7eb' }}>
              <div className="text-xs font-bold text-gray-500 mb-2">פירוט שיבוץ</div>
              {[
                { l:'תפקיד', v: ROLE_LABELS[job.Role] ?? job.Role ?? '' },
                { l:'עובד',  v: job.WorkerName ?? '—' },
                { l:'תאריך', v: dateStr },
                { l:'שעות',  v: `${hoursNum.toFixed(2)} ש׳` },
              ].map(r => (
                <div key={r.l} className="flex justify-between py-1.5 border-b border-gray-100 text-sm last:border-0">
                  <span className="text-gray-400">{r.l}</span>
                  <span className="font-semibold text-gray-900">{r.v}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
                <span className="text-gray-400">סכום משמרת בסיסי</span>
                <span className="font-semibold text-gray-900">₪{baseStr}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
                <span className="text-gray-400">שיעור עמלה</span>
                <span className="font-semibold text-gray-900">{commPct}%</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
                <span className="text-gray-400">עמלת Staffly</span>
                <span className="font-semibold text-red-500">₪{commStr}</span>
              </div>
              <div className="flex justify-between pt-3 pb-1">
                <span className="font-bold text-gray-900">סה"כ ששילמת</span>
                <span className="font-black text-gray-900 text-lg">₪{totalStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* כפתור – דביק */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <button onClick={handlePrint}
            className="w-full text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 text-sm"
            style={{ background:'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow:'0 4px 16px rgba(232,160,32,0.3)' }}>
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
  const { userProfile, refreshProfile } = useApp();
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUp, setShowTopUp]     = useState(false);
  const [topping, setTopping]         = useState(false);
  const [topped, setTopped]           = useState(false);
  const [topUpErr, setTopUpErr]       = useState('');
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

  // ── טעינת ארנק אמיתית דרך הספק (PayMe escrow funding) ──
  // קודם (טעינה מדומה — UI בלבד, ללא שרת):
  // const handleTopUp = () => {
  //   setTopping(true);
  //   setTimeout(() => {
  //     setTopping(false);
  //     setTopped(true);
  //     setShowTopUp(false);
  //     setTimeout(() => setTopped(false), 3000);
  //   }, 1800);
  // };
  const handleTopUp = async () => {
    const amount = Number(topUpAmount);
    if (!userProfile?.Id || !(amount > 0) || topping) return;
    setTopping(true); setTopUpErr('');
    try {
      await api.restaurantTopUp(userProfile.Id, amount);
      await refreshProfile();          // עדכון יתרת הארנק מהשרת
      setTopping(false);
      setTopped(true);
      setShowTopUp(false);
      haptic('success');
      setTimeout(() => setTopped(false), 3000);
    } catch (e: any) {
      setTopping(false);
      setTopUpErr(e.message || 'הטעינה נכשלה');
      haptic('error');
    }
  };

  return (
    <div className="screen-enter space-y-4">

      {/* Balance card */}
      <div className="rounded-3xl p-5 text-white" style={{ background:'linear-gradient(135deg,#0d1420,#1a2744)' }}>
        <div className="text-gray-400 text-sm mb-1">יתרה בארנק</div>
        <div className="text-4xl font-black mb-1" style={{ color:'#e8a020' }}>
          ₪{walletBalance.toLocaleString()}
        </div>
        {name && <div className="text-gray-400 text-sm mb-3">{name}</div>}

        <div className="grid grid-cols-2 gap-3 mt-2">
          <button onClick={() => setShowTopUp(s => !s)}
            className="rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-sm bg-white/15">
            <Plus size={16} /> טען כסף
          </button>
          <button className="rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-sm"
            style={{ background:'linear-gradient(135deg,#e8a020,#f0c050)' }}>
            <CreditCard size={16} /> כרטיס אשראי
          </button>
        </div>
      </div>

      {/* Top-up panel */}
      {showTopUp && (
        <div className="bg-white rounded-2xl p-4 card-shadow screen-enter">
          <h3 className="font-bold text-gray-800 mb-3">טעינת ארנק</h3>
          <div className="flex gap-2 mb-3">
            {[500, 1000, 2000, 5000].map(a => (
              <button key={a} onClick={() => setTopUpAmount(String(a))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
                  topUpAmount === String(a) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                ₪{a}
              </button>
            ))}
          </div>
          <div className="relative mb-3">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₪</span>
            <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
              placeholder="סכום אחר"
              className="w-full border border-gray-200 rounded-xl py-3 pr-8 pl-3 text-right font-semibold" />
          </div>
          <button onClick={handleTopUp} disabled={!topUpAmount || topping}
            className="w-full bg-amber-500 text-white rounded-xl py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            {topping ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>מעבד...</>
            ) : `טען ₪${topUpAmount}`}
          </button>
          {topUpErr && (
            <div className="mt-2 text-xs text-center rounded-xl px-3 py-2 bg-red-50 text-red-600">{topUpErr}</div>
          )}
        </div>
      )}

      {topped && (
        <div className="bg-green-500 rounded-2xl p-3 text-white flex items-center gap-3 screen-enter">
          <CheckCircle2 size={20} />
          <span className="font-semibold">הארנק נטען בהצלחה! ₪{topUpAmount}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'סה״כ הוצאות',  value:`₪${Math.round(totalSpend).toLocaleString()}`, color:'text-amber-500' },
          { label:'ממוצע למשמרת', value:`₪${avgPerShift}`,                             color:'text-blue-500' },
          { label:'משמרות',       value: jobs.length,                                  color:'text-green-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 card-shadow text-center">
            <div className={`font-black text-lg ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Commission explainer */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background:'rgba(232,160,32,0.15)' }}>
            <Lightbulb size={15} className="text-amber-500" />
          </div>
          <span className="font-bold text-gray-800 text-sm">מבנה עמלות</span>
        </div>
        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>שכר עובד (ישיר)</span>
            <span className="font-semibold text-gray-700">סכום בסיסי</span>
          </div>
          <div className="flex justify-between">
            <span>עמלת Staffly (ממסעדה)</span>
            <span className="font-semibold text-amber-600">+ 6.5%</span>
          </div>
          <div className="flex justify-between">
            <span>עמלת Staffly (מעובד)</span>
            <span className="font-semibold text-gray-400">6.5% (נגבה מהעובד)</span>
          </div>
          <div className="h-px bg-gray-100 my-1"/>
          <div className="flex justify-between font-bold text-gray-700">
            <span>סה"כ עלות ממסעדה</span>
            <span style={{ color:'#e8a020' }}>× 1.065</span>
          </div>
          <div className="flex justify-between text-red-500 mt-1">
            <span>משמרת חירום</span>
            <span className="font-semibold">מסעדה 12% · עובד 4%</span>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-2xl p-4 text-white"
        style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
        <div className="font-bold mb-1">מנוי Pro מסעדות</div>
        <div className="text-purple-100 text-sm mb-3">
          חסוך עד 5% עמלות · עדיפות בשיבוץ · תמיכה 24/7
        </div>
        <button className="bg-white text-purple-600 rounded-xl px-4 py-2 font-bold text-sm">
          רק ₪199/חודש – נסה חינם
        </button>
      </div>

      {/* Transaction history */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">היסטוריית משמרות</h3>

        {loading && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"/>
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="bg-white rounded-xl p-6 text-center card-shadow">
            <FileText size={26} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">אין משמרות עדיין</p>
            <p className="text-gray-400 text-xs mt-1">פרסמו משמרת ראשונה כדי להתחיל</p>
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
            const statusColor = isCompleted ? 'text-green-500' : isCancelled ? 'text-red-400' : j.Status === 'searching' ? 'text-amber-400' : 'text-blue-400';
            const statusLabel = isCompleted ? 'הושלם' : isCancelled ? 'בוטל' : j.Status === 'searching' ? 'מחפש' : j.Status === 'active' ? 'פעיל' : j.Status === 'confirmed' ? 'מאושר' : j.Status;

            return (
              <div key={i} className="bg-white rounded-xl p-3 card-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight size={18} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">
                      {ROLE_LABELS[j.Role] ?? j.Role} · {hours} ש׳
                      {j.WorkerName && <span className="text-gray-400 font-normal"> · {j.WorkerName}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">
                        {start.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit' })}
                      </span>
                      <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {charged > 0 ? (
                      <div className="text-red-500 font-bold text-sm">-₪{charged.toFixed(0)}</div>
                    ) : restaurantPaidFee ? (
                      <>
                        <div className="text-red-500 font-bold text-sm">-₪{cancelFee.toFixed(0)}</div>
                        <span className="text-[10px] text-red-400">קנס ביטול</span>
                      </>
                    ) : restaurantGotComp ? (
                      <>
                        <div className="text-green-600 font-bold text-sm">+₪{cancelFee.toFixed(0)}</div>
                        <span className="text-[10px] text-green-500">פיצוי ביטול</span>
                      </>
                    ) : (
                      <div className="text-gray-300 font-bold text-sm">₪0</div>
                    )}
                    {isCompleted && (
                      <button onClick={() => setReceiptJob(j)}
                        className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background:'rgba(232,160,32,0.1)', color:'#c8840a' }}>
                        <FileText size={11} /> עמלה
                      </button>
                    )}
                    {(restaurantPaidFee || restaurantGotComp) && (
                      <button onClick={() => setCompJob(j)}
                        className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background:'rgba(5,150,105,0.08)', color:'#059669' }}>
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
