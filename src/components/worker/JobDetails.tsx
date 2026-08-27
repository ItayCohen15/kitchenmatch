import React, { useState, useEffect } from 'react';
import { MapPin, Star, Shield, Zap, X, Search, XCircle, CheckCircle2, Send, ClipboardList } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS } from '../../data/mockData';
import { api } from '../../api';
import { CancelShiftModal } from '../common/CancelShiftModal';
import { effectiveWorkerRate, levelFromShifts } from '../../utils/levels';
import { estimateNet } from '../../utils/payrollEstimate';
import { NetBreakdown } from '../common/NetBreakdown';
import { avatarTone } from '../../utils/colors';

export const JobDetails: React.FC = () => {
  const { navToWorker, getSelectedJob, userProfile } = useApp();
  const job = getSelectedJob();
  const [declining, setDeclining] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Search size={30} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">משמרת לא נמצאה</p>
          <button
            onClick={() => navToWorker('home')}
            className="mt-4 bg-[#5354d3] text-white rounded-xl px-6 py-3 font-bold"
          >
            חזור למשמרות
          </button>
        </div>
      </div>
    );
  }

  const hourlyRate = Number(job.HourlyRate || job.hourlyRate || 0);
  const start = new Date(job.StartTime || job.startTime);
  const end = new Date(job.EndTime || job.endTime);
  const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
  const baseAmount = parseFloat(hours) * hourlyRate;
  const workerLevel = levelFromShifts(userProfile?.CompletedShifts || 0).key;
  const commRate = effectiveWorkerRate(workerLevel, Boolean(job.IsEmergency || job.isEmergency));
  const isSelfEmployed = userProfile?.IsSelfEmployed !== 0; // NULL/1 => עצמאי, 0 => לא-עצמאי
  const netEst = estimateNet(baseAmount, commRate, isSelfEmployed);
  const netPay = Math.round(netEst.net).toString();
  const startStr = start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const endStr = end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const restaurantName = job.RestaurantName || job.restaurantName || 'מסעדה';
  const restaurantCity = job.RestaurantCity || job.restaurantCity || '';
  const restaurantAddress = job.RestaurantAddress || job.restaurantAddress || '';
  const jobInstructions = job.Instructions || job.instructions || '';
  const jobDuties = job.Duties || job.duties || '';
  const isEmergency = Boolean(job.IsEmergency || job.isEmergency);
  const role = job.Role || job.role || 'chef';

  const handleAccept = async () => {
    if (!userProfile?.Id) {
      setError('שגיאה: משתמש לא מזוהה. התנתק והתחבר מחדש.');
      setAccepting(false);
      return;
    }
    setAccepting(true);
    setError('');
    try {
      await api.applyToJob(Number(job.Id || job.id), userProfile.Id);
      setAccepted(true);
    } catch (e: any) {
      setError(e.message || 'שגיאה בשליחת המועמדות');
      setAccepting(false);
    }
  };

  // פולינג אחרי הגשת מועמדות — בדוק אם אושרת / בוטל
  const [approvedByRestaurant, setApprovedByRestaurant] = useState(false);
  const [cancelledByRestaurant, setCancelledByRestaurant] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  useEffect(() => {
    if (!accepted || !job || !userProfile?.Id) return;
    const jobId = Number(job.Id || job.id);
    if (!jobId) return;
    const check = async () => {
      try {
        // שימוש ב-getStartStatus שמחזיר Status עדכני
        const status = await api.getStartStatus(jobId);
        if (status?.Status === 'cancelled') {
          setCancelledByRestaurant(true);
        } else if (status?.Status && ['confirmed','active'].includes(status.Status)) {
          setApprovedByRestaurant(true);
        }
      } catch {}
    };
    check();
    const iv = setInterval(check, 3000);
    return () => clearInterval(iv);
  }, [accepted, job?.Id, userProfile?.Id]);

  // מסך — המסעדה ביטלה
  if (cancelledByRestaurant) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-6">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle size={44} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">המשמרת בוטלה</h2>
        <p className="text-gray-500">המסעדה ביטלה את המשמרת. אם הביטול היה מאוחר, קיבלת פיצוי לארנק.</p>
        <button onClick={() => navToWorker('home')}
          className="w-full bg-[#5354d3] text-white rounded-2xl py-4 font-bold text-lg">
          חזור למשמרות
        </button>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-6">
        {approvedByRestaurant ? (
          <>
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={44} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">המשמרת אושרה</h2>
            <p className="text-gray-500">{restaurantName} מחכה לך</p>
            <button onClick={() => navToWorker('navigation')}
              className="w-full bg-green-500 text-white rounded-2xl py-4 font-bold text-lg">
              צא לדרך
            </button>
            <button onClick={() => setShowCancel(true)}
              className="w-full text-red-400 text-sm py-1 font-semibold">
              בטל משמרת
            </button>
            {showCancel && (
              <CancelShiftModal
                jobId={Number(job.Id || job.id)}
                cancelledBy="worker"
                startTime={job.StartTime || job.startTime}
                isConfirmed={true}
                onClose={() => setShowCancel(false)}
                onCancelled={() => { setShowCancel(false); navToWorker('home'); }}
              />
            )}
          </>
        ) : (
          <>
            <div className="relative w-28 h-28">
              <div className="w-28 h-28 bg-[#ecebfd] rounded-full flex items-center justify-center">
                <Send size={40} className="text-[#5354d3]" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-[#c7c7f5] border-t-[#5354d3] animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">מועמדות נשלחה!</h2>
              <p className="text-gray-500 mt-1">ממתין לאישור <strong>{restaurantName}</strong></p>
            </div>
            <div className="w-full bg-white rounded-2xl p-4 card-shadow space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">מסעדה</span>
                <span className="font-semibold text-gray-900">{restaurantName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">שכר</span>
                <span className="font-semibold text-[#5354d3]">₪{hourlyRate}/ש׳</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">שעות</span>
                <span className="font-semibold text-gray-900">{startStr}–{endStr}</span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-bold text-gray-900">תקבל נטו</span>
                <span className="font-bold text-green-600 text-xl">₪{netPay}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span>בודק אישור אוטומטית...</span>
            </div>

            {/* ביטול מועמדות — ללא קנס, לפני אישור */}
            <button
              onClick={async () => {
                setWithdrawing(true);
                try {
                  await api.withdrawApplication(Number(job.Id || job.id));
                  navToWorker('home');
                } catch (e: any) {
                  setError(e.message || 'שגיאה בביטול המועמדות');
                  setWithdrawing(false);
                }
              }}
              disabled={withdrawing}
              className="w-full border border-red-200 text-red-500 rounded-2xl py-3 font-bold text-sm disabled:opacity-50"
            >
              {withdrawing ? 'מבטל...' : 'בטל מועמדות'}
            </button>
            <p className="text-gray-400 text-xs -mt-1">ביטול לפני אישור — ללא קנס</p>
          </>
        )}
        {!approvedByRestaurant && error && (
          <div className="w-full bg-red-50 text-red-600 rounded-xl p-3 text-sm text-center">{error}</div>
        )}
        <button
          onClick={() => navToWorker('home')}
          className="w-full bg-[#5354d3] text-white rounded-2xl py-4 font-bold text-lg"
        >
          חזור למשמרות
        </button>
      </div>
    );
  }

  if (accepting) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4">
        <div className="w-16 h-16 border-4 border-[#c7c7f5] border-t-[#5354d3] rounded-full animate-spin" />
        <h2 className="text-xl font-bold text-gray-900">שולח מועמדות...</h2>
        <p className="text-gray-500">רגע אחד</p>
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      {/* Header */}
      <div className="rounded-2xl p-5 text-white"
        style={{ background: isEmergency ? '#e5484d' : '#1b1e38' }}>
        {isEmergency && (
          <div className="flex items-center gap-2 mb-3 bg-white/20 rounded-lg px-3 py-1.5 w-fit">
            <Zap size={14} className="fill-white" />
            <span className="text-sm font-bold">חירום – דרוש תוך 30 דק׳</span>
          </div>
        )}
        <h2 className="text-2xl font-bold mb-1">{restaurantName}</h2>
        {restaurantCity && (
          <div className="flex items-center gap-2 text-[#c7c7f5] text-sm mb-4">
            <MapPin size={14} />
            {restaurantCity}
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="font-bold text-xl">₪{hourlyRate}</div>
            <div className="text-[#c7c7f5] text-xs">/שעה</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="font-bold text-xl">{hours}</div>
            <div className="text-[#c7c7f5] text-xs">שעות</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="font-bold text-xl text-green-300">₪{netPay}</div>
            <div className="text-[#c7c7f5] text-xs">לכיסך</div>
          </div>
        </div>
      </div>

      {/* Details — תפקיד/שעות */}
      <div className="bg-white rounded-2xl p-4 card-shadow space-y-0">
        {[
          { label: 'תפקיד',     value: ROLE_LABELS[role] || role },
          { label: 'שעות',      value: `${startStr} – ${endStr}` },
          { label: 'סה״כ שעות', value: `${hours} שעות` },
        ].map(d => (
          <div key={d.label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-gray-500 text-sm">{d.label}</span>
            <span className="font-semibold text-gray-900 text-sm">{d.value}</span>
          </div>
        ))}
      </div>

      {/* פירוט תשלום שקוף — עצמאי מול לא-עצמאי */}
      <NetBreakdown base={baseAmount} stafflyRate={commRate} isSelfEmployed={isSelfEmployed} title="פירוט תשלום" />

      {/* מה כוללת המשמרת */}
      {jobDuties && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-1.5"><ClipboardList size={14} className="text-gray-400" /> מה כוללת המשמרת</h3>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{jobDuties}</p>
        </div>
      )}

      {/* Restaurant info */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">אודות המסעדה</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: avatarTone(restaurantName).bg, color: avatarTone(restaurantName).fg }}>
            {restaurantName.slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{restaurantName}</div>
            {restaurantCity && <div className="text-gray-400 text-sm">{restaurantCity}</div>}
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-green-600 text-xs">
                <Shield size={10} />
                מסעדה מאומתת
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* הוראות הגעה */}
      {(jobInstructions || restaurantAddress) && (
        <div className="bg-amber-50 border border-orange-100 rounded-2xl p-4">
          <h3 className="font-bold text-amber-800 mb-2 text-sm flex items-center gap-1.5"><MapPin size={14} /> הוראות הגעה</h3>
          {restaurantAddress && (
            <div className="text-gray-700 text-sm mb-1 font-medium">
              כתובת: {restaurantAddress}{restaurantCity ? `, ${restaurantCity}` : ''}
            </div>
          )}
          {jobInstructions && (
            <p className="text-gray-700 text-sm leading-relaxed">{jobInstructions}</p>
          )}
        </div>
      )}

      {/* Payment guarantee */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
        <strong>תשלום מובטח</strong> — {isSelfEmployed
          ? 'הכסף יועבר לארנקך לאחר אישור סיום המשמרת על ידי המסעדה.'
          : 'הסכום יועבר לשירות "חשבונית לשכיר" לאחר סיום המשמרת, ומשם נטו אליך.'}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm text-center">{error}</div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pb-2">
        {declining ? (
          <div className="flex-1 bg-gray-100 rounded-2xl p-4 screen-enter">
            <div className="text-center font-bold text-gray-800 mb-3 text-sm">סיבת דחייה</div>
            {['לא פנוי בשעות', 'המרחק רחוק מדי', 'השכר לא מתאים', 'אחר'].map(r => (
              <button
                key={r}
                onClick={() => { setDeclining(false); navToWorker('home'); }}
                className="w-full text-right py-2.5 px-3 mb-2 bg-white rounded-xl text-gray-700 text-sm border border-gray-100 active:bg-gray-50"
              >
                {r}
              </button>
            ))}
            <button onClick={() => setDeclining(false)} className="w-full text-gray-400 text-sm py-2">
              ביטול
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setDeclining(true)}
              className="flex items-center justify-center gap-1 bg-gray-100 text-gray-600 rounded-2xl py-4 px-5 font-semibold text-sm"
            >
              <X size={16} />
              דחה
            </button>
            <button
              onClick={handleAccept}
              className={`flex-1 text-white rounded-2xl py-4 font-bold text-lg shadow-lg active:scale-98 transition-transform ${
                isEmergency ? 'bg-red-500' : 'bg-[#5354d3]'
              }`}
            >
              {isEmergency ? 'הגש מועמדות לחירום' : 'הגש מועמדות'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
