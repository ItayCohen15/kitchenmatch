import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Clock, AlertCircle } from 'lucide-react';
import { ANALYTICS_DATA } from '../../data/mockData';

const ROLE_DIST = [
  { name: 'שפים', value: 45, color: '#f97316' },
  { name: 'טבחים', value: 38, color: '#3b82f6' },
  { name: 'מדיחים', value: 17, color: '#10b981' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-3 text-right border border-gray-100">
        <p className="font-bold text-gray-800 text-sm">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name === 'spend' ? `₪${p.value.toLocaleString()}` : `${p.value} משמרות`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const RestaurantAnalytics: React.FC = () => {
  const thisMonth = ANALYTICS_DATA[ANALYTICS_DATA.length - 1];
  const lastMonth = ANALYTICS_DATA[ANALYTICS_DATA.length - 2];
  const spendGrowth = (((thisMonth.spend - lastMonth.spend) / lastMonth.spend) * 100).toFixed(1);
  const shiftsGrowth = (((thisMonth.shifts - lastMonth.shifts) / lastMonth.shifts) * 100).toFixed(1);

  return (
    <div className="screen-enter space-y-4">
      <h2 className="text-xl font-black text-gray-900">ניתוח ביצועים</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            title: 'הוצאה חודשית',
            value: `₪${thisMonth.spend.toLocaleString()}`,
            change: `+${spendGrowth}%`,
            up: true,
            icon: <TrendingUp size={18} />,
            color: 'text-orange-500 bg-orange-50',
          },
          {
            title: 'משמרות',
            value: `${thisMonth.shifts}`,
            change: `+${shiftsGrowth}%`,
            up: true,
            icon: <Users size={18} />,
            color: 'text-blue-500 bg-blue-50',
          },
          {
            title: 'ממוצע לשעה',
            value: '₪396',
            change: '+2.1%',
            up: true,
            icon: <Clock size={18} />,
            color: 'text-green-500 bg-green-50',
          },
          {
            title: 'שיעור ביטולים',
            value: '4.2%',
            change: '-1.3%',
            up: false,
            icon: <AlertCircle size={18} />,
            color: 'text-purple-500 bg-purple-50',
          },
        ].map(kpi => (
          <div key={kpi.title} className="bg-white rounded-2xl p-4 card-shadow">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}>
              {kpi.icon}
            </div>
            <div className="font-black text-gray-900 text-xl">{kpi.value}</div>
            <div className="text-gray-500 text-xs">{kpi.title}</div>
            <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
              {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {kpi.change} מחודש שעבר
            </div>
          </div>
        ))}
      </div>

      {/* Spend chart */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-4">הוצאות לאורך זמן</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={ANALYTICS_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#spendGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Shifts chart */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-4">מספר משמרות</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={ANALYTICS_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="shifts" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Role distribution */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-4">התפלגות תפקידים</h3>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={ROLE_DIST}
                  cx="50%" cy="50%"
                  innerRadius={32} outerRadius={54}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ROLE_DIST.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {ROLE_DIST.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-gray-700">{d.name}</span>
                </div>
                <span className="font-bold text-gray-900 text-sm">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="bg-gradient-to-l from-orange-600 to-orange-500 rounded-2xl p-4 text-white">
        <div className="text-sm font-bold mb-1">💡 תובנה חכמה</div>
        <div className="text-orange-100 text-sm leading-relaxed">
          שישי בערב הוא הזמן הכי עמוס שלך. מומלץ לפרסם משמרות שישי יום מראש לחסוך בעלויות.
        </div>
      </div>
    </div>
  );
};
