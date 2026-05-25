import React, { useEffect, useState } from 'react';
import { Navigation2, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

export const WorkerNavigation: React.FC = () => {
  const { navToWorker, getSelectedJob, startShift } = useApp();
  const job = getSelectedJob();
  const [initiating, setInitiating] = useState(false);
  const [waitingForRestaurant, setWaitingForRestaurant] = useState(false);
  const [restaurantInitiated, setRestaurantInitiated] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const restaurantName: string = job?.RestaurantName || job?.restaurantName || 'המסעדה';
  const restaurantCity: string = job?.RestaurantCity || job?.restaurantCity || '';
  const restaurantAddress: string = job?.RestaurantAddress || job?.restaurantAddress || '';
  const hourlyRate: number = job ? Number(job.HourlyRate ?? job.hourlyRate ?? 0) : 0;
  const jobId: number = job ? Number(job.Id ?? job.id ?? 0) : 0;
  const startStr = job?.StartTime ? new Date(job.StartTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const endStr = job?.EndTime ? new Date(job.EndTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  // פולינג — האם המסעדה יזמה / אישרה?
  useEffect(() => {
    if (!jobId) return;
    const check = async () => {
      try {
        const s = await api.getStartStatus(jobId);
        if (s.Status === 'active') {
          // כבר התחיל (אולי המסעדה אישרה)
          startShift();
          navToWorker('active_shift');
          return;
        }
        if (s.StartInitiatedBy === 'restaurant') {
          setRestaurantInitiated(true);
        }
      } catch {}
    };
    check();
    const iv = setInterval(check, 3000);
    return () => clearInterval(iv);
  }, [jobId, waitingForRestaurant]);

  const handleWorkerInitiate = async () => {
    setInitiating(true);
    try {
      await api.initiateStart(jobId, 'worker');
      setWaitingForRestaurant(true);
    } catch {}
    setInitiating(false);
  };

  const handleConfirmRestaurantStart = async () => {
    setConfirming(true);
    try {
      await api.confirmStart(jobId);
      startShift();
      navToWorker('active_shift');
    } catch {}
    setConfirming(false);
  };

  const handleDecline = async () => {
    setRestaurantInitiated(false);
  };

  const wazeQuery = restaurantAddress
    ? `${restaurantAddress}, ${restaurantCity}`
    : restaurantCity;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(wazeQuery)}&navigate=yes`;

  return (
    <div className="screen-enter flex flex-col gap-4">
      {/* Status */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Navigation2 size={22} className="fill-white" />
          </div>
          <div>
            <div className="font-bold">בדרך אל {restaurantName}</div>
            <div className="text-blue-100 text-sm">{restaurantCity}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-black text-green-300">₪{hourlyRate}</div>
            <div className="text-blue-100 text-xs">/שעה</div>
          </div>
          <div className="flex-1 bg-white/15 rounded-xl p-3 text-center">
            <div className="text-lg font-black">{startStr}</div>
            <div className="text-blue-100 text-xs">התחלה</div>
          </div>
          <div className="flex-1 bg-white/15 rounded-xl p-3 text-center">
            <div className="text-lg font-black">{endStr}</div>
            <div className="text-blue-100 text-xs">סיום</div>
          </div>
        </div>
      </div>

      {/* כפתור וויז — ראשי */}
      <a
        href={wazeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-[#05C3F9] text-white rounded-2xl p-5 shadow-lg shadow-blue-100 active:scale-98 transition-transform"
        style={{ textDecoration: 'none' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">🗺️</span>
          </div>
          <div className="flex-1 text-right">
            <div className="font-black text-xl">נווט עם וויז</div>
            <div className="text-blue-100 text-sm mt-0.5">
              {restaurantAddress ? `${restaurantAddress}, ${restaurantCity}` : restaurantCity}
            </div>
          </div>
          <div className="text-white/70 text-2xl">›</div>
        </div>
      </a>

      {/* פופאפ — המסעדה יזמה התחלה */}
      {restaurantInitiated && !waitingForRestaurant && (
        <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white screen-enter">
          <div className="font-black text-lg mb-1">🔔 {restaurantName} רוצה להתחיל!</div>
          <div className="text-green-100 text-sm mb-4">המסעדה מוכנה — האם הגעת?</div>
          <div className="flex gap-3">
            <button onClick={handleDecline}
              className="flex-1 bg-white/20 rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
              <X size={16} /> עוד לא
            </button>
            <button onClick={handleConfirmRestaurantStart} disabled={confirming}
              className="flex-1 bg-white text-green-700 rounded-xl py-3 font-black flex items-center justify-center gap-2">
              {confirming
                ? <div className="w-4 h-4 border-2 border-green-400 border-t-green-700 rounded-full animate-spin" />
                : <><CheckCircle2 size={16} /> אני כאן! התחל</>}
            </button>
          </div>
        </div>
      )}

      {/* ממתין לאישור מסעדה */}
      {waitingForRestaurant && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-2">⏳</div>
          <div className="font-bold text-amber-800">ממתין לאישור {restaurantName}</div>
          <div className="text-amber-600 text-sm mt-1">שלחנו התראה למסעדה</div>
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      )}

      {/* הוראות הגעה */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">מה לעשות כשמגיע?</h3>
        <div className="space-y-2">
          {['הכנס דרך הכניסה הראשית / אחורית', 'בקש את מנהל המשמרת', 'לחץ "צ׳ק-אין" כאן', 'בהצלחה! 👨‍🍳'].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <span className="text-gray-700 text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* כפתור צ'ק-אין */}
      {!waitingForRestaurant && !restaurantInitiated && (
        <button onClick={handleWorkerInitiate} disabled={initiating}
          className="w-full bg-orange-500 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-orange-200 active:scale-98 transition-transform">
          {initiating
            ? <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                שולח התראה...
              </div>
            : '📍 הגעתי — צ׳ק-אין'}
        </button>
      )}

      <button onClick={() => navToWorker('home')} className="w-full text-gray-400 text-sm py-1 text-center">
        ביטול
      </button>
    </div>
  );
};
