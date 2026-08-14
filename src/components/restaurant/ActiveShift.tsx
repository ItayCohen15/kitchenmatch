import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, CheckCircle2, AlertTriangle, PartyPopper, Flag, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { Chat } from '../common/Chat';
import { toast } from '../common/Toast';
import { restaurantRate } from '../../utils/levels';

export const ActiveShift: React.FC = () => {
  const { navToRestaurant, shiftStartTime, getSelectedJob, userProfile } = useApp();
  const job = getSelectedJob();
  const [elapsed, setElapsed] = useState(0);
  const [workerConfirmed, setWorkerConfirmed] = useState(false);
  const [restaurantConfirmed, setRestaurantConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [bothDone, setBothDone] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReport, setShowReport] = useState(false);
  // כשל בגבייה — עוצר את ה-poller מלהדליק שוב bothDone (אחרת לולאת toast אינסופית כל 5 שניות)
  const [payError, setPayError] = useState<string | null>(null);
  const payBlocked = useRef(false);
  // חותמת הצ'ק-אין מהשרת — מקור האמת לשעון (localStorage נדרס בכל כניסה מחדש)
  const [serverStart, setServerStart] = useState<Date | null>(null);
  // בסיס זמן יציב — מונע איפוס ה-interval בכל רינדור (השעון קופץ)
  const startTime = useMemo(
    () => serverStart || shiftStartTime || new Date(Date.now() - 42 * 60000),
    [serverStart, shiftStartTime]
  );
  const hourlyRate: number = job ? Number(job.HourlyRate ?? job.hourlyRate ?? 0) : 0;
  const workerName: string = job?.WorkerName || 'העובד';
  const workerInit = workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const jobId: number = job ? Number(job.Id ?? job.id ?? 0) : 0;

  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  // בדוק סטטוס אישורים כל 8 שניות
  useEffect(() => {
    if (!jobId) return;
    const check = async () => {
      try {
        const status = await api.getEndStatus(jobId);
        if (!status || status.error) return;
        setWorkerConfirmed(Boolean(status.WorkerConfirmedEnd));
        setRestaurantConfirmed(Boolean(status.RestaurantConfirmedEnd));
        if (status.ActualStart) {
          const d = new Date(status.ActualStart);
          if (!isNaN(d.getTime())) setServerStart(prev => (prev?.getTime() === d.getTime() ? prev : d));
        }
        // אם הגבייה כבר נכשלה — אל תדליק שוב bothDone. השרת עדיין מדווח
        // ששני הצדדים אישרו, כך שבלי החסם הזה כל 5 שניות מנסים לחייב מחדש
        // ומקבלים עוד toast — לולאה שאין ממנה מוצא במסך.
        if (payBlocked.current) return;
        if (status.Status === 'pending_completion' ||
           (status.WorkerConfirmedEnd && status.RestaurantConfirmedEnd)) {
          setBothDone(true);
        }
      } catch {}
    };
    check();
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, [jobId]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  // חישוב בזמן אמת
  const hoursWorked = elapsed / 3600;
  const baseAmount = hoursWorked * hourlyRate;
  const isEmergency = Boolean(job?.IsEmergency || job?.isEmergency);
  const restCommRate = restaurantRate(isEmergency);
  const restCommPct = +(restCommRate * 100).toFixed(1);
  const totalWithFee = (baseAmount * (1 + restCommRate)).toFixed(2);
  const perMinute = (hourlyRate / 60).toFixed(2);
  const handleConfirmEnd = async () => {
    setConfirming(true);
    try {
      const res = await api.restaurantEndShift(jobId);
      setRestaurantConfirmed(true);
      if (res.bothConfirmed) { setBothDone(true); return; }
      const status = await api.getEndStatus(jobId);
      if (status?.WorkerConfirmedEnd && status?.RestaurantConfirmedEnd) setBothDone(true);
    } catch (e: any) {
      // בלי ההודעה הזו הכפתור פשוט "נרגע" והמסעדה משוכנעת שאישרה — בזמן
      // שהאישור לא נרשם, המשמרת נשארת פתוחה והעובד לא מקבל תשלום.
      toast.error(e?.message || 'האישור לא נשמר — נסה שוב');
    }
    setConfirming(false);
    setShowConfirmDialog(false);
  };

  // כאשר שני הצדדים אישרו — העבר תשלום *ואז* נווט. אם הגבייה נכשלת (למשל אין
  // יתרה בארנק → 402) אסור להציג "התשלום בדרך" — המשמרת לא הושלמה והדירוג ייכשל.
  // מציגים שגיאה, מחזירים למסך הסיום כדי שאפשר יהיה לטעון ארנק ולסיים שוב.
  useEffect(() => {
    if (!bothDone || !jobId) return;
    let cancelled = false;
    let navTimer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        await api.completeJob(jobId);
        if (cancelled) return;
        navTimer = setTimeout(() => navToRestaurant('end_shift'), 2500);
      } catch (e: any) {
        if (cancelled) return;
        payBlocked.current = true;
        setPayError(e?.message || 'התשלום נכשל — ודא שיש יתרה בארנק ונסה שוב');
        setBothDone(false);
      }
    })();
    return () => { cancelled = true; if (navTimer) clearTimeout(navTimer); };
  }, [bothDone, jobId]);

  // הגבייה נכשלה — מסך פעולה, לא לולאת שגיאות. חובה שיהיה מכאן מוצא
  // לארנק, אחרת המסעדה תקועה: אין ניווט תחתון במסך משמרת פעילה.
  if (payError) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-2">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle size={38} className="text-red-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900">התשלום לא עבר</h2>
        <p className="text-gray-500 text-sm">{payError}</p>
        <div className="bg-amber-50 rounded-2xl p-4 w-full text-center">
          <div className="text-2xl font-black text-amber-600">₪{totalWithFee}</div>
          <div className="text-gray-400 text-xs mt-1">הסכום לחיוב (כולל {restCommPct}% עמלה)</div>
        </div>
        <p className="text-gray-400 text-xs">המשמרת לא נסגרה. {workerName} עדיין ממתין לתשלום.</p>
        <div className="w-full flex flex-col gap-2">
          <button onClick={() => navToRestaurant('wallet')}
            className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2">
            <Wallet size={18} /> טען את הארנק
          </button>
          <button onClick={() => { payBlocked.current = false; setPayError(null); setBothDone(true); }}
            className="w-full bg-gray-900 text-white rounded-2xl py-3 font-bold">
            נסה לחייב שוב
          </button>
          <button onClick={() => navToRestaurant('home')}
            className="w-full bg-gray-100 text-gray-600 rounded-2xl py-3 font-semibold text-sm">
            חזרה למסך הראשי
          </button>
        </div>
      </div>
    );
  }

  if (bothDone) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <PartyPopper size={44} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">שני הצדדים אישרו</h2>
        <p className="text-gray-500">התשלום בדרך. עוד רגע תעברו למסך הדירוג.</p>
        <div className="bg-amber-50 rounded-2xl p-4 w-full text-center">
          <div className="text-3xl font-black text-amber-600">₪{totalWithFee}</div>
          <div className="text-gray-400 text-sm mt-1">סה״כ חויב (כולל {restCommPct}% עמלה){isEmergency ? ' · משמרת חירום' : ''}</div>
        </div>
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <button onClick={() => navToRestaurant('end_shift')}
          className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg">
          דרג את {workerName}
        </button>
      </div>
    );
  }

  return (
    <div className="screen-enter flex flex-col gap-3">
      {/* Live banner */}
      <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-sm">משמרת פעילה</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1">
            <Clock size={14} />
            <span className="font-black text-lg tracking-widest">{fmt(elapsed)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black">
            {workerInit}
          </div>
          <div className="flex-1">
            <div className="font-bold">{workerName}</div>
            <div className="text-green-100 text-sm">₪{hourlyRate}/ש׳</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-green-100">תשלם עד כה</div>
            <div className="font-black text-xl">₪{totalWithFee}</div>
            <div className="text-green-200 text-xs">₪{perMinute}/דק׳ · +{restCommPct}%</div>
          </div>
        </div>
      </div>

      {/* סטטוס אישורים */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">אישורי סיום משמרת</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'אתה (מסעדה)', confirmed: restaurantConfirmed },
            { label: workerName,    confirmed: workerConfirmed },
          ].map(side => (
            <div key={side.label} className={`rounded-xl p-3 text-center border-2 transition-all ${
              side.confirmed ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="mb-1 flex justify-center">
                {side.confirmed
                  ? <CheckCircle2 size={22} className="text-green-500" />
                  : <Clock size={22} className="text-gray-300" />}
              </div>
              <div className={`text-xs font-bold truncate ${side.confirmed ? 'text-green-600' : 'text-gray-400'}`}>
                {side.label}
              </div>
              <div className={`text-xs ${side.confirmed ? 'text-green-500' : 'text-gray-400'}`}>
                {side.confirmed ? 'אישר' : 'ממתין'}
              </div>
            </div>
          ))}
        </div>
        {!restaurantConfirmed && workerConfirmed && (
          <p className="text-center text-xs text-blue-700 mt-2 bg-blue-50 rounded-lg p-2 font-semibold">
            {workerName} כבר אישר סיום. אשר גם אתה כדי לשחרר את התשלום.
          </p>
        )}
        {restaurantConfirmed && !workerConfirmed && (
          <p className="text-center text-xs text-amber-700 mt-2 bg-amber-50 rounded-lg p-2">
            ממתין לאישור {workerName}
          </p>
        )}
      </div>

      {/* Chat אמיתי */}
      <Chat jobId={jobId} myRole="restaurant" myName={userProfile?.Name || 'המסעדה'} />

      {/* כפתור סיום */}
      {!restaurantConfirmed ? (
        !showConfirmDialog ? (
          <button onClick={() => setShowConfirmDialog(true)}
            className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold text-lg active:scale-98 transition-transform flex items-center justify-center gap-2">
            <Flag size={18} /> סיים משמרת
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-4 card-shadow space-y-3 screen-enter">
            <h3 className="font-bold text-gray-900 text-center">בטוח שתרצה לסיים?</h3>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="text-xl font-black text-amber-600">₪{totalWithFee}</div>
              <div className="text-gray-400 text-xs">יחויב לאחר אישור שני הצדדים</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmDialog(false)}
                className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-semibold">
                המשך משמרת
              </button>
              <button onClick={handleConfirmEnd} disabled={confirming}
                className="flex-1 bg-amber-500 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2">
                {confirming
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><CheckCircle2 size={16} /> אשר סיום</>}
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <CheckCircle2 size={22} className="text-green-500 mx-auto mb-1" />
          <p className="font-bold text-green-700 text-sm">אישרת סיום</p>
          <p className="text-green-600 text-xs mt-0.5">ממתין לאישור {workerName}</p>
        </div>
      )}

      {/* Report */}
      <button onClick={() => setShowReport(s => !s)}
        className="w-full bg-gray-100 text-gray-500 rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2">
        <AlertTriangle size={16} />
        דיווח על בעיה
      </button>
      {showReport && (
        <div className="bg-white rounded-2xl p-4 card-shadow screen-enter">
          {['העובד לא הגיע', 'העובד לא מתאים', 'בעיית תקשורת', 'אחר'].map(r => (
            <button key={r} onClick={() => setShowReport(false)}
              className="w-full text-right py-2.5 px-3 mb-2 bg-gray-50 rounded-xl text-gray-700 text-sm">
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
