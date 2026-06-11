import React, { useState, useEffect } from 'react';
import { GraduationCap, Check, Star, Send, Users, Plus, X, Calendar, Clock, Phone, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { WORKER_ROLES } from '../../utils/roles';
import { ROLE_LABELS } from '../../data/mockData';
import { PARTNERSHIP_COMMISSION, STAGE_RESTAURANT_COMMISSION } from '../../utils/levels';
import { ChatModal } from '../common/ChatModal';

type Tab = 'mine' | 'post' | 'partners';

// סטאז' מיועד רק לטבחים וברמנים
const STAGE_ROLES = WORKER_ROLES.filter(r => r.key === 'line_cook' || r.key === 'bartender');

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '';
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';
const daysLeft = (end?: string) => end ? Math.ceil((new Date(end).getTime() - Date.now()) / 86400000) : 0;
const isToday = (d?: string) => d ? new Date(d).toDateString() === new Date().toDateString() : false;
const stageProgress = (s: any) => {
  const st = new Date(s.StartTime).getTime(), en = new Date(s.EndTime).getTime();
  if (!st || !en || en <= st) return 0;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - st) / (en - st)) * 100)));
};

// שדה קלט אחיד
const inputCls = 'w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-right outline-none focus:border-amber-400 focus:bg-white text-gray-900';

export const RestaurantStages: React.FC = () => {
  const { navToRestaurant, selectWorkerJob, userProfile, refreshProfile } = useApp();
  const rid = userProfile?.Id;
  const [tab, setTab] = useState<Tab>('mine');
  const [stages, setStages] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duties, setDuties] = useState('');
  const [posting, setPosting] = useState(false);

  const [keepJob, setKeepJob] = useState<any | null>(null);
  const [keeping, setKeeping] = useState(false);
  const [directFor, setDirectFor] = useState<any | null>(null);
  const [scheduleStage, setScheduleStage] = useState<any | null>(null);
  const [chatStage, setChatStage] = useState<any | null>(null);

  const load = async () => {
    if (!rid) return;
    const [jobs, prt] = await Promise.all([
      api.getRestaurantJobs(rid).catch(() => []),
      api.getPartners(rid).catch(() => []),
    ]);
    setStages((Array.isArray(jobs) ? jobs : []).filter((j: any) => j.JobType === 'stage'));
    setPartners(Array.isArray(prt) ? prt : []);
  };
  useEffect(() => { load(); }, [rid]);
  useEffect(() => { if (!rid) return; const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [rid]);

  const handlePost = async () => {
    if (!role || !startDate) { setMsg('בחר תפקיד ותאריך התחלה'); return; }
    setPosting(true); setMsg('');
    try {
      await api.createStage({ restaurantId: rid, role, weeks: 3, duties, startTime: new Date(startDate + 'T09:00:00').toISOString() });
      setRole(''); setStartDate(''); setDuties('');
      setTab('mine'); await load();
    } catch (e: any) { setMsg(e.message || 'שגיאה בפרסום'); }
    setPosting(false);
  };

  const approve = async (jobId: number) => { await api.approveWorker(jobId).catch(() => {}); await load(); };

  const doKeep = async () => {
    if (!keepJob) return;
    setKeeping(true);
    try {
      await api.keepWorker(Number(keepJob.Id));
      setKeepJob(null);
      await load(); await refreshProfile();
      setTab('partners');
    } catch (e: any) { setMsg(e.message || 'שגיאה'); setKeepJob(null); }
    setKeeping(false);
  };

  return (
    <div className="screen-enter space-y-4">
      {/* כותרת */}
      <div className="rounded-3xl p-4 text-white flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #0d1420 0%, #1a2744 100%)' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(232,160,32,0.18)', border: '1px solid rgba(232,160,32,0.3)' }}>
          <GraduationCap className="text-amber-400" size={22} />
        </div>
        <div>
          <div className="font-black text-lg leading-tight">סטאז'רים</div>
          <div className="text-xs" style={{ color: '#8899bb' }}>מתלמדים (טבח/ברמן) · 3 שבועות · עמלה מופחתת</div>
        </div>
      </div>

      {/* טאבים */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {([['mine', "הסטאז'ים שלי"], ['post', 'פרסם'], ['partners', 'הקבועים שלי']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === k ? 'bg-white text-gray-900 shadow' : 'text-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {msg && <div className="bg-amber-50 text-amber-700 text-sm rounded-xl px-4 py-2.5 text-center font-semibold">{msg}</div>}

      {/* ── פרסום סטאז' ── */}
      {tab === 'post' && (
        <div className="bg-white rounded-2xl p-4 card-shadow space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-2 block">תפקיד</label>
            <div className="grid grid-cols-2 gap-2">
              {STAGE_ROLES.map(r => (
                <button key={r.key} onClick={() => setRole(r.key)}
                  className={`p-3 rounded-xl border-2 flex items-center gap-2 text-right transition-all ${role === r.key ? 'border-amber-400 bg-amber-50' : 'border-gray-100'}`}>
                  <span className="text-xl">{r.emoji}</span>
                  <span className="font-bold text-gray-800 text-sm">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">תאריך התחלה</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
            <p className="text-gray-400 text-xs mt-1">משך הסטאז': 3 שבועות</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">מה המתלמד יעשה / ילמד?</label>
            <textarea value={duties} onChange={e => setDuties(e.target.value)} rows={3}
              placeholder="לדוגמה: עבודה לצד הטבח הראשי, הכנת מנות פתיחה, היכרות עם המטבח..."
              className={inputCls + ' resize-none text-sm'} />
          </div>
          <button onClick={handlePost} disabled={posting}
            className="w-full text-white rounded-2xl py-4 font-bold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow: '0 4px 16px rgba(232,160,32,0.35)' }}>
            {posting ? 'מפרסם...' : "פרסם מקום סטאז'"}
          </button>
        </div>
      )}

      {/* ── הסטאז'ים שלי ── */}
      {tab === 'mine' && (
        <div className="space-y-3">
          <button onClick={() => setTab('post')}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-amber-300 text-amber-600 rounded-2xl py-3 font-bold bg-amber-50/50">
            <Plus size={18} /> פרסם מקום סטאז'
          </button>

          {stages.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl card-shadow">
              <div className="text-4xl mb-2">🎓</div>
              <p className="text-gray-500 font-medium text-sm">אין עדיין סטאז'ים</p>
              <p className="text-gray-400 text-xs mt-0.5">פרסם מקום סטאז' כדי לקלוט מתלמד</p>
            </div>
          )}

          {stages.map(s => {
            const isOpen = s.Status === 'searching';
            const isApplicant = s.Status === 'pending_approval' || s.Status === 'matched';
            const isActive = s.Status === 'confirmed' || s.Status === 'active';
            const isDone = s.Status === 'completed';
            const left = daysLeft(s.EndTime);
            const initials = (s.WorkerName || 'ע').split(' ').map((n: string) => n[0]).join('').slice(0, 2);
            return (
              <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow space-y-3">
                {/* שורה עליונה */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(isActive || isApplicant) ? (
                      <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">{initials}</div>
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-xl">🎓</div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900">{(isActive || isApplicant) ? (s.WorkerName || 'מועמד') : ROLE_LABELS[s.Role] || s.Role}</div>
                      <div className="text-gray-400 text-xs">{ROLE_LABELS[s.Role] || s.Role} · {fmtDate(s.StartTime)}–{fmtDate(s.EndTime)}</div>
                    </div>
                  </div>
                  {isActive && <span className="text-[11px] font-bold text-green-600 bg-green-50 rounded-full px-2.5 py-1">🎓 פעיל</span>}
                  {isOpen && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 rounded-full px-2.5 py-1">מחפש</span>}
                  {isApplicant && <span className="text-[11px] font-bold text-blue-600 bg-blue-50 rounded-full px-2.5 py-1">ממתין לאישורך</span>}
                  {isDone && <span className="text-[11px] font-bold text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">הסתיים</span>}
                </div>

                {/* מועמד — אישור */}
                {isApplicant && (
                  <button onClick={() => approve(Number(s.Id))}
                    className="w-full bg-blue-500 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2">
                    <Check size={16} /> אשר את המועמד לסטאז'
                  </button>
                )}

                {/* פעיל — התקדמות + פעולות */}
                {isActive && (
                  <>
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                        <span>התקדמות הסטאז'</span>
                        <span>{left > 0 ? `עוד ${left} ימים` : 'הסתיימה התקופה'}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${stageProgress(s)}%`, background: 'linear-gradient(90deg,#e8a020,#f0c050)' }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setScheduleStage(s)}
                        className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-1.5">
                        <Calendar size={15} /> לוז המשמרות
                      </button>
                      <button onClick={() => setChatStage(s)}
                        className="w-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center" title="צ'אט">
                        <MessageCircle size={17} />
                      </button>
                      {s.WorkerPhone && (
                        <a href={`tel:${s.WorkerPhone}`}
                          className="w-11 rounded-xl bg-green-50 border border-green-200 text-green-600 flex items-center justify-center" title="התקשר">
                          <Phone size={17} />
                        </a>
                      )}
                    </div>
                    {left <= 0 && (
                      <button onClick={() => setKeepJob(s)}
                        className="w-full text-white rounded-2xl py-3.5 font-bold"
                        style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow: '0 4px 16px rgba(232,160,32,0.35)' }}>
                        ⭐ שמור כעובד קבוע — ₪300
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── העובדים הקבועים ── */}
      {tab === 'partners' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
            <span className="text-amber-700 text-sm font-semibold">העובדים הקבועים שלך — עמלה {(PARTNERSHIP_COMMISSION * 100).toFixed(1)}% בלבד לכל צד 🎉</span>
          </div>
          {partners.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl card-shadow">
              <Users size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium text-sm">אין עדיין עובדים קבועים</p>
              <p className="text-gray-400 text-xs mt-0.5">שמור מתלמד בתום הסטאז' כדי להתחיל</p>
            </div>
          )}
          {partners.map(p => (
            <div key={p.WorkerId} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">{(p.Name || 'ע').slice(0, 2)}</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{p.Name}</div>
                  <div className="text-gray-400 text-xs flex items-center gap-2">
                    <span>{ROLE_LABELS[p.Role] || p.Role}</span>
                    {p.Rating > 0 && <span className="flex items-center gap-0.5"><Star size={11} className="text-amber-400 fill-amber-400" />{Number(p.Rating).toFixed(1)}</span>}
                    <span className="text-green-600 font-semibold">⭐ קבוע</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDirectFor(p)}
                  className="flex-1 text-white rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
                  <Send size={14} /> שלח משמרת
                </button>
                {p.Phone && (
                  <a href={`tel:${p.Phone}`}
                    className="w-11 rounded-xl bg-green-50 border border-green-200 text-green-600 flex items-center justify-center" title="התקשר">
                    <Phone size={17} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* מודאל שמירת עובד (₪300) */}
      {keepJob && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ background: 'rgba(13,20,32,0.65)', backdropFilter: 'blur(3px)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center space-y-3 shadow-2xl">
            <div className="text-4xl">⭐</div>
            <h3 className="font-black text-gray-900 text-lg">לשמור את {keepJob.WorkerName || 'העובד'} כקבוע?</h3>
            <p className="text-gray-500 text-sm">
              ייגבו <b>₪300</b> (עמלת מקשר חד-פעמית). מעכשיו תוכלו לעבוד יחד דרך האפליקציה בעמלה של <b>{(PARTNERSHIP_COMMISSION * 100).toFixed(1)}%</b> בלבד לכל צד.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setKeepJob(null)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl py-3 font-bold">ביטול</button>
              <button onClick={doKeep} disabled={keeping}
                className="flex-1 text-white rounded-2xl py-3 font-bold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
                {keeping ? '...' : 'כן, שמור (₪300)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {directFor && (
        <DirectShiftModal partner={directFor} restaurantId={rid}
          onClose={() => setDirectFor(null)}
          onSent={() => { setDirectFor(null); setMsg('✅ ההצעה נשלחה לעובד'); }} />
      )}

      {scheduleStage && (
        <StageScheduleModal stage={scheduleStage}
          onClose={() => setScheduleStage(null)}
          onCheckIn={(shift) => { selectWorkerJob(String(shift.Id), { ...shift, WorkerName: scheduleStage.WorkerName, RestaurantName: userProfile?.Name, RestaurantCity: userProfile?.City }); navToRestaurant(shift.Status === 'active' ? 'active_shift' : 'live_tracking'); }} />
      )}

      {chatStage && (
        <ChatModal jobId={Number(chatStage.Id)} title={chatStage.WorkerName || 'העובד'}
          myRole="restaurant" myName={userProfile?.Name || 'המסעדה'}
          onClose={() => setChatStage(null)} />
      )}
    </div>
  );
};

// ── מודאל: לוז משמרות הסטאז' ──
const DEFAULTS_KEY = 'km_stage_shift_defaults';

const StageScheduleModal: React.FC<{ stage: any; onClose: () => void; onCheckIn: (shift: any) => void }> = ({ stage, onClose, onCheckIn }) => {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(DEFAULTS_KEY) || '{}'); } catch { return {}; } })();
  const [shifts, setShifts] = useState<any[]>([]);
  const [date, setDate] = useState('');
  const [start, setStart] = useState(saved.start || '');
  const [end, setEnd] = useState(saved.end || '');
  const [rate, setRate] = useState(saved.rate || '');
  const [instructions, setInstructions] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [err, setErr] = useState('');

  const load = () => api.getStageShifts(Number(stage.Id)).then((d: any) => setShifts(Array.isArray(d) ? d : [])).catch(() => {});
  useEffect(() => { load(); const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [stage.Id]);

  const add = async () => {
    if (!date || !start || !end || !rate) { setErr('מלא תאריך, שעות ושכר'); return; }
    if (Number(rate) < 40) { setErr('שכר המינימום הוא ₪40 לשעה'); return; }
    setAdding(true); setErr('');
    try {
      await api.createStageShift({
        stageId: Number(stage.Id),
        startTime: new Date(`${date}T${start}:00`).toISOString(),
        endTime: new Date(`${date}T${end}:00`).toISOString(),
        hourlyRate: Number(rate),
        instructions,
      });
      // שמור שעות+שכר כברירת מחדל — בפעם הבאה משנים רק תאריך
      try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ start, end, rate })); } catch {}
      setDate(''); setInstructions('');
      setAdded(true); setTimeout(() => setAdded(false), 2500);
      await load();
    } catch (e: any) { setErr(e.message || 'שגיאה'); }
    setAdding(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(13,20,32,0.65)', backdropFilter: 'blur(3px)' }}>
      <div className="bg-white rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-3 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-lg flex items-center gap-2"><Calendar size={18} className="text-amber-500" /> לוז סטאז' — {stage.WorkerName || 'העובד'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><X size={17} /></button>
        </div>

        {/* רשימת משמרות */}
        {shifts.length === 0 && (
          <div className="text-center py-5 bg-gray-50 rounded-2xl">
            <div className="text-3xl mb-1">🗓️</div>
            <div className="text-gray-500 text-sm font-medium">עדיין לא נקבעו משמרות</div>
            <div className="text-gray-400 text-xs">קבע את הראשונה בטופס למטה</div>
          </div>
        )}
        {shifts.map(sh => {
          const today = isToday(sh.StartTime);
          const done = sh.Status === 'completed';
          return (
            <div key={sh.Id} className={`rounded-xl p-3 border ${today && !done ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Clock size={13} className="text-gray-400" />
                  {fmtDate(sh.StartTime)} · {fmtTime(sh.StartTime)}–{fmtTime(sh.EndTime)}
                </div>
                <span className="text-amber-600 font-bold text-sm">₪{sh.HourlyRate}/ש'</span>
              </div>
              {sh.Instructions && <div className="text-gray-500 text-xs mt-1">📋 {sh.Instructions}</div>}
              {done
                ? <div className="text-green-600 text-xs mt-1">✅ הושלמה{sh.TotalPay ? ` · ₪${sh.TotalPay}` : ''}</div>
                : today
                  ? <button onClick={() => onCheckIn(sh)} className="mt-2 w-full bg-amber-500 text-white rounded-lg py-2 text-sm font-bold">כנס למשמרת היום ›</button>
                  : <div className="text-gray-400 text-xs mt-1">מתוכננת</div>}
            </div>
          );
        })}

        {/* קביעת משמרת חדשה */}
        <div className="border-t border-gray-100 pt-3 space-y-3">
          <div className="text-sm font-bold text-gray-800">קבע משמרת חדשה</div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">תאריך</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>
          {/* התחלה מימין, סיום משמאל (RTL) */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">שעת התחלה</label>
              <input type="time" value={start} onChange={e => setStart(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">שעת סיום</label>
              <input type="time" value={end} onChange={e => setEnd(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">שכר לשעה (₪)</label>
            <input type="number" inputMode="numeric" value={rate} onChange={e => setRate(e.target.value)} placeholder="50" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">📋 הנחיות לעובד (אופציונלי)</label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2}
              placeholder="לדוגמה: מגיעים בבגדי עבודה, מתחילים בתחנת הסלטים..."
              className={inputCls + ' resize-none text-sm'} />
          </div>
          <p className="text-amber-700 text-xs text-center bg-amber-50 rounded-xl py-2">🎓 בתקופת הסטאז' העמלה שלך {(STAGE_RESTAURANT_COMMISSION * 100).toFixed(1)}% בלבד</p>
          {err && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 text-center">{err}</div>}
          {added && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-2 text-center font-semibold">✅ המשמרת נוספה ללוז — העובד קיבל התראה</div>}
          <button onClick={add} disabled={adding}
            className="w-full text-white rounded-2xl py-3.5 font-bold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow: '0 4px 16px rgba(232,160,32,0.35)' }}>
            {adding ? 'מוסיף...' : '+ הוסף משמרת ללוז'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── מודאל שליחת משמרת ישירה לעובד קבוע ──
const DirectShiftModal: React.FC<{ partner: any; restaurantId: number; onClose: () => void; onSent: () => void }> = ({ partner, restaurantId, onClose, onSent }) => {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(DEFAULTS_KEY) || '{}'); } catch { return {}; } })();
  const [date, setDate] = useState('');
  const [start, setStart] = useState(saved.start || '');
  const [end, setEnd] = useState(saved.end || '');
  const [rate, setRate] = useState(saved.rate || '');
  const [duties, setDuties] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    if (!date || !start || !end || !rate) { setErr('מלא תאריך, שעות ושכר'); return; }
    if (Number(rate) < 40) { setErr('שכר המינימום הוא ₪40 לשעה'); return; }
    setSending(true); setErr('');
    try {
      await api.createDirectShift({
        restaurantId, workerId: partner.WorkerId, role: partner.Role,
        startTime: new Date(`${date}T${start}:00`).toISOString(),
        endTime: new Date(`${date}T${end}:00`).toISOString(),
        hourlyRate: Number(rate), duties,
      });
      try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ start, end, rate })); } catch {}
      onSent();
    } catch (e: any) { setErr(e.message || 'שגיאה'); setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(13,20,32,0.65)', backdropFilter: 'blur(3px)' }}>
      <div className="bg-white rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-3 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-lg">משמרת ל{partner.Name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"><X size={17} /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">תאריך</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        {/* התחלה מימין, סיום משמאל (RTL) */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">שעת התחלה</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">שעת סיום</label>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">שכר לשעה (₪)</label>
          <input type="number" inputMode="numeric" value={rate} onChange={e => setRate(e.target.value)} placeholder="50" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">📋 הנחיות לעובד (אופציונלי)</label>
          <input type="text" value={duties} onChange={e => setDuties(e.target.value)} placeholder="מה צריך לעשות במשמרת" className={inputCls} />
        </div>
        <p className="text-amber-700 text-xs text-center bg-amber-50 rounded-xl py-2">עמלה מופחתת {(PARTNERSHIP_COMMISSION * 100).toFixed(1)}% — כי {partner.Name} עובד קבוע שלך 🎉</p>
        {err && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 text-center">{err}</div>}
        <button onClick={send} disabled={sending}
          className="w-full text-white rounded-2xl py-4 font-bold disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow: '0 4px 16px rgba(232,160,32,0.35)' }}>
          {sending ? 'שולח...' : 'שלח הצעת משמרת'}
        </button>
      </div>
    </div>
  );
};
