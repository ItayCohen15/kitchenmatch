import React, { useState, useEffect } from 'react';
import { ChevronRight, Zap, Clock, Filter, Star, Calendar, ClipboardList, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import type { JobRole, ExperienceLevel } from '../../types';
import { shiftRolesForBusinessType, isEntryRole } from '../../utils/roles';
import { restaurantRate, EMERGENCY_WORKER_COMMISSION } from '../../utils/levels';

const EXPERIENCE: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'any',    label: 'כל הרמות', desc: 'לא משנה — כל ניסיון מתקבל' },
  { id: 'entry',  label: 'מתחיל',    desc: 'מתאים גם ללא ניסיון · עד שנתיים' },
  { id: 'mid',    label: 'בינוני',   desc: '2–5 שנות ניסיון' },
  { id: 'senior', label: 'מנוסה',    desc: '5+ שנות ניסיון' },
];

export const CreateJob: React.FC = () => {
  const { navToRestaurant, setEmergencyMode, isEmergencyMode, userProfile } = useApp();
  // התפקידים שאפשר לפרסם — מסוננים לפי סוג העסק (אולם אירועים בלי בריסטה/ניקיון וכו')
  const ROLES = shiftRolesForBusinessType(userProfile?.BusinessType)
    .map(r => ({ id: r.key as JobRole, label: r.label, desc: r.desc, entry: !!r.entry }));
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<JobRole | null>(null);
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [wage, setWage] = useState('75');
  const [experience, setExperience] = useState<ExperienceLevel>('any');
  const [emergency, setEmergency] = useState(isEmergencyMode); // נדלק אוטומטית בכניסה דרך כפתור חירום
  // אם נכנסים דרך כפתור חירום — ודא שהמתג דלוק
  useEffect(() => { if (isEmergencyMode) setEmergency(true); }, [isEmergencyMode]);
  // פילטרי חירום
  const [minRating, setMinRating] = useState(0);
  const [allowNewWorkers, setAllowNewWorkers] = useState(true);
  const [duties, setDuties] = useState('');
  const [instructions, setInstructions] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  const totalHours = (() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(1);
  })();

  const totalPay = (parseFloat(totalHours) * parseFloat(wage || '0')).toFixed(0);
  // עמלות לפי חירום: מסעדה 9% (אחרת 6.5%), עובד 5% (אחרת ~6.5%)
  const restCommRate = restaurantRate(emergency);
  const restCommPct = +(restCommRate * 100).toFixed(1);
  const workerSidePct = emergency ? +(EMERGENCY_WORKER_COMMISSION * 100).toFixed(1) : 6.5;

  const MIN_WAGE = 40;
  const wageNum = parseFloat(wage) || 0;
  const wageValid = wageNum >= MIN_WAGE;

  const handlePublish = async () => {
    if (!userProfile?.Id) {
      setPublishError('שגיאה: פרופיל מסעדה לא נמצא. נסה להתנתק ולהתחבר מחדש.');
      return;
    }
    if (!wageValid) {
      setPublishError(`שכר המינימום הוא ₪${MIN_WAGE} לשעה`);
      return;
    }
    setPublishing(true);
    setPublishError('');
    setEmergencyMode(emergency);
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startDate = new Date(`${shiftDate}T${startTime}:00`);
      const endDate   = new Date(`${shiftDate}T${endTime}:00`);
      if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);

      await api.createJob({
        restaurantId: userProfile.Id,
        role: role || 'line_cook',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        hourlyRate: parseFloat(wage),
        isEmergency: emergency,
        description: instructions,
        duties,
        experience,
        minRating: emergency ? minRating : 0,
        allowNewWorkers: emergency ? allowNewWorkers : true,
      });

      setTimeout(() => {
        navToRestaurant('worker_matching');
      }, 800);
    } catch (e: any) {
      setPublishing(false);
      setPublishError(e.message || 'שגיאה בפרסום המשמרת. נסה שוב.');
    }
  };

  const stepTitles = ['תפקיד', 'שעות', 'תגמול', 'פרסום'];

  const CARD: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #eceef4',
    borderRadius: 20,
    boxShadow: '0 1px 2px rgba(20,26,46,.04), 0 6px 20px -8px rgba(20,26,46,.10)',
  };

  return (
    <div className="screen-enter">
      {/* באנר מצב חירום — כשנכנסים דרך כפתור החירום */}
      {emergency && (
        <div className="mb-4 p-3 flex items-center gap-2 text-white"
          style={{ background: '#e5484d', borderRadius: 16 }}>
          <Zap size={18} className="fill-white" />
          <span className="font-bold text-sm">מצב חירום פעיל — עובד דרוש תוך 30 דקות</span>
        </div>
      )}
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {stepTitles.map((t, i) => (
          <div key={i} className="flex-1">
            <div className="h-1.5 rounded-full mb-1 transition-colors" style={{ background: i + 1 <= step ? '#5354d3' : '#eceef4' }} />
            <div className="text-xs text-center font-bold" style={{ color: i + 1 === step ? '#5354d3' : '#7a8199' }}>{t}</div>
          </div>
        ))}
      </div>

      {/* Step 1 – Role */}
      {step === 1 && (
        <div className="space-y-3 screen-enter">
          <h2 className="text-xl font-black" style={{ color: '#141a2e' }}>איזה תפקיד צריך?</h2>
          <p className="text-sm" style={{ color: '#7a8199' }}>בחר את התפקיד הנדרש לסרוויס</p>
          <div className="space-y-3 mt-4">
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); if (isEntryRole(r.id)) setExperience('entry'); }}
                className="w-full p-4 flex items-center gap-4 transition-all"
                style={{
                  borderRadius: 16,
                  background: role === r.id ? '#eceefb' : '#fff',
                  border: role === r.id ? '1px solid #5354d3' : '1px solid #eceef4',
                }}
              >
                <div className="text-right flex-1">
                  <div className="font-black flex items-center gap-1.5" style={{ color: '#141a2e' }}>
                    {r.label}
                    {r.entry && <span className="text-[10px] font-extrabold" style={{ background: '#e3f5ee', color: '#1f9d6b', padding: '2px 6px', borderRadius: 6 }}>מתאים ללא ניסיון</span>}
                  </div>
                  <div className="text-sm" style={{ color: '#7a8199' }}>{r.desc}</div>
                </div>
                <div className="mr-auto w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: role === r.id ? '#5354d3' : '#cbd0e0', background: role === r.id ? '#5354d3' : 'transparent' }}>
                  {role === r.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
          <button
            disabled={!role}
            onClick={() => setStep(2)}
            className="w-full rounded-2xl py-4 font-extrabold text-lg mt-4 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 transition-transform"
            style={{ background: '#5354d3', color: '#fff' }}
          >
            המשך
          </button>
        </div>
      )}

      {/* Step 2 – Times */}
      {step === 2 && (
        <div className="space-y-4 screen-enter">
          <h2 className="text-xl font-black" style={{ color: '#141a2e' }}>מתי המשמרת?</h2>
          <p className="text-sm" style={{ color: '#7a8199' }}>הגדר שעות התחלה וסיום</p>

          <div className="p-5 space-y-4" style={CARD}>
            {/* תאריך */}
            <div>
              <label className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#7a8199' }}><Calendar size={14} style={{ color: '#7a8199' }} /> תאריך המשמרת</label>
              <input
                type="date"
                value={shiftDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setShiftDate(e.target.value)}
                className="w-full rounded-xl py-3 px-4 font-semibold border border-[#eceef4] focus:border-[#5354d3] outline-none transition-colors"
                style={{ color: '#141a2e' }}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a8199' }}>שעת התחלה</label>
              <div className="relative">
                <Clock size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#7a8199' }} />
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full rounded-xl py-3 pr-10 pl-4 font-semibold text-right border border-[#eceef4] focus:border-[#5354d3] outline-none transition-colors"
                  style={{ color: '#141a2e' }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a8199' }}>שעת סיום</label>
              <div className="relative">
                <Clock size={18} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#7a8199' }} />
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full rounded-xl py-3 pr-10 pl-4 font-semibold text-right border border-[#eceef4] focus:border-[#5354d3] outline-none transition-colors"
                  style={{ color: '#141a2e' }}
                />
              </div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: '#eceefb' }}>
              <span className="font-black text-lg" style={{ color: '#5354d3' }}>{totalHours} שעות</span>
              <span className="text-sm" style={{ color: '#7a8199' }}> · סה״כ משמרת</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-shrink-0 rounded-2xl py-4 px-5 font-bold" style={{ background: '#f4f5f9', color: '#7a8199' }}>
              <ChevronRight size={20} />
            </button>
            <button onClick={() => setStep(3)} className="flex-1 rounded-2xl py-4 font-extrabold text-lg active:scale-98 transition-transform" style={{ background: '#5354d3', color: '#fff' }}>
              המשך
            </button>
          </div>
        </div>
      )}

      {/* Step 3 – Wage + Experience */}
      {step === 3 && (
        <div className="space-y-4 screen-enter">
          <h2 className="text-xl font-black" style={{ color: '#141a2e' }}>תגמול ורמת ניסיון</h2>

          <div className="p-5" style={CARD}>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a8199' }}>שכר לשעה (₪)</label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-lg" style={{ color: '#7a8199' }}>₪</span>
              <input
                type="number"
                value={wage}
                onChange={e => setWage(e.target.value)}
                className={`w-full border rounded-xl py-3 pr-10 pl-4 font-black text-2xl text-right focus:border-[#5354d3] outline-none transition-colors ${
                  wage && !wageValid ? 'border-[#e5484d]' : 'border-[#eceef4]'
                }`}
                style={{ color: '#141a2e' }}
                min={MIN_WAGE}
                max={300}
              />
            </div>
            {wage && !wageValid && (
              <div className="mt-2 rounded-xl px-3 py-2 text-sm text-center font-semibold" style={{ background: '#fdecec', color: '#e5484d' }}>
                שכר המינימום הוא ₪{MIN_WAGE} לשעה
              </div>
            )}
            <div className="flex gap-2 mt-3">
              {[55, 70, 85, 100].map(v => (
                <button
                  key={v}
                  onClick={() => setWage(String(v))}
                  className="flex-1 py-2 rounded-lg text-sm font-extrabold transition-colors"
                  style={wage === String(v) ? { background: '#f4b62c', color: '#3a2c00' } : { background: '#f4f5f9', color: '#7a8199' }}
                >
                  ₪{v}
                </button>
              ))}
            </div>
            {wage && (
              <div className="mt-3 rounded-xl p-3 text-center" style={{ background: '#fdf0cf' }}>
                <span className="font-black" style={{ color: '#8a6300' }}>₪{totalPay}</span>
                <span className="text-sm" style={{ color: '#7a8199' }}> סה״כ ({totalHours} ש׳ × ₪{wage})</span>
              </div>
            )}
          </div>

          <div className="p-5" style={CARD}>
            <label className="text-sm font-semibold mb-3 block" style={{ color: '#7a8199' }}>רמת ניסיון נדרשת</label>
            <div className="space-y-2">
              {EXPERIENCE.map(e => (
                <button
                  key={e.id}
                  onClick={() => setExperience(e.id)}
                  className="w-full p-3 rounded-xl flex items-center justify-between transition-all"
                  style={{
                    background: experience === e.id ? '#eceefb' : '#fff',
                    border: experience === e.id ? '1px solid #5354d3' : '1px solid #eceef4',
                  }}
                >
                  <span className="font-bold" style={{ color: '#141a2e' }}>{e.label}</span>
                  <span className="text-sm" style={{ color: '#7a8199' }}>{e.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-shrink-0 rounded-2xl py-4 px-5 font-bold" style={{ background: '#f4f5f9', color: '#7a8199' }}>
              <ChevronRight size={20} />
            </button>
            <button
              disabled={!experience || !wageValid}
              onClick={() => setStep(4)}
              className="flex-1 rounded-2xl py-4 font-extrabold text-lg disabled:opacity-40 active:scale-98 transition-transform"
              style={{ background: '#5354d3', color: '#fff' }}
            >
              המשך
            </button>
          </div>
        </div>
      )}

      {/* Step 4 – Summary + Publish */}
      {step === 4 && (
        <div className="space-y-4 screen-enter">
          <h2 className="text-xl font-black" style={{ color: '#141a2e' }}>סיכום ופרסום</h2>

          <div className="p-5 space-y-4" style={CARD}>
            {[
              { label: 'תפקיד', value: ROLES.find(r => r.id === role)?.label },
              { label: 'תאריך', value: new Date(shiftDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) },
              { label: 'שעות', value: `${startTime} – ${endTime} (${totalHours} ש׳)` },
              { label: 'שכר לשעה', value: `₪${wage}` },
              { label: 'סה״כ', value: `₪${totalPay}` },
              { label: 'ניסיון', value: EXPERIENCE.find(e => e.id === experience)?.label },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#eceef4' }}>
                <span className="text-sm" style={{ color: '#7a8199' }}>{r.label}</span>
                <span className="font-bold" style={{ color: '#141a2e' }}>{r.value}</span>
              </div>
            ))}

            <div className="rounded-xl p-3 space-y-1.5" style={{ background: '#eceefb' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#7a8199' }}>עמלה שלך ({restCommPct}%){emergency ? ' · חירום' : ''}</span>
                <span className="font-bold" style={{ color: '#5354d3' }}>+₪{(parseFloat(totalPay) * restCommRate).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-1.5" style={{ borderColor: '#d7d7f6' }}>
                <span style={{ color: '#2b3350' }}>סה״כ תשלם</span>
                <span style={{ color: '#5354d3' }}>₪{(parseFloat(totalPay) * (1 + restCommRate)).toFixed(0)}</span>
              </div>
              {/* מע"מ: הסכומים לפני מע"מ. שיעורו על שכר העובד תלוי במעמד
                  שלו (עוסק מורשה מחייב, עוסק פטור לא) — ולכן הסכום המדויק
                  ידוע רק אחרי שהעובד מאושר. העמלה תמיד חייבת במע"מ. */}
              <p className="text-xs text-center pt-1 border-t" style={{ color: '#7a8199', borderColor: '#d7d7f6' }}>
                הסכומים <b>אינם כוללים מע"מ</b> — יתווסף כדין
              </p>
              <p className="text-xs text-center" style={{ color: '#7a8199' }}>
                העובד ישלם {workerSidePct}% נוסף מצידו
              </p>
            </div>
          </div>

          {/* מהות המשמרת */}
          <div className="p-4" style={CARD}>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a8199' }}>
              מה כוללת המשמרת? <span className="font-normal" style={{ color: '#7a8199' }}>(אופציונלי)</span>
            </label>
            <textarea
              value={duties}
              onChange={e => setDuties(e.target.value)}
              placeholder={'לדוגמה: עמדת גריל — בעיקר המבורגרים וכבדי עוף. צפי לעומס בינוני. כולל ניקיון העמדה בסוף.'}
              rows={3}
              maxLength={500}
              className="w-full border border-[#eceef4] rounded-xl px-4 py-3 text-right text-sm focus:border-[#5354d3] outline-none resize-none transition-colors"
              style={{ color: '#141a2e' }}
            />
            {duties && (
              <div className="text-xs text-left mt-1" style={{ color: '#7a8199' }}>{duties.length}/500</div>
            )}
          </div>

          {/* הוראות הגעה */}
          <div className="p-4" style={CARD}>
            <label className="text-sm font-semibold mb-2 block" style={{ color: '#7a8199' }}>
              הוראות הגעה לעובד <span className="font-normal" style={{ color: '#7a8199' }}>(אופציונלי)</span>
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder={'לדוגמה: כניסה מאחורי הבניין, קומה 2, לבקש את דני במטבח'}
              rows={3}
              maxLength={300}
              className="w-full border border-[#eceef4] rounded-xl px-4 py-3 text-right text-sm focus:border-[#5354d3] outline-none resize-none transition-colors"
              style={{ color: '#141a2e' }}
            />
            {instructions && (
              <div className="text-xs text-left mt-1" style={{ color: '#7a8199' }}>{instructions.length}/300</div>
            )}
          </div>

          {/* Emergency toggle */}
          <button
            onClick={() => setEmergency(e => !e)}
            className="w-full rounded-2xl p-4 flex items-center gap-3 transition-all"
            style={emergency
              ? { background: '#e5484d', border: '1px solid #e5484d', color: '#fff' }
              : { background: '#fff', border: '1px solid #eceef4', color: '#2b3350' }}
          >
            <Zap size={22} className={emergency ? 'fill-white text-white' : ''} style={emergency ? undefined : { color: '#e5484d' }} />
            <div className="text-right flex-1">
              <div className="font-black">מצב חירום</div>
              <div className="text-sm" style={{ color: emergency ? 'rgba(255,255,255,.85)' : '#7a8199' }}>
                עובד תוך 30 דק׳ – דחיפות גבוהה לעובדים קרובים
              </div>
            </div>
            <div className="w-12 h-6 rounded-full transition-colors" style={{ background: emergency ? 'rgba(255,255,255,.3)' : '#e6e8f0' }}>
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${emergency ? '-translate-x-6' : ''}`} />
            </div>
          </button>

          {/* סינון מועמדים — רק למשמרת חירום */}
          {emergency && (
            <div className="p-4 space-y-4 screen-enter" style={CARD}>
              <div className="font-black text-sm flex items-center gap-1.5" style={{ color: '#141a2e' }}>
                <Filter size={15} style={{ color: '#e5484d' }} /> סינון מועמדים לחירום
              </div>

              {/* דירוג מינימלי */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: '#7a8199' }}>דירוג מינימלי נדרש</label>
                <div className="flex gap-1.5">
                  {[{ v:0, l:'הכל' }, { v:3, l:'3' }, { v:3.5, l:'3.5' }, { v:4, l:'4' }, { v:4.5, l:'4.5' }].map(o => (
                    <button key={o.v} type="button" onClick={() => setMinRating(o.v)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-0.5 transition-colors"
                      style={minRating === o.v
                        ? { background: '#5354d3', color: '#fff', borderColor: '#5354d3' }
                        : { background: '#fff', color: '#7a8199', borderColor: '#eceef4' }}>
                      {o.v > 0 && <Star size={10} className={minRating === o.v ? 'fill-white' : 'fill-amber-400 text-amber-400'} />}{o.l}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: '#7a8199' }}>המשמרת תוצע רק לעובדים מבוססים עם דירוג מעל הסף</p>
              </div>

              {/* עובדים חדשים */}
              <button type="button" onClick={() => setAllowNewWorkers(v => !v)}
                className="w-full flex items-center justify-between gap-3 text-right">
                <div>
                  <div className="font-black text-sm" style={{ color: '#141a2e' }}>הצע גם לעובדים חדשים</div>
                  <div className="text-xs" style={{ color: '#7a8199' }}>עובדים עם פחות מ-3 משמרות (תג "עובד חדש")</div>
                </div>
                <div className="w-12 h-6 rounded-full flex-shrink-0 transition-colors" style={{ background: allowNewWorkers ? '#1f9d6b' : '#cbd0e0' }}>
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${allowNewWorkers ? '-translate-x-6' : ''}`} />
                </div>
              </button>
            </div>
          )}

          {publishError && (
            <div className="text-sm rounded-xl px-4 py-3 text-center font-semibold" style={{ background: '#fdecec', border: '1px solid #f7c9ca', color: '#e5484d' }}>
              {publishError}
            </div>
          )}

          {publishing ? (
            <div className="rounded-2xl py-5 flex items-center justify-center gap-3" style={{ background: '#5354d3' }}>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white font-extrabold text-lg">מחפש עובדים...</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-shrink-0 rounded-2xl py-4 px-5 font-bold" style={{ background: '#f4f5f9', color: '#7a8199' }}>
                <ChevronRight size={20} />
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 rounded-2xl py-4 font-extrabold text-lg active:scale-98 transition-transform"
                style={{ background: '#f4b62c', color: '#3a2c00', boxShadow: '0 8px 20px -6px rgba(244,182,44,.5)' }}
              >
                {emergency ? 'פרסם משמרת חירום' : 'פרסם משמרת'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
