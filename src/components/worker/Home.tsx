import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, MapPin, Clock, Calendar, Star, Wallet, CalendarCheck, Search,
  ChevronLeft, ChefHat, Wine, Coffee, UtensilsCrossed, PartyPopper,
  WifiOff, Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABELS, BUSINESS_TYPE_LABELS } from '../../data/mockData';
import { api } from '../../api';
import { visibleShiftRoles, isCookRole } from '../../utils/roles';
import { meetsShiftRequirements } from '../../utils/levels';
import { UnreadChatBanner } from '../common/ChatsScreen';
import { SkeletonList } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { haptic } from '../../utils/haptics';

// ── thumbnail לפי סוג עסק (גרדיאנט + אייקון; מוחלף בתמונה אמיתית אם קיים /thumb-<type>.jpg) ──
const THUMB: Record<string, { c1: string; c2: string; Icon: any }> = {
  restaurant: { c1: '#2c3350', c2: '#151b2e', Icon: ChefHat },
  bar:        { c1: '#3a2b50', c2: '#181226', Icon: Wine },
  cafe:       { c1: '#40301f', c2: '#20160f', Icon: Coffee },
  event_hall: { c1: '#2b3a54', c2: '#141d2e', Icon: PartyPopper },
  catering:   { c1: '#264a3f', c2: '#12211c', Icon: UtensilsCrossed },
};
const thumbFor = (bt?: string) => THUMB[bt || 'restaurant'] || THUMB.restaurant;

export const WorkerHome: React.FC = () => {
  const { navToWorker, selectWorkerJob, userProfile, refreshProfile } = useApp();
  const name = userProfile?.Name || 'עובד';
  const firstName = name.split(' ')[0];
  const rating = userProfile?.Rating || 0;
  const completedShifts = userProfile?.CompletedShifts || 0;
  const reliabilityScore = userProfile?.ReliabilityScore ?? 100;
  const city = userProfile?.City || '';
  const totalEarnings = userProfile?.TotalEarnings || 0;
  const [filterRole, setFilterRole] = useState<string>('all');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);
  const jobsRef = useRef<HTMLDivElement>(null);

  const loadJobs = () => {
    api.getJobs()
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoadError(false); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
    const iv = setInterval(loadJobs, 6000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  useEffect(() => {
    if (!userProfile?.Id) return;
    const checkActive = () => {
      api.getWorkerHistory(userProfile.Id)
        .then((data: any[]) => {
          const active = Array.isArray(data)
            ? data.filter((j: any) => ['confirmed', 'active'].includes(j.Status) && !['stage', 'stage_shift'].includes(j.JobType))
            : [];
          setActiveShifts(active);
        })
        .catch(() => {});
    };
    checkActive();
    const iv = setInterval(checkActive, 5000);
    return () => clearInterval(iv);
  }, [userProfile?.Id]);

  const workerRole = userProfile?.Role || 'line_cook';
  const allowedRoles = visibleShiftRoles(workerRole);
  const relevant = jobs.filter(j =>
    allowedRoles.includes(j.Role) &&
    meetsShiftRequirements(rating, completedShifts, j.MinRating, j.AllowNewWorkers)
  );
  const cook = isCookRole(workerRole);
  const filtered = filterRole === 'all' ? relevant : relevant.filter(j => j.Role === filterRole);
  const roleChips = cook
    ? [{ id: 'all', label: 'הכל' }, { id: 'line_cook', label: 'טבח' }, { id: 'prep_cook', label: 'טבח הכנות' }]
    : [];

  const handleJobPress = (jobId: string, jobData: any) => {
    haptic('light');
    selectWorkerJob(jobId, jobData);
    navToWorker('job_details');
  };
  const openBot = () => { try { window.dispatchEvent(new Event('open-staff-bot')); } catch { /* ignore */ } };
  const scrollToJobs = () => jobsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const stats = [
    { icon: <Zap size={21} className="fill-current" />, gold: true,  value: `${reliabilityScore}%`, label: 'אחוזי נוכחות', onClick: () => navToWorker('profile') },
    { icon: <Wallet size={21} />,                       gold: false, value: `₪${totalEarnings.toLocaleString()}`, label: 'סה״כ הכנסות', onClick: () => navToWorker('wallet') },
    { icon: <Star size={21} className="fill-current" />, gold: true,  value: rating ? rating.toFixed(1) : '—', label: 'דירוג', onClick: () => navToWorker('profile') },
    { icon: <CalendarCheck size={21} />,                gold: false, value: activeShifts.length, label: 'משמרות פעילות', onClick: () => navToWorker('history') },
  ];

  return (
    <div className="screen-enter" style={{ paddingBottom: 4 }}>
      {/* ── כרטיס ברכה — סטאף ── */}
      <button onClick={openBot} className="w-full flex items-center gap-3 p-3 rounded-2xl mb-4 text-right active:scale-[0.99] transition-transform"
        style={{ background: '#eceefb' }}>
        <span className="relative flex-none" style={{ width: 54, height: 54 }}>
          <img src="/staff-bot.png" alt="סטאף" className="w-full h-full rounded-full object-cover" />
          <span className="absolute rounded-full" style={{ bottom: 2, right: 2, width: 13, height: 13, background: '#22c55e', border: '2.5px solid #eceefb' }} />
        </span>
        <span className="flex-1 rounded-xl px-3.5 py-2.5 text-sm font-semibold leading-relaxed" style={{ background: '#fff', color: '#2b3350' }}>
          היי {firstName}, במה אוכל לעזור לך היום?
        </span>
        <ChevronLeft size={20} style={{ color: '#aeb4cc' }} className="flex-none" />
      </button>

      {/* ── הירו זהוב — מצא משמרת עכשיו ── */}
      <div className="relative rounded-3xl overflow-hidden mb-4" style={{ background: '#141a2e' }}>
        {/* אקסנט זהב עדין — בלי תמונה */}
        <div className="absolute pointer-events-none" style={{ width: 260, height: 260, borderRadius: '50%', bottom: -120, left: -80, background: 'radial-gradient(circle, rgba(244,182,44,.20), transparent 66%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 180, height: 180, borderRadius: '50%', top: -80, left: 40, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />
        <div className="relative p-5 text-white">
          <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold mb-3" style={{ color: '#cdd3e8' }}>
            <MapPin size={14} style={{ color: '#f4b62c' }} />
            {city || 'הסביבה שלך'}
          </div>
          <h1 className="font-black leading-tight mb-2" style={{ fontSize: 26 }}>מצא משמרת עכשיו</h1>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#b9c0d8', maxWidth: '82%' }}>
            משמרות קרובות אליך, לפי המיקום שלך וההעדפות שלך
          </p>
          <button onClick={scrollToJobs}
            className="inline-flex items-center gap-2 font-extrabold text-[15px] px-5 py-3 rounded-2xl active:scale-95 transition-transform"
            style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}>
            <Search size={17} /> מצא משמרת עכשיו
          </button>
        </div>
      </div>

      {/* ── 4 סטטים ── */}
      <div className="grid grid-cols-4 rounded-3xl mb-5" style={{ background: '#fff', padding: '16px 2px', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
        {stats.map((s, i) => (
          <button key={i} onClick={s.onClick} className="relative text-center active:scale-95 transition-transform">
            {i > 0 && <span className="absolute right-0 top-1/2 -translate-y-1/2" style={{ width: 1, height: 38, background: '#eceef4' }} />}
            <div className="flex justify-center mb-1" style={{ color: s.gold ? '#f4b62c' : '#5354d3' }}>{s.icon}</div>
            <div className="font-black" style={{ fontSize: 18, color: '#141a2e' }}>{s.value}</div>
            <div className="flex items-center justify-center gap-0.5 font-semibold mt-0.5" style={{ fontSize: 10.5, color: '#7a8199' }}>
              {s.label} <ChevronLeft size={11} />
            </div>
          </button>
        ))}
      </div>

      {/* התראת צ'אט חדשה */}
      <UnreadChatBanner role="worker"
        onOpen={(jobId) => { try { localStorage.setItem('km_open_chat', String(jobId)); } catch {} navToWorker('chats'); }} />

      {/* ── משמרת פעילה ── */}
      {activeShifts.slice(0, 1).map((shift: any) => {
        const statusLabel = shift.Status === 'confirmed' ? 'המשמרת אושרה — אפשר לצאת' : 'משמרת פעילה';
        const btnLabel = shift.Status === 'confirmed' ? 'נסע עכשיו' : 'כנס למשמרת';
        const btnScreen = shift.Status === 'confirmed' ? 'navigation' : 'active_shift';
        return (
          <div key={shift.Id} className="rounded-2xl p-4 text-white mb-4" style={{ background: '#1f9d6b' }}>
            <div className="font-bold text-sm mb-1">{statusLabel}</div>
            <div className="font-bold text-lg">{shift.RestaurantName}</div>
            <div className="text-green-100 text-sm mb-3">{shift.RestaurantCity} · ₪{shift.HourlyRate}/ש׳</div>
            <button onClick={() => { selectWorkerJob(String(shift.Id), shift); navToWorker(btnScreen as any); }}
              className="w-full bg-white text-green-700 rounded-xl py-2.5 font-bold text-sm">{btnLabel} ›</button>
          </div>
        );
      })}

      {/* ── כותרת + סינון ── */}
      <div ref={jobsRef} className="flex items-center justify-between mb-3" style={{ scrollMarginTop: 12 }}>
        <h2 className="font-black" style={{ fontSize: 17, color: '#141a2e' }}>משמרות פופולריות בקרבתך</h2>
        <span className="text-xs font-bold" style={{ color: '#7a8199' }}>{filtered.length} זמינות</span>
      </div>

      {roleChips.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {roleChips.map(f => (
              <button key={f.id} onClick={() => setFilterRole(f.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold ${filterRole === f.id ? 'bg-[#5354d3] text-white' : 'bg-gray-100 text-gray-600'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <SkeletonList count={3} />}

      {!loading && loadError && (
        <div className="text-center py-10 bg-white rounded-2xl card-shadow">
          <WifiOff size={30} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">לא הצלחנו לטעון משמרות</p>
          <button onClick={() => { setLoading(true); loadJobs(); }} className="mt-3 bg-[#5354d3] text-white rounded-xl px-5 py-2 font-bold text-sm">נסה שוב</button>
        </div>
      )}

      {!loading && !loadError && filtered.length === 0 && (
        <div className="bg-white rounded-2xl card-shadow">
          <EmptyState icon={<ChefHat size={26} />} title="אין משמרות זמינות כרגע"
            subtitle="משמרות חדשות נוספות לאורך היום. כדאי לבדוק שוב מאוחר יותר." />
        </div>
      )}

      {/* ── כרטיסי משמרות ── */}
      <div className="space-y-3">
        {filtered.map((job, idx) => {
          const start = new Date(job.StartTime);
          const end = new Date(job.EndTime);
          const startStr = start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
          const endStr = end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
          const dateStr = start.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });
          const th = thumbFor(job.RestaurantBusinessType);
          const isNew = (Date.now() - new Date(job.CreatedAt || job.StartTime).getTime()) < 36 * 3600 * 1000;
          const badge = job.IsEmergency
            ? { bg: '#fde3e3', fg: '#cf3030', txt: 'דחוף' }
            : isNew
              ? { bg: '#ece9fe', fg: '#5b4bd0', txt: 'משמרת חדשה' }
              : { bg: '#fdf0cf', fg: '#8a6300', txt: 'פופולרי' };

          return (
            <button key={job.Id} onClick={() => handleJobPress(String(job.Id), job)}
              className="w-full text-right flex gap-3 p-3 rounded-2xl stagger-item active:scale-[0.99] transition-transform"
              style={{
                background: '#fff',
                border: job.IsEmergency ? '1px solid rgba(229,72,77,.3)' : '1px solid #eceef4',
                boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 18px -10px rgba(20,26,46,.10)',
                animationDelay: `${Math.min(idx, 8) * 45}ms`,
              }}>
              {/* thumbnail */}
              <div className="relative flex-none rounded-xl overflow-hidden" style={{ width: 78, background: `linear-gradient(150deg, ${th.c1}, ${th.c2})` }}>
                <img src={`/thumb-${job.RestaurantBusinessType || 'restaurant'}.jpg`} alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                <div className="absolute inset-0 grid place-items-center" style={{ color: 'rgba(255,255,255,.22)' }}>
                  <th.Icon size={30} />
                </div>
              </div>

              {/* mid */}
              <div className="flex-1 min-w-0">
                <span className="inline-block font-extrabold mb-1.5" style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 6, background: badge.bg, color: badge.fg }}>
                  {badge.txt}
                </span>
                <div className="font-black truncate" style={{ fontSize: 16, color: '#141a2e' }}>{ROLE_LABELS[job.Role] || job.Role}</div>
                <div className="font-semibold truncate mt-0.5 mb-2" style={{ fontSize: 12.5, color: '#7a8199' }}>
                  {job.RestaurantName}{job.RestaurantBusinessType && job.RestaurantBusinessType !== 'restaurant' ? ` · ${BUSINESS_TYPE_LABELS[job.RestaurantBusinessType] || ''}` : ''} · {job.RestaurantCity}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold" style={{ fontSize: 11.5, color: '#6b7290' }}>
                  <span className="inline-flex items-center gap-1"><Clock size={12} style={{ color: '#a7adc4' }} />{startStr}–{endStr}</span>
                  <span className="inline-flex items-center gap-1"><Calendar size={12} style={{ color: '#a7adc4' }} />{dateStr}</span>
                </div>
              </div>

              {/* right */}
              <div className="flex-none flex flex-col items-start justify-between">
                <span className="rounded-lg font-extrabold whitespace-nowrap" style={{ fontSize: 12, padding: '5px 10px', background: '#fdf0cf', color: '#8a6300' }}>
                  {job.HourlyRate} ₪ לשעה
                </span>
                <ChevronLeft size={20} style={{ color: '#c2c7da' }} className="self-center" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
