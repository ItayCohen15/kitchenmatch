import React, { useState } from 'react';
import { ChevronRight, Phone, MapPin, GraduationCap, Check, FileText } from 'lucide-react';
import { api } from '../api';
import { WORKER_ROLES, SKILLS_BY_ROLE, ENTRY_ROLE_KEYS } from '../utils/roles';
import { BUSINESS_TYPES } from '../data/mockData';
import { CityAutocomplete } from './common/CityAutocomplete';
import { StreetAutocomplete } from './common/StreetAutocomplete';
import { NonSelfEmployedDisclosure } from './common/NonSelfEmployedDisclosure';

interface Props {
  role: 'restaurant' | 'worker';
  userId: number;
  profileId: number;
  onComplete: (profile: any) => void;
}

export const Onboarding: React.FC<Props> = ({ role, userId, profileId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('restaurant'); // סוג העסק (מסעדה/בר/אולם/...)
  const [workerRoles, setWorkerRoles] = useState<string[]>([]);
  const toggleRole = (key: string) =>
    setWorkerRoles(prev => prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]);
  // האם לעובד יש ניסיון בתחום — נשאל *לפני* התפקידים וקובע מה מוצג.
  // null = עוד לא ענה (התפקידים מוסתרים עד שעונה).
  const [hasExperience, setHasExperience] = useState<boolean | null>(null);
  const chooseExperience = (val: boolean) => {
    setHasExperience(val);
    if (val) {
      setYearsExp(prev => (prev === '0' ? '1' : prev));
    } else {
      // ללא ניסיון: ותק 0, ומשאירים רק תפקידי כניסה שנבחרו (אם בחר מקצועיים לפני שהחליף)
      setYearsExp('0');
      setWorkerRoles(prev => prev.filter(r => ENTRY_ROLE_KEYS.has(r)));
    }
  };
  // כישורים לכל התפקידים שנבחרו — מאוחדים לפי קבוצה, בלי כפילויות
  const skillSections = (() => {
    const byGroup = new Map<string, string[]>();
    for (const r of workerRoles) for (const sec of (SKILLS_BY_ROLE[r] || [])) {
      const cur = byGroup.get(sec.group) || [];
      byGroup.set(sec.group, [...cur, ...sec.items.filter(i => !cur.includes(i))]);
    }
    return [...byGroup.entries()].map(([group, items]) => ({ group, items }));
  })();
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [yearsExp, setYearsExp] = useState('1');
  const [isTrainee, setIsTrainee] = useState(false);
  const [courseType, setCourseType] = useState('');
  const [schoolName, setSchoolName] = useState('');
  // מעמד תעסוקתי בשתי שאלות: קודם עצמאי/לא, ואז (לעצמאי) פטור/מורשה.
  // taxStatus הוא מה שנשמר: 'exempt' | 'licensed' | 'none'
  const [selfEmployedChoice, setSelfEmployedChoice] = useState<boolean | null>(null);
  const [taxStatus, setTaxStatus] = useState<'exempt' | 'licensed' | 'none' | null>(null);
  const isSelfEmployed = taxStatus === null ? null : taxStatus !== 'none';
  const [showDisclosure, setShowDisclosure] = useState(false);                // חלון גילוי נאות ללא-עצמאי
  const [nonSelfAckAt, setNonSelfAckAt] = useState<string | null>(null);      // מועד אישור הגילוי (לתיעוד)
  const [bio, setBio] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');   // שגיאת טלפון — מוצגת ליד השדה עצמו בשלב 1

  // יציאה ממסך ההרשמה. בלי זה משתמש שנתקע (למשל טלפון שכבר בשימוש בחשבון
  // אחר שלו) היה כלוא במסך הפרטים האישיים בלי שום דרך לחזור אחורה או להתנתק.
  const startOver = () => {
    ['km_token', 'km_role', 'km_profile', 'km_onboarding', 'km_screen', 'km_job']
      .forEach(k => localStorage.removeItem(k));
    location.reload();
  };

  // מסעדה: 2 שלבים (פרטים → סוג מטבח). שאר סוגי העסק: שלב 1 בלבד (סוג מטבח לא רלוונטי).
  const totalSteps = role === 'worker' ? 4 : (businessType === 'restaurant' ? 2 : 1);

  const toggleSpecialty = (id: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleCuisine = (id: string) => {
    setSelectedCuisines(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    setSaveErr('');
    try {
      let updatedProfile: any = { Id: profileId, Name: name, City: city };

      if (role === 'worker') {
        const res = await api.updateWorker(profileId, {
          name, city, role: workerRoles.join(','),
          hourlyRate: 0, bio,
          yearsExp: parseInt(yearsExp),
          skills: selectedSpecialties.join(','),
          phone,
          isTrainee,
          courseType: isTrainee ? (courseType || 'אחר') : null,
          schoolName: isTrainee ? schoolName : null,
          taxStatus,
          isSelfEmployed: isSelfEmployed === null ? true : isSelfEmployed,
          // תיעוד אישור הגילוי הנאות (רק כשנבחר לא-עצמאי ואושר)
          nonSelfEmployedAckAt: isSelfEmployed === false ? nonSelfAckAt : null,
        });
        // השתמש בפרופיל מהשרת אם קיים
        updatedProfile = res?.profile || {
          ...updatedProfile,
          Skills: selectedSpecialties.join(','), Role: workerRoles.join(','),
          HourlyRate: 0, Bio: bio,
          YearsExp: parseInt(yearsExp), Level: 'bronze',
          Rating: 0, CompletedShifts: 0, ReliabilityScore: 100,
          NoShows: 0, IsAvailable: true,
        };
      } else {
        const cuisinesStr = selectedCuisines.join(',');
        const fullAddress = `${street} ${streetNumber}`.trim();
        const res = await api.updateRestaurant(profileId, { name, city, cuisineType: cuisinesStr, address: fullAddress, phone, businessType });
        updatedProfile = res?.profile || { ...updatedProfile, CuisineType: cuisinesStr, Address: fullAddress, Phone: phone, BusinessType: businessType, WalletBalance: 0 };
      }

      onComplete(updatedProfile);
    } catch (e: any) {
      // התנגשות טלפון: הבעיה היא בשדה שבשלב 1, ולכן מחזירים את המשתמש *לשם*
      // עם ההסבר ליד השדה. קודם השגיאה הוצגה בשלב האחרון, רחוק מהשדה הרלוונטי,
      // והמשתמש נשאר תקוע בלי להבין מה לתקן.
      if (e?.code === 'phone_taken' || (e?.status === 409 && /טלפון/.test(e?.message || ''))) {
        setPhoneErr('המספר הזה כבר רשום בחשבון אחר. אפשר להזין מספר אחר, או לחזור ולהתחבר לחשבון הקיים.');
        setSaveErr('');
        setStep(1);
        setSaving(false);
        return;
      }
      // אל תמשיך עם פרופיל חלקי — הצג שגיאה ואפשר לנסות שוב
      setSaveErr(e?.message || 'שמירת הפרופיל נכשלה — בדוק חיבור ונסה שוב');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#1b1e38' }}>
      {showDisclosure && (
        /* האישור המלא (גרסה + נוסח + סימון התיבה) נשמר בשרת ב-ConsentAcks
           ברגע הלחיצה; nonSelfAckAt נשאר רק לתאימות עם השדה הישן ב-Workers. */
        <NonSelfEmployedDisclosure
          onAccept={() => {
            setSelfEmployedChoice(false); setTaxStatus('none');
            setNonSelfAckAt(new Date().toISOString()); setShowDisclosure(false);
          }}
          onCancel={() => setShowDisclosure(false)}
        />
      )}
      <div className="min-h-full flex flex-col items-center justify-start p-6 pb-10" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow-lg"
            style={{ boxShadow: '0 4px 16px rgba(20,28,44,0.10)' }}>
            <img src="/logo.svg" alt="Staffly" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">ברוך הבא!</h1>
          <p className="text-sm mt-1" style={{ color: '#8899bb' }}>בוא נגדיר את הפרופיל שלך</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i + 1 <= step ? '#5354d3' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">

          {/* Step 1 — Name + City */}
          {step === 1 && (
            <div className="space-y-4 screen-enter">
              <h2 className="text-xl font-bold text-gray-900">
                {role === 'worker' ? 'פרטים אישיים' : 'פרטי העסק'}
              </h2>
              {role === 'restaurant' && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1.5 block">סוג העסק</label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUSINESS_TYPES.map(b => {
                      const sel = businessType === b.key;
                      return (
                        <button key={b.key} type="button" onClick={() => setBusinessType(b.key)}
                          className={`px-2 py-3.5 rounded-xl border-2 flex items-center justify-center text-center transition-all ${sel ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100'}`}>
                          <span className={`text-[12px] font-bold leading-tight ${sel ? 'text-[#5354d3]' : 'text-gray-700'}`}>{b.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">
                  {role === 'worker' ? 'שם מלא' : 'שם העסק'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === 'worker' ? 'ישראל ישראלי' : 'מסעדת הגן'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-[#5354d3] outline-none text-gray-900 font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">עיר</label>
                <CityAutocomplete value={city} onChange={setCity} placeholder="הקלד עיר..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5"><Phone size={14} className="text-gray-400" /> מספר טלפון</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); if (phoneErr) setPhoneErr(''); }}
                  placeholder="05X-XXXXXXX"
                  className={`w-full border rounded-xl px-4 py-3 text-right outline-none ${
                    phoneErr ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#5354d3]'
                  }`}
                />
                {phoneErr && (
                  <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 space-y-2">
                    <p className="text-red-600 text-xs leading-snug">{phoneErr}</p>
                    <button
                      type="button"
                      onClick={startOver}
                      className="text-xs font-bold text-gray-600 underline"
                    >
                      התחבר לחשבון קיים
                    </button>
                  </div>
                )}
              </div>

              {role === 'restaurant' && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1.5 block">כתובת העסק</label>
                  <div className="flex gap-2">
                    <StreetAutocomplete city={city} value={street} onChange={setStreet} />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={streetNumber}
                      onChange={e => setStreetNumber(e.target.value)}
                      placeholder="מס׳"
                      className="w-20 border border-gray-200 rounded-xl px-3 py-3 text-right focus:border-[#5354d3] outline-none"
                    />
                  </div>
                  {street && streetNumber && (
                    <div className="mt-1.5 text-xs text-green-600 font-semibold flex items-center gap-1">
                      <MapPin size={13} className="inline" /> {street} {streetNumber}, {city}
                    </div>
                  )}
                </div>
              )}
              <button
                disabled={!name || !city || saving}
                onClick={() => {
                  if (role === 'worker') return setStep(2);
                  if (businessType === 'restaurant') return setStep(2); // מסעדה → שלב סוג מטבח
                  handleComplete();                                     // שאר סוגי עסק → סיום מיידי
                }}
                className="w-full rounded-2xl py-4 font-bold text-base disabled:opacity-40 mt-2"
                style={{ background: '#5354d3', color: '#ffffff' }}
              >
                {role === 'restaurant' && businessType !== 'restaurant' ? (saving ? 'שומר...' : 'סיים הגדרה') : 'המשך'}
              </button>
            </div>
          )}

          {/* Step 2 — Worker: Role + Rate | Restaurant: Cuisine */}
          {step === 2 && (
            <div className="space-y-4 screen-enter">
              {role === 'worker' ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900">ניסיון ותפקידים</h2>

                  {/* ── שאלת הניסיון — *לפני* בחירת התפקידים, כי היא קובעת מה מוצג ── */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">יש לך ניסיון בעבודה במסעדנות?</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => chooseExperience(true)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${hasExperience === true ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100'}`}
                      >
                        <div className="font-bold text-gray-900 text-sm">יש לי ניסיון</div>
                        <div className="text-gray-500 text-[11px] leading-tight">עבדתי בתחום</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => chooseExperience(false)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${hasExperience === false ? 'border-green-400 bg-green-50' : 'border-gray-100'}`}
                      >
                        <div className="font-bold text-gray-900 text-sm">אין לי ניסיון</div>
                        <div className="text-gray-500 text-[11px] leading-tight">חדש/ה בתחום</div>
                      </button>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 leading-relaxed">
                      <b className="text-gray-700">חשוב לענות בכיוון:</b> התשובה קובעת אילו משמרות נציע לך ומה המסעדה מצפה לראות.
                      התאמה מדויקת = יותר סיכוי שיאשרו אותך ופחות אכזבות בשטח. אין תשובה "פחות טובה" —
                      גם לחסרי ניסיון יש תפקידים פתוחים, ותמיד אפשר לעדכן מהפרופיל בהמשך.
                    </div>
                  </div>

                  {hasExperience !== null && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">תפקידים <span className="text-gray-400 font-normal">(אפשר לבחור כמה)</span></label>
                    {hasExperience && (
                    <div className="space-y-2">
                      {WORKER_ROLES.filter(r => !r.entry).map(r => {
                        const sel = workerRoles.includes(r.key);
                        return (
                          <button
                            key={r.key}
                            onClick={() => toggleRole(r.key)}
                            className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 text-right transition-all ${
                              sel ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-bold text-gray-900">{r.label}</div>
                              <div className="text-gray-500 text-xs">{r.desc}</div>
                            </div>
                            {sel && <span className="text-[#5354d3] font-bold text-lg">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    )}

                    {/* ── תפקידי כניסה — פתוחים לשני המצבים (גם למנוסים, כתוספת) ── */}
                    <div className={`${hasExperience ? 'mt-4' : ''} mb-2 flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-3 py-2`}>
                      <div>
                        <div className="text-sm font-bold text-green-700">
                          {hasExperience ? 'תפקידי כניסה — גם בשבילך' : 'התפקידים שפתוחים בפניך'}
                        </div>
                        <div className="text-xs text-gray-500 leading-snug">
                          {hasExperience
                            ? 'אפשר לקחת גם משמרות כאלה — עוד הזדמנויות, בלי לפגוע בתפקידים המקצועיים'
                            : 'התחל מכאן, צבור דירוגים ומשמרות — ומשם מתקדמים לתפקידים המקצועיים'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {WORKER_ROLES.filter(r => r.entry).map(r => {
                        const sel = workerRoles.includes(r.key);
                        return (
                          <button
                            key={r.key}
                            onClick={() => toggleRole(r.key)}
                            className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 text-right transition-all ${
                              sel ? 'border-green-400 bg-green-50' : 'border-gray-100'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                {r.label}
                                <span className="text-[10px] font-bold text-green-700 bg-green-100 rounded-full px-1.5 py-0.5">ללא ניסיון</span>
                              </div>
                              <div className="text-gray-500 text-xs">{r.desc}</div>
                            </div>
                            {sel && <span className="text-green-600 font-bold text-lg">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  )}

                  {/* שנות ניסיון — רק למי שהצהיר שיש לו ניסיון (אחרת מאולץ ל-0) */}
                  {hasExperience === true && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">שנות ניסיון</label>
                    <div className="flex gap-2" dir="ltr">
                      {['1', '2', '3', '5', '8+'].map(v => {
                        const val = v.replace('+', '');
                        const sel = yearsExp === val;
                        return (
                          <button
                            key={v}
                            onClick={() => setYearsExp(val)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                              sel ? '' : 'bg-gray-100 text-gray-700'
                            }`}
                            style={sel ? { background: '#5354d3', color: '#ffffff' } : {}}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  )}
                  {/* סטטוס מתלמד/סטודנט — פותח גישה לסטאז'ים */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">סטטוס מקצועי</label>
                    <button
                      type="button"
                      onClick={() => setIsTrainee(v => !v)}
                      className={`w-full p-3 rounded-xl border-2 flex items-center justify-between text-right transition-all ${isTrainee ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100'}`}
                    >
                      <div>
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><GraduationCap size={15} className="text-[#5354d3]" /> אני סטודנט/מתלמד</div>
                        <div className="text-gray-500 text-xs">לומד בקורס בישול/ברמנים — אחפש גם סטאז'</div>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${isTrainee ? 'bg-[#5354d3]' : 'bg-gray-300'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isTrainee ? 'right-0.5' : 'left-0.5'}`} />
                      </div>
                    </button>
                    {isTrainee && (
                      <>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {['בישול', 'ברמנים', 'אחר'].map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setCourseType(c)}
                              className={`py-2 rounded-xl text-sm font-semibold border transition-colors ${courseType === c ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={schoolName}
                          onChange={e => setSchoolName(e.target.value)}
                          placeholder="שם בית הספר / המכללה (לתוכנית הכניסה למקצוע)"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-[#5354d3] outline-none text-sm mt-2"
                        />
                      </>
                    )}
                  </div>

                  {/* ── מעמד תעסוקתי — שתי שאלות ── */}
                  {/* שאלה 1: עצמאי או לא. שאלה 2 (רק לעצמאי): פטור או מורשה.
                      ההבחנה השנייה קריטית — עוסק מורשה מחייב מע"מ ועוסק פטור לא. */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">מעמד תעסוקתי (לתשלום)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { setSelfEmployedChoice(true); setTaxStatus(null); }}
                        className={`p-3 rounded-xl border-2 text-right transition-all ${selfEmployedChoice === true ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100'}`}>
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><Check size={15} className="text-green-500" /> אני עצמאי</div>
                        <div className="text-gray-500 text-xs mt-0.5">תשלום ישיר, אני מוציא חשבונית</div>
                      </button>
                      <button type="button" onClick={() => setShowDisclosure(true)}
                        className={`p-3 rounded-xl border-2 text-right transition-all ${selfEmployedChoice === false ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100'}`}>
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><FileText size={15} className="text-gray-500" /> אני לא עצמאי</div>
                        <div className="text-gray-500 text-xs mt-0.5">תשלום דרך "חשבונית לשכיר"</div>
                      </button>
                    </div>

                    {/* שאלה 2 — נפתחת רק אחרי בחירת "אני עצמאי" */}
                    {selfEmployedChoice === true && (
                      <div className="mt-3 screen-enter">
                        <label className="text-sm font-semibold text-gray-600 mb-2 block">איזה סוג עוסק?</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => setTaxStatus('exempt')}
                            className={`p-3 rounded-xl border-2 text-right transition-all ${taxStatus === 'exempt' ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100'}`}>
                            <div className="font-bold text-gray-900 text-sm">עוסק פטור</div>
                            <div className="text-gray-500 text-xs mt-0.5">לא מחייב מע"מ</div>
                          </button>
                          <button type="button" onClick={() => setTaxStatus('licensed')}
                            className={`p-3 rounded-xl border-2 text-right transition-all ${taxStatus === 'licensed' ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100'}`}>
                            <div className="font-bold text-gray-900 text-sm">עוסק מורשה</div>
                            <div className="text-gray-500 text-xs mt-0.5">מחייב מע"מ</div>
                          </button>
                        </div>
                        <p className="text-gray-400 text-[11px] mt-1.5 leading-snug">
                          לא בטוח? זה מופיע באישור פתיחת העוסק שלך. אפשר לעדכן בהמשך מהפרופיל.
                        </p>
                      </div>
                    )}

                    {taxStatus === 'none' && (
                      <div className="mt-2 rounded-xl p-2.5 text-xs leading-relaxed flex items-start justify-between gap-2" style={{ background:'#fff8e1', border:'1px solid #f59e0b', color:'#92400e' }}>
                        <span className="flex items-center gap-1"><Check size={13} className="text-amber-600 flex-shrink-0" /> אישרת תשלום דרך "חשבונית לשכיר".</span>
                        <button type="button" onClick={() => setShowDisclosure(true)} className="underline font-semibold flex-shrink-0">מידע חשוב</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900">סוג המטבח שלך</h2>
                  <p className="text-gray-500 text-sm">בחר הכל שמתאים — אפשר לבחור כמה</p>

                  {[
                    { group: 'סוג המסגרת', items: [
                      { id: 'מסעדת שף',    icon: '⭐', desc: 'גורמה / פיין דיינינג' },
                      { id: 'בית קפה',     icon: '☕', desc: 'קפה, ארוחות בוקר, מנות קלות' },
                      { id: 'ביסטרו',      icon: '🍽️', desc: 'מסעדה קז׳ואל, תפריט קבוע' },
                      { id: 'בר / פאב',    icon: '🍺', desc: 'אלכוהול, אוכל מלווה' },
                      { id: 'קייטרינג',   icon: '🎉', desc: 'אירועים, חתונות, ועידות' },
                      { id: 'מזון מהיר',   icon: '🍔', desc: 'פאסט פוד, משלוחים' },
                    ]},
                    { group: 'סגנון מטבח', items: [
                      { id: 'ים תיכוני',     icon: '🌊', desc: 'ישראלי, יווני, לבנוני' },
                      { id: 'איטלקי',        icon: '🍝', desc: 'פסטה, ריזוטו, פיצה' },
                      { id: 'יפני / סושי',   icon: '🍣', desc: 'סושי, ראמן, טפניאקי' },
                      { id: 'אסייתי',        icon: '🥢', desc: 'תאילנדי, סיני, וייטנאמי' },
                      { id: 'מזרח תיכוני',   icon: '🧆', desc: 'לבנוני, טורקי, מרוקאי' },
                      { id: 'בשרים / גריל',  icon: '🥩', desc: 'סטייקים, שיפודים, BBQ' },
                      { id: 'דגים / ים',     icon: '🐟', desc: 'פירות ים, דגים טריים' },
                      { id: 'צמחוני / טבעוני', icon: '🥗', desc: 'תפריט plant-based' },
                    ]},
                  ].map(section => (
                    <div key={section.group}>
                      <div className="text-xs font-bold text-gray-400 mb-2">{section.group}</div>
                      <div className="space-y-2">
                        {section.items.map(item => {
                          const sel = selectedCuisines.includes(item.id);
                          return (
                            <button key={item.id} onClick={() => toggleCuisine(item.id)}
                              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 text-right transition-all ${sel ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100 bg-white'}`}>
                              <div className="flex-1">
                                <div className={`font-bold text-sm ${sel ? 'text-[#5354d3]' : 'text-gray-900'}`}>{item.id}</div>
                                <div className="text-gray-400 text-xs">{item.desc}</div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#5354d3]' : 'border-gray-300'}`}>
                                {sel && <span className="text-white text-xs">✓</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {selectedCuisines.length > 0 && (
                    <div className="bg-[#ecebfd] rounded-xl p-3 text-center">
                      <span className="text-[#5354d3] font-semibold text-sm">✓ בחרת {selectedCuisines.length} סגנונות</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="bg-gray-100 rounded-2xl py-4 px-5 text-gray-600">
                  <ChevronRight size={20} />
                </button>
                <button
                  disabled={role === 'worker' ? (hasExperience === null || !workerRoles.length || taxStatus === null) : selectedCuisines.length === 0}
                  onClick={() => role === 'worker' ? setStep(3) : handleComplete()}
                  className="flex-1 rounded-2xl py-4 font-bold disabled:opacity-40"
                  style={{ background: '#5354d3', color: '#ffffff' }}
                >
                  {role === 'restaurant' ? (saving ? 'שומר...' : 'סיים הגדרה') : 'המשך'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Worker: Skills (מותאם לפי תפקיד) */}
          {step === 3 && role === 'worker' && (
            <div className="space-y-3 screen-enter">
              <h2 className="text-xl font-bold text-gray-900">במה אתה מתמחה?</h2>
              <p className="text-gray-500 text-sm">בחר הכל שרלוונטי — ככה המסעדות ידעו בדיוק מה אתה מביא</p>

              {skillSections.map(section => (
                <div key={section.group}>
                  <div className="text-xs font-bold text-gray-400 mb-2 mr-1">{section.group}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {section.items.map(item => {
                      const selected = selectedSpecialties.includes(item);
                      return (
                        <button key={item} onClick={() => toggleSpecialty(item)}
                          className={`p-2.5 rounded-xl border-2 text-right transition-all ${selected ? 'border-[#5354d3] bg-[#ecebfd]' : 'border-gray-100 bg-white'}`}>
                          <span className={`text-xs font-semibold leading-tight ${selected ? 'text-[#5354d3]' : 'text-gray-700'}`}>
                            {selected ? '✓ ' : ''}{item}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectedSpecialties.length > 0 && (
                <div className="bg-[#ecebfd] rounded-xl p-3 text-center">
                  <span className="text-[#5354d3] font-semibold text-sm">
                    ✓ בחרת {selectedSpecialties.length} כישורים
                  </span>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="bg-gray-100 rounded-2xl py-4 px-5 text-gray-600">
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 rounded-2xl py-4 font-bold"
                  style={{ background: '#5354d3', color: '#ffffff' }}
                >
                  המשך {selectedSpecialties.length === 0 ? '(דלג)' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Worker: Bio */}
          {step === 4 && role === 'worker' && (
            <div className="space-y-4 screen-enter">
              <h2 className="text-xl font-bold text-gray-900">קצת עלייך</h2>
              <p className="text-gray-500 text-sm">כתב 2-3 משפטים שיעזרו למסעדות להכיר אותך</p>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="לדוגמה: שף עם 3 שנות ניסיון, מתמחה במטבח ים תיכוני. גמיש לשעות ומסור לעבודה."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-[#5354d3] outline-none text-gray-900 text-sm resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="bg-gray-100 rounded-2xl py-4 px-5 text-gray-600">
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 rounded-2xl py-4 font-bold disabled:opacity-50"
                  style={{ background: '#5354d3', color: '#ffffff' }}
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      שומר...
                    </div>
                  ) : 'סיום'}
                </button>
              </div>
            </div>
          )}
          {saveErr && <div className="mt-3 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5 text-center">{saveErr}</div>}
        </div>

        {/* דלת יציאה — זמינה בכל שלב. משתמש שנתקע (טלפון תפוס, חשבון כפול,
            התחברות בטעות) חייב דרך לחזור למסך הכניסה ולא להישאר כלוא. */}
        <button
          type="button"
          onClick={startOver}
          className="w-full mt-4 py-3 text-sm font-semibold"
          style={{ color: '#8899bb' }}
        >
          חזרה למסך הכניסה
        </button>
      </div>
      </div>
    </div>
  );
};
