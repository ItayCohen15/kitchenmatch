import React, { useEffect, useState } from 'react';
import { Zap, Store, ChefHat, Download } from 'lucide-react';
import { api } from '../../api';
import { ROLE_LABELS } from '../../utils/roles';
import { ils, dateShort, STATUS_LABELS, STATUS_COLORS, JOBTYPE_LABELS } from './format';
import { downloadCsv } from './exportCsv';

type Filter = 'all' | 'completed' | 'active' | 'cancelled';

const matchFilter = (j: any, f: Filter) => {
  if (f === 'all') return true;
  if (f === 'completed') return j.Status === 'completed';
  if (f === 'cancelled') return j.Status === 'cancelled';
  return ['searching', 'matched', 'pending_approval', 'confirmed', 'active', 'pending_completion'].includes(j.Status);
};

export const AdminJobs: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);

  // ביטול משמרת תקועה (למשל משמרת שנתקעה ב"ממתין לתשלום" ולא נסגרת)
  const cancelJob = async (id: number) => {
    if (!window.confirm('לבטל את המשמרת התקועה? היא תסומן כבוטלה ותיעלם מהמסכים.')) return;
    setBusyId(id);
    try {
      await api.adminCancelJob(id);
      setList(prev => prev.map(j => (j.Id === id ? { ...j, Status: 'cancelled' } : j)));
    } catch (e: any) {
      window.alert(e?.message || 'הביטול נכשל');
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    api.adminJobs()
      .then((d: any) => setList(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = list.filter(j => matchFilter(j, filter));

  const exportJobs = () => {
    downloadCsv('staffly-shifts.csv',
      ['תאריך', 'תפקיד', 'סטטוס', 'סוג', 'מסעדה', 'עובד', 'תעריף לשעה', 'שכר', 'עמלה', 'חירום'],
      filtered.map((j: any) => [
        dateShort(j.StartTime || j.CreatedAt),
        ROLE_LABELS[j.Role] || j.Role,
        STATUS_LABELS[j.Status] || j.Status,
        JOBTYPE_LABELS[j.JobType] || (j.JobType || 'רגילה'),
        j.RestaurantName, j.WorkerName,
        j.HourlyRate ? Math.round(Number(j.HourlyRate)) : '',
        j.TotalPay ? Math.round(Number(j.TotalPay)) : '',
        j.Commission ? Math.round(Number(j.Commission)) : '',
        j.IsEmergency ? 'כן' : 'לא',
      ]));
  };

  return (
    <div className="pb-4">
      <div className="flex gap-2 mb-3">
        {([['all', 'הכל'], ['active', 'פעילות'], ['completed', 'הושלמו'], ['cancelled', 'בוטלו']] as [Filter, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={filter === id
              ? { background: '#5354d3', color: '#ffffff' }
              : { background: '#1b1e38', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {label}
          </button>
        ))}
      </div>

      {!loading && list.length > 0 && (
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{filtered.length} משמרות</span>
          <button onClick={exportJobs} disabled={filtered.length === 0} title="ייצוא ל-CSV"
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold disabled:opacity-40"
            style={{ background: '#1b1e38', border: '1px solid rgba(255,255,255,0.08)', color: '#34d399' }}>
            <Download size={14} /> CSV
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#5354d3] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>אין משמרות</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(j => {
            const isStage = j.JobType === 'stage' || j.JobType === 'stage_shift';
            return (
              <div key={j.Id} className="rounded-2xl p-3.5" style={{ background: '#1b1e38', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-white font-bold text-sm">{ROLE_LABELS[j.Role] || j.Role || '—'}</span>
                      {j.IsEmergency ? <Zap size={12} style={{ color: '#fb923c' }} /> : null}
                      {(j.JobType && j.JobType !== 'regular') && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: isStage ? 'rgba(244,63,94,0.15)' : 'rgba(34,211,238,0.15)', color: isStage ? '#fb7185' : '#22d3ee' }}>
                          {JOBTYPE_LABELS[j.JobType] || j.JobType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <Store size={10} /> <span className="truncate">{j.RestaurantName || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      <ChefHat size={10} /> <span className="truncate">{j.WorkerName || 'טרם שובץ'}</span>
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: (STATUS_COLORS[j.Status] || '#888') + '22', color: STATUS_COLORS[j.Status] || '#aaa' }}>
                      {STATUS_LABELS[j.Status] || j.Status}
                    </span>
                    <div className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{dateShort(j.StartTime || j.CreatedAt)}</div>
                  </div>
                </div>
                {j.Status === 'completed' && (
                  <div className="grid grid-cols-3 gap-1 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Mini label="שכר" value={ils(j.TotalPay)} />
                    <Mini label="תעריף/שעה" value={j.HourlyRate ? ils(j.HourlyRate) : '—'} />
                    <Mini label="עמלה" value={ils(j.Commission)} highlight />
                  </div>
                )}
                {!['completed', 'cancelled'].includes(j.Status) && (
                  <button onClick={() => cancelJob(j.Id)} disabled={busyId === j.Id}
                    className="mt-2.5 w-full py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                    style={{ background: 'rgba(229,72,77,0.12)', color: '#ff8a8a', border: '1px solid rgba(229,72,77,0.3)' }}>
                    {busyId === j.Id ? 'מבטל...' : 'בטל משמרת תקועה'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Mini = ({ label, value, highlight }: any) => (
  <div className="text-center">
    <div className="text-sm font-bold" style={{ color: highlight ? '#34d399' : '#fff' }}>{value}</div>
    <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</div>
  </div>
);
