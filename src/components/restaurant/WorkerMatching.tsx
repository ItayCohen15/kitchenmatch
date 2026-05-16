import React, { useEffect, useState } from 'react';
import { Zap, Shield, MapPin, Star, Check, X, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LEVEL_LABELS, LEVEL_COLORS } from '../../data/mockData';
import { api } from '../../api';

// חישוב אחוז התאמה אמיתי
const calcMatchScore = (worker: any, restaurantCuisine: string): number => {
  let score = 50; // בסיס

  // אמינות (20%)
  const reliability = worker.ReliabilityScore || 100;
  score += (reliability / 100) * 20;

  // משמרות שהושלמו (15%)
  const shifts = Math.min(worker.CompletedShifts || 0, 100);
  score += (shifts / 100) * 15;

  // דירוג (20%)
  const rating = worker.Rating || 0;
  score += (rating / 5) * 20;

  // התאמת כישורים (25%)
  const skills = (worker.Skills || '').toLowerCase();
  const cuisine = restaurantCuisine.toLowerCase();
  if (skills && cuisine) {
    const cuisineWords = cuisine.split(/[,/\s]+/);
    const skillWords = skills.split(/[,/\s]+/);
    const overlap = cuisineWords.filter(w => skillWords.some(s => s.includes(w) || w.includes(s)));
    score += Math.min((overlap.length / Math.max(cuisineWords.length, 1)) * 25, 25);
  }

  return Math.min(Math.round(score), 99);
};

export const WorkerMatching: React.FC = () => {
  const { navToRestaurant, isEmergencyMode, userProfile } = useApp();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [approved, setApproved] = useState<number | null>(null);

  const restaurantCuisine = userProfile?.CuisineType || '';

  useEffect(() => {
    if (!userProfile?.Id) { setLoading(false); return; }
    loadApplicants();
    // רענן כל 10 שניות
    const interval = setInterval(loadApplicants, 10000);
    return () => clearInterval(interval);
  }, [userProfile]);

  const loadApplicants = () => {
    if (!userProfile?.Id) return;
    api.getPendingApplications(userProfile.Id)
      .then(data => setApplicants(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleApprove = async (jobId: number) => {
    setApproving(jobId);
    try {
      await api.approveWorker(jobId);
      setApproved(jobId);
      setTimeout(() => {
        navToRestaurant('live_tracking');
      }, 1500);
    } catch {
      setApproving(null);
    }
  };

  const handleReject = async (jobId: number) => {
    await api.rejectWorker(jobId).catch(() => {});
    setApplicants(prev => prev.filter(a => a.Id !== jobId));
  };

  if (approved !== null) {
    const a = applicants.find(x => x.Id === approved);
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">✅</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">{a?.WorkerName} אושר!</h2>
        <p className="text-gray-500">בדרך אליך עכשיו · ~5 דקות</p>
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">
          {isEmergencyMode ? '🚨 ' : ''}מועמדים למשמרת
        </h2>
        <span className="text-xs text-gray-400">עובדים שנרשמו</span>
      </div>

      {/* הסבר הזרימה */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
        <Clock size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-blue-700 text-xs leading-relaxed">
          <strong>עובדים רואים את המשמרת שלך</strong> ויכולים להגיש מועמדות.
          כשעובד נרשם — תוכל לאשר או לדחות אותו כאן.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">מחפש מועמדים...</p>
        </div>
      )}

      {!loading && applicants.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center card-shadow">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h3 className="font-bold text-gray-800 mb-2">ממתין למועמדים</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            המשמרת פורסמה ועובדים זמינים קרובים יקבלו התראה.
            הם יוכלו להגיש מועמדות ותוכל לאשר מכאן.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-orange-500 text-sm font-semibold">מחפש בזמן אמת...</span>
          </div>
        </div>
      )}

      {/* רשימת מועמדים */}
      <div className="space-y-3">
        {applicants.map((job: any, idx: number) => {
          const matchScore = calcMatchScore(job, restaurantCuisine);
          const isTop = idx === 0;
          const wName = job.WorkerName || 'עובד';
          const wInit = wName.split(' ').map((n: string) => n[0]).join('').slice(0,2);
          const level = job.WorkerLevel || 'bronze';
          const skills = job.Skills ? job.Skills.split(',').filter(Boolean) : [];
          const isApproving = approving === job.Id;

          return (
            <div key={job.Id}
              className={`bg-white rounded-2xl p-4 card-shadow border-2 ${isTop ? 'border-orange-400' : 'border-transparent'}`}>

              {isTop && applicants.length > 1 && (
                <div className="text-xs font-bold text-orange-500 mb-2 flex items-center gap-1">
                  <Star size={11} className="fill-orange-400 text-orange-400" />
                  הכי מתאים לפי כישורים
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
                    {job.WorkerRating > 0 && (
                      <span className="text-yellow-500 text-sm font-bold">★{Number(job.WorkerRating).toFixed(1)}</span>
                    )}
                    {job.WorkerCity && (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <MapPin size={10} />{job.WorkerCity}
                      </span>
                    )}
                    {job.YearsExp > 0 && (
                      <span className="text-gray-500 text-xs">{job.YearsExp} שנות ניסיון</span>
                    )}
                  </div>
                  {skills.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {skills.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-orange-50 text-orange-600 rounded-full px-2 py-0.5">{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-orange-500 font-black text-lg">₪{job.WorkerRate || 0}</div>
                  <div className="text-gray-400 text-xs">/שעה</div>
                </div>
              </div>

              {/* ציוני התאמה אמיתיים */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">התאמה</div>
                  <div className={`font-black text-sm ${matchScore >= 80 ? 'text-green-600' : matchScore >= 60 ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {matchScore}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">אמינות</div>
                  <div className="font-black text-blue-600 text-sm">{job.ReliabilityScore || 100}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">משמרות</div>
                  <div className="font-black text-gray-700 text-sm">{job.CompletedShifts || 0}</div>
                </div>
              </div>

              {/* כפתורי אישור / דחייה */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleReject(job.Id)}
                  disabled={isApproving}
                  className="w-12 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 flex-shrink-0"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => handleApprove(job.Id)}
                  disabled={isApproving}
                  className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isApproving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} />
                      אשר עובד זה
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {applicants.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
          <Shield size={18} className="text-blue-500 flex-shrink-0" />
          <p className="text-blue-700 text-xs">
            אחוז ההתאמה מחושב לפי כישורי העובד, דירוג, אמינות והתאמה לסגנון המטבח שלך.
          </p>
        </div>
      )}
    </div>
  );
};
