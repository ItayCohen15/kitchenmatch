import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, CreditCard, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';

export const RestaurantWallet: React.FC = () => {
  const { userProfile } = useApp();
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);
  const [topping, setTopping] = useState(false);
  const [topped, setTopped] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const walletBalance = userProfile?.WalletBalance || 0;
  const name = userProfile?.Name || '';

  useEffect(() => {
    if (userProfile?.Id) {
      api.getRestaurantJobs(userProfile.Id)
        .then(data => setJobs(Array.isArray(data) ? data : []))
        .catch(() => setJobs([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const completedJobs = jobs.filter(j => j.Status === 'completed');
  const totalSpend = completedJobs.reduce((sum, j) => sum + (j.TotalPay || 0), 0);
  const avgPerShift = completedJobs.length > 0 ? (totalSpend / completedJobs.length).toFixed(0) : 0;

  const handleTopUp = () => {
    setTopping(true);
    setTimeout(() => {
      setTopping(false);
      setTopped(true);
      setShowTopUp(false);
      setTimeout(() => setTopped(false), 3000);
    }, 1800);
  };

  return (
    <div className="screen-enter space-y-4">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="text-gray-400 text-sm mb-1">יתרה בארנק</div>
        <div className="text-4xl font-black mb-1">₪{walletBalance.toLocaleString()}</div>
        <div className="text-gray-400 text-sm">
          {name && <span className="text-gray-300">{name}</span>}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => setShowTopUp(s => !s)}
            className="bg-white/15 rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-sm"
          >
            <Plus size={16} />
            טען כסף
          </button>
          <button className="bg-amber-500 rounded-xl py-3 flex items-center justify-center gap-2 font-semibold text-sm">
            <CreditCard size={16} />
            כרטיס אשראי
          </button>
        </div>
      </div>

      {/* Top-up panel */}
      {showTopUp && (
        <div className="bg-white rounded-2xl p-4 card-shadow screen-enter">
          <h3 className="font-bold text-gray-800 mb-3">טעינת ארנק</h3>
          <div className="flex gap-2 mb-3">
            {[500, 1000, 2000, 5000].map(a => (
              <button
                key={a}
                onClick={() => setTopUpAmount(String(a))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
                  topUpAmount === String(a) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                ₪{a}
              </button>
            ))}
          </div>
          <div className="relative mb-3">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₪</span>
            <input
              type="number"
              value={topUpAmount}
              onChange={e => setTopUpAmount(e.target.value)}
              placeholder="סכום אחר"
              className="w-full border border-gray-200 rounded-xl py-3 pr-8 pl-3 text-right font-semibold"
            />
          </div>
          <button
            onClick={handleTopUp}
            disabled={!topUpAmount || topping}
            className="w-full bg-amber-500 text-white rounded-xl py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {topping ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                מעבד...
              </>
            ) : `טען ₪${topUpAmount}`}
          </button>
        </div>
      )}

      {/* Success toast */}
      {topped && (
        <div className="bg-green-500 rounded-2xl p-3 text-white flex items-center gap-3 screen-enter">
          <CheckCircle2 size={20} />
          <span className="font-semibold">הארנק נטען בהצלחה! ₪{topUpAmount}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'סה״כ הוצאות', value: `₪${totalSpend.toLocaleString()}`, color: 'text-amber-500' },
          { label: 'ממוצע למשמרת', value: `₪${avgPerShift}`, color: 'text-blue-500' },
          { label: 'משמרות', value: jobs.length, color: 'text-green-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 card-shadow text-center">
            <div className={`font-black text-lg ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Subscription banner */}
      <div className="bg-gradient-to-l from-purple-600 to-purple-500 rounded-2xl p-4 text-white">
        <div className="font-bold mb-1">מנוי Pro מסעדות 🚀</div>
        <div className="text-purple-100 text-sm mb-3">
          חסוך עד 5% עמלות · עדיפות בשיבוץ · תמיכה 24/7
        </div>
        <button className="bg-white text-purple-600 rounded-xl px-4 py-2 font-bold text-sm">
          רק ₪199/חודש – נסה חינם
        </button>
      </div>

      {/* Transactions */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">היסטוריית משמרות</h3>
        {loading && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!loading && jobs.length === 0 && (
          <div className="bg-white rounded-xl p-6 text-center card-shadow">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-gray-500 text-sm">אין משמרות עדיין</p>
            <p className="text-gray-400 text-xs mt-1">פרסם משמרת ראשונה להתחיל</p>
          </div>
        )}
        <div className="space-y-2">
          {jobs.map((j: any, i: number) => {
            const start = new Date(j.StartTime);
            const end = new Date(j.EndTime);
            const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
            const pay = j.TotalPay || (parseFloat(hours) * j.HourlyRate);
            const statusColor = j.Status === 'completed' ? 'text-green-500' : j.Status === 'searching' ? 'text-amber-400' : 'text-blue-400';
            const statusLabel = j.Status === 'completed' ? 'הושלם' : j.Status === 'searching' ? 'מחפש' : j.Status === 'active' ? 'פעיל' : j.Status;
            return (
              <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 card-shadow">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight size={18} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">
                    {ROLE_LABELS[j.Role] || j.Role} · {hours} ש׳
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">
                      {start.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                  </div>
                </div>
                <div className="text-red-500 font-bold text-sm flex-shrink-0">-₪{pay.toFixed(0)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
