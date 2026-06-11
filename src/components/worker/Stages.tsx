import React, { useState, useEffect } from 'react';
import { GraduationCap, Send, MapPin, Clock, Check, Calendar, Lightbulb } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS, visibleShiftRoles } from '../../utils/roles';
import { STAGE_WORKER_COMMISSION } from '../../utils/levels';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '';
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';
const isToday = (d?: string) => d ? new Date(d).toDateString() === new Date().toDateString() : false;

export const WorkerStages: React.FC = () => {
  const { userProfile, selectWorkerJob, navToWorker } = useApp();
  const wid = userProfile?.Id;
  const workerRole = userProfile?.Role || '';
  const allowedRoles = visibleShiftRoles(workerRole);

  const [offers, setOffers] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]); // לוז של הסטאז' הפעיל
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

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
    });
    navToWorker('navigation');
  };

  const appliedIds = new Set(mine.map(m => Number(m.Id)));
  // סטאז'ים זמינים — רק לתפקיד של העובד (טבח/ברמן), ושלא הוגשו
  const openStages = stages.filter(s => allowedRoles.includes(s.Role) && !appliedIds.has(Number(s.Id)));

  // המשוב האחרון מהמסעדה (מהמשמרת המושלמת האחרונה עם הערות)
  const lastFeedback = [...shifts].reverse().find(s => s.ImprovementNote || s.NextShiftNote);

  return (
    <div className="screen-enter space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-amber-500" size={22} />
        <h2 className="text-xl font-black text-gray-900">סטאז' והצעות</h2>
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
              {o.Duties && <p className="text-gray-500 text-xs mb-2">{o.Duties}</p>}
              <button onClick={() => acceptOffer(o)} disabled={busy === Number(o.Id)}
                className="w-full text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
                <Check size={16} /> {busy === Number(o.Id) ? 'מאשר...' : 'אשר וקבל משמרת'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* הסטאז' הפעיל שלי + לוז */}
      {activeStage && (
        <div className="space-y-2">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><Calendar size={15} className="text-amber-500" /> הסטאז' שלי — {activeStage.RestaurantName}</h3>

          {/* משוב אחרון מהמסעדה */}
          {lastFeedback && (lastFeedback.ImprovementNote || lastFeedback.NextShiftNote) && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 space-y-2">
              {lastFeedback.ImprovementNote && (
                <div className="flex items-start gap-2">
                  <Lightbulb size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div><div className="text-xs font-bold text-blue-800">במה להשתפר</div><div className="text-blue-700 text-xs">{lastFeedback.ImprovementNote}</div></div>
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

          {shifts.length === 0 && <div className="bg-white rounded-2xl p-4 text-center card-shadow text-gray-400 text-sm">המסעדה עוד לא קבעה משמרות בלוז.</div>}
          {shifts.map(sh => {
            const today = isToday(sh.StartTime);
            const done = sh.Status === 'completed';
            return (
              <div key={sh.Id} className={`rounded-2xl p-3 card-shadow border ${today && !done ? 'border-amber-300 bg-amber-50' : 'border-transparent bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={13} className="text-gray-400" />{fmtDate(sh.StartTime)} · {fmtTime(sh.StartTime)}–{fmtTime(sh.EndTime)}
                  </div>
                  <span className="text-amber-600 font-bold text-sm">₪{sh.HourlyRate}/ש'</span>
                </div>
                {done
                  ? <div className="text-green-600 text-xs mt-1">✅ הושלמה{sh.TotalPay ? ` · ₪${sh.TotalPay}` : ''}</div>
                  : today
                    ? <button onClick={() => checkInShift(sh)} className="mt-2 w-full text-white rounded-lg py-2 text-sm font-bold" style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>כנס למשמרת היום ›</button>
                    : <div className="text-gray-400 text-xs mt-1">מתוכננת</div>}
              </div>
            );
          })}
          <p className="text-gray-400 text-xs text-center">בתקופת הסטאז' העמלה שלך {(STAGE_WORKER_COMMISSION * 100).toFixed(1)}%</p>
        </div>
      )}

      {/* סטאז'ים ממתינים לאישור */}
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
        <p className="text-gray-400 text-xs -mt-1">מתאים לסטודנטים מקורסי בישול/ברמנים — דרך מצוינת להיכנס למקצוע.</p>
        {openStages.length === 0 && <div className="text-center text-gray-400 text-sm py-6">אין כרגע סטאז'ים פתוחים בתחום שלך. בדוק שוב בקרוב.</div>}
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
              className="w-full text-white rounded-2xl py-3 font-bold disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
              {busy === Number(s.Id) ? 'שולח...' : "הגש מועמדות לסטאז'"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
