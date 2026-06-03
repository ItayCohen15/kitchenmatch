import React, { useEffect, useState } from 'react';
import { Phone, MessageCircle, CheckCircle2, X, Clock } from 'lucide-react';
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

  const workerName  = jobData?.WorkerName || 'העובד';
  const workerInit  = workerName.split(' ').map((n: string) => n[0]).join('').slice(0,2);
  const hourlyRate  = jobData ? Number(jobData.HourlyRate ?? 0) : 0;
  const jobId       = jobData ? Number(jobData.Id ?? 0) : 0;

  // טעינת נתוני משמרת טריים (כולל טלפון)
  useEffect(() => {
    if (!userProfile?.Id) return;
    const load = () => api.getRestaurantJobs(userProfile.Id)
      .then((data: any[]) => {
        const active = data?.find((j: any) =>
          ['confirmed','active','pending_completion'].includes(j.Status));
        if (active) {
          setJobData(active);
          if (active.WorkerPhone) setWorkerPhone(active.WorkerPhone);
        }
      }).catch(() => {});
    load();
    const iv = setInterval(load, 5000);
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
    const iv = setInterval(check, 2500);
    return () => clearInterval(iv);
  }, [jobId]); // ← רק jobId!

  const handleInitiate = async () => {
    setInitiating(true); setError('');
    try {
      await api.initiateStart(jobId, 'restaurant');
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
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">❌</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">העובד ביטל</h2>
        <p className="text-gray-500">{workerName} ביטל את המשמרת. אם הביטול היה מאוחר, קיבלת ₪50 פיצוי לארנק.</p>
        <button onClick={() => navToRestaurant('home')}
          className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg">
          חזור לבית
        </button>
      </div>
    );
  }

  return (
    <div className="screen-enter flex flex-col gap-4">
      {/* Status */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">
            {workerInit}
          </div>
          <div>
            <div className="font-bold text-lg">{workerName} בדרך</div>
            <div className="text-blue-100 text-sm">₪{hourlyRate}/ש׳ · אושר ✅</div>
          </div>
        </div>
      </div>

      {/* כרטיס סטטוס */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Clock size={24} className="text-blue-500" />
        </div>
        <div>
          <div className="font-bold text-blue-800">העובד בדרך אליך</div>
          <div className="text-blue-500 text-sm">תקבל התראה כשיגיע לצ׳ק-אין</div>
        </div>
        <div className="mr-auto w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
      </div>

      {/* שגיאה */}
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center">{error}</div>}

      {/* פופאפ — העובד יזם */}
      {workerInitiated && !waitingForWorker && (
        <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white screen-enter">
          <div className="font-black text-lg mb-1">🔔 {workerName} הגיע!</div>
          <div className="text-green-100 text-sm mb-4">העובד ביקש להתחיל משמרת — אשר?</div>
          <div className="flex gap-3">
            <button onClick={() => setWorkerInit(false)}
              className="flex-1 bg-white/20 rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
              <X size={16} /> עוד לא
            </button>
            <button onClick={handleConfirm} disabled={confirming}
              className="flex-1 bg-white text-green-700 rounded-xl py-3 font-black flex items-center justify-center gap-2">
              {confirming
                ? <div className="w-4 h-4 border-2 border-green-400 border-t-green-700 rounded-full animate-spin" />
                : <><CheckCircle2 size={16} /> אשר — התחל</>}
            </button>
          </div>
        </div>
      )}

      {/* ממתין לאישור עובד */}
      {waitingForWorker && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-2">⏳</div>
          <div className="font-bold text-amber-800">ממתין לאישור {workerName}</div>
          <div className="text-amber-600 text-sm mt-1">שלחנו התראה לעובד</div>
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      )}

      {/* כרטיס פעולות */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex gap-3 mb-4">
          {workerPhone ? (
            <a href={`tel:${workerPhone}`}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-3 font-bold text-sm shadow-sm"
              style={{ textDecoration: 'none' }}>
              <Phone size={16} /> התקשר ל{workerName}
            </a>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 rounded-xl py-2.5 text-gray-400 text-xs gap-0.5">
              <Phone size={15} /><span>העובד לא הוסיף טלפון</span>
            </div>
          )}
          <button onClick={() => navToRestaurant('active_shift')}
            className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl py-3 px-4 text-gray-700 font-semibold text-sm">
            <MessageCircle size={16} /> צ׳אט
          </button>
        </div>

        {!waitingForWorker && !workerInitiated && (
          <button onClick={handleInitiate} disabled={initiating}
            className="w-full bg-green-500 text-white rounded-2xl py-4 font-black text-lg active:scale-98 transition-transform flex items-center justify-center gap-2">
            {initiating
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />שולח...</>
              : <><CheckCircle2 size={22} /> העובד הגיע — התחל משמרת</>}
          </button>
        )}
      </div>

      {/* ביטול משמרת */}
      {!waitingForWorker && !workerInitiated && (
        <button onClick={() => setShowCancel(true)}
          className="w-full text-red-400 text-sm py-1 text-center font-semibold">
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
