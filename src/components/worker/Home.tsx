import React, { useState, useEffect } from 'react';
import { Zap, MapPin, Clock, ChevronLeft, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS, LEVEL_LABELS, LEVEL_COLORS } from '../../data/mockData';
import { api } from '../../api';

export const WorkerHome: React.FC = () => {
  const { navToWorker, selectWorkerJob, userProfile } = useApp();
  const name = userProfile?.Name || '׳¢׳•׳‘׳“';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const level = userProfile?.Level || 'bronze';
  const rating = userProfile?.Rating || 0;
  const completedShifts = userProfile?.CompletedShifts || 0;
  const reliabilityScore = userProfile?.ReliabilityScore || 100;
  const city = userProfile?.City || '';
  const totalEarnings = userProfile?.TotalEarnings || 0;
  const [filterRole, setFilterRole] = useState<string>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);

  // ׳¨׳¢׳ ׳•׳ ׳׳•׳˜׳•׳׳˜׳™ ׳›׳ 6 ׳©׳ ׳™׳•׳×
  useEffect(() => {
    const load = () => {
      api.getJobs()
        .then(data => setJobs(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    load();
    const iv = setInterval(load, 6000);
    return () => clearInterval(iv);
  }, []);

  // ׳‘׳“׳•׳§ ׳›׳ 5 ׳©׳ ׳™׳•׳× ׳׳ ׳™׳© ׳׳©׳׳¨׳× ׳₪׳¢׳™׳׳”/׳׳׳•׳©׳¨׳× ׳׳¢׳•׳‘׳“
  useEffect(() => {
    if (!userProfile?.Id) return;
    const checkActive = () => {
      fetch(`http://localhost:3001/jobs/worker/${userProfile.Id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('km_token') || ''}` }
      })
        .then(r => r.json())
        .then(data => {
          const active = Array.isArray(data)
            ? data.filter((j: any) => ['confirmed','active'].includes(j.Status))
            : [];
          setActiveShifts(active);
        })
        .catch(() => {});
    };
    checkActive();
    const iv = setInterval(checkActive, 5000);
    return () => clearInterval(iv);
  }, [userProfile?.Id]);

  const filtered = jobs.filter(j => filterRole === 'all' || j.Role === filterRole);

  const handleJobPress = (jobId: string, jobData: any) => {
    selectWorkerJob(jobId, jobData);
    navToWorker('job_details');
  };

  return (
    <div className="screen-enter space-y-4 pb-2">
      {/* Worker header */}
      <div className="bg-gradient-to-l from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center font-black text-xl">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">{name}</div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[level] || 'text-gray-500 bg-gray-100'}`}>
                {LEVEL_LABELS[level] || level}
              </span>
              {rating > 0 && <span className="text-yellow-400 text-sm font-bold">ג˜…{rating.toFixed(1)}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold text-sm flex items-center gap-1 justify-end">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              ׳–׳׳™׳
            </div>
            <div className="text-gray-400 text-xs">{city}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '׳¡׳”׳´׳› ׳”׳›׳ ׳¡׳•׳×', value: `ג‚×${totalEarnings.toLocaleString()}`, color: 'text-green-400' },
            { label: '׳׳©׳׳¨׳•׳×', value: completedShifts, color: 'text-white' },
            { label: '׳׳׳™׳ ׳•׳×', value: `${reliabilityScore}%`, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className={`font-black text-lg ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ׳׳©׳׳¨׳× ׳₪׳¢׳™׳׳” ג€” ׳¨׳§ ׳”׳›׳™ ׳׳—׳¨׳•׳ ׳” */}
      {activeShifts.slice(0, 1).map((shift: any) => {
        const statusLabel = shift.Status === 'confirmed' ? 'ג… ׳׳•׳©׳¨׳×! ׳‘׳•׳ ׳׳׳¡׳¢׳“׳”' :
                            shift.Status === 'active' ? 'נ¢ ׳׳©׳׳¨׳× ׳₪׳¢׳™׳׳”' : 'ג³ ׳׳׳×׳™׳ ׳׳׳™׳©׳•׳¨ ׳¡׳™׳•׳';
        const btnLabel = shift.Status === 'confirmed' ? '׳ ׳¡׳¢ ׳¢׳›׳©׳™׳•' :
                         shift.Status === 'active' ? '׳›׳ ׳¡ ׳׳׳©׳׳¨׳×' : '׳¨׳׳” ׳¡׳˜׳˜׳•׳¡';
        const btnScreen = shift.Status === 'confirmed' ? 'navigation' : 'active_shift';
        return (
          <div key={shift.Id} className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
            <div className="font-bold text-sm mb-1">{statusLabel}</div>
            <div className="font-black text-lg">{shift.RestaurantName}</div>
            <div className="text-green-100 text-sm">{shift.RestaurantCity} ֲ· ג‚×{shift.HourlyRate}/׳©׳³</div>
            {shift.RestaurantAddress && (
              <div className="text-green-200 text-xs mb-1">נ“ {shift.RestaurantAddress}, {shift.RestaurantCity}</div>
            )}
            <div className="mb-3" />
            <button
              onClick={() => {
                selectWorkerJob(String(shift.Id), shift);
                // ׳׳ ׳×׳×׳—׳™׳ ׳׳©׳׳¨׳× ג€” ׳¨׳§ ׳ ׳•׳•׳˜ ׳׳¦'׳§-׳׳™׳
                navToWorker(btnScreen as any);
              }}
              className="w-full bg-white text-green-700 rounded-xl py-2.5 font-black text-sm"
            >
              {btnLabel} ג€÷
            </button>
          </div>
        );
      })}

      {/* Emergency alert ג€” only if there's a real emergency job */}
      {jobs.filter(j => j.IsEmergency).slice(0, 1).map(emergencyJob => (
        <div key={emergencyJob.Id} className="bg-red-500 rounded-2xl p-4 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={22} className="fill-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">נ¨ {emergencyJob.RestaurantName} ג€“ ׳—׳™׳¨׳•׳!</div>
            <div className="text-red-100 text-xs">{emergencyJob.RestaurantCity} ֲ· ג‚×{emergencyJob.HourlyRate}/׳©׳³</div>
          </div>
          <button
            onClick={() => handleJobPress(String(emergencyJob.Id), emergencyJob)}
            className="bg-white text-red-500 rounded-xl px-3 py-2 font-bold text-sm flex-shrink-0"
          >
            ׳¦׳₪׳”
          </button>
        </div>
      ))}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400 flex-shrink-0" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: '׳”׳›׳' },
            { id: 'chef', label: '׳©׳£' },
            { id: 'line_cook', label: '׳˜׳‘׳—' },
            { id: 'dishwasher', label: '׳׳“׳™׳—' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterRole(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filterRole === f.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Job list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 text-base">׳׳©׳׳¨׳•׳× ׳§׳¨׳•׳‘׳•׳×</h2>
          <span className="text-xs text-gray-400">{filtered.length} ׳–׳׳™׳ ׳•׳×</span>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">׳˜׳•׳¢׳ ׳׳©׳׳¨׳•׳×...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl card-shadow">
            <div className="text-4xl mb-3">נ³</div>
            <p className="text-gray-500 font-medium">׳׳™׳ ׳׳©׳׳¨׳•׳× ׳–׳׳™׳ ׳•׳× ׳›׳¨׳’׳¢</p>
            <p className="text-gray-400 text-sm mt-1">׳‘׳“׳•׳§ ׳©׳•׳‘ ׳׳׳•׳—׳¨ ׳™׳•׳×׳¨</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(job => {
            const start = new Date(job.StartTime);
            const end = new Date(job.EndTime);
            const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
            const totalPay = parseFloat(hours) * job.HourlyRate;
            const startStr = start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            const endStr = end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={job.Id}
                className={`bg-white rounded-2xl p-4 card-shadow border-2 ${
                  job.IsEmergency ? 'border-red-200' : 'border-transparent'
                }`}
              >
                {job.IsEmergency === true && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={12} className="text-red-500 fill-red-500" />
                    <span className="text-red-500 text-xs font-bold">׳—׳™׳¨׳•׳ ג€“ ׳“׳¨׳•׳© ׳׳™׳™׳“׳™</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{job.RestaurantName}</div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                      <MapPin size={12} />
                      {job.RestaurantCity}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-amber-500 font-black text-lg">ג‚×{job.HourlyRate}/׳©׳³</div>
                    <div className="text-green-600 text-xs font-semibold">ג‚×{totalPay.toFixed(0)} ׳¡׳”׳´׳›</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <span className="bg-blue-50 text-blue-600 text-xs font-semibold rounded-full px-2.5 py-1">
                    {ROLE_LABELS[job.Role] || job.Role}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock size={12} />
                    {startStr}ג€“{endStr} ({hours} ׳©׳³)
                  </div>
                </div>

                <button
                  onClick={() => handleJobPress(String(job.Id), job)}
                  className={`w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-1 transition-all active:scale-98 ${
                    job.IsEmergency ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  ׳¦׳₪׳” ׳‘׳₪׳¨׳˜׳™׳
                  <ChevronLeft size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

