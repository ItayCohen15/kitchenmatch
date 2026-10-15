import React, { useState, useEffect } from 'react';
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

  // חישוב לפי זמן עבודה בפועל (מוגבל לשעות שנקבעו מראש)
  // שלוף את המשמרת המעודכנת מהשרת — לתפוס IsEmergency והסכום בפועל
  const [freshJob, setFreshJob] = useState<any>(null);
  useEffect(() => {
    if (!userProfile?.Id || !job) return;
    const jid = Number(job.Id || job.id);
    api.getWorkerHistory(userProfile.Id)
      .then((list: any[]) => {
        const f = Array.isArray(list) ? list.find((x: any) => Number(x.Id) === jid) : null;
        if (f) setFreshJob(f);
      })
      .catch(() => {});
  }, [userProfile?.Id]);

  const j = freshJob || job;
  const hourlyRate = Number(j?.HourlyRate || j?.hourlyRate || 0);
  const schedHours = j?.StartTime && j?.EndTime
    ? Math.max((new Date(j.EndTime).getTime() - new Date(j.StartTime).getTime()) / 3600000, 0)
    : 0;
  // הערכת שעות: אם אין חותמת התחלה (כניסה מחדש) — לפי המתוכנן, לא ברירת-מחדל
  // מומצאת של 5 שעות. העדפה תמיד לסכום מהשרת (TotalPay) כשקיים.
  const estHours = shiftStartTime
    ? Math.max(Math.min((Date.now() - shiftStartTime.getTime()) / 3600000, schedHours || 99), 0.5)
    : (schedHours || 0);
  const grossPay = (freshJob && freshJob.TotalPay != null) ? Number(freshJob.TotalPay) : estHours * hourlyRate;
  const shiftHours = hourlyRate > 0 ? grossPay / hourlyRate : 0;
  // מודל חדש: אין עמלת עובד — הנטו = מלוא השכר.
  const netPay = grossPay.toFixed(0);
  const restaurantName = job?.RestaurantName || job?.restaurantName || 'המסעדה';

  const QUICK = ['סרוויס מסודר', 'מטבח נקי', 'ניהול טוב', 'אחזור שוב', 'תנאי עבודה טובים'];

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      if (job && userProfile?.Id) {
        const jobId = Number(job.Id || job.id);
        await api.sendRating(
          jobId,
          userProfile.UserId ?? userProfile.Id, // מזהה המשתמש (Users.Id) של המדרג
          job.RestaurantId || 0,                // יעד = Restaurants.Id
          rating,
          comment,
          'restaurant'                          // עובד מדרג מסעדה
        );
      }
      setSubmitted(true);
      setTimeout(() => navToWorker('wallet'), 2500);
    } catch {
      // קודם הכשל נבלע וה"הצלחה" הוצגה בכל מקרה — דירוגים אבדו בשקט.
      setError('הדירוג לא נשלח — נסה שוב. (התשלום שלך בדרך, ללא קשר לדירוג.)');
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4 px-4">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={56} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">המשמרת הסתיימה</h2>
        <p className="text-gray-500">תודה על העבודה. נתראה במשמרת הבאה.</p>
        <div className="bg-green-50 rounded-2xl px-10 py-5 w-full">
          <div className="text-4xl font-bold text-green-600">₪{netPay}</div>
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
      <h2 className="text-xl font-bold text-gray-900">סיכום המשמרת</h2>

      {/* כרטיס הכנסה */}
      <div className="text-white rounded-2xl p-5" style={{ background: '#1f9d6b' }}>
        <div className="text-green-100 text-sm mb-1">הרווחת היום</div>
        <div className="text-4xl font-bold mb-4">₪{netPay}</div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/15 rounded-xl p-3">
            <div className="font-bold text-lg">{shiftHours.toFixed(1)}</div>
            <div className="text-green-100 text-xs">שעות</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <div className="font-bold text-lg">₪{hourlyRate}</div>
            <div className="text-green-100 text-xs">/שעה</div>
          </div>
        </div>
      </div>

      {/* פירוט */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3">פירוט תשלום</h3>
        <div className="flex justify-between text-sm py-2 border-b border-gray-50">
          <span className="text-gray-500">₪{hourlyRate} × {shiftHours.toFixed(1)} שעות</span>
          <span className="font-semibold text-gray-800">₪{grossPay.toFixed(0)}</span>
        </div>
        <div className="flex justify-between pt-3">
          <span className="font-bold text-gray-900">סה״כ לארנק</span>
          <span className="font-bold text-green-600 text-lg">₪{netPay}</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
          ללא עמלת עובד — מקבל/ת את מלוא השכר. ניכויי מס/ביטוח לאומי מתבצעים ע"י שירות עצמאי-שכיר.
        </p>
      </div>

      {/* דירוג מסעדה */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-1">דרג את {restaurantName}</h3>
        <p className="text-gray-400 text-xs mb-3">הדירוג שלך עוזר לעובדים אחרים</p>
        <StarRating value={rating} onChange={setRating} size={36} />
        {rating > 0 && (
          <div className="text-center text-sm font-semibold text-gray-600 mt-2">
            {['', 'לא טוב', 'בסדר', 'טוב', 'טוב מאוד', 'מצוין'][rating]}
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
        className="w-full bg-green-500 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40 active:scale-[0.98] transition-transform shadow-lg"
      >
        {submitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            שולח...
          </div>
        ) : 'שלח דירוג'}
      </button>

      <button onClick={() => navToWorker('wallet')} className="w-full text-gray-400 text-sm py-2">
        דלג על הדירוג
      </button>
      <p className="text-center text-[11px] text-gray-400 -mt-1">התשלום מועבר לארנק ללא קשר לדירוג.</p>
    </div>
  );
};
