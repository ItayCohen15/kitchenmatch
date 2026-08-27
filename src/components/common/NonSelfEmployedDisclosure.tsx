import React, { useState, useEffect } from 'react';
import { X, Info, ShieldAlert, ExternalLink, Check } from 'lucide-react';
import { api } from '../../api';

interface Props {
  /** אישר והבין — ממשיך כלא-עצמאי. מקבל את הגרסה שאושרה (לתיעוד) */
  onAccept: (version: string) => void;
  /** ביטל / סגר — לא ממשיך כלא-עצמאי */
  onCancel: () => void;
}

interface Section { key: string; title: string; body?: string; items?: string[]; warn?: boolean }
interface Doc {
  version: string; title: string; intro: string; sections: Section[];
  footnote: string; checkboxLabel: string; partnerUrl?: string; partnerName?: string;
}

/**
 * גילוי נאות לעובד שאין לו עוסק (תשלום דרך "חשבונית לשכיר" של חברת עצמאי שכיר).
 *
 * ⚠️ הנוסח מגיע מהשרת ולא מקודד כאן — כך שמה שהוצג לעובד הוא בדיוק הנוסח
 * שנשמר ברשומת האישור, וניתן להפיק אותו בדיעבד. שינוי נוסח = גרסה חדשה בשרת.
 */
export const NonSelfEmployedDisclosure: React.FC<Props> = ({ onAccept, onCancel }) => {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [ack, setAck] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);   // אושר — מציגים את שלב ההרשמה אצל הספק

  useEffect(() => {
    api.getConsentDoc('non_self_employed')
      .then((d: any) => setDoc(d))
      .catch((e: any) => setLoadErr(e?.message || 'לא הצלחנו לטעון את פרטי הגילוי הנאות'));
  }, []);

  const confirm = async () => {
    if (!doc || !ack || saving) return;
    setSaving(true); setLoadErr('');
    try {
      await api.ackConsent('non_self_employed', doc.version);
      // יש קישור הרשמה אצל הספק? עצור והצג אותו. אחרת — סיים מיד.
      if (doc.partnerUrl) setDone(true);
      else onAccept(doc.version);
    } catch (e: any) {
      setLoadErr(e?.message || 'האישור לא נשמר — נסה שוב');
      setSaving(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onCancel} />
      <div className="fixed inset-x-0 z-50 flex items-center justify-center px-3 pointer-events-none"
        style={{ top: 'calc(env(safe-area-inset-top) + 24px)', bottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        <div className="flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm pointer-events-auto"
          style={{ maxHeight: '100%' }}>
          {children}
        </div>
      </div>
    </>
  );

  const header = (title: string) => (
    <div className="flex-shrink-0 p-4" style={{ background: '#e8a020', color: '#241803' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Info size={18} className="flex-shrink-0" />
          <span className="font-bold text-base truncate">{title}</span>
        </div>
        <button onClick={onCancel} aria-label="סגור"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15 active:bg-white/30 transition-colors flex-shrink-0">
          <X size={18} />
        </button>
      </div>
    </div>
  );

  // ── טוען / כשל טעינה ──
  if (!doc) return shell(
    <>
      {header('חשוב שתדע — תשלום ללא עוסק')}
      <div className="p-8 text-center">
        {loadErr ? (
          <>
            <p className="text-sm text-red-600 mb-3">{loadErr}</p>
            <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">חזור</button>
          </>
        ) : (
          <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        )}
      </div>
    </>
  );

  // ── אושר → השלמת הרשמה אצל הספק ──
  if (done) return shell(
    <>
      {header('כמעט סיימנו')}
      <div className="p-5 space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
          <Check size={26} className="text-green-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">האישור נשמר</h3>
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
            כדי שנוכל לשלם לך, נותר להשלים הרשמה קצרה מול <strong>{doc.partnerName}</strong> —
            שם תחתום על טופס 6101 וייפוי הכוח ותעלה את המסמכים הנדרשים. תהליך חד-פעמי.
          </p>
        </div>
        <a href={doc.partnerUrl} target="_blank" rel="noopener noreferrer"
          onClick={() => setTimeout(() => onAccept(doc.version), 300)}
          className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: '#e8a020', color: '#241803' }}>
          <ExternalLink size={16} /> להרשמה ב{doc.partnerName}
        </a>
        <button onClick={() => onAccept(doc.version)} className="w-full py-2.5 text-sm font-semibold text-gray-500">
          אשלים את זה בהמשך
        </button>
        <p className="text-[11px] text-gray-400 leading-snug">
          בלי השלמת ההרשמה אצל {doc.partnerName} לא נוכל להעביר לך תשלום.
        </p>
      </div>
    </>
  );

  // ── המסמך עצמו ──
  return shell(
    <>
      {header(doc.title)}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' as any }}>
        <p className="text-sm text-gray-700 leading-relaxed">{doc.intro}</p>

        {doc.sections.map(s => (
          <div key={s.key} className="rounded-xl p-3 flex gap-3"
            style={s.warn
              ? { background: '#fff8e1', border: '1px solid #f59e0b' }
              : { background: '#f8fafc', border: '1px solid #e5e7eb' }}>
            {s.warn && <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#b45309' }} />}
            <div className="text-xs leading-relaxed" style={s.warn ? { color: '#92400e' } : { color: '#374151' }}>
              <div className={`font-bold text-sm mb-0.5 ${s.warn ? '' : 'text-gray-900'}`}>{s.title}</div>
              {s.body && <p>{s.body}</p>}
              {s.items && (
                <ul className="mt-1.5 space-y-1 list-disc pr-4">
                  {s.items.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              )}
            </div>
          </div>
        ))}

        <p className="text-[11px] text-gray-400 leading-relaxed">{doc.footnote}</p>

        {/* אישור מפורש — הסימון עצמו נשמר ברשומת האישור */}
        <button type="button" onClick={() => setAck(v => !v)}
          className="w-full flex items-start gap-2.5 rounded-xl p-3 text-right transition-colors"
          style={{ background: ack ? '#ecfdf5' : '#f8fafc', border: `1px solid ${ack ? '#6ee7b7' : '#e5e7eb'}` }}>
          <span className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: ack ? '#10b981' : '#fff', border: `2px solid ${ack ? '#10b981' : '#cbd5e1'}` }}>
            {ack && <span className="text-white text-xs leading-none">✓</span>}
          </span>
          <span className="text-xs font-semibold text-gray-700 leading-relaxed">{doc.checkboxLabel}</span>
        </button>

        {loadErr && <div className="bg-red-50 text-red-600 text-xs rounded-xl px-3 py-2 text-center">{loadErr}</div>}
        <p className="text-[10px] text-gray-300 text-center">גרסת נוסח {doc.version}</p>
      </div>

      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-2xl font-bold text-sm bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors">
          חזור
        </button>
        <button onClick={confirm} disabled={!ack || saving}
          className="flex-1 py-3 rounded-2xl font-bold text-sm disabled:opacity-40 transition-opacity"
          style={{ background: '#e8a020', color: '#241803' }}>
          {saving ? 'שומר...' : 'הבנתי, המשך'}
        </button>
      </div>
    </>
  );
};
