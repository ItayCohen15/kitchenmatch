import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StarRating } from '../common/StarRating';
import { WORKERS } from '../../data/mockData';

export const RestaurantEndShift: React.FC = () => {
  const { navToRestaurant } = useApp();
  const worker = WORKERS[0];
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const shiftHours = 5;
  const totalPay = shiftHours * worker.hourlyRate;
  const commission = Math.round(totalPay * 0.12);
  const totalCharged = totalPay + commission;

  const QUICK_COMMENTS = ['עבודה מעולה!', 'מקצועי ומהיר', 'יגיע שוב', 'מדהים!'];

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => navToRestaurant('home'), 2000);
  };

  if (submitted) {
    return (
      <div className="screen-enter flex flex-col items-center justify-center min-h-[70vh] text-center gap-4">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">המשמרת הסתיימה!</h2>
        <p className="text-gray-500">הדירוג נשלח · התשלום עובד</p>
        <div className="bg-green-50 rounded-2xl px-8 py-4">
          <div className="text-3xl font-black text-green-600">₪{totalCharged}</div>
          <div className="text-gray-500 text-sm">חויב מהארנק</div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-enter space-y-4">
      <h2 className="text-xl font-black text-gray-900">סיכום משמרת</h2>

      {/* Shift summary */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl"
            style={{ backgroundColor: worker.avatarColor }}
          >
            {worker.initials}
          </div>
          <div>
            <div className="font-bold text-lg">{worker.name}</div>
            <div className="text-gray-400 text-sm">שף · 18:02 – 23:00</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-black text-xl">{shiftHours}</div>
            <div className="text-gray-400 text-xs">שעות</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-black text-xl">₪{worker.hourlyRate}</div>
            <div className="text-gray-400 text-xs">לשעה</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="font-black text-xl text-green-400">₪{totalPay}</div>
            <div className="text-gray-400 text-xs">לעובד</div>
          </div>
        </div>
      </div>

      {/* Payment breakdown */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3">פירוט תשלום</h3>
        <div className="space-y-2">
          {[
            { label: `שכר לשעה × ${shiftHours}`, value: `₪${totalPay}` },
            { label: 'עמלת פלטפורמה (12%)', value: `₪${commission}` },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
              <span className="text-gray-500">{r.label}</span>
              <span className="font-semibold text-gray-800">{r.value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1">
            <span className="font-bold text-gray-900">סה״כ</span>
            <span className="font-black text-orange-500 text-lg">₪{totalCharged}</span>
          </div>
        </div>
        <div className="mt-3 bg-orange-50 rounded-xl p-3 text-center">
          <span className="text-gray-600 text-sm">יחויב מארנק KitchenMatch · יתרה: </span>
          <span className="font-bold text-orange-500">₪3,711</span>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <h3 className="font-bold text-gray-800 mb-3">דרג את {worker.name}</h3>
        <StarRating value={rating} onChange={setRating} size={36} />
        {rating > 0 && (
          <div className="mt-3 text-center text-sm text-gray-500">
            {['', 'לא טוב', 'ממוצע', 'טוב', 'מצוין', 'מדהים! 🔥'][rating]}
          </div>
        )}

        <div className="flex gap-2 flex-wrap mt-3">
          {QUICK_COMMENTS.map(c => (
            <button
              key={c}
              onClick={() => setComment(c)}
              className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
                comment === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
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
        className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40 active:scale-98 transition-transform shadow-lg shadow-orange-200"
      >
        אשר תשלום ודרג
      </button>
    </div>
  );
};
