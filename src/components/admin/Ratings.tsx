import React, { useEffect, useState } from 'react';
import { Star, ArrowLeft, Store, ChefHat, AlertTriangle } from 'lucide-react';
import { api } from '../../api';
import { dateShort } from './format';

type Filter = 'all' | 'worker' | 'restaurant';

const Stars = ({ score }: { score: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={12} fill={i <= score ? '#f5c842' : 'transparent'}
        style={{ color: i <= score ? '#f5c842' : 'rgba(255,255,255,0.2)' }} />
    ))}
  </div>
);

const HIRE_LABELS: Record<string, string> = { yes: 'יעסיק שוב', maybe: 'אולי', no: 'לא יעסיק שוב' };
const SKILLS_LABELS: Record<string, string> = { yes: 'כישורים כנדרש', partial: 'כישורים חלקיים', no: 'לא כמתואר' };

export const AdminRatings: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    api.adminRatings()
      .then((d: any) => setList(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = list.filter(r => filter === 'all' || r.ToRole === filter);
  const avg = filtered.length ? (filtered.reduce((s, r) => s + (Number(r.Score) || 0), 0) / filtered.length) : 0;

  return (
    <div className="pb-4">
      {/* Filter pills */}
      <div className="flex gap-2 mb-3">
        {([['all', 'הכל'], ['worker', 'לעובדים'], ['restaurant', 'למסעדות']] as [Filter, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={filter === id
              ? { background: 'linear-gradient(135deg,#e8a020,#f5c842)', color: '#0a0f1a' }
              : { background: '#111a2b', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-2xl p-3 mb-3 flex items-center justify-between" style={{ background: '#111a2b', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{filtered.length} דירוגים</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black" style={{ color: '#f5c842' }}>{avg.toFixed(2)}</span>
            <Stars score={Math.round(avg)} />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>אין דירוגים עדיין</p>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(r => {
            const toWorker = r.ToRole === 'worker';
            return (
              <div key={r.Id} className="rounded-2xl p-3.5" style={{ background: '#111a2b', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs min-w-0">
                    {toWorker ? <Store size={13} style={{ color: '#e8a020' }} /> : <ChefHat size={13} style={{ color: '#a78bfa' }} />}
                    <span className="text-white font-bold truncate">{r.FromName || r.FromEmail || 'אנונימי'}</span>
                    <ArrowLeft size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="font-bold truncate" style={{ color: toWorker ? '#a78bfa' : '#e8a020' }}>{r.ToName || '—'}</span>
                  </div>
                  <Stars score={Number(r.Score) || 0} />
                </div>
                {r.Comment ? <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{r.Comment}</p> : null}
                {/* extended */}
                {(r.WouldHireAgain || r.SkillsAsClaimed) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.WouldHireAgain && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: r.WouldHireAgain === 'yes' ? 'rgba(52,211,153,0.15)' : r.WouldHireAgain === 'no' ? 'rgba(239,68,68,0.15)' : 'rgba(245,200,66,0.15)', color: r.WouldHireAgain === 'yes' ? '#34d399' : r.WouldHireAgain === 'no' ? '#f87171' : '#f5c842' }}>
                        {HIRE_LABELS[r.WouldHireAgain] || r.WouldHireAgain}
                      </span>
                    )}
                    {r.SkillsAsClaimed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                        {SKILLS_LABELS[r.SkillsAsClaimed] || r.SkillsAsClaimed}
                      </span>
                    )}
                  </div>
                )}
                {r.ConcernNote && (
                  <div className="flex items-start gap-1.5 mt-2 rounded-lg p-2" style={{ background: 'rgba(239,68,68,0.08)' }}>
                    <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    <span className="text-[11px]" style={{ color: '#fca5a5' }}>{r.ConcernNote}</span>
                  </div>
                )}
                <div className="text-[10px] mt-2 text-left" style={{ color: 'rgba(255,255,255,0.3)' }}>{dateShort(r.CreatedAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
