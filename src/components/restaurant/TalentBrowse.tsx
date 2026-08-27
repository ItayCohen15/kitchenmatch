import React, { useState, useEffect } from 'react';
import { GraduationCap, Star } from 'lucide-react';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { roleLabels } from '../../utils/roles';
import { avatarTone } from '../../utils/colors';
import { NewWorkerBadge } from '../common/NewWorkerBadge';
import { GradBadge } from '../common/GradBadge';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { WorkerProfileModal } from '../common/WorkerProfileModal';

/** גילוי טאלנט — מסעדות מגלות בוגרי בתי ספר (תוכנית הכניסה למקצוע) + כלל העובדים */
export const TalentBrowse: React.FC = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'grads' | 'all'>('grads');
  const [roleFilter, setRoleFilter] = useState('');
  const [viewId, setViewId] = useState<number | null>(null);

  useEffect(() => {
    api.getWorkers()
      .then(d => setWorkers(Array.isArray(d) ? d : []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, []);

  const roles = Array.from(new Set(workers.map(w => w.Role).filter(Boolean)));
  const list = workers
    .filter(w => (mode === 'all' ? true : !!w.IsTrainee))
    .filter(w => (roleFilter ? w.Role === roleFilter : true))
    .sort((a, b) => (b.Rating || 0) - (a.Rating || 0));

  return (
    <div className="screen-enter space-y-4 pb-2">
      {/* Hero */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: '#14233d' }}>
        <div className="flex items-center gap-2 mb-1 relative">
          <GraduationCap size={22} style={{ color: '#e8a020' }} />
          <h2 className="font-bold text-lg">טאלנט טרי · תוכנית הכניסה</h2>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed relative">
          בוגרי בתי ספר לבישול וברמנות שמחפשים את ההזדמנות הראשונה — מאומנים, מלאי מוטיבציה, ומוכנים להיכנס למטבח שלך.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-white rounded-2xl p-1 card-shadow">
        {[
          { id: 'grads', label: 'בוגרי בתי ספר' },
          { id: 'all', label: 'כל העובדים' },
        ].map(t => (
          <button key={t.id} onClick={() => setMode(t.id as any)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: mode === t.id ? '#14233d' : 'transparent',
              color: mode === t.id ? '#fff' : '#94a3b8',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Role chips */}
      {roles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setRoleFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${roleFilter === '' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 card-shadow'}`}>
            הכל
          </button>
          {roles.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${roleFilter === r ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 card-shadow'}`}>
              {ROLE_LABELS[r] || r}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading && (
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}
      {!loading && list.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center card-shadow">
          <GraduationCap size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm">
            {mode === 'grads' ? 'אין בוגרים זמינים כרגע — בקרוב יצטרפו!' : 'אין עובדים זמינים כרגע'}
          </p>
        </div>
      )}
      <div className="space-y-2">
        {list.map(w => {
          const wName = w.Name || 'עובד';
          const ini = wName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
          const skills = (w.Skills || '').split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 3);
          return (
            <button key={w.Id} onClick={() => setViewId(w.Id)}
              className="w-full bg-white rounded-2xl p-3.5 flex items-start gap-3 card-shadow text-right active:scale-[0.99] transition-transform">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                style={{ background: avatarTone(wName).bg, color: avatarTone(wName).fg }}>
                {ini}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 text-sm">{wName}</span>
                  {Number(w.Rating) > 0 && (
                    <span className="text-xs text-yellow-500 font-bold flex items-center gap-0.5">
                      <Star size={10} className="fill-yellow-400 text-yellow-400" />{Number(w.Rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <GradBadge isTrainee={w.IsTrainee} school={w.SchoolName} course={w.CourseType} size="sm" />
                  <NewWorkerBadge completedShifts={w.CompletedShifts} size="sm" />
                  <VerifiedBadge isVerified={w.IsVerified} size="sm" />
                </div>
                <div className="text-gray-500 text-xs mt-1">{w.City} · {roleLabels(w.Role)}</div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {skills.map((s: string) => (
                      <span key={s} className="text-[10px] bg-amber-50 text-amber-600 rounded-full px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-amber-400 text-lg flex-shrink-0">‹</span>
            </button>
          );
        })}
      </div>

      {viewId != null && (
        <WorkerProfileModal workerId={viewId} onClose={() => setViewId(null)} />
      )}
    </div>
  );
};
