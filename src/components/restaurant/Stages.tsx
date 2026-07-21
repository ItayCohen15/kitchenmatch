import React, { useState, useEffect } from 'react';
import { GraduationCap, Check, Star, Send, Users, Plus, X, Calendar, Phone, MessageCircle, Trash2, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { WORKER_ROLES } from '../../utils/roles';
import { ROLE_LABELS } from '../../data/mockData';
import { ChatModal } from '../common/ChatModal';

type Tab = 'mine' | 'post' | 'partners';

// סטאז' מיועד למקצועות שנלמדים בקורס: טבחים, ברמנים ובריסטות
const STAGE_ROLES = WORKER_ROLES.filter(r => ['line_cook', 'bartender', 'barista'].includes(r.key));

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) : '';
const daysLeft = (end?: string) => end ? Math.ceil((new Date(end).getTime() - Date.now()) / 86400000) : 0;
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

      {/* טאבים — הטופס נפתח רק מכפתור הפרסום */}
      {tab !== 'post' && (
        <div className="flex bg-gray-100 rounded-2xl p-1">
          {([['mine', "הסטאז'רים שלי"], ['partners', 'הקבועים שלי']] as [Tab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`relative flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === k ? 'bg-white text-gray-900 shadow' : 'text-gray-400'}`}>
              {l}
              {k === 'mine' && groupApplicants.length > 0 && (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      )}

      {msg && <div className="bg-amber-50 text-amber-700 text-sm rounded-xl px-4 py-2.5 text-center font-semibold">{msg}</div>}

      {/* ── פרסום סטאז' ── */}
      {tab === 'post' && (
        <>
        <button onClick={() => setTab('mine')} className="flex items-center gap-1 text-gray-400 text-sm font-semibold">
          <ChevronRight size={18} /> חזרה לסטאז'רים שלי
        </button>
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
            {posting ? 'מפרסם...' : "פרסם סטאז'"}
          </button>
        </div>
        </>
      )}

      {/* ── הסטאז'ים שלי ── */}
      {tab === 'mine' && (
        <div className="space-y-4">
          <button onClick={() => setTab('post')}
            className="w-full text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)', boxShadow: '0 4px 16px rgba(232,160,32,0.35)' }}>
            <Plus size={18} /> פרסם סטאז'
          </button>

          {visibleStages.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl card-shadow">
              <div className="text-4xl mb-2">🎓</div>
              <p className="text-gray-500 font-medium text-sm">אין עדיין סטאז'ים</p>
              <p className="text-gray-400 text-xs mt-0.5">פרסם מקום סטאז' כדי לקלוט מתלמד</p>
            </div>
          )}

          {/* ממתינים לאישורך — קודם, כי זה דורש פעולה */}
          {groupApplicants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> ממתינים לאישורך ({groupApplicants.length})
              </div>
              {groupApplicants.map(s => (
                <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow border border-blue-100 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-black">
                      {(s.WorkerName || 'מ').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{s.WorkerName || 'מועמד'}</div>
                      <div className="text-gray-400 text-xs">{ROLE_LABELS[s.Role] || s.Role} · {fmtDate(s.StartTime)}–{fmtDate(s.EndTime)}</div>
                    </div>
                    <button onClick={() => setCancelId(Number(s.Id))} title="בטל סטאז'"
                      className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {cancelId === Number(s.Id) ? (
                    <CancelConfirm onYes={() => doCancelStage(Number(s.Id))} onNo={() => setCancelId(null)} busy={cancelling} />
                  ) : (
                    <button onClick={() => approve(Number(s.Id))}
                      className="w-full bg-blue-500 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2">
                      <Check size={16} /> אשר את המועמד לסטאז'
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* סטאז' פעיל */}
          {groupActive.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-400">סטאז' פעיל ({groupActive.length})</div>
              {groupActive.map(s => {
                const left = daysLeft(s.EndTime);
                return (
                  <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
                          {(s.WorkerName || 'ע').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{s.WorkerName || 'העובד'}</div>
                          <div className="text-gray-400 text-xs">{ROLE_LABELS[s.Role] || s.Role} · עד {fmtDate(s.EndTime)}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-green-600 bg-green-50 rounded-full px-2.5 py-1">🎓 פעיל</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                        <span>התקדמות</span>
                        <span>{left > 0 ? `עוד ${left} ימים` : 'הסתיימה התקופה'}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${stageProgress(s)}%`, background: 'linear-gradient(90deg,#e8a020,#f0c050)' }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openSchedule(s)}
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
                  </div>
                );
              })}
            </div>
          )}

          {/* בחיפוש מתלמד */}
          {groupSearching.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-400">בחיפוש מתלמד ({groupSearching.length})</div>
              {groupSearching.map(s => (
                <div key={s.Id} className="bg-white rounded-2xl p-4 card-shadow space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">🔎</div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{ROLE_LABELS[s.Role] || s.Role}</div>
                      <div className="text-gray-400 text-xs">מתחיל {fmtDate(s.StartTime)} · 3 שבועות</div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 rounded-full px-2.5 py-1 flex-shrink-0">מחפש</span>
                    <button onClick={() => setCancelId(Number(s.Id))} title="בטל סטאז'"
                      className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center flex-shrink-0">
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
              <div className="text-xs font-bold text-gray-400">הסתיימו ({groupDone.length})</div>
              {groupDone.map(s => (
                <div key={s.Id} className="bg-white rounded-xl px-3.5 py-2.5 card-shadow flex items-center gap-2.5">
                  <span className="text-green-500">✅</span>
                  <span className="font-semibold text-gray-700 text-sm flex-1 truncate">{s.WorkerName || ROLE_LABELS[s.Role] || s.Role}</span>
                  <span className="text-gray-400 text-xs">{fmtDate(s.StartTime)}–{fmtDate(s.EndTime)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── העובדים הקבועים ── */}
      {tab === 'partners' && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
            <span className="text-amber-700 text-sm font-semibold">הצוות שגייסת דרך Staffly — הזמן אותם שוב בקלות 🎉</span>
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
            <h3 className="font-black text-gray-900 text-lg">לגייס את {keepJob.WorkerName || 'העובד'} לצוות?</h3>
            <p className="text-gray-500 text-sm">
              ייגבו <b>₪300</b> (דמי השמה חד-פעמיים). מכאן ההעסקה ישירה מולך כמעסיק — Staffly אינה צד ביחסי העבודה.
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
  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-2.5">
    <span className="text-red-600 text-xs font-semibold flex-1">לבטל את הסטאז'?</span>
    <button onClick={onYes} disabled={busy}
      className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50">
      {busy ? '...' : 'כן, בטל'}
    </button>
    <button onClick={onNo} className="bg-white border border-gray-200 text-gray-500 rounded-lg px-3 py-1.5 text-xs font-bold">לא</button>
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
        <p className="text-amber-700 text-xs text-center bg-amber-50 rounded-xl py-2">{partner.Name} בצוות שלך — הזמנה מהירה למשמרת בודדת 🎉</p>
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
