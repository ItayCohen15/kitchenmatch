import React, { useState } from 'react';
import { CheckCircle, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StarRating } from '../common/StarRating';
import { api } from '../../api';

export const WorkerEndShift: React.FC = () => {
  const { navToWorker, getSelectedJob, shiftStartTime, userProfile } = useApp();
  const job = getSelectedJob();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // חישוב שעות אמיתיות
  const startTime = shiftStartTime || new Date(Date.now() - 5 * 3600000);
  const endTime = new Date();
  const shiftHours = Math.max(((endTime.getTime() - startTime.getTime()) / 3600000), 0.5);
  const hourlyRate = job ? Number(job.HourlyRate || job.hourlyRate || 0) : 0;
  const grossPay = shiftHours * hourlyRate;
  const commission = grossPay * 0.065;
  const netPay = (grossPay - commission).toFixed(0);
  const restaurantName = job?.RestaurantName || job?.restaurantName || 'המסעדה';

  const QUICK = ['סרוויס מסודר', 'מטבח נקי', 'ניהול טוב', 'אחזור שוב!', 'תנאי עבודה טובים'];

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError('');
    try {
      if (job && userProfile?.Id) {
        const jobId = Number(job.Id || job.id);
        await api.sendRating(
          jobId,
          userProfile.Id,
          job.RestaurantId || 0,
          rating,
          comment
        );
      }
    } catch {
      // ממשיך גם אם הדירוג נכשל
    }
    setSubmitted(true);
    setTimeout(() => navToWorker('wallet'), 2500);
  };

  if (submitted) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-4">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={56} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">כל הכבוד! 🎉</h2>
        <p className="text-gray-500">המשמרת הסתיימה בהצלחה</p>
        <div className="bg-green-50 rounded-2xl px-10 py-5 w-full">
          <div className="text-4xl font-black text-green-600">₪{netPay}</div>
          <div className="text-gray-500 text-sm mt-1">מועבר לארנק שלך</div>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Wallet size={14} />
          <span>זמין לאחר אישור המסעדה</span>
        </div>
        <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      <h2 className="text-xl font-black text-gray-900">סיכום המשמרת</h2>

      {/* כרטיס הכנסה */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-500 text-white rounded-2xl p-5">
        <div className="text-green-100 text-sm mb-1">הרווחת היום</div>
        <div className="text-4xl font-black mb-4">₪{netPay}</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/15 rounded-xl p-3">
            <div className="font-black text-lg">{shiftHours.toFixed(1)}</div>
            <div className="text-green-100 text-xs">שעות</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <div className="font-black text-lg">₪{hourlyRate}</div>
            <div className="text-green-100 text-xs">/שעה</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <div className="font-black text-lg text-yellow-300">-6.5%</div>
            <div className="text-green-100 text-xs">עמלה</div>
          </div>
        </div>
      </div>

      {/* פירוט */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3">פירוט תשלום</h3>
        <div className="space-y-0">
          {[
            { label: `₪${hourlyRate} × ${shiftHours.toFixed(1)} שעות`,  value: `₪${grossPay.toFixed(0)}`,      color: 'text-gray-800' },
            { label: 'עמלת פלטפורמה (6.5%)',                            value: `-₪${commission.toFixed(0)}`,    color: 'text-red-500'  },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm py-2 border-b border-gray-50">
              <span className="text-gray-500">{r.label}</span>
              <span className={`font-semibold ${r.color}`}>{r.value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3">
            <span className="font-bold text-gray-900">סה״כ לארנק</span>
            <span className="font-black text-green-600 text-lg">₪{netPay}</span>
          </div>
        </div>
      </div>

      {/* דירוג מסעדה */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-1">דרג את {restaurantName}</h3>
        <p className="text-gray-400 text-xs mb-3">הדירוג שלך עוזר לעובדים אחרים</p>
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
                comment === c ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
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
          className="w-full mt-3 border border-gray-200 rounded-xl p-3 text-sm text-right resize-none focus:border-green-400 outline-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm text-center">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full bg-green-500 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40 active:scale-98 transition-transform shadow-lg shadow-green-200"
      >
        {submitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            שולח...
          </div>
        ) : `שלח דירוג וקבל ₪${netPay}`}
      </button>

      <button onClick={() => navToWorker('home')} className="w-full text-gray-400 text-sm py-2">
        דלג על הדירוג
      </button>
    </div>
  );
};
