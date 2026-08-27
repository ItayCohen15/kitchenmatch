import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Landmark, ShieldCheck, Clock, AlertTriangle, RefreshCw, ExternalLink, Lock } from 'lucide-react';
import { api } from '../../api';
import { haptic } from '../../utils/haptics';

/* ═══════════════════════════════════════════════════════════
   חשבון קבלת תשלומים — "לאן מגיע הכסף"

   ⚠️ שים לב: אין כאן טופס פרטי בנק, ובכוונה.
   פרטי החשבון נמסרים ע"י העובד ישירות לחברת הסליקה בעמוד
   מאובטח שלה (שם גם מתבצע אימות הזהות/KYC כנדרש בחוק).
   Staffly לא רואה ולא שומרת מספרי חשבון — רק סטטוס ו-4 ספרות.

   מצבים: none → pending → approved | rejected
═══════════════════════════════════════════════════════════ */

export type PayoutAccount = {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  hasAccount: boolean;
  bankLast4: string | null;
  reason: string | null;
  isSelfEmployed: boolean;
  required: boolean;   // האם המערכת חוסמת משיכה בלי חשבון מאושר
};

export const PayoutAccountCard: React.FC<{
  workerId: number;
  onAccountChange?: (account: PayoutAccount) => void;
}> = ({ workerId, onAccountChange }) => {
  const [acc, setAcc] = useState<PayoutAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // נשמר כשהספק החזיר לינק חיצוני — אז מציגים "כבר מילאתי, בדוק שוב"
  const [sentToProvider, setSentToProvider] = useState(false);

  // הקולבק נשמר ב-ref כדי ש-prop שנוצר מחדש בכל רינדור (arrow inline)
  // לא יפעיל מחדש את ה-effect ויגרום ללולאת בקשות אינסופית.
  const cbRef = useRef(onAccountChange);
  useEffect(() => { cbRef.current = onAccountChange; }, [onAccountChange]);

  const apply = useCallback((a: PayoutAccount | null) => {
    if (!a) return;
    setAcc(a);
    cbRef.current?.(a);
  }, []);

  useEffect(() => {
    if (!workerId) return;
    api.getPayoutAccount(workerId).then(apply).catch(() => {});
  }, [workerId, apply]);

  /* פתיחת/חידוש onboarding מול הספק */
  const handleOnboard = async () => {
    if (busy) return;
    haptic('light');
    setBusy(true); setErr('');
    try {
      const r = await api.startPayoutOnboarding(workerId, window.location.origin);
      apply(r?.account);
      if (r?.onboardingUrl) {
        // הספק מנהל את מילוי הפרטים — יוצאים לעמוד שלו
        setSentToProvider(true);
        window.open(r.onboardingUrl, '_blank', 'noopener,noreferrer');
      }
      haptic('success');
    } catch (e: any) {
      setErr(e?.message || 'לא הצלחנו לפתוח את החשבון. נסה שוב.');
      haptic('error');
    } finally { setBusy(false); }
  };

  /* בדיקת סטטוס מחודשת (אחרי שהעובד חזר מהספק) */
  const handleRefresh = async () => {
    if (busy) return;
    haptic('light');
    setBusy(true); setErr('');
    try {
      const r = await api.refreshPayoutAccount(workerId);
      apply(r?.account);
    } catch (e: any) {
      setErr(e?.message || 'בדיקת הסטטוס נכשלה');
    } finally { setBusy(false); }
  };

  if (!acc) return null;

  /* ─── עובד לא-עצמאי: הכסף כלל לא עובר דרך הארנק ─── */
  if (!acc.isSelfEmployed) {
    return (
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-2 mb-2">
          <Landmark size={16} className="text-blue-500" />
          <span className="font-bold text-gray-800 text-sm">קבלת התשלום שלך</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          מכיוון שאינך עצמאי, התשלום שלך עובר דרך שירות <b className="text-gray-700">"חשבונית לשכיר"</b>.
          השירות מנכה מס הכנסה, ביטוח לאומי ובריאות — ומעביר אליך את הנטו ישירות.
          <br />
          <span className="text-gray-400">את פרטי החשבון שלך תמסור לשירות עצמו — לא כאן.</span>
        </p>
      </div>
    );
  }

  const S = acc.status;

  /* ─── מאושר ─── */
  if (S === 'approved') {
    return (
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ecfdf5' }}>
            <ShieldCheck size={17} className="text-green-600" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-800 text-sm">חשבון קבלת תשלומים מאומת</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {acc.bankLast4 ? `חשבון המסתיים ב-${acc.bankLast4}` : 'הכסף יועבר לחשבון שהגדרת'}
            </div>
          </div>
          <span className="text-[10px] font-bold text-green-700 bg-green-50 rounded-full px-2 py-1">פעיל</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-2.5 flex items-center gap-1">
          <Lock size={10} /> פרטי החשבון שמורים אצל חברת הסליקה בלבד — לא אצל Staffly
        </p>
      </div>
    );
  }

  /* ─── ממתין לאישור ─── */
  if (S === 'pending') {
    return (
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fff8e1' }}>
            <Clock size={17} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-800 text-sm">החשבון בבדיקה</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {sentToProvider ? 'סיימת למלא? בדוק את הסטטוס' : 'חברת הסליקה מאמתת את הפרטים'}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={busy}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            style={{ background: 'rgba(83,84,211,0.1)', color: '#4244b8', border: '1px solid rgba(83,84,211,0.25)' }}>
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> בדוק סטטוס
          </button>
          <button onClick={handleOnboard} disabled={busy}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold text-gray-500 bg-gray-50 disabled:opacity-50">
            המשך מילוי פרטים
          </button>
        </div>
        {err && <div className="text-red-500 text-[11px] text-center mt-2">{err}</div>}
      </div>
    );
  }

  /* ─── נדחה ─── */
  if (S === 'rejected') {
    return (
      <div className="rounded-2xl p-4 card-shadow" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={17} className="text-red-500 flex-shrink-0" />
          <div className="font-bold text-red-700 text-sm">החשבון לא אושר</div>
        </div>
        <p className="text-xs text-red-600/90 leading-relaxed mb-3">
          {acc.reason || 'חברת הסליקה לא הצליחה לאמת את הפרטים. אפשר לנסות שוב עם פרטים מעודכנים.'}
        </p>
        <button onClick={handleOnboard} disabled={busy}
          className="w-full rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-50"
          style={{ background: '#e5484d' }}>
          {busy ? 'רגע...' : 'נסה שוב'}
        </button>
        {err && <div className="text-red-600 text-[11px] text-center mt-2">{err}</div>}
      </div>
    );
  }

  /* ─── טרם הוגדר ─── */
  return (
    <div className="rounded-2xl p-4 card-shadow text-white" style={{ background: '#1b1e38' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <Landmark size={17} style={{ color: '#5354d3' }} />
        <span className="font-bold text-sm">הגדר לאן יגיע הכסף</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-3">
        כדי למשוך את היתרה, צריך פעם אחת לאמת חשבון בנק מול חברת הסליקה.
        <br />
        <span className="text-gray-500">
          תעבור לעמוד המאובטח שלהם — Staffly לא רואה ולא שומרת את פרטי החשבון שלך.
        </span>
      </p>
      <button onClick={handleOnboard} disabled={busy}
        className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: '#5354d3' }}>
        {busy
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> פותח...</>
          : <><ExternalLink size={15} /> הגדרת קבלת תשלומים</>}
      </button>
      {err && <div className="text-red-300 text-[11px] text-center mt-2">{err}</div>}
    </div>
  );
};
