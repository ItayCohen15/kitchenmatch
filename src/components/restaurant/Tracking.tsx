import React, { useEffect, useState } from 'react';
import { Phone, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MapView } from '../common/MapView';
import { api } from '../../api';

export const LiveTracking: React.FC = () => {
  const { navToRestaurant, startShift, getSelectedJob, userProfile } = useApp();
  const job = getSelectedJob();
  const [confirmedJobs, setConfirmedJobs] = useState<any[]>([]);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!userProfile?.Id) return;
    const load = () => {
      api.getRestaurantJobs(userProfile.Id)
        .then(data => {
          const confirmed = Array.isArray(data)
            ? data.filter((j: any) => ['confirmed','active'].includes(j.Status))
            : [];
          setConfirmedJobs(confirmed);
          // אם העובד כבר צ'ק-אין (active) — עבור למשמרת פעילה
          const active = confirmed.find((j: any) => j.Status === 'active');
          if (active && !started) {
            startShift();
            navToRestaurant('active_shift');
          }
        })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [userProfile?.Id, started]);

  const activeJob = job || confirmedJobs[0];
  const workerName = activeJob?.WorkerName || 'העובד';
  const workerInit = workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const hourlyRate = activeJob ? Number(activeJob.HourlyRate ?? 0) : 0;

  const handleStartShift = async () => {
    setStarted(true);
    startShift();
    if (activeJob?.Id) await api.startJob(Number(activeJob.Id)).catch(() => {});
    navToRestaurant('active_shift');
  };

  return (
    <div className="screen-enter flex flex-col gap-4">
      {/* Status header */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-black">
            {workerInit}
          </div>
          <div>
            <div className="font-bold text-lg">{workerName} בדרך</div>
            <div className="text-blue-100 text-sm">עובד אושר · ממתין להגעה</div>
          </div>
        </div>
        <div className="bg-white/15 rounded-xl p-3 text-center">
          <div className="text-blue-100 text-sm mb-1">כשהעובד יגיע — לחץ "התחל משמרת"</div>
          <div className="text-white text-sm font-semibold">הוא גם יוכל לצ'ק-אין מהצד שלו</div>
        </div>
      </div>

      {/* Map */}
      <div className="h-52 rounded-2xl overflow-hidden">
        <MapView showWorker workerName={workerName}
          restaurantName={userProfile?.Name || 'המסעדה'} mode="tracking" />
      </div>

      {/* Worker card */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">
            {workerInit}
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-base">{workerName}</div>
            <div className="text-gray-500 text-sm">{activeJob?.Role || 'עובד'}</div>
          </div>
          <div className="text-orange-500 font-black text-lg">₪{hourlyRate}/ש׳</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl py-3 text-gray-700 font-semibold text-sm">
            <Phone size={16} /> התקשר
          </button>
          <button onClick={() => navToRestaurant('active_shift')}
            className="flex items-center justify-center gap-2 bg-gray-100 rounded-xl py-3 text-gray-700 font-semibold text-sm">
            <MessageCircle size={16} /> הודעה
          </button>
        </div>
      </div>

      {/* Start shift */}
      <button onClick={handleStartShift}
        className="w-full bg-green-500 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-green-200 active:scale-98 transition-transform flex items-center justify-center gap-2">
        <CheckCircle2 size={22} /> התחל משמרת
      </button>

      <p className="text-center text-xs text-gray-400">
        גם העובד יכול לצ'ק-אין — ושניכם תעברו למשמרת הפעילה אוטומטית
      </p>
    </div>
  );
};
