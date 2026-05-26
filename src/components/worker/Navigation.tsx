import React, { useEffect, useState } from 'react';
import { Navigation2, CheckCircle2, X, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

export const WorkerNavigation: React.FC = () => {
  const { navToWorker, getSelectedJob, startShift, userProfile } = useApp();
  const job = getSelectedJob();
  const [initiating, setInitiating]             = useState(false);
  const [waitingForRestaurant, setWaiting]       = useState(false);
  const [restaurantInitiated, setRestInitiated]  = useState(false);
  const [confirming, setConfirming]              = useState(false);
  const [error, setError]                        = useState('');
  const [restaurantPhone, setRestPhone]          = useState<string>(job?.RestaurantPhone || '');

  const restaurantName    = job?.RestaurantName    || job?.restaurantName    || '׳”׳׳¡׳¢׳“׳”';
  const restaurantCity    = job?.RestaurantCity    || job?.restaurantCity    || '';
  const restaurantAddress = job?.RestaurantAddress || job?.restaurantAddress || '';
  const instructions      = job?.Instructions      || job?.instructions      || '';
  const hourlyRate        = job ? Number(job.HourlyRate ?? job.hourlyRate ?? 0) : 0;
  const jobId             = job ? Number(job.Id ?? job.id ?? 0) : 0;
  const startStr          = job?.StartTime ? new Date(job.StartTime).toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit' }) : '--:--';
  const endStr            = job?.EndTime   ? new Date(job.EndTime).toLocaleTimeString('he-IL',   { hour:'2-digit', minute:'2-digit' }) : '--:--';

  // ׳˜׳¢׳™׳ ׳× ׳˜׳׳₪׳•׳ ׳׳¡׳¢׳“׳”
  useEffect(() => {
    if (!userProfile?.Id || !jobId) return;
    const load = () => api.getWorkerHistory(userProfile.Id)
      .then((data: any[]) => {
        const found = data?.find((j: any) => Number(j.Id) === jobId);
        if (found?.RestaurantPhone) setRestPhone(found.RestaurantPhone);
      }).catch(() => {});
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [jobId, userProfile?.Id]);

  // ׳₪׳•׳׳™׳ ׳’ ׳¨׳׳©׳™ ג€” ׳’׳׳” ׳׳ ׳”׳׳¡׳¢׳“׳” ׳™׳–׳׳” / ׳׳ ׳›׳‘׳¨ active
  // ׳׳™׳ waitingForRestaurant ׳‘deps ג€” ׳”׳₪׳•׳׳™׳ ׳’ ׳׳׳©׳™׳ ׳×׳׳™׳“!
  useEffect(() => {
    if (!jobId) return;
    const check = async () => {
      try {
        const s = await api.getStartStatus(jobId);
        if (s.Status === 'active') {
          startShift();
          navToWorker('active_shift');
        } else if (s.StartInitiatedBy === 'restaurant') {
          setRestInitiated(true);
        }
      } catch {}
    };
    check();
    const iv = setInterval(check, 2500);
    return () => clearInterval(iv);
  }, [jobId]); // ג† ׳¨׳§ jobId, ׳׳ waitingForRestaurant

  const handleInitiate = async () => {
    setInitiating(true); setError('');
    try {
      await api.initiateStart(jobId, 'worker');
      setWaiting(true);
    } catch { setError('׳©׳’׳™׳׳” ׳‘׳©׳׳™׳—׳”, ׳ ׳¡׳” ׳©׳•׳‘'); }
    setInitiating(false);
  };

  const handleConfirm = async () => {
    setConfirming(true); setError('');
    try {
      await api.confirmStart(jobId);
      startShift();
      navToWorker('active_shift');
    } catch {
      // ׳׳ confirmStart ׳ ׳›׳©׳ ג€” ׳׳•׳׳™ ׳›׳‘׳¨ active, ׳‘׳“׳•׳§ ׳•׳ ׳•׳•׳˜
      try {
        const s = await api.getStartStatus(jobId);
        if (s.Status === 'active') { startShift(); navToWorker('active_shift'); return; }
      } catch {}
      setError('׳©׳’׳™׳׳” ג€” ׳ ׳¡׳” ׳©׳•׳‘');
    }
    setConfirming(false);
  };

  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(
    restaurantAddress ? `${restaurantAddress}, ${restaurantCity}` : restaurantCity
  )}&navigate=yes`;

  const phone = restaurantPhone || job?.RestaurantPhone || '';

  return (
    <div className="screen-enter flex flex-col gap-4">
      {/* ׳›׳¨׳˜׳™׳¡ ׳›׳—׳•׳ */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Navigation2 size={22} className="fill-white" />
          </div>
          <div>
            <div className="font-bold">׳‘׳“׳¨׳ ׳׳ {restaurantName}</div>
            <div className="text-blue-100 text-sm">{restaurantCity}</div>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { v: `ג‚×${hourlyRate}`, l: '/׳©׳¢׳”', c: 'text-green-300' },
            { v: startStr, l: '׳”׳×׳—׳׳”', c: 'text-white' },
            { v: endStr,   l: '׳¡׳™׳•׳',   c: 'text-white' },
          ].map(s => (
            <div key={s.l} className="flex-1 bg-white/15 rounded-xl p-3 text-center">
              <div className={`text-lg font-black ${s.c}`}>{s.v}</div>
              <div className="text-blue-100 text-xs">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ׳•׳•׳™׳– + ׳˜׳׳₪׳•׳ */}
      <div className="flex gap-3">
        <a href={wazeUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#05C3F9] text-white rounded-2xl py-4 font-bold shadow-lg"
          style={{ textDecoration: 'none' }}>
          נ—÷ן¸ ׳ ׳•׳•׳˜ ׳‘׳•׳•׳™׳–
        </a>
        {phone ? (
          <a href={`tel:${phone}`}
            className="flex items-center justify-center bg-green-500 text-white rounded-2xl py-4 px-5 shadow-lg"
            style={{ textDecoration: 'none' }}>
            <Phone size={20} />
          </a>
        ) : (
          <div className="flex items-center justify-center bg-gray-100 text-gray-400 rounded-2xl py-4 px-5">
            <Phone size={20} />
          </div>
        )}
      </div>

      {/* ׳©׳’׳™׳׳” */}
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center">{error}</div>}

      {/* ׳₪׳•׳₪׳׳₪ ג€” ׳”׳׳¡׳¢׳“׳” ׳™׳–׳׳” */}
      {restaurantInitiated && !waitingForRestaurant && (
        <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white screen-enter">
          <div className="font-black text-lg mb-1">נ”” {restaurantName} ׳¨׳•׳¦׳” ׳׳”׳×׳—׳™׳!</div>
          <div className="text-green-100 text-sm mb-4">׳”׳׳¡׳¢׳“׳” ׳׳•׳›׳ ׳” ג€” ׳”׳׳ ׳”׳’׳¢׳×?</div>
          <div className="flex gap-3">
            <button onClick={() => setRestInitiated(false)}
              className="flex-1 bg-white/20 rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
              <X size={16} /> ׳¢׳•׳“ ׳׳
            </button>
            <button onClick={handleConfirm} disabled={confirming}
              className="flex-1 bg-white text-green-700 rounded-xl py-3 font-black flex items-center justify-center gap-2">
              {confirming
                ? <div className="w-4 h-4 border-2 border-green-400 border-t-green-700 rounded-full animate-spin" />
                : <><CheckCircle2 size={16} /> ׳׳ ׳™ ׳›׳׳! ׳”׳×׳—׳</>}
            </button>
          </div>
        </div>
      )}

      {/* ׳׳׳×׳™׳ ׳׳׳™׳©׳•׳¨ ׳׳¡׳¢׳“׳” */}
      {waitingForRestaurant && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-2">ג³</div>
          <div className="font-bold text-amber-800">׳׳׳×׳™׳ ׳׳׳™׳©׳•׳¨ {restaurantName}</div>
          <div className="text-amber-600 text-sm mt-1">׳©׳׳—׳ ׳• ׳”׳×׳¨׳׳” ׳׳׳¡׳¢׳“׳”</div>
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      )}

      {/* ׳”׳•׳¨׳׳•׳× */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">נ“ ׳”׳•׳¨׳׳•׳× ׳”׳’׳¢׳”</h3>
        {instructions ? (
          <p className="text-gray-800 text-sm leading-relaxed bg-amber-50 rounded-xl p-3">{instructions}</p>
        ) : (
          <div className="space-y-2">
            {['׳”׳›׳ ׳¡ ׳“׳¨׳ ׳”׳›׳ ׳™׳¡׳” ׳”׳¨׳׳©׳™׳× / ׳׳—׳•׳¨׳™׳×', '׳‘׳§׳© ׳׳× ׳׳ ׳”׳ ׳”׳׳©׳׳¨׳×', '׳׳—׳¥ "׳¦׳³׳§-׳׳™׳" ׳›׳׳', '׳‘׳”׳¦׳׳—׳”! נ‘¨ג€נ³'].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
                <span className="text-gray-700 text-sm">{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ׳›׳₪׳×׳•׳¨ ׳¦'׳§-׳׳™׳ */}
      {!waitingForRestaurant && !restaurantInitiated && (
        <button onClick={handleInitiate} disabled={initiating}
          className="w-full bg-amber-500 text-white rounded-2xl py-4 font-black text-lg shadow-lg shadow-amber-200 active:scale-98 transition-transform">
          {initiating
            ? <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />׳©׳•׳׳—...
              </div>
            : 'נ“ ׳”׳’׳¢׳×׳™ ג€” ׳¦׳³׳§-׳׳™׳'}
        </button>
      )}

      <button onClick={() => navToWorker('home')} className="w-full text-gray-400 text-sm py-1 text-center">׳‘׳™׳˜׳•׳</button>
    </div>
  );
};

