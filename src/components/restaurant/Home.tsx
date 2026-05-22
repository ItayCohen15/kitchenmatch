import React, { useState, useEffect } from 'react';
import { Zap, ChefHat, CheckCircle, Star, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';

export const RestaurantHome: React.FC = () => {
  const { navToRestaurant, navToWorker, userProfile, resetToLanding, selectWorkerJob } = useApp();
  const [workers, setWorkers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  const name = userProfile?.Name || 'המסעדה שלי';
  const city = userProfile?.City || '';
  const initials = name.split(' ').slice(0,2).map((n: string) => n[0]).join('');
  const walletBalance = userProfile?.WalletBalance || 0;
  const rating = userProfile?.Rating || 0;

  useEffect(() => {
    api.getWorkers()
      .then(data => setWorkers(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setWorkers([]))
      .finally(() => setLoadingWorkers(false));

    if (userProfile?.Id) {
      api.getRestaurantJobs(userProfile.Id)
        .then(data => {
          const all = Array.isArray(data) ? data : [];
          // מצא משמרת פעילה/מאושרת
          const active = all.find((j: any) => ['confirmed','active','pending_completion'].includes(j.Status));
          setActiveShift(active || null);
          setRecentJobs(all.filter((j: any) => !['confirmed','active','pending_completion'].includes(j.Status)).slice(0, 3));
        })
        .catch(() => setRecentJobs([]));
    }
  }, [userProfile]);

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
      <div className="bg-gradient-to-l from-orange-600 to-orange-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-black text-lg">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg leading-tight">{name}</div>
            <div className="text-orange-100 text-sm">{city}</div>
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
            { label: 'עובדים זמינים', value: `${workers.length}`, icon: '👷' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-black text-base">{s.value}</div>
              <div className="text-orange-100 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

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
            {activeShift.Role} · ₪{activeShift.HourlyRate}/ש׳
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
            onClick={() => navToRestaurant('create_job')}
            className="bg-orange-500 text-white rounded-2xl p-4 text-right shadow-md active:scale-95 transition-transform"
          >
            <ChefHat size={24} className="mb-2" />
            <div className="font-bold">פרסם משמרת</div>
            <div className="text-orange-100 text-xs mt-0.5">מצא עובד עכשיו</div>
          </button>
          <button
            onClick={() => { navToRestaurant('create_job'); }}
            className="bg-red-500 text-white rounded-2xl p-4 text-right shadow-md active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-1 mb-2">
              <Zap size={18} className="fill-white" />
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">חירום</span>
            </div>
            <div className="font-bold">מצב חירום</div>
            <div className="text-red-100 text-xs mt-0.5">עובד תוך 30 דקות</div>
          </button>
        </div>
      </div>

      {/* Available workers nearby */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 text-base">עובדים זמינים</h2>
          <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
            {workers.length} זמינים
          </span>
        </div>
        {loadingWorkers && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!loadingWorkers && workers.length === 0 && (
          <div className="bg-white rounded-xl p-4 text-center card-shadow">
            <p className="text-gray-400 text-sm">אין עובדים זמינים כרגע</p>
          </div>
        )}
        <div className="space-y-2">
          {workers.map((w: any) => {
            const wName = w.Name || 'עובד';
            const wInitials = wName.split(' ').map((n: string) => n[0]).join('').slice(0,2);
            return (
              <div key={w.Id} className="bg-white rounded-xl p-3 flex items-center gap-3 card-shadow">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {wInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{wName}</span>
                    {w.Rating > 0 && <span className="text-xs text-yellow-500 font-bold">★{w.Rating.toFixed(1)}</span>}
                  </div>
                  <div className="text-gray-500 text-xs">{w.City} · {w.Role}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-orange-500 font-bold text-sm">₪{w.HourlyRate}/ש׳</div>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-auto mt-1" />
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
            <button onClick={() => navToRestaurant('create_job')} className="text-orange-500 text-sm font-semibold mt-2">
              פרסם משמרת ראשונה
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((j: any) => (
              <div key={j.Id} className="bg-white rounded-xl p-3 flex items-center gap-3 card-shadow">
                <CheckCircle size={18} className={`flex-shrink-0 ${j.Status === 'completed' ? 'text-green-500' : 'text-orange-400'}`} />
                <div className="flex-1">
                  <span className="font-semibold text-gray-800 text-sm">{ROLE_LABELS[j.Role] || j.Role}</span>
                  <span className="text-gray-400 text-xs"> · {j.Status === 'searching' ? 'מחפש' : j.Status === 'completed' ? 'הושלם' : j.Status}</span>
                </div>
                <div className="text-right">
                  <div className="text-gray-700 font-bold text-sm">₪{j.HourlyRate}/ש׳</div>
                  {j.TotalPay && <div className="text-green-600 text-xs">₪{j.TotalPay} סה״כ</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
