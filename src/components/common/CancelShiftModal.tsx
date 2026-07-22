import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '../../api';

interface Props {
  jobId: number;
  /** מי מבטל */
  cancelledBy: 'worker' | 'restaurant';
  /** זמן התחלת המשמרת (ISO/Date) — לחישוב אזהרת ביטול מאוחר */
  startTime?: string | Date;
  /** האם המשמרת כבר אושרה (confirmed) — רק אז יש קנס על ביטול מאוחר */
  isConfirmed?: boolean;
  onClose: () => void;
  onCancelled: () => void;
}

const WORKER_REASONS = [
  'מצב חירום אישי',
  'בעיה בריאותית',
  'התחייבות אחרת',
  'בעיית תחבורה',
  'אחר',
];

const RESTAURANT_REASONS = [
  'אין צורך בעובד יותר',
  'שינוי בשעות הפעילות',
  'מצאנו פתרון אחר',
  'בעיה תפעולית',
  'אחר',
];

export const CancelShiftModal: React.FC<Props> = ({
  jobId, cancelledBy, startTime, isConfirmed, onClose, onCancelled,
}) => {
  const [reason, setReason]   = useState('');
  const [custom, setCustom]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const reasons = cancelledBy === 'worker' ? WORKER_REASONS : RESTAURANT_REASONS;

  // האם ביטול מאוחר (פחות מ-4 שעות לפני התחלה ומשמרת מאושרת)
  const LATE_FEE = 50;
  const hoursUntilStart = startTime
    ? (new Date(startTime).getTime() - Date.now()) / 3600000
    : Infinity;
  const isLate = Boolean(isConfirmed) && hoursUntilStart < 4;

  const handleConfirm = async () => {
    const finalReason = reason === 'אחר' ? (custom.trim() || 'אחר') : reason;
    if (!finalReason) { setError('בחר סיבת ביטול'); return; }
    setLoading(true); setError('');
    try {
      await api.cancelJob(jobId, finalReason, cancelledBy);
      onCancelled();
    } catch (e: any) {
      setError(e.message || 'שגיאה בביטול');
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 z-50 flex items-center justify-center px-4 pointer-events-none"
        style={{
          top: 'calc(env(safe-area-inset-top) + 64px)',
          bottom: 'calc(78px + env(safe-area-inset-bottom))',
        }}>
        <div className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm pointer-events-auto"
          style={{ maxHeight: '100%' }}>

          {/* Header */}
          <div className="flex-shrink-0 p-4 text-white" style={{ background:'linear-gradient(135deg,#7f1d1d,#b91c1c)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <span className="font-black text-base">ביטול משמרת</span>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 active:bg-white/30 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling:'touch' as any }}>
            {/* אזהרת ביטול מאוחר */}
            {isLate && (
              <div className="rounded-xl p-3 text-xs leading-relaxed"
                style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b' }}>
                <div className="font-black text-sm mb-1">ביטול מאוחר</div>
                נותרו פחות מ-4 שעות לתחילת המשמרת. אם תבטל כעת:
                <ul className="mt-1.5 space-y-1 pr-1 list-disc pr-5">
                  <li><strong>קנס ₪{LATE_FEE}</strong> שיועבר ישירות {cancelledBy === 'worker' ? 'למסעדה' : 'לעובד'}</li>
                  <li><strong>הדירוג שלך יירד בכוכב אחד</strong></li>
                </ul>
              </div>
            )}

            <div className="text-sm font-bold text-gray-700">סיבת הביטול:</div>

            <div className="space-y-2">
              {reasons.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`w-full text-right px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                    reason === r
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-white border-gray-150 text-gray-700 active:bg-gray-50'
                  }`}
                  style={reason !== r ? { borderColor:'#e5e7eb' } : {}}>
                  {r}
                </button>
              ))}
            </div>

            {reason === 'אחר' && (
              <input
                type="text"
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="פרט את הסיבה..."
                className="w-full border border-gray-200 rounded-xl py-3 px-3 text-right text-sm"
                autoFocus
              />
            )}

            {error && (
              <div className="bg-red-50 text-red-600 rounded-xl p-2.5 text-sm text-center">{error}</div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex gap-2">
            <button onClick={onClose} disabled={loading}
              className="flex-1 py-3 rounded-2xl font-bold text-sm bg-gray-100 text-gray-600">
              חזור
            </button>
            <button onClick={handleConfirm} disabled={loading || !reason}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : isLate ? `בטל ושלם ₪${LATE_FEE}` : 'בטל משמרת'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
