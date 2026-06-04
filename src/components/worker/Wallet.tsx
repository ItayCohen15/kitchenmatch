import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, X, Printer, Building2, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { printHTML } from '../../utils/print';
import { CompensationDoc } from '../common/CompensationDoc';
import { levelFromShifts, workerCommissionRate, netMultiplier } from '../../utils/levels';

const MONTH_NAMES = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];

/* ─── עזר: חשב נתוני משמרת ─── */
function calcShift(shift: any, rate: number = 0.065) {
  const start = new Date(shift.StartTime);
  const end   = new Date(shift.EndTime);
  const hoursNum = (end.getTime() - start.getTime()) / 3600000;
  const grossNum = hoursNum * shift.HourlyRate;
  const commNum  = grossNum * rate;
  const netNum   = grossNum - commNum;
  const dateStr  = start.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'numeric' });
  return {
    hours:      hoursNum.toFixed(2),
    gross:      grossNum.toFixed(2),
    commission: commNum.toFixed(2),
    net:        netNum.toFixed(2),
    dateStr,
  };
}

/* ═══════════════════════════════════════════════════════════
   מסמך 1 – סיכום משמרת (לא רשמי, UI בלבד)
═══════════════════════════════════════════════════════════ */
const ShiftSummaryDoc = ({ shift, rate, onClose }: { shift: any; rate: number; onClose: () => void }) => {
  const { hours, gross, commission, net, dateStr } = calcShift(shift, rate);
  const docId = `SUM-${(shift.Id ?? 0).toString().padStart(5, '0')}`;
  const ratePct = (rate * 100).toFixed(1);

  const handlePrint = () => {
    printHTML(`
      <html dir="rtl"><head><meta charset="UTF-8"><title>סיכום משמרת ${docId}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;max-width:420px;margin:30px auto;padding:24px;color:#111}
        .logo{font-size:22px;font-weight:900;margin-bottom:2px}.gold{color:#c8840a}
        .doc-title{font-size:17px;font-weight:700;margin:2px 0}
        .doc-meta{font-size:11px;color:#9ca3af;margin-bottom:10px}
        .warning{background:#fff8e1;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;
                 font-size:12px;color:#92400e;margin:10px 0;line-height:1.5}
        h2{font-size:13px;font-weight:700;color:#374151;border-bottom:2px solid #e8a020;
           padding-bottom:5px;margin:16px 0 6px}
        .row{display:flex;justify-content:space-between;padding:5px 0;
             font-size:13px;border-bottom:1px solid #f5f5f5}
        .commission-row{color:#dc2626}
        .net-row{font-weight:900;font-size:16px;color:#059669;
                 border-top:2px solid #e5e7eb;padding-top:10px;margin-top:4px;border-bottom:none}
        .footer{margin-top:20px;font-size:10px;color:#9ca3af;text-align:center;
                border-top:1px solid #e5e7eb;padding-top:10px;line-height:1.7}
        @media print{body{margin:0}}
      </style></head><body>
      <div class="logo">Kitchen<span class="gold">Match</span></div>
      <div class="doc-title">סיכום משמרת</div>
      <div class="doc-meta">${docId} · ${dateStr}</div>

      <div class="warning">
        ⚠️ <strong>מסמך זה אינו מסמך חשבונאי רשמי ואינו חשבונית.</strong><br/>
        לצורך דיווח למס הכנסה, עליך להוציא חשבונית עצמאית ישירות למסעדה.
      </div>

      <h2>פרטי משמרת</h2>
      <div class="row"><span>מסעדה</span><strong>${shift.RestaurantName ?? ''}</strong></div>
      <div class="row"><span>עיר</span><span>${shift.RestaurantCity ?? ''}</span></div>
      <div class="row"><span>תפקיד</span><span>${ROLE_LABELS[shift.Role] ?? shift.Role ?? ''}</span></div>
      <div class="row"><span>תאריך</span><span>${dateStr}</span></div>
      <div class="row"><span>שעות עבודה</span><span>${hours} שעות</span></div>
      <div class="row"><span>תעריף שעתי</span><span>₪${shift.HourlyRate}</span></div>

      <h2>פירוט תשלום</h2>
      <div class="row"><span>סכום משמרת (ברוטו)</span><span>₪${gross}</span></div>
      <div class="row commission-row">
        <span>עמלת KitchenMatch לעובד (${ratePct}%)</span><span>-₪${commission}</span>
      </div>
      <div class="row net-row"><span>נטו לקבלה</span><span>₪${net}</span></div>

      <div class="footer">
        KitchenMatch — פלטפורמת שיבוץ כוח אדם למטבחים<br/>
        kitchenmatch.vercel.app<br/><br/>
        KitchenMatch אינה המעסיקה. העובד הינו עוסק עצמאי.<br/>
        יש להוציא חשבונית עצמאית למסעדה על מלוא סכום המשמרת (₪${gross}).
      </div>
      </body></html>`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      {/* מיכל ממרכז: מותח flex בין ה-notch ל-nav וממרכז את החלון */}
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
              <div className="font-black text-sm">Kitchen<span style={{ color:'#e8a020' }}>Match</span> · סיכום משמרת</div>
              <div className="text-gray-400 text-xs mt-0.5">{docId}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-xs">נטו לקבלה</div>
            <div className="text-2xl font-black" style={{ color:'#e8a020' }}>₪{net}</div>
          </div>
        </div>

        {/* תוכן גלילתי */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling:'touch' as any }}>
          <div className="mx-4 mt-3 p-3 rounded-xl text-xs leading-relaxed"
            style={{ background:'#fff8e1', border:'1px solid #f59e0b', color:'#92400e' }}>
            ⚠️ <strong>מסמך זה אינו חשבונית רשמית.</strong> לדיווח מס, הוצא חשבונית עצמאית למסעדה על סכום ₪{gross}.
          </div>

          <div className="p-4 space-y-0">
            {[
              { l:'מסעדה', v: shift.RestaurantName ?? '' },
              { l:'תפקיד', v: ROLE_LABELS[shift.Role] ?? shift.Role ?? '' },
              { l:'תאריך', v: dateStr },
              { l:'שעות',  v: `${hours} ש׳` },
              { l:'תעריף', v: `₪${shift.HourlyRate}/ש׳` },
            ].map(r => (
              <div key={r.l} className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
                <span className="text-gray-400">{r.l}</span>
                <span className="font-semibold text-gray-900">{r.v}</span>
              </div>
            ))}
            <div className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
              <span className="text-gray-400">סכום משמרת (ברוטו)</span>
              <span className="font-semibold text-gray-900">₪{gross}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
              <span className="text-gray-400">עמלת KitchenMatch ({ratePct}%)</span>
              <span className="font-semibold text-red-500">-₪{commission}</span>
            </div>
            <div className="flex justify-between pt-3 pb-1">
              <span className="font-bold text-gray-900">נטו לקבלה</span>
              <span className="font-black text-green-600 text-xl">₪{net}</span>
            </div>
          </div>
        </div>

        {/* כפתור – דביק */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <button onClick={handlePrint}
            className="w-full text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 text-sm"
            style={{ background:'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow:'0 4px 16px rgba(232,160,32,0.3)' }}>
            <Printer size={16} /> הדפס סיכום
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   מסמך 2 – חשבונית שירות (עובד → מסעדה)
   הסכום: מלא (ברוטו), ללא עמלת פלטפורמה
═══════════════════════════════════════════════════════════ */
const WorkerInvoiceDoc = ({ shift, worker, onClose }: { shift: any; worker: any; onClose: () => void }) => {
  const { hours, gross, dateStr } = calcShift(shift);
  const invoiceNum = `WRK-${(worker?.Id ?? 0)}-${(shift.Id ?? 0).toString().padStart(5,'0')}`;

  const handlePrint = () => {
    printHTML(`
      <html dir="rtl"><head><meta charset="UTF-8"><title>חשבונית ${invoiceNum}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Arial,sans-serif;max-width:480px;margin:30px auto;padding:24px;color:#111;
             border:2px solid #e8a020;border-radius:12px}
        .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
        .logo{font-size:20px;font-weight:900}.gold{color:#c8840a}
        .logo-sub{font-size:10px;color:#9ca3af}
        .inv-title{font-size:15px;font-weight:700;color:#111;text-align:left}
        .inv-num{font-size:11px;color:#9ca3af;text-align:left}
        .section{margin:12px 0;padding:12px 14px;background:#f9fafb;border-radius:8px;border-right:3px solid #e8a020}
        .sec-label{font-weight:700;font-size:12px;color:#374151;margin-bottom:7px;text-transform:uppercase;letter-spacing:0.5px}
        .field{font-size:13px;margin:3px 0;color:#374151}
        .field b{font-weight:700}
        .field-note{font-size:11px;color:#9ca3af;margin-top:3px}
        .desc-section{margin:12px 0;padding:12px 14px;background:#f0f9ff;border-radius:8px;border-right:3px solid #3b82f6}
        .total-box{background:linear-gradient(135deg,#0d1420,#1a2744);color:white;
                   padding:16px;border-radius:10px;margin:14px 0;text-align:center}
        .total-label{font-size:12px;color:#9ca3af;margin-bottom:4px}
        .total-amount{font-size:30px;font-weight:900;color:#e8a020}
        .total-note{font-size:10px;color:#6b7280;margin-top:5px}
        .platform-note{font-size:11px;color:#374151;background:#f0fdf4;border:1px solid #86efac;
                       border-radius:8px;padding:10px;margin:10px 0;line-height:1.6}
        .footer{margin-top:16px;font-size:10px;color:#9ca3af;text-align:center;
                border-top:1px solid #e5e7eb;padding-top:10px;line-height:1.7}
        @media print{body{margin:0;border:2px solid #e8a020}}
      </style></head><body>
      <div class="top">
        <div>
          <div class="logo">Kitchen<span class="gold">Match</span></div>
          <div class="logo-sub">פלטפורמת שיבוץ כוח אדם</div>
        </div>
        <div>
          <div class="inv-title">חשבונית שירות</div>
          <div class="inv-num">מס׳ ${invoiceNum}</div>
          <div class="inv-num">${dateStr}</div>
        </div>
      </div>

      <div class="section">
        <div class="sec-label">👤 מספק שירות – עוסק עצמאי</div>
        <div class="field"><b>שם:</b> ${worker?.Name ?? '___________'}</div>
        <div class="field"><b>טלפון:</b> ${worker?.Phone ?? '___________'}</div>
        <div class="field"><b>מס׳ עוסק פטור / מורשה:</b> ___________________________</div>
        <div class="field-note">* מלא מס׳ עוסק ידנית לפני שליחה</div>
      </div>

      <div class="section" style="border-right-color:#10b981">
        <div class="sec-label">🏪 ללקוח – מסעדה</div>
        <div class="field"><b>שם:</b> ${shift.RestaurantName ?? '___________'}</div>
        <div class="field"><b>עיר:</b> ${shift.RestaurantCity ?? '___________'}</div>
      </div>

      <div class="desc-section">
        <div class="sec-label">📋 פירוט שירות</div>
        <div class="field">שירותי עבודה במטבח – משמרת חד-פעמית</div>
        <div class="field"><b>תאריך משמרת:</b> ${dateStr}</div>
        <div class="field"><b>תפקיד:</b> ${ROLE_LABELS[shift.Role] ?? shift.Role ?? ''}</div>
        <div class="field"><b>שעות עבודה:</b> ${hours} שעות</div>
        <div class="field"><b>תעריף שעתי:</b> ₪${shift.HourlyRate}</div>
      </div>

      <div class="total-box">
        <div class="total-label">סה"כ לתשלום</div>
        <div class="total-amount">₪${gross}</div>
        <div class="total-note">* לא כולל מע"מ (עוסק פטור) / כולל מע"מ – פרט בנפרד (עוסק מורשה)</div>
      </div>

      <div class="platform-note">
        ✅ שולם באמצעות פלטפורמת KitchenMatch<br/>
        <b>KitchenMatch אינה צד לחוזה העבודה ואינה המעסיקה.</b><br/>
        הפלטפורמה משמשת כמתווך בין העוסק העצמאי לבין המסעדה בלבד.
      </div>

      <div class="footer">
        KitchenMatch Platform | kitchenmatch.vercel.app<br/>
        חשבונית זו הופקה בסיוע פלטפורמת KitchenMatch.<br/>
        האחריות על הגשת החשבונית לרשויות המס חלה על העוסק בלבד.
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
              <div className="font-black text-sm">חשבונית שירות</div>
              <div className="text-gray-400 text-xs mt-0.5">מס׳ {invoiceNum}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color:'#e8a020' }}>סכום מלא למסעדה</div>
            <div className="text-2xl font-black text-white">₪{gross}</div>
          </div>
        </div>

        {/* תוכן גלילתי */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling:'touch' as any }}>
          {/* Supplier + Client – grid שווה-גובה */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background:'#f0f9ff', border:'1px solid #bae6fd' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <User size={11} className="text-blue-600 flex-shrink-0" />
                <span className="text-[10px] font-bold text-blue-700 leading-tight">עוסק עצמאי</span>
              </div>
              <div className="text-sm font-bold text-gray-900 leading-tight">{worker?.Name ?? '—'}</div>
              <div className="text-xs text-gray-500">{worker?.Phone ?? '—'}</div>
              <div className="text-[10px] font-medium mt-auto pt-1" style={{ color:'#d97706' }}>
                ⚠️ הוסף מס׳ עוסק
              </div>
            </div>

            <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background:'#f0fdf4', border:'1px solid #86efac' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Building2 size={11} className="text-green-600 flex-shrink-0" />
                <span className="text-[10px] font-bold text-green-700 leading-tight">מסעדה (לקוח)</span>
              </div>
              <div className="text-sm font-bold text-gray-900 leading-tight">{shift.RestaurantName ?? '—'}</div>
              <div className="text-xs text-gray-500">{shift.RestaurantCity ?? '—'}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1">פירוט שירות</div>
            {[
              { l:'תיאור', v:'שירותי עבודה במטבח – משמרת' },
              { l:'תאריך', v: dateStr },
              { l:'שעות',  v:`${hours} ש׳` },
              { l:'תעריף', v:`₪${shift.HourlyRate}/ש׳` },
            ].map(r => (
              <div key={r.l} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-400">{r.l}</span>
                <span className="font-semibold text-gray-900">{r.v}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 pb-1">
              <span className="font-bold text-gray-900">סה"כ לתשלום</span>
              <span className="font-black text-gray-900 text-xl">₪{gross}</span>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center bg-gray-50 rounded-xl p-2.5">
            📌 זוהי תבנית. הוסף מס׳ עוסק ומע"מ לפני שליחה למסעדה.
          </div>
        </div>

        {/* כפתור – דביק */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <button onClick={handlePrint}
            className="w-full text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 text-sm"
            style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow:'0 4px 16px rgba(99,102,241,0.3)' }}>
            <Printer size={16} /> הדפס חשבונית למסעדה
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   ראשי – ארנק עובד
═══════════════════════════════════════════════════════════ */
export const WorkerWallet: React.FC = () => {
  const { userProfile } = useApp();
  const [history, setHistory]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [summaryShift, setSummary]  = useState<any>(null);
  const [invoiceShift, setInvoice]  = useState<any>(null);
  const [compShift, setCompShift]   = useState<any>(null);
  const [activeTab, setActiveTab]   = useState<'overview'|'docs'>('overview');

  const totalEarnings   = userProfile?.TotalEarnings   ?? 0;
  const completedShifts = userProfile?.CompletedShifts ?? 0;
  const hourlyRate      = userProfile?.HourlyRate      ?? 0;

  // רמה ועמלה של העובד
  const workerLevel = levelFromShifts(completedShifts).key;
  const workerRate  = workerCommissionRate(workerLevel);
  const netMult     = netMultiplier(workerLevel);

  useEffect(() => {
    if (!userProfile?.Id) { setLoading(false); return; }
    api.getWorkerHistory(userProfile.Id)
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [userProfile?.Id]);

  const completed = history.filter(j => j.Status === 'completed');
  // משמרות שבוטלו עם פיצוי/קנס (₪) — לאסמכתאות
  const compensations = history.filter(j =>
    j.Status === 'cancelled' && Number(j.CancellationFee ?? 0) > 0);

  /* הכנסות חודשיות */
  const monthlyMap: Record<string, number> = {};
  completed.forEach(j => {
    const key = MONTH_NAMES[new Date(j.StartTime).getMonth()];
    const h = (new Date(j.EndTime).getTime() - new Date(j.StartTime).getTime()) / 3600000;
    monthlyMap[key] = (monthlyMap[key] ?? 0) + h * j.HourlyRate * netMult;
  });
  const monthlyData = Object.entries(monthlyMap).map(([m, v]) => ({ month: m, earn: Math.round(v) }));

  const avgPerShift = completedShifts > 0 ? (totalEarnings / completedShifts).toFixed(0) : '0';

  return (
    <div className="screen-enter space-y-4 pb-4">

      {/* Header card */}
      <div className="rounded-3xl p-5 text-white" style={{ background:'linear-gradient(135deg,#0d1420,#1a2744)' }}>
        <div className="text-gray-400 text-sm mb-1">סה״כ הכנסות (נטו)</div>
        <div className="text-4xl font-black mb-3" style={{ color:'#e8a020' }}>
          ₪{totalEarnings.toLocaleString()}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { l:'משמרות',     v: completedShifts,   c:'text-white' },
            { l:'ממוצע/משמרת',v:`₪${avgPerShift}`,  c:'text-amber-400' },
            { l:'תעריף/שעה',  v:`₪${hourlyRate}`,   c:'text-blue-300' },
          ].map(s => (
            <div key={s.l} className="bg-white/10 rounded-xl p-2.5 text-center">
              <div className={`font-black text-sm ${s.c}`}>{s.v}</div>
              <div className="text-gray-500 text-[10px] mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {[
          { id:'overview', l:'סקירה 📊' },
          { id:'docs',     l:'מסמכים 📄' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === t.id ? 'bg-white text-gray-900 shadow' : 'text-gray-400'
            }`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ─── Tab: סקירה ─── */}
      {activeTab === 'overview' && (
        <>
          {monthlyData.length > 0 && (
            <div className="bg-white rounded-2xl p-4 card-shadow">
              <h3 className="font-bold text-gray-800 mb-4">הכנסות חודשיות</h3>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={monthlyData} margin={{ top:5, right:-20, left:5, bottom:0 }}>
                  <defs>
                    <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" reversed tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
                  <YAxis orientation="right" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v: any) => [`₪${v}`, 'הכנסות']}/>
                  <Area type="monotone" dataKey="earn" stroke="#10b981" strokeWidth={2.5} fill="url(#eg)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {completed.length > 0 && (
            <div className="bg-white rounded-2xl p-4 card-shadow">
              <h3 className="font-bold text-gray-800 mb-3">📈 סטטיסטיקות</h3>
              <div className="space-y-3">
                {[
                  { l:'שעות עבודה סה״כ',
                    v:`${completed.reduce((s,j) => s + (new Date(j.EndTime).getTime()-new Date(j.StartTime).getTime())/3600000, 0).toFixed(1)} ש׳` },
                  { l:'תעריף שעתי ממוצע',
                    v:`₪${(completed.reduce((s,j) => s+j.HourlyRate, 0)/completed.length).toFixed(0)}/ש׳` },
                  { l:'מסעדות שונות',
                    v:`${new Set(completed.map(j => j.RestaurantId)).size}` },
                ].map(s => (
                  <div key={s.l} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500 text-sm">{s.l}</span>
                    <span className="font-bold text-gray-900 text-sm">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length === 0 && !loading && (
            <div className="text-center py-10 bg-white rounded-2xl card-shadow">
              <div className="text-4xl mb-3">💰</div>
              <p className="font-bold text-gray-700">אין הכנסות עדיין</p>
              <p className="text-gray-400 text-sm mt-1">השלם משמרות כדי לצבור הכנסות</p>
            </div>
          )}
        </>
      )}

      {/* ─── Tab: מסמכים ─── */}
      {activeTab === 'docs' && (
        <div className="space-y-3">
          {/* הסבר */}
          <div className="bg-white rounded-2xl p-4 card-shadow text-xs text-gray-500 leading-relaxed space-y-1.5">
            <div className="font-bold text-gray-800 text-sm mb-2">📄 המסמכים שלך</div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold flex-shrink-0">סיכום</span>
              <span>– פירוט תשלום מהפלטפורמה (לא רשמי)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold flex-shrink-0">חשבונית</span>
              <span>– תבנית חשבונית שירות לשליחה למסעדה (עוסק עצמאי)</span>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"/>
            </div>
          )}

          {!loading && completed.length === 0 && compensations.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl card-shadow">
              <div className="text-4xl mb-3">📄</div>
              <p className="font-bold text-gray-700">אין מסמכים עדיין</p>
              <p className="text-gray-400 text-sm mt-1">מסמכים יופיעו לאחר השלמת משמרות</p>
            </div>
          )}

          {/* אסמכתאות פיצוי/קנס ביטול */}
          {compensations.map(shift => {
            const fee = Number(shift.CancellationFee ?? 0);
            const received = shift.CancelledBy === 'restaurant'; // המסעדה ביטלה → העובד קיבל
            const dateStr = new Date(shift.CancelledAt || shift.StartTime)
              .toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'2-digit' });
            return (
              <div key={`comp-${shift.Id}`} className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{shift.RestaurantName}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{dateStr} · משמרת בוטלה</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black ${received ? 'text-green-600' : 'text-red-500'}`}>
                      {received ? '+' : '-'}₪{fee.toFixed(0)}
                    </div>
                    <div className="text-gray-400 text-xs">{received ? 'פיצוי' : 'קנס'}</div>
                  </div>
                </div>
                <button onClick={() => setCompShift(shift)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                  style={{ background:'rgba(5,150,105,0.08)', color:'#059669', border:'1px solid rgba(5,150,105,0.2)' }}>
                  <FileText size={12} /> {received ? 'אסמכתת פיצוי' : 'אסמכתת קנס'}
                </button>
              </div>
            );
          })}

          {completed.map(shift => {
            const start = new Date(shift.StartTime);
            const end   = new Date(shift.EndTime);
            const h     = ((end.getTime()-start.getTime())/3600000).toFixed(1);
            const gross = (parseFloat(h)*shift.HourlyRate).toFixed(0);
            const net   = (parseFloat(h)*shift.HourlyRate*netMult).toFixed(0);

            return (
              <div key={shift.Id} className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{shift.RestaurantName}</div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {start.toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit',year:'2-digit'})} · {h} ש׳
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-green-600">₪{net}</div>
                    <div className="text-gray-400 text-xs">נטו</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full"
                    style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                    {ROLE_LABELS[shift.Role] ?? shift.Role}
                  </span>
                  <span className="text-xs text-gray-400">₪{shift.HourlyRate}/ש׳</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">ברוטו ₪{gross}</span>
                </div>

                {/* שני כפתורי מסמך */}
                <div className="flex gap-2">
                  <button onClick={() => setSummary(shift)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                    style={{ background:'rgba(232,160,32,0.1)', color:'#c8840a', border:'1px solid rgba(232,160,32,0.25)' }}>
                    <FileText size={12} /> סיכום משמרת
                  </button>
                  <button onClick={() => setInvoice(shift)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                    style={{ background:'rgba(99,102,241,0.1)', color:'#4f46e5', border:'1px solid rgba(99,102,241,0.25)' }}>
                    <FileText size={12} /> חשבונית שירות
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {summaryShift && <ShiftSummaryDoc shift={summaryShift} rate={workerRate} onClose={() => setSummary(null)} />}
      {invoiceShift && <WorkerInvoiceDoc shift={invoiceShift} worker={userProfile} onClose={() => setInvoice(null)} />}
      {compShift && (
        <CompensationDoc
          job={compShift}
          viewer="worker"
          workerName={userProfile?.Name ?? 'העובד'}
          restaurantName={compShift.RestaurantName ?? 'המסעדה'}
          onClose={() => setCompShift(null)}
        />
      )}
    </div>
  );
};
