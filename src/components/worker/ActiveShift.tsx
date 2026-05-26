import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { Chat } from '../common/Chat';

export const WorkerActiveShift: React.FC = () => {
  const { navToWorker, shiftStartTime, getSelectedJob, userProfile } = useApp();
  const job = getSelectedJob();
  const [elapsed, setElapsed] = useState(0);
  const [workerConfirmed, setWorkerConfirmed] = useState(false);
  const [restaurantConfirmed, setRestaurantConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [bothDone, setBothDone] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const startTime = shiftStartTime || new Date(Date.now() - 30 * 60000);
  const hourlyRate = job ? Number(job.HourlyRate ?? job.hourlyRate ?? 0) : 0;
  const restaurantName: string = job?.RestaurantName || job?.restaurantName || '׳”׳׳¡׳¢׳“׳”';
  const jobId: number = job ? Number(job.Id ?? job.id ?? 0) : 0;
  const [restaurantPhone, setRestaurantPhone] = useState<string>(job?.RestaurantPhone || '');

  useEffect(() => {
    if (!userProfile?.Id || !jobId) return;
    api.getWorkerHistory(userProfile.Id)
      .then((data: any[]) => {
        const found = Array.isArray(data) ? data.find((j: any) => Number(j.Id) === jobId) : null;
        if (found?.RestaurantPhone) setRestaurantPhone(found.RestaurantPhone);
      })
      .catch(() => {});
  }, [jobId, userProfile?.Id]);

  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);


  // ׳‘׳“׳•׳§ ׳¡׳˜׳˜׳•׳¡ ׳׳™׳©׳•׳¨׳™׳ ׳›׳ 8 ׳©׳ ׳™׳•׳×
  useEffect(() => {
    if (!jobId) return;
    const check = async () => {
      try {
        const status = await api.getEndStatus(jobId);
        if (!status || status.error) return;
        setWorkerConfirmed(Boolean(status.WorkerConfirmedEnd));
        setRestaurantConfirmed(Boolean(status.RestaurantConfirmedEnd));
        // ׳׳ ׳©׳ ׳™ ׳”׳¦׳“׳“׳™׳ ׳׳™׳©׳¨׳• ג€” ׳¢׳‘׳•׳¨ ׳׳¡׳™׳•׳
        if (status.Status === 'pending_completion' ||
           (status.WorkerConfirmedEnd && status.RestaurantConfirmedEnd)) {
          setBothDone(true);
        }
      } catch {}
    };
    check();
    const iv = setInterval(check, 5000); // ׳›׳ 5 ׳©׳ ׳™׳•׳× (׳™׳•׳×׳¨ ׳׳”׳™׳¨)
    return () => clearInterval(iv);
  }, [jobId]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  // ׳—׳™׳©׳•׳‘ ׳”׳›׳ ׳¡׳” ׳‘׳–׳׳ ׳׳׳× ׳׳₪׳™ ׳©׳ ׳™׳•׳×
  const hoursWorked = elapsed / 3600;
  const ratePerSecond = hourlyRate / 3600;
  const grossEarned = (hoursWorked * hourlyRate).toFixed(2);
  const netEarned = (hoursWorked * hourlyRate * 0.935).toFixed(2);
  const earnedThisMinute = (ratePerSecond * 60).toFixed(2);
  const QUICK = ['׳‘׳“׳¨׳!', '׳׳•׳›׳ נ‘', '׳¦׳¨׳™׳ ׳¢׳•׳“ ׳—׳•׳׳¨׳™׳', '5 ׳“׳§׳•׳× ׳•׳¢׳•׳“'];

  const handleConfirmEnd = async () => {
    setConfirming(true);
    try {
      const res = await api.workerEndShift(jobId);
      setWorkerConfirmed(true);
      if (res.bothConfirmed) setBothDone(true);
    } catch {}
    setConfirming(false);
    setShowConfirmDialog(false);
  };

  // ׳ ׳™׳•׳•׳˜ ׳׳•׳˜׳•׳׳˜׳™ ׳׳“׳™׳¨׳•׳’ ׳›׳©׳”׳›׳ ׳׳•׳©׳¨
  useEffect(() => {
    if (!bothDone) return;
    const t = setTimeout(() => navToWorker('end_shift'), 2500);
    return () => clearTimeout(t);
  }, [bothDone]);

  if (bothDone) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">נ‰</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">׳©׳ ׳™ ׳”׳¦׳“׳“׳™׳ ׳׳™׳©׳¨׳•!</h2>
        <p className="text-gray-500">׳”׳×׳©׳׳•׳ ׳׳•׳¢׳‘׳¨... ׳¢׳•׳“ ׳¨׳’׳¢ ׳×׳¢׳‘׳•׳¨ ׳׳“׳™׳¨׳•׳’ נ’°</p>
        <div className="bg-green-50 rounded-2xl p-4 w-full text-center">
          <div className="text-3xl font-black text-green-600">ג‚×{netEarned}</div>
          <div className="text-gray-400 text-sm mt-1">׳ ׳˜׳• ׳׳׳—׳¨ ׳¢׳׳׳” 6.5%</div>
        </div>
        <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        <button onClick={() => navToWorker('end_shift')}
          className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg">
          ׳“׳¨׳’ ׳׳× ׳”׳׳¡׳¢׳“׳” ג†’
        </button>
      </div>
    );
  }

  return (
    <div className="screen-enter flex flex-col gap-3">
      {/* Live banner */}
      <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-sm">׳׳©׳׳¨׳× ׳₪׳¢׳™׳׳”</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1">
            <Clock size={14} />
            <span className="font-black text-lg tracking-widest">{fmt(elapsed)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-green-100 text-xs">׳”׳¨׳•׳•׳™׳— ׳¢׳“ ׳›׳” (׳ ׳˜׳•)</div>
            <div className="text-3xl font-black">ג‚×{netEarned}</div>
            <div className="text-green-200 text-xs">׳‘׳¨׳•׳˜׳• ג‚×{grossEarned} ֲ· ג‚×{earnedThisMinute}/׳“׳§׳³</div>
          </div>
          <div className="text-right">
            <div className="text-green-100 text-xs">׳׳¡׳¢׳“׳”</div>
            <div className="font-bold">{restaurantName}</div>
            <div className="text-green-100 text-sm">ג‚×{hourlyRate}/׳©׳³</div>
          </div>
        </div>
      </div>

      {/* ׳›׳₪׳×׳•׳¨ ׳”׳×׳§׳©׳¨׳•׳× ׳׳׳¡׳¢׳“׳” */}
      {restaurantPhone ? (
        <a href={`tel:${restaurantPhone}`}
          className="flex items-center justify-center gap-3 bg-green-500 text-white rounded-2xl py-3.5 font-bold text-base shadow-sm"
          style={{ textDecoration: 'none' }}>
          <Phone size={18} /> ׳”׳×׳§׳©׳¨ ׳{restaurantName}
        </a>
      ) : (
        <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 rounded-2xl py-3 text-sm">
          <Phone size={16} /> ׳”׳׳¡׳¢׳“׳” ׳׳ ׳”׳•׳¡׳™׳₪׳” ׳˜׳׳₪׳•׳
        </div>
      )}

      {/* ׳¡׳˜׳˜׳•׳¡ ׳׳™׳©׳•׳¨׳™׳ */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">׳׳™׳©׳•׳¨׳™ ׳¡׳™׳•׳ ׳׳©׳׳¨׳×</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '׳׳×׳”', confirmed: workerConfirmed },
            { label: restaurantName, confirmed: restaurantConfirmed },
          ].map(side => (
            <div key={side.label} className={`rounded-xl p-3 text-center border-2 transition-all ${
              side.confirmed ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="text-2xl mb-1">{side.confirmed ? 'ג…' : 'ג³'}</div>
              <div className={`text-xs font-bold truncate ${side.confirmed ? 'text-green-600' : 'text-gray-400'}`}>
                {side.label}
              </div>
              <div className={`text-xs ${side.confirmed ? 'text-green-500' : 'text-gray-400'}`}>
                {side.confirmed ? '׳׳™׳©׳¨' : '׳׳׳×׳™׳'}
              </div>
            </div>
          ))}
        </div>
        {!workerConfirmed && restaurantConfirmed && (
          <p className="text-center text-xs text-blue-700 mt-2 bg-blue-50 rounded-lg p-2 font-semibold">
            נ’¡ {restaurantName} ׳›׳‘׳¨ ׳׳™׳©׳¨! ׳׳©׳¨ ׳’׳ ׳׳×׳” ׳׳§׳‘׳ ׳×׳©׳׳•׳.
          </p>
        )}
        {workerConfirmed && !restaurantConfirmed && (
          <p className="text-center text-xs text-amber-700 mt-2 bg-amber-50 rounded-lg p-2">
            ג³ ׳׳׳×׳™׳ ׳׳׳™׳©׳•׳¨ {restaurantName}...
          </p>
        )}
      </div>

      {/* Chat ׳׳׳™׳×׳™ */}
      <Chat jobId={jobId} myRole="worker" myName={userProfile?.Name || '׳¢׳•׳‘׳“'} />

      {/* ׳›׳₪׳×׳•׳¨ ׳¡׳™׳•׳ */}
      {!workerConfirmed ? (
        !showConfirmDialog ? (
          <button onClick={() => setShowConfirmDialog(true)}
            className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold text-lg active:scale-98 transition-transform">
            נ ׳¡׳™׳™׳ ׳׳©׳׳¨׳×
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-4 card-shadow space-y-3 screen-enter">
            <h3 className="font-bold text-gray-900 text-center">׳‘׳˜׳•׳— ׳©׳×׳¨׳¦׳” ׳׳¡׳™׳™׳?</h3>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <div className="text-xl font-black text-green-600">ג‚×{netEarned} ׳ ׳˜׳•</div>
              <div className="text-gray-400 text-xs">׳™׳•׳¢׳‘׳¨ ׳׳׳—׳¨ ׳׳™׳©׳•׳¨ ׳©׳ ׳™ ׳”׳¦׳“׳“׳™׳</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmDialog(false)}
                className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-3 font-semibold">
                ׳”׳׳©׳ ׳׳¢׳‘׳•׳“
              </button>
              <button onClick={handleConfirmEnd} disabled={confirming}
                className="flex-1 bg-green-500 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2">
                {confirming
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><CheckCircle2 size={16} /> ׳׳©׳¨ ׳¡׳™׳•׳</>}
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <CheckCircle2 size={22} className="text-green-500 mx-auto mb-1" />
          <p className="font-bold text-green-700 text-sm">׳׳™׳©׳¨׳× ׳¡׳™׳•׳ ג…</p>
          <p className="text-green-600 text-xs mt-0.5">׳׳׳×׳™׳ ׳׳׳™׳©׳•׳¨ {restaurantName}</p>
        </div>
      )}
    </div>
  );
};

