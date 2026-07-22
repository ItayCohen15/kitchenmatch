import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Archive } from 'lucide-react';
import { api } from '../../api';
import { haptic } from '../../utils/haptics';

// מחיקת חשבון — פעולה בלתי-הפיכה.
// שקיפות מלאה: מה נמחק לצמיתות מול מה נשמר מסיבות חוקיות.
// דורש אישור סיסמה + סימון תיבת אישור, כדי שלא יקרה בטעות.

interface Props {
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteAccountModal: React.FC<Props> = ({ onClose, onDeleted }) => {
  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canDelete = password.length > 0 && understood && !busy;

  const handleDelete = async () => {
    if (!canDelete) return;
    setBusy(true); setError('');
    try {
      await api.deleteAccount(password);
      haptic('success');
      onDeleted();
    } catch (e: any) {
      setError(e?.message || 'המחיקה נכשלה');
      haptic('error');
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 z-50 flex items-center justify-center px-4 pointer-events-none"
        style={{
          top: 'calc(env(safe-area-inset-top) + 48px)',
          bottom: 'calc(78px + env(safe-area-inset-bottom))',
        }}>
        <div className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm pointer-events-auto"
          style={{ maxHeight: '100%' }}>

          {/* כותרת */}
          <div className="flex-shrink-0 p-4 text-white" style={{ background: 'linear-gradient(135deg,#7f1d1d,#b91c1c)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <span className="font-black text-base">מחיקת חשבון</span>
              </div>
              <button onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 active:bg-white/30 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* תוכן */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="rounded-xl p-3 text-sm leading-relaxed"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
              <b>הפעולה הזו בלתי-הפיכה.</b> לא ניתן לשחזר את החשבון לאחר המחיקה.
            </div>

            <div>
              <div className="font-bold text-gray-800 text-sm mb-1.5 flex items-center gap-1.5"><Trash2 size={14} className="text-gray-500" /> מה יימחק לצמיתות</div>
              <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                <li>• השם, האימייל והטלפון שלך</li>
                <li>• הפרופיל, קורות החיים והגלריה</li>
                <li>• ההתראות והמנויים להתראות</li>
                <li>• הגישה לחשבון — לא תוכל להתחבר שוב</li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-gray-800 text-sm mb-1.5 flex items-center gap-1.5"><Archive size={14} className="text-gray-500" /> מה יישמר (ומדוע)</div>
              <p className="text-xs text-gray-600 leading-relaxed">
                רשומות כספיות של משמרות שהושלמו (תשלומים ועמלות) נשמרות <b>ללא זיהוי אישי</b>,
                כפי שמחייב הדין לצורכי תיעוד חשבונאי ומס.
              </p>
            </div>

            <div className="rounded-xl p-2.5 text-xs leading-relaxed"
              style={{ background: '#fff8e1', border: '1px solid #f59e0b', color: '#92400e' }}>
              ℹ️ לא ניתן למחוק חשבון עם <b>משמרות פעילות</b> או <b>יתרה בארנק</b>. סיים אותן / משוך את הכסף קודם.
            </div>

            {/* אישור */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input type="checkbox" checked={understood} onChange={e => setUnderstood(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-red-600 flex-shrink-0" />
              <span className="text-xs text-gray-700 leading-relaxed">
                אני מבין/ה שהמחיקה סופית ולא ניתן לשחזר את החשבון או את הנתונים.
              </span>
            </label>

            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">אשר/י באמצעות הסיסמה שלך</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="הסיסמה שלך"
                className="w-full border border-gray-200 rounded-xl py-3 px-3 text-right text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 rounded-xl p-2.5 text-sm text-center">{error}</div>
            )}
          </div>

          {/* פעולות */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex gap-2">
            <button onClick={onClose} disabled={busy}
              className="flex-1 py-3 rounded-2xl font-bold text-sm bg-gray-100 text-gray-600">
              ביטול
            </button>
            <button onClick={handleDelete} disabled={!canDelete}
              className="flex-1 py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
              {busy
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Trash2 size={15} /> מחק לצמיתות</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
