import React, { useState, useEffect } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StarRating } from '../common/StarRating';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';
import { NEW_WORKER_SHIFTS } from '../../utils/levels';

export const RestaurantEndShift: React.FC = () => {
  const { navToRestaurant, getSelectedJob, shiftStartTime, userProfile } = useApp();
  const job = getSelectedJob();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // דירוג מורחב לעובד חדש
  const [workerShifts, setWorkerShifts] = useState<number | null>(null);
  const [skillsAsClaimed, setSkillsAsClaimed] = useState('');
  const [wouldHireAgain, setWouldHireAgain] = useState('');

  // שלוף את מספר המשמרות של העובד כדי לדעת אם הוא "חדש" (3 ראשונות)
  useEffect(() => {
    const wid = job?.WorkerId;
    if (!wid) return;
    api.getWorker(wid)
      .then(w => { if (w) setWorkerShifts(Number(w.CompletedShifts) || 0); })
      .catch(() => {});
  }, [job?.WorkerId]);
  const isNew = workerShifts !== null && workerShifts <= NEW_WORKER_SHIFTS;

  const startTime = shiftStartTime || new Date(Date.now() - 5 * 3600000);
  const endTime = new Date();
  const hourlyRate = job ? Number(job.HourlyRate || job.hourlyRate || 0) : 0;
  // שעות בפועל (מוגבל למתוכנן) + הסכום המקורי שנקבע מראש
  const schedHours = job?.StartTime && job?.EndTime
    ? Math.max((new Date(job.EndTime).getTime() - new Date(job.StartTime).getTime()) / 3600000, 0)
    : 0;
  const rawHours = (endTime.getTime() - startTime.getTime()) / 3600000;
  const shiftHours = Math.max(Math.min(rawHours, schedHours || rawHours), 0.5);
  const baseAmount = shiftHours * hourlyRate;                    // עבודה בפועל
  const baseScheduled = (schedHours || shiftHours) * hourlyRate; // הסכום המקורי
  const restaurantCommission = baseScheduled * 0.065;           // עמלה על המקורי
  const totalCharged = (baseAmount + restaurantCommission).toFixed(0);
  const workerName = job?.WorkerName || 'העובד';
  const workerInit = workerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const walletBalance = userProfile?.WalletBalance || 0;

  const QUICK = ['עבודה מעולה!', 'מקצועי ומהיר', 'אשמח לקחת שוב', 'מדהים! 🔥', 'עבד קשה ומסור'];

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      if (job && userProfile?.Id) {
        const jobId = Number(job.Id || job.id);
        await api.sendRating(
          jobId,
          userProfile.UserId ?? userProfile.Id, // מזהה המשתמש (Users.Id) של המדרג
          job.WorkerId || 0,                    // יעד = Workers.Id
          rating,
          comment,
          'worker',                             // מסעדה מדרגת עובד
          isNew ? {                             // דירוג מורחב — רק לעובד חדש
            skillsAsClaimed: skillsAsClaimed || undefined,
            wouldHireAgain: wouldHireAgain || undefined,
          } : undefined
        );
      }
    } catch {
      // ממשיך גם אם נכשל
    }
    setSubmitted(true);
    setTimeout(() => navToRestaurant('home'), 2500);
  };

  if (submitted) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-4">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={56} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">המשמרת הסתיימה! 🎉</h2>
        <p className="text-gray-500">הדירוג נשלח · תשלום עובד</p>
        <div className="bg-amber-50 rounded-2xl px-8 py-4 w-full text-center">
          <div className="text-3xl font-black text-amber-600">₪{totalCharged}</div>
          <div className="text-gray-500 text-sm">חויב מהארנק שלך</div>
        </div>
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      <h2 className="text-xl font-black text-gray-900">סיכום משמרת</h2>

      {/* כרטיס עובד + סיכום */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">
            {workerInit}
          </div>
          <div>
            <div className="font-bold text-lg">{workerName}</div>
            <div className="text-gray-400 text-sm">
              {ROLE_LABELS[job?.Role] || job?.Role || 'עובד'} · {shiftHours.toFixed(1)} שעות
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-black text-xl">{shiftHours.toFixed(1)}</div>
            <div className="text-gray-400 text-xs">שעות</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-black text-xl">₪{hourlyRate}</div>
            <div className="text-gray-400 text-xs">לשעה</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-black text-xl text-green-400">₪{baseAmount.toFixed(0)}</div>
            <div className="text-gray-400 text-xs">לעובד</div>
          </div>
        </div>
      </div>

      {/* פירוט תשלום */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3">פירוט תשלום</h3>
        <div className="space-y-0">
          {[
            { label: `שכר בפועל (₪${hourlyRate} × ${shiftHours.toFixed(1)} ש׳)`, value: `₪${baseAmount.toFixed(0)}`, color: 'text-gray-800' },
            { label: `עמלת פלטפורמה (6.5% מ-₪${baseScheduled.toFixed(0)})`,        value: `₪${restaurantCommission.toFixed(0)}`, color: 'text-gray-800' },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm py-2 border-b border-gray-50">
              <span className="text-gray-500">{r.label}</span>
              <span className={`font-semibold ${r.color}`}>{r.value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3">
            <span className="font-bold text-gray-900">סה״כ חיוב</span>
            <span className="font-black text-amber-500 text-lg">₪{totalCharged}</span>
          </div>
        </div>
        <div className="mt-3 bg-amber-50 rounded-xl p-3 flex justify-between items-center">
          <span className="text-gray-500 text-sm">יתרה לאחר תשלום</span>
          <span className="font-bold text-amber-500">
            ₪{Math.max(walletBalance - parseFloat(totalCharged), 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* דירוג עובד */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-1">דרג את {workerName}</h3>
        <p className="text-gray-400 text-xs mb-3">הדירוג משפיע על הנראות של העובד בפלטפורמה</p>
        <StarRating value={rating} onChange={setRating} size={36} />
        {rating > 0 && (
          <div className="text-center text-sm font-semibold text-gray-600 mt-2">
            {['', '😕 לא טוב', '😐 ממוצע', '🙂 טוב', '😊 מצוין', '🔥 מדהים!'][rating]}
          </div>
        )}
        <div className="flex gap-2 flex-wrap mt-3">
          {QUICK.map(c => (
            <button key={c} onClick={() => setComment(comment === c ? '' : c)}
              className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
                comment === c ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="הוסף תגובה (אופציונלי)..."
          rows={2}
          className="w-full mt-3 border border-gray-200 rounded-xl p-3 text-sm text-right resize-none focus:border-amber-400 outline-none"
        />
      </div>

      {/* דירוג מורחב — רק לעובד חדש (3 משמרות ראשונות) */}
      {isNew && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={15} className="text-blue-500 fill-blue-500" />
            <h3 className="font-bold text-blue-800 text-sm">עובד חדש — עזור לנו לוודא שהוא אמין</h3>
          </div>
          <p className="text-blue-600 text-xs mb-3">התשובות עוזרות לסנן מי שלא באמת יודע את העבודה (אופציונלי)</p>

          {/* האם התמחה במה שהצהיר */}
          <div className="mb-3">
            <div className="text-sm font-semibold text-gray-700 mb-1.5">האם התמחה במה שהצהיר?</div>
            <div className="flex gap-2">
              {[{ k:'yes', l:'כן לגמרי' }, { k:'partial', l:'חלקית' }, { k:'no', l:'לא' }].map(o => (
                <button key={o.k} onClick={() => setSkillsAsClaimed(skillsAsClaimed === o.k ? '' : o.k)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    skillsAsClaimed === o.k ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* האם תזמין שוב */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-1.5">האם תזמין אותו שוב?</div>
            <div className="flex gap-2">
              {[{ k:'yes', l:'בהחלט' }, { k:'maybe', l:'אולי' }, { k:'no', l:'לא' }].map(o => (
                <button key={o.k} onClick={() => setWouldHireAgain(wouldHireAgain === o.k ? '' : o.k)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    wouldHireAgain === o.k ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40 active:scale-98 transition-transform shadow-lg shadow-amber-200"
      >
        {submitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            שולח...
          </div>
        ) : `אשר ודרג – שלם ₪${totalCharged}`}
      </button>

      <button onClick={() => navToRestaurant('home')} className="w-full text-gray-400 text-sm py-2">
        דלג על הדירוג
      </button>
    </div>
  );
};
