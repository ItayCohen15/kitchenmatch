import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, MessageCircle, Pencil, Plus, ChevronRight, Star, Lightbulb, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { STAGE_RESTAURANT_COMMISSION } from '../../utils/levels';
import { avatarTone } from '../../utils/colors';
import { ChatModal } from '../common/ChatModal';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '';
const fmtDayDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '';
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';
const isToday = (d?: string) => d ? new Date(d).toDateString() === new Date().toDateString() : false;
const daysLeft = (end?: string) => end ? Math.ceil((new Date(end).getTime() - Date.now()) / 86400000) : 0;
const stageProgress = (s: any) => {
  const st = new Date(s.StartTime).getTime(), en = new Date(s.EndTime).getTime();
  if (!st || !en || en <= st) return 0;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - st) / (en - st)) * 100)));
};

// דף לוז הסטאז' — משמרות קרובות, משמרות שהיו (כולל הדירוג והמשוב שנכתבו), וכניסה לקביעת משמרת
export const StageSchedule: React.FC = () => {
  const { navToRestaurant, getSelectedJob, selectWorkerJob, userProfile } = useApp();
  const stage = getSelectedJob(); // קונטיינר הסטאז' שנבחר במסך הסטאז'רים
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  const stageId = Number(stage?.Id || 0);
  const workerName = stage?.WorkerName || 'העובד';
  const initials = workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const left = daysLeft(stage?.EndTime);

  // אם אין סטאז' נבחר (למשל אחרי ריענון עם נתון ישן) — חזרה למסך הסטאז'רים
  useEffect(() => {
    if (!stage || stage.JobType !== 'stage') navToRestaurant('stages');
  }, [stageId]);

  const load = () => {
    if (!stageId) return;
    api.getStageShifts(stageId)
      .then((d: any) => setShifts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [stageId]);
  useEffect(() => { if (!stageId) return; const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [stageId]);

  const upcoming = shifts.filter(s => s.Status === 'confirmed')
    .sort((a, b) => new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime());
  const running = shifts.filter(s => ['active', 'pending_completion'].includes(s.Status));
  const past = shifts.filter(s => s.Status === 'completed')
    .sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime());

  const enterShift = (sh: any) => {
    selectWorkerJob(String(sh.Id), { ...sh, WorkerName: workerName, RestaurantName: userProfile?.Name, RestaurantCity: userProfile?.City });
    navToRestaurant(['active', 'pending_completion'].includes(sh.Status) ? 'active_shift' : 'live_tracking');
  };

  const editShift = (sh: any) => {
    try { localStorage.setItem('km_stage_edit_shift', JSON.stringify(sh)); } catch {}
    navToRestaurant('stage_add_shift');
  };

  const addShift = () => {
    try { localStorage.removeItem('km_stage_edit_shift'); } catch {}
    navToRestaurant('stage_add_shift');
  };

  if (!stage) return null;

  return (
    <div className="screen-enter space-y-4">
      {/* חזרה */}
      <button onClick={() => navToRestaurant('stages')} className="flex items-center gap-1 text-gray-400 text-sm font-semibold">
        <ChevronRight size={18} /> חזרה לסטאז'רים
      </button>

      {/* כרטיס הסטאז' */}
      <div className="rounded-3xl p-4 text-white space-y-3" style={{ background: '#1b1e38' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg"
              style={{ background: avatarTone(workerName).bg, color: avatarTone(workerName).fg }}>
              {initials}
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">{workerName}</div>
              <div className="text-xs" style={{ color: '#8899bb' }}>
                {ROLE_LABELS[stage.Role] || stage.Role} · סטאז' עד {fmtDate(stage.EndTime)}
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setShowChat(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(83,84,211,0.18)', border: '1px solid rgba(83,84,211,0.35)' }} title="צ'אט">
              <MessageCircle size={17} className="text-[#5354d3]" />
            </button>
            {stage.WorkerPhone && (
              <a href={`tel:${stage.WorkerPhone}`}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }} title="התקשר">
                <Phone size={17} className="text-green-400" />
              </a>
            )}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1" style={{ color: '#8899bb' }}>
            <span>התקדמות הסטאז'</span>
            <span>{left > 0 ? `עוד ${left} ימים` : 'הסתיימה התקופה'}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full" style={{ width: `${stageProgress(stage)}%`, background: '#5354d3' }} />
          </div>
        </div>
      </div>

      {/* קביעת משמרת חדשה */}
      <button onClick={addShift}
        className="w-full rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
        style={{ background: '#5354d3', color: '#ffffff' }}>
        <Plus size={18} /> קבע משמרת חדשה
      </button>

      {loading && (
        <div className="text-center py-6">
          <div className="w-7 h-7 border-2 border-[#5354d3] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* משמרת רצה עכשיו */}
      {running.map(sh => (
        <div key={sh.Id} className="rounded-2xl p-4 text-white" style={{ background: '#1f9d6b' }}>
          <div className="font-bold text-sm mb-1">משמרת {sh.Status === 'active' ? 'פעילה עכשיו' : 'ממתינה לאישור סיום'}</div>
          <div className="text-green-100 text-sm mb-3">{fmtDayDate(sh.StartTime)} · {fmtTime(sh.StartTime)}–{fmtTime(sh.EndTime)} · ₪{sh.HourlyRate}/ש'</div>
          <button onClick={() => enterShift(sh)} className="w-full bg-white text-green-700 rounded-xl py-2.5 font-bold text-sm">
            כנס למשמרת ›
          </button>
        </div>
      ))}

      {/* המשמרות הבאות */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
          <Calendar size={13} /> המשמרות הבאות ({upcoming.length})
        </div>
        {!loading && upcoming.length === 0 && (
          <div className="text-center py-6 bg-white rounded-2xl card-shadow">
            <Calendar size={26} className="text-gray-300 mx-auto mb-1" />
            <p className="text-gray-500 text-sm font-medium">אין משמרות מתוכננות</p>
            <p className="text-gray-400 text-xs">אפשר לקבוע משמרת חדשה בכפתור שלמעלה</p>
          </div>
        )}
        {upcoming.map(sh => {
          const today = isToday(sh.StartTime);
          return (
            <div key={sh.Id} className={`bg-white rounded-2xl p-4 card-shadow ${today ? 'border-2 border-[#5354d3]' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {today && <span className="text-[10px] font-bold text-[#5354d3] bg-[#ecebfd] rounded-full px-2 py-0.5">היום!</span>}
                  <span className="font-bold text-gray-900 text-sm">{fmtDayDate(sh.StartTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#5354d3] font-bold text-sm">₪{sh.HourlyRate}/ש'</span>
                  <button onClick={() => editShift(sh)} title="ערוך משמרת"
                    className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center">
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              <div className="text-gray-500 text-xs flex items-center gap-1.5 mb-1">
                <Clock size={12} /> {fmtTime(sh.StartTime)}–{fmtTime(sh.EndTime)}
              </div>
              {sh.Instructions && <div className="text-gray-500 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5 mt-1.5">{sh.Instructions}</div>}
              {today && (
                <button onClick={() => enterShift(sh)}
                  className="mt-2.5 w-full rounded-xl py-2.5 text-sm font-bold"
                  style={{ background: '#5354d3', color: '#ffffff' }}>
                  כנס למשמרת היום ›
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* משמרות שהיו — כולל הדירוג והמשוב שנכתבו */}
      <div className="space-y-2 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
          <Check size={13} /> משמרות שהיו ({past.length})
        </div>
        {!loading && past.length === 0 && (
          <p className="text-gray-400 text-xs text-center py-3">עוד לא הושלמו משמרות בסטאז' הזה</p>
        )}
        {past.map(sh => (
          <div key={sh.Id} className="bg-white rounded-2xl p-4 card-shadow space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-sm">{fmtDayDate(sh.StartTime)}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">{fmtTime(sh.StartTime)}–{fmtTime(sh.EndTime)}</span>
                {sh.TotalPay != null && <span className="text-green-600 font-bold text-sm">₪{Number(sh.TotalPay).toFixed(0)}</span>}
              </div>
            </div>

            {/* הדירוג שנתת */}
            {sh.MyScore ? (
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={14} className={i <= Number(sh.MyScore) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                  ))}
                </div>
                {sh.MyComment && <span className="text-gray-500 text-xs">"{sh.MyComment}"</span>}
              </div>
            ) : (
              <div className="text-gray-300 text-xs">לא דורג</div>
            )}

            {/* המשוב שכתבת */}
            {(sh.ImprovementNote || sh.NextShiftNote) && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 space-y-1.5">
                {sh.ImprovementNote && (
                  <div className="flex items-start gap-1.5">
                    <Lightbulb size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-700 text-xs"><b>לשיפור:</b> {sh.ImprovementNote}</span>
                  </div>
                )}
                {sh.NextShiftNote && (
                  <div className="flex items-start gap-1.5">
                    <Calendar size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-700 text-xs"><b>למשמרת הבאה:</b> {sh.NextShiftNote}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <p className="text-amber-700 text-[11px] text-center bg-amber-50 rounded-xl py-2">
          בתקופת הסטאז' העמלה שלך {(STAGE_RESTAURANT_COMMISSION * 100).toFixed(1)}% בלבד
        </p>
      </div>

      {showChat && (
        <ChatModal jobId={stageId} title={workerName} myRole="restaurant" myName={userProfile?.Name || 'המסעדה'}
          onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};
