import React, { useState } from 'react';
import { CheckCircle, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StarRating } from '../common/StarRating';
import { NEARBY_JOBS } from '../../data/mockData';

export const WorkerEndShift: React.FC = () => {
  const { navToWorker, getSelectedJob } = useApp();
  const job = getSelectedJob() || NEARBY_JOBS[0];
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const shiftHours = 5;
  const grossPay = shiftHours * job.hourlyRate;
  const commission = Math.round(grossPay * 0.10);
  const netPay = grossPay - commission;

  const QUICK = ['סרוויס מסודר', 'מטבח נקי', 'ניהול טוב', 'אשוב שוב!'];

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => navToWorker('wallet'), 2200);
  };

  if (submitted) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">כל הכבוד!</h2>
        <p className="text-gray-500">המשמרת הסתיימה בהצלחה</p>
        <div className="bg-green-50 rounded-2xl px-10 py-5">
          <div className="text-4xl font-black text-green-600">₪{netPay}</div>
          <div className="text-gray-500 text-sm mt-1">מועבר לארנק שלך</div>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Wallet size={14} />
          <span>זמין תוך 24 שעות</span>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      <h2 className="text-xl font-black text-gray-900">סיכום המשמרת</h2>

      {/* Earnings card */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-500 text-white rounded-2xl p-5">
        <div className="text-green-100 text-sm mb-1">הרווחת היום</div>
        <div className="text-4xl font-black mb-4">₪{netPay}</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/15 rounded-xl p-3">
            <div className="font-black text-lg">{shiftHours}</div>
            <div className="text-green-100 text-xs">שעות</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <div className="font-black text-lg">₪{job.hourlyRate}</div>
            <div className="text-green-100 text-xs">/שעה</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3">
            <div className="font-black text-lg text-yellow-300">×0.9</div>
            <div className="text-green-100 text-xs">אחרי 10%</div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3">פירוט</h3>
        <div className="space-y-2">
          {[
            { label: `₪${job.hourlyRate} × ${shiftHours} שעות`, value: `₪${grossPay}` },
            { label: 'עמלת פלטפורמה (10%)', value: `-₪${commission}` },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
              <span className="text-gray-500">{r.label}</span>
              <span className={`font-semibold ${r.value.startsWith('-') ? 'text-red-500' : 'text-gray-800'}`}>{r.value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1">
            <span className="font-bold text-gray-900">סה״כ לארנק</span>
            <span className="font-black text-green-600 text-lg">₪{netPay}</span>
          </div>
        </div>
      </div>

      {/* Rate restaurant */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3">דרג את {job.restaurantName}</h3>
        <StarRating value={rating} onChange={setRating} size={34} />
        {rating > 0 && (
          <div className="text-center text-sm text-gray-500 mt-2">
            {['', 'לא טוב', 'ממוצע', 'טוב', 'מצוין', 'מדהים! 🔥'][rating]}
          </div>
        )}
        <div className="flex gap-2 flex-wrap mt-3">
          {QUICK.map(c => (
            <button
              key={c}
              onClick={() => setComment(c)}
              className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
                comment === c ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="הוסף תגובה (אופציונלי)..."
          rows={2}
          className="w-full mt-3 border border-gray-200 rounded-xl p-3 text-sm text-right resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className="w-full bg-green-500 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40 active:scale-98 transition-transform shadow-lg shadow-green-200"
      >
        אשר ודרג – קבל ₪{netPay}
      </button>
    </div>
  );
};
