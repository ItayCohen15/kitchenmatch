import React, { useState } from 'react';
import { MapPin, Clock, Star, Shield, ChevronRight, Zap, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NEARBY_JOBS, ROLE_LABELS, EXPERIENCE_LABELS } from '../../data/mockData';

export const JobDetails: React.FC = () => {
  const { navToWorker, getSelectedJob } = useApp();
  const job = getSelectedJob() || NEARBY_JOBS[0];
  const [declining, setDeclining] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const hours = (() => {
    const [sh, sm] = job.startTime.split(':').map(Number);
    const [eh, em] = job.endTime.split(':').map(Number);
    let d = (eh * 60 + em) - (sh * 60 + sm);
    if (d < 0) d += 1440;
    return (d / 60).toFixed(1);
  })();
  const totalPay = (parseFloat(hours) * job.hourlyRate).toFixed(0);
  const netPay = (parseFloat(totalPay) * 0.9).toFixed(0);

  const handleAccept = () => {
    setAccepting(true);
    setTimeout(() => {
      setAccepted(true);
      setTimeout(() => navToWorker('navigation'), 1500);
    }, 1500);
  };

  if (accepted) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">🎉</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">אישרת את המשמרת!</h2>
        <p className="text-gray-500">ניווט אל {job.restaurantName} מתחיל...</p>
      </div>
    );
  }

  if (accepting) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        <h2 className="text-xl font-black text-gray-900">שולח אישור...</h2>
        <p className="text-gray-500">מחכים לאישור המסעדה</p>
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      {/* Header */}
      <div className={`rounded-2xl p-5 text-white ${job.isEmergency ? 'bg-gradient-to-l from-red-600 to-red-500' : 'bg-gradient-to-l from-orange-600 to-orange-500'}`}>
        {job.isEmergency && (
          <div className="flex items-center gap-2 mb-3 bg-white/20 rounded-lg px-3 py-1.5 w-fit">
            <Zap size={14} className="fill-white" />
            <span className="text-sm font-bold">חירום – דרוש תוך 30 דק׳</span>
          </div>
        )}
        <h2 className="text-2xl font-black mb-1">{job.restaurantName}</h2>
        <div className="flex items-center gap-2 text-orange-100 text-sm mb-4">
          <MapPin size={14} />
          {job.restaurantAddress}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="font-black text-xl">₪{job.hourlyRate}</div>
            <div className="text-orange-100 text-xs">/שעה</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="font-black text-xl">{hours}</div>
            <div className="text-orange-100 text-xs">שעות</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="font-black text-xl text-green-300">₪{netPay}</div>
            <div className="text-orange-100 text-xs">נטו</div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
        {[
          { label: 'תפקיד', value: ROLE_LABELS[job.role] },
          { label: 'שעות', value: `${job.startTime} – ${job.endTime}` },
          { label: 'תאריך', value: job.date },
          { label: 'ניסיון נדרש', value: EXPERIENCE_LABELS[job.experienceRequired] },
        ].map(d => (
          <div key={d.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <span className="text-gray-500 text-sm">{d.label}</span>
            <span className="font-semibold text-gray-900 text-sm">{d.value}</span>
          </div>
        ))}
        {job.description && (
          <div className="pt-1">
            <div className="text-gray-500 text-sm mb-1">תיאור</div>
            <div className="text-gray-800 text-sm leading-relaxed">{job.description}</div>
          </div>
        )}
      </div>

      {/* Required skills */}
      {job.requiredSkills.length > 0 && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">כישורים נדרשים</h3>
          <div className="flex gap-2 flex-wrap">
            {job.requiredSkills.map(s => (
              <span key={s} className="bg-orange-50 text-orange-600 rounded-full px-3 py-1.5 text-sm font-medium">
                ✓ {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Restaurant reputation */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">אודות המסעדה</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-sm">
            {job.restaurantName.slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{job.restaurantName}</div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                <Star size={12} className="fill-yellow-400" />
                4.6
              </span>
              <span className="text-gray-400 text-xs">87 משמרות פורסמו</span>
              <span className="flex items-center gap-1 text-green-600 text-xs">
                <Shield size={10} />
                מאומת
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
        💰 <strong>תשלום מובטח</strong> – הכסף יועבר לארנק שלך תוך 24 שעות מסיום המשמרת.
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pb-2">
        {declining ? (
          <div className="flex-1 bg-gray-100 rounded-2xl p-4 screen-enter">
            <div className="text-center font-bold text-gray-800 mb-3 text-sm">סיבת דחייה</div>
            {['לא פנוי בשעות', 'הקילומטראז׳ רחוק מדי', 'השכר לא מתאים', 'אחר'].map(r => (
              <button
                key={r}
                onClick={() => { setDeclining(false); navToWorker('home'); }}
                className="w-full text-right py-2.5 px-3 mb-2 bg-white rounded-xl text-gray-700 text-sm border border-gray-100"
              >
                {r}
              </button>
            ))}
            <button onClick={() => setDeclining(false)} className="w-full text-gray-400 text-sm">ביטול</button>
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
                job.isEmergency ? 'bg-red-500 shadow-red-200' : 'bg-orange-500 shadow-orange-200'
              }`}
            >
              {job.isEmergency ? '🚨 קבל חירום' : '✓ קבל משמרת'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
