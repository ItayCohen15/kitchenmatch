import React, { useState, useEffect } from 'react';
import { setVisibleInterval } from '../../utils/visibleInterval';
import { Zap, ChefHat, CheckCircle, Star, X, GraduationCap, CreditCard, ClipboardList, Users, ChevronLeft, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { roleLabels } from '../../utils/roles';
import { CancelShiftModal } from '../common/CancelShiftModal';
import { NewWorkerBadge } from '../common/NewWorkerBadge';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { UnreadChatBanner } from '../common/ChatsScreen';
import { isWithinKm } from '../../utils/cities';
import { SkeletonList } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { toast } from '../common/Toast';
import { haptic } from '../../utils/haptics';
import { avatarTone } from '../../utils/colors';

export const RestaurantHome: React.FC = () => {
  const { navToRestaurant, userProfile, selectWorkerJob, refreshProfile, setEmergencyMode } = useApp();
  const [workers, setWorkers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [cancelJob, setCancelJob] = useState<any>(null);

  const name = userProfile?.Name || 'המסעדה שלי';
  const city = userProfile?.City || '';
  const initials = name.split(' ').slice(0,2).map((n: string) => n[0]).join('');
  const walletBalance = userProfile?.WalletBalance || 0;
  const rating = userProfile?.Rating || 0;

  useEffect(() => {
    // עובדים — רענון חד פעמי (שומרים את כולם, מסננים לפי אזור בהמשך)
    api.getWorkers()
      .then(data => setWorkers(Array.isArray(data) ? data : []))
      .catch(() => { setWorkers([]); toast.error('שגיאה בטעינת עובדים'); })
      .finally(() => setLoadingWorkers(false));
  }, [userProfile]);

  // עובדים זמינים באזור המסעדה (עד 30 ק"מ), ממוינים לפי דירוג — מציגים את 3 הגבוהים
  const RADIUS_KM = 30;
  const areaWorkers = workers
    .filter(w => isWithinKm(city, w.City, RADIUS_KM))
    .sort((a, b) => (b.Rating || 0) - (a.Rating || 0));
  const topWorkers = areaWorkers.slice(0, 3);
  const areaCount = areaWorkers.length;

  // רענן פרופיל מסעדה (ארנק/דירוג) מהשרת בכניסה למסך
  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  // משמרות + משמרת פעילה — רענון כל 5 שניות
  useEffect(() => {
    if (!userProfile?.Id) return;
    const load = () => {
      api.getRestaurantJobs(userProfile.Id)
        .then(data => {
          // התנסויות וסטאז'ים מנוהלים במסך נפרד — לא נספרים כמשמרת פעילה/אחרונה
          const all = (Array.isArray(data) ? data : []).filter((j: any) => !['stage', 'stage_shift', 'trial'].includes(j.JobType));
          const active = all.find((j: any) => ['confirmed','active','pending_completion'].includes(j.Status));
          setActiveShift(active || null);
          setRecentJobs(all.filter((j: any) => !['confirmed','active','pending_completion'].includes(j.Status)).slice(0, 3));
        })
        .catch(() => {});
    };
    load();
    const iv = setVisibleInterval(load, 5000);
    return () => clearInterval(iv);
  }, [userProfile?.Id]);

  const handleEnterActiveShift = () => {
    if (!activeShift) return;
    selectWorkerJob(String(activeShift.Id), {
      ...activeShift,
      RestaurantName: name,
      RestaurantCity: city,
    });
    if (activeShift.Status === 'confirmed') {
      navToRestaurant('live_tracking');
    } else {
      navToRestaurant('active_shift');
    }
  };

  const stats = [
    { icon: <CreditCard size={19} />,   gold: true,  value: `₪${walletBalance.toLocaleString()}`, label: 'ארנק' },
    { icon: <ClipboardList size={19} />, gold: false, value: `${recentJobs.length}`, label: 'משמרות' },
    { icon: <Users size={19} />,        gold: true,  value: `${areaCount}`, label: 'עובדים זמינים' },
  ];

  return (
    <div className="screen-enter space-y-4 pb-2">
      {/* ── כותרת נאבי — סיכום המסעדה ── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: '#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 240, height: 240, borderRadius: '50%', bottom: -130, left: -70, background: 'radial-gradient(circle, rgba(244,182,44,.20), transparent 66%)' }} />
        <div className="absolute pointer-events-none" style={{ width: 170, height: 170, borderRadius: '50%', top: -80, left: 60, background: 'radial-gradient(circle, rgba(83,84,211,.22), transparent 68%)' }} />
        <div className="relative p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-none"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-lg leading-tight truncate">{name}</div>
              <div className="inline-flex items-center gap-1 text-[13px] font-semibold mt-0.5" style={{ color: '#b9c0d8' }}>
                <MapPin size={13} style={{ color: '#f4b62c' }} /> {city || 'הסביבה שלך'}
              </div>
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 flex-none" style={{ background: 'rgba(255,255,255,0.10)' }}>
                <Star size={13} style={{ color: '#f4b62c' }} className="fill-current" />
                <span className="text-sm font-black">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {stats.map(s => (
              <div key={s.label} className="rounded-2xl px-2 py-3 text-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="flex justify-center mb-1" style={{ color: s.gold ? '#f4b62c' : '#8f90f0' }}>{s.icon}</div>
                <div className="font-black text-base">{s.value}</div>
                <div className="text-[11px] font-semibold mt-0.5" style={{ color: '#9aa2be' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* הודעה חדשה בצ'אט */}
      <UnreadChatBanner role="restaurant"
        onOpen={(jobId) => { try { localStorage.setItem('km_open_chat', String(jobId)); } catch {} navToRestaurant('chats'); }} />

      {/* משמרת פעילה */}
      {activeShift && (
        <div className="rounded-2xl p-4 text-white" style={{ background:'#1f9d6b' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-bold text-sm">
              {activeShift.Status === 'active' ? 'משמרת פעילה עכשיו' :
               activeShift.Status === 'confirmed' ? 'העובד אושר — ממתין להגעה' :
               'ממתין לאישור סיום'}
            </span>
          </div>
          <div className="font-bold text-lg">{activeShift.WorkerName || 'עובד'}</div>
          <div className="text-green-100 text-sm mb-3">
            {ROLE_LABELS[activeShift.Role] || activeShift.Role} · ₪{activeShift.HourlyRate}/ש׳
          </div>
          <button onClick={handleEnterActiveShift}
            className="w-full bg-white text-green-700 rounded-xl py-2.5 font-bold text-sm">
            {activeShift.Status === 'confirmed' ? 'מעקב עובד ›' : 'כנס למשמרת ›'}
          </button>
        </div>
      )}

      {/* ── הירו — פרסום משמרת ── */}
      <div className="relative rounded-3xl overflow-hidden" style={{ background: '#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 220, height: 220, borderRadius: '50%', bottom: -120, right: -70, background: 'radial-gradient(circle, rgba(244,182,44,.18), transparent 66%)' }} />
        <div className="relative p-5 text-white">
          <h1 className="font-black leading-tight mb-1.5" style={{ fontSize: 22 }}>צריך עובד עכשיו?</h1>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#b9c0d8', maxWidth: '86%' }}>
            פרסמו משמרת ועובדים מתאימים באזור יקבלו התראה מיידית
          </p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { haptic('light'); setEmergencyMode(false); navToRestaurant('create_job'); }}
              className="inline-flex items-center gap-2 font-extrabold text-[15px] px-5 py-3 rounded-2xl active:scale-95 transition-transform"
              style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}
            >
              <ChefHat size={17} /> פרסם משמרת
            </button>
            <button
              onClick={() => { haptic('medium'); setEmergencyMode(true); navToRestaurant('create_job'); }}
              className="inline-flex items-center gap-1.5 font-bold text-[13px] px-3.5 py-3 rounded-2xl active:scale-95 transition-transform"
              style={{ background: 'rgba(229,72,77,0.16)', color: '#ff9ea1', border: '1px solid rgba(229,72,77,0.35)' }}
            >
              <Zap size={15} className="fill-current" /> חירום
            </button>
          </div>
        </div>
      </div>

      {/* Talent program entry */}
      <button onClick={() => navToRestaurant('talent')}
        className="w-full rounded-2xl p-4 text-right active:scale-[0.99] transition-transform flex items-center gap-3"
        style={{ background: '#eceefb', border: '1px solid #dcdefb' }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-none" style={{ background: '#fff', color: '#5354d3' }}>
          <GraduationCap size={22} />
        </div>
        <div className="flex-1">
          <div className="font-black" style={{ color: '#2b3350' }}>גלה טאלנט טרי</div>
          <div className="text-xs mt-0.5 font-semibold" style={{ color: '#6b7290' }}>בוגרי בתי ספר לבישול/ברמנות — מוכנים להזדמנות הראשונה</div>
        </div>
        <ChevronLeft size={20} style={{ color: '#aeb4cc' }} className="flex-none" />
      </button>

      {/* Available workers nearby */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black" style={{ fontSize: 17, color: '#141a2e' }}>עובדים זמינים באזורך</h2>
          <span className="text-[11px] font-extrabold" style={{ padding: '3px 9px', borderRadius: 6, background: '#e4f7ee', color: '#1f8f5f' }}>
            עד 30 ק״מ
          </span>
        </div>
        {loadingWorkers && <SkeletonList count={3} />}
        {!loadingWorkers && areaWorkers.length === 0 && (
          <div className="bg-white rounded-2xl card-shadow">
            <EmptyState icon={<Users size={26} />} title="אין עובדים זמינים באזורך כרגע"
              subtitle="פרסמו משמרת ועובדים מתאימים יקבלו התראה מיידית" />
          </div>
        )}
        <div className="space-y-2.5">
          {topWorkers.map((w: any) => {
            const wName = w.Name || 'עובד';
            const wInitials = wName.split(' ').map((n: string) => n[0]).join('').slice(0,2);
            return (
              <div key={w.Id} className="rounded-2xl p-3 flex items-center gap-3"
                style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 18px -10px rgba(20,26,46,.10)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: avatarTone(wName).bg, color: avatarTone(wName).fg }}>
                  {wInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm" style={{ color: '#141a2e' }}>{wName}</span>
                    <NewWorkerBadge completedShifts={w.CompletedShifts} size="sm" />
                    <VerifiedBadge isVerified={w.IsVerified} size="sm" />
                    {w.Rating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold" style={{ color: '#8a6300' }}>
                        <Star size={11} className="fill-current" style={{ color: '#f4b62c' }} />{w.Rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5 font-semibold" style={{ color: '#7a8199' }}>{w.City} · {roleLabels(w.Role)}</div>
                </div>
                <span className="text-[11px] font-extrabold flex items-center gap-1 flex-shrink-0" style={{ color: '#1f8f5f' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} /> זמין
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <h2 className="font-black mb-3" style={{ fontSize: 17, color: '#141a2e' }}>משמרות אחרונות</h2>
        {recentJobs.length === 0 ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 18px -10px rgba(20,26,46,.10)' }}>
            <p className="text-sm font-semibold" style={{ color: '#7a8199' }}>טרם פרסמת משמרות</p>
            <button onClick={() => navToRestaurant('create_job')} className="text-sm font-black mt-2" style={{ color: '#5354d3' }}>
              פרסם משמרת ראשונה
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentJobs.map((j: any) => {
              const st = j.Status === 'completed'
                ? { txt: 'הושלם', bg: '#e4f7ee', fg: '#1f8f5f', icon: '#1f9d6b' }
                : j.Status === 'cancelled'
                  ? { txt: 'בוטל', bg: '#fde3e3', fg: '#cf3030', icon: '#e5484d' }
                  : { txt: j.Status === 'searching' ? 'מחפש' : j.Status, bg: '#fdf0cf', fg: '#8a6300', icon: '#f4b62c' };
              return (
                <div key={j.Id} className="rounded-2xl p-3 flex items-center gap-3"
                  style={{ background: '#fff', border: '1px solid #eceef4', boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 18px -10px rgba(20,26,46,.10)' }}>
                  <CheckCircle size={18} className="flex-shrink-0" style={{ color: st.icon }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-sm" style={{ color: '#141a2e' }}>{ROLE_LABELS[j.Role] || j.Role}</span>
                    <span className="inline-block ml-1 align-middle text-[10px] font-extrabold" style={{ padding: '2px 7px', borderRadius: 6, background: st.bg, color: st.fg }}>{st.txt}</span>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <span className="rounded-lg font-extrabold whitespace-nowrap" style={{ fontSize: 12, padding: '4px 9px', background: '#fdf0cf', color: '#8a6300' }}>
                      ₪{j.HourlyRate}/ש׳
                    </span>
                    {j.TotalPay && <div className="text-[11px] font-bold mt-1" style={{ color: '#1f8f5f' }}>₪{j.TotalPay} סה״כ</div>}
                  </div>
                  {j.Status === 'searching' && (
                    <button onClick={() => setCancelJob(j)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                      style={{ background: '#fde3e3', color: '#cf3030' }} title="בטל משמרת">
                      <X size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cancelJob && (
        <CancelShiftModal
          jobId={Number(cancelJob.Id)}
          cancelledBy="restaurant"
          startTime={cancelJob.StartTime}
          isConfirmed={false}
          onClose={() => setCancelJob(null)}
          onCancelled={() => {
            setCancelJob(null);
            setRecentJobs(prev => prev.map(j =>
              j.Id === cancelJob.Id ? { ...j, Status: 'cancelled' } : j));
          }}
        />
      )}
    </div>
  );
};
