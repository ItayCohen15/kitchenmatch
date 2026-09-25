import React, { useState, useEffect } from 'react';
import { setVisibleInterval } from '../../utils/visibleInterval';
import { GraduationCap, Send, MapPin, Clock, Check, Calendar, Lightbulb, Phone, MessageCircle, ChevronDown, Archive, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS, visibleShiftRoles } from '../../utils/roles';
import { STAGE_WORKER_COMMISSION } from '../../utils/levels';
import { ChatModal } from '../common/ChatModal';
import { StageLocked } from './StageLocked';
import { avatarTone } from '../../utils/colors';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '';
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';
const isToday = (d?: string) => d ? new Date(d).toDateString() === new Date().toDateString() : false;
const daysLeft = (end?: string) => end ? Math.ceil((new Date(end).getTime() - Date.now()) / 86400000) : 0;
const stageProgress = (s: any) => {
  const st = new Date(s.StartTime).getTime(), en = new Date(s.EndTime).getTime();
  if (!st || !en || en <= st) return 0;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - st) / (en - st)) * 100)));
};

/* סטאז' "נגמר" = נסגר רשמית, או שתקופת הסטאז' פשוט עברה.
   בלי התנאי השני, סטאז' שהסתיים אבל המסעדה לא סימנה 'הושלם'
   היה ממשיך להיתפס כפעיל ולשבת בראש המסך לנצח. */
const isEndedStage = (s: any) =>
  s.Status === 'completed' || s.Status === 'cancelled' ||
  (s.EndTime ? new Date(s.EndTime).getTime() < Date.now() : false);

/* הסטאז' הפעיל = מאושר/פעיל *ושתקופתו טרם הסתיימה* */
const pickActiveStage = (list: any[]) =>
  list.find((m: any) => (m.Status === 'confirmed' || m.Status === 'active') && !isEndedStage(m));

const ENDED_LABEL: Record<string, { text: string; cls: string }> = {
  completed: { text: 'הושלם',  cls: 'bg-[#e4f7ee] text-[#1f8f5f]' },
  cancelled: { text: 'בוטל',   cls: 'bg-[#fdecec] text-[#c0392b]' },
};

export const WorkerStages: React.FC = () => {
  const { userProfile, selectWorkerJob, navToWorker } = useApp();
  const wid = userProfile?.Id;
  const workerRole = userProfile?.Role || '';
  const allowedRoles = visibleShiftRoles(workerRole);

  // סטאז׳ פתוח רק לסטודנטים/בוגרים. מי שאינו — מקבל מסך חסום *אך נגיש*
  // (הסבר + דרך להיפתח + בתי ספר וקורסים), ולא מסך ריק.
  const isTrainee = !!userProfile?.IsTrainee;

  const [offers, setOffers] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);     // סטאז׳ים פתוחות (לסטודנטים/בוגרים)
  const [myTrials, setMyTrials] = useState<any[]>([]); // הסטאז׳ים שלי
  const [mine, setMine] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [showChat, setShowChat] = useState(false);
  // ארכיון הסטאז'ים שנגמרו — סגור כברירת מחדל, נטען רק בפתיחה
  const [showEnded, setShowEnded] = useState(false);
  const [endedSummary, setEndedSummary] = useState<Record<number, { shifts: number; earned: number }>>({});
  const [loadingEnded, setLoadingEnded] = useState(false);

  const activeStage = pickActiveStage(mine);

  const load = async () => {
    if (!wid) return;
    const [off, stg, trl, hist] = await Promise.all([
      api.getWorkerOffers(wid).catch(() => []),
      api.getStages().catch(() => []),
      // סטאז׳ים — השרת מחזיר 403 למי שאינו סטודנט/בוגר, ואז פשוט רשימה ריקה
      isTrainee ? api.getTrials().catch(() => []) : Promise.resolve([]),
      api.getWorkerHistory(wid).catch(() => []),
    ]);
    setOffers(Array.isArray(off) ? off : []);
    setStages(Array.isArray(stg) ? stg : []);
    setTrials(Array.isArray(trl) ? trl : []);
    setMyTrials((Array.isArray(hist) ? hist : []).filter((j: any) => j.JobType === 'trial'));
    const myStages = (Array.isArray(hist) ? hist : []).filter((j: any) => j.JobType === 'stage');
    setMine(myStages);
    const act = pickActiveStage(myStages);
    if (act) {
      const sh = await api.getStageShifts(Number(act.Id)).catch(() => []);
      setShifts(Array.isArray(sh) ? sh : []);
    } else setShifts([]);
  };
  useEffect(() => { load(); }, [wid]);
  useEffect(() => { if (!wid) return; const iv = setVisibleInterval(load, 8000); return () => clearInterval(iv); }, [wid]);

  const applyStage = async (stageId: number) => {
    setBusy(stageId); setMsg('');
    try { await api.applyToJob(stageId, wid); setMsg('המועמדות נשלחה. ממתין לאישור המסעדה.'); await load(); }
    catch (e: any) { setMsg(e.message || 'שגיאה בהגשה'); }
    setBusy(null);
  };

  const acceptOffer = async (offer: any) => {
    setBusy(Number(offer.Id)); setMsg('');
    try { await api.acceptOffer(Number(offer.Id)); selectWorkerJob(String(offer.Id), offer); navToWorker('navigation'); }
    catch (e: any) { setMsg(e.message || 'ההצעה כבר טופלה'); setBusy(null); await load(); }
  };

  const checkInShift = (sh: any) => {
    selectWorkerJob(String(sh.Id), {
      ...sh,
      RestaurantName: activeStage?.RestaurantName,
      RestaurantCity: activeStage?.RestaurantCity,
      RestaurantAddress: activeStage?.RestaurantAddress,
      RestaurantPhone: activeStage?.RestaurantPhone,
    });
    navToWorker('navigation');
  };

  const appliedIds = new Set(mine.map(m => Number(m.Id)));
  const openStages = stages.filter(s => allowedRoles.includes(s.Role) && !appliedIds.has(Number(s.Id)));

  // ── סטאז׳ים: פתוחות (בתפקיד שלי, בלי חסימת מרחק) + שלי ──
  const myTrialIds = new Set(myTrials.map(t => Number(t.Id)));
  const openTrials = trials.filter(t => allowedRoles.includes(t.Role) && !myTrialIds.has(Number(t.Id)));
  const activeTrials  = myTrials.filter(t => ['pending_approval', 'matched', 'confirmed', 'active'].includes(t.Status));
  const doneTrials    = myTrials.filter(t => t.Status === 'completed');

  const applyTrial = async (trialId: number) => {
    setBusy(trialId); setMsg('');
    try { await api.applyToJob(trialId, wid); setMsg('המועמדות לסטאז׳ נשלחה. ממתין לאישור המסעדה.'); await load(); }
    catch (e: any) { setMsg(e.message || 'שגיאה בהגשה'); }
    setBusy(null);
  };
  // כניסה למשמרת סטאז׳ — זורמת בזרימת המשמרת הרגילה (ניווט → צ'ק-אין → סיום)
  const openTrialShift = (t: any) => { selectWorkerJob(String(t.Id), t); navToWorker('navigation'); };

  /* שלוש קבוצות זרות: פעיל · ממתין לאישור · נגמר (החדש ביותר ראשון) */
  const endedStages = mine.filter(isEndedStage)
    .sort((a, b) => new Date(b.EndTime || 0).getTime() - new Date(a.EndTime || 0).getTime());
  const pendingStages = mine.filter(m =>
    !isEndedStage(m) && ['pending_approval', 'matched', 'searching'].includes(m.Status));

  /* פתיחת הארכיון — טוענים סיכומים פעם אחת בלבד, לפי דרישה */
  const toggleEnded = async () => {
    const next = !showEnded;
    setShowEnded(next);
    if (!next || loadingEnded || !endedStages.length) return;
    if (endedStages.every(s => endedSummary[Number(s.Id)] !== undefined)) return; // כבר נטען
    setLoadingEnded(true);
    try {
      const lists = await Promise.all(
        endedStages.map(s => api.getStageShifts(Number(s.Id)).catch(() => [])));
      const map: Record<number, { shifts: number; earned: number }> = {};
      endedStages.forEach((s, i) => {
        const done = (Array.isArray(lists[i]) ? lists[i] : []).filter((x: any) => x.Status === 'completed');
        map[Number(s.Id)] = {
          shifts: done.length,
          earned: done.reduce((t: number, x: any) => t + (Number(x.TotalPay) || 0), 0),
        };
      });
      setEndedSummary(prev => ({ ...prev, ...map }));
    } finally { setLoadingEnded(false); }
  };
  const lastFeedback = [...shifts].reverse().find(s => s.ImprovementNote || s.NextShiftNote);
  const left = activeStage ? daysLeft(activeStage.EndTime) : 0;

  // מסך חסום למי שאינו סטודנט/בוגר — אלא אם יש לו סטאז׳ ותיק פעיל/בהיסטוריה
  // (שלא ננעל בפניו משהו שהוא כבר בתוכו).
  if (!isTrainee && !mine.length && !myTrials.length) return <StageLocked />;

  return (
    <div className="screen-enter space-y-4">
      {/* כותרת */}
      <div className="relative rounded-3xl overflow-hidden p-4 text-white flex items-center gap-3"
        style={{ background: '#141a2e' }}>
        <div className="absolute pointer-events-none" style={{ width: 200, height: 200, borderRadius: '50%', bottom: -110, left: -70, background: 'radial-gradient(circle, rgba(244,182,44,.18), transparent 66%)' }} />
        <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(244,182,44,0.15)', border: '1px solid rgba(244,182,44,0.35)' }}>
          <GraduationCap size={22} style={{ color: '#f4b62c' }} />
        </div>
        <div className="relative">
          <div className="font-black text-lg leading-tight">סטאז׳ והצעות</div>
          <div className="text-xs" style={{ color: '#b9c0d8' }}>משמרת אחת להוכיח את עצמך · ללא עמלה</div>
        </div>
      </div>

      {msg && <div className="text-sm rounded-xl px-4 py-2.5 text-center font-bold" style={{ background: '#e4f7ee', color: '#1f8f5f' }}>{msg}</div>}

      {/* ══ הסטאז׳ים שלי ══ */}
      {activeTrials.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-black text-sm" style={{ color: '#141a2e' }}>הסטאז׳ שלי</h3>
          {activeTrials.map(t => {
            const waiting = ['pending_approval', 'matched'].includes(t.Status);
            const today = isToday(t.StartTime);
            return (
              <div key={t.Id} className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-black" style={{ color: '#141a2e' }}>{t.RestaurantName}</span>
                  <span className="whitespace-nowrap" style={{ fontSize: 12, fontWeight: 800, padding: '5px 10px', borderRadius: 8, background: '#fdf0cf', color: '#8a6300' }}>₪{t.HourlyRate}/ש'</span>
                </div>
                <div className="text-xs flex items-center gap-3 mb-2.5 flex-wrap font-semibold" style={{ color: '#6b7290' }}>
                  <span>{ROLE_LABELS[t.Role] || t.Role}</span>
                  <span className="flex items-center gap-1"><Clock size={12} style={{ color: '#a7adc4' }} />{fmtDate(t.StartTime)} · {fmtTime(t.StartTime)}–{fmtTime(t.EndTime)}</span>
                  {t.RestaurantCity && <span className="flex items-center gap-1"><MapPin size={12} style={{ color: '#a7adc4' }} />{t.RestaurantCity}</span>}
                </div>
                {waiting ? (
                  <div className="inline-block" style={{ fontSize: 12, fontWeight: 800, padding: '5px 10px', borderRadius: 6, background: '#fdf0cf', color: '#8a6300' }}>ממתין לאישור המסעדה</div>
                ) : today ? (
                  <button onClick={() => openTrialShift(t)}
                    className="w-full rounded-xl py-3 font-extrabold active:scale-[0.98] transition-transform"
                    style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}>
                    כנס למשמרת הסטאז׳ ›
                  </button>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 800, padding: '8px 12px', borderRadius: 10, background: '#e4f7ee', color: '#1f8f5f' }}>
                    אושרת! נתראה ב-{fmtDate(t.StartTime)} · הכל בלי עמלה
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ סטאז׳ים פתוחות — רק לסטודנטים/בוגרים ══ */}
      {isTrainee && (
        <div className="space-y-2">
          <h3 className="font-black text-sm" style={{ color: '#141a2e' }}>משמרות סטאז׳ פתוחות</h3>
          <p className="text-xs -mt-1" style={{ color: '#7a8199' }}>
            משמרת אחת שבה המסעדה מכירה אותך בעבודה — <b style={{ color: '#2b3350' }}>בתשלום מלא וללא עמלה</b>. אהבו? אפשר להתקבל לעבודה.
          </p>
          {openTrials.length === 0 && (
            <div className="text-center py-8" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <Search size={26} className="mx-auto mb-2" style={{ color: '#c2c7da' }} />
              <p className="text-sm font-bold" style={{ color: '#2b3350' }}>אין כרגע סטאז׳ים פתוחות בתחום שלך</p>
              <p className="text-xs" style={{ color: '#7a8199' }}>נשלח לך התראה כשתיפתח אחת</p>
            </div>
          )}
          {openTrials.map(t => (
            <div key={t.Id} className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-black" style={{ color: '#141a2e' }}>{t.RestaurantName}</span>
                <span className="whitespace-nowrap" style={{ fontSize: 12, fontWeight: 800, padding: '5px 10px', borderRadius: 8, background: '#fdf0cf', color: '#8a6300' }}>₪{t.HourlyRate}/ש'</span>
              </div>
              <div className="text-xs flex items-center gap-3 mb-2 flex-wrap font-semibold" style={{ color: '#6b7290' }}>
                <span>{ROLE_LABELS[t.Role] || t.Role}</span>
                <span className="flex items-center gap-1"><Clock size={12} style={{ color: '#a7adc4' }} />{fmtDate(t.StartTime)} · {fmtTime(t.StartTime)}–{fmtTime(t.EndTime)}</span>
                {t.RestaurantCity && <span className="flex items-center gap-1"><MapPin size={12} style={{ color: '#a7adc4' }} />{t.RestaurantCity}</span>}
              </div>
              {t.Duties && <p className="text-xs mb-2" style={{ color: '#6b7290' }}>{t.Duties}</p>}
              <div className="text-[11px] mb-2.5" style={{ padding: '6px 10px', borderRadius: 8, background: '#e4f7ee', color: '#1f8f5f', fontWeight: 700 }}>
                ללא עמלה — תקבל את השכר המלא
              </div>
              <button onClick={() => applyTrial(Number(t.Id))} disabled={busy === Number(t.Id)}
                className="w-full rounded-xl py-3 font-extrabold disabled:opacity-40 active:scale-[0.98] transition-transform"
                style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}>
                {busy === Number(t.Id) ? 'שולח...' : 'הגש מועמדות לסטאז׳'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* סטאז׳ים שהסתיימו */}
      {doneTrials.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-black text-sm" style={{ color: '#141a2e' }}>סטאז׳ים שהסתיימו</h3>
          {doneTrials.map(t => (
            <div key={t.Id} className="px-3.5 py-2.5 flex items-center gap-2.5" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 14, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <Check size={16} className="flex-shrink-0" style={{ color: '#1f9d6b' }} />
              <span className="font-bold text-sm flex-1 truncate" style={{ color: '#2b3350' }}>{t.RestaurantName}</span>
              <span className="text-xs flex-shrink-0" style={{ color: '#7a8199' }}>
                {fmtDate(t.StartTime)}{t.TotalPay ? ` · ₪${Math.round(Number(t.TotalPay))}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* הצעות ישירות */}
      {offers.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-black text-sm flex items-center gap-1.5" style={{ color: '#141a2e' }}><Send size={15} style={{ color: '#5354d3' }} /> הצעות ישירות בשבילך</h3>
          {offers.map(o => (
            <div key={o.Id} className="p-4" style={{ background: '#fff', border: '1px solid #d9d9f7', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-black" style={{ color: '#141a2e' }}>{o.RestaurantName}</span>
                <span className="whitespace-nowrap" style={{ fontSize: 12, fontWeight: 800, padding: '5px 10px', borderRadius: 8, background: '#fdf0cf', color: '#8a6300' }}>₪{o.HourlyRate}/ש'</span>
              </div>
              <div className="text-xs flex items-center gap-3 mb-2 font-semibold" style={{ color: '#6b7290' }}>
                <span>{ROLE_LABELS[o.Role] || o.Role}</span>
                <span className="flex items-center gap-1"><Clock size={12} style={{ color: '#a7adc4' }} />{fmtDate(o.StartTime)} · {fmtTime(o.StartTime)}–{fmtTime(o.EndTime)}</span>
              </div>
              {o.Duties && <p className="text-xs mb-2" style={{ color: '#6b7290' }}>{o.Duties}</p>}
              <button onClick={() => acceptOffer(o)} disabled={busy === Number(o.Id)}
                className="w-full rounded-xl py-3 font-extrabold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
                style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}>
                <Check size={16} /> {busy === Number(o.Id) ? 'מאשר...' : 'אשר וקבל משמרת'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* הסטאז' הפעיל שלי */}
      {activeStage && (
        <div className="p-4 space-y-3" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          {/* כותרת + פעולות קשר */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black"
                style={{ background: avatarTone(activeStage.RestaurantName).bg, color: avatarTone(activeStage.RestaurantName).fg }}>
                {(activeStage.RestaurantName || 'מ').slice(0, 2)}
              </div>
              <div>
                <div className="font-black" style={{ color: '#141a2e' }}>{activeStage.RestaurantName}</div>
                <div className="text-xs" style={{ color: '#7a8199' }}>{ROLE_LABELS[activeStage.Role] || activeStage.Role} · סטאז' פעיל</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowChat(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform" style={{ background: '#ece9fe', border: '1px solid #d9d9f7', color: '#5354d3' }} title="צ'אט עם המסעדה">
                <MessageCircle size={17} />
              </button>
              {activeStage.RestaurantPhone && (
                <a href={`tel:${activeStage.RestaurantPhone}`}
                  className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform" style={{ background: '#e4f7ee', border: '1px solid #c7ecd8', color: '#1f8f5f' }} title="התקשר למסעדה">
                  <Phone size={17} />
                </a>
              )}
            </div>
          </div>

          {/* התקדמות */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-semibold" style={{ color: '#7a8199' }}>
              <span>התקדמות הסטאז'</span>
              <span>{left > 0 ? `עוד ${left} ימים` : 'הסתיימה התקופה'}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#eceef4' }}>
              <div className="h-full rounded-full" style={{ width: `${stageProgress(activeStage)}%`, background: '#5354d3' }} />
            </div>
          </div>

          {/* משוב אחרון מהמסעדה */}
          {lastFeedback && (
            <div className="rounded-2xl p-3 space-y-2" style={{ background: '#ece9fe', border: '1px solid #d9d9f7' }}>
              {lastFeedback.ImprovementNote && (
                <div className="flex items-start gap-2">
                  <Lightbulb size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#5b4bd0' }} />
                  <div><div className="text-xs font-bold" style={{ color: '#4a3db0' }}>נקודות לשיפור</div><div className="text-xs" style={{ color: '#5b4bd0' }}>{lastFeedback.ImprovementNote}</div></div>
                </div>
              )}
              {lastFeedback.NextShiftNote && (
                <div className="flex items-start gap-2">
                  <Calendar size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#5b4bd0' }} />
                  <div><div className="text-xs font-bold" style={{ color: '#4a3db0' }}>למשמרת הבאה</div><div className="text-xs" style={{ color: '#5b4bd0' }}>{lastFeedback.NextShiftNote}</div></div>
                </div>
              )}
            </div>
          )}

          {/* לוז משמרות */}
          <div className="space-y-2">
            <div className="text-sm font-black flex items-center gap-1.5" style={{ color: '#141a2e' }}><Calendar size={14} style={{ color: '#5354d3' }} /> לוז המשמרות</div>
            {shifts.length === 0 && <div className="text-xs rounded-xl p-3 text-center" style={{ color: '#7a8199', background: '#f4f5f9' }}>המסעדה עוד לא קבעה משמרות — תקבל התראה כשתיקבע</div>}
            {shifts.map(sh => {
              const today = isToday(sh.StartTime);
              const done = sh.Status === 'completed';
              return (
                <div key={sh.Id} className="rounded-xl p-3" style={today && !done ? { border: '1px solid #f0d492', background: '#fdf7e8' } : { border: '1px solid #eceef4', background: '#f7f8fb' }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold flex items-center gap-2" style={{ color: '#2b3350' }}>
                      <Clock size={13} style={{ color: '#a7adc4' }} />{fmtDate(sh.StartTime)} · {fmtTime(sh.StartTime)}–{fmtTime(sh.EndTime)}
                    </div>
                    <span className="text-sm whitespace-nowrap" style={{ fontWeight: 800, padding: '4px 9px', borderRadius: 8, background: '#fdf0cf', color: '#8a6300' }}>₪{sh.HourlyRate}/ש'</span>
                  </div>
                  {sh.Instructions && <div className="text-xs mt-1" style={{ color: '#6b7290' }}>{sh.Instructions}</div>}
                  {done
                    ? <div className="text-xs mt-1 font-semibold" style={{ color: '#1f8f5f' }}>הושלמה{sh.TotalPay ? ` · ₪${sh.TotalPay}` : ''}</div>
                    : today
                      ? <button onClick={() => checkInShift(sh)} className="mt-2 w-full rounded-lg py-2 text-sm font-extrabold active:scale-[0.98] transition-transform" style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}>כנס למשמרת היום ›</button>
                      : <div className="text-xs mt-1" style={{ color: '#7a8199' }}>מתוכננת</div>}
                </div>
              );
            })}
            <p className="text-[11px] text-center" style={{ color: '#7a8199' }}>בתקופת הסטאז' העמלה שלך {(STAGE_WORKER_COMMISSION * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* ממתינים לאישור */}
      {pendingStages.map(s => (
        <div key={s.Id} className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-black" style={{ color: '#141a2e' }}>{s.RestaurantName}</span>
            <span className="text-xs font-semibold" style={{ color: '#7a8199' }}>{ROLE_LABELS[s.Role] || s.Role}</span>
          </div>
          <div className="inline-block" style={{ fontSize: 12, fontWeight: 800, padding: '5px 10px', borderRadius: 6, background: '#fdf0cf', color: '#8a6300' }}>ממתין לאישור המסעדה</div>
        </div>
      ))}

      {/* סטאז'ים זמינים (מודל ותיק — מוצג רק אם קיימים בפועל) */}
      {openStages.length > 0 && (
      <div className="space-y-2">
        <h3 className="font-black text-sm" style={{ color: '#141a2e' }}>סטאז'ים זמינים</h3>
        <p className="text-xs -mt-1" style={{ color: '#7a8199' }}>לסטודנטים מקורסי בישול/ברמנים — 3 שבועות של למידה בשטח.</p>
        {openStages.map(s => (
          <div key={s.Id} className="p-4" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-black" style={{ color: '#141a2e' }}>{s.RestaurantName}</span>
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#7a8199' }}>3 שבועות · {fmtDate(s.StartTime)}</span>
            </div>
            <div className="text-xs flex items-center gap-3 mb-2 font-semibold" style={{ color: '#6b7290' }}>
              <span>{ROLE_LABELS[s.Role] || s.Role}</span>
              {s.RestaurantCity && <span className="flex items-center gap-1"><MapPin size={12} style={{ color: '#a7adc4' }} />{s.RestaurantCity}</span>}
            </div>
            {s.Duties && <p className="text-xs mb-2" style={{ color: '#6b7290' }}>{s.Duties}</p>}
            <button onClick={() => applyStage(Number(s.Id))} disabled={busy === Number(s.Id)}
              className="w-full rounded-xl py-3 font-extrabold disabled:opacity-40 active:scale-[0.98] transition-transform"
              style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}>
              {busy === Number(s.Id) ? 'שולח...' : "הגש מועמדות לסטאז'"}
            </button>
          </div>
        ))}
      </div>
      )}

      {/* ═══ סטאז'ים שנגמרו — ארכיון מתקפל, תמיד בתחתית המסך ═══ */}
      {endedStages.length > 0 && (
        <div className="pt-1">
          <button onClick={toggleEnded}
            aria-expanded={showEnded}
            className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-2xl transition-colors active:bg-gray-100"
            style={{ background: '#f4f5f9', border: '1px solid #eceef4' }}>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0"
              style={{ border: '1px solid #eceef4' }}>
              <Archive size={15} style={{ color: '#7a8199' }} />
            </div>
            <span className="font-bold text-sm" style={{ color: '#2b3350' }}>סטאז'ים שנגמרו</span>
            <span className="text-[11px] font-bold bg-white rounded-full px-2 py-0.5"
              style={{ border: '1px solid #eceef4', color: '#7a8199' }}>{endedStages.length}</span>
            <ChevronDown size={17}
              className={`mr-auto transition-transform duration-200 ${showEnded ? 'rotate-180' : ''}`} style={{ color: '#7a8199' }} />
          </button>

          {showEnded && (
            <div className="space-y-2 mt-2 stagger-item">
              {loadingEnded && (
                <div className="text-center py-3">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}
              {endedStages.map(s => {
                const sum = endedSummary[Number(s.Id)];
                const badge = ENDED_LABEL[s.Status] || { text: 'הסתיים', cls: 'bg-[#fdf0cf] text-[#8a6300]' };
                return (
                  <div key={s.Id} className="p-4 opacity-90" style={{ background: '#fff', border: '1px solid #eceef4', borderRadius: 20, boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)' }}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="font-black" style={{ color: '#141a2e' }}>{s.RestaurantName}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#7a8199' }}>
                          {ROLE_LABELS[s.Role] || s.Role}
                          {s.RestaurantCity ? ` · ${s.RestaurantCity}` : ''}
                        </div>
                      </div>
                      <span className={`text-[11px] font-extrabold rounded-md px-2 py-1 whitespace-nowrap ${badge.cls}`}>{badge.text}</span>
                    </div>
                    <div className="text-xs flex items-center gap-1 mb-2" style={{ color: '#7a8199' }}>
                      <Calendar size={11} style={{ color: '#a7adc4' }} />{fmtDate(s.StartTime)} – {fmtDate(s.EndTime)}
                    </div>
                    {/* מה נסגר בסטאז' הזה */}
                    {sum ? (
                      <div className="flex gap-2">
                        <div className="flex-1 rounded-xl py-2 text-center" style={{ background: '#f4f5f9' }}>
                          <div className="font-black text-sm" style={{ color: '#141a2e' }}>{sum.shifts}</div>
                          <div className="text-[10px]" style={{ color: '#7a8199' }}>משמרות הושלמו</div>
                        </div>
                        <div className="flex-1 rounded-xl py-2 text-center" style={{ background: '#e4f7ee' }}>
                          <div className="font-black text-sm" style={{ color: '#1f8f5f' }}>₪{Math.round(sum.earned).toLocaleString()}</div>
                          <div className="text-[10px]" style={{ color: '#7a8199' }}>הרווחת</div>
                        </div>
                      </div>
                    ) : !loadingEnded && (
                      <div className="text-[11px] text-center py-1" style={{ color: '#c2c7da' }}>אין נתוני משמרות</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* צ'אט עם המסעדה (שרשור = מזהה הסטאז') */}
      {showChat && activeStage && (
        <ChatModal jobId={Number(activeStage.Id)} title={activeStage.RestaurantName || 'המסעדה'}
          myRole="worker" myName={userProfile?.Name || 'עובד'}
          onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};
