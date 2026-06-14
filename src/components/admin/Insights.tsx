import React, { useEffect, useState } from 'react';
import {
  Sparkles, TrendingUp, TrendingDown, Percent, Target, Repeat, Activity,
  GraduationCap, MapPin, Filter, RefreshCw, Info, Wallet,
} from 'lucide-react';
import { api } from '../../api';
import { ils, num } from './format';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-2xl p-4 ${className}`} style={{ background: '#111a2b', border: '1px solid rgba(255,255,255,0.06)' }}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-white font-black text-sm mb-2.5">{children}</h3>
);

// כרטיס מטריקה עם הקשר "טוב/רע"
const Metric = ({ icon, label, value, hint, tone = 'neutral' }: any) => {
  const color = tone === 'good' ? '#34d399' : tone === 'bad' ? '#f87171' : tone === 'gold' ? '#f5c842' : '#60a5fa';
  return (
    <Card>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: color + '22' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="font-black text-white text-lg leading-tight">{value}</div>
      <div className="text-[11px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</div>
      {hint && <div className="text-[10px] mt-1 font-bold" style={{ color }}>{hint}</div>}
    </Card>
  );
};

// רנדור פשוט של תשובת ה-AI (כותרות ## · בולטים · **בולד**)
function renderAnalysis(text: string) {
  return text.split('\n').map((ln, i) => {
    const t = ln.trim();
    if (!t) return <div key={i} className="h-1.5" />;
    if (t.startsWith('## ')) return <h4 key={i} className="font-black text-sm mt-3 mb-1" style={{ color: '#f5c842' }}>{t.slice(3)}</h4>;
    if (t.startsWith('# '))  return <h4 key={i} className="font-black text-base mt-3 mb-1" style={{ color: '#f5c842' }}>{t.slice(2)}</h4>;
    const bullet = /^[-•*]\s+/.test(t);
    const content = bullet ? t.replace(/^[-•*]\s+/, '') : t;
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j} className="text-white font-bold">{p.slice(2, -2)}</strong>
        : <span key={j}>{p}</span>);
    return (
      <p key={i} className="text-[13px] leading-relaxed flex gap-1.5 mb-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>
        {bullet && <span className="flex-shrink-0" style={{ color: '#e8a020' }}>•</span>}
        <span>{parts}</span>
      </p>
    );
  });
}

const AI_CACHE = 'km_admin_ai';

export const AdminInsights: React.FC = () => {
  const [m, setM] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [ai, setAi] = useState<{ analysis?: string; ts?: number; message?: string; error?: string; model?: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem(AI_CACHE) || 'null'); } catch { return null; }
  });
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api.adminInsights()
      .then((d: any) => setM(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const runAi = () => {
    setAiLoading(true);
    api.adminAiAnalysis()
      .then((d: any) => {
        if (d.available === false) { setAi({ message: d.message }); }
        else if (d.error) { setAi({ error: d.error }); }
        else {
          const next = { analysis: d.analysis, model: d.model, ts: Date.now() };
          setAi(next);
          try { localStorage.setItem(AI_CACHE, JSON.stringify(next)); } catch {}
        }
      })
      .catch((e: any) => setAi({ error: e.message || 'שגיאה' }))
      .finally(() => setAiLoading(false));
  };

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: '60vh' }}>
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!m) return <div className="text-center text-sm mt-10" style={{ color: 'rgba(255,255,255,0.4)' }}>אין נתונים</div>;

  const fillTone = m.fillRate >= 70 ? 'good' : m.fillRate >= 40 ? 'gold' : 'bad';
  const repeatTone = m.repeatRate >= 40 ? 'good' : m.repeatRate >= 20 ? 'gold' : 'bad';
  const revUp = m.momRevenue.growthPct >= 0;
  const maxFunnel = Math.max(1, m.funnel.posted);
  const maxCity = Math.max(1, ...(m.topCities || []).map((c: any) => c.shifts));

  return (
    <div className="space-y-4 pb-4">
      {/* ===== יועץ AI ===== */}
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2a1f44 0%, #0f1829 100%)', border: '1px solid rgba(167,139,250,0.3)', boxShadow: '0 8px 40px rgba(167,139,250,0.12)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} style={{ color: '#c4b5fd' }} />
          <span className="font-black text-white text-sm">היועץ העסקי החכם</span>
        </div>
        <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>ניתוח אסטרטגי של הנתונים שלך — מבוסס AI</p>

        {!ai && !aiLoading && (
          <button onClick={runAi} className="w-full rounded-2xl py-3.5 font-black text-sm flex items-center justify-center gap-2 active:scale-98 transition-transform"
            style={{ background: 'linear-gradient(135deg,#a78bfa,#c4b5fd)', color: '#1a1340' }}>
            <Sparkles size={16} /> נתח את העסק שלי
          </button>
        )}

        {aiLoading && (
          <div className="flex items-center gap-3 py-4 justify-center">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: '#c4b5fd', borderTopColor: 'transparent' }} />
            <span className="text-sm font-semibold" style={{ color: '#c4b5fd' }}>מנתח את הנתונים שלך...</span>
          </div>
        )}

        {ai?.message && !aiLoading && (
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#c4b5fd' }} />
            <span className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{ai.message}</span>
          </div>
        )}
        {ai?.error && !aiLoading && (
          <div className="rounded-xl p-3 text-[12px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>{ai.error}</div>
        )}

        {ai?.analysis && !aiLoading && (
          <div>
            <div className="rounded-2xl p-3.5 mt-1" style={{ background: 'rgba(0,0,0,0.25)' }}>
              {renderAnalysis(ai.analysis)}
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {ai.ts ? new Date(ai.ts).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''} · AI
              </span>
              <button onClick={runAi} className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(167,139,250,0.15)', color: '#c4b5fd' }}>
                <RefreshCw size={11} /> ניתוח חדש
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== מטריקות יזם ===== */}
      <SectionTitle>מטריקות מפתח</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Metric icon={<Percent size={16} />} label="Take Rate (אחוז עמלה מהמחזור)" value={`${m.takeRate}%`} hint={`${ils(m.avgCommissionPerShift)} למשמרת`} tone="gold" />
        <Metric icon={<Target size={16} />} label="Fill Rate (אחוז איוש מוצלח)" value={`${m.fillRate}%`} hint={`${m.cancelRate}% ביטולים`} tone={fillTone} />
        <Metric icon={<Repeat size={16} />} label="מסעדות חוזרות" value={`${m.repeatRate}%`} hint={`${num(m.repeatRestaurants)}/${num(m.restaurantsWithShift)} מסעדות`} tone={repeatTone} />
        <Metric icon={<Activity size={16} />} label="עובדים פעילים (30 ימים)" value={`${m.workerActiveRate}%`} hint={`${num(m.activeWorkers30d)}/${num(m.totalWorkers)} עובדים`} tone="neutral" />
        <Metric icon={revUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />} label="צמיחת הכנסה (חודשי)" value={`${revUp ? '+' : ''}${m.momRevenue.growthPct}%`} hint={`${ils(m.momRevenue.current)} החודש`} tone={revUp ? 'good' : 'bad'} />
        <Metric icon={<GraduationCap size={16} />} label="המרת סטאז'→שותפות" value={`${m.stageConversion.pct}%`} hint={`${num(m.stageConversion.partnerships)}/${num(m.stageConversion.stages)} סטאז'ים`} tone="gold" />
      </div>

      {/* ===== ערך משמרת ===== */}
      <div className="grid grid-cols-2 gap-3">
        <Metric icon={<Wallet size={16} />} label="ערך ממוצע למשמרת (GMV)" value={ils(m.avgShiftValue)} tone="neutral" />
        <Metric icon={<TrendingUp size={16} />} label="צמיחת משתמשים (חודשי)" value={`${m.momUsers.growthPct >= 0 ? '+' : ''}${m.momUsers.growthPct}%`} hint={`${num(m.momUsers.current)} החודש`} tone={m.momUsers.growthPct >= 0 ? 'good' : 'bad'} />
      </div>

      {/* ===== משפך ===== */}
      <Card>
        <SectionTitle><span className="inline-flex items-center gap-1.5"><Filter size={14} style={{ color: '#60a5fa' }} /> משפך המרה</span></SectionTitle>
        <div className="space-y-2.5">
          {[
            { label: 'משמרות שפורסמו', v: m.funnel.posted, c: '#60a5fa' },
            { label: 'שובץ עובד', v: m.funnel.assigned, c: '#a78bfa' },
            { label: 'הושלמו', v: m.funnel.completed, c: '#34d399' },
          ].map((row, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white font-semibold">{row.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {num(row.v)}{i > 0 && m.funnel.posted > 0 ? ` · ${Math.round((row.v / maxFunnel) * 100)}%` : ''}
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${(row.v / maxFunnel) * 100}%`, background: row.c }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ===== ערים מובילות ===== */}
      {(m.topCities || []).length > 0 && (
        <Card>
          <SectionTitle><span className="inline-flex items-center gap-1.5"><MapPin size={14} style={{ color: '#e8a020' }} /> ערים מובילות</span></SectionTitle>
          <div className="space-y-2.5">
            {m.topCities.map((c: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white font-semibold">{c.city}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{num(c.shifts)} משמרות · {ils(c.commission)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(c.shifts / maxCity) * 100}%`, background: 'linear-gradient(90deg,#e8a020,#f5c842)' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="text-[10px] text-center leading-relaxed px-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
        היועץ מנתח נתונים מצרפיים בלבד (ללא פרטים אישיים). ההמלצות הן כלי עזר ואינן ייעוץ פיננסי מחייב.
      </p>
    </div>
  );
};
