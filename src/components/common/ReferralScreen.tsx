import React, { useEffect, useState } from 'react';
import { Gift, Copy, Check, Users, CheckCircle2, Star, Ticket, Percent, Clock } from 'lucide-react';
import { api } from '../../api';

/** מסך "חבר מביא חבר" — מותאם לתפקיד (עובד / מסעדה). */
export const ReferralScreen: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getReferral().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!data || !data.code) {
    return <p className="text-center text-gray-400 text-sm py-12">לא ניתן לטעון את תוכנית ההפניות כרגע.</p>;
  }

  const isWorker = data.role === 'worker';
  const link: string = data.link || '';
  const code: string = data.code || '';
  const shareText = isWorker
    ? `הצטרפו אליי ל-Staffly ותמצאו משמרות בקלות. הרשמה דרך הקישור: ${link}`
    : `הצטרפו ל-Staffly ותאיישו משמרות אקסטרה בקלות. הרשמה דרך הקישור: ${link}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* חלק מהדפדפנים חוסמים — המשתמש יכול לבחור ידנית */ }
  };

  const reducedPct = Math.round((Number(data.reducedRate) || 0.03) * 1000) / 10;
  const endDate = data.reducedUntil ? new Date(data.reducedUntil).toLocaleDateString('he-IL') : null;

  return (
    <div className="space-y-4 pb-4">
      {/* כותרת + הסבר קצר */}
      <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#0d1420,#1a2744)' }}>
        <div className="flex items-center gap-2">
          <Gift size={20} className="text-amber-400" />
          <h2 className="font-black text-lg">חבר מביא חבר</h2>
        </div>
        <p className="text-gray-300 text-sm mt-1 leading-relaxed">
          {isWorker
            ? 'הזמינו עובדים לפלטפורמה. כשמי שהזמנתם מתחיל לעבוד — אתם מרוויחים משמרת ללא עמלה.'
            : 'הזמינו מסעדות לפלטפורמה. כשמי שהזמנתם מתחילות לעבוד — אתם מקבלים חודש עמלה מופחתת.'}
        </p>
      </div>

      {/* הפרס שלי */}
      {isWorker ? (
        <div className="rounded-2xl p-4 card-shadow flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#ecfdf5,#ffffff)', border: '1px solid #d1fae5' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            <Ticket size={20} className="text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 leading-none">{data.freeShifts || 0}</div>
            <div className="text-xs text-gray-500 mt-0.5">משמרות ללא עמלה זמינות</div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-4 card-shadow flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#fffbeb,#ffffff)', border: '1px solid #fde68a' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#e8a020,#f5c842)' }}>
            <Percent size={20} className="text-white" />
          </div>
          <div className="flex-1">
            {data.reducedActive ? (
              <>
                <div className="text-sm font-black text-gray-900">עמלה מופחתת פעילה — {reducedPct}%</div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Clock size={11} /> בתוקף עד {endDate}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-black text-gray-900">חודש עמלה מופחתת ({reducedPct}%)</div>
                <div className="text-xs text-gray-500 mt-0.5">יופעל כשמסעדה שהזמנתם תשלים 3 משמרות</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* הקוד והקישור */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="text-xs font-bold text-gray-500 mb-2">הקוד שלך</div>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
          <span className="font-black tracking-widest text-gray-900 text-lg">{code}</span>
          <span className="text-[11px] text-gray-400">קוד אישי</span>
        </div>
        <div className="flex gap-2">
          <a href={waUrl} target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white text-sm"
            style={{ background: '#25D366', textDecoration: 'none' }}>
            שיתוף בוואטסאפ
          </a>
          <button onClick={copy}
            className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-bold text-sm border"
            style={{ borderColor: '#e5e7eb', color: copied ? '#059669' : '#374151', background: '#fff' }}>
            {copied ? <><Check size={16} /> הועתק</> : <><Copy size={16} /> העתק קישור</>}
          </button>
        </div>
      </div>

      {/* איך זה עובד */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="text-xs font-bold text-gray-500 mb-3">איך זה עובד</div>
        <ol className="space-y-2.5">
          {[
            'שולחים את הקישור לחבר/ה.',
            isWorker
              ? 'הם נרשמים דרך הקישור ומתחילים לעבוד.'
              : 'הם נרשמים דרך הקישור ומתחילים לפרסם משמרות.',
            isWorker
              ? `הם מבצעים ${data.requiredShifts || 3} משמרות ומקבלים דירוג ${data.minRating || 4.0}+ כוכבים.`
              : `הם משלימים ${data.requiredShifts || 3} משמרות בפועל.`,
            isWorker
              ? 'ואתם מקבלים משמרת ללא עמלת Staffly — אוטומטית.'
              : 'ואתם מקבלים חודש עמלה מופחתת — אוטומטית.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="w-5 h-5 rounded-md bg-gray-900 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 card-shadow text-center">
          <Users size={18} className="text-amber-500 mx-auto mb-1" />
          <div className="text-2xl font-black text-gray-900 leading-none">{data.invited || 0}</div>
          <div className="text-xs text-gray-500 mt-1">{isWorker ? 'עובדים שהזמנת' : 'מסעדות שהזמנת'}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 card-shadow text-center">
          <CheckCircle2 size={18} className="text-green-500 mx-auto mb-1" />
          <div className="text-2xl font-black text-gray-900 leading-none">{data.completed || 0}</div>
          <div className="text-xs text-gray-500 mt-1">{isWorker ? 'השלימו וזיכו אותך' : 'השלימו 3 משמרות'}</div>
        </div>
      </div>

      {!isWorker && (
        <div className="flex items-center gap-1.5 text-gray-400 text-xs justify-center">
          <Star size={12} /> כל הזיכויים אוטומטיים — אין צורך לבקש
        </div>
      )}
    </div>
  );
};
