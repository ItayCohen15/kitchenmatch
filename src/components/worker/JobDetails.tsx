import React, { useState, useEffect } from 'react';
import { setVisibleInterval } from '../../utils/visibleInterval';
import { MapPin, Shield, X, Search, XCircle, CheckCircle2, Send, ClipboardList, Clock } from 'lucide-react';
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
          <Search size={30} className="mx-auto mb-3" style={{ color: '#c2c7da' }} />
          <p className="font-semibold" style={{ color: '#7a8199' }}>משמרת לא נמצאה</p>
          <button
            onClick={() => navToWorker('home')}
            className="mt-4 text-white rounded-2xl px-6 py-3 font-extrabold active:scale-95 transition-transform"
            style={{ background: '#5354d3' }}
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
    const iv = setVisibleInterval(check, 3000);
    return () => clearInterval(iv);
  }, [accepted, job?.Id, userProfile?.Id]);

  // מסך — המסעדה ביטלה
  if (cancelledByRestaurant) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: '#fde3e3' }}>
          <XCircle size={44} style={{ color: '#cf3030' }} />
        </div>
        <h2 className="text-2xl font-black" style={{ color: '#141a2e' }}>המשמרת בוטלה</h2>
        <p style={{ color: '#7a8199' }}>המסעדה ביטלה את המשמרת. אם הביטול היה מאוחר, קיבלת פיצוי לארנק.</p>
        <button onClick={() => navToWorker('home')}
          className="w-full text-white rounded-2xl py-4 font-extrabold text-lg active:scale-[0.98] transition-transform"
          style={{ background: '#5354d3' }}>
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
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: '#e4f7ee' }}>
              <CheckCircle2 size={44} style={{ color: '#1f9d6b' }} />
            </div>
            <h2 className="text-2xl font-black" style={{ color: '#141a2e' }}>המשמרת אושרה</h2>
            <p style={{ color: '#7a8199' }}>{restaurantName} מחכה לך</p>
            <button onClick={() => navToWorker('navigation')}
              className="w-full text-white rounded-2xl py-4 font-extrabold text-lg active:scale-[0.98] transition-transform"
              style={{ background: '#1f9d6b' }}>
              צא לדרך
            </button>
            <button onClick={() => setShowCancel(true)}
              className="w-full text-sm py-1 font-semibold" style={{ color: '#cf3030' }}>
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
              <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background: '#ecebfd' }}>
                <Send size={40} style={{ color: '#5354d3' }} />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-[#c7c7f5] border-t-[#5354d3] animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black" style={{ color: '#141a2e' }}>מועמדות נשלחה!</h2>
              <p className="mt-1" style={{ color: '#7a8199' }}>ממתין לאישור <strong style={{ color: '#2b3350' }}>{restaurantName}</strong></p>
            </div>
            <div className="w-full rounded-[20px] p-4 space-y-3"
              style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#7a8199' }}>מסעדה</span>
                <span className="font-bold" style={{ color: '#141a2e' }}>{restaurantName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#7a8199' }}>שכר</span>
                <span className="rounded-lg font-extrabold" style={{ fontSize: 12, padding: '4px 9px', background: '#fdf0cf', color: '#8a6300' }}>₪{hourlyRate}/ש׳</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#7a8199' }}>שעות</span>
                <span className="font-bold" style={{ color: '#141a2e' }}>{startStr}–{endStr}</span>
              </div>
              <div className="pt-3 flex items-center justify-between" style={{ borderTop: '1px solid #eceef4' }}>
                <span className="font-black" style={{ color: '#141a2e' }}>תקבל נטו</span>
                <span className="font-black text-xl" style={{ color: '#1f9d6b' }}>₪{netPay}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#7a8199' }}>
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
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
              className="w-full rounded-2xl py-3 font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
              style={{ border: '1px solid #f6c9c9', color: '#cf3030' }}
            >
              {withdrawing ? 'מבטל...' : 'בטל מועמדות'}
            </button>
            <p className="text-xs -mt-1" style={{ color: '#7a8199' }}>ביטול לפני אישור — ללא קנס</p>
          </>
        )}
        {!approvedByRestaurant && error && (
          <div className="w-full rounded-xl p-3 text-sm text-center" style={{ background: '#fde3e3', color: '#cf3030' }}>{error}</div>
        )}
        <button
          onClick={() => navToWorker('home')}
          className="w-full text-white rounded-2xl py-4 font-extrabold text-lg active:scale-[0.98] transition-transform"
          style={{ background: '#5354d3' }}
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
        <h2 className="text-xl font-black" style={{ color: '#141a2e' }}>שולח מועמדות...</h2>
        <p style={{ color: '#7a8199' }}>רגע אחד</p>
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      {/* Header — הירו נייבי */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: '#141a2e' }}>
        {/* אקסנט זהב + אינדיגו עדין */}
        <div className="absolute pointer-events-none" style={{ width: 260, height: 260, borderRadius: '50%', bottom: -120, left: -80, background: 'radial-gradient(circle, rgba(244,182,44,.20), transparent 66%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '50%', top: -80, left: 40, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />
        <div className="relative p-5 text-white">
          {isEmergency && (
            <span className="inline-block font-extrabold mb-3" style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 6, background: '#fde3e3', color: '#cf3030' }}>
              חירום – דרוש תוך 30 דק׳
            </span>
          )}
          <h2 className="font-black leading-tight mb-1.5" style={{ fontSize: 26 }}>{ROLE_LABELS[role] || role}</h2>
          <div className="flex items-center gap-1.5 text-[13px] font-semibold mb-3" style={{ color: '#cdd3e8' }}>
            <MapPin size={14} style={{ color: '#f4b62c' }} />
            {restaurantName}{restaurantCity ? ` · ${restaurantCity}` : ''}
          </div>
          <div className="inline-flex items-center gap-1 font-semibold mb-4" style={{ fontSize: 12.5, color: '#b9c0d8' }}>
            <Clock size={13} style={{ color: '#8a90ab' }} />{startStr}–{endStr}
          </div>
          <div className="mb-4">
            <span className="inline-block rounded-lg font-extrabold" style={{ fontSize: 16, padding: '8px 16px', background: '#fdf0cf', color: '#8a6300' }}>
              {hourlyRate} ₪ לשעה
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,.10)' }}>
              <div className="font-black text-xl">{hours}</div>
              <div className="text-xs" style={{ color: '#b9c0d8' }}>שעות</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,.10)' }}>
              <div className="font-black text-xl" style={{ color: '#5bd6a0' }}>₪{netPay}</div>
              <div className="text-xs" style={{ color: '#b9c0d8' }}>לכיסך</div>
            </div>
          </div>
        </div>
      </div>

      {/* Details — תפקיד/שעות */}
      <div className="rounded-[20px] p-4 space-y-0"
        style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
        {[
          { label: 'תפקיד',     value: ROLE_LABELS[role] || role },
          { label: 'שעות',      value: `${startStr} – ${endStr}` },
          { label: 'סה״כ שעות', value: `${hours} שעות` },
        ].map(d => (
          <div key={d.label} className="flex justify-between items-center py-2.5 border-b border-[#f2f3f8] last:border-0">
            <span className="text-sm font-semibold" style={{ color: '#7a8199' }}>{d.label}</span>
            <span className="font-bold text-sm" style={{ color: '#141a2e' }}>{d.value}</span>
          </div>
        ))}
      </div>

      {/* פירוט תשלום שקוף — עצמאי מול לא-עצמאי */}
      <NetBreakdown base={baseAmount} stafflyRate={commRate} isSelfEmployed={isSelfEmployed} title="פירוט תשלום" />

      {/* מה כוללת המשמרת */}
      {jobDuties && (
        <div className="rounded-[20px] p-4"
          style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <h3 className="font-black mb-2 text-sm flex items-center gap-1.5" style={{ color: '#141a2e' }}><ClipboardList size={15} style={{ color: '#5354d3' }} /> מה כוללת המשמרת</h3>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#2b3350' }}>{jobDuties}</p>
        </div>
      )}

      {/* Restaurant info */}
      <div className="rounded-[20px] p-4"
        style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
        <h3 className="font-black mb-3 text-sm" style={{ color: '#141a2e' }}>אודות המסעדה</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: avatarTone(restaurantName).bg, color: avatarTone(restaurantName).fg }}>
            {restaurantName.slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="font-bold" style={{ color: '#141a2e' }}>{restaurantName}</div>
            {restaurantCity && <div className="text-sm" style={{ color: '#7a8199' }}>{restaurantCity}</div>}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 font-extrabold" style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 6, background: '#e4f7ee', color: '#1f8f5f' }}>
                <Shield size={11} />
                מסעדה מאומתת
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* הוראות הגעה */}
      {(jobInstructions || restaurantAddress) && (
        <div className="rounded-[20px] p-4" style={{ background: '#fdf7ea', border: '1px solid #f3e4bd' }}>
          <h3 className="font-black mb-2 text-sm flex items-center gap-1.5" style={{ color: '#8a6300' }}><MapPin size={14} style={{ color: '#f4b62c' }} /> הוראות הגעה</h3>
          {restaurantAddress && (
            <div className="text-sm mb-1 font-semibold" style={{ color: '#2b3350' }}>
              כתובת: {restaurantAddress}{restaurantCity ? `, ${restaurantCity}` : ''}
            </div>
          )}
          {jobInstructions && (
            <p className="text-sm leading-relaxed" style={{ color: '#2b3350' }}>{jobInstructions}</p>
          )}
        </div>
      )}

      {/* Payment guarantee */}
      <div className="rounded-xl p-3.5 text-sm" style={{ background: '#f1f0fe', border: '1px solid #ddd9fb', color: '#5b4bd0' }}>
        <strong>תשלום מובטח</strong> — {isSelfEmployed
          ? 'הכסף יועבר לארנקך לאחר אישור סיום המשמרת על ידי המסעדה.'
          : 'הסכום יועבר לשירות "חשבונית לשכיר" לאחר סיום המשמרת, ומשם נטו אליך.'}
      </div>

      {error && (
        <div className="rounded-xl p-3 text-sm text-center" style={{ background: '#fde3e3', color: '#cf3030' }}>{error}</div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pb-2">
        {declining ? (
          <div className="flex-1 rounded-2xl p-4 screen-enter" style={{ background: '#f4f5f9' }}>
            <div className="text-center font-black mb-3 text-sm" style={{ color: '#141a2e' }}>סיבת דחייה</div>
            {['לא פנוי בשעות', 'המרחק רחוק מדי', 'השכר לא מתאים', 'אחר'].map(r => (
              <button
                key={r}
                onClick={() => { setDeclining(false); navToWorker('home'); }}
                className="w-full text-right py-2.5 px-3 mb-2 rounded-xl text-sm font-semibold active:scale-[0.99] transition-transform"
                style={{ background: '#fff', color: '#2b3350', border: '1px solid #eceef4' }}
              >
                {r}
              </button>
            ))}
            <button onClick={() => setDeclining(false)} className="w-full text-sm py-2 font-semibold" style={{ color: '#7a8199' }}>
              ביטול
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setDeclining(true)}
              className="flex items-center justify-center gap-1 rounded-2xl py-4 px-5 font-bold text-sm active:scale-95 transition-transform"
              style={{ background: '#f4f5f9', color: '#6b7290' }}
            >
              <X size={16} />
              דחה
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 rounded-2xl py-4 font-extrabold text-lg active:scale-[0.98] transition-transform"
              style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}
            >
              {isEmergency ? 'הגש מועמדות לחירום' : 'הגש מועמדות'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
