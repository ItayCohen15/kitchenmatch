import React, { useState, useEffect } from 'react';
import { Zap, ChefHat, CheckCircle, Star, LogOut, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { CancelShiftModal } from '../common/CancelShiftModal';
import { NewWorkerBadge } from '../common/NewWorkerBadge';
import { UnreadChatBanner } from '../common/ChatsScreen';
import { isWithinKm } from '../../utils/cities';

export const RestaurantHome: React.FC = () => {
  const { navToRestaurant, navToWorker, userProfile, resetToLanding, selectWorkerJob, refreshProfile, setEmergencyMode } = useApp();
  const [workers, setWorkers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [cancelJob, setCancelJob] = useState<any>(null);

  const name = userProfile?.Name || 'המסעדה שלי';
  const city = userProfile?.City || '';
  const initials = name.split(' ').slice(0,2).map((n: string) => n[0]).join('');
  const walletBalance = userProfile?.WalletBalance || 0;
  const rating = userProfile?.Rating || 0;

  useEffect(() => {
    // עובדים — רענון חד פעמי (שומרים את כולם, מסננים לפי אזור בהמשך)
    api.getWorkers()
      .then(data => setWorkers(Array.isArray(data) ? data : []))
      .catch(() => setWorkers([]))
      .finally(() => setLoadingWorkers(false));
  }, [userProfile]);

  // עובדים זמינים באזור המסעדה (עד 30 ק"מ), ממוינים לפי דירוג — מציגים את 3 הגבוהים
  const RADIUS_KM = 30;
  const areaWorkers = workers
    .filter(w => isWithinKm(city, w.City, RADIUS_KM))
    .sort((a, b) => (b.Rating || 0) - (a.Rating || 0));
  const topWorkers = areaWorkers.slice(0, 3);
  const areaCount = areaWorkers.length;

  // רענן פרופיל מסעדה (ארנק/דירוג) מהשרת בכניסה למסך
  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  // משמרות + משמרת פעילה — רענון כל 5 שניות
  useEffect(() => {
    if (!userProfile?.Id) return;
    const load = () => {
      api.getRestaurantJobs(userProfile.Id)
        .then(data => {
          // סטאז'ים מנוהלים במסך נפרד — לא נספרים כמשמרת פעילה/אחרונה
          const all = (Array.isArray(data) ? data : []).filter((j: any) => !['stage', 'stage_shift'].includes(j.JobType));
          const active = all.find((j: any) => ['confirmed','active','pending_completion'].includes(j.Status));
          setActiveShift(active || null);
          setRecentJobs(all.filter((j: any) => !['confirmed','active','pending_completion'].includes(j.Status)).slice(0, 3));
        })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [userProfile?.Id]);

  const handleEnterActiveShift = () => {
    if (!activeShift) return;
    selectWorkerJob(String(activeShift.Id), {
      ...activeShift,
      RestaurantName: name,
      RestaurantCity: city,
    });
    if (activeShift.Status === 'confirmed') {
      navToRestaurant('live_tracking');
    } else {
      navToRestaurant('active_shift');
    }
  };

  return (
    <div className="screen-enter space-y-4 pb-2">
      {/* Header */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1420 0%, #1a2744 60%, #0f2444 100%)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-black text-lg">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg leading-tight">{name}</div>
            <div className="text-amber-100 text-sm">{city}</div>
          </div>
          <div className="flex items-center gap-2">
            {rating > 0 && (
              <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1">
                <Star size={12} className="text-yellow-300 fill-yellow-300" />
                <span className="text-sm font-bold">{rating.toFixed(1)}</span>
              </div>
            )}
            <button onClick={resetToLanding} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'ארנק', value: `₪${walletBalance.toLocaleString()}`, icon: '💳' },
            { label: 'משמרות', value: `${recentJobs.length}`, icon: '📋' },
            { label: 'עובדים זמינים', value: `${areaCount}`, icon: '👷' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-black text-base">{s.value}</div>
              <div className="text-amber-100 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* הודעה חדשה בצ'אט */}
      <UnreadChatBanner role="restaurant"
        onOpen={(jobId) => { try { localStorage.setItem('km_open_chat', String(jobId)); } catch {} navToRestaurant('chats'); }} />

      {/* משמרת פעילה */}
      {activeShift && (
        <div className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-sm">
              {activeShift.Status === 'active' ? 'משמרת פעילה עכשיו' :
               activeShift.Status === 'confirmed' ? '✅ עובד אושר — ממתין להגעה' :
               '⏳ ממתין לאישור סיום'}
            </span>
          </div>
          <div className="font-black text-lg">{activeShift.WorkerName || 'עובד'}</div>
          <div className="text-green-100 text-sm mb-3">
            {ROLE_LABELS[activeShift.Role] || activeShift.Role} · ₪{activeShift.HourlyRate}/ש׳
          </div>
          <button onClick={handleEnterActiveShift}
            className="w-full bg-white text-green-700 rounded-xl py-2.5 font-black text-sm">
            {activeShift.Status === 'confirmed' ? 'מעקב עובד ›' : 'כנס למשמרת ›'}
          </button>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="font-bold text-gray-800 mb-3 text-base">פעולות מהירות</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setEmergencyMode(false); navToRestaurant('create_job'); }}
            className="text-white rounded-2xl p-4 text-right active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow: '0 4px 20px rgba(232,160,32,0.4)' }}
          >
            <ChefHat size={24} className="mb-2" />
            <div className="font-black">פרסם משמרת</div>
            <div className="text-white/75 text-xs mt-0.5">מצא עובד עכשיו</div>
          </button>
          <button
            onClick={() => { setEmergencyMode(true); navToRestaurant('create_job'); }}
            className="text-white rounded-2xl p-4 text-right active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}
          >
            <div className="flex items-center gap-1 mb-2">
              <Zap size={18} className="fill-white" />
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">חירום</span>
            </div>
            <div className="font-black">מצב חירום</div>
            <div className="text-white/75 text-xs mt-0.5">עובד תוך 30 דקות</div>
          </button>
        </div>
      </div>

      {/* Available workers nearby */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 text-base">עובדים זמינים באזורך ({areaCount})</h2>
          <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
            עד 30 ק״מ
          </span>
        </div>
        {loadingWorkers && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!loadingWorkers && areaWorkers.length === 0 && (
          <div className="bg-white rounded-xl p-4 text-center card-shadow">
            <p className="text-gray-400 text-sm">אין עובדים זמינים באזורך כרגע</p>
          </div>
        )}
        <div className="space-y-2">
          {topWorkers.map((w: any) => {
            const wName = w.Name || 'עובד';
            const wInitials = wName.split(' ').map((n: string) => n[0]).join('').slice(0,2);
            return (
              <div key={w.Id} className="bg-white rounded-xl p-3 flex items-center gap-3 card-shadow">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {wInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{wName}</span>
                    <NewWorkerBadge completedShifts={w.CompletedShifts} size="sm" />
                    {w.Rating > 0 && <span className="text-xs text-yellow-500 font-bold">★{w.Rating.toFixed(1)}</span>}
                  </div>
                  <div className="text-gray-500 text-xs">{w.City} · {ROLE_LABELS[w.Role] || w.Role}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" /> זמין
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <h2 className="font-bold text-gray-800 mb-3 text-base">משמרות אחרונות</h2>
        {recentJobs.length === 0 ? (
          <div className="bg-white rounded-xl p-4 text-center card-shadow">
            <p className="text-gray-400 text-sm">טרם פרסמת משמרות</p>
            <button onClick={() => navToRestaurant('create_job')} className="text-amber-500 text-sm font-semibold mt-2">
              פרסם משמרת ראשונה
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((j: any) => (
              <div key={j.Id} className="bg-white rounded-xl p-3 flex items-center gap-3 card-shadow">
                <CheckCircle size={18} className={`flex-shrink-0 ${j.Status === 'completed' ? 'text-green-500' : j.Status === 'cancelled' ? 'text-red-400' : 'text-amber-400'}`} />
                <div className="flex-1">
                  <span className="font-semibold text-gray-800 text-sm">{ROLE_LABELS[j.Role] || j.Role}</span>
                  <span className="text-gray-400 text-xs"> · {j.Status === 'searching' ? 'מחפש' : j.Status === 'completed' ? 'הושלם' : j.Status === 'cancelled' ? 'בוטל' : j.Status}</span>
                </div>
                <div className="text-right">
                  <div className="text-gray-700 font-bold text-sm">₪{j.HourlyRate}/ש׳</div>
                  {j.TotalPay && <div className="text-green-600 text-xs">₪{j.TotalPay} סה״כ</div>}
                </div>
                {j.Status === 'searching' && (
                  <button onClick={() => setCancelJob(j)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 text-red-400 active:bg-red-100"
                    title="בטל משמרת">
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {cancelJob && (
        <CancelShiftModal
          jobId={Number(cancelJob.Id)}
          cancelledBy="restaurant"
          startTime={cancelJob.StartTime}
          isConfirmed={false}
          onClose={() => setCancelJob(null)}
          onCancelled={() => {
            setCancelJob(null);
            setRecentJobs(prev => prev.map(j =>
              j.Id === cancelJob.Id ? { ...j, Status: 'cancelled' } : j));
          }}
        />
      )}
    </div>
  );
};
