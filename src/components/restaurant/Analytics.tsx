import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Clock, Star, Zap, ChevronDown, ChevronUp, Flame, Handshake, Scale, BarChart3, ChefHat, GraduationCap, ClipboardList, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { blendedMarket } from '../../utils/marketRates';

const MONTH_NAMES = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
const DAY_NAMES   = ['','ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
// תוויות ברבים (ייחודי למסך הזה — בשאר האפליקציה משתמשים ב-ROLE_LABELS מ-utils/roles)
const ROLE_LABELS: Record<string,string> = { chef:'שפים', line_cook:'טבחים', prep_cook:'טבחי הכנות', dishwasher:'מדיחים', cleaner:'ניקיון', bartender:'ברמנים', barista:'בריסטות', waiter:'מלצרים', pastry_chef:'קונדיטורים', host:'מארחים' };
const ROLE_COLORS: Record<string,string> = { chef:'#ef5f3c', line_cook:'#3b74d1', prep_cook:'#12a594', dishwasher:'#3f7d86', cleaner:'#1f9d6b', bartender:'#9a5ba6', barista:'#b5701f', waiter:'#3b74d1', pastry_chef:'#d1568f', host:'#c99a2e' };

// אחוז עמלת המסעדה לפי סוג המשמרת: שותפות/סטאז' 4.5%, חירום 12%, רגיל 6.5%
const restRate = (j: any) =>
  (j.JobType === 'direct' || j.JobType === 'stage_shift') ? 0.045 : j.IsEmergency ? 0.12 : 0.065;
const baseOf = (j: any) => Number(j.TotalPay ?? (j.HourlyRate * (j.Hours || 0))) || 0;
const costOf = (j: any) => baseOf(j) * (1 + restRate(j));

const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="rounded-xl p-3 text-right text-sm" style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 6px 20px -8px rgba(20,26,46,.18)' }}>
    <p className="font-black mb-1" style={{ color: '#141a2e' }}>{label}</p>
    {payload.map((p: any, i: number) => (
      <p key={i} style={{ color: p.color }}>
        {typeof p.value === 'number' && p.value > 50 ? `₪${p.value.toLocaleString()}` : p.value}
        {p.name === 'shifts' ? ' משמרות' : ''}
      </p>
    ))}
  </div>
) : null;

const KPI = ({ icon, label, value, sub, color }: any) => (
  <div className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3`} style={{ background: color + '20' }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="font-black leading-tight" style={{ fontSize: 20, color: '#141a2e' }}>{value}</div>
    {sub && <div className="text-xs font-bold mt-0.5" style={{ color }}>{sub}</div>}
    <div className="text-xs mt-0.5" style={{ color: '#7a8199' }}>{label}</div>
  </div>
);

export const RestaurantAnalytics: React.FC = () => {
  const { userProfile, navToRestaurant } = useApp();
  const [jobs, setJobs] = useState<any[]>([]);
  const [benchmark, setBenchmark] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllWorkers, setShowAllWorkers] = useState(false);

  useEffect(() => {
    if (!userProfile?.Id) { setLoading(false); return; }
    api.getRestaurantAnalytics(userProfile.Id)
      .then((data: any) => {
        // תמיכה בשני פורמטים (מערך ישן / אובייקט חדש)
        if (Array.isArray(data)) { setJobs(data); }
        else { setJobs(Array.isArray(data?.jobs) ? data.jobs : []); setBenchmark(Array.isArray(data?.benchmark) ? data.benchmark : []); }
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [userProfile?.Id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-[#5354d3] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (jobs.length === 0) return (
    <div className="screen-enter space-y-4">
      <h2 className="font-black" style={{ fontSize: 20, color: '#141a2e' }}>המרכז הפיננסי</h2>
      <div className="relative rounded-3xl p-8 text-center text-white overflow-hidden"
        style={{ background: '#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 260, height: 260, borderRadius: '50%', bottom: -120, left: -80, background: 'radial-gradient(circle, rgba(244,182,44,.20), transparent 66%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '50%', top: -80, left: 40, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />
        <div className="relative">
          <BarChart3 size={40} className="mx-auto mb-3" style={{ color: '#f4b62c' }} />
          <p className="font-black text-lg">אין עדיין נתונים</p>
          <p className="text-sm mt-1" style={{ color: '#b9c0d8' }}>התובנות הפיננסיות יופיעו לאחר השלמת משמרות</p>
        </div>
      </div>
    </div>
  );

  // ── חישובי ליבה ──
  const totalSpend  = jobs.reduce((s, j) => s + costOf(j), 0);
  const totalHours  = jobs.reduce((s, j) => s + (Number(j.Hours) || 0), 0);
  const avgPerShift = totalSpend / jobs.length;
  const avgHourly   = totalHours > 0 ? totalSpend / totalHours : 0;

  // חודש נוכחי מול קודם + צפי לסוף החודש
  const now = new Date();
  const inMonth = (j: any, m: number, y: number) => Number(j.Month) === m + 1 && Number(j.Year) === y;
  const prevM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const thisJobs  = jobs.filter(j => inMonth(j, now.getMonth(), now.getFullYear()));
  const lastJobs  = jobs.filter(j => inMonth(j, prevM, prevY));
  const thisSpend = thisJobs.reduce((s, j) => s + costOf(j), 0);
  const lastSpend = lastJobs.reduce((s, j) => s + costOf(j), 0);
  const changePct = lastSpend > 0 ? Math.round((thisSpend - lastSpend) / lastSpend * 100) : null;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projection = now.getDate() >= 3 && thisSpend > 0 ? (thisSpend / now.getDate()) * daysInMonth : null;

  // מגמה חודשית (ממוין כרונולוגית, עד 6 חודשים)
  const monthlyMap: Record<string, { label: string; spend: number; shifts: number }> = {};
  jobs.forEach(j => {
    const key = `${j.Year}-${String(j.Month).padStart(2, '0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = { label: MONTH_NAMES[Number(j.Month) - 1], spend: 0, shifts: 0 };
    monthlyMap[key].spend += costOf(j);
    monthlyMap[key].shifts += 1;
  });
  const monthlyData = Object.keys(monthlyMap).sort().slice(-6)
    .map(k => ({ month: monthlyMap[k].label, spend: Math.round(monthlyMap[k].spend), shifts: monthlyMap[k].shifts }));

  // ימים בשבוע
  const dayMap: Record<number, number> = {};
  jobs.forEach(j => { dayMap[j.WeekDay] = (dayMap[j.WeekDay] || 0) + 1; });
  const dayData = Object.entries(dayMap)
    .map(([d, c]) => ({ day: DAY_NAMES[Number(d)] || `יום ${d}`, shifts: c }))
    .sort((a, b) => b.shifts - a.shifts);

  // תפקידים
  const roleMap: Record<string, number> = {};
  jobs.forEach(j => { roleMap[j.Role] = (roleMap[j.Role] || 0) + 1; });
  const roleDist = Object.entries(roleMap).map(([r, c]) => ({
    name: ROLE_LABELS[r] || r, value: Math.round(c / jobs.length * 100),
    color: ROLE_COLORS[r] || '#9ca3af', count: c,
  })).sort((a, b) => b.count - a.count);

  // עובדים מובילים
  const workerMap: Record<string, { count: number; rating: number; name: string }> = {};
  jobs.forEach(j => {
    if (!j.WorkerName) return;
    if (!workerMap[j.WorkerName]) workerMap[j.WorkerName] = { count: 0, rating: 0, name: j.WorkerName };
    workerMap[j.WorkerName].count++;
    if (j.WorkerRating) workerMap[j.WorkerName].rating = j.WorkerRating;
  });
  const topWorkers = Object.values(workerMap).sort((a, b) => b.count - a.count);

  // 🚨 פרמיית חירום: כמה עלו משמרות החירום מעבר לעמלה רגילה
  const emergencyJobs = jobs.filter(j => j.IsEmergency && j.JobType !== 'direct' && j.JobType !== 'stage_shift');
  const emergencyExtra = emergencyJobs.reduce((s, j) => s + baseOf(j) * (0.12 - 0.065), 0);

  // 🤝 חיסכון משותפויות: עמלה 4.5% במקום 6.5%
  const partnerJobs = jobs.filter(j => j.JobType === 'direct' || j.JobType === 'stage_shift');
  const partnerSavings = partnerJobs.reduce((s, j) => s + baseOf(j) * (0.065 - 0.045), 0);

  // ⚖️ אני מול השוק — התעריף שלי מול אומדן שוק אמיתי (או ממוצע הפלטפורמה כשיש מספיק נתונים)
  const myRateByRole: Record<string, { sum: number; n: number }> = {};
  jobs.forEach(j => {
    if (!myRateByRole[j.Role]) myRateByRole[j.Role] = { sum: 0, n: 0 };
    myRateByRole[j.Role].sum += Number(j.HourlyRate) || 0;
    myRateByRole[j.Role].n += 1;
  });
  const benchRows = Object.entries(myRateByRole).map(([role, v]) => {
    const mine = v.sum / v.n;
    const platform = benchmark.find((b: any) => b.Role === role);
    const blended = blendedMarket(role, Number(platform?.AvgRate) || 0, Number(platform?.Cnt) || 0);
    const market = blended?.avg || 0;
    const diffPct = market > 0 ? Math.round((mine - market) / market * 100) : null;
    return { role, label: ROLE_LABELS[role] || role, mine, market, range: blended?.range, noTips: blended?.noTips, source: blended?.source, diffPct };
  }).filter(r => r.market > 0);

  // 📋 פילוח לפי סוג משמרת — רגיל / חירום / קבועים / סטאז'רים (שכר ממוצע + עלות)
  const typeOf = (j: any) => j.JobType === 'direct' ? 'partner' : j.JobType === 'stage_shift' ? 'stage' : j.IsEmergency ? 'emergency' : 'regular';
  const TYPE_META: Record<string, { label: string; Icon: React.ComponentType<any>; color: string }> = {
    regular:   { label: 'משמרות רגילות', Icon: ChefHat,       color: '#5354d3' },
    emergency: { label: 'משמרות חירום',  Icon: Zap,           color: '#cf3030' },
    partner:   { label: 'עובדים קבועים', Icon: Handshake,     color: '#1f8f5f' },
    stage:     { label: "סטאז'רים",      Icon: GraduationCap, color: '#8d3cb6' },
  };
  const typeMap: Record<string, { count: number; rateSum: number; cost: number; hours: number }> = {};
  jobs.forEach(j => {
    const t = typeOf(j);
    if (!typeMap[t]) typeMap[t] = { count: 0, rateSum: 0, cost: 0, hours: 0 };
    typeMap[t].count += 1;
    typeMap[t].rateSum += Number(j.HourlyRate) || 0;
    typeMap[t].cost += costOf(j);
    typeMap[t].hours += Number(j.Hours) || 0;
  });
  const typeRows = (['regular', 'emergency', 'partner', 'stage'] as const)
    .filter(t => typeMap[t]?.count)
    .map(t => ({ key: t, ...TYPE_META[t], count: typeMap[t].count, avgRate: typeMap[t].rateSum / typeMap[t].count, cost: typeMap[t].cost }));

  // 🕐 שעות שיא — מתי אתה מוציא הכי הרבה
  const HOUR_BUCKETS = [
    { key: 'morning', label: 'בוקר (6–12)',   from: 6,  to: 12 },
    { key: 'noon',    label: 'צהריים (12–17)', from: 12, to: 17 },
    { key: 'evening', label: 'ערב (17–24)',    from: 17, to: 24 },
    { key: 'night',   label: 'לילה (0–6)',     from: 0,  to: 6 },
  ];
  const hourRows = HOUR_BUCKETS.map(b => {
    const list = jobs.filter(j => { const h = new Date(j.StartTime).getHours(); return h >= b.from && h < b.to; });
    return { ...b, count: list.length, cost: list.reduce((s, j) => s + costOf(j), 0) };
  }).filter(r => r.count > 0).sort((a, b) => b.cost - a.cost);
  const maxHourCost = hourRows[0]?.cost || 1;

  // עלות בפועל לפי תפקיד (₪, לא רק אחוזים)
  const roleCost: Record<string, number> = {};
  jobs.forEach(j => { roleCost[j.Role] = (roleCost[j.Role] || 0) + costOf(j); });

  // ROI שותפויות: דמי ההמרה (₪300 לעובד) מול החיסכון בעמלות
  const partnerNames = new Set(partnerJobs.map(j => j.WorkerName).filter(Boolean));
  const partnerInvestment = partnerNames.size * 300;
  const partnerROI = partnerInvestment > 0 ? partnerSavings / partnerInvestment : null;

  // צפי לחודש הבא (ממוצע 3 חודשים אחרונים)
  const last3 = monthlyData.slice(-3);
  const nextMonthForecast = last3.length >= 2 ? last3.reduce((s, m) => s + m.spend, 0) / last3.length : null;

  // אחוז משמרות חירום
  const emergencyShare = jobs.length > 0 ? Math.round(emergencyJobs.length / jobs.length * 100) : 0;

  // 💡 תובנות חכמות (עד 4, לפי מה שרלוונטי) — הכל נשאר בתוך האפליקציה
  const insights: string[] = [];
  if (emergencyShare >= 30 && emergencyExtra >= 20) insights.push(`${emergencyShare}% מהמשמרות שלך הן חירום. תכנון שבועי מראש היה חוסך לך כ־₪${Math.round(emergencyExtra).toLocaleString()} בפרמיות.`);
  else if (emergencyExtra >= 20) insights.push(`משמרות חירום עלו לך ₪${Math.round(emergencyExtra).toLocaleString()} מעבר לעמלה רגילה. פרסום יום מראש משאיר את הכסף אצלך.`);
  if (partnerSavings >= 10 && partnerROI !== null) insights.push(partnerROI >= 1
    ? `ההשקעה בעובדים קבועים (₪${partnerInvestment.toLocaleString()}) כבר החזירה את עצמה — חסכת ₪${Math.round(partnerSavings).toLocaleString()} בעמלות.`
    : `העובדים הקבועים חסכו לך ₪${Math.round(partnerSavings).toLocaleString()}. עוד ₪${Math.round(partnerInvestment - partnerSavings).toLocaleString()} והם מכסים את דמי ההמרה.`);
  const repeatNonPartner = topWorkers.find(w => w.count >= 2 && !partnerNames.has(w.name));
  if (repeatNonPartner) insights.push(`${repeatNonPartner.name} השלים אצלך ${repeatNonPartner.count} משמרות. שווה לצרף אותו כעובד קבוע ולרדת לעמלה של 4.5% בלבד.`);
  const cheapest = benchRows.filter(r => r.diffPct !== null).sort((a, b) => (a.diffPct! - b.diffPct!))[0];
  if (cheapest && cheapest.diffPct! <= -5) insights.push(`אתה משלם ל${cheapest.label} ${Math.abs(cheapest.diffPct!)}% מתחת לשוק. חיסכון יפה, רק שים לב למהירות האיוש.`);
  else if (cheapest && cheapest.diffPct! >= 8) insights.push(`השכר שאתה מציע ל${cheapest.label} גבוה ב-${cheapest.diffPct}% מהשוק. זה מאייש מהר, אבל יש מקום להתייעל.`);
  if (nextMonthForecast) insights.push(`לפי ${last3.length} החודשים האחרונים, צפי ההוצאה לחודש הבא הוא כ־₪${Math.round(nextMonthForecast).toLocaleString()}.`);
  if (dayData[0]) insights.push(`${dayData[0].day} הוא היום העמוס שלך (${dayData[0].shifts} משמרות). כדאי לפרסם אליו מוקדם כדי לתפוס את העובדים המדורגים.`);

  return (
    <div className="screen-enter space-y-5 pb-4">

      {/* ── HERO: החודש שלך ── */}
      <div className="relative rounded-3xl p-5 text-white overflow-hidden" style={{ background: '#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 260, height: 260, borderRadius: '50%', bottom: -120, left: -80, background: 'radial-gradient(circle, rgba(244,182,44,.20), transparent 66%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '50%', top: -80, left: 40, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm" style={{ color: '#b9c0d8' }}>הוצאות {MONTH_NAMES[now.getMonth()]} (כולל עמלות)</span>
            {changePct !== null && (
              <span className="text-[11px] font-extrabold px-2 py-0.5" style={{ borderRadius: 6, background: changePct <= 0 ? 'rgba(31,143,95,.18)' : 'rgba(207,48,48,.18)', color: changePct <= 0 ? '#5fd39f' : '#ff8b8b' }}>
                {changePct <= 0 ? '↓' : '↑'}{Math.abs(changePct)}% מחודש שעבר
              </span>
            )}
          </div>
          <div className="font-black mb-3" style={{ fontSize: 34, color: '#f4b62c' }}>
            ₪{Math.round(thisSpend).toLocaleString()}
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { l: 'משמרות החודש', v: thisJobs.length },
              { l: 'ממוצע למשמרת', v: `₪${Math.round(avgPerShift)}` },
              { l: 'צפי לסוף החודש', v: projection ? `₪${Math.round(projection).toLocaleString()}` : '—' },
            ].map(s => (
              <div key={s.l} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,.08)' }}>
                <div className="font-black text-sm">{s.v}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#8f97b5' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI כלליים */}
      <div className="grid grid-cols-2 gap-3">
        <KPI icon={<TrendingUp size={18}/>} label={'סה"כ הוצאות (מאז ומעולם)'} value={`₪${Math.round(totalSpend).toLocaleString()}`}
          sub={`${jobs.length} משמרות`} color="#f4b62c" />
        <KPI icon={<Clock size={18}/>} label={'סה"כ שעות עבודה'} value={`${Math.round(totalHours).toLocaleString()}`}
          sub={`₪${Math.round(avgHourly)}/שעה בממוצע`} color="#5354d3" />
      </div>

      {/* 🤝 + 🚨 כרטיסי כסף */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: '#1f8f5f', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <Handshake size={18} className="mb-2" style={{ color: 'rgba(255,255,255,.85)' }} />
          <div className="font-black text-white" style={{ fontSize: 20 }}>₪{Math.round(partnerSavings).toLocaleString()}</div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.85)' }}>חסכת עם קבועים וסטאז'רים</div>
          <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,.6)' }}>
            עמלה 4.5% · {partnerJobs.length} משמרות{partnerROI !== null ? (partnerROI >= 1 ? ' · ההשקעה הוחזרה ✓' : ` · ${Math.round(partnerROI * 100)}% מההשקעה הוחזרה`) : ''}
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: '#cf3030', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <Flame size={18} className="mb-2" style={{ color: 'rgba(255,255,255,.85)' }} />
          <div className="font-black text-white" style={{ fontSize: 20 }}>₪{Math.round(emergencyExtra).toLocaleString()}</div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,.85)' }}>פרמיית חירום ששילמת</div>
          <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,.6)' }}>{emergencyJobs.length} משמרות חירום · תכנון מראש חוסך</div>
        </div>
      </div>

      {/* גרף הוצאות */}
      {monthlyData.length > 0 && (
        <div className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black" style={{ color: '#141a2e' }}>מגמת הוצאות</h3>
            <span className="text-xs" style={{ color: '#7a8199' }}>6 חודשים אחרונים</span>
          </div>
          <p className="text-xs mb-3" style={{ color: '#7a8199' }}>כולל עמלת פלטפורמה לפי סוג המשמרת</p>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={monthlyData} margin={{top:5,right:-20,left:5,bottom:0}}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#5354d3" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#5354d3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" reversed tick={{fontSize:10,fill:'#7a8199'}} axisLine={false} tickLine={false}/>
              <YAxis orientation="right" tick={{fontSize:10,fill:'#7a8199'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Area type="monotone" dataKey="spend" name="הוצאות" stroke="#5354d3" strokeWidth={2.5} fill="url(#g1)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ⚖️ אני מול השוק */}
      {benchRows.length > 0 && (
        <div className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Scale size={16} style={{ color: '#5354d3' }} />
            <h3 className="font-black" style={{ color: '#141a2e' }}>השכר שלך מול השוק</h3>
          </div>
          <div className="space-y-3">
            {benchRows.map(r => (
              <div key={r.role}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: '#2b3350' }}>{r.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm" style={{ color: '#141a2e' }}>אתה ₪{Math.round(r.mine)}</span>
                    {r.diffPct !== null && Math.abs(r.diffPct) >= 3 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5" style={{ borderRadius: 6, background: r.diffPct < 0 ? 'rgba(31,143,95,.10)' : '#fdf0cf', color: r.diffPct < 0 ? '#1f8f5f' : '#8a6300' }}>
                        {r.diffPct < 0 ? `${Math.abs(r.diffPct)}%- מהשוק` : `${r.diffPct}%+ מהשוק`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#7a8199' }}>
                  שוק אקסטרות: ממוצע ₪{Math.round(r.market)}{r.range ? ` · טווח מקובל ${r.range}` : ''}
                  {r.noTips && <span style={{ color: '#8a6300' }}> · לא כולל טיפים</span>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-3 leading-relaxed" style={{ color: '#7a8199' }}>
            הטווחים מתייחסים לשכר <b>אקסטרות</b> (עובדי משמרת מזדמנים) בענף ההסעדה בישראל, 2025 · במלצרות וברמנות — לא כולל טיפים · שכר מעל השוק מאייש מהר יותר
          </p>
        </div>
      )}

      {/* 📋 פילוח לפי סוג משמרת — כולל קבועים וסטאז'רים */}
      {typeRows.length > 0 && (
        <div className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <h3 className="font-black mb-3" style={{ color: '#141a2e' }}>פילוח לפי סוג משמרת</h3>
          <div className="space-y-2.5">
            {typeRows.map(t => (
              <div key={t.key} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.color + '15' }}>
                  <t.Icon size={17} style={{ color: t.color }} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: '#141a2e' }}>{t.label}</div>
                  <div className="text-xs" style={{ color: '#7a8199' }}>{t.count} משמרות · שכר ממוצע ₪{Math.round(t.avgRate)}/ש'</div>
                </div>
                <span className="font-black text-sm" style={{ color: t.color }}>₪{Math.round(t.cost).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {typeMap['regular'] && (typeMap['partner'] || typeMap['stage']) && (
            <p className="text-[11px] mt-3 rounded-lg px-2.5 py-1.5" style={{ color: '#1f8f5f', background: 'rgba(31,143,95,.08)' }}>
              קבועים וסטאז'רים עולים לך 4.5% עמלה בלבד — לעומת 6.5% במשמרת רגילה ו-12% בחירום
            </p>
          )}
        </div>
      )}

      {/* 🕐 שעות שיא */}
      {hourRows.length > 1 && (
        <div className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <h3 className="font-black mb-3 flex items-center gap-1.5" style={{ color: '#141a2e' }}><Clock size={16} style={{ color: '#7a8199' }} /> מתי אתה מוציא הכי הרבה</h3>
          <div className="space-y-2">
            {hourRows.map((h, i) => (
              <div key={h.key} className="flex items-center gap-2.5">
                <span className="text-xs w-24 flex-shrink-0" style={{ color: '#6b7290' }}>{h.label}</span>
                <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: '#f4f5f9' }}>
                  <div className="h-full rounded-lg" style={{
                    width: `${Math.max(Math.round(h.cost / maxHourCost * 100), 8)}%`,
                    background: i === 0 ? '#f4b62c' : '#e6e8f0',
                  }} />
                </div>
                <span className="text-xs font-black w-16 text-left flex-shrink-0" style={{ color: i === 0 ? '#8a6300' : '#7a8199' }}>
                  ₪{Math.round(h.cost).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-2.5" style={{ color: '#7a8199' }}>{hourRows[0]?.label} היא תקופת ההוצאה הגדולה שלך ({hourRows[0]?.count} משמרות)</p>
        </div>
      )}

      {/* יום בשבוע */}
      <div className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
        <h3 className="font-black mb-3" style={{ color: '#141a2e' }}>ימי משמרות פופולריים</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={dayData.slice(0,7)} margin={{top:5,right:-25,left:5,bottom:0}}>
            <XAxis dataKey="day" reversed tick={{fontSize:10,fill:'#7a8199'}} axisLine={false} tickLine={false}/>
            <YAxis orientation="right" tick={{fontSize:10,fill:'#7a8199'}} axisLine={false} tickLine={false}/>
            <Tooltip content={<Tip/>}/>
            <Bar dataKey="shifts" name="shifts" radius={[6,6,0,0]} maxBarSize={28}>
              {dayData.slice(0,7).map((_,i) => (
                <Cell key={i} fill={i===0 ? '#5354d3' : '#e6e8f0'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs mt-2 text-center" style={{ color: '#7a8199' }}>
          יום <strong style={{ color: '#141a2e' }}>{dayData[0]?.day}</strong> הכי עמוס — {dayData[0]?.shifts || 0} משמרות
        </p>
      </div>

      {/* תפקידים */}
      {roleDist.length > 0 && (
        <div className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <h3 className="font-black mb-3" style={{ color: '#141a2e' }}>התפלגות תפקידים</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={roleDist} cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3} dataKey="value">
                  {roleDist.map((e,i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {roleDist.map(d => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{background:d.color}}/>
                    <span className="text-sm" style={{ color: '#2b3350' }}>{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm" style={{ color: '#141a2e' }}>₪{Math.round(roleCost[Object.keys(ROLE_LABELS).find(k => ROLE_LABELS[k] === d.name) || ''] || 0).toLocaleString()}</span>
                    <span className="text-xs mr-1" style={{ color: '#7a8199' }}>({d.count} · {d.value}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* עובדים מובילים */}
      {topWorkers.length > 0 && (
        <div className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <h3 className="font-black mb-3 flex items-center gap-1.5" style={{ color: '#141a2e' }}><ChefHat size={16} style={{ color: '#7a8199' }} /> עובדים מובילים</h3>
          <div className="space-y-2">
            {(showAllWorkers ? topWorkers : topWorkers.slice(0,3)).map((w,i) => (
              <div key={w.name} className="flex items-center gap-3 py-2 border-b border-[#f4f5f9] last:border-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                  style={{background: i===0?'#e8a020':i===1?'#94a3b8':'#b45309'}}>
                  {i+1}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm" style={{ color: '#141a2e' }}>{w.name}</div>
                  <div className="text-xs" style={{ color: '#7a8199' }}>{w.count} משמרות</div>
                </div>
                {w.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs font-black" style={{ color: '#f4b62c' }}>
                    <Star size={12} className="fill-current" />{w.rating.toFixed(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {topWorkers.length > 3 && (
            <button onClick={() => setShowAllWorkers(!showAllWorkers)}
              className="w-full mt-2 text-sm flex items-center justify-center gap-1 py-1" style={{ color: '#7a8199' }}>
              {showAllWorkers ? <><ChevronUp size={14}/> פחות</> : <><ChevronDown size={14}/> עוד {topWorkers.length-3} עובדים</>}
            </button>
          )}
        </div>
      )}

      {/* 💡 תובנות חכמות */}
      {insights.length > 0 && (
        <div className="relative rounded-2xl p-4 text-white overflow-hidden" style={{background:'#141a2e'}}>
          <div className="absolute pointer-events-none" style={{ width: 220, height: 220, borderRadius: '50%', bottom: -110, left: -70, background: 'radial-gradient(circle, rgba(244,182,44,.16), transparent 66%)' }} />
          <div className="absolute pointer-events-none" style={{ width: 160, height: 160, borderRadius: '50%', top: -70, left: 30, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(83,84,211,0.22)'}}>
                <Zap size={16} style={{color:'#9a9bf5'}}/>
              </div>
              <span className="font-black text-sm" style={{color:'#f4b62c'}}>התובנות הפיננסיות שלך</span>
            </div>
            <div className="space-y-2.5">
              {insights.slice(0, 4).map((t, i) => (
                <div key={i} className="text-sm leading-relaxed flex items-start gap-2" style={{ color: '#cdd3e8' }}>
                  <span className="font-black flex-shrink-0 mt-0.5" style={{ color: '#f4b62c' }}>·</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navToRestaurant('create_job')}
              className="mt-3.5 text-xs font-extrabold rounded-lg px-3 py-1.5 active:scale-95 transition-transform"
              style={{ background:'#5354d3', color:'#fff' }}>
              פרסם משמרת מתוכננת ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
