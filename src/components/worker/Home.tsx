import React, { useState, useEffect } from 'react';
import { Zap, MapPin, Clock, ChevronLeft, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS, LEVEL_LABELS, LEVEL_COLORS } from '../../data/mockData';
import { api } from '../../api';
import { visibleShiftRoles, isCookRole } from '../../utils/roles';

export const WorkerHome: React.FC = () => {
  const { navToWorker, selectWorkerJob, userProfile, refreshProfile } = useApp();
  const name = userProfile?.Name || 'עובד';
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

  // רענון אוטומטי כל 6 שניות
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

  // רענן פרופיל (משמרות/רמה) מהשרת בכניסה למסך
  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  // בדוק כל 5 שניות אם יש משמרת פעילה/מאושרת לעובד
  useEffect(() => {
    if (!userProfile?.Id) return;
    const checkActive = () => {
      api.getWorkerHistory(userProfile.Id)
        .then((data: any[]) => {
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

  // סינון לפי תפקיד העובד — טבח רואה גם משמרות "טבח הכנות"
  const workerRole = userProfile?.Role || 'line_cook';
  const allowedRoles = visibleShiftRoles(workerRole);
  const relevant = jobs.filter(j => allowedRoles.includes(j.Role));
  const cook = isCookRole(workerRole);
  const filtered = filterRole === 'all' ? relevant : relevant.filter(j => j.Role === filterRole);

  // צ'יפים לסינון — רק לטבח (רגיל / הכנות)
  const roleChips = cook
    ? [{ id: 'all', label: 'הכל' }, { id: 'line_cook', label: 'טבח' }, { id: 'prep_cook', label: 'טבח הכנות' }]
    : [];

  const handleJobPress = (jobId: string, jobData: any) => {
    selectWorkerJob(jobId, jobData);
    navToWorker('job_details');
  };

  return (
    <div className="screen-enter space-y-4 pb-2">
      {/* Worker header */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #060a10 0%, #0d1829 50%, #091020 100%)',
                 border: '1px solid rgba(255,255,255,0.07)',
                 boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
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
              {rating > 0 && <span className="text-yellow-400 text-sm font-bold">★{rating.toFixed(1)}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold text-sm flex items-center gap-1 justify-end">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              זמין
            </div>
            <div className="text-gray-400 text-xs">{city}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'סה״כ הכנסות', value: `₪${totalEarnings.toLocaleString()}`, color: 'text-green-400' },
            { label: 'משמרות', value: completedShifts, color: 'text-white' },
            { label: 'אמינות', value: `${reliabilityScore}%`, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className={`font-black text-lg ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* משמרת פעילה — רק הכי אחרונה */}
      {activeShifts.slice(0, 1).map((shift: any) => {
        const statusLabel = shift.Status === 'confirmed' ? '✅ אושרת! בוא למסעדה' :
                            shift.Status === 'active' ? '🟢 משמרת פעילה' : '⏳ ממתין לאישור סיום';
        const btnLabel = shift.Status === 'confirmed' ? 'נסע עכשיו' :
                         shift.Status === 'active' ? 'כנס למשמרת' : 'ראה סטטוס';
        const btnScreen = shift.Status === 'confirmed' ? 'navigation' : 'active_shift';
        return (
          <div key={shift.Id} className="bg-gradient-to-l from-green-600 to-emerald-500 rounded-2xl p-4 text-white">
            <div className="font-bold text-sm mb-1">{statusLabel}</div>
            <div className="font-black text-lg">{shift.RestaurantName}</div>
            <div className="text-green-100 text-sm">{shift.RestaurantCity} · ₪{shift.HourlyRate}/ש׳</div>
            {shift.RestaurantAddress && (
              <div className="text-green-200 text-xs mb-1">📍 {shift.RestaurantAddress}, {shift.RestaurantCity}</div>
            )}
            <div className="mb-3" />
            <button
              onClick={() => {
                selectWorkerJob(String(shift.Id), shift);
                // אל תתחיל משמרת — רק נווט לצ'ק-אין
                navToWorker(btnScreen as any);
              }}
              className="w-full bg-white text-green-700 rounded-xl py-2.5 font-black text-sm"
            >
              {btnLabel} ›
            </button>
          </div>
        );
      })}

      {/* Emergency alert — only if there's a real emergency job relevant to the worker */}
      {relevant.filter(j => j.IsEmergency).slice(0, 1).map(emergencyJob => (
        <div key={emergencyJob.Id} className="bg-red-500 rounded-2xl p-4 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={22} className="fill-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm">🚨 {emergencyJob.RestaurantName} – חירום!</div>
            <div className="text-red-100 text-xs">{emergencyJob.RestaurantCity} · ₪{emergencyJob.HourlyRate}/ש׳</div>
          </div>
          <button
            onClick={() => handleJobPress(String(emergencyJob.Id), emergencyJob)}
            className="bg-white text-red-500 rounded-xl px-3 py-2 font-bold text-sm flex-shrink-0"
          >
            צפה
          </button>
        </div>
      ))}

      {/* Filters — רק לטבח (רגיל / הכנות) */}
      {roleChips.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {roleChips.map(f => (
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
      )}

      {/* Job list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 text-base">משמרות קרובות</h2>
          <span className="text-xs text-gray-400">{filtered.length} זמינות</span>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">טוען משמרות...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl card-shadow">
            <div className="text-4xl mb-3">🍳</div>
            <p className="text-gray-500 font-medium">אין משמרות זמינות כרגע</p>
            <p className="text-gray-400 text-sm mt-1">בדוק שוב מאוחר יותר</p>
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
            const dateStr = start.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });

            return (
              <div key={job.Id} className="overflow-hidden"
                style={{
                  borderRadius: 20,
                  background: 'linear-gradient(145deg, #0f1829 0%, #0a1020 100%)',
                  border: job.IsEmergency ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(232,160,32,0.15)',
                  boxShadow: job.IsEmergency
                    ? '0 4px 24px rgba(239,68,68,0.15), 0 1px 0 rgba(255,255,255,0.04) inset'
                    : '0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.04) inset',
                  transition: 'transform 0.15s ease',
                }}>
                {/* פס גלו עליון */}
                <div className="h-0.5 w-full" style={{
                  background: job.IsEmergency
                    ? 'linear-gradient(90deg,transparent,#ef4444,transparent)'
                    : 'linear-gradient(90deg,transparent,#e8a020,transparent)'
                }} />

                <div className="p-4">
                  {job.IsEmergency && (
                    <div className="inline-flex items-center gap-1.5 mb-2.5 px-2.5 py-1 rounded-full text-white text-xs font-bold badge-emergency">
                      <Zap size={11} className="fill-white" /> חירום — דרוש מיידי!
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* אייקון מסעדה */}
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                        style={{ background: job.IsEmergency ? 'linear-gradient(135deg,#ef4444,#f97316)' : 'linear-gradient(135deg,#1a2744,#0d1420)' }}>
                        {(job.RestaurantName || 'R').slice(0,2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-white truncate">{job.RestaurantName}</div>
                        <div className="flex items-center gap-1 text-xs mt-0.5" style={{color:'rgba(255,255,255,0.4)'}}>
                          <MapPin size={10} />{job.RestaurantCity}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-black text-xl glow-gold" style={{ color: '#e8a020' }}>₪{job.HourlyRate}</div>
                      <div className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>/שעה</div>
                    </div>
                  </div>

                  {/* פרטים */}
                  <div className="flex items-center gap-2 flex-wrap mb-3.5">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                      {ROLE_LABELS[job.Role] || job.Role}
                    </span>
                    <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2.5 py-1 text-gray-500 text-xs">
                      <Clock size={11} />{startStr}–{endStr}
                    </div>
                    <div className="bg-gray-50 rounded-full px-2.5 py-1 text-gray-500 text-xs">
                      {dateStr}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl px-3 py-2 text-center"
                      style={{background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.15)'}}>
                      <div className="font-black text-base glow-green" style={{color:'#34d399'}}>₪{totalPay.toFixed(0)}</div>
                      <div className="text-[10px]" style={{color:'rgba(52,211,153,0.6)'}}>סה״כ ({hours} ש׳)</div>
                    </div>
                    <button onClick={() => handleJobPress(String(job.Id), job)}
                      className="flex-1 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-1"
                      style={{ background: job.IsEmergency ? 'linear-gradient(135deg,#ef4444,#f97316)' : 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
                      צפה בפרטים <ChevronLeft size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
