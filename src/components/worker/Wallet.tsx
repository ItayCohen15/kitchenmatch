import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, X, Printer, Building2, User, Target, Flame, Scale, Pencil, Wallet, ArrowDownToLine, TrendingUp, Clock, Coins, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { haptic } from '../../utils/haptics';
import { ROLE_LABELS } from '../../data/mockData';
import { printHTML } from '../../utils/print';
import { esc } from '../../utils/escapeHtml';
import { CompensationDoc } from '../common/CompensationDoc';
import { PayoutAccountCard, type PayoutAccount } from '../common/PayoutAccountCard';
import { levelFromShifts, effectiveNetMultiplier, effectiveWorkerRate, nextLevelProgress, getLevel } from '../../utils/levels';
import { blendedMarket } from '../../utils/marketRates';
import { roleDot } from '../../utils/colors';

const MONTH_NAMES = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
const DAY_NAMES_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

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
        .logo{font-size:22px;font-weight:900;margin-bottom:2px}.gold{color:#4244b8}
        .doc-title{font-size:17px;font-weight:700;margin:2px 0}
        .doc-meta{font-size:11px;color:#9ca3af;margin-bottom:10px}
        .warning{background:#fff8e1;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;
                 font-size:12px;color:#92400e;margin:10px 0;line-height:1.5}
        h2{font-size:13px;font-weight:700;color:#374151;border-bottom:2px solid #5354d3;
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
      <div class="logo">Staff<span class="gold">ly</span></div>
      <div class="doc-title">סיכום משמרת</div>
      <div class="doc-meta">${docId} · ${dateStr}</div>

      <div class="warning">
        ⚠️ <strong>מסמך זה אינו מסמך חשבונאי רשמי ואינו חשבונית.</strong><br/>
        לצורך דיווח למס הכנסה, עליך להוציא חשבונית עצמאית ישירות למסעדה.
      </div>

      <h2>פרטי משמרת</h2>
      <div class="row"><span>מסעדה</span><strong>${esc(shift.RestaurantName)}</strong></div>
      <div class="row"><span>עיר</span><span>${esc(shift.RestaurantCity)}</span></div>
      <div class="row"><span>תפקיד</span><span>${esc(ROLE_LABELS[shift.Role] ?? shift.Role)}</span></div>
      <div class="row"><span>תאריך</span><span>${esc(dateStr)}</span></div>
      <div class="row"><span>שעות עבודה</span><span>${esc(hours)} שעות</span></div>
      <div class="row"><span>תעריף שעתי</span><span>₪${esc(shift.HourlyRate)}</span></div>

      <h2>פירוט תשלום</h2>
      <div class="row"><span>סכום משמרת (ברוטו)</span><span>₪${gross}</span></div>
      <div class="row commission-row">
        <span>עמלת Staffly לעובד (${ratePct}%)</span><span>-₪${commission}</span>
      </div>
      <div class="row net-row"><span>נטו לקבלה</span><span>₪${net}</span></div>

      <div class="footer">
        Staffly — פלטפורמת שיבוץ כוח אדם למטבחים<br/>
        getstaffly.vercel.app<br/><br/>
        Staffly אינה המעסיקה. העובד הינו עוסק עצמאי.<br/>
        יש להוציא חשבונית עצמאית למסעדה על מלוא סכום המשמרת (₪${gross}).
      </div>
      </body></html>`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      {/* מיכל ממרכז: מותח flex בין ה-notch ל-nav וממרכז את החלון */}
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
              <div className="font-bold text-sm">Staff<span style={{ color:'#5354d3' }}>ly</span> · סיכום משמרת</div>
              <div className="text-gray-400 text-xs mt-0.5">{docId}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-xs">נטו לקבלה</div>
            <div className="text-2xl font-bold" style={{ color:'#5354d3' }}>₪{net}</div>
          </div>
        </div>

        {/* תוכן גלילתי */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling:'touch' as any }}>
          <div className="mx-4 mt-3 p-3 rounded-xl text-xs leading-relaxed"
            style={{ background:'#fdf0cf', border:'1px solid #f4b62c', color:'#8a6300' }}>
            <strong>מסמך זה אינו חשבונית רשמית.</strong> לדיווח מס, הוצא חשבונית עצמאית למסעדה על סכום ₪{gross}.
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
              <span className="text-gray-400">עמלת Staffly ({ratePct}%)</span>
              <span className="font-semibold text-red-500">-₪{commission}</span>
            </div>
            <div className="flex justify-between pt-3 pb-1">
              <span className="font-bold text-gray-900">נטו לקבלה</span>
              <span className="font-bold text-green-600 text-xl">₪{net}</span>
            </div>
          </div>
        </div>

        {/* כפתור – דביק */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <button onClick={handlePrint}
            className="w-full rounded-2xl py-3 font-bold flex items-center justify-center gap-2 text-sm"
            style={{ background:'#5354d3', color:'#ffffff' }}>
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
             border:2px solid #5354d3;border-radius:12px}
        .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
        .logo{font-size:20px;font-weight:900}.gold{color:#4244b8}
        .logo-sub{font-size:10px;color:#9ca3af}
        .inv-title{font-size:15px;font-weight:700;color:#111;text-align:left}
        .inv-num{font-size:11px;color:#9ca3af;text-align:left}
        .section{margin:12px 0;padding:12px 14px;background:#f9fafb;border-radius:8px;border-right:3px solid #5354d3}
        .sec-label{font-weight:700;font-size:12px;color:#374151;margin-bottom:7px;text-transform:uppercase;letter-spacing:0.5px}
        .field{font-size:13px;margin:3px 0;color:#374151}
        .field b{font-weight:700}
        .field-note{font-size:11px;color:#9ca3af;margin-top:3px}
        .desc-section{margin:12px 0;padding:12px 14px;background:#f0f9ff;border-radius:8px;border-right:3px solid #3b82f6}
        .total-box{background:#1b1e38;color:white;
                   padding:16px;border-radius:10px;margin:14px 0;text-align:center}
        .total-label{font-size:12px;color:#9ca3af;margin-bottom:4px}
        .total-amount{font-size:30px;font-weight:900;color:#5354d3}
        .total-note{font-size:10px;color:#6b7280;margin-top:5px}
        .platform-note{font-size:11px;color:#374151;background:#f0fdf4;border:1px solid #86efac;
                       border-radius:8px;padding:10px;margin:10px 0;line-height:1.6}
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
          <div class="inv-title">חשבונית שירות</div>
          <div class="inv-num">מס׳ ${invoiceNum}</div>
          <div class="inv-num">${dateStr}</div>
        </div>
      </div>

      <div class="section">
        <div class="sec-label">מספק שירות – עוסק עצמאי</div>
        <div class="field"><b>שם:</b> ${esc(worker?.Name ?? '___________')}</div>
        <div class="field"><b>טלפון:</b> ${esc(worker?.Phone ?? '___________')}</div>
        <div class="field"><b>מס׳ עוסק פטור / מורשה:</b> ___________________________</div>
        <div class="field-note">* מלא מס׳ עוסק ידנית לפני שליחה</div>
      </div>

      <div class="section" style="border-right-color:#10b981">
        <div class="sec-label">ללקוח – מסעדה</div>
        <div class="field"><b>שם:</b> ${esc(shift.RestaurantName ?? '___________')}</div>
        <div class="field"><b>עיר:</b> ${esc(shift.RestaurantCity ?? '___________')}</div>
      </div>

      <div class="desc-section">
        <div class="sec-label">פירוט שירות</div>
        <div class="field">שירותי עבודה במטבח – משמרת חד-פעמית</div>
        <div class="field"><b>תאריך משמרת:</b> ${esc(dateStr)}</div>
        <div class="field"><b>תפקיד:</b> ${esc(ROLE_LABELS[shift.Role] ?? shift.Role)}</div>
        <div class="field"><b>שעות עבודה:</b> ${esc(hours)} שעות</div>
        <div class="field"><b>תעריף שעתי:</b> ₪${esc(shift.HourlyRate)}</div>
      </div>

      <div class="total-box">
        <div class="total-label">סה"כ לתשלום</div>
        <div class="total-amount">₪${gross}</div>
        <div class="total-note">* לא כולל מע"מ (עוסק פטור) / כולל מע"מ – פרט בנפרד (עוסק מורשה)</div>
      </div>

      <div class="platform-note">
        שולם באמצעות פלטפורמת Staffly<br/>
        <b>Staffly אינה צד לחוזה העבודה ואינה המעסיקה.</b><br/>
        הפלטפורמה משמשת כמתווך בין העוסק העצמאי לבין המסעדה בלבד.
      </div>

      <div class="footer">
        Staffly Platform | getstaffly.vercel.app<br/>
        חשבונית זו הופקה בסיוע פלטפורמת Staffly.<br/>
        האחריות על הגשת החשבונית לרשויות המס חלה על העוסק בלבד.
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
              <div className="font-bold text-sm">חשבונית שירות</div>
              <div className="text-gray-400 text-xs mt-0.5">מס׳ {invoiceNum}</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color:'#5354d3' }}>סכום מלא למסעדה</div>
            <div className="text-2xl font-bold text-white">₪{gross}</div>
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
                יש להוסיף מס׳ עוסק
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
              <span className="font-bold text-gray-900 text-xl">₪{gross}</span>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center bg-gray-50 rounded-xl p-2.5">
            זוהי תבנית. יש להוסיף מס׳ עוסק ומע"מ לפני שליחה למסעדה.
          </div>
        </div>

        {/* כפתור – דביק */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <button onClick={handlePrint}
            className="w-full text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 text-sm"
            style={{ background:'#3b74d1' }}>
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
  const { userProfile, refreshProfile } = useApp();
  const [history, setHistory]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [summaryShift, setSummary]  = useState<any>(null);
  const [invoiceShift, setInvoice]  = useState<any>(null);
  const [compShift, setCompShift]   = useState<any>(null);
  const [activeTab, setActiveTab]   = useState<'overview'|'docs'>('overview');

  // ── ארנק תשלומים (PayMe): דליי ממתין/זמין/שולם + משיכה ──
  const [wallet, setWallet]         = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // חשבון קבלת התשלומים אצל ספק הסליקה (נטען ע"י PayoutAccountCard)
  const [payoutAcc, setPayoutAcc]   = useState<PayoutAccount | null>(null);

  useEffect(() => {
    if (!userProfile?.Id) return;
    api.getWallet(userProfile.Id).then(setWallet).catch(() => {});
  }, [userProfile?.Id]);

  const minPayout = Number(wallet?.minPayout ?? 50);
  // חוסמים משיכה כשאין חשבון מאושר — אחרת אין לאן להעביר את הכסף.
  // (בסימולציה required=false, כך שהזרימה הקיימת ממשיכה לעבוד)
  const accountBlocked = !!payoutAcc && payoutAcc.required && payoutAcc.status !== 'approved';
  const canWithdraw = !!wallet && Number(wallet.available) >= minPayout && !accountBlocked;

  const handleWithdraw = async () => {
    if (!userProfile?.Id || withdrawing || !canWithdraw) return;
    haptic('light');
    setWithdrawing(true); setWithdrawMsg(null);
    try {
      const r = await api.requestWithdraw(userProfile.Id);
      if (r?.wallet) setWallet({ ...wallet, ...r.wallet });
      setWithdrawMsg({ ok: true, text: `הועברו ₪${Math.round(r?.payout?.amount || 0).toLocaleString()} לחשבון שלך` });
      haptic('success');
      refreshProfile();
    } catch (e: any) {
      setWithdrawMsg({ ok: false, text: e.message || 'המשיכה נכשלה' });
      haptic('error');
    } finally {
      setWithdrawing(false);
    }
  };

  const totalEarnings   = userProfile?.TotalEarnings   ?? 0;
  const completedShifts = userProfile?.CompletedShifts ?? 0;
  const rating          = userProfile?.Rating          ?? 0;

  // רמת העובד (העמלה מחושבת פר-משמרת — לפי רמה, ובחירום עמלה מופחתת)
  const workerLevel = levelFromShifts(completedShifts).key;

  // יעד הכנסה חודשי (נשמר מקומית) + ממוצעי שוק להשוואה
  const [goal, setGoal] = useState<number>(() => { try { return Number(localStorage.getItem('km_income_goal')) || 0; } catch { return 0; } });
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [benchmark, setBenchmark] = useState<any[]>([]);
  useEffect(() => { api.getRateBenchmark().then((d: any) => setBenchmark(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  const saveGoal = () => {
    const g = Number(goalInput) || 0;
    setGoal(g); setEditGoal(false);
    try { localStorage.setItem('km_income_goal', String(g)); } catch {}
  };

  useEffect(() => {
    if (!userProfile?.Id) { setLoading(false); return; }
    api.getWorkerHistory(userProfile.Id)
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [userProfile?.Id]);

  // רענן סטטיסטיקות (הכנסות/רמה) מהשרת בכניסה למסך
  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  const completed = history.filter(j => j.Status === 'completed');
  // משמרות שבוטלו עם פיצוי/קנס (₪) — לאסמכתאות
  const compensations = history.filter(j =>
    j.Status === 'cancelled' && Number(j.CancellationFee ?? 0) > 0);

  /* הכנסות חודשיות */
  const monthlyMap: Record<string, number> = {};
  completed.forEach(j => {
    const key = MONTH_NAMES[new Date(j.StartTime).getMonth()];
    const h = (new Date(j.EndTime).getTime() - new Date(j.StartTime).getTime()) / 3600000;
    monthlyMap[key] = (monthlyMap[key] ?? 0) + h * j.HourlyRate * effectiveNetMultiplier(workerLevel, j.IsEmergency);
  });
  const monthlyData = Object.entries(monthlyMap).map(([m, v]) => ({ month: m, earn: Math.round(v) }));

  const avgPerShift = completedShifts > 0 ? (totalEarnings / completedShifts).toFixed(0) : '0';

  // ── תובנות פיננסיות ──
  const hoursOf = (j: any) => (new Date(j.EndTime).getTime() - new Date(j.StartTime).getTime()) / 3600000;
  const grossOf = (j: any) => hoursOf(j) * j.HourlyRate;
  const netOf   = (j: any) => grossOf(j) * effectiveNetMultiplier(workerLevel, j.IsEmergency);

  // החודש מול חודש שעבר + צפי
  const now = new Date();
  const inMonth = (j: any, m: number, y: number) => { const d = new Date(j.StartTime); return d.getMonth() === m && d.getFullYear() === y; };
  const prevM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const thisMonthJobs = completed.filter(j => inMonth(j, now.getMonth(), now.getFullYear()));
  const thisNet = thisMonthJobs.reduce((s, j) => s + netOf(j), 0);
  const lastNet = completed.filter(j => inMonth(j, prevM, prevY)).reduce((s, j) => s + netOf(j), 0);
  const deltaPct = lastNet > 0 ? Math.round((thisNet - lastNet) / lastNet * 100) : null;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projection = now.getDate() >= 3 && thisNet > 0 ? (thisNet / now.getDate()) * daysInMonth : null;

  // באיזה ימים אתה מרוויח הכי הרבה
  const dayEarn: Record<number, number> = {};
  completed.forEach(j => { const d = new Date(j.StartTime).getDay(); dayEarn[d] = (dayEarn[d] || 0) + netOf(j); });
  const dayRows = Object.entries(dayEarn).map(([d, v]) => ({ day: DAY_NAMES_HE[Number(d)], earn: v }))
    .sort((a, b) => b.earn - a.earn);
  const maxDayEarn = dayRows[0]?.earn || 1;

  // המסעדות המשתלמות ביותר
  const restMap: Record<string, { net: number; hours: number; gross: number; count: number }> = {};
  completed.forEach(j => {
    const n = j.RestaurantName || 'מסעדה';
    if (!restMap[n]) restMap[n] = { net: 0, hours: 0, gross: 0, count: 0 };
    restMap[n].net += netOf(j); restMap[n].hours += hoursOf(j); restMap[n].gross += grossOf(j); restMap[n].count += 1;
  });
  const topRests = Object.entries(restMap).map(([name, v]) => ({ name, ...v, avgRate: v.hours > 0 ? v.gross / v.hours : 0 }))
    .sort((a, b) => b.net - a.net).slice(0, 3);

  // בונוס חירום: עמלה 4% במקום עמלת הרמה
  const regularRate = effectiveWorkerRate(workerLevel, false);
  const emergencySaved = completed.filter(j => j.IsEmergency)
    .reduce((s, j) => s + grossOf(j) * Math.max(regularRate - 0.04, 0), 0);

  // סה"כ עמלות ששולמו + הדרך לרמה הבאה (עמלה נמוכה יותר)
  const commissionPaid = completed.reduce((s, j) => s + (grossOf(j) - netOf(j)), 0);
  const lvlProg = nextLevelProgress(completedShifts);
  const nextCommissionDrop = lvlProg.next && lvlProg.next.commission < getLevel(workerLevel).commission ? lvlProg.next : null;

  // התעריף שלי מול השוק (אומדן שוק אמיתי, או ממוצע הפלטפורמה כשיש מספיק נתונים)
  const myRole = userProfile?.Role;
  const platBench = benchmark.find((b: any) => b.Role === myRole);
  const blended = myRole ? blendedMarket(myRole, Number(platBench?.AvgRate) || 0, Number(platBench?.Cnt) || 0) : null;
  const marketRate = blended?.avg || 0;
  const marketRange = blended?.range;
  const myAvgRate = completed.length > 0 ? completed.reduce((s, j) => s + Number(j.HourlyRate || 0), 0) / completed.length : 0;
  const rateDiffPct = marketRate > 0 && myAvgRate > 0 ? Math.round((myAvgRate - marketRate) / marketRate * 100) : null;

  // גרף עמודות משובץ בכותרת — נטו לכל אחת מ-20 המשמרות האחרונות
  const recentBars = completed.slice(-20).map(j => netOf(j));
  const maxBar = Math.max(...recentBars, 1);
  const totalHoursAll = completed.reduce((s, j) => s + hoursOf(j), 0);

  return (
    <div className="screen-enter space-y-4 pb-4">

      {/* Header card — הכנסות + גרף משובץ */}
      <div className="relative rounded-3xl overflow-hidden text-white" style={{ background:'linear-gradient(135deg,#1b2340,#121828)' }}>
        <div className="absolute pointer-events-none" style={{ width: 220, height: 220, borderRadius: '50%', top: -90, left: -40, background: 'radial-gradient(circle, rgba(83,84,211,.25), transparent 68%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '50%', bottom: -100, right: -60, background: 'radial-gradient(circle, rgba(244,182,44,.14), transparent 68%)' }} />
        <div className="relative p-5">
          <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-1" style={{ color:'#b9c0d8' }}>
            <Wallet size={14} style={{ color:'#f4b62c' }} /> סה״כ הכנסות (נטו)
          </div>
          <div className="font-black" style={{ fontSize: 40, lineHeight: 1.02, color:'#ffffff' }}>
            ₪{totalEarnings.toLocaleString()}
          </div>
          {deltaPct !== null && (
            <div className="text-[12px] font-bold mt-2 inline-flex items-center gap-1" style={{ color: deltaPct >= 0 ? '#4ade80' : '#ff8b8b' }}>
              <TrendingUp size={13} /> {deltaPct >= 0 ? '+' : ''}{deltaPct}% בהשוואה לחודש שעבר
            </div>
          )}
          {recentBars.length > 1 && (
            <div className="flex items-end gap-[3px] mt-4" style={{ height: 60 }}>
              {recentBars.map((v, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(Math.round(v / maxBar * 100), 6)}%`, background: 'linear-gradient(180deg, #8b8cf0, #4f46c9)' }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 כרטיסי סטטיסטיקה פסטליים */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { icon:<Wallet size={18} />,      bg:'#eceefb', fg:'#5354d3', l:'תשלומים בהמתנה', v:`₪${Math.round(Number(wallet?.pending)||0).toLocaleString()}` },
          { icon:<ShieldCheck size={18} />, bg:'#e4f7ee', fg:'#1f9d6b', l:'סה״כ משמרות',    v:`${completedShifts}` },
          { icon:<Clock size={18} />,       bg:'#eceefb', fg:'#5354d3', l:'שעות עבודה',     v:`${totalHoursAll.toFixed(1)}` },
          { icon:<Coins size={18} />,       bg:'#fdf0cf', fg:'#b5701f', l:'שכר ממוצע/שעה',  v:`₪${Math.round(myAvgRate)}` },
        ].map(s => (
          <div key={s.l} className="p-3" style={{ background:'#fff', border:'1px solid #eceef4', borderRadius:16, boxShadow:'0 1px 2px rgba(20,26,46,.04), 0 6px 18px -10px rgba(20,26,46,.10)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background:s.bg, color:s.fg }}>{s.icon}</div>
            <div className="text-[10.5px] font-semibold leading-tight" style={{ color:'#7a8199' }}>{s.l}</div>
            <div className="font-black text-[15px] mt-0.5" style={{ color:'#141a2e' }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl p-1" style={{ background:'#f4f5f9' }}>
        {[
          { id:'overview', l:'סקירה' },
          { id:'docs',     l:'מסמכים' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className="flex-1 py-2 rounded-xl text-sm font-black transition-all"
            style={activeTab === t.id
              ? { background:'#fff', color:'#141a2e', boxShadow:'0 1px 2px rgba(20,26,46,.06), 0 4px 12px -6px rgba(20,26,46,.15)' }
              : { color:'#7a8199' }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ─── Tab: סקירה ─── */}
      {activeTab === 'overview' && (
        <>
          {/* 🏦 חשבון קבלת תשלומים — לאן מגיע הכסף (onboarding אצל הספק) */}
          {userProfile?.Id && (
            <PayoutAccountCard workerId={userProfile.Id} onAccountChange={setPayoutAcc} />
          )}

          {/* 💳 ארנק התשלומים שלי (PayMe · escrow) */}
          {wallet && (
            <div className="bg-white p-4" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={16} style={{ color:'#5354d3' }} />
                <span className="font-black text-[15px]" style={{ color:'#141a2e' }}>הארנק שלי</span>
                <span className="text-[10px] mr-auto" style={{ color:'#7a8199' }}>תשלום מאובטח · escrow</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl p-2.5 text-center" style={{ background:'#fdf0cf' }}>
                  <div className="font-black text-base" style={{ color:'#8a6300' }}>₪{Math.round(Number(wallet.pending)||0).toLocaleString()}</div>
                  <div className="text-[10px] mt-0.5" style={{ color:'#8a6300' }}>ממתין</div>
                </div>
                <div className="rounded-xl p-2.5 text-center" style={{ background:'#e4f7ee' }}>
                  <div className="font-black text-base" style={{ color:'#1f8f5f' }}>₪{Math.round(Number(wallet.available)||0).toLocaleString()}</div>
                  <div className="text-[10px] mt-0.5" style={{ color:'#1f8f5f' }}>זמין למשיכה</div>
                </div>
                <div className="rounded-xl p-2.5 text-center" style={{ background:'#f4f5f9' }}>
                  <div className="font-black text-base" style={{ color:'#2b3350' }}>₪{Math.round(Number(wallet.paid)||0).toLocaleString()}</div>
                  <div className="text-[10px] mt-0.5" style={{ color:'#7a8199' }}>שולם</div>
                </div>
              </div>
              <button onClick={handleWithdraw} disabled={withdrawing || !canWithdraw}
                className="w-full rounded-2xl py-3 font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform"
                style={{ background:'#f4b62c', color:'#3a2c00', boxShadow:'0 8px 20px -6px rgba(244,182,44,.5)' }}>
                {withdrawing
                  ? <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor:'rgba(58,44,0,.3)', borderTopColor:'#3a2c00' }}/> מעבד...</>
                  : <><ArrowDownToLine size={16}/> משוך ₪{Math.round(Number(wallet.available)||0).toLocaleString()}</>}
              </button>
              {!canWithdraw && (
                <p className="text-[11px] text-center mt-2" style={{ color:'#7a8199' }}>
                  {accountBlocked
                    ? <span style={{ color:'#8a6300' }}>כדי למשוך, יש להשלים תחילה את הגדרת חשבון קבלת התשלומים למעלה</span>
                    : <>מינימום למשיכה: ₪{minPayout} · היתרה תגדל עם סיום משמרות</>}
                </p>
              )}
              {wallet.autoPayout && (
                <p className="text-[11px] text-center mt-1.5" style={{ color:'#1f8f5f' }}>
                  תשלום אוטומטי שבועי פעיל — הכסף יועבר גם בלי שתלחץ
                </p>
              )}
              {withdrawMsg && (
                <div className="mt-2 text-xs text-center rounded-xl px-3 py-2" style={withdrawMsg.ok ? { background:'#e4f7ee', color:'#1f8f5f' } : { background:'#fde3e3', color:'#cf3030' }}>
                  {withdrawMsg.text}
                </div>
              )}
            </div>
          )}

          {/* החודש שלי + צפי */}
          {completed.length > 0 && (
            <div className="bg-white p-4" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold" style={{ color:'#7a8199' }}>הכנסות {MONTH_NAMES[now.getMonth()]} (נטו)</span>
                {deltaPct !== null && (
                  <span className="text-[10.5px] font-extrabold" style={{ padding:'3px 9px', borderRadius:6, ...(deltaPct >= 0 ? { background:'#e4f7ee', color:'#1f8f5f' } : { background:'#fde3e3', color:'#cf3030' }) }}>
                    {deltaPct >= 0 ? '↑' : '↓'}{Math.abs(deltaPct)}% מחודש שעבר
                  </span>
                )}
              </div>
              <div className="font-black text-3xl" style={{ color:'#141a2e' }}>₪{Math.round(thisNet).toLocaleString()}</div>
              {projection !== null && (
                <div className="text-xs mt-1.5" style={{ color:'#7a8199' }}>
                  בקצב הנוכחי תסיים את החודש עם כ־<b style={{ color:'#1f8f5f' }}>₪{Math.round(projection).toLocaleString()}</b>
                </div>
              )}
            </div>
          )}

          {/* יעד חודשי */}
          <div className="relative rounded-3xl overflow-hidden text-white" style={{ background: '#141a2e' }}>
            <div className="absolute pointer-events-none" style={{ width: 200, height: 200, borderRadius: '50%', bottom: -110, left: -60, background: 'radial-gradient(circle, rgba(244,182,44,.18), transparent 66%)' }} />
            <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Target size={16} style={{ color:'#f4b62c' }} />
                <span className="font-black text-[15px]">היעד החודשי שלי</span>
              </div>
              {goal > 0 && !editGoal && (
                <button onClick={() => { setGoalInput(String(goal)); setEditGoal(true); }} style={{ color:'#8891ac' }}><Pencil size={13} /></button>
              )}
            </div>
            {editGoal || goal === 0 ? (
              <div className="flex gap-2">
                <input type="number" inputMode="numeric" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                  placeholder="לדוגמה: 5000"
                  className="flex-1 rounded-xl px-3 py-2.5 text-right text-sm outline-none text-gray-900 bg-white" />
                <button onClick={saveGoal} className="rounded-xl px-4 py-2.5 text-sm font-extrabold text-white"
                  style={{ background: '#5354d3' }}>
                  שמור
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="font-black text-2xl" style={{ color: '#f4b62c' }}>₪{Math.round(thisNet).toLocaleString()}</span>
                  <span className="text-xs" style={{ color:'#8891ac' }}>מתוך ₪{goal.toLocaleString()}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(Math.round(thisNet / goal * 100), 100)}%`, background: '#f4b62c' }} />
                </div>
                <div className="text-[11px] mt-1.5" style={{ color:'#8891ac' }}>
                  {thisNet >= goal
                    ? 'הגעת ליעד החודשי'
                    : `${Math.round(thisNet / goal * 100)}% מהיעד · חסרות ₪${Math.round(goal - thisNet).toLocaleString()}${projection && projection >= goal ? ' · בקצב הזה תגיע ליעד' : ''}`}
                </div>
              </>
            )}
            </div>
          </div>

          {monthlyData.length > 0 && (
            <div className="bg-white p-4" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <h3 className="font-black mb-4" style={{ fontSize:17, color:'#141a2e' }}>הכנסות חודשיות</h3>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={monthlyData} margin={{ top:5, right:-20, left:5, bottom:0 }}>
                  <defs>
                    <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1f9d6b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1f9d6b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" reversed tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
                  <YAxis orientation="right" tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip formatter={(v: any) => [`₪${v}`, 'הכנסות']}/>
                  <Area type="monotone" dataKey="earn" stroke="#1f9d6b" strokeWidth={2.5} fill="url(#eg)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ימי הכסף שלך */}
          {dayRows.length > 1 && (
            <div className="bg-white p-4" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <h3 className="font-black mb-3" style={{ fontSize:17, color:'#141a2e' }}>ימי הכסף שלך</h3>
              <div className="space-y-2">
                {dayRows.slice(0, 5).map((d, i) => (
                  <div key={d.day} className="flex items-center gap-2.5">
                    <span className="text-xs w-12 flex-shrink-0" style={{ color:'#7a8199' }}>{d.day}</span>
                    <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background:'#f4f5f9' }}>
                      <div className="h-full rounded-lg" style={{
                        width: `${Math.max(Math.round(d.earn / maxDayEarn * 100), 8)}%`,
                        background: i === 0 ? '#f4b62c' : '#e2e8f0',
                      }} />
                    </div>
                    <span className="text-xs font-black w-16 text-left flex-shrink-0" style={{ color: i === 0 ? '#8a6300' : '#7a8199' }}>₪{Math.round(d.earn).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] mt-2.5" style={{ color:'#7a8199' }}>{dayRows[0]?.day} הוא היום הרווחי שלך — כדאי לתעדף משמרות ביום הזה</p>
            </div>
          )}

          {/* המסעדות המשתלמות */}
          {topRests.length > 0 && (
            <div className="bg-white p-4" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <h3 className="font-black mb-3" style={{ fontSize:17, color:'#141a2e' }}>המסעדות המשתלמות לך</h3>
              <div className="space-y-2">
                {topRests.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor:'#eceef4' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                      style={{ background: i === 0 ? '#e8a020' : i === 1 ? '#94a3b8' : '#b45309' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm" style={{ color:'#141a2e' }}>{r.name}</div>
                      <div className="text-xs" style={{ color:'#7a8199' }}>{r.count} משמרות · ₪{Math.round(r.avgRate)}/ש' בממוצע</div>
                    </div>
                    <span className="font-black text-sm" style={{ color:'#1f8f5f' }}>₪{Math.round(r.net).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* חירום + עמלות */}
          {completed.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{ background: '#1f9d6b', boxShadow:'0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(31,157,107,.35)' }}>
                <Flame size={17} className="text-green-300 mb-2" />
                <div className="font-black text-white text-lg">₪{Math.round(emergencySaved).toLocaleString()}</div>
                <div className="text-green-200 text-[11px] mt-0.5">הרווחת נוסף ממשמרות חירום</div>
                <div className="text-green-300/60 text-[10px] mt-1">עמלה 4% בלבד בחירום</div>
              </div>
              <div className="bg-white p-4" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
                <Scale size={17} style={{ color:'#5354d3' }} className="mb-2" />
                <div className="font-black text-lg" style={{ color:'#141a2e' }}>₪{Math.round(commissionPaid).toLocaleString()}</div>
                <div className="text-[11px] mt-0.5" style={{ color:'#7a8199' }}>עמלות ששילמת סה"כ</div>
                {nextCommissionDrop && (
                  <div className="text-[10px] font-bold mt-1" style={{ color:'#8a6300' }}>
                    עוד {lvlProg.shiftsNeeded} משמרות לעמלה של {(nextCommissionDrop.commission * 100).toFixed(1)}% בלבד
                  </div>
                )}
              </div>
            </div>
          )}

          {/* התעריף שלך מול השוק */}
          {rateDiffPct !== null && (
            <div className="bg-white p-4" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Scale size={15} style={{ color:'#5354d3' }} />
                  <span className="font-black text-[15px]" style={{ color:'#141a2e' }}>התעריף שלך מול השוק</span>
                </div>
                <span className="text-[10.5px] font-extrabold" style={{ padding:'3px 9px', borderRadius:6, ...(rateDiffPct >= 0 ? { background:'#e4f7ee', color:'#1f8f5f' } : { background:'#fdf0cf', color:'#8a6300' }) }}>
                  {rateDiffPct >= 0 ? `${rateDiffPct}%+ מהממוצע` : `${Math.abs(rateDiffPct)}%- מהממוצע`}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2.5 text-sm">
                <span style={{ color:'#7a8199' }}>אתה מקבל בממוצע <b style={{ color:'#141a2e' }}>₪{Math.round(myAvgRate)}/ש'</b></span>
                <span className="text-xs" style={{ color:'#7a8199' }}>
                  שוק האקסטרות: ₪{Math.round(marketRate)}{marketRange ? ` (${marketRange})` : ''}
                  {blended?.noTips && <span style={{ color:'#8a6300' }}> · לא כולל טיפים</span>}
                </span>
              </div>
              {rateDiffPct < -5 && (
                <p className="text-[11px] mt-2 rounded-lg px-2.5 py-1.5" style={{ background:'#fdf0cf', color:'#8a6300' }}>
                  אתה מתחת לשוק — עם הדירוג שלך אפשר לכוון למשמרות עם שכר גבוה יותר
                </p>
              )}
            </div>
          )}

          {completed.length === 0 && !loading && (
            <div className="text-center py-10 bg-white" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <Wallet size={30} className="mx-auto mb-3" style={{ color:'#c2c7da' }} />
              <p className="font-black" style={{ color:'#2b3350' }}>אין הכנסות עדיין</p>
              <p className="text-sm mt-1" style={{ color:'#7a8199' }}>ההכנסות יופיעו כאן לאחר השלמת משמרות</p>
            </div>
          )}
        </>
      )}

      {/* ─── Tab: מסמכים ─── */}
      {activeTab === 'docs' && (
        <div className="space-y-3">
          {/* הסבר */}
          <div className="bg-white p-4 text-xs leading-relaxed space-y-1.5" style={{ color:'#7a8199', borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
            <div className="font-black text-[15px] mb-2" style={{ color:'#141a2e' }}>המסמכים שלך</div>
            <div className="flex items-start gap-2">
              <span className="font-extrabold flex-shrink-0" style={{ color:'#5354d3' }}>סיכום</span>
              <span>– פירוט תשלום מהפלטפורמה (לא רשמי)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-extrabold flex-shrink-0" style={{ color:'#3b74d1' }}>חשבונית</span>
              <span>– תבנית חשבונית שירות לשליחה למסעדה (עוסק עצמאי)</span>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="w-7 h-7 border-2 rounded-full animate-spin mx-auto" style={{ borderColor:'#5354d3', borderTopColor:'transparent' }}/>
            </div>
          )}

          {!loading && completed.length === 0 && compensations.length === 0 && (
            <div className="text-center py-10 bg-white" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <FileText size={30} className="mx-auto mb-3" style={{ color:'#c2c7da' }} />
              <p className="font-black" style={{ color:'#2b3350' }}>אין מסמכים עדיין</p>
              <p className="text-sm mt-1" style={{ color:'#7a8199' }}>המסמכים יופיעו כאן לאחר השלמת משמרות</p>
            </div>
          )}

          {/* אסמכתאות פיצוי/קנס ביטול */}
          {compensations.map(shift => {
            const fee = Number(shift.CancellationFee ?? 0);
            const received = shift.CancelledBy === 'restaurant'; // המסעדה ביטלה → העובד קיבל
            const dateStr = new Date(shift.CancelledAt || shift.StartTime)
              .toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'2-digit' });
            return (
              <div key={`comp-${shift.Id}`} className="bg-white p-4" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-black text-sm" style={{ color:'#141a2e' }}>{shift.RestaurantName}</div>
                    <div className="text-xs mt-0.5" style={{ color:'#7a8199' }}>{dateStr} · משמרת בוטלה</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black" style={{ color: received ? '#1f8f5f' : '#cf3030' }}>
                      {received ? '+' : '-'}₪{fee.toFixed(0)}
                    </div>
                    <div className="text-xs" style={{ color:'#7a8199' }}>{received ? 'פיצוי' : 'קנס'}</div>
                  </div>
                </div>
                <button onClick={() => setCompShift(shift)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-extrabold"
                  style={{ background:'#e4f7ee', color:'#1f8f5f', border:'1px solid rgba(31,143,95,0.2)' }}>
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
            const net   = (parseFloat(h)*shift.HourlyRate*effectiveNetMultiplier(workerLevel, shift.IsEmergency)).toFixed(0);

            return (
              <div key={shift.Id} className="bg-white p-4" style={{ borderRadius: 20, border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-black text-sm" style={{ color:'#141a2e' }}>{shift.RestaurantName}</div>
                    <div className="text-xs mt-0.5" style={{ color:'#7a8199' }}>
                      {start.toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit',year:'2-digit'})} · {h} ש׳
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black" style={{ color:'#1f8f5f' }}>₪{net}</div>
                    <div className="text-xs" style={{ color:'#7a8199' }}>נטו</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1"
                    style={{ background:'#f4f5f9', color:'#2b3350', borderRadius:6 }}>
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: roleDot(shift.Role) }} />
                    {ROLE_LABELS[shift.Role] ?? shift.Role}
                  </span>
                  <span className="text-xs font-extrabold" style={{ padding:'3px 9px', borderRadius:6, background:'#fdf0cf', color:'#8a6300' }}>₪{shift.HourlyRate}/ש׳</span>
                  <span className="text-xs" style={{ color:'#7a8199' }}>ברוטו ₪{gross}</span>
                </div>

                {/* שני כפתורי מסמך */}
                <div className="flex gap-2">
                  <button onClick={() => setSummary(shift)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-extrabold"
                    style={{ background:'#ece9fe', color:'#5b4bd0', border:'1px solid rgba(83,84,211,0.2)' }}>
                    <FileText size={12} /> סיכום משמרת
                  </button>
                  <button onClick={() => setInvoice(shift)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-extrabold"
                    style={{ background:'#e6effb', color:'#3b74d1', border:'1px solid rgba(59,116,209,0.2)' }}>
                    <FileText size={12} /> חשבונית שירות
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {summaryShift && <ShiftSummaryDoc shift={summaryShift} rate={effectiveWorkerRate(workerLevel, summaryShift.IsEmergency)} onClose={() => setSummary(null)} />}
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
