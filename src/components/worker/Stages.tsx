import React, { useState, useEffect } from 'react';
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
  completed: { text: 'הושלם',  cls: 'bg-green-50 text-green-700' },
  cancelled: { text: 'בוטל',   cls: 'bg-red-50 text-red-600' },
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
  useEffect(() => { if (!wid) return; const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [wid]);

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
      <div className="rounded-3xl p-4 text-white flex items-center gap-3"
        style={{ background: '#1b1e38' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(83,84,211,0.18)', border: '1px solid rgba(83,84,211,0.3)' }}>
          <GraduationCap className="text-[#5354d3]" size={22} />
        </div>
        <div>
          <div className="font-bold text-lg leading-tight">סטאז׳ והצעות</div>
          <div className="text-xs" style={{ color: '#8899bb' }}>משמרת אחת להוכיח את עצמך · ללא עמלה</div>
        </div>
      </div>

      {msg && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-2.5 text-center font-semibold">{msg}</div>}

      {/* ══ הסטאז׳ים שלי ══ */}
      {activeTrials.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-gray-800 text-sm">הסטאז׳ שלי</h3>
          {activeTrials.map(t => {
            const waiting = ['pending_approval', 'matched'].includes(t.Status);
            const today = isToday(t.StartTime);
            return (
              <div key={t.Id} className="bg-white rounded-2xl p-4 card-shadow border-2 border-green-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">{t.RestaurantName}</span>
                  <span className="text-green-600 font-bold">₪{t.HourlyRate}/ש'</span>
                </div>
                <div className="text-gray-500 text-xs flex items-center gap-3 mb-2 flex-wrap">
                  <span>{ROLE_LABELS[t.Role] || t.Role}</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{fmtDate(t.StartTime)} · {fmtTime(t.StartTime)}–{fmtTime(t.EndTime)}</span>
                  {t.RestaurantCity && <span className="flex items-center gap-1"><MapPin size={12} />{t.RestaurantCity}</span>}
                </div>
                {waiting ? (
                  <div className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg px-3 py-2">ממתין לאישור המסעדה</div>
                ) : today ? (
                  <button onClick={() => openTrialShift(t)}
                    className="w-full rounded-2xl py-3 font-bold"
                    style={{ background: '#5354d3', color: '#ffffff' }}>
                    כנס למשמרת הסטאז׳ ›
                  </button>
                ) : (
                  <div className="text-xs font-semibold text-green-700 bg-green-50 rounded-lg px-3 py-2">
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
          <h3 className="font-bold text-gray-800 text-sm">משמרות סטאז׳ פתוחות</h3>
          <p className="text-gray-400 text-xs -mt-1">
            משמרת אחת שבה המסעדה מכירה אותך בעבודה — <b>בתשלום מלא וללא עמלה</b>. אהבו? אפשר להתקבל לעבודה.
          </p>
          {openTrials.length === 0 && (
            <div className="text-center py-8 bg-white rounded-2xl card-shadow">
              <Search size={26} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-medium">אין כרגע סטאז׳ים פתוחות בתחום שלך</p>
              <p className="text-gray-400 text-xs">נשלח לך התראה כשתיפתח אחת</p>
            </div>
          )}
          {openTrials.map(t => (
            <div key={t.Id} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900">{t.RestaurantName}</span>
                <span className="text-green-600 font-bold">₪{t.HourlyRate}/ש'</span>
              </div>
              <div className="text-gray-500 text-xs flex items-center gap-3 mb-2 flex-wrap">
                <span>{ROLE_LABELS[t.Role] || t.Role}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{fmtDate(t.StartTime)} · {fmtTime(t.StartTime)}–{fmtTime(t.EndTime)}</span>
                {t.RestaurantCity && <span className="flex items-center gap-1"><MapPin size={12} />{t.RestaurantCity}</span>}
              </div>
              {t.Duties && <p className="text-gray-500 text-xs mb-2">{t.Duties}</p>}
              <div className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5 mb-2">
                ללא עמלה — תקבל את השכר המלא
              </div>
              <button onClick={() => applyTrial(Number(t.Id))} disabled={busy === Number(t.Id)}
                className="w-full rounded-2xl py-3 font-bold disabled:opacity-40"
                style={{ background: '#5354d3', color: '#ffffff' }}>
                {busy === Number(t.Id) ? 'שולח...' : 'הגש מועמדות לסטאז׳'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* סטאז׳ים שהסתיימו */}
      {doneTrials.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-gray-800 text-sm">סטאז׳ים שהסתיימו</h3>
          {doneTrials.map(t => (
            <div key={t.Id} className="bg-white rounded-xl px-3.5 py-2.5 card-shadow flex items-center gap-2.5">
              <Check size={16} className="text-green-500 flex-shrink-0" />
              <span className="font-semibold text-gray-700 text-sm flex-1 truncate">{t.RestaurantName}</span>
              <span className="text-gray-400 text-xs flex-shrink-0">
                {fmtDate(t.StartTime)}{t.TotalPay ? ` · ₪${Math.round(Number(t.TotalPay))}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* הצעות ישירות */}
      {offers.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><Send size={15} className="text-[#5354d3]" /> הצעות ישירות בשבילך</h3>
          {offers.map(o => (
            <div key={o.Id} className="bg-white rounded-2xl p-4 card-shadow border-2 border-[#c7c7f5]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900">{o.RestaurantName}</span>
                <span className="text-[#5354d3] font-bold">₪{o.HourlyRate}/ש'</span>
              </div>
              <div className="text-gray-500 text-xs flex items-center gap-3 mb-2">
                <span>{ROLE_LABELS[o.Role] || o.Role}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{fmtDate(o.StartTime)} · {fmtTime(o.StartTime)}–{fmtTime(o.EndTime)}</span>
              </div>
              {o.Duties && <p className="text-gray-500 text-xs mb-2">{o.Duties}</p>}
              <button onClick={() => acceptOffer(o)} disabled={busy === Number(o.Id)}
                className="w-full rounded-2xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: '#5354d3', color: '#ffffff' }}>
                <Check size={16} /> {busy === Number(o.Id) ? 'מאשר...' : 'אשר וקבל משמרת'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* הסטאז' הפעיל שלי */}
      {activeStage && (
        <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
          {/* כותרת + פעולות קשר */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold"
                style={{ background: avatarTone(activeStage.RestaurantName).bg, color: avatarTone(activeStage.RestaurantName).fg }}>
                {(activeStage.RestaurantName || 'מ').slice(0, 2)}
              </div>
              <div>
                <div className="font-bold text-gray-900">{activeStage.RestaurantName}</div>
                <div className="text-gray-400 text-xs">{ROLE_LABELS[activeStage.Role] || activeStage.Role} · סטאז' פעיל</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowChat(true)}
                className="w-10 h-10 rounded-xl bg-[#ecebfd] border border-[#c7c7f5] text-[#5354d3] flex items-center justify-center" title="צ'אט עם המסעדה">
                <MessageCircle size={17} />
              </button>
              {activeStage.RestaurantPhone && (
                <a href={`tel:${activeStage.RestaurantPhone}`}
                  className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 text-green-600 flex items-center justify-center" title="התקשר למסעדה">
                  <Phone size={17} />
                </a>
              )}
            </div>
          </div>

          {/* התקדמות */}
          <div>
            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
              <span>התקדמות הסטאז'</span>
              <span>{left > 0 ? `עוד ${left} ימים` : 'הסתיימה התקופה'}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${stageProgress(activeStage)}%`, background: '#5354d3' }} />
            </div>
          </div>

          {/* משוב אחרון מהמסעדה */}
          {lastFeedback && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 space-y-2">
              {lastFeedback.ImprovementNote && (
                <div className="flex items-start gap-2">
                  <Lightbulb size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div><div className="text-xs font-bold text-blue-800">נקודות לשיפור</div><div className="text-blue-700 text-xs">{lastFeedback.ImprovementNote}</div></div>
                </div>
              )}
              {lastFeedback.NextShiftNote && (
                <div className="flex items-start gap-2">
                  <Calendar size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div><div className="text-xs font-bold text-blue-800">למשמרת הבאה</div><div className="text-blue-700 text-xs">{lastFeedback.NextShiftNote}</div></div>
                </div>
              )}
            </div>
          )}

          {/* לוז משמרות */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Calendar size={14} className="text-[#5354d3]" /> לוז המשמרות</div>
            {shifts.length === 0 && <div className="text-gray-400 text-xs bg-gray-50 rounded-xl p-3 text-center">המסעדה עוד לא קבעה משמרות — תקבל התראה כשתיקבע</div>}
            {shifts.map(sh => {
              const today = isToday(sh.StartTime);
              const done = sh.Status === 'completed';
              return (
                <div key={sh.Id} className={`rounded-xl p-3 border ${today && !done ? 'border-[#7b7cee] bg-[#ecebfd]' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Clock size={13} className="text-gray-400" />{fmtDate(sh.StartTime)} · {fmtTime(sh.StartTime)}–{fmtTime(sh.EndTime)}
                    </div>
                    <span className="text-[#5354d3] font-bold text-sm">₪{sh.HourlyRate}/ש'</span>
                  </div>
                  {sh.Instructions && <div className="text-gray-500 text-xs mt-1">{sh.Instructions}</div>}
                  {done
                    ? <div className="text-green-600 text-xs mt-1">הושלמה{sh.TotalPay ? ` · ₪${sh.TotalPay}` : ''}</div>
                    : today
                      ? <button onClick={() => checkInShift(sh)} className="mt-2 w-full rounded-lg py-2 text-sm font-bold" style={{ background: '#5354d3', color: '#ffffff' }}>כנס למשמרת היום ›</button>
                      : <div className="text-gray-400 text-xs mt-1">מתוכננת</div>}
                </div>
              );
            })}
            <p className="text-gray-400 text-[11px] text-center">בתקופת הסטאז' העמלה שלך {(STAGE_WORKER_COMMISSION * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* ממתינים לאישור */}
      {pendingStages.map(s => (
        <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-gray-900">{s.RestaurantName}</span>
            <span className="text-xs text-gray-400">{ROLE_LABELS[s.Role] || s.Role}</span>
          </div>
          <div className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg px-3 py-2">⏳ ממתין לאישור המסעדה</div>
        </div>
      ))}

      {/* סטאז'ים זמינים (מודל ותיק — מוצג רק אם קיימים בפועל) */}
      {openStages.length > 0 && (
      <div className="space-y-2">
        <h3 className="font-bold text-gray-800 text-sm">סטאז'ים זמינים</h3>
        <p className="text-gray-400 text-xs -mt-1">לסטודנטים מקורסי בישול/ברמנים — 3 שבועות של למידה בשטח.</p>
        {openStages.map(s => (
          <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-900">{s.RestaurantName}</span>
              <span className="text-xs text-gray-400">3 שבועות · {fmtDate(s.StartTime)}</span>
            </div>
            <div className="text-gray-500 text-xs flex items-center gap-3 mb-2">
              <span>{ROLE_LABELS[s.Role] || s.Role}</span>
              {s.RestaurantCity && <span className="flex items-center gap-1"><MapPin size={12} />{s.RestaurantCity}</span>}
            </div>
            {s.Duties && <p className="text-gray-500 text-xs mb-2">{s.Duties}</p>}
            <button onClick={() => applyStage(Number(s.Id))} disabled={busy === Number(s.Id)}
              className="w-full rounded-2xl py-3 font-bold disabled:opacity-40"
              style={{ background: '#5354d3', color: '#ffffff' }}>
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
            style={{ background: '#f8fafc', border: '1px solid #eef2f7' }}>
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0"
              style={{ border: '1px solid #e8edf3' }}>
              <Archive size={15} className="text-gray-400" />
            </div>
            <span className="font-bold text-gray-600 text-sm">סטאז'ים שנגמרו</span>
            <span className="text-[11px] font-bold text-gray-400 bg-white rounded-full px-2 py-0.5"
              style={{ border: '1px solid #e8edf3' }}>{endedStages.length}</span>
            <ChevronDown size={17}
              className={`text-gray-400 mr-auto transition-transform duration-200 ${showEnded ? 'rotate-180' : ''}`} />
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
                const badge = ENDED_LABEL[s.Status] || { text: 'הסתיים', cls: 'bg-gray-100 text-gray-500' };
                return (
                  <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow opacity-90">
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <div className="font-bold text-gray-700">{s.RestaurantName}</div>
                        <div className="text-gray-400 text-xs mt-0.5">
                          {ROLE_LABELS[s.Role] || s.Role}
                          {s.RestaurantCity ? ` · ${s.RestaurantCity}` : ''}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-1 ${badge.cls}`}>{badge.text}</span>
                    </div>
                    <div className="text-gray-400 text-xs flex items-center gap-1 mb-2">
                      <Calendar size={11} />{fmtDate(s.StartTime)} – {fmtDate(s.EndTime)}
                    </div>
                    {/* מה נסגר בסטאז' הזה */}
                    {sum ? (
                      <div className="flex gap-2">
                        <div className="flex-1 rounded-xl py-2 text-center" style={{ background: '#f8fafc' }}>
                          <div className="font-bold text-gray-700 text-sm">{sum.shifts}</div>
                          <div className="text-[10px] text-gray-400">משמרות הושלמו</div>
                        </div>
                        <div className="flex-1 rounded-xl py-2 text-center" style={{ background: '#f0fdf4' }}>
                          <div className="font-bold text-green-600 text-sm">₪{Math.round(sum.earned).toLocaleString()}</div>
                          <div className="text-[10px] text-gray-400">הרווחת</div>
                        </div>
                      </div>
                    ) : !loadingEnded && (
                      <div className="text-gray-300 text-[11px] text-center py-1">אין נתוני משמרות</div>
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
