import React, { useEffect, useState, useCallback } from 'react';
import { Shield, MapPin, Star, Check, X, Clock, RefreshCw, Phone, Trash2, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LEVEL_LABELS, LEVEL_COLORS } from '../../data/mockData';
import { api } from '../../api';
import { CancelShiftModal } from '../common/CancelShiftModal';
import { WorkerProfileModal } from '../common/WorkerProfileModal';
import { getLevel } from '../../utils/levels';

// חישוב אחוז התאמה אמיתי (כולל חשיפה לפי רמה)
const calcMatchScore = (worker: any, restaurantCuisine: string): number => {
  let score = 35;
  score += Math.min(((worker.ReliabilityScore || 100) / 100) * 18, 18);
  score += Math.min((Math.min(worker.CompletedShifts || 0, 100) / 100) * 12, 12);
  score += ((worker.WorkerRating || worker.Rating || 0) / 5) * 20;
  // חשיפה לפי רמה: דיימונד מקבל בונוס גבוה יותר
  const exposure = getLevel(worker.WorkerLevel || worker.Level).exposure; // 1-5
  score += exposure * 2; // עד 10 נק׳
  if (restaurantCuisine && worker.Skills) {
    const cuisineWords = restaurantCuisine.toLowerCase().split(/[,/\s·]+/).filter((x: string) => Boolean(x));
    const skillWords = (worker.Skills || '').toLowerCase().split(/[,/\s·]+/).filter((x: string) => Boolean(x));
    const overlap = cuisineWords.filter((w: string) => skillWords.some((s: string) => s.includes(w) || w.includes(s)));
    score += Math.min((overlap.length / Math.max(cuisineWords.length, 1)) * 23, 23);
  }
  return Math.min(Math.round(score), 99);
};

export const WorkerMatching: React.FC = () => {
  const { navToRestaurant, userProfile, selectWorkerJob } = useApp();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionJobId, setActionJobId] = useState<number | null>(null);
  const [approved, setApproved] = useState<any>(null);
  const [error, setError] = useState('');
  const [openJob, setOpenJob] = useState<any>(null);   // משמרת פתוחה (searching) לביטול
  const [showCancel, setShowCancel] = useState(false);
  const [viewWorker, setViewWorker] = useState<any>(null);  // צפייה בפרופיל מועמד
  const restaurantCuisine = userProfile?.CuisineType || '';

  const loadApplicants = useCallback(() => {
    if (!userProfile?.Id) { setLoading(false); return; }
    api.getPendingApplications(userProfile.Id)
      .then(data => {
        setApplicants(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch(() => setError('שגיאה בטעינת המועמדים'))
      .finally(() => setLoading(false));
    // טען גם את המשמרת הפתוחה (לביטול ללא קנס)
    api.getRestaurantJobs(userProfile.Id)
      .then((data: any[]) => {
        const open = Array.isArray(data)
          ? data.find(j => j.Status === 'searching' || j.Status === 'pending_approval')
          : null;
        setOpenJob(open || null);
      })
      .catch(() => {});
  }, [userProfile?.Id]);

  useEffect(() => {
    loadApplicants();
    const interval = setInterval(loadApplicants, 8000);
    return () => clearInterval(interval);
  }, [loadApplicants]);

  const handleApprove = async (job: any) => {
    if (!job?.Id || !job?.WorkerId) { setError('נתוני משמרת חסרים'); return; }
    setActionJobId(job.Id);
    setError('');
    try {
      await api.approveWorker(job.Id);
      // שמור את המשמרת בcontext כדי שמסך המשמרת הפעילה יקבל את הנתונים
      selectWorkerJob(String(job.Id), {
        Id: job.Id,
        RestaurantId: job.RestaurantId,
        WorkerId: job.WorkerId,
        WorkerName: job.WorkerName,
        Role: job.Role,
        StartTime: job.StartTime,
        EndTime: job.EndTime,
        HourlyRate: job.HourlyRate,
        RestaurantName: userProfile?.Name || 'המסעדה',
        RestaurantCity: userProfile?.City || '',
        Status: 'confirmed',
      });
      setApproved(job);
      setTimeout(() => navToRestaurant('live_tracking'), 1800);
    } catch (e) {
      setError('שגיאה באישור העובד. נסה שוב.');
      setActionJobId(null);
    }
  };

  const handleReject = async (job: any) => {
    setActionJobId(job.Id);
    try {
      await api.rejectWorker(job.Id);
      setApplicants(prev => prev.filter(a => a.Id !== job.Id));
    } catch {
      setError('שגיאה בדחיית העובד');
    } finally {
      setActionJobId(null);
    }
  };

  if (approved) {
    const wName = approved.WorkerName || 'העובד';
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">✅</span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">{wName} אושר!</h2>
        <p className="text-gray-500">עובד על הדרך אליך · עוקב אחר מיקומו...</p>
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">מועמדים למשמרת</h2>
        <button onClick={loadApplicants} className="text-gray-400 p-1 rounded-lg">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ביטול משמרת פתוחה — ללא קנס (טרם אושר עובד) */}
      {openJob && (
        <button onClick={() => setShowCancel(true)}
          className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-100 text-red-500 rounded-xl py-2.5 font-semibold text-sm active:bg-red-100">
          <Trash2 size={15} /> בטל משמרת זו
        </button>
      )}

      {/* הסבר הזרימה */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
        <Clock size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-blue-700 text-xs leading-relaxed">
          <strong>הזרימה:</strong> עובדים רואים את המשמרת ומגישים מועמדות.
          כשנרשם עובד — תוכל לאשר או לדחות. לאחר אישור הוא יגיע אליך.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm text-center">{error}</div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">טוען מועמדים...</p>
        </div>
      )}

      {!loading && applicants.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center card-shadow">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h3 className="font-bold text-gray-800 mb-2">ממתין למועמדים</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            המשמרת פורסמה. עובדים זמינים יוכלו לראות אותה ולהגיש מועמדות.
            <br />הדף מתרענן אוטומטית כל 8 שניות.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-amber-500 text-sm font-semibold">מחפש בזמן אמת</span>
          </div>
        </div>
      )}

      {/* רשימת מועמדים — ממוין לפי אחוז התאמה (חשיפה לפי רמה) */}
      <div className="space-y-3">
        {[...applicants]
          .map(job => ({ job, score: calcMatchScore(job, restaurantCuisine) }))
          .sort((a, b) => b.score - a.score)
          .map(({ job, score: matchScore }, idx: number) => {
          const isFirst = idx === 0;
          const wName = job.WorkerName || 'עובד';
          const wInit = wName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
          const level = job.WorkerLevel || 'bronze';
          const skills = job.Skills ? job.Skills.split(',').filter(Boolean) : [];
          const isActioning = actionJobId === job.Id;

          return (
            <div key={job.Id}
              className={`bg-white rounded-2xl p-4 card-shadow border-2 ${isFirst ? 'border-amber-400' : 'border-transparent'}`}>

              {isFirst && applicants.length > 1 && (
                <div className="text-xs font-bold text-amber-500 mb-2 flex items-center gap-1">
                  <Star size={11} className="fill-orange-400 text-amber-400" />
                  הכי מתאים
                </div>
              )}

              {/* פרטי עובד — לחיצה פותחת פרופיל מלא */}
              <div className="flex items-start gap-3 mb-3 cursor-pointer"
                onClick={() => setViewWorker(job)}>
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-lg">
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
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-sm">
                    {(job.WorkerRating || 0) > 0 && (
                      <span className="text-yellow-500 font-bold">★{Number(job.WorkerRating).toFixed(1)}</span>
                    )}
                    {job.WorkerCity && (
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <MapPin size={10} />{job.WorkerCity}
                      </span>
                    )}
                    {(job.YearsExp || 0) > 0 && (
                      <span className="text-gray-500 text-xs">{job.YearsExp} שנ׳ ניסיון</span>
                    )}
                  </div>
                  {skills.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {skills.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-amber-50 text-amber-600 rounded-full px-2 py-0.5">{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  {(job.WorkerRating || 0) > 0 ? (
                    <>
                      <div className="text-yellow-500 font-black text-lg">★{Number(job.WorkerRating).toFixed(1)}</div>
                      <div className="text-gray-400 text-xs">דירוג</div>
                    </>
                  ) : (
                    <div className="text-gray-300 text-xs font-semibold">עובד חדש</div>
                  )}
                </div>
              </div>

              {/* ציוני התאמה */}
              <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-gray-50 mb-3">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-0.5">התאמה</div>
                  <div className={`font-black text-sm ${matchScore >= 75 ? 'text-green-600' : matchScore >= 55 ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {matchScore}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-0.5">אמינות</div>
                  <div className="font-black text-blue-600 text-sm">{job.ReliabilityScore || 100}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-0.5">משמרות</div>
                  <div className="font-black text-gray-700 text-sm">{job.CompletedShifts || 0}</div>
                </div>
              </div>

              {/* טלפון העובד */}
              {job.WorkerPhone && (
                <a href={`tel:${job.WorkerPhone}`}
                  className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl py-2 mb-2 text-green-700 font-semibold text-sm">
                  <Phone size={14} /> {job.WorkerPhone}
                </a>
              )}

              {/* צפייה בפרופיל מלא */}
              <button onClick={() => setViewWorker(job)}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-150 rounded-xl py-2 mb-2 text-gray-600 font-semibold text-sm"
                style={{ borderColor:'#e5e7eb' }}>
                <Eye size={15} /> צפה בפרופיל המלא
              </button>

              {/* כפתורים */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(job)}
                  disabled={isActioning}
                  className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 flex-shrink-0 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => handleApprove(job)}
                  disabled={isActioning}
                  className="flex-1 bg-amber-500 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 transition-all"
                >
                  {isActioning ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Check size={16} /> אשר {wName}</>
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
            אחוז ההתאמה מחושב לפי כישורי העובד, דירוג, אמינות, ומספר משמרות שהושלמו.
          </p>
        </div>
      )}

      {showCancel && openJob && (
        <CancelShiftModal
          jobId={Number(openJob.Id)}
          cancelledBy="restaurant"
          startTime={openJob.StartTime}
          isConfirmed={false}
          onClose={() => setShowCancel(false)}
          onCancelled={() => { setShowCancel(false); navToRestaurant('home'); }}
        />
      )}

      {viewWorker && (
        <WorkerProfileModal
          workerId={Number(viewWorker.WorkerId)}
          initial={viewWorker}
          onClose={() => setViewWorker(null)}
        />
      )}
    </div>
  );
};
