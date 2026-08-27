import React, { useState } from 'react';
import { GraduationCap, Lock, ExternalLink, Check, ChevronLeft } from 'lucide-react';
import { api } from '../../api';
import { useApp } from '../../context/AppContext';
import { SCHOOL_PARTNERS } from '../../data/schoolPartners';

/**
 * מסך הסטאז׳ למי שאינו סטודנט/בוגר — *נגיש* אך חסום.
 * במכוון לא מסתירים את הלשונית: מי שנכנס מקבל (א) הסבר למה זה סגור,
 * (ב) דרך להיפתח אם הוא כן לומד/בוגר, ו-(ג) בתי ספר וקורסים — ערוץ ההכנסה.
 */
export const StageLocked: React.FC = () => {
  const { userProfile, setUserProfile } = useApp();
  const [open, setOpen] = useState(false);           // טופס "אני לומד/בוגר"
  const [courseType, setCourseType] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const declareTrainee = async () => {
    if (!userProfile?.Id || !courseType) { setErr('בחר סוג קורס'); return; }
    setSaving(true); setErr('');
    try {
      const res = await api.updateWorker(userProfile.Id, {
        name: userProfile.Name, city: userProfile.City, role: userProfile.Role,
        hourlyRate: userProfile.HourlyRate || 0, bio: userProfile.Bio || '',
        yearsExp: userProfile.YearsExp || 0, skills: userProfile.Skills || '',
        phone: userProfile.Phone,
        isTrainee: true, courseType, schoolName: schoolName || null,
      });
      const updated = res?.profile || { ...userProfile, IsTrainee: true, CourseType: courseType, SchoolName: schoolName };
      setUserProfile(updated);
      localStorage.setItem('km_profile', JSON.stringify(updated));
    } catch (e: any) {
      setErr(e?.message || 'השמירה נכשלה — נסה שוב');
    }
    setSaving(false);
  };

  return (
    <div className="screen-enter space-y-4">
      {/* כותרת */}
      <div className="rounded-3xl p-4 text-white flex items-center gap-3"
        style={{ background: '#14233d' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(232,160,32,0.18)', border: '1px solid rgba(232,160,32,0.3)' }}>
          <GraduationCap className="text-amber-400" size={22} />
        </div>
        <div>
          <div className="font-bold text-lg leading-tight">סטאז׳</div>
          <div className="text-xs" style={{ color: '#8899bb' }}>לסטודנטים ולבוגרי בתי ספר קולינריים</div>
        </div>
      </div>

      {/* ── למה זה סגור ── */}
      <div className="bg-white rounded-2xl p-5 card-shadow text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
          <Lock size={24} className="text-gray-400" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">הסטאז׳ סגור בפניך כרגע</h3>
          <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
            משמרות סטאז׳ פתוחות רק לסטודנטים ולבוגרים של בתי ספר לבישול, קונדיטוריה וברמנות.
            זו הזדמנות ראשונה שהמסעדות שומרות למי שלמד את המקצוע.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-xs text-gray-600 text-right leading-relaxed">
          <b className="text-amber-700">מה כן פתוח לך:</b> כל המשמרות הרגילות בלשונית "משמרות" —
          כולל תפקידי כניסה שלא דורשים ניסיון (ראנר · שוטף כלים · טבח הכנות).
        </div>
      </div>

      {/* ── אני כן לומד/בוגר ── */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        {!open ? (
          <button onClick={() => setOpen(true)} className="w-full flex items-center justify-between text-right">
            <div>
              <div className="font-bold text-gray-900 text-sm">אני כן לומד/בוגר</div>
              <div className="text-gray-400 text-xs mt-0.5">עדכן את הפרופיל ותיפתח לך הגישה</div>
            </div>
            <ChevronLeft size={18} className="text-gray-300 flex-shrink-0" />
          </button>
        ) : (
          <div className="space-y-3">
            <div className="font-bold text-gray-900 text-sm">מה למדת?</div>
            <div className="grid grid-cols-3 gap-2">
              {['בישול', 'ברמנים', 'אחר'].map(c => (
                <button key={c} type="button" onClick={() => setCourseType(c)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                    courseType === c ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)}
              placeholder="שם בית הספר / הקורס (אופציונלי)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-sm outline-none focus:border-amber-400"
            />
            {err && <div className="bg-red-50 text-red-600 text-xs rounded-xl px-3 py-2 text-center">{err}</div>}
            <button onClick={declareTrainee} disabled={saving || !courseType}
              className="w-full rounded-2xl py-3.5 font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: '#e8a020', color: '#241803' }}>
              <Check size={16} /> {saving ? 'שומר...' : 'פתח לי גישה לסטאז׳'}
            </button>
            <p className="text-gray-400 text-[11px] text-center leading-snug">
              המסעדות רואות את שם בית הספר בפרופיל שלך, אז כדאי שיהיה מדויק.
            </p>
          </div>
        )}
      </div>

      {/* ── בתי ספר וקורסים ── */}
      <div className="space-y-2">
        <h3 className="font-bold text-gray-800 text-sm">רוצה להיכנס למקצוע?</h3>
        <p className="text-gray-400 text-xs -mt-1">
          קורס הוא הדרך הקצרה לסטאז׳ ולמשמרות טבח/בר — הנה איפה לומדים.
        </p>

        {SCHOOL_PARTNERS.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 card-shadow text-center">
            <GraduationCap size={26} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">בקרוב — בתי ספר שיתופיים</p>
            <p className="text-gray-400 text-xs mt-1 leading-snug">
              אנחנו סוגרים שיתופי פעולה עם בתי ספר לבישול וקורסי ברמנות.
              נעדכן אותך כאן ברגע שיהיו הטבות לנרשמים דרך Staffly.
            </p>
          </div>
        ) : (
          SCHOOL_PARTNERS.map(s => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
              className="block bg-white rounded-2xl p-4 card-shadow active:scale-[0.99] transition-transform">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-bold text-gray-900">{s.name}</span>
                <ExternalLink size={14} className="text-gray-300 flex-shrink-0 mt-1" />
              </div>
              <div className="text-gray-400 text-xs mb-1.5">{s.kind} · {s.city}</div>
              <p className="text-gray-500 text-xs leading-snug">{s.blurb}</p>
              {s.badge && (
                <div className="mt-2 inline-block text-[11px] font-bold text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
                  {s.badge}
                </div>
              )}
            </a>
          ))
        )}
        <p className="text-gray-300 text-[10px] text-center pt-1">
          תוכן שיווקי של גורמים חיצוניים. Staffly אינה צד בהתקשרות עם המוסד.
        </p>
      </div>
    </div>
  );
};
