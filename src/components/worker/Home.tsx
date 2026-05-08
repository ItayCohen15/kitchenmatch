import React, { useState } from 'react';
import { Zap, MapPin, Clock, ChevronLeft, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NEARBY_JOBS, CURRENT_WORKER, ROLE_LABELS, EXPERIENCE_LABELS, LEVEL_LABELS, LEVEL_COLORS } from '../../data/mockData';

export const WorkerHome: React.FC = () => {
  const { navToWorker, selectWorkerJob } = useApp();
  const w = CURRENT_WORKER;
  const [filterRole, setFilterRole] = useState<string>('all');

  const filtered = NEARBY_JOBS.filter(j => filterRole === 'all' || j.role === filterRole);

  const handleJobPress = (jobId: string) => {
    selectWorkerJob(jobId);
    navToWorker('job_details');
  };

  return (
    <div className="screen-enter space-y-4 pb-2">
      {/* Worker header */}
      <div className="bg-gradient-to-l from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl"
            style={{ backgroundColor: w.avatarColor }}
          >
            {w.initials}
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">{w.name}</div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[w.level]}`}>
                {LEVEL_LABELS[w.level]}
              </span>
              <span className="text-yellow-400 text-sm font-bold">★{w.rating}</span>
              <span className="text-gray-400 text-xs">({w.reviewCount})</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold text-sm flex items-center gap-1 justify-end">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              זמין
            </div>
            <div className="text-gray-400 text-xs">{w.city}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'הרוויח החודש', value: '₪3,200', color: 'text-green-400' },
            { label: 'משמרות', value: w.completedShifts, color: 'text-white' },
            { label: 'אמינות', value: `${w.reliabilityScore}%`, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className={`font-black text-lg ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency alert */}
      <div className="bg-red-500 rounded-2xl p-4 text-white flex items-center gap-3 animate-pulse-slow">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap size={22} className="fill-white" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-sm">🚨 דרוש שף – חירום!</div>
          <div className="text-red-100 text-xs">ביסטרו הצפון · 5 דקות ממך · ₪85/ש׳</div>
        </div>
        <button
          onClick={() => { selectWorkerJob('j1'); navToWorker('job_details'); }}
          className="bg-white text-red-500 rounded-xl px-3 py-2 font-bold text-sm flex-shrink-0"
        >
          צפה
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400 flex-shrink-0" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'הכל' },
            { id: 'chef', label: 'שף' },
            { id: 'line_cook', label: 'טבח' },
            { id: 'dishwasher', label: 'מדיח' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterRole(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filterRole === f.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
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
          <h2 className="font-bold text-gray-800 text-base">משמרות קרובות</h2>
          <span className="text-xs text-gray-400">{filtered.length} זמינות</span>
        </div>
        <div className="space-y-3">
          {filtered.map(job => {
            const hours = (() => {
              const [sh, sm] = job.startTime.split(':').map(Number);
              const [eh, em] = job.endTime.split(':').map(Number);
              let d = (eh * 60 + em) - (sh * 60 + sm);
              if (d < 0) d += 1440;
              return (d / 60).toFixed(1);
            })();
            const totalPay = parseFloat(hours) * job.hourlyRate;

            return (
              <div
                key={job.id}
                className={`bg-white rounded-2xl p-4 card-shadow border-2 ${
                  job.isEmergency ? 'border-red-200' : 'border-transparent'
                }`}
              >
                {job.isEmergency && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={12} className="text-red-500 fill-red-500" />
                    <span className="text-red-500 text-xs font-bold">חירום – דרוש מיידי</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{job.restaurantName}</div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                      <MapPin size={12} />
                      {job.restaurantCity} · {(Math.random() * 3 + 0.5).toFixed(1)} ק״מ
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-orange-500 font-black text-lg">₪{job.hourlyRate}/ש׳</div>
                    <div className="text-green-600 text-xs font-semibold">₪{totalPay.toFixed(0)} סה״כ</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <span className="bg-blue-50 text-blue-600 text-xs font-semibold rounded-full px-2.5 py-1">
                    {ROLE_LABELS[job.role]}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock size={12} />
                    {job.startTime}–{job.endTime} ({hours} ש׳)
                  </div>
                  <span className="text-gray-500 text-xs">{job.date}</span>
                  <span className="text-gray-400 text-xs">{EXPERIENCE_LABELS[job.experienceRequired]}</span>
                </div>

                {job.requiredSkills.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {job.requiredSkills.map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleJobPress(job.id)}
                  className={`w-full rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-1 transition-all active:scale-98 ${
                    job.isEmergency
                      ? 'bg-red-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  צפה בפרטים
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
