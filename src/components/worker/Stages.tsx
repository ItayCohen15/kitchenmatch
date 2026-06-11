import React, { useState, useEffect } from 'react';
import { GraduationCap, Send, MapPin, Clock, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { PARTNERSHIP_COMMISSION } from '../../utils/levels';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '';
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';

export const WorkerStages: React.FC = () => {
  const { userProfile, selectWorkerJob, navToWorker } = useApp();
  const wid = userProfile?.Id;
  const [offers, setOffers] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    if (!wid) return;
    const [off, stg, hist] = await Promise.all([
      api.getWorkerOffers(wid).catch(() => []),
      api.getStages().catch(() => []),
      api.getWorkerHistory(wid).catch(() => []),
    ]);
    setOffers(Array.isArray(off) ? off : []);
    setStages(Array.isArray(stg) ? stg : []);
    setMine((Array.isArray(hist) ? hist : []).filter((j: any) => j.JobType === 'stage'));
  };
  useEffect(() => { load(); }, [wid]);

  const applyStage = async (stageId: number) => {
    setBusy(stageId); setMsg('');
    try {
      await api.applyToJob(stageId, wid);
      setMsg('✅ מועמדות נשלחה! ממתין לאישור המסעדה');
      await load();
    } catch (e: any) { setMsg(e.message || 'שגיאה בהגשה'); }
    setBusy(null);
  };

  const acceptOffer = async (offer: any) => {
    setBusy(Number(offer.Id)); setMsg('');
    try {
      await api.acceptOffer(Number(offer.Id));
      selectWorkerJob(String(offer.Id), offer);
      navToWorker('navigation'); // ממשיך לזרימת הצ'ק-אין הרגילה
    } catch (e: any) { setMsg(e.message || 'ההצעה כבר טופלה'); setBusy(null); await load(); }
  };

  const appliedIds = new Set(mine.map(m => Number(m.Id)));
  const openStages = stages.filter(s => !appliedIds.has(Number(s.Id)));

  return (
    <div className="screen-enter space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-amber-500" size={22} />
        <h2 className="text-xl font-black text-gray-900">סטאז' והצעות</h2>
      </div>

      {msg && <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-2.5 text-center font-semibold">{msg}</div>}

      {/* ── הצעות ישירות ממסעדות קבועות ── */}
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

      {/* ── הסטאז'ים שלי ── */}
      {mine.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-gray-800 text-sm">הסטאז' שלי</h3>
          {mine.map(s => {
            const active = s.Status === 'confirmed' || s.Status === 'active';
            const pending = s.Status === 'pending_approval' || s.Status === 'matched' || s.Status === 'searching';
            const done = s.Status === 'completed';
            return (
              <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">{s.RestaurantName}</span>
                  <span className="text-xs text-gray-400">{fmtDate(s.StartTime)} – {fmtDate(s.EndTime)}</span>
                </div>
                <div className="text-gray-500 text-xs mb-2">{ROLE_LABELS[s.Role] || s.Role}</div>
                {active && <div className="text-xs font-semibold text-green-600 bg-green-50 rounded-lg px-3 py-2">🎓 סטאז' פעיל</div>}
                {pending && <div className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg px-3 py-2">⏳ ממתין לאישור המסעדה</div>}
                {done && <div className="text-xs font-semibold text-gray-500 bg-gray-50 rounded-lg px-3 py-2">✅ הסתיים</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── סטאז'ים זמינים ── */}
      <div className="space-y-2">
        <h3 className="font-bold text-gray-800 text-sm">סטאז'ים זמינים</h3>
        <p className="text-gray-400 text-xs -mt-1">מתאים במיוחד לסטודנטים מקורסי בישול/ברמנים — דרך מצוינת להיכנס למקצוע.</p>
        {openStages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-6">אין כרגע סטאז'ים פתוחים. בדוק שוב בקרוב.</div>
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
