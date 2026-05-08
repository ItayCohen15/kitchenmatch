import React from 'react';
import { Zap, ChefHat, Clock, TrendingUp, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CURRENT_RESTAURANT, WORKERS } from '../../data/mockData';

export const RestaurantHome: React.FC = () => {
  const { navToRestaurant } = useApp();
  const r = CURRENT_RESTAURANT;

  const recentShifts = [
    { worker: 'דניאל כהן', role: 'שף', date: 'אמש', hours: 6, pay: 540, rating: 5 },
    { worker: 'שירה מזרחי', role: 'טבחית', date: 'לפני יומיים', hours: 5, pay: 350, rating: 5 },
    { worker: 'יוסף אבו', role: 'שף', date: 'לפני 4 ימים', hours: 8, pay: 640, rating: 4 },
  ];

  return (
    <div className="screen-enter space-y-4 pb-2">
      {/* Header */}
      <div className="bg-gradient-to-l from-orange-600 to-orange-500 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ backgroundColor: r.logoColor }}
          >
            {r.initials}
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">{r.name}</div>
            <div className="text-orange-100 text-sm">{r.city} · {r.cuisineType}</div>
          </div>
          <div className="mr-auto flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1">
            <Star size={12} className="text-yellow-300 fill-yellow-300" />
            <span className="text-sm font-bold">{r.rating}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'ארנק', value: `₪${r.walletBalance.toLocaleString()}`, icon: '💳' },
            { label: 'הוצאה חודשית', value: `₪${r.monthlySpend.toLocaleString()}`, icon: '📊' },
            { label: 'משמרות', value: `${r.totalShifts}`, icon: '⭐' },
          ].map(s => (
            <div key={s.label} className="bg-white/15 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-black text-base">{s.value}</div>
              <div className="text-orange-100 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

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
          <h2 className="font-bold text-gray-800 text-base">שפים זמינים קרובים</h2>
          <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
            {WORKERS.filter(w => w.isAvailable).length} זמינים
          </span>
        </div>
        <div className="space-y-2">
          {WORKERS.slice(0, 3).map(w => (
            <div key={w.id} className="bg-white rounded-xl p-3 flex items-center gap-3 card-shadow">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: w.avatarColor }}
              >
                {w.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">{w.name}</span>
                  <span className="text-xs text-yellow-500 font-bold">★{w.rating}</span>
                </div>
                <div className="text-gray-500 text-xs">{w.city} · {w.distanceKm} ק״מ</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-orange-500 font-bold text-sm">₪{w.hourlyRate}/ש׳</div>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-auto mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent shifts */}
      <div>
        <h2 className="font-bold text-gray-800 mb-3 text-base">משמרות אחרונות</h2>
        <div className="space-y-2">
          {recentShifts.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 card-shadow">
              <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-semibold text-gray-800 text-sm">{s.worker}</span>
                <span className="text-gray-400 text-xs"> · {s.role} · {s.date}</span>
              </div>
              <div className="text-right">
                <div className="text-gray-700 font-bold text-sm">₪{s.pay}</div>
                <div className="text-yellow-500 text-xs">{'★'.repeat(s.rating)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-amber-800 text-sm">תזכורת</div>
          <div className="text-amber-700 text-xs mt-0.5">
            יש לך משמרת פתוחה לשישי בערב. פרסם מוקדם כדי לקבל את הטובים ביותר.
          </div>
        </div>
      </div>
    </div>
  );
};
