import React, { useEffect, useState } from 'react';
import {
  Sparkles, TrendingUp, TrendingDown, Percent, Target, Repeat, Activity,
  GraduationCap, MapPin, Filter, Wallet, CheckCircle2, AlertTriangle, Rocket,
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

// ===== מנוע התובנות החכם — מבוסס כללים על הנתונים האמיתיים (ללא עלות) =====
interface Advisor {
  status: { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' };
  headline: string;
  strengths: string[];
  risks: string[];
  actions: { title: string; why: string }[];
  focus: { metric: string; why: string } | null;
}

function buildAdvisor(m: any): Advisor {
  const strengths: string[] = [];
  const risks: string[] = [];
  const actions: { title: string; why: string }[] = [];
  const resolved = (m.completed || 0) + (m.cancelled || 0);

  // --- שלב 0: אין עדיין משמרות שהושלמו ---
  if (!m.completed) {
    if (m.totalRestaurants === 0) actions.push({ title: 'גייס את המסעדה הראשונה', why: 'בלי מסעדות שמפרסמות משמרות אין ביקוש — זה צד ההכנסה שלך.' });
    if (m.totalWorkers === 0) actions.push({ title: 'גייס עובדים ראשונים', why: 'צריך היצע עובדים זמין כדי שמשמרת תוכל להתאייש.' });
    if (m.totalRestaurants > 0 && m.totalWorkers > 0 && !m.funnel.posted) actions.push({ title: 'הנע פרסום של משמרת ראשונה', why: 'יש לך משתמשים אך אף משמרת לא פורסמה — דחוף מסעדה לפרסם.' });
    if (m.funnel.posted > 0) actions.push({ title: 'סגור לולאה: השלם משמרת אחת מקצה לקצה', why: `פורסמו ${m.funnel.posted} משמרות אך אף אחת לא הושלמה. משמרת מושלמת אחת = ההכנסה הראשונה והוכחת ההיתכנות.` });
    actions.push({ title: 'הרץ פיילוט ממוקד בעיר אחת', why: 'ריכוז היצע וביקוש באזור אחד יוצר נזילות הרבה יותר מהר מפיזור.' });
    return {
      status: { label: 'בתחילת הדרך', tone: 'neutral' },
      headline: 'עוד אין משמרות שהושלמו — המשימה עכשיו היא למלא את הפלטפורמה בפעילות אמיתית.',
      strengths, risks, actions: actions.slice(0, 5),
      focus: { metric: 'משמרות שהושלמו', why: 'כל עוד המספר 0 — זו המטרה היחידה. המשמרת המושלמת הראשונה פותחת את כל שאר המטריקות.' },
    };
  }

  // --- חוזקות ---
  if (m.fillRate >= 80) strengths.push(`נזילות מצוינת — ${m.fillRate}% מהמשמרות מתאיישות בהצלחה.`);
  if (m.repeatRate >= 40) strengths.push(`שימור חזק — ${m.repeatRate}% מהמסעדות חוזרות להזמין.`);
  if (m.momRevenue.growthPct >= 20) strengths.push(`צמיחת הכנסות בריאה — +${m.momRevenue.growthPct}% מהחודש שעבר.`);
  if (m.workerActiveRate >= 50) strengths.push(`רוב העובדים פעילים (${m.workerActiveRate}%) — היצע ער.`);
  if (m.stageConversion.stages >= 3 && m.stageConversion.pct >= 30) strengths.push(`תוכנית הסטאז' עובדת — ${m.stageConversion.pct}% הומרו לשותפות.`);
  if (m.cancelRate <= 10 && resolved >= 5) strengths.push(`מעט ביטולים (${m.cancelRate}%) — אמינות גבוהה.`);

  // --- סיכונים + צעדים ---
  if (resolved >= 5 && m.fillRate < 50) {
    risks.push(`כמעט חצי מהמשמרות לא מתאיישות (Fill Rate ${m.fillRate}%).`);
    actions.push({ title: 'הגדל היצע עובדים באזורי הביקוש', why: `Fill Rate ${m.fillRate}% = חסרים עובדים זמינים כשמסעדה מפרסמת. גייס עובדים בערים המובילות או תמרץ זמינות.` });
  }
  if (resolved >= 5 && m.cancelRate > 25) {
    risks.push(`שיעור ביטולים גבוה (${m.cancelRate}%).`);
    actions.push({ title: 'צמצם ביטולים', why: 'ביטולים שורפים אמון בשני הצדדים. בדוק סיבות, חזק קנס ביטול מאוחר ושפר התאמה.' });
  }
  if (m.restaurantsWithShift >= 4 && m.repeatRate < 20) {
    risks.push(`מסעדות כמעט לא חוזרות (Repeat ${m.repeatRate}%).`);
    actions.push({ title: 'בנה מנגנון חזרה למסעדות', why: `רק ${m.repeatRate}% חוזרות — שימור זול מגיוס. פנייה אחרי משמרת, איכות עובד ותזכורת לפרסם שוב.` });
  }
  if (m.momRevenue.growthPct < 0) {
    risks.push(`ההכנסות ירדו החודש (${m.momRevenue.growthPct}%).`);
    actions.push({ title: 'החזר את קצב הפעילות', why: 'הכנסה יורדת = פחות משמרות מושלמות. הפעל מסעדות רדומות ועובדים לא פעילים.' });
  }
  if (m.totalRestaurants > 0 && m.totalWorkers / Math.max(1, m.totalRestaurants) > 6) {
    risks.push(`הרבה יותר עובדים ממסעדות (${num(m.totalWorkers)} מול ${num(m.totalRestaurants)}) — מחסור בביקוש.`);
    actions.push({ title: 'התמקד בגיוס מסעדות', why: 'יש היצע עובדים אך מעט מסעדות מפרסמות. צד הביקוש הוא צוואר הבקבוק להכנסה.' });
  } else if (m.totalWorkers > 0 && m.totalRestaurants / Math.max(1, m.totalWorkers) > 3) {
    risks.push('יותר מסעדות מעובדים — סיכון שמשמרות לא יתאיישו.');
    actions.push({ title: 'הגדל היצע עובדים', why: 'יש ביקוש אך מעט עובדים — בלי היצע, ה-Fill Rate ייפול.' });
  }
  if (m.totalWorkers >= 10 && m.workerActiveRate < 30) {
    risks.push(`רוב העובדים רדומים — רק ${m.workerActiveRate}% פעילים ב-30 יום.`);
    actions.push({ title: 'הפעל מחדש עובדים רדומים', why: 'בסיס עובדים גדול שלא עובד = היצע על הנייר בלבד. התראות ותמריצים להחזרה.' });
  }
  if (m.stageConversion.stages >= 2 && m.stageConversion.pct < 20) {
    actions.push({ title: "שפר המרת סטאז'→שותפות", why: `רק ${m.stageConversion.pct}% מהסטאז'ים הומרו. כל המרה = ₪300 + הכנסה חוזרת. הדגש למסעדה את ערך "שמירת העובד".` });
  }
  if (m.topCities?.length && m.completed >= 10) {
    const top = m.topCities[0];
    if (top.shifts / m.completed > 0.6) {
      risks.push(`ריכוז גאוגרפי גבוה — ${top.city} לבדה מהווה רוב הפעילות.`);
      actions.push({ title: `שכפל את ההצלחה של ${top.city} לעיר נוספת`, why: 'תלות בעיר אחת היא סיכון. מצאת נוסחה שעובדת — הרחב אותה.' });
    }
  }
  if (actions.length < 3 && m.repeatRate >= 20) {
    actions.push({ title: 'הגדל הכנסה מלקוחות קיימים', why: `יש לך ${num(m.repeatRestaurants)} מסעדות חוזרות — דחוף אותן למשמרות חירום (12%) ולשותפויות שמקבעות הכנסה.` });
  }

  // --- סטטוס כללי ---
  let status: Advisor['status']; let headline: string;
  const pos = strengths.length, neg = risks.length;
  if (neg === 0 && pos >= 2) { status = { label: 'בריא וצומח', tone: 'good' }; headline = 'המספרים נראים טוב — שמור על הקצב והתמקד בהגדלת ההיקף.'; }
  else if (neg >= 2 && pos === 0) { status = { label: 'דורש תשומת לב', tone: 'bad' }; headline = 'יש כמה נקודות תורפה מהותיות — טפל בהן לפי סדר העדיפויות למטה.'; }
  else { status = { label: 'בתנופה', tone: 'warn' }; headline = 'בסיס טוב לצד נקודות לשיפור — המנופים למטה ימקדו אותך.'; }

  // --- המטריקה של החודש (המנוף החלש ביותר) ---
  let focus: Advisor['focus'];
  if (resolved >= 5 && m.fillRate < 60) focus = { metric: 'Fill Rate', why: `${m.fillRate}% מהמשמרות מתאיישות. זה הלב של מרקטפלייס — כל שיפור פה מגדיל את כל השאר.` };
  else if (m.restaurantsWithShift >= 4 && m.repeatRate < 30) focus = { metric: 'מסעדות חוזרות', why: `שימור (${m.repeatRate}%) זול בהרבה מגיוס וקובע את ההכנסה החוזרת.` };
  else if (m.momRevenue.growthPct < 10) focus = { metric: 'צמיחת הכנסה חודשית', why: 'קצב הצמיחה הוא המדד שמשקיעים מסתכלים עליו ראשון.' };
  else focus = { metric: 'מחזור (GMV)', why: 'המנוע בריא — עכשיו הגדל היקף: יותר משמרות מושלמות = יותר עמלות.' };

  return { status, headline, strengths: strengths.slice(0, 4), risks: risks.slice(0, 4), actions: actions.slice(0, 5), focus };
}

export const AdminInsights: React.FC = () => {
  const [m, setM] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminInsights().then((d: any) => setM(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center" style={{ height: '60vh' }}>
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!m) return <div className="text-center text-sm mt-10" style={{ color: 'rgba(255,255,255,0.4)' }}>אין נתונים</div>;

  const adv = buildAdvisor(m);
  const statusColor = adv.status.tone === 'good' ? '#34d399' : adv.status.tone === 'bad' ? '#f87171' : adv.status.tone === 'warn' ? '#f5c842' : '#60a5fa';

  const fillTone = m.fillRate >= 70 ? 'good' : m.fillRate >= 40 ? 'gold' : 'bad';
  const repeatTone = m.repeatRate >= 40 ? 'good' : m.repeatRate >= 20 ? 'gold' : 'bad';
  // צמיחה — null כשאין בסיס השוואה (חודש קודם ריק) → "חדש"
  const fmtGrowth = (g: any) => g == null ? 'חדש' : `${g >= 0 ? '+' : ''}${g}%`;
  const growthTone = (g: any) => g == null ? 'neutral' : g >= 0 ? 'good' : 'bad';
  const revUp = m.momRevenue.growthPct == null ? null : m.momRevenue.growthPct >= 0;
  const maxFunnel = Math.max(1, m.funnel.posted);
  const maxCity = Math.max(1, ...(m.topCities || []).map((c: any) => c.shifts));

  return (
    <div className="space-y-4 pb-4">
      {/* ===== יועץ חכם ===== */}
      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a2744 0%, #0f1829 100%)', border: `1px solid ${statusColor}40`, boxShadow: `0 8px 40px ${statusColor}1a` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: '#f5c842' }} />
            <span className="font-black text-white text-sm">היועץ החכם</span>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-lg" style={{ background: statusColor + '22', color: statusColor }}>{adv.status.label}</span>
        </div>
        <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>{adv.headline}</p>

        {adv.strengths.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5"><CheckCircle2 size={13} style={{ color: '#34d399' }} /><span className="text-xs font-black" style={{ color: '#34d399' }}>מה עובד</span></div>
            {adv.strengths.map((s, i) => <p key={i} className="text-[12px] leading-relaxed flex gap-1.5 mb-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}><span style={{ color: '#34d399' }}>•</span><span>{s}</span></p>)}
          </div>
        )}
        {adv.risks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5"><AlertTriangle size={13} style={{ color: '#f87171' }} /><span className="text-xs font-black" style={{ color: '#f87171' }}>סיכונים</span></div>
            {adv.risks.map((s, i) => <p key={i} className="text-[12px] leading-relaxed flex gap-1.5 mb-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}><span style={{ color: '#f87171' }}>•</span><span>{s}</span></p>)}
          </div>
        )}
        {adv.actions.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5"><Rocket size={13} style={{ color: '#60a5fa' }} /><span className="text-xs font-black" style={{ color: '#60a5fa' }}>צעדים לצמיחה</span></div>
            <div className="space-y-2">
              {adv.actions.map((a, i) => (
                <div key={i} className="rounded-xl p-2.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <div className="flex gap-2">
                    <span className="font-black text-xs flex-shrink-0" style={{ color: '#60a5fa' }}>{i + 1}</span>
                    <div>
                      <div className="text-[13px] font-bold text-white leading-snug">{a.title}</div>
                      <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{a.why}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {adv.focus && (
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)' }}>
            <Target size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f5c842' }} />
            <div>
              <span className="text-xs font-black" style={{ color: '#f5c842' }}>המטריקה של החודש: {adv.focus.metric}</span>
              <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{adv.focus.why}</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== מטריקות מפתח ===== */}
      <SectionTitle>מטריקות מפתח</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Metric icon={<Percent size={16} />} label="Take Rate (אחוז עמלה מהמחזור)" value={`${m.takeRate}%`} hint={`${ils(m.avgCommissionPerShift)} למשמרת`} tone="gold" />
        <Metric icon={<Target size={16} />} label="Fill Rate (אחוז איוש מוצלח)" value={`${m.fillRate}%`} hint={`${m.cancelRate}% ביטולים`} tone={fillTone} />
        <Metric icon={<Repeat size={16} />} label="מסעדות חוזרות" value={`${m.repeatRate}%`} hint={`${num(m.repeatRestaurants)}/${num(m.restaurantsWithShift)} מסעדות`} tone={repeatTone} />
        <Metric icon={<Activity size={16} />} label="עובדים פעילים (30 ימים)" value={`${m.workerActiveRate}%`} hint={`${num(m.activeWorkers30d)}/${num(m.totalWorkers)} עובדים`} tone="neutral" />
        <Metric icon={revUp === false ? <TrendingDown size={16} /> : <TrendingUp size={16} />} label="צמיחת הכנסה (חודשי)" value={fmtGrowth(m.momRevenue.growthPct)} hint={`${ils(m.momRevenue.current)} החודש`} tone={growthTone(m.momRevenue.growthPct)} />
        <Metric icon={<GraduationCap size={16} />} label="המרת סטאז'→שותפות" value={`${m.stageConversion.pct}%`} hint={`${num(m.stageConversion.partnerships)}/${num(m.stageConversion.stages)} סטאז'ים`} tone="gold" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric icon={<Wallet size={16} />} label="ערך ממוצע למשמרת (GMV)" value={ils(m.avgShiftValue)} tone="neutral" />
        <Metric icon={<TrendingUp size={16} />} label="צמיחת משתמשים (חודשי)" value={fmtGrowth(m.momUsers.growthPct)} hint={`${num(m.momUsers.current)} החודש`} tone={growthTone(m.momUsers.growthPct)} />
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
        התובנות מחושבות אוטומטית מהנתונים שלך — כלי עזר, לא ייעוץ פיננסי מחייב.
      </p>
    </div>
  );
};
