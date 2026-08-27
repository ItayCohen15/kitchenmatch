import React, { useEffect, useState } from 'react';
import { Search, Star, CheckCircle2, XCircle, Phone, Briefcase, GraduationCap, Download, BadgeCheck } from 'lucide-react';
import { api } from '../../api';
import { roleLabels } from '../../utils/roles';
import { ils, num, dateShort, LEVEL_LABELS, LEVEL_COLORS } from './format';
import { downloadCsv } from './exportCsv';

type Tab = 'workers' | 'restaurants';

export const AdminUsers: React.FC = () => {
  const [tab, setTab] = useState<Tab>('workers');
  const [workers, setWorkers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [verifying, setVerifying] = useState<number | null>(null);

  // אימות ידני של עובד ("תג מאומת"). משפיע רק על המקור הידני —
  // עובד שעבר KYC אצל הסליקה נשאר מאומת גם אחרי ביטול ידני.
  const toggleVerify = async (w: any) => {
    const next = !w.AdminVerifiedAt;
    setVerifying(w.Id);
    try {
      const res: any = await api.adminVerifyWorker(w.Id, next);
      setWorkers(prev => prev.map(x => x.Id === w.Id
        ? { ...x, AdminVerifiedAt: res.AdminVerifiedAt, PayoutStatus: res.PayoutStatus, IsVerified: res.IsVerified }
        : x));
    } catch { /* שקט — נשאר במצב הקודם */ }
    finally { setVerifying(null); }
  };

  const load = () => {
    setLoading(true);
    Promise.all([api.adminWorkers(), api.adminRestaurants()])
      .then(([w, r]: any) => { setWorkers(Array.isArray(w) ? w : []); setRestaurants(Array.isArray(r) ? r : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const list = tab === 'workers' ? workers : restaurants;
  const filtered = list.filter((u: any) => {
    if (!q.trim()) return true;
    const hay = `${u.Name || ''} ${u.City || ''} ${u.Email || ''} ${u.Phone || ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const Verified = ({ ok }: { ok: any }) => ok
    ? <CheckCircle2 size={13} style={{ color: '#34d399' }} />
    : <XCircle size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />;

  const exportCurrent = () => {
    if (tab === 'workers') {
      downloadCsv('staffly-workers.csv',
        ['שם', 'אימייל', 'טלפון', 'עיר', 'תפקיד', 'רמה', 'דירוג', 'מס׳ דירוגים', 'משמרות', 'אמינות %', 'תעריף', 'הכנסות', 'מאומת', 'הצטרף'],
        filtered.map((w: any) => [w.Name, w.Email, w.Phone, w.City, roleLabels(w.Role), LEVEL_LABELS[w.Level] || w.Level,
          Number(w.Rating || 0).toFixed(1), w.RatingCount, w.CompletedShifts, w.ReliabilityScore, w.HourlyRate,
          Math.round(Number(w.TotalEarnings || 0)), w.IsEmailVerified ? 'כן' : 'לא', dateShort(w.JoinedAt)]));
    } else {
      downloadCsv('staffly-restaurants.csv',
        ['שם', 'אימייל', 'טלפון', 'עיר', 'סוג מטבח', 'דירוג', 'מס׳ דירוגים', 'משמרות שהושלמו', 'סה״כ משמרות', 'הוצאה', 'עמלות', 'ארנק', 'מאומת', 'הצטרף'],
        filtered.map((r: any) => [r.Name, r.Email, r.Phone, r.City, r.CuisineType, Number(r.Rating || 0).toFixed(1), r.RatingCount,
          r.CompletedJobs, r.TotalJobs, Math.round(Number(r.TotalSpend || 0)), Math.round(Number(r.Commission || 0)),
          Math.round(Number(r.WalletBalance || 0)), r.IsEmailVerified ? 'כן' : 'לא', dateShort(r.JoinedAt)]));
    }
  };

  return (
    <div className="pb-4">
      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {([['workers', `עובדים (${workers.length})`], ['restaurants', `מסעדות (${restaurants.length})`]] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={tab === id
              ? { background: '#5354d3', color: '#ffffff' }
              : { background: '#1b1e38', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Search + export */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש לפי שם, עיר, מייל..."
            className="w-full rounded-xl pr-9 pl-3 py-2.5 text-sm text-right text-white outline-none"
            style={{ background: '#1b1e38', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <button onClick={exportCurrent} disabled={filtered.length === 0} title="ייצוא ל-CSV"
          className="px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold disabled:opacity-40"
          style={{ background: '#1b1e38', border: '1px solid rgba(255,255,255,0.08)', color: '#34d399' }}>
          <Download size={15} /> CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#5354d3] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>לא נמצאו תוצאות</p>
      ) : (
        <div className="space-y-2.5">
          {tab === 'workers' ? filtered.map((w: any) => (
            <div key={w.Id} className="rounded-2xl p-3.5" style={{ background: '#1b1e38', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-sm truncate">{w.Name || '—'}</span>
                    <Verified ok={w.IsEmailVerified} />
                    {w.IsVerified ? <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}><BadgeCheck size={9} /> מאומת</span> : null}
                    {w.IsTrainee ? <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185' }}><GraduationCap size={9} /> סטאז'</span> : null}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {roleLabels(w.Role) || 'ללא תפקיד'} · {w.City || '—'}
                    {w.Level && <span style={{ color: LEVEL_COLORS[w.Level] }}> · {LEVEL_LABELS[w.Level] || w.Level}</span>}
                  </div>
                  <div className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{w.Email || '—'}</div>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-[11px] font-bold flex items-center gap-0.5 justify-end" style={{ color: '#f5c842' }}>
                    <Star size={10} fill="#f5c842" /> {Number(w.Rating || 0).toFixed(1)}
                    <span className="font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>({num(w.RatingCount)})</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>הצטרף {dateShort(w.JoinedAt)}</div>
                </div>
              </div>
              {/* stats row */}
              <div className="grid grid-cols-4 gap-1 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Stat label="משמרות" value={num(w.CompletedShifts)} />
                <Stat label="הכנסות" value={ils(w.TotalEarnings)} />
                <Stat label="אמינות" value={`${num(w.ReliabilityScore)}%`} />
                <Stat label="תעריף" value={w.HourlyRate ? ils(w.HourlyRate) : '—'} />
              </div>
              {w.Phone && (
                <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <Phone size={10} /> {w.Phone}
                </div>
              )}
              {/* אימות ידני — מקור נפרד מ-KYC */}
              <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {w.PayoutStatus === 'approved'
                    ? 'אומת דרך KYC של הסליקה'
                    : w.AdminVerifiedAt
                      ? 'אומת ידנית על ידך'
                      : 'לא מאומת'}
                </span>
                <button onClick={() => toggleVerify(w)} disabled={verifying === w.Id}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg disabled:opacity-40 flex-shrink-0"
                  style={w.AdminVerifiedAt
                    ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }
                    : { background: '#1f9d6b', color: '#fff' }}>
                  {verifying === w.Id ? '...' : w.AdminVerifiedAt ? 'בטל אימות ידני' : 'אמת עובד'}
                </button>
              </div>
            </div>
          )) : filtered.map((r: any) => (
            <div key={r.Id} className="rounded-2xl p-3.5" style={{ background: '#1b1e38', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold text-sm truncate">{r.Name || '—'}</span>
                    <Verified ok={r.IsEmailVerified} />
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {r.City || '—'}{r.CuisineType ? ` · ${r.CuisineType}` : ''}
                  </div>
                  <div className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{r.Email || '—'}</div>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-[11px] font-bold flex items-center gap-0.5 justify-end" style={{ color: '#f5c842' }}>
                    <Star size={10} fill="#f5c842" /> {Number(r.Rating || 0).toFixed(1)}
                    <span className="font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>({num(r.RatingCount)})</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>הצטרף {dateShort(r.JoinedAt)}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Stat label="משמרות" value={num(r.CompletedJobs)} icon={<Briefcase size={9} />} />
                <Stat label="הוצאה" value={ils(r.TotalSpend)} />
                <Stat label="עמלות" value={ils(r.Commission)} highlight />
                <Stat label="ארנק" value={ils(r.WalletBalance)} />
              </div>
              {r.Phone && (
                <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <Phone size={10} /> {r.Phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, highlight, icon }: any) => (
  <div className="text-center">
    <div className="text-sm font-bold leading-tight" style={{ color: highlight ? '#34d399' : '#fff' }}>{value}</div>
    <div className="text-[9px] mt-0.5 flex items-center gap-0.5 justify-center" style={{ color: 'rgba(255,255,255,0.35)' }}>{icon}{label}</div>
  </div>
);
