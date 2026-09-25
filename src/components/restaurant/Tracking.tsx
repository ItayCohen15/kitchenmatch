import React, { useEffect, useState } from 'react';
import { setVisibleInterval } from '../../utils/visibleInterval';
import { Phone, MessageCircle, CheckCircle2, X, Clock, XCircle, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { CancelShiftModal } from '../common/CancelShiftModal';

export const LiveTracking: React.FC = () => {
  const { navToRestaurant, startShift, getSelectedJob, userProfile } = useApp();
  const job = getSelectedJob();

  const [workerPhone, setWorkerPhone]      = useState<string>('');
  const [initiating, setInitiating]        = useState(false);
  const [waitingForWorker, setWaiting]     = useState(false);
  const [workerInitiated, setWorkerInit]   = useState(false);
  const [confirming, setConfirming]        = useState(false);
  const [error, setError]                  = useState('');
  const [showCancel, setShowCancel]        = useState(false);
  const [cancelledByWorker, setCancelledByWorker] = useState(false);
  const [jobData, setJobData]              = useState<any>(job || null);

  // קונטיינר סטאז' ששוחזר אחרי ריענון — שייך למסך הסטאז', לא לכאן
  useEffect(() => {
    if (jobData?.JobType === 'stage') navToRestaurant('stages');
  }, [jobData?.JobType]);

  const workerName  = jobData?.WorkerName || 'העובד';
  const workerInit  = workerName.split(' ').map((n: string) => n[0]).join('').slice(0,2);
  const hourlyRate  = jobData ? Number(jobData.HourlyRate ?? 0) : 0;
  const jobId       = jobData ? Number(jobData.Id ?? 0) : 0;

  // טעינת נתוני משמרת טריים (כולל טלפון)
  useEffect(() => {
    if (!userProfile?.Id) return;
    const load = () => api.getRestaurantJobs(userProfile.Id)
      .then((data: any[]) => {
        // קונטיינר סטאז' לא שייך למסך הזה (משמרות סטאז' מתוזמנות כן — הן רצות בזרימה הרגילה)
        const candidates = (data || []).filter((j: any) =>
          j.JobType !== 'stage' && ['confirmed','active','pending_completion'].includes(j.Status));
        // עדיפות למשמרת שנבחרה; אחרת הפעילה הראשונה
        const selId = Number(job?.Id || job?.id || 0);
        const active = candidates.find((j: any) => Number(j.Id) === selId) || candidates[0];
        if (active) {
          setJobData(active);
          if (active.WorkerPhone) setWorkerPhone(active.WorkerPhone);
        }
      }).catch(() => {});
    load();
    const iv = setVisibleInterval(load, 5000);
    return () => clearInterval(iv);
  }, [userProfile?.Id]);

  // פולינג ראשי — גלה אם העובד יזם / כבר active
  // לא תלוי ב-waitingForWorker!
  useEffect(() => {
    if (!jobId) return;
    const check = async () => {
      try {
        const s = await api.getStartStatus(jobId);
        if (s.Status === 'active') {
          startShift();
          navToRestaurant('active_shift');
        } else if (s.Status === 'cancelled') {
          setCancelledByWorker(true);
        } else if (s.StartInitiatedBy === 'worker') {
          setWorkerInit(true);
        }
      } catch {}
    };
    check();
    const iv = setVisibleInterval(check, 2500);
    return () => clearInterval(iv);
  }, [jobId]); // ← רק jobId!

  const handleInitiate = async () => {
    setInitiating(true); setError('');
    try {
      const r = await api.initiateStart(jobId, 'restaurant');
      if (r?.status === 'active') { startShift(); navToRestaurant('active_shift'); return; }
      setWaiting(true);
    } catch { setError('שגיאה בשליחה, נסה שוב'); }
    setInitiating(false);
  };

  const handleConfirm = async () => {
    setConfirming(true); setError('');
    try {
      await api.confirmStart(jobId);
      startShift();
      navToRestaurant('active_shift');
    } catch {
      try {
        const s = await api.getStartStatus(jobId);
        if (s.Status === 'active') { startShift(); navToRestaurant('active_shift'); return; }
      } catch {}
      setError('שגיאה — נסה שוב');
    }
    setConfirming(false);
  };

  // העובד ביטל את המשמרת
  if (cancelledByWorker) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-6">
        <div className="flex items-center justify-center" style={{ width: 96, height: 96, borderRadius: '50%', background: '#fde3e3' }}>
          <XCircle size={44} style={{ color: '#cf3030' }} />
        </div>
        <h2 className="font-black" style={{ fontSize: 24, color: '#141a2e' }}>העובד ביטל</h2>
        <p className="font-semibold" style={{ color: '#7a8199' }}>{workerName} ביטל את המשמרת. אם הביטול היה מאוחר, קיבלת ₪50 פיצוי לארנק.</p>
        <button onClick={() => navToRestaurant('home')}
          className="w-full rounded-2xl py-4 font-black text-lg active:scale-95 transition-transform"
          style={{ background: '#5354d3', color: '#fff' }}>
          חזור לבית
        </button>
      </div>
    );
  }

  return (
    <div className="screen-enter flex flex-col gap-4">
      {/* Status — hero נייבי עם זוהר זהב+אינדיגו */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: '#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 260, height: 260, borderRadius: '50%', bottom: -120, left: -80, background: 'radial-gradient(circle, rgba(244,182,44,.20), transparent 66%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '50%', top: -80, left: 40, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />
        <div className="relative p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex-none flex items-center justify-center font-black" style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.12)', color: '#f4b62c', fontSize: 18 }}>
              {workerInit}
            </div>
            <div className="min-w-0">
              <div className="font-black leading-tight" style={{ fontSize: 20 }}>{workerName} בדרך</div>
              <div className="text-[13px] font-semibold mt-1" style={{ color: '#cdd3e8' }}>
                <span style={{ color: '#f4b62c' }}>₪{hourlyRate}/ש׳</span> · אושר
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* כרטיס סטטוס */}
      <div className="flex items-center gap-4 rounded-3xl p-4" style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
        <div className="flex-none flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: 14, background: '#ece9fe' }}>
          <Clock size={24} style={{ color: '#5b4bd0' }} />
        </div>
        <div className="min-w-0">
          <div className="font-black" style={{ fontSize: 15, color: '#141a2e' }}>העובד בדרך אליך</div>
          <div className="font-semibold text-sm mt-0.5" style={{ color: '#7a8199' }}>תקבל התראה כשיגיע לצ׳ק-אין</div>
        </div>
        <span className="mr-auto relative flex-none" style={{ width: 10, height: 10 }}>
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(31,157,107,.5)' }} />
          <span className="absolute inset-0 rounded-full" style={{ background: '#1f9d6b' }} />
        </span>
      </div>

      {/* שגיאה */}
      {error && <div className="rounded-xl px-4 py-3 text-center text-sm font-semibold" style={{ background: '#fde3e3', color: '#cf3030' }}>{error}</div>}

      {/* פופאפ — העובד יזם */}
      {workerInitiated && !waitingForWorker && (
        <div className="relative rounded-3xl p-4 text-white screen-enter overflow-hidden" style={{ background: '#1f9d6b' }}>
          <div className="font-black text-lg mb-1 flex items-center gap-2"><Bell size={18} /> {workerName} הגיע</div>
          <div className="text-sm mb-4" style={{ color: 'rgba(255,255,255,.85)' }}>העובד ביקש להתחיל משמרת — אשר?</div>
          <div className="flex gap-3">
            <button onClick={() => setWorkerInit(false)}
              className="flex-1 rounded-xl py-3 font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: 'rgba(255,255,255,.2)' }}>
              <X size={16} /> עוד לא
            </button>
            <button onClick={handleConfirm} disabled={confirming}
              className="flex-1 rounded-xl py-3 font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: '#fff', color: '#1f8f5f' }}>
              {confirming
                ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(31,157,107,.4)', borderTopColor: '#1f8f5f' }} />
                : <><CheckCircle2 size={16} /> אשר — התחל</>}
            </button>
          </div>
        </div>
      )}

      {/* ממתין לאישור עובד */}
      {waitingForWorker && (
        <div className="rounded-3xl p-4 text-center" style={{ background: '#fdf0cf', border: '1px solid #f4e3b0' }}>
          <div className="flex justify-center mb-2"><Clock size={26} style={{ color: '#8a6300' }} /></div>
          <div className="font-black" style={{ color: '#8a6300' }}>ממתין לאישור {workerName}</div>
          <div className="text-sm mt-1 font-semibold" style={{ color: '#a07a1f' }}>שלחנו התראה לעובד</div>
          <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto mt-2" style={{ borderColor: '#e6c76a', borderTopColor: 'transparent' }} />
        </div>
      )}

      {/* כרטיס פעולות */}
      <div className="rounded-3xl p-4" style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
        <div className="flex gap-3 mb-4">
          {workerPhone ? (
            <a href={`tel:${workerPhone}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm active:scale-95 transition-transform"
              style={{ background: '#1f9d6b', color: '#fff', textDecoration: 'none' }}>
              <Phone size={16} /> התקשר ל{workerName}
            </a>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl py-2.5 text-xs gap-0.5" style={{ background: '#f4f5f9', color: '#7a8199' }}>
              <Phone size={15} /><span>העובד לא הוסיף טלפון</span>
            </div>
          )}
          <button onClick={() => navToRestaurant('active_shift')}
            className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-semibold text-sm active:scale-95 transition-transform"
            style={{ background: '#f4f5f9', color: '#2b3350' }}>
            <MessageCircle size={16} /> צ׳אט
          </button>
        </div>

        {!waitingForWorker && !workerInitiated && (
          <button onClick={handleInitiate} disabled={initiating}
            className="w-full rounded-2xl py-4 font-black text-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}>
            {initiating
              ? <><div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,44,0,.3)', borderTopColor: '#3a2c00' }} />שולח...</>
              : <><CheckCircle2 size={22} /> העובד הגיע — התחל משמרת</>}
          </button>
        )}
      </div>

      {/* ביטול משמרת */}
      {!waitingForWorker && !workerInitiated && (
        <button onClick={() => setShowCancel(true)}
          className="w-full text-sm py-1 text-center font-semibold active:scale-95 transition-transform"
          style={{ color: '#c76b6b' }}>
          בטל משמרת
        </button>
      )}

      {showCancel && (
        <CancelShiftModal
          jobId={jobId}
          cancelledBy="restaurant"
          startTime={jobData?.StartTime}
          isConfirmed={true}
          onClose={() => setShowCancel(false)}
          onCancelled={() => { setShowCancel(false); navToRestaurant('home'); }}
        />
      )}
    </div>
  );
};
