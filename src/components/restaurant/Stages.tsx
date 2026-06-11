import React, { useState, useEffect } from 'react';
import { GraduationCap, Check, Star, Send, Users, Plus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { WORKER_ROLES } from '../../utils/roles';
import { ROLE_LABELS } from '../../data/mockData';
import { PARTNERSHIP_COMMISSION } from '../../utils/levels';

type Tab = 'mine' | 'post' | 'partners';

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '';

export const RestaurantStages: React.FC = () => {
  const { navToRestaurant, userProfile, refreshProfile } = useApp();
  const rid = userProfile?.Id;
  const [tab, setTab] = useState<Tab>('mine');
  const [stages, setStages] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // טופס פרסום סטאז'
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duties, setDuties] = useState('');
  const [posting, setPosting] = useState(false);

  // אישור שמירת עובד (₪250)
  const [keepJob, setKeepJob] = useState<any | null>(null);
  const [keeping, setKeeping] = useState(false);

  // טופס משמרת ישירה לעובד קבוע
  const [directFor, setDirectFor] = useState<any | null>(null);

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

  const handlePost = async () => {
    if (!role || !startDate) { setMsg('בחר תפקיד ותאריך התחלה'); return; }
    setPosting(true); setMsg('');
    try {
      await api.createStage({
        restaurantId: rid, role, weeks: 3, duties,
        startTime: new Date(startDate + 'T09:00:00').toISOString(),
      });
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
      await load();
      await refreshProfile(); // הארנק חויב ב-₪250
      setTab('partners');
    } catch (e: any) { setMsg(e.message || 'שגיאה'); }
    setKeeping(false);
  };

  return (
    <div className="screen-enter space-y-4">
      {/* כותרת + חזרה */}
      <div className="flex items-center gap-2">
        <button onClick={() => navToRestaurant('home')} className="text-gray-400 font-bold text-2xl leading-none">›</button>
        <GraduationCap className="text-amber-500" size={22} />
        <h2 className="text-xl font-black text-gray-900">סטאז'רים</h2>
      </div>
      <p className="text-gray-500 text-sm -mt-2">קלוט מתלמדים מקורסי בישול/ברמנים, ואם תאהב — שמור אותם כעובדים קבועים בעמלה מופחתת.</p>

      {/* טאבים */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {([['mine', "הסטאז'ים שלי"], ['post', "פרסם סטאז'"], ['partners', 'עובדים קבועים']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === k ? 'bg-white text-gray-900 shadow' : 'text-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {msg && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 text-center">{msg}</div>}

      {/* ── פרסום סטאז' ── */}
      {tab === 'post' && (
        <div className="bg-white rounded-2xl p-4 card-shadow space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-2 block">תפקיד</label>
            <div className="grid grid-cols-2 gap-2">
              {WORKER_ROLES.map(r => (
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
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none text-gray-900" />
            <p className="text-gray-400 text-xs mt-1">משך הסטאז': 3 שבועות</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">מה המתלמד יעשה / ילמד?</label>
            <textarea value={duties} onChange={e => setDuties(e.target.value)} rows={3}
              placeholder="לדוגמה: עבודה לצד הטבח הראשי, הכנת מנות פתיחה, היכרות עם המטבח..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-right resize-none focus:border-amber-400 outline-none" />
          </div>
          <button onClick={handlePost} disabled={posting}
            className="w-full text-white rounded-2xl py-4 font-bold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
            {posting ? 'מפרסם...' : "פרסם מקום סטאז'"}
          </button>
        </div>
      )}

      {/* ── הסטאז'ים שלי ── */}
      {tab === 'mine' && (
        <div className="space-y-3">
          <button onClick={() => setTab('post')}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-amber-300 text-amber-600 rounded-2xl py-3 font-bold">
            <Plus size={18} /> פרסם מקום סטאז'
          </button>
          {stages.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">אין עדיין סטאז'ים. פרסם אחד כדי להתחיל.</div>
          )}
          {stages.map(s => {
            const isOpen = s.Status === 'searching';
            const isApplicant = s.Status === 'pending_approval' || s.Status === 'matched';
            const isActive = s.Status === 'confirmed' || s.Status === 'active';
            const isDone = s.Status === 'completed';
            return (
              <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-900">{ROLE_LABELS[s.Role] || s.Role}</span>
                  <span className="text-xs text-gray-400">{fmtDate(s.StartTime)} – {fmtDate(s.EndTime)}</span>
                </div>
                {s.Duties && <p className="text-gray-500 text-xs mb-2">{s.Duties}</p>}

                {isOpen && <div className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg px-3 py-2">🔎 מחפש מתלמדים — ממתין למועמדים</div>}

                {isApplicant && (
                  <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{s.WorkerName || 'מועמד'}</div>
                      <div className="text-blue-500 text-xs">הגיש מועמדות לסטאז'</div>
                    </div>
                    <button onClick={() => approve(Number(s.Id))}
                      className="bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-1">
                      <Check size={15} /> אשר
                    </button>
                  </div>
                )}

                {isActive && (
                  <div className="space-y-2">
                    <div className="bg-green-50 rounded-xl p-3">
                      <div className="font-bold text-gray-800 text-sm">{s.WorkerName || 'העובד'}</div>
                      <div className="text-green-600 text-xs">סטאז' פעיל 🎓</div>
                    </div>
                    <button onClick={() => setKeepJob(s)}
                      className="w-full text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
                      ⭐ שמור כעובד קבוע — ₪250
                    </button>
                  </div>
                )}

                {isDone && <div className="text-xs font-semibold text-gray-500 bg-gray-50 rounded-lg px-3 py-2">✅ הסתיים</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── עובדים קבועים (שותפים) ── */}
      {tab === 'partners' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
            <span className="text-amber-700 text-sm font-semibold">העובדים שלך בעמלה מופחתת — {(PARTNERSHIP_COMMISSION * 100).toFixed(1)}% בלבד 🎉</span>
          </div>
          {partners.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8 flex flex-col items-center gap-2">
              <Users size={28} className="text-gray-300" />
              אין עדיין עובדים קבועים. שמור מתלמד מסטאז' כדי להתחיל.
            </div>
          )}
          {partners.map(p => (
            <div key={p.WorkerId} className="bg-white rounded-2xl p-4 card-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
                    {(p.Name || 'ע').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{p.Name}</div>
                    <div className="text-gray-400 text-xs flex items-center gap-2">
                      <span>{ROLE_LABELS[p.Role] || p.Role}</span>
                      {p.Rating > 0 && <span className="flex items-center gap-0.5"><Star size={11} className="text-amber-400 fill-amber-400" />{Number(p.Rating).toFixed(1)}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setDirectFor(p)}
                  className="bg-amber-500 text-white rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-1">
                  <Send size={14} /> שלח משמרת
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── מודאל אישור שמירת עובד ── */}
      {keepJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center space-y-3">
            <div className="text-4xl">⭐</div>
            <h3 className="font-black text-gray-900 text-lg">לשמור את {keepJob.WorkerName || 'העובד'} כקבוע?</h3>
            <p className="text-gray-500 text-sm">
              ייגבו <b>₪250</b> מהארנק. מעכשיו תוכל לשלוח לו משמרות ישירות, ועמלת הפלטפורמה תרד ל-<b>{(PARTNERSHIP_COMMISSION * 100).toFixed(1)}%</b> לכל צד.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setKeepJob(null)} className="flex-1 bg-gray-100 text-gray-600 rounded-2xl py-3 font-bold">ביטול</button>
              <button onClick={doKeep} disabled={keeping}
                className="flex-1 text-white rounded-2xl py-3 font-bold disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
                {keeping ? '...' : 'כן, שמור (₪250)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── מודאל משמרת ישירה ── */}
      {directFor && (
        <DirectShiftModal
          partner={directFor}
          restaurantId={rid}
          onClose={() => setDirectFor(null)}
          onSent={() => { setDirectFor(null); setMsg('✅ ההצעה נשלחה לעובד'); }}
        />
      )}
    </div>
  );
};

// ── מודאל שליחת משמרת ישירה לעובד קבוע ──
const DirectShiftModal: React.FC<{ partner: any; restaurantId: number; onClose: () => void; onSent: () => void }> = ({ partner, restaurantId, onClose, onSent }) => {
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [rate, setRate] = useState('');
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
      onSent();
    } catch (e: any) { setErr(e.message || 'שגיאה'); setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-t-3xl p-6 w-full max-w-md space-y-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-lg">משמרת ל{partner.Name}</h3>
          <button onClick={onClose} className="text-gray-400"><X size={22} /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">תאריך</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right outline-none focus:border-amber-400" />
        </div>
        <div className="flex gap-2" dir="ltr">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block text-right">משעה</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-amber-400" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block text-right">עד שעה</label>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-amber-400" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">שכר לשעה (₪)</label>
          <input type="number" inputMode="numeric" value={rate} onChange={e => setRate(e.target.value)} placeholder="50" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">הערות (אופציונלי)</label>
          <input type="text" value={duties} onChange={e => setDuties(e.target.value)} placeholder="מה צריך לעשות במשמרת" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right outline-none focus:border-amber-400" />
        </div>
        <p className="text-amber-600 text-xs text-center">עמלה מופחתת {(PARTNERSHIP_COMMISSION * 100).toFixed(1)}% — כי {partner.Name} עובד קבוע שלך 🎉</p>
        {err && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 text-center">{err}</div>}
        <button onClick={send} disabled={sending}
          className="w-full text-white rounded-2xl py-4 font-bold disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}>
          {sending ? 'שולח...' : 'שלח הצעת משמרת'}
        </button>
      </div>
    </div>
  );
};
