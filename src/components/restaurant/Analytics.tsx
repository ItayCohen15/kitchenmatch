import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-3 text-right border border-gray-100">
        <p className="font-bold text-gray-800 text-sm">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            {p.name === 'spend' ? `ג‚×${p.value.toLocaleString()}` : `${p.value} ׳׳©׳׳¨׳•׳×`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const MONTH_NAMES = ['׳™׳ ׳•׳³','׳₪׳‘׳¨׳³','׳׳¨׳¥','׳׳₪׳¨׳³','׳׳׳™','׳™׳•׳ ׳™','׳™׳•׳׳™','׳׳•׳’׳³','׳¡׳₪׳˜׳³','׳׳•׳§׳³','׳ ׳•׳‘׳³','׳“׳¦׳׳³'];

export const RestaurantAnalytics: React.FC = () => {
  const { userProfile } = useApp();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.Id) {
      api.getRestaurantJobs(userProfile.Id)
        .then(data => setJobs(Array.isArray(data) ? data : []))
        .catch(() => setJobs([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  // ׳‘׳ ׳” ׳“׳׳˜׳ ׳׳’׳¨׳₪׳™׳ ׳׳”׳׳©׳׳¨׳•׳× ׳”׳׳׳™׳×׳™׳•׳×
  const monthlyMap: Record<string, { spend: number; shifts: number }> = {};
  jobs.forEach(j => {
    const d = new Date(j.StartTime);
    const key = MONTH_NAMES[d.getMonth()];
    if (!monthlyMap[key]) monthlyMap[key] = { spend: 0, shifts: 0 };
    const hours = j.StartTime && j.EndTime
      ? (new Date(j.EndTime).getTime() - new Date(j.StartTime).getTime()) / (1000 * 60 * 60)
      : 5;
    monthlyMap[key].shifts += 1;
    monthlyMap[key].spend += (j.TotalPay || (j.HourlyRate * hours)) * 1.065;
  });

  const chartData = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }));
  if (chartData.length === 0) {
    const now = new Date();
    chartData.push({ month: MONTH_NAMES[now.getMonth()], spend: 0, shifts: 0 });
  }

  const totalShifts = jobs.length;
  // ׳”׳•׳¦׳׳•׳× ׳׳׳™׳×׳™׳•׳× = ׳¡׳›׳•׳ ׳‘׳¡׳™׳¡ ֳ— 1.065 (׳›׳•׳׳ ׳¢׳׳׳× 6.5% ׳׳”׳׳¡׳¢׳“׳”)
  const totalSpend = jobs.reduce((s, j) => {
    const hours = j.StartTime && j.EndTime
      ? (new Date(j.EndTime).getTime() - new Date(j.StartTime).getTime()) / (1000 * 60 * 60)
      : 5;
    const base = j.TotalPay || (j.HourlyRate * hours);
    return s + base * 1.065;
  }, 0);
  const avgPerShift = totalShifts > 0 ? (totalSpend / totalShifts).toFixed(0) : 0;

  // ׳”׳×׳₪׳׳’׳•׳× ׳×׳₪׳§׳™׳“׳™׳
  const roleCounts: Record<string, number> = {};
  jobs.forEach(j => { roleCounts[j.Role] = (roleCounts[j.Role] || 0) + 1; });
  const roleColors: Record<string, string> = { chef: '#f97316', line_cook: '#3b82f6', dishwasher: '#10b981' };
  const roleLabels: Record<string, string> = { chef: '׳©׳₪׳™׳', line_cook: '׳˜׳‘׳—׳™׳', dishwasher: '׳׳“׳™׳—׳™׳' };
  const roleDist = Object.entries(roleCounts).map(([role, count]) => ({
    name: roleLabels[role] || role,
    value: Math.round((count / totalShifts) * 100),
    color: roleColors[role] || '#9ca3af',
  }));
  if (roleDist.length === 0) {
    roleDist.push({ name: '׳׳™׳ ׳¢׳“׳™׳™׳', value: 100, color: '#e5e7eb' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      <h2 className="text-xl font-black text-gray-900">׳ ׳™׳×׳•׳— ׳‘׳™׳¦׳•׳¢׳™׳</h2>

      {totalShifts === 0 && (
        <div className="bg-amber-50 border border-orange-100 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">נ“</div>
          <p className="font-bold text-gray-700">׳׳™׳ ׳¢׳“׳™׳™׳ ׳ ׳×׳•׳ ׳™׳</p>
          <p className="text-gray-400 text-sm mt-1">׳₪׳¨׳¡׳ ׳׳©׳׳¨׳•׳× ׳›׳“׳™ ׳׳¨׳׳•׳× ׳ ׳™׳×׳•׳—</p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            title: '׳¡׳”׳´׳› ׳”׳•׳¦׳׳•׳×',
            value: `ג‚×${totalSpend.toLocaleString()}`,
            icon: <TrendingUp size={18} />,
            color: 'text-amber-500 bg-amber-50',
          },
          {
            title: '׳¡׳”׳´׳› ׳׳©׳׳¨׳•׳×',
            value: `${totalShifts}`,
            icon: <Users size={18} />,
            color: 'text-blue-500 bg-blue-50',
          },
          {
            title: '׳׳׳•׳¦׳¢ ׳׳׳©׳׳¨׳×',
            value: `ג‚×${avgPerShift}`,
            icon: <Clock size={18} />,
            color: 'text-green-500 bg-green-50',
          },
          {
            title: '׳—׳•׳“׳©׳™׳ ׳₪׳¢׳™׳׳™׳',
            value: `${totalShifts > 0 ? chartData.length : 0}`,
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
          </div>
        ))}
      </div>

      {/* Spend chart */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-4">׳”׳•׳¦׳׳•׳× ׳׳׳•׳¨׳ ׳–׳׳</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
        <h3 className="font-bold text-gray-800 mb-4">׳׳¡׳₪׳¨ ׳׳©׳׳¨׳•׳×</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="shifts" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Role distribution */}
      {roleDist[0].name !== '׳׳™׳ ׳¢׳“׳™׳™׳' && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <h3 className="font-bold text-gray-800 mb-4">׳”׳×׳₪׳׳’׳•׳× ׳×׳₪׳§׳™׳“׳™׳</h3>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={roleDist} cx="50%" cy="50%"
                    innerRadius={32} outerRadius={54} paddingAngle={3} dataKey="value">
                    {roleDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {roleDist.map(d => (
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
      )}

      {/* Insight */}
      <div className="bg-gradient-to-l from-km-navy to-km-dark rounded-2xl p-4 text-white">
        <div className="text-sm font-bold mb-1">נ’¡ ׳×׳•׳‘׳ ׳” ׳—׳›׳׳”</div>
        <div className="text-amber-100 text-sm leading-relaxed">
          ׳©׳™׳©׳™ ׳‘׳¢׳¨׳‘ ׳”׳•׳ ׳”׳–׳׳ ׳”׳›׳™ ׳¢׳׳•׳¡ ׳©׳׳. ׳׳•׳׳׳¥ ׳׳₪׳¨׳¡׳ ׳׳©׳׳¨׳•׳× ׳©׳™׳©׳™ ׳™׳•׳ ׳׳¨׳׳© ׳׳—׳¡׳•׳ ׳‘׳¢׳׳•׳™׳•׳×.
        </div>
      </div>
    </div>
  );
};

