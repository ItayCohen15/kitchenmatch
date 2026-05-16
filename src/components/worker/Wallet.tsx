import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

export const WorkerWallet: React.FC = () => {
  const { userProfile } = useApp();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [amount, setAmount] = useState('');

  const totalEarnings = userProfile?.TotalEarnings || 0;
  const completedShifts = userProfile?.CompletedShifts || 0;
  const hourlyRate = userProfile?.HourlyRate || 0;
  const available = totalEarnings > 0 ? totalEarnings * 0.3 : 0;

  useEffect(() => {
    if (userProfile?.Id) {
      api.getWorkerEarnings(userProfile.Id)
        .then(data => setTransactions(Array.isArray(data) ? data : []))
        .catch(() => setTransactions([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const handleWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setWithdrawn(true);
      setTimeout(() => setWithdrawn(false), 3000);
    }, 2000);
  };

  const typeIcon = (type: string) => {
    if (type === 'withdrawal') return <ArrowUpRight size={16} className="text-blue-500" />;
    if (type === 'penalty') return <ArrowDownRight size={16} className="text-red-500" />;
    if (type === 'bonus') return <TrendingUp size={16} className="text-purple-500" />;
    return <ArrowDownRight size={16} className="text-green-500" />;
  };

  const typeBg = (type: string) => {
    if (type === 'withdrawal') return 'bg-blue-50';
    if (type === 'penalty') return 'bg-red-50';
    if (type === 'bonus') return 'bg-purple-50';
    return 'bg-green-50';
  };

  const amtColor = (type: string) => {
    if (type === 'withdrawal') return 'text-blue-500';
    if (type === 'penalty') return 'text-red-500';
    if (type === 'bonus') return 'text-purple-500';
    return 'text-green-600';
  };

  const fmtAmount = (t: any) => {
    const amt = t.Amount || t.amount || 0;
    const sign = amt > 0 ? '+' : '';
    return `${sign}₪${Math.abs(amt)}`;
  };

  return (
    <div className="screen-enter space-y-4">
      {/* Balance */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="text-gray-400 text-sm mb-1">זמין למשיכה</div>
        <div className="text-4xl font-black mb-1">₪{available.toLocaleString()}</div>
        <div className="text-gray-400 text-sm">
          סה״כ: <span className="text-white font-bold">₪{totalEarnings.toLocaleString()}</span>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { setAmount(''); setWithdrawing(false); setWithdrawn(false); }}
            className="flex-1 bg-white/15 rounded-xl py-3 font-bold text-sm"
          >
            משיכה מיידית
          </button>
          <button className="flex-1 bg-orange-500 rounded-xl py-3 font-bold text-sm">
            משיכה שבועית
          </button>
        </div>
      </div>

      {/* Withdraw panel */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3">משוך כסף לבנק</h3>
        <div className="flex gap-2 mb-3">
          {[200, 500, 1000].map(a => (
            <button
              key={a}
              onClick={() => setAmount(String(a))}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
                amount === String(a) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              ₪{a}
            </button>
          ))}
          <button
            onClick={() => setAmount(String(available))}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
              amount === String(available) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            הכל
          </button>
        </div>
        <div className="relative mb-3">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₪</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="סכום"
            className="w-full border border-gray-200 rounded-xl py-3 pr-8 pl-3 text-right font-semibold"
          />
        </div>
        {withdrawn ? (
          <div className="bg-green-500 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold">
            <CheckCircle2 size={18} />
            הועבר בהצלחה!
          </div>
        ) : (
          <button
            onClick={handleWithdraw}
            disabled={!amount || Number(amount) <= 0 || withdrawing}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {withdrawing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                מעבד...
              </>
            ) : `משוך ₪${amount || 0}`}
          </button>
        )}
        <div className="text-xs text-gray-400 text-center mt-2">
          העברה בנקאית · זמין תוך 1–2 ימי עסקים
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'סה״כ הכנסות', value: `₪${totalEarnings.toLocaleString()}`, color: 'text-green-500' },
          { label: 'שכר/ש׳', value: `₪${hourlyRate}`, color: 'text-orange-500' },
          { label: 'משמרות', value: completedShifts, color: 'text-blue-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 card-shadow text-center">
            <div className={`font-black text-lg ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">פעולות אחרונות</h3>
        {loading && <div className="text-center py-4"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>}
        {!loading && transactions.length === 0 && (
          <div className="text-center py-8 bg-white rounded-2xl card-shadow">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-gray-500 text-sm">אין עסקאות עדיין</p>
            <p className="text-gray-400 text-xs mt-1">קבל משמרות כדי לצבור הכנסות</p>
          </div>
        )}
        <div className="space-y-2">
          {transactions.map((t, i) => {
            const type = t.Type || t.type || 'earning';
            return (
              <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 card-shadow">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg(type)}`}>
                  {typeIcon(type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {t.RestaurantName ? `משמרת – ${t.RestaurantName}` : (t.description || 'תשלום')}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {t.CreatedAt ? new Date(t.CreatedAt).toLocaleDateString('he-IL') : t.date}
                  </div>
                </div>
                <div className={`font-bold text-sm flex-shrink-0 ${amtColor(type)}`}>
                  {fmtAmount(t)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
