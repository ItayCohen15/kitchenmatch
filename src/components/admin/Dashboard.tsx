import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, Users, Store, Briefcase, Handshake, Star, Zap, Wallet,
  GraduationCap, ShieldCheck, Trophy, Crown,
} from 'lucide-react';
import { api } from '../../api';
import { ROLE_LABELS, roleLabels } from '../../utils/roles';
import { ils, num, monthLabel, LEVEL_LABELS, LEVEL_COLORS } from './format';

const Tip = ({ active, payload, label, money }: any) => active && payload?.length ? (
  <div className="rounded-xl shadow-lg p-2.5 text-right text-xs" style={{ background: '#1b1e38', border: '1px solid rgba(255,255,255,0.1)' }}>
    <p className="font-bold text-white mb-1">{label}</p>
    {payload.map((p: any, i: number) => (
      <p key={i} style={{ color: p.color || p.fill }}>
        {money ? ils(p.value) : num(p.value)} {p.name === 'workers' ? 'עובדים' : p.name === 'restaurants' ? 'מסעדות' : ''}
      </p>
    ))}
  </div>
) : null;

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl p-4 ${className}`} style={{ background: '#1b1e38', border: '1px solid rgba(255,255,255,0.06)' }}>
    {children}
  </div>
);

const Kpi = ({ icon, label, value, sub, color }: any) => (
  <Card>
    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5" style={{ background: color + '22' }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="font-bold text-white text-xl leading-tight">{value}</div>
    <div className="text-[11px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</div>
    {sub && <div className="text-[11px] font-bold mt-0.5" style={{ color }}>{sub}</div>}
  </Card>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-white font-bold text-sm mb-2.5 mt-1">{children}</h3>
);

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    api.adminOverview()
      .then((d: any) => { setData(d); setError(''); })
      .catch((e: any) => setError(e.message || 'שגיאה'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000); // רענון אוטומטי כל 30 שניות
    return () => clearInterval(iv);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: '60vh' }}>
      <div className="w-8 h-8 border-2 border-[#5354d3] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="text-center text-red-400 text-sm mt-10">{error}</div>;
  if (!data) return null;

  const { users, jobs, partnerships, ratings, revenue } = data;
  const signups = (data.signupsByMonth || []).map((m: any) => ({ ...m, label: monthLabel(m.ym) }));
  const revByMonth = (data.revenueByMonth || []).map((m: any) => ({ ...m, label: monthLabel(m.ym), commission: Number(m.commission) || 0 }));
  let _acc = 0;
  const cumulative = revByMonth.map((mo: any) => { _acc += mo.commission; return { label: mo.label, total: Math.round(_acc) }; });
  const maxRole = Math.max(1, ...(data.jobsByRole || []).map((r: any) => r.cnt));

  return (
    <div className="space-y-4 pb-4">
      {/* ===== הכנסת הפלטפורמה — גיבור ===== */}
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: '#1b1e38', border: '1px solid rgba(83,84,211,0.25)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={15} style={{ color: '#5354d3' }} />
          <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>סך הכנסות הפלטפורמה</span>
        </div>
        <div className="text-4xl font-bold" style={{ color: '#7b7cee' }}>{ils(revenue.platformRevenue)}</div>
        <div className="flex gap-4 mt-3">
          <div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>עמלות משמרות</div>
            <div className="text-sm font-bold text-white">{ils(revenue.commissionFromShifts)}</div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>דמי שמירת עובד</div>
            <div className="text-sm font-bold text-white">{ils(revenue.brokerFees)}</div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>30 ימים</div>
            <div className="text-sm font-bold" style={{ color: '#34d399' }}>+{ils(revenue.commission30d)}</div>
          </div>
        </div>
      </div>

      {/* ===== מחזור כספי (GMV) ===== */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi icon={<TrendingUp size={18} />} label="מחזור כספי כולל" value={ils(revenue.gmv)} sub={`${ils(revenue.avgPerShift)} למשמרת`} color="#34d399" />
        <Kpi icon={<Briefcase size={18} />} label="משמרות שהושלמו" value={num(jobs.completedJobs)} sub={`${num(jobs.activeJobs)} פעילות כעת`} color="#60a5fa" />
      </div>

      {/* ===== משתמשים ===== */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi icon={<Users size={18} />} label="עובדים" value={num(users.workers)} sub={`${num(users.verified)} מאומתים`} color="#a78bfa" />
        <Kpi icon={<Store size={18} />} label="מסעדות" value={num(users.restaurants)} sub={`+${num(users.newUsers30d)} ב-30 ימים`} color="#5354d3" />
      </div>

      {/* ===== שותפויות / סטאז' / דירוג / חירום ===== */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi icon={<Handshake size={18} />} label="שותפויות פעילות" value={num(partnerships.activePartnerships)} sub={`מתוך ${num(partnerships.totalPartnerships)} סה"כ`} color="#22d3ee" />
        <Kpi icon={<GraduationCap size={18} />} label="סטאז'ים" value={num(partnerships.totalStages)} sub={`${num(partnerships.activeStages)} פעילים`} color="#f43f5e" />
        <Kpi icon={<Star size={18} />} label="דירוג עובדים ממוצע" value={ratings.avgWorker ? Number(ratings.avgWorker).toFixed(2) : '—'} sub={`${num(ratings.totalRatings)} דירוגים`} color="#f5c842" />
        <Kpi icon={<Zap size={18} />} label="משמרות חירום" value={num(jobs.emergencyCompleted)} sub={`${num(jobs.cancelledJobs)} בוטלו`} color="#fb923c" />
      </div>

      {/* ===== הכנסות לפי חודש ===== */}
      <Card>
        <SectionTitle>עמלות לפי חודש</SectionTitle>
        {revByMonth.length ? (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={revByMonth} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5354d3" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#5354d3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip money />} />
              <Area type="monotone" dataKey="commission" stroke="#5354d3" strokeWidth={2.5} fill="url(#gRev)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>אין נתונים עדיין</p>}
      </Card>

      {/* ===== הכנסה מצטברת ===== */}
      <Card>
        <SectionTitle><span className="inline-flex items-center gap-1.5"><TrendingUp size={14} style={{ color: '#34d399' }} /> הכנסה מצטברת</span></SectionTitle>
        {cumulative.length ? (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={cumulative} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="gCum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip money />} />
              <Area type="monotone" dataKey="total" stroke="#34d399" strokeWidth={2.5} fill="url(#gCum)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>אין נתונים עדיין</p>}
        <p className="text-[10px] text-center mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>סך עמלות מצטבר לאורך החודשים האחרונים</p>
      </Card>

      {/* ===== הרשמות לפי חודש ===== */}
      <Card>
        <SectionTitle>הרשמות חדשות לפי חודש</SectionTitle>
        {signups.length ? (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={signups} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="workers" stackId="a" fill="#a78bfa" radius={[0, 0, 0, 0]} />
              <Bar dataKey="restaurants" stackId="a" fill="#5354d3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>אין נתונים עדיין</p>}
        <div className="flex gap-4 justify-center mt-2">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#a78bfa' }} /> עובדים
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#5354d3' }} /> מסעדות
          </span>
        </div>
      </Card>

      {/* ===== משמרות לפי תפקיד ===== */}
      {(data.jobsByRole || []).length > 0 && (
        <Card>
          <SectionTitle>משמרות לפי תפקיד</SectionTitle>
          <div className="space-y-2.5">
            {data.jobsByRole.map((r: any) => (
              <div key={r.Role}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white font-semibold">{ROLE_LABELS[r.Role] || r.Role}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{num(r.cnt)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(r.cnt / maxRole) * 100}%`, background: '#5354d3' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ===== טופ עובדים ===== */}
      {(data.topWorkers || []).length > 0 && (
        <Card>
          <SectionTitle><span className="inline-flex items-center gap-1.5"><Trophy size={14} style={{ color: '#7b7cee' }} /> עובדים מובילים</span></SectionTitle>
          <div className="space-y-2">
            {data.topWorkers.map((w: any, i: number) => (
              <div key={w.Id} className="flex items-center gap-3 py-1.5">
                <span className="font-bold text-sm w-5 text-center" style={{ color: i === 0 ? '#7b7cee' : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">{w.Name || '—'}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {roleLabels(w.Role) || '—'} · {w.City || '—'}
                    {w.Level && <span style={{ color: LEVEL_COLORS[w.Level] }}> · {LEVEL_LABELS[w.Level] || w.Level}</span>}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white">{num(w.CompletedShifts)} <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>משמרות</span></div>
                  <div className="text-[11px] font-bold flex items-center gap-0.5 justify-end" style={{ color: '#f5c842' }}>
                    <Star size={10} fill="#f5c842" /> {Number(w.Rating || 0).toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ===== טופ מסעדות ===== */}
      {(data.topRestaurants || []).length > 0 && (
        <Card>
          <SectionTitle><span className="inline-flex items-center gap-1.5"><Crown size={14} style={{ color: '#5354d3' }} /> מסעדות מובילות (לפי עמלות)</span></SectionTitle>
          <div className="space-y-2">
            {data.topRestaurants.map((r: any, i: number) => (
              <div key={r.Id} className="flex items-center gap-3 py-1.5">
                <span className="font-bold text-sm w-5 text-center" style={{ color: i === 0 ? '#5354d3' : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">{r.Name || '—'}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.City || '—'} · {num(r.shifts)} משמרות</div>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold" style={{ color: '#34d399' }}>{ils(r.commission)}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>מחזור {ils(r.spend)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-center gap-1.5 pt-1 pb-3">
        <ShieldCheck size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>מתעדכן אוטומטית · Staffly ניהול</span>
      </div>
    </div>
  );
};
