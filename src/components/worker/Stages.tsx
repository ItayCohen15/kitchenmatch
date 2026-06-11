import React, { useState, useEffect } from 'react';
import { GraduationCap, Send, MapPin, Clock, Check, Calendar, Lightbulb, Phone, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS, visibleShiftRoles } from '../../utils/roles';
import { STAGE_WORKER_COMMISSION } from '../../utils/levels';
import { ChatModal } from '../common/ChatModal';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '';
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';
const isToday = (d?: string) => d ? new Date(d).toDateString() === new Date().toDateString() : false;
const daysLeft = (end?: string) => end ? Math.ceil((new Date(end).getTime() - Date.now()) / 86400000) : 0;
const stageProgress = (s: any) => {
  const st = new Date(s.StartTime).getTime(), en = new Date(s.EndTime).getTime();
  if (!st || !en || en <= st) return 0;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - st) / (en - st)) * 100)));
};

export const WorkerStages: React.FC = () => {
  const { userProfile, selectWorkerJob, navToWorker } = useApp();
  const wid = userProfile?.Id;
  const workerRole = userProfile?.Role || '';
  const allowedRoles = visibleShiftRoles(workerRole);

  const [offers, setOffers] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [showChat, setShowChat] = useState(false);

  const activeStage = mine.find(m => m.Status === 'confirmed' || m.Status === 'active');

  const load = async () => {
    if (!wid) return;
    const [off, stg, hist] = await Promise.all([
      api.getWorkerOffers(wid).catch(() => []),
      api.getStages().catch(() => []),
      api.getWorkerHistory(wid).catch(() => []),
    ]);
    setOffers(Array.isArray(off) ? off : []);
    setStages(Array.isArray(stg) ? stg : []);
    const myStages = (Array.isArray(hist) ? hist : []).filter((j: any) => j.JobType === 'stage');
    setMine(myStages);
    const act = myStages.find((m: any) => m.Status === 'confirmed' || m.Status === 'active');
    if (act) {
      const sh = await api.getStageShifts(Number(act.Id)).catch(() => []);
      setShifts(Array.isArray(sh) ? sh : []);
    } else setShifts([]);
  };
  useEffect(() => { load(); }, [wid]);
  useEffect(() => { if (!wid) return; const iv = setInterval(load, 8000); return () => clearInterval(iv); }, [wid]);

  const applyStage = async (stageId: number) => {
    setBusy(stageId); setMsg('');
    try { await api.applyToJob(stageId, wid); setMsg('✅ מועמדות נשלחה! ממתין לאישור המסעדה'); await load(); }
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
  const lastFeedback = [...shifts].reverse().find(s => s.ImprovementNote || s.NextShiftNote);
  const left = activeStage ? daysLeft(activeStage.EndTime) : 0;

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
          <div className="font-black text-lg leading-tight">סטאז' והצעות</div>
          <div className="text-xs" style={{ color: '#8899bb' }}>למד מקצוע בשטח · הפוך לעובד קבוע</div>
        </div>
      </div>

      {msg && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-2.5 text-center font-semibold">{msg}</div>}

      {/* הצעות ישירות */}
      {offers.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><Send size={15} className="text-amber-500" /> הצעות ישירות בשבילך</h3>
          {offers.map(o => (
            <div key={o.Id} className="bg-white rounded-2xl p-4 card-shadow border-2 border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900">{o.RestaurantName}</span>
                <span className="text-amber-600 font-black">₪{o.HourlyRate}/ש'</span>
              </div>
              <div className="text-gray-500 text-xs flex items-center gap-3 mb-2">
                <span>{ROLE_LABELS[o.Role] || o.Role}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{fmtDate(o.StartTime)} · {fmtTime(o.StartTime)}–{fmtTime(o.EndTime)}</span>
              </div>
              {o.Duties && <p className="text-gray-500 text-xs mb-2">📋 {o.Duties}</p>}
              <button onClick={() => acceptOffer(o)} disabled={busy === Number(o.Id)}
                className="w-full text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
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
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
                {(activeStage.RestaurantName || 'מ').slice(0, 2)}
              </div>
              <div>
                <div className="font-bold text-gray-900">{activeStage.RestaurantName}</div>
                <div className="text-gray-400 text-xs">{ROLE_LABELS[activeStage.Role] || activeStage.Role} · סטאז' פעיל 🎓</div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowChat(true)}
                className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center" title="צ'אט עם המסעדה">
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
              <div className="h-full rounded-full" style={{ width: `${stageProgress(activeStage)}%`, background: 'linear-gradient(90deg,#e8a020,#f0c050)' }} />
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
            <div className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Calendar size={14} className="text-amber-500" /> לוז המשמרות</div>
            {shifts.length === 0 && <div className="text-gray-400 text-xs bg-gray-50 rounded-xl p-3 text-center">המסעדה עוד לא קבעה משמרות — תקבל התראה כשתיקבע</div>}
            {shifts.map(sh => {
              const today = isToday(sh.StartTime);
              const done = sh.Status === 'completed';
              return (
                <div key={sh.Id} className={`rounded-xl p-3 border ${today && !done ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Clock size={13} className="text-gray-400" />{fmtDate(sh.StartTime)} · {fmtTime(sh.StartTime)}–{fmtTime(sh.EndTime)}
                    </div>
                    <span className="text-amber-600 font-bold text-sm">₪{sh.HourlyRate}/ש'</span>
                  </div>
                  {sh.Instructions && <div className="text-gray-500 text-xs mt-1">📋 {sh.Instructions}</div>}
                  {done
                    ? <div className="text-green-600 text-xs mt-1">✅ הושלמה{sh.TotalPay ? ` · ₪${sh.TotalPay}` : ''}</div>
                    : today
                      ? <button onClick={() => checkInShift(sh)} className="mt-2 w-full text-white rounded-lg py-2 text-sm font-bold" style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>כנס למשמרת היום ›</button>
                      : <div className="text-gray-400 text-xs mt-1">מתוכננת</div>}
                </div>
              );
            })}
            <p className="text-gray-400 text-[11px] text-center">בתקופת הסטאז' העמלה שלך {(STAGE_WORKER_COMMISSION * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* ממתינים לאישור */}
      {mine.filter(m => ['pending_approval', 'matched', 'searching'].includes(m.Status)).map(s => (
        <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-gray-900">{s.RestaurantName}</span>
            <span className="text-xs text-gray-400">{ROLE_LABELS[s.Role] || s.Role}</span>
          </div>
          <div className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg px-3 py-2">⏳ ממתין לאישור המסעדה</div>
        </div>
      ))}

      {/* סטאז'ים זמינים */}
      <div className="space-y-2">
        <h3 className="font-bold text-gray-800 text-sm">סטאז'ים זמינים</h3>
        <p className="text-gray-400 text-xs -mt-1">לסטודנטים מקורסי בישול/ברמנים — 3 שבועות של למידה בשטח.</p>
        {openStages.length === 0 && (
          <div className="text-center py-8 bg-white rounded-2xl card-shadow">
            <div className="text-3xl mb-2">🔎</div>
            <p className="text-gray-500 text-sm font-medium">אין כרגע סטאז'ים פתוחים בתחום שלך</p>
            <p className="text-gray-400 text-xs">בדוק שוב בקרוב</p>
          </div>
        )}
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
            {s.Duties && <p className="text-gray-500 text-xs mb-2">📋 {s.Duties}</p>}
            <button onClick={() => applyStage(Number(s.Id))} disabled={busy === Number(s.Id)}
              className="w-full text-white rounded-2xl py-3 font-bold disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
              {busy === Number(s.Id) ? 'שולח...' : "הגש מועמדות לסטאז'"}
            </button>
          </div>
        ))}
      </div>

      {/* צ'אט עם המסעדה (שרשור = מזהה הסטאז') */}
      {showChat && activeStage && (
        <ChatModal jobId={Number(activeStage.Id)} title={activeStage.RestaurantName || 'המסעדה'}
          myRole="worker" myName={userProfile?.Name || 'עובד'}
          onClose={() => setShowChat(false)} />
      )}
    </div>
  );
};
