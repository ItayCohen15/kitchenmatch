import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Timer, Star, ClipboardList } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { levelFromShifts, netMultiplier } from '../../utils/levels';
import { SkeletonList } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { toast } from '../common/Toast';
import { roleDot } from '../../utils/colors';

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  completed:          { label: 'הושלם',       bg: '#e4f7ee', fg: '#1f8f5f' },
  active:             { label: 'פעיל',         bg: '#ece9fe', fg: '#5b4bd0' },
  confirmed:          { label: 'אושר',         bg: '#fdf0cf', fg: '#8a6300' },
  pending_approval:   { label: 'ממתין',        bg: '#fdf0cf', fg: '#8a6300' },
  pending_completion: { label: 'ממתין לאישור', bg: '#ece9fe', fg: '#5b4bd0' },
  cancelled:          { label: 'בוטל',         bg: '#fde3e3', fg: '#cf3030' },
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
      .catch(() => { setShifts([]); toast.error('לא הצלחנו לטעון את ההיסטוריה'); })
      .finally(() => setLoading(false));
  }, [userProfile]);

  const filtered = shifts.filter(s => {
    if (filter === 'completed') return s.Status === 'completed';
    if (filter === 'upcoming') return ['confirmed', 'active', 'pending_approval', 'pending_completion'].includes(s.Status);
    return true;
  });

  const netMult = netMultiplier(levelFromShifts(userProfile?.CompletedShifts || 0).key);

  const totalEarned = shifts
    .filter(s => s.Status === 'completed')
    .reduce((sum, s) => {
      const hours = (new Date(s.EndTime).getTime() - new Date(s.StartTime).getTime()) / 3600000;
      return sum + hours * s.HourlyRate * netMult;
    }, 0);

  return (
    <div className="screen-enter space-y-4">
      {/* ── סיכום — הירו נייבי+זהב ── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: '#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 260, height: 260, borderRadius: '50%', bottom: -130, left: -80, background: 'radial-gradient(circle, rgba(244,182,44,.18), transparent 66%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '50%', top: -80, right: 40, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />
        <div className="relative p-5 text-white">
          <div className="grid grid-cols-3 text-center">
            <div>
              <div className="font-black" style={{ fontSize: 22, color: '#f4b62c' }}>₪{totalEarned.toFixed(0)}</div>
              <div className="font-semibold mt-0.5" style={{ fontSize: 11, color: '#b9c0d8' }}>סה״כ הכנסות</div>
            </div>
            <div className="relative">
              <span className="absolute right-0 top-1/2 -translate-y-1/2" style={{ width: 1, height: 30, background: 'rgba(255,255,255,.10)' }} />
              <div className="font-black" style={{ fontSize: 22, color: '#fff' }}>{shifts.filter(s => s.Status === 'completed').length}</div>
              <div className="font-semibold mt-0.5" style={{ fontSize: 11, color: '#b9c0d8' }}>משמרות הושלמו</div>
            </div>
            <div className="relative">
              <span className="absolute right-0 top-1/2 -translate-y-1/2" style={{ width: 1, height: 30, background: 'rgba(255,255,255,.10)' }} />
              <div className="font-black" style={{ fontSize: 22, color: '#8b8cf7' }}>
                {shifts.filter(s => ['confirmed','active'].includes(s.Status)).length}
              </div>
              <div className="font-semibold mt-0.5" style={{ fontSize: 11, color: '#b9c0d8' }}>משמרות קרובות</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── סינון ── */}
      <div className="flex gap-2">
        {[
          { id: 'all',       label: 'הכל' },
          { id: 'upcoming',  label: 'קרובות' },
          { id: 'completed', label: 'הושלמו' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
            style={filter === f.id
              ? { background: '#5354d3', color: '#fff', boxShadow: '0 6px 16px -8px rgba(83,84,211,.6)' }
              : { background: '#fff', color: '#7a8199', border: '1px solid #eceef4' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <SkeletonList count={4} />}

      {!loading && filtered.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <EmptyState icon={<ClipboardList size={26} />} title="אין משמרות עדיין"
            subtitle="הגש מועמדות למשמרות כדי להתחיל לצבור היסטוריה והכנסות" />
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((shift: any) => {
          const start = new Date(shift.StartTime);
          const end = new Date(shift.EndTime);
          const hours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);
          const net = (parseFloat(hours) * shift.HourlyRate * netMult).toFixed(0);
          const cfg = STATUS_CONFIG[shift.Status] || STATUS_CONFIG.completed;
          const dateStr = start.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
          const timeStr = `${start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;

          return (
            <div key={shift.Id} style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)', padding: 16 }}>
              {/* כותרת */}
              <div className="flex items-start justify-between mb-2.5">
                <div className="min-w-0">
                  <div className="font-black truncate" style={{ fontSize: 16, color: '#141a2e' }}>{shift.RestaurantName || 'מסעדה'}</div>
                  <div className="font-semibold truncate mt-0.5" style={{ fontSize: 12, color: '#7a8199' }}>{shift.RestaurantCity || ''}</div>
                </div>
                <span className="inline-block font-extrabold flex-none" style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 6, background: cfg.bg, color: cfg.fg }}>
                  {cfg.label}
                </span>
              </div>

              {/* תפקיד + פרטי משמרת */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
                <span className="inline-flex items-center gap-1.5 font-bold" style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 8, background: '#f4f5f9', color: '#6b7290' }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: roleDot(shift.Role) }} />
                  {ROLE_LABELS[shift.Role] || shift.Role}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold" style={{ fontSize: 11.5, color: '#6b7290' }}><Calendar size={12} style={{ color: '#a7adc4' }} />{dateStr}</span>
                <span className="inline-flex items-center gap-1 font-semibold" style={{ fontSize: 11.5, color: '#6b7290' }}><Clock size={12} style={{ color: '#a7adc4' }} />{timeStr}</span>
                <span className="inline-flex items-center gap-1 font-semibold" style={{ fontSize: 11.5, color: '#6b7290' }}><Timer size={12} style={{ color: '#a7adc4' }} />{hours} ש׳</span>
              </div>

              {/* שכר */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #eceef4' }}>
                <div>
                  <div className="font-semibold" style={{ fontSize: 11, color: '#7a8199' }}>שכר שעתי</div>
                  <div className="font-bold" style={{ fontSize: 13.5, color: '#2b3350' }}>₪{shift.HourlyRate}/ש׳</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold" style={{ fontSize: 11, color: '#7a8199' }}>ברוטו</div>
                  <div className="font-bold" style={{ fontSize: 13.5, color: '#2b3350' }}>₪{(parseFloat(hours) * shift.HourlyRate).toFixed(0)}</div>
                </div>
                <div className="text-right">
                  {(() => {
                    if (shift.Status === 'cancelled') {
                      const fee = Number(shift.CancellationFee ?? 0);
                      // המסעדה ביטלה מאוחר → העובד קיבל פיצוי
                      if (fee > 0 && shift.CancelledBy === 'restaurant') {
                        return (<>
                          <div className="font-semibold" style={{ fontSize: 11, color: '#7a8199' }}>פיצוי ביטול</div>
                          <div className="font-black" style={{ fontSize: 17, color: '#1f9d6b' }}>+₪{fee.toFixed(0)}</div>
                        </>);
                      }
                      // העובד ביטל מאוחר → שילם קנס
                      if (fee > 0 && shift.CancelledBy === 'worker') {
                        return (<>
                          <div className="font-semibold" style={{ fontSize: 11, color: '#7a8199' }}>קנס ביטול</div>
                          <div className="font-black" style={{ fontSize: 17, color: '#cf3030' }}>-₪{fee.toFixed(0)}</div>
                        </>);
                      }
                      return (<>
                        <div className="font-semibold" style={{ fontSize: 11, color: '#7a8199' }}>בוטל</div>
                        <div className="font-black" style={{ fontSize: 17, color: '#c7ccda' }}>—</div>
                      </>);
                    }
                    return (<>
                      <div className="font-semibold" style={{ fontSize: 11, color: '#7a8199' }}>נטו (לאחר עמלה)</div>
                      {shift.Status === 'completed'
                        ? <div className="inline-block font-extrabold" style={{ fontSize: 15, padding: '3px 10px', borderRadius: 8, background: '#fdf0cf', color: '#8a6300' }}>₪{net}</div>
                        : <div className="font-black" style={{ fontSize: 17, color: '#9aa0b4' }}>₪{net}</div>}
                    </>);
                  })()}
                </div>
              </div>

              {shift.Status === 'completed' && shift.Rating && (
                <div className="flex items-center gap-1 mt-3 pt-3" style={{ borderTop: '1px solid #eceef4' }}>
                  <span className="font-semibold" style={{ fontSize: 11, color: '#7a8199' }}>הדירוג שלך:</span>
                  {Array.from({ length: shift.Rating }).map((_, i) => (
                    <Star key={i} size={13} style={{ color: '#f4b62c', fill: '#f4b62c' }} />
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
