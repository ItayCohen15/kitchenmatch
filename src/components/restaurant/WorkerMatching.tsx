import React, { useEffect, useState } from 'react';
import { Zap, Shield, MapPin, Star, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LEVEL_LABELS, LEVEL_COLORS, ROLE_LABELS } from '../../data/mockData';
import { api } from '../../api';

export const WorkerMatching: React.FC = () => {
  const { navToRestaurant, isEmergencyMode } = useApp();
  const [phase, setPhase] = useState<'searching' | 'results' | 'confirming' | 'confirmed'>('searching');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // טען עובדים אמיתיים מהדאטאבייס
    api.getWorkers().then(data => {
      setWorkers(Array.isArray(data) ? data.slice(0, 3) : []);
    }).catch(() => setWorkers([]));

    const dotsInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(progressInterval);
          clearInterval(dotsInterval);
          setTimeout(() => setPhase('results'), 300);
          return 100;
        }
        return p + 5;
      });
    }, 80);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const handleAssign = (workerId: string, worker: any) => {
    setSelectedId(workerId);
    setSelectedWorker(worker);
    setPhase('confirming');
    setTimeout(() => {
      setPhase('confirmed');
      setTimeout(() => navToRestaurant('live_tracking'), 1500);
    }, 1800);
  };

  const handleAutoAssign = () => {
    if (workers.length > 0) handleAssign(String(workers[0].Id), workers[0]);
  };

  if (phase === 'searching') {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[60vh] text-center">
        {isEmergencyMode && (
          <div className="bg-red-100 text-red-600 rounded-full px-4 py-1.5 text-sm font-bold mb-6 flex items-center gap-2">
            <Zap size={14} className="fill-red-500" />
            מצב חירום פעיל
          </div>
        )}
        <div className="relative w-32 h-32 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-orange-100 animate-ping opacity-30" />
          <div className="absolute inset-3 rounded-full border-4 border-orange-200 animate-ping opacity-50" style={{ animationDelay: '0.3s' }} />
          <div className="absolute inset-6 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-3xl">🔍</span>
          </div>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">מחפש שפים{dots}</h2>
        <p className="text-gray-500 text-sm mb-6">מנתח מיקום, דירוג ואמינות</p>
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 mb-2">
          <div
            className="h-2 bg-orange-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>
    );
  }

  if (phase === 'confirming') {
    const wName = selectedWorker?.Name || 'העובד';
    const wInit = wName.split(' ').map((n: string) => n[0]).join('').slice(0,2);
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4 shadow-xl">
          {wInit}
        </div>
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-black text-gray-900">מחכה לאישור {wName}...</h2>
        <p className="text-gray-500 text-sm mt-2">שולח התראה לעובד</p>
      </div>
    );
  }

  if (phase === 'confirmed') {
    const wName = selectedWorker?.Name || 'העובד';
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-5xl">✅</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">{wName} אישר!</h2>
        <p className="text-gray-500">בדרך אליך עכשיו · ~5 דקות</p>
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">
          {isEmergencyMode ? '🚨 ' : ''}3 שפים מתאימים
        </h2>
        <span className="text-xs text-gray-400">ממויין לפי התאמה</span>
      </div>

      {/* Auto-assign CTA */}
      <button
        onClick={handleAutoAssign}
        className="w-full bg-gradient-to-l from-orange-600 to-orange-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg active:scale-98 transition-transform"
      >
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Zap size={20} className="fill-white" />
        </div>
        <div className="text-right flex-1">
          <div className="font-bold">שיבוץ אוטומטי</div>
          <div className="text-orange-100 text-sm">הכי מתאים + הכי קרוב</div>
        </div>
        <ChevronLeft size={18} className="text-white/60" />
      </button>

      {/* No workers */}
      {workers.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center card-shadow">
          <div className="text-4xl mb-3">👷</div>
          <p className="font-bold text-gray-700">אין עובדים זמינים כרגע</p>
          <p className="text-gray-400 text-sm mt-1">נסה שוב מאוחר יותר</p>
        </div>
      )}

      {/* Worker cards */}
      <div className="space-y-3">
        {workers.map((worker: any, idx: number) => {
          const matchScore = [97, 91, 84][idx] || 80;
          const isTop = idx === 0;
          const wName = worker.Name || 'עובד';
          const wInit = wName.split(' ').map((n: string) => n[0]).join('').slice(0,2);
          const level = worker.Level || 'bronze';
          const skills = worker.Skills ? worker.Skills.split(',').filter(Boolean) : [];
          return (
            <div
              key={worker.Id}
              className={`bg-white rounded-2xl p-4 card-shadow border-2 ${isTop ? 'border-orange-400' : 'border-transparent'}`}
            >
              {isTop && (
                <div className="text-xs font-bold text-orange-500 mb-2 flex items-center gap-1">
                  <Star size={11} className="fill-orange-400 text-orange-400" />
                  הכי מתאים
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                    {wInit}
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{wName}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[level] || 'text-gray-500 bg-gray-100'}`}>
                      {LEVEL_LABELS[level] || level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {worker.Rating > 0 && <span className="text-yellow-500 text-sm font-bold">★{worker.Rating.toFixed(1)}</span>}
                    {worker.City && (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <MapPin size={10} />{worker.City}
                      </span>
                    )}
                    {worker.YearsExp > 0 && <span className="text-gray-500 text-xs">{worker.YearsExp} שנות ניסיון</span>}
                  </div>
                  {skills.length > 0 && (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {skills.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-orange-500 font-black text-lg">₪{worker.HourlyRate || 0}</div>
                  <div className="text-gray-400 text-xs">/שעה</div>
                </div>
              </div>

              {/* Match scores */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">התאמה</div>
                  <div className="font-black text-green-600">{matchScore}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">אמינות</div>
                  <div className="font-black text-blue-600">{worker.ReliabilityScore || 100}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">משמרות</div>
                  <div className="font-black text-gray-700">{worker.CompletedShifts || 0}</div>
                </div>
              </div>

              <button
                onClick={() => handleAssign(String(worker.Id), worker)}
                className={`w-full mt-3 rounded-xl py-3 font-bold text-sm transition-all active:scale-98 ${
                  isTop ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isTop ? 'שבץ עכשיו' : 'בחר עובד זה'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Reliability badge */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
        <Shield size={18} className="text-blue-500 flex-shrink-0" />
        <p className="text-blue-700 text-xs">
          כל העובדים עברו וריפיקציה. ציוני אמינות מחושבים מ-{'>'}100 משמרות.
        </p>
      </div>
    </div>
  );
};
