import React, { useState, useEffect } from 'react';
import { Zap, MapPin, Clock, ChevronLeft, Filter, ChefHat, WifiOff, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS, LEVEL_LABELS, LEVEL_COLORS } from '../../data/mockData';
import { api } from '../../api';
import { visibleShiftRoles, isCookRole } from '../../utils/roles';
import { isNewWorker, shiftsUntilEstablished, meetsShiftRequirements } from '../../utils/levels';
import { NewWorkerBadge } from '../common/NewWorkerBadge';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UnreadChatBanner } from '../common/ChatsScreen';
import { SkeletonList } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { haptic } from '../../utils/haptics';
import { avatarTone, roleDot } from '../../utils/colors';

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
  const [loadError, setLoadError] = useState(false);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);

  const loadJobs = () => {
    api.getJobs()
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoadError(false); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  // רענון אוטומטי כל 6 שניות
  useEffect(() => {
    loadJobs();
    const iv = setInterval(loadJobs, 6000);
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
            ? data.filter((j: any) => ['confirmed','active'].includes(j.Status) && !['stage', 'stage_shift'].includes(j.JobType))
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
  const relevant = jobs.filter(j =>
    allowedRoles.includes(j.Role) &&
    meetsShiftRequirements(rating, completedShifts, j.MinRating, j.AllowNewWorkers)
  );
  const cook = isCookRole(workerRole);
  const filtered = filterRole === 'all' ? relevant : relevant.filter(j => j.Role === filterRole);

  // צ'יפים לסינון — רק לטבח (רגיל / הכנות)
  const roleChips = cook
    ? [{ id: 'all', label: 'הכל' }, { id: 'line_cook', label: 'טבח' }, { id: 'prep_cook', label: 'טבח הכנות' }]
    : [];

  const handleJobPress = (jobId: string, jobData: any) => {
    haptic('light');
    selectWorkerJob(jobId, jobData);
    navToWorker('job_details');
  };

  return (
    <div className="screen-enter space-y-4 pb-2">
      {/* Worker header */}
      <div className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{ background: '#1b1e38',
                 border: '1px solid rgba(255,255,255,0.06)',
                 boxShadow: '0 4px 16px rgba(20,28,44,0.16)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl"
            style={{ background:'#5354d3', color:'#ffffff' }}>
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">{name}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[level] || 'text-gray-500 bg-gray-100'}`}>
                {LEVEL_LABELS[level] || level}
              </span>
              <NewWorkerBadge completedShifts={completedShifts} size="sm" />
              <VerifiedBadge isVerified={userProfile?.IsVerified} size="sm" />
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
              <div className={`font-bold text-lg ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* הודעה חדשה בצ'אט */}
      <UnreadChatBanner role="worker"
        onOpen={(jobId) => { try { localStorage.setItem('km_open_chat', String(jobId)); } catch {} navToWorker('chats'); }} />

      {/* באנר עובד חדש — עד 3 משמרות */}
      {isNewWorker(completedShifts) && (
        <div className="rounded-2xl p-3 flex items-center gap-2.5"
          style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)' }}>
          <Sparkles size={18} className="text-blue-500 flex-shrink-0" />
          <span className="text-blue-700 font-semibold text-sm">
            עוד {shiftsUntilEstablished(completedShifts)} משמרות והפרופיל שלך מבוסס. עד אז יופיע לידך תג של עובד חדש.
          </span>
        </div>
      )}

      {/* משמרת פעילה — רק הכי אחרונה */}
      {activeShifts.slice(0, 1).map((shift: any) => {
        const statusLabel = shift.Status === 'confirmed' ? 'המשמרת אושרה — אפשר לצאת למסעדה' :
                            shift.Status === 'active' ? 'משמרת פעילה' : 'ממתין לאישור סיום';
        const btnLabel = shift.Status === 'confirmed' ? 'נסע עכשיו' :
                         shift.Status === 'active' ? 'כנס למשמרת' : 'ראה סטטוס';
        const btnScreen = shift.Status === 'confirmed' ? 'navigation' : 'active_shift';
        return (
          <div key={shift.Id} className="rounded-2xl p-4 text-white" style={{ background:'#1f9d6b' }}>
            <div className="font-bold text-sm mb-1">{statusLabel}</div>
            <div className="font-bold text-lg">{shift.RestaurantName}</div>
            <div className="text-green-100 text-sm">{shift.RestaurantCity} · ₪{shift.HourlyRate}/ש׳</div>
            {shift.RestaurantAddress && (
              <div className="text-green-200 text-xs mb-1 flex items-center gap-1">
                <MapPin size={11} />{shift.RestaurantAddress}, {shift.RestaurantCity}
              </div>
            )}
            <div className="mb-3" />
            <button
              onClick={() => {
                selectWorkerJob(String(shift.Id), shift);
                // אל תתחיל משמרת — רק נווט לצ'ק-אין
                navToWorker(btnScreen as any);
              }}
              className="w-full bg-white text-green-700 rounded-xl py-2.5 font-bold text-sm"
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
            <div className="font-bold text-sm">{emergencyJob.RestaurantName} — משמרת חירום</div>
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
                  filterRole === f.id ? 'bg-[#5354d3] text-white' : 'bg-gray-100 text-gray-600'
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

        {loading && <SkeletonList count={3} />}

        {!loading && loadError && (
          <div className="text-center py-10 bg-white rounded-2xl card-shadow">
            <WifiOff size={30} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">לא הצלחנו לטעון משמרות</p>
            <p className="text-gray-400 text-sm mt-1 mb-3">כדאי לבדוק את החיבור לאינטרנט</p>
            <button onClick={() => { setLoading(true); loadJobs(); }}
              className="bg-[#5354d3] text-white rounded-xl px-5 py-2 font-bold text-sm active:scale-95 transition-transform">
              נסה שוב
            </button>
          </div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="bg-white rounded-2xl card-shadow">
            <EmptyState icon={<ChefHat size={26} />} title="אין משמרות זמינות כרגע"
              subtitle="משמרות חדשות נוספות לאורך היום. כדאי לבדוק שוב מאוחר יותר." />
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((job, idx) => {
            const start = new Date(job.StartTime);
            const end = new Date(job.EndTime);
            const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
            const totalPay = parseFloat(hours) * Number(job.HourlyRate || 0);
            const startStr = start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            const endStr = end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            const dateStr = start.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });

            return (
              <div key={job.Id} className="overflow-hidden stagger-item"
                style={{
                  borderRadius: 16,
                  background: '#ffffff',
                  border: job.IsEmergency ? '1px solid rgba(229,72,77,0.35)' : '1px solid #e7e9ef',
                  boxShadow: '0 1px 2px rgba(20,28,44,0.05), 0 4px 12px rgba(20,28,44,0.06)',
                  transition: 'transform 0.1s ease',
                  animationDelay: `${Math.min(idx, 8) * 45}ms`,
                }}>
                <div className="p-4">
                  {job.IsEmergency && (
                    <div className="inline-flex items-center gap-1.5 mb-2.5 px-2.5 py-1 rounded-full text-white text-xs font-bold badge-emergency">
                      <Zap size={11} className="fill-white" /> חירום — דרוש מיידית
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* אייקון מסעדה — צבע לפי שם */}
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={job.IsEmergency
                          ? { background: '#e5484d', color: '#fff' }
                          : { background: avatarTone(job.RestaurantName).bg, color: avatarTone(job.RestaurantName).fg }}>
                        {(job.RestaurantName || 'R').slice(0,2)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">{job.RestaurantName}</div>
                        <div className="flex items-center gap-1 text-xs mt-0.5 text-gray-400">
                          <MapPin size={10} />{job.RestaurantCity}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-xl" style={{ color: '#4a4bc4' }}>₪{job.HourlyRate}</div>
                      <div className="text-xs text-gray-400">/שעה</div>
                    </div>
                  </div>

                  {/* פרטים — שורה אחת נקייה עם נקודת-צבע לתפקיד */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: roleDot(job.Role) }} />
                    {ROLE_LABELS[job.Role] || job.Role} · {dateStr} · {startStr}–{endStr}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #f0f1f4' }}>
                    <div className="text-sm text-gray-500">
                      סה״כ <span className="font-bold text-gray-800">₪{totalPay.toFixed(0)}</span> · {hours} שעות
                    </div>
                    <button onClick={() => handleJobPress(String(job.Id), job)}
                      className="rounded-lg px-4 py-2 font-bold text-sm flex items-center gap-1"
                      style={{ background: job.IsEmergency ? '#e5484d' : '#5354d3', color: job.IsEmergency ? '#fff' : '#ffffff' }}>
                      צפה בפרטים <ChevronLeft size={14} />
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
