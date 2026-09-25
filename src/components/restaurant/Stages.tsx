import React, { useState, useEffect } from 'react';
import { setVisibleInterval } from '../../utils/visibleInterval';
import { GraduationCap, Check, Star, Send, Users, Plus, X, Calendar, Phone, MessageCircle, Trash2, ChevronRight, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { WORKER_ROLES } from '../../utils/roles';
import { ROLE_LABELS } from '../../data/mockData';
import { avatarTone } from '../../utils/colors';
import { ChatModal } from '../common/ChatModal';

type Tab = 'mine' | 'post' | 'partners';

// סטאז׳ מיועדת למקצועות שנלמדים בקורס: טבחים, ברמנים ובריסטות
const TRIAL_ROLES = WORKER_ROLES.filter(r => ['line_cook', 'bartender', 'barista'].includes(r.key));

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '';
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';
const daysLeft = (end?: string) => end ? Math.ceil((new Date(end).getTime() - Date.now()) / 86400000) : 0;
const stageProgress = (s: any) => {
  const st = new Date(s.StartTime).getTime(), en = new Date(s.EndTime).getTime();
  if (!st || !en || en <= st) return 0;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - st) / (en - st)) * 100)));
};
/* משמרת סטאז׳ (המודל החדש) מול סטאז' 3-שבועות (רשומות ותיקות שנשארות תקינות) */
const isTrial = (s: any) => s.JobType === 'trial';
const MIN_WAGE = 40;

// שדה קלט אחיד
const inputCls = 'w-full border border-[#eceef4] bg-[#f7f8fb] rounded-xl px-4 py-3 text-right outline-none focus:border-[#5354d3] focus:bg-white text-[#141a2e]';

// כרטיס לבן אחיד + CTA זהב (navy+gold design system)
const CARD: React.CSSProperties = { background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' };
const GOLD_CTA: React.CSSProperties = { background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' };

export const RestaurantStages: React.FC = () => {
  const { navToRestaurant, selectWorkerJob, userProfile, refreshProfile } = useApp();
  const rid = userProfile?.Id;
  const [tab, setTab] = useState<Tab>('mine');
  const [stages, setStages] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [wage, setWage] = useState('');
  const [duties, setDuties] = useState('');
  const [posting, setPosting] = useState(false);

  const [keepJob, setKeepJob] = useState<any | null>(null);
  const [keeping, setKeeping] = useState(false);
  const [directFor, setDirectFor] = useState<any | null>(null);
  const [chatStage, setChatStage] = useState<any | null>(null);

  // פתיחת דף הלוז של סטאז' — שומרים את הסטאז' כנבחר ועוברים לדף
  const openSchedule = (s: any) => {
    selectWorkerJob(String(s.Id), s);
    navToRestaurant('stage_schedule');
  };
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // קיבוץ לפי מצב — מסך פשוט וברור
  const visibleStages = stages.filter(s => s.Status !== 'cancelled');
  const groupApplicants = visibleStages.filter(s => ['pending_approval', 'matched'].includes(s.Status));
  const groupActive     = visibleStages.filter(s => ['confirmed', 'active'].includes(s.Status));
  const groupSearching  = visibleStages.filter(s => s.Status === 'searching');
  const groupDone       = visibleStages.filter(s => s.Status === 'completed');
  // מי שכבר גויס לצוות — כדי לא להציע לגייס אותו שוב
  const partnerIds = new Set(partners.map((p: any) => Number(p.WorkerId)));

  const doCancelStage = async (id: number) => {
    setCancelling(true);
    try { await api.cancelStage(id); setCancelId(null); await load(); }
    catch (e: any) { setMsg(e.message || 'שגיאה בביטול'); setCancelId(null); }
    setCancelling(false);
  };

  const load = async () => {
    if (!rid) return;
    const [jobs, prt] = await Promise.all([
      api.getRestaurantJobs(rid).catch(() => []),
      api.getPartners(rid).catch(() => []),
    ]);
    // סטאז׳ים (המודל החדש) + סטאז'ים ותיקים — כדי שרשומות קיימות לא ייעלמו מהמסך
    setStages((Array.isArray(jobs) ? jobs : []).filter((j: any) => j.JobType === 'trial' || j.JobType === 'stage'));
    setPartners(Array.isArray(prt) ? prt : []);
  };
  useEffect(() => { load(); }, [rid]);
  useEffect(() => { if (!rid) return; const iv = setVisibleInterval(load, 8000); return () => clearInterval(iv); }, [rid]);

  const handlePost = async () => {
    if (!role || !startDate || !startTime || !endTime || !wage) { setMsg('מלא תפקיד, תאריך, שעות ושכר'); return; }
    if (Number(wage) < MIN_WAGE) { setMsg(`שכר המינימום הוא ₪${MIN_WAGE} לשעה — סטאז׳ היא משמרת בתשלום`); return; }
    setPosting(true); setMsg('');
    try {
      // תמיכה במשמרת חוצת-חצות (22:00–02:00)
      const start = new Date(`${startDate}T${startTime}:00`);
      const end   = new Date(`${startDate}T${endTime}:00`);
      if (end <= start) end.setDate(end.getDate() + 1);
      await api.createTrial({
        restaurantId: rid, role, duties,
        startTime: start.toISOString(), endTime: end.toISOString(),
        hourlyRate: Number(wage),
      });
      setRole(''); setStartDate(''); setWage(''); setDuties('');
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
      {/* כותרת — הירו navy עם אקסנט זהב */}
      <div className="rounded-3xl overflow-hidden relative" style={{ background: '#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 220, height: 220, borderRadius: '50%', bottom: -110, left: -70, background: 'radial-gradient(circle, rgba(244,182,44,.18), transparent 66%)' }} />
        <div className="relative p-4 text-white flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(244,182,44,0.16)', border: '1px solid rgba(244,182,44,0.32)' }}>
            <GraduationCap size={22} style={{ color: '#f4b62c' }} />
          </div>
          <div>
            <div className="font-black text-lg leading-tight">סטאז׳ וגיוס</div>
            <div className="text-xs" style={{ color: '#b9c0d8' }}>משמרת אחת · ללא עמלה · סטודנטים ובוגרים</div>
          </div>
        </div>
      </div>

      {/* טאבים — הטופס נפתח רק מכפתור הפרסום */}
      {tab !== 'post' && (
        <div className="flex rounded-2xl p-1" style={{ background: '#f4f5f9' }}>
          {([['mine', 'הסטאז׳ים שלי'], ['partners', 'הקבועים שלי']] as [Tab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="relative flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={tab === k ? { background: '#fff', color: '#141a2e', boxShadow: '0 1px 3px rgba(20,26,46,.10)' } : { color: '#7a8199' }}>
              {l}
              {k === 'mine' && groupApplicants.length > 0 && (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full" style={{ background: '#5354d3' }} />
              )}
            </button>
          ))}
        </div>
      )}

      {msg && <div className="text-sm rounded-xl px-4 py-2.5 text-center font-semibold" style={{ background: '#fdf0cf', color: '#8a6300' }}>{msg}</div>}

      {/* ── פרסום סטאז' ── */}
      {tab === 'post' && (
        <>
        <button onClick={() => setTab('mine')} className="flex items-center gap-1 text-sm font-semibold active:scale-95 transition-transform" style={{ color: '#7a8199' }}>
          <ChevronRight size={18} /> חזרה לסטאז׳ים שלי
        </button>
        <div className="p-4 space-y-4" style={CARD}>
          <div className="rounded-xl px-3 py-2.5 text-xs leading-relaxed" style={{ background: '#e4f7ee', border: '1px solid #c9efdb', color: '#6b7290' }}>
            <b style={{ color: '#1f8f5f' }}>משמרת סטאז׳ אחת</b> — מועמד מקורס בישול/ברמנים מגיע למשמרת בודדת ואתם רואים אותו בעבודה.
            <b> ללא עמלה משני הצדדים</b> (רק עמלת הסליקה). אהבתם? אפשר לגייס בתום המשמרת.
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#6b7290' }}>תפקיד</label>
            <div className="grid grid-cols-2 gap-2">
              {TRIAL_ROLES.map(r => (
                <button key={r.key} onClick={() => setRole(r.key)}
                  className="p-3 rounded-xl border-2 flex items-center gap-2 text-right transition-all active:scale-95"
                  style={role === r.key ? { borderColor: '#5354d3', background: '#ece9fe' } : { borderColor: '#eceef4', background: '#fff' }}>
                  <span className="font-bold text-sm" style={{ color: '#141a2e' }}>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: '#6b7290' }}>תאריך המשמרת</label>
            <input type="date" value={startDate} min={new Date().toISOString().slice(0, 10)}
              onChange={e => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: '#6b7290' }}>שעת התחלה</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold mb-1.5 block" style={{ color: '#6b7290' }}>שעת סיום</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: '#6b7290' }}>שכר לשעה (₪)</label>
            <input type="number" inputMode="numeric" value={wage} onChange={e => setWage(e.target.value)}
              placeholder="50" min={MIN_WAGE} className={inputCls} />
            <p className="text-xs mt-1" style={{ color: '#7a8199' }}>
              משמרת סטאז׳ היא <b>משמרת בתשלום</b> — מינימום ₪{MIN_WAGE} לשעה. Staffly לא גובה עמלה עליה.
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: '#6b7290' }}>מה יעשה במשמרת?</label>
            <textarea value={duties} onChange={e => setDuties(e.target.value)} rows={3}
              placeholder="לדוגמה: עבודה לצד הטבח הראשי, הכנת מנות פתיחה, היכרות עם המטבח..."
              className={inputCls + ' resize-none text-sm'} />
          </div>
          <button onClick={handlePost} disabled={posting}
            className="w-full rounded-2xl py-4 font-bold disabled:opacity-40 active:scale-[0.98] transition-transform"
            style={{ background: '#5354d3', color: '#ffffff' }}>
            {posting ? 'מפרסם...' : 'פרסם משמרת סטאז׳'}
          </button>
        </div>
        </>
      )}

      {/* ── הסטאז'ים שלי ── */}
      {tab === 'mine' && (
        <div className="space-y-4">
          <button onClick={() => setTab('post')}
            className="w-full rounded-2xl py-4 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: '#5354d3', color: '#ffffff' }}>
            <Plus size={18} /> פרסם משמרת סטאז׳
          </button>

          {visibleStages.length === 0 && (
            <div className="text-center py-10" style={CARD}>
              <GraduationCap size={30} className="mx-auto mb-2" style={{ color: '#c2c7da' }} />
              <p className="font-bold text-sm" style={{ color: '#141a2e' }}>אין עדיין סטאז׳ים</p>
              <p className="text-xs mt-0.5" style={{ color: '#7a8199' }}>פרסמו משמרת סטאז׳ כדי להכיר מועמד בעבודה</p>
            </div>
          )}

          {/* ממתינים לאישורך — קודם, כי זה דורש פעולה */}
          {groupApplicants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#5354d3' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#5354d3' }} /> ממתינים לאישורך ({groupApplicants.length})
              </div>
              {groupApplicants.map(s => (
                <div key={s.Id} className="p-4 space-y-2.5" style={CARD}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold"
                      style={{ background: avatarTone(s.WorkerName).bg, color: avatarTone(s.WorkerName).fg }}>
                      {(s.WorkerName || 'מ').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="font-black" style={{ color: '#141a2e' }}>{s.WorkerName || 'מועמד'}</div>
                      <div className="text-xs" style={{ color: '#7a8199' }}>
                        {ROLE_LABELS[s.Role] || s.Role} · {isTrial(s)
                          ? `${fmtDate(s.StartTime)} · ${fmtTime(s.StartTime)}–${fmtTime(s.EndTime)}`
                          : `${fmtDate(s.StartTime)}–${fmtDate(s.EndTime)}`}
                      </div>
                    </div>
                    <button onClick={() => setCancelId(Number(s.Id))} title="בטל"
                      className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                      style={{ background: '#f4f5f9', border: '1px solid #eceef4', color: '#7a8199' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {cancelId === Number(s.Id) ? (
                    <CancelConfirm onYes={() => doCancelStage(Number(s.Id))} onNo={() => setCancelId(null)} busy={cancelling} />
                  ) : (
                    <button onClick={() => approve(Number(s.Id))}
                      className="w-full rounded-xl py-3 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                      style={{ background: '#5354d3', color: '#fff' }}>
                      <Check size={16} /> {isTrial(s) ? 'אשר את המועמד לסטאז׳' : "אשר את המועמד לסטאז'"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* סטאז' פעיל */}
          {groupActive.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold" style={{ color: '#7a8199' }}>מאושר / בעבודה ({groupActive.length})</div>
              {groupActive.map(s => {
                const left = daysLeft(s.EndTime);
                return (
                  <div key={s.Id} className="p-4 space-y-3" style={CARD}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold"
                          style={{ background: avatarTone(s.WorkerName).bg, color: avatarTone(s.WorkerName).fg }}>
                          {(s.WorkerName || 'ע').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-black" style={{ color: '#141a2e' }}>{s.WorkerName || 'העובד'}</div>
                          <div className="text-xs" style={{ color: '#7a8199' }}>
                            {ROLE_LABELS[s.Role] || s.Role} · {isTrial(s)
                              ? `${fmtDate(s.StartTime)} · ${fmtTime(s.StartTime)}–${fmtTime(s.EndTime)}`
                              : `עד ${fmtDate(s.EndTime)}`}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-extrabold" style={isTrial(s)
                        ? { padding: '3px 9px', borderRadius: 6, background: '#fdf0cf', color: '#8a6300' }
                        : { padding: '3px 9px', borderRadius: 6, background: '#e4f7ee', color: '#1f8f5f' }}>
                        {isTrial(s) ? 'סטאז׳' : 'פעיל'}
                      </span>
                    </div>
                    {isTrial(s) ? (
                      <div className="rounded-xl px-3 py-2 text-[11px] leading-snug" style={{ background: '#e4f7ee', border: '1px solid #c9efdb', color: '#6b7290' }}>
                        משמרת סטאז׳ · ₪{s.HourlyRate}/שעה · ללא עמלה. בתום המשמרת תוכלו להחליט אם לגייס.
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between text-[11px] mb-1" style={{ color: '#7a8199' }}>
                          <span>התקדמות</span>
                          <span>{left > 0 ? `עוד ${left} ימים` : 'הסתיימה התקופה'}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#eceef4' }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${stageProgress(s)}%`, background: '#5354d3' }} />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!isTrial(s) && (
                        <button onClick={() => openSchedule(s)}
                          className="flex-1 rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                          style={{ background: '#141a2e', color: '#fff' }}>
                          <Calendar size={15} /> לוז המשמרות
                        </button>
                      )}
                      <button onClick={() => setChatStage(s)}
                        className="w-11 rounded-xl flex items-center justify-center active:scale-95 transition-transform" title="צ'אט"
                        style={{ background: '#ece9fe', border: '1px solid #d9d5fb', color: '#5b4bd0' }}>
                        <MessageCircle size={17} />
                      </button>
                      {s.WorkerPhone && (
                        <a href={`tel:${s.WorkerPhone}`}
                          className="w-11 rounded-xl flex items-center justify-center active:scale-95 transition-transform" title="התקשר"
                          style={{ background: '#e4f7ee', border: '1px solid #c9efdb', color: '#1f8f5f' }}>
                          <Phone size={17} />
                        </a>
                      )}
                    </div>
                    {left <= 0 && !partnerIds.has(Number(s.WorkerId)) && (
                      <button onClick={() => setKeepJob(s)}
                        className="w-full rounded-2xl py-3.5 font-bold active:scale-[0.98] transition-transform"
                        style={GOLD_CTA}>
                        גייס לצוות — דמי השמה ₪300
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* בחיפוש מתלמד */}
          {groupSearching.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold" style={{ color: '#7a8199' }}>בחיפוש מועמד ({groupSearching.length})</div>
              {groupSearching.map(s => (
                <div key={s.Id} className="p-4 space-y-2.5" style={CARD}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#f4f5f9' }}><Search size={18} style={{ color: '#7a8199' }} /></div>
                    <div className="flex-1">
                      <div className="font-black" style={{ color: '#141a2e' }}>{ROLE_LABELS[s.Role] || s.Role}</div>
                      <div className="text-xs" style={{ color: '#7a8199' }}>
                        {isTrial(s)
                          ? `סטאז׳ · ${fmtDate(s.StartTime)} · ${fmtTime(s.StartTime)}–${fmtTime(s.EndTime)} · ₪${s.HourlyRate}/ש'`
                          : `מתחיל ${fmtDate(s.StartTime)} · 3 שבועות`}
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold flex-shrink-0" style={{ padding: '3px 9px', borderRadius: 6, background: '#fdf0cf', color: '#8a6300' }}>מחפש</span>
                    <button onClick={() => setCancelId(Number(s.Id))} title="בטל"
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                      style={{ background: '#f4f5f9', border: '1px solid #eceef4', color: '#7a8199' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {cancelId === Number(s.Id) && (
                    <CancelConfirm onYes={() => doCancelStage(Number(s.Id))} onNo={() => setCancelId(null)} busy={cancelling} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* הסתיימו — שורות קומפקטיות */}
          {groupDone.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold" style={{ color: '#7a8199' }}>הסתיימו ({groupDone.length})</div>
              {groupDone.map(s => {
                const hired = partnerIds.has(Number(s.WorkerId));
                // רגע ההחלטה: סטאז׳ שהסתיימה, יש עובד, ועוד לא גויס
                const canHire = isTrial(s) && !!s.WorkerId && !hired;
                return (
                  <div key={s.Id} className="px-3.5 py-2.5 space-y-2" style={{ ...CARD, borderRadius: 14 }}>
                    <div className="flex items-center gap-2.5">
                      <Check size={16} className="flex-shrink-0" style={{ color: '#1f8f5f' }} />
                      <span className="font-semibold text-sm flex-1 truncate" style={{ color: '#2b3350' }}>{s.WorkerName || ROLE_LABELS[s.Role] || s.Role}</span>
                      {hired && <span className="text-[10px] font-extrabold flex-shrink-0" style={{ padding: '2px 8px', borderRadius: 6, background: '#e4f7ee', color: '#1f8f5f' }}>גויס לצוות</span>}
                      <span className="text-xs flex-shrink-0" style={{ color: '#7a8199' }}>
                        {isTrial(s) ? fmtDate(s.StartTime) : `${fmtDate(s.StartTime)}–${fmtDate(s.EndTime)}`}
                      </span>
                    </div>
                    {canHire && (
                      <>
                        <p className="text-[11px] leading-snug" style={{ color: '#6b7290' }}>
                          הסטאז׳ הסתיימה — רוצים להמשיך עם {s.WorkerName || 'העובד'}?
                        </p>
                        <button onClick={() => setKeepJob(s)}
                          className="w-full rounded-xl py-2.5 font-bold text-sm active:scale-[0.98] transition-transform"
                          style={GOLD_CTA}>
                          גייס לצוות — דמי השמה ₪300
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── העובדים הקבועים ── */}
      {tab === 'partners' && (
        <div className="space-y-3">
          <div className="rounded-2xl p-3 text-center" style={{ background: '#fdf0cf', border: '1px solid #f2e2b0' }}>
            <span className="text-sm font-semibold" style={{ color: '#8a6300' }}>הצוות שגייסת דרך Staffly — אפשר להזמין אותם שוב בקלות</span>
          </div>
          {partners.length === 0 && (
            <div className="text-center py-10" style={CARD}>
              <Users size={28} className="mx-auto mb-2" style={{ color: '#c2c7da' }} />
              <p className="font-bold text-sm" style={{ color: '#141a2e' }}>אין עדיין עובדים קבועים</p>
              <p className="text-xs mt-0.5" style={{ color: '#7a8199' }}>גייס מועמד בתום סטאז׳ כדי להתחיל</p>
            </div>
          )}
          {partners.map(p => (
            <div key={p.WorkerId} className="p-4" style={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold"
                  style={{ background: avatarTone(p.Name).bg, color: avatarTone(p.Name).fg }}>{(p.Name || 'ע').slice(0, 2)}</div>
                <div className="flex-1">
                  <div className="font-black" style={{ color: '#141a2e' }}>{p.Name}</div>
                  <div className="text-xs flex items-center gap-2" style={{ color: '#7a8199' }}>
                    <span>{ROLE_LABELS[p.Role] || p.Role}</span>
                    {p.Rating > 0 && <span className="flex items-center gap-0.5"><Star size={11} style={{ color: '#f4b62c', fill: '#f4b62c' }} />{Number(p.Rating).toFixed(1)}</span>}
                    <span className="font-semibold" style={{ color: '#1f8f5f' }}>קבוע</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDirectFor(p)}
                  className="flex-1 rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  style={{ background: '#5354d3', color: '#fff' }}>
                  <Send size={14} /> שלח משמרת
                </button>
                {p.Phone && (
                  <a href={`tel:${p.Phone}`}
                    className="w-11 rounded-xl flex items-center justify-center active:scale-95 transition-transform" title="התקשר"
                    style={{ background: '#e4f7ee', border: '1px solid #c9efdb', color: '#1f8f5f' }}>
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{ background: 'rgba(19,22,38,0.65)' }}>
          <div className="rounded-3xl p-6 w-full max-w-sm text-center space-y-3" style={{ background: '#fff', boxShadow: '0 20px 60px -12px rgba(20,26,46,.4)' }}>
            <Star size={36} className="mx-auto" style={{ color: '#f4b62c', fill: '#f4b62c' }} />
            <h3 className="font-black text-lg" style={{ color: '#141a2e' }}>לגייס את {keepJob.WorkerName || 'העובד'} לצוות?</h3>
            <p className="text-sm" style={{ color: '#6b7290' }}>
              ייגבו <b>₪300</b> — דמי השמה <b>חד-פעמיים</b>. מכאן ההעסקה ישירה מולך כמעסיק, ללא עמלה נוספת אף פעם —
              Staffly אינה צד ביחסי העבודה.
            </p>
            <p className="text-[11px] leading-snug" style={{ color: '#7a8199' }}>
              נדרש להעסיק אותו כחוק ולא למנוע ממנו להמשיך להשתמש ב-Staffly למשמרות מזדמנות.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setKeepJob(null)} className="flex-1 rounded-2xl py-3 font-bold active:scale-95 transition-transform" style={{ background: '#f4f5f9', color: '#6b7290' }}>ביטול</button>
              <button onClick={doKeep} disabled={keeping}
                className="flex-1 rounded-2xl py-3 font-bold disabled:opacity-40 active:scale-[0.98] transition-transform"
                style={GOLD_CTA}>
                {keeping ? '...' : 'כן, גייס (₪300)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {directFor && (
        <DirectShiftModal partner={directFor} restaurantId={rid}
          onClose={() => setDirectFor(null)}
          onSent={() => { setDirectFor(null); setMsg('ההצעה נשלחה לעובד'); }} />
      )}


      {chatStage && (
        <ChatModal jobId={Number(chatStage.Id)} title={chatStage.WorkerName || 'העובד'}
          myRole="restaurant" myName={userProfile?.Name || 'המסעדה'}
          onClose={() => setChatStage(null)} />
      )}
    </div>
  );
};

// ── אישור ביטול קטן בתוך כרטיס ──
const CancelConfirm: React.FC<{ onYes: () => void; onNo: () => void; busy: boolean }> = ({ onYes, onNo, busy }) => (
  <div className="flex items-center gap-2 rounded-xl p-2.5" style={{ background: '#fde3e3', border: '1px solid #f8c9c9' }}>
    <span className="text-xs font-semibold flex-1" style={{ color: '#cf3030' }}>לבטל?</span>
    <button onClick={onYes} disabled={busy}
      className="rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 active:scale-95 transition-transform"
      style={{ background: '#cf3030', color: '#fff' }}>
      {busy ? '...' : 'כן, בטל'}
    </button>
    <button onClick={onNo} className="rounded-lg px-3 py-1.5 text-xs font-bold active:scale-95 transition-transform" style={{ background: '#fff', border: '1px solid #eceef4', color: '#7a8199' }}>לא</button>
  </div>
);

// ברירות מחדל לשעות/שכר (משותף עם דף קביעת משמרת סטאז')
const DEFAULTS_KEY = 'km_stage_shift_defaults';

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
      // תמיכה במשמרת חוצת-חצות (למשל 22:00–02:00) — כמו ב-CreateJob
      const startDate = new Date(`${date}T${start}:00`);
      const endDate   = new Date(`${date}T${end}:00`);
      if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
      await api.createDirectShift({
        restaurantId, workerId: partner.WorkerId, role: partner.Role,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        hourlyRate: Number(rate), duties,
      });
      try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ start, end, rate })); } catch {}
      onSent();
    } catch (e: any) { setErr(e.message || 'שגיאה'); setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(19,22,38,0.65)' }}>
      <div className="rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-3" style={{ background: '#fff', boxShadow: '0 20px 60px -12px rgba(20,26,46,.4)' }}>
        <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid #eceef4' }}>
          <h3 className="font-black text-lg" style={{ color: '#141a2e' }}>משמרת ל{partner.Name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: '#f4f5f9', color: '#7a8199' }}><X size={17} /></button>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#6b7290' }}>תאריך</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        {/* התחלה מימין, סיום משמאל (RTL) */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#6b7290' }}>שעת התחלה</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#6b7290' }}>שעת סיום</label>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#6b7290' }}>שכר לשעה (₪)</label>
          <input type="number" inputMode="numeric" value={rate} onChange={e => setRate(e.target.value)} placeholder="50" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: '#6b7290' }}>הנחיות לעובד (אופציונלי)</label>
          <input type="text" value={duties} onChange={e => setDuties(e.target.value)} placeholder="מה צריך לעשות במשמרת" className={inputCls} />
        </div>
        <p className="text-xs text-center rounded-xl py-2" style={{ background: '#fdf0cf', color: '#8a6300' }}>{partner.Name} בצוות שלך — הזמנה מהירה למשמרת בודדת</p>
        {err && <div className="text-sm rounded-xl px-4 py-2 text-center" style={{ background: '#fde3e3', color: '#cf3030' }}>{err}</div>}
        <button onClick={send} disabled={sending}
          className="w-full rounded-2xl py-4 font-bold disabled:opacity-40 active:scale-[0.98] transition-transform"
          style={{ background: '#5354d3', color: '#ffffff' }}>
          {sending ? 'שולח...' : 'שלח הצעת משמרת'}
        </button>
      </div>
    </div>
  );
};
