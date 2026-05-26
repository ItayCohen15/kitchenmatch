import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Clock, Star, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

const MONTH_NAMES = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
const DAY_NAMES   = ['','ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const ROLE_LABELS: Record<string,string> = { chef:'שפים', line_cook:'טבחים', dishwasher:'מדיחים' };
const ROLE_COLORS: Record<string,string> = { chef:'#e8a020', line_cook:'#3b82f6', dishwasher:'#10b981' };

const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="bg-white rounded-xl shadow-lg p-3 text-right border border-gray-100 text-sm">
    <p className="font-bold text-gray-700 mb-1">{label}</p>
    {payload.map((p: any, i: number) => (
      <p key={i} style={{ color: p.color }}>
        {typeof p.value === 'number' && p.value > 50 ? `₪${p.value.toLocaleString()}` : p.value}
        {p.name === 'shifts' ? ' משמרות' : ''}
      </p>
    ))}
  </div>
) : null;

const KPI = ({ icon, label, value, sub, color }: any) => (
  <div className="bg-white rounded-2xl p-4 card-shadow">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3`} style={{ background: color + '20' }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="font-black text-gray-900 text-xl leading-tight">{value}</div>
    {sub && <div className="text-xs font-medium mt-0.5" style={{ color }}>{sub}</div>}
    <div className="text-gray-400 text-xs mt-0.5">{label}</div>
  </div>
);

export const RestaurantAnalytics: React.FC = () => {
  const { userProfile } = useApp();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllWorkers, setShowAllWorkers] = useState(false);

  useEffect(() => {
    if (!userProfile?.Id) { setLoading(false); return; }
    api.getRestaurantAnalytics(userProfile.Id)
      .then(data => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [userProfile?.Id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (jobs.length === 0) return (
    <div className="screen-enter space-y-4">
      <h2 className="text-xl font-black text-gray-900">ניתוח ביצועים</h2>
      <div className="rounded-3xl p-8 text-center text-white"
        style={{ background: 'linear-gradient(135deg,#0d1420,#1a2744)' }}>
        <div className="text-5xl mb-3">📊</div>
        <p className="font-bold text-lg">אין עדיין נתונים</p>
        <p className="text-gray-400 text-sm mt-1">הנתונים יופיעו לאחר השלמת משמרות</p>
      </div>
    </div>
  );

  // ── חישובים ──
  const totalSpend  = jobs.reduce((s,j) => s + (j.TotalPay || j.HourlyRate * (j.Hours||5)) * 1.065, 0);
  const totalHours  = jobs.reduce((s,j) => s + (j.Hours || 5), 0);
  const avgPerShift = totalSpend / jobs.length;
  const avgHourly   = totalSpend / (totalHours || 1);

  // חודשי
  const monthlyMap: Record<string,{spend:number,shifts:number,hours:number}> = {};
  jobs.forEach(j => {
    const key = `${MONTH_NAMES[j.Month-1]}`;
    if (!monthlyMap[key]) monthlyMap[key] = {spend:0,shifts:0,hours:0};
    monthlyMap[key].spend  += (j.TotalPay || j.HourlyRate*(j.Hours||5)) * 1.065;
    monthlyMap[key].shifts += 1;
    monthlyMap[key].hours  += j.Hours || 5;
  });
  const monthlyData = Object.entries(monthlyMap).map(([m,v]) => ({ month:m, ...v, spend: Math.round(v.spend) }));

  // ימים
  const dayMap: Record<number,number> = {};
  jobs.forEach(j => { dayMap[j.WeekDay] = (dayMap[j.WeekDay]||0) + 1; });
  const dayData = Object.entries(dayMap)
    .map(([d,c]) => ({ day: DAY_NAMES[Number(d)] || `יום ${d}`, shifts: c }))
    .sort((a,b) => b.shifts - a.shifts);

  // תפקידים
  const roleMap: Record<string,number> = {};
  jobs.forEach(j => { roleMap[j.Role] = (roleMap[j.Role]||0)+1; });
  const roleDist = Object.entries(roleMap).map(([r,c]) => ({
    name: ROLE_LABELS[r]||r, value: Math.round(c/jobs.length*100),
    color: ROLE_COLORS[r]||'#9ca3af', count: c,
  }));

  // עובדים מובילים
  const workerMap: Record<string,{count:number,rating:number,name:string}> = {};
  jobs.forEach(j => {
    if (!j.WorkerName) return;
    if (!workerMap[j.WorkerName]) workerMap[j.WorkerName] = {count:0,rating:0,name:j.WorkerName};
    workerMap[j.WorkerName].count++;
    if (j.WorkerRating) workerMap[j.WorkerName].rating = j.WorkerRating;
  });
  const topWorkers = Object.values(workerMap).sort((a,b) => b.count-a.count);

  // השוואת חודש נוכחי vs קודם
  const thisMonth = new Date().getMonth();
  const thisJobs  = jobs.filter(j => j.Month-1 === thisMonth);
  const lastJobs  = jobs.filter(j => j.Month-1 === (thisMonth-1+12)%12);
  const thisSpend = thisJobs.reduce((s,j) => s+(j.TotalPay||j.HourlyRate*(j.Hours||5))*1.065,0);
  const lastSpend = lastJobs.reduce((s,j) => s+(j.TotalPay||j.HourlyRate*(j.Hours||5))*1.065,0);
  const changePct = lastSpend > 0 ? ((thisSpend-lastSpend)/lastSpend*100).toFixed(0) : null;

  // תובנה חכמה
  const busiestDay  = dayData[0]?.day || 'שישי';
  const topRole     = roleDist.sort((a,b)=>b.count-a.count)[0]?.name || '';
  const insight     = topWorkers.length > 0
    ? `העובד ${topWorkers[0].name} עבד אצלך ${topWorkers[0].count} פעמים — שקול ליצור איתו קשר קבוע`
    : `${busiestDay} הוא היום הכי עמוס. מומלץ לפרסם משמרות ביום חמישי מראש`;

  return (
    <div className="screen-enter space-y-5 pb-4">

      {/* כותרת */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">ניתוח ביצועים</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{jobs.length} משמרות</span>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">
        <KPI icon={<TrendingUp size={18}/>} label="סה״כ הוצאות" value={`₪${Math.round(totalSpend).toLocaleString()}`}
          sub={changePct ? `${Number(changePct)>0?'↑':'↓'}${Math.abs(Number(changePct))}% מחודש שעבר` : null}
          color={changePct && Number(changePct)>0 ? '#ef4444' : '#10b981'} />
        <KPI icon={<Clock size={18}/>} label="סה״כ שעות" value={`${Math.round(totalHours).toLocaleString()}`}
          sub={`ממוצע ${(totalHours/jobs.length).toFixed(1)} ש׳/משמרת`} color="#3b82f6" />
        <KPI icon={<span style={{fontSize:16}}>💰</span>} label="ממוצע למשמרת" value={`₪${Math.round(avgPerShift)}`}
          sub={`₪${Math.round(avgHourly)}/שעה בממוצע`} color="#e8a020" />
        <KPI icon={<Star size={18}/>} label="עובדים שונים" value={`${topWorkers.length}`}
          sub={topWorkers.length > 0 ? `מוביל: ${topWorkers[0].name.split(' ')[0]}` : null} color="#8b5cf6" />
      </div>

      {/* גרף הוצאות */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800">הוצאות חודשיות</h3>
          <span className="text-xs text-gray-400">₪</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">כולל עמלת פלטפורמה 6.5%</p>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={monthlyData} margin={{top:5,right:5,left:-20,bottom:0}}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#e8a020" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#e8a020" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
            <Tooltip content={<Tip/>}/>
            <Area type="monotone" dataKey="spend" name="הוצאות" stroke="#e8a020" strokeWidth={2.5} fill="url(#g1)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* יום בשבוע */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3">ימי משמרות פופולריים</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={dayData.slice(0,7)} margin={{top:5,right:5,left:-25,bottom:0}}>
            <XAxis dataKey="day" tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
            <Tooltip content={<Tip/>}/>
            <Bar dataKey="shifts" name="shifts" radius={[6,6,0,0]} maxBarSize={28}>
              {dayData.slice(0,7).map((_,i) => (
                <Cell key={i} fill={i===0 ? '#e8a020' : '#e2e8f0'}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2 text-center">
          📊 יום <strong>{busiestDay}</strong> הכי עמוס — {dayData[0]?.shifts || 0} משמרות
        </p>
      </div>

      {/* תפקידים */}
      {roleDist.length > 0 && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="font-bold text-gray-800 mb-3">התפלגות תפקידים</h3>
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
                    <span className="text-sm text-gray-700">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 text-sm">{d.value}%</span>
                    <span className="text-gray-400 text-xs mr-1">({d.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* עובדים מובילים */}
      {topWorkers.length > 0 && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="font-bold text-gray-800 mb-3">👨‍🍳 עובדים מובילים</h3>
          <div className="space-y-2">
            {(showAllWorkers ? topWorkers : topWorkers.slice(0,3)).map((w,i) => (
              <div key={w.name} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{background: i===0?'#e8a020':i===1?'#94a3b8':'#b45309'}}>
                  {i+1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">{w.name}</div>
                  <div className="text-gray-400 text-xs">{w.count} משמרות</div>
                </div>
                {w.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    ★{w.rating.toFixed(1)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {topWorkers.length > 3 && (
            <button onClick={() => setShowAllWorkers(!showAllWorkers)}
              className="w-full mt-2 text-gray-400 text-sm flex items-center justify-center gap-1 py-1">
              {showAllWorkers ? <><ChevronUp size={14}/> פחות</> : <><ChevronDown size={14}/> עוד {topWorkers.length-3} עובדים</>}
            </button>
          )}
        </div>
      )}

      {/* השוואת חודשים */}
      {monthlyData.length >= 2 && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="font-bold text-gray-800 mb-3">📅 השוואה חודשית</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: MONTH_NAMES[thisMonth], spend: thisSpend, shifts: thisJobs.length },
              { label: MONTH_NAMES[(thisMonth-1+12)%12], spend: lastSpend, shifts: lastJobs.length },
            ].map((m,i) => (
              <div key={i} className="rounded-xl p-3 text-center"
                style={{background: i===0 ? 'rgba(232,160,32,0.08)' : '#f8fafc',
                        border: i===0 ? '1px solid rgba(232,160,32,0.2)' : '1px solid #f1f5f9'}}>
                <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                <div className="font-black text-lg text-gray-900">₪{Math.round(m.spend).toLocaleString()}</div>
                <div className="text-xs text-gray-500">{m.shifts} משמרות</div>
              </div>
            ))}
          </div>
          {changePct && (
            <div className={`mt-3 text-center text-sm font-semibold rounded-xl py-2 ${
              Number(changePct) <= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}>
              {Number(changePct) <= 0 ? '✅ חסכת' : '⚠️ הוצאת'} {Math.abs(Number(changePct))}% לעומת חודש שעבר
            </div>
          )}
        </div>
      )}

      {/* תובנה חכמה */}
      <div className="rounded-2xl p-4 text-white"
        style={{background:'linear-gradient(135deg,#0d1420,#1a2744)'}}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{background:'rgba(232,160,32,0.2)'}}>
            <Zap size={18} style={{color:'#e8a020'}}/>
          </div>
          <div>
            <div className="font-bold text-sm mb-1" style={{color:'#e8a020'}}>💡 תובנה חכמה</div>
            <div className="text-gray-300 text-sm leading-relaxed">{insight}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
