import React, { useEffect, useState } from 'react';
import { Zap, Shield, MapPin, Star, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WORKERS, LEVEL_LABELS, LEVEL_COLORS, ROLE_LABELS } from '../../data/mockData';

const TOP_WORKERS = WORKERS.slice(0, 3);

export const WorkerMatching: React.FC = () => {
  const { navToRestaurant, isEmergencyMode } = useApp();
  const [phase, setPhase] = useState<'searching' | 'results' | 'confirming' | 'confirmed'>('searching');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
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

  const handleAssign = (workerId: string) => {
    setSelectedId(workerId);
    setPhase('confirming');
    setTimeout(() => {
      setPhase('confirmed');
      setTimeout(() => navToRestaurant('live_tracking'), 1500);
    }, 1800);
  };

  const handleAutoAssign = () => {
    handleAssign(TOP_WORKERS[0].id);
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
    const worker = TOP_WORKERS.find(w => w.id === selectedId)!;
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4 shadow-xl"
          style={{ backgroundColor: worker.avatarColor }}>
          {worker.initials}
        </div>
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-black text-gray-900">מחכה לאישור {worker.name}...</h2>
        <p className="text-gray-500 text-sm mt-2">שולח התראה לשף</p>
      </div>
    );
  }

  if (phase === 'confirmed') {
    const worker = TOP_WORKERS.find(w => w.id === selectedId)!;
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-5xl">✅</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">{worker.name} אישר!</h2>
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

      {/* Worker cards */}
      <div className="space-y-3">
        {TOP_WORKERS.map((worker, idx) => {
          const matchScore = [97, 91, 84][idx];
          const isTop = idx === 0;
          return (
            <div
              key={worker.id}
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
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                    style={{ backgroundColor: worker.avatarColor }}
                  >
                    {worker.initials}
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{worker.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[worker.level]}`}>
                      {LEVEL_LABELS[worker.level]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-yellow-500 text-sm font-bold">★{worker.rating}</span>
                    <span className="text-gray-400 text-xs">({worker.reviewCount})</span>
                    <span className="flex items-center gap-1 text-gray-500 text-xs">
                      <MapPin size={10} />
                      {worker.distanceKm} ק״מ
                    </span>
                    <span className="text-gray-500 text-xs">{worker.yearsExp} שנות ניסיון</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {worker.skills.slice(0, 3).map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-orange-500 font-black text-lg">₪{worker.hourlyRate}</div>
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
                  <div className="font-black text-blue-600">{worker.reliabilityScore}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">משמרות</div>
                  <div className="font-black text-gray-700">{worker.completedShifts}</div>
                </div>
              </div>

              <button
                onClick={() => handleAssign(worker.id)}
                className={`w-full mt-3 rounded-xl py-3 font-bold text-sm transition-all active:scale-98 ${
                  isTop
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700'
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
