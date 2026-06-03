import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed:          { label: 'הושלם',      color: 'text-green-600 bg-green-50',  icon: <CheckCircle2 size={14} /> },
  active:             { label: 'פעיל',        color: 'text-blue-600 bg-blue-50',    icon: <Clock size={14} /> },
  confirmed:          { label: 'אושר',        color: 'text-amber-600 bg-amber-50', icon: <Clock size={14} /> },
  pending_approval:   { label: 'ממתין',       color: 'text-yellow-600 bg-yellow-50', icon: <Clock size={14} /> },
  pending_completion: { label: 'ממתין לאישור', color: 'text-purple-600 bg-purple-50', icon: <Clock size={14} /> },
  cancelled:          { label: 'בוטל',        color: 'text-red-500 bg-red-50',      icon: <XCircle size={14} /> },
};

export const WorkerHistory: React.FC = () => {
  const { userProfile } = useApp();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'upcoming'>('all');

  useEffect(() => {
    if (!userProfile?.Id) { setLoading(false); return; }

    api.getWorkerHistory(userProfile.Id)
      .then(data => setShifts(Array.isArray(data) ? data : []))
      .catch(() => setShifts([]))
      .finally(() => setLoading(false));
  }, [userProfile]);

  const filtered = shifts.filter(s => {
    if (filter === 'completed') return s.Status === 'completed';
    if (filter === 'upcoming') return ['confirmed', 'active', 'pending_approval', 'pending_completion'].includes(s.Status);
    return true;
  });

  const totalEarned = shifts
    .filter(s => s.Status === 'completed')
    .reduce((sum, s) => {
      const hours = (new Date(s.EndTime).getTime() - new Date(s.StartTime).getTime()) / 3600000;
      return sum + hours * s.HourlyRate * 0.935;
    }, 0);

  return (
    <div className="screen-enter space-y-4">
      {/* Summary */}
      <div className="bg-gradient-to-l from-gray-900 to-gray-800 rounded-2xl p-4 text-white">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-black text-green-400">₪{totalEarned.toFixed(0)}</div>
            <div className="text-gray-400 text-xs">סה״כ הכנסות</div>
          </div>
          <div>
            <div className="text-xl font-black">{shifts.filter(s => s.Status === 'completed').length}</div>
            <div className="text-gray-400 text-xs">משמרות הושלמו</div>
          </div>
          <div>
            <div className="text-xl font-black text-amber-400">
              {shifts.filter(s => ['confirmed','active'].includes(s.Status)).length}
            </div>
            <div className="text-gray-400 text-xs">משמרות קרובות</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { id: 'all',       label: 'הכל' },
          { id: 'upcoming',  label: 'קרובות' },
          { id: 'completed', label: 'הושלמו' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center card-shadow">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-bold text-gray-700">אין משמרות עדיין</p>
          <p className="text-gray-400 text-sm mt-1">הגש מועמדות למשמרות כדי להתחיל</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((shift: any) => {
          const start = new Date(shift.StartTime);
          const end = new Date(shift.EndTime);
          const hours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);
          const net = (parseFloat(hours) * shift.HourlyRate * 0.935).toFixed(0);
          const cfg = STATUS_CONFIG[shift.Status] || STATUS_CONFIG.completed;
          const dateStr = start.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
          const timeStr = `${start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;

          return (
            <div key={shift.Id} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-gray-900">{shift.RestaurantName || 'מסעדה'}</div>
                  <div className="text-gray-500 text-xs">{shift.RestaurantCity || ''}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${cfg.color}`}>
                  {cfg.icon}{cfg.label}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="bg-blue-50 text-blue-600 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                  {ROLE_LABELS[shift.Role] || shift.Role}
                </span>
                <span>{dateStr}</span>
                <span>{timeStr}</span>
                <span>{hours} ש׳</span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <div>
                  <div className="text-xs text-gray-400">שכר שעתי</div>
                  <div className="font-bold text-gray-700">₪{shift.HourlyRate}/ש׳</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">ברוטו</div>
                  <div className="font-bold text-gray-700">₪{(parseFloat(hours) * shift.HourlyRate).toFixed(0)}</div>
                </div>
                <div className="text-right">
                  {(() => {
                    if (shift.Status === 'cancelled') {
                      const fee = Number(shift.CancellationFee ?? 0);
                      // המסעדה ביטלה מאוחר → העובד קיבל פיצוי
                      if (fee > 0 && shift.CancelledBy === 'restaurant') {
                        return (<>
                          <div className="text-xs text-gray-400">פיצוי ביטול</div>
                          <div className="font-black text-lg text-green-600">+₪{fee.toFixed(0)}</div>
                        </>);
                      }
                      // העובד ביטל מאוחר → שילם קנס
                      if (fee > 0 && shift.CancelledBy === 'worker') {
                        return (<>
                          <div className="text-xs text-gray-400">קנס ביטול</div>
                          <div className="font-black text-lg text-red-500">-₪{fee.toFixed(0)}</div>
                        </>);
                      }
                      return (<>
                        <div className="text-xs text-gray-400">בוטל</div>
                        <div className="font-black text-lg text-red-300">—</div>
                      </>);
                    }
                    return (<>
                      <div className="text-xs text-gray-400">נטו (לאחר עמלה)</div>
                      <div className={`font-black text-lg ${shift.Status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>₪{net}</div>
                    </>);
                  })()}
                </div>
              </div>

              {shift.Status === 'completed' && shift.Rating && (
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-400">הדירוג שלך:</span>
                  {Array.from({ length: shift.Rating }).map((_, i) => (
                    <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
