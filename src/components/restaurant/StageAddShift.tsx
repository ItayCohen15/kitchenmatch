import React, { useState, useEffect } from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { STAGE_RESTAURANT_COMMISSION } from '../../utils/levels';

const DEFAULTS_KEY = 'km_stage_shift_defaults';
const inputCls = 'w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-right outline-none focus:border-[#5354d3] focus:bg-white text-gray-900';

// דף קביעת/עריכת משמרת סטאז' — נכנסים אליו מדף הלוז
export const StageAddShift: React.FC = () => {
  const { navToRestaurant, getSelectedJob } = useApp();
  const stage = getSelectedJob();

  // עריכה? נטען מהלוז דרך localStorage (חד-פעמי)
  const [editShift] = useState<any | null>(() => {
    try {
      const raw = localStorage.getItem('km_stage_edit_shift');
      localStorage.removeItem('km_stage_edit_shift');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const saved = (() => { try { return JSON.parse(localStorage.getItem(DEFAULTS_KEY) || '{}'); } catch { return {}; } })();
  const pad = (n: number) => String(n).padStart(2, '0');
  const init = (() => {
    if (editShift) {
      const d = new Date(editShift.StartTime), e = new Date(editShift.EndTime);
      return {
        date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        start: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
        end: `${pad(e.getHours())}:${pad(e.getMinutes())}`,
        rate: String(editShift.HourlyRate ?? ''),
        instructions: editShift.Instructions || '',
      };
    }
    return { date: '', start: saved.start || '', end: saved.end || '', rate: saved.rate || '', instructions: '' };
  })();

  const [date, setDate] = useState(init.date);
  const [start, setStart] = useState(init.start);
  const [end, setEnd] = useState(init.end);
  const [rate, setRate] = useState(init.rate);
  const [instructions, setInstructions] = useState(init.instructions);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const workerName = stage?.WorkerName || 'העובד';

  // אין סטאז' נבחר — חזרה
  useEffect(() => {
    if (!stage || stage.JobType !== 'stage') navToRestaurant('stages');
  }, [stage?.Id]);

  const save = async () => {
    if (!date || !start || !end || !rate) { setErr('מלא תאריך, שעות ושכר'); return; }
    if (Number(rate) < 40) { setErr('שכר המינימום הוא ₪40 לשעה'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        startTime: new Date(`${date}T${start}:00`).toISOString(),
        endTime: new Date(`${date}T${end}:00`).toISOString(),
        hourlyRate: Number(rate),
        instructions,
      };
      if (editShift) await api.editStageShift(Number(editShift.Id), payload);
      else await api.createStageShift({ stageId: Number(stage.Id), ...payload });
      // שמור שעות+שכר כברירת מחדל — בפעם הבאה משנים רק תאריך
      try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ start, end, rate })); } catch {}
      navToRestaurant('stage_schedule');
    } catch (e: any) { setErr(e.message || 'שגיאה בשמירה'); setSaving(false); }
  };

  if (!stage) return null;

  return (
    <div className="screen-enter space-y-4">
      {/* חזרה */}
      <button onClick={() => navToRestaurant('stage_schedule')} className="flex items-center gap-1 text-gray-400 text-sm font-semibold">
        <ChevronRight size={18} /> חזרה ללוז
      </button>

      {/* כותרת */}
      <div className="rounded-3xl p-4 text-white flex items-center gap-3"
        style={{ background: '#1b1e38' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(83,84,211,0.18)', border: '1px solid rgba(83,84,211,0.3)' }}>
          <Calendar className="text-[#5354d3]" size={20} />
        </div>
        <div>
          <div className="font-bold text-lg leading-tight">{editShift ? 'עריכת משמרת' : 'משמרת חדשה'}</div>
          <div className="text-xs" style={{ color: '#8899bb' }}>בלוז הסטאז' של {workerName}</div>
        </div>
      </div>

      {/* טופס */}
      <div className="bg-white rounded-2xl p-4 card-shadow space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">תאריך</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>
        {/* התחלה מימין, סיום משמאל */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">שעת התחלה</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
          </div>
          <div className="flex-1">
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">שעת סיום</label>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)} dir="ltr" className={inputCls + ' text-center'} />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">שכר לשעה (₪)</label>
          <input type="number" inputMode="numeric" value={rate} onChange={e => setRate(e.target.value)} placeholder="50" className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">הנחיות לעובד (אופציונלי)</label>
          <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={3}
            placeholder="לדוגמה: מגיעים בבגדי עבודה, מתחילים בתחנת הסלטים..."
            className={inputCls + ' resize-none text-sm'} />
        </div>

        <p className="text-amber-700 text-xs text-center bg-amber-50 rounded-xl py-2">
          בתקופת הסטאז' העמלה שלך {(STAGE_RESTAURANT_COMMISSION * 100).toFixed(1)}% בלבד
        </p>
        {err && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 text-center">{err}</div>}

        <button onClick={save} disabled={saving}
          className="w-full rounded-2xl py-4 font-bold disabled:opacity-40"
          style={{ background: editShift ? '#3b74d1' : '#5354d3', color: editShift ? '#ffffff' : '#ffffff' }}>
          {saving ? 'שומר...' : editShift ? 'שמור שינויים' : 'הוסף משמרת ללוז'}
        </button>
        {editShift && (
          <p className="text-gray-400 text-[11px] text-center">העובד יקבל התראה על העדכון</p>
        )}
      </div>
    </div>
  );
};
