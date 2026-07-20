import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { api } from '../api';
import { WORKER_ROLES, SKILLS_BY_ROLE } from '../utils/roles';
import { CityAutocomplete } from './common/CityAutocomplete';
import { StreetAutocomplete } from './common/StreetAutocomplete';

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
  const [workerRole, setWorkerRole] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [yearsExp, setYearsExp] = useState('1');
  const [isTrainee, setIsTrainee] = useState(false);
  const [courseType, setCourseType] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isSelfEmployed, setIsSelfEmployed] = useState<boolean | null>(null); // עצמאי / לא-עצמאי (לתשלום)
  const [bio, setBio] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const totalSteps = role === 'worker' ? 4 : 2;

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
          name, city, role: workerRole,
          hourlyRate: 0, bio,
          yearsExp: parseInt(yearsExp),
          skills: selectedSpecialties.join(','),
          phone,
          isTrainee,
          courseType: isTrainee ? (courseType || 'אחר') : null,
          schoolName: isTrainee ? schoolName : null,
          isSelfEmployed: isSelfEmployed === null ? true : isSelfEmployed,
        });
        // השתמש בפרופיל מהשרת אם קיים
        updatedProfile = res?.profile || {
          ...updatedProfile,
          Skills: selectedSpecialties.join(','), Role: workerRole,
          HourlyRate: 0, Bio: bio,
          YearsExp: parseInt(yearsExp), Level: 'bronze',
          Rating: 0, CompletedShifts: 0, ReliabilityScore: 100,
          NoShows: 0, IsAvailable: true,
        };
      } else {
        const cuisinesStr = selectedCuisines.join(',');
        const fullAddress = `${street} ${streetNumber}`.trim();
        const res = await api.updateRestaurant(profileId, { name, city, cuisineType: cuisinesStr, address: fullAddress, phone });
        updatedProfile = res?.profile || { ...updatedProfile, CuisineType: cuisinesStr, Address: fullAddress, Phone: phone, WalletBalance: 0 };
      }

      onComplete(updatedProfile);
    } catch (e: any) {
      // אל תמשיך עם פרופיל חלקי — הצג שגיאה ואפשר לנסות שוב
      setSaveErr(e?.message || 'שמירת הפרופיל נכשלה — בדוק חיבור ונסה שוב');
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'linear-gradient(160deg, #0d1420 0%, #1a2744 100%)' }}>
      <div className="min-h-full flex flex-col items-center justify-start p-6 pb-10" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow-lg"
            style={{ boxShadow: '0 4px 20px rgba(232,160,32,0.3)' }}>
            <img src="/logo.svg" alt="Staffly" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-black text-white">ברוך הבא!</h1>
          <p className="text-sm mt-1" style={{ color: '#8899bb' }}>בוא נגדיר את הפרופיל שלך</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i + 1 <= step ? '#e8a020' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">

          {/* Step 1 — Name + City */}
          {step === 1 && (
            <div className="space-y-4 screen-enter">
              <h2 className="text-xl font-black text-gray-900">
                {role === 'worker' ? 'פרטים אישיים' : 'פרטי המסעדה'}
              </h2>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">
                  {role === 'worker' ? 'שם מלא' : 'שם המסעדה'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === 'worker' ? 'ישראל ישראלי' : 'מסעדת הגן'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none text-gray-900 font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">עיר</label>
                <CityAutocomplete value={city} onChange={setCity} placeholder="הקלד עיר..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">📞 מספר טלפון</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="05X-XXXXXXX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none"
                />
              </div>

              {role === 'restaurant' && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1.5 block">כתובת המסעדה</label>
                  <div className="flex gap-2">
                    <StreetAutocomplete city={city} value={street} onChange={setStreet} />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={streetNumber}
                      onChange={e => setStreetNumber(e.target.value)}
                      placeholder="מס׳"
                      className="w-20 border border-gray-200 rounded-xl px-3 py-3 text-right focus:border-amber-400 outline-none"
                    />
                  </div>
                  {street && streetNumber && (
                    <div className="mt-1.5 text-xs text-green-600 font-semibold flex items-center gap-1">
                      📍 {street} {streetNumber}, {city}
                    </div>
                  )}
                </div>
              )}
              <button
                disabled={!name || !city}
                onClick={() => role === 'restaurant' && totalSteps === 2 ? setStep(2) : setStep(2)}
                className="w-full text-white rounded-2xl py-4 font-bold text-base disabled:opacity-40 mt-2"
                style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}
              >
                המשך
              </button>
            </div>
          )}

          {/* Step 2 — Worker: Role + Rate | Restaurant: Cuisine */}
          {step === 2 && (
            <div className="space-y-4 screen-enter">
              {role === 'worker' ? (
                <>
                  <h2 className="text-xl font-black text-gray-900">תפקיד וניסיון</h2>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">תפקיד ראשי</label>
                    <div className="space-y-2">
                      {WORKER_ROLES.map(r => (
                        <button
                          key={r.key}
                          onClick={() => { setWorkerRole(r.key); setSelectedSpecialties([]); }}
                          className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 text-right transition-all ${
                            workerRole === r.key ? 'border-amber-400 bg-amber-50' : 'border-gray-100'
                          }`}
                        >
                          <span className="text-2xl">{r.emoji}</span>
                          <div>
                            <div className="font-bold text-gray-900">{r.label}</div>
                            <div className="text-gray-500 text-xs">{r.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">שנות ניסיון</label>
                    <div className="flex gap-2" dir="ltr">
                      {['1', '2', '3', '5', '8+'].map(v => {
                        const sel = yearsExp === v.replace('+', '');
                        return (
                          <button
                            key={v}
                            onClick={() => setYearsExp(v.replace('+', ''))}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                              sel ? 'text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                            style={sel ? { background: 'linear-gradient(135deg,#e8a020,#f0c050)' } : {}}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* סטטוס מתלמד/סטודנט — פותח גישה לסטאז'ים */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">סטטוס מקצועי</label>
                    <button
                      type="button"
                      onClick={() => setIsTrainee(v => !v)}
                      className={`w-full p-3 rounded-xl border-2 flex items-center justify-between text-right transition-all ${isTrainee ? 'border-amber-400 bg-amber-50' : 'border-gray-100'}`}
                    >
                      <div>
                        <div className="font-bold text-gray-900 text-sm">🎓 אני סטודנט/מתלמד</div>
                        <div className="text-gray-500 text-xs">לומד בקורס בישול/ברמנים — אחפש גם סטאז'</div>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${isTrainee ? 'bg-amber-500' : 'bg-gray-300'}`}>
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
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-right focus:border-amber-400 outline-none text-sm mt-2"
                        />
                      </>
                    )}
                  </div>

                  {/* מעמד תעסוקתי — קובע איך מתבצע התשלום */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">מעמד תעסוקתי (לתשלום)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setIsSelfEmployed(true)}
                        className={`p-3 rounded-xl border-2 text-right transition-all ${isSelfEmployed === true ? 'border-amber-400 bg-amber-50' : 'border-gray-100'}`}>
                        <div className="font-bold text-gray-900 text-sm">✅ יש לי עוסק</div>
                        <div className="text-gray-500 text-xs mt-0.5">פטור/מורשה — תשלום ישיר, אני מוציא חשבונית</div>
                      </button>
                      <button type="button" onClick={() => setIsSelfEmployed(false)}
                        className={`p-3 rounded-xl border-2 text-right transition-all ${isSelfEmployed === false ? 'border-amber-400 bg-amber-50' : 'border-gray-100'}`}>
                        <div className="font-bold text-gray-900 text-sm">🧾 אין לי עוסק</div>
                        <div className="text-gray-500 text-xs mt-0.5">תשלום דרך "חשבונית לשכיר"</div>
                      </button>
                    </div>
                    {isSelfEmployed === false && (
                      <div className="mt-2 rounded-xl p-2.5 text-xs leading-relaxed" style={{ background:'#fff8e1', border:'1px solid #f59e0b', color:'#92400e' }}>
                        ℹ️ התשלום יעבור דרך שירות "חשבונית לשכיר" — ינוכו ~5% עמלת שירות + מס/ביטוח לאומי/בריאות. תראה הערכת נטו לפני כל משמרת.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-black text-gray-900">סוג המטבח שלך</h2>
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
                              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 text-right transition-all ${sel ? 'bg-amber-50' : 'border-gray-100 bg-white'}`}>
                              <span className="text-2xl flex-shrink-0">{item.icon}</span>
                              <div className="flex-1">
                                <div className={`font-bold text-sm ${sel ? 'text-orange-700' : 'text-gray-900'}`}>{item.id}</div>
                                <div className="text-gray-400 text-xs">{item.desc}</div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'bg-amber-500' : 'border-gray-300'}`}>
                                {sel && <span className="text-white text-xs">✓</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {selectedCuisines.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <span className="text-amber-600 font-semibold text-sm">✓ בחרת {selectedCuisines.length} סגנונות</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="bg-gray-100 rounded-2xl py-4 px-5 text-gray-600">
                  <ChevronRight size={20} />
                </button>
                <button
                  disabled={role === 'worker' ? (!workerRole || isSelfEmployed === null) : selectedCuisines.length === 0}
                  onClick={() => role === 'worker' ? setStep(3) : handleComplete()}
                  className="flex-1 text-white rounded-2xl py-4 font-bold disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}
                >
                  {role === 'restaurant' ? (saving ? 'שומר...' : 'סיים הגדרה') : 'המשך'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Worker: Skills (מותאם לפי תפקיד) */}
          {step === 3 && role === 'worker' && (
            <div className="space-y-3 screen-enter">
              <h2 className="text-xl font-black text-gray-900">במה אתה מתמחה?</h2>
              <p className="text-gray-500 text-sm">בחר הכל שרלוונטי — ככה המסעדות ידעו בדיוק מה אתה מביא</p>

              {(SKILLS_BY_ROLE[workerRole] || []).map(section => (
                <div key={section.group}>
                  <div className="text-xs font-bold text-gray-400 mb-2 mr-1">{section.group}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {section.items.map(item => {
                      const selected = selectedSpecialties.includes(item);
                      return (
                        <button key={item} onClick={() => toggleSpecialty(item)}
                          className={`p-2.5 rounded-xl border-2 text-right transition-all ${selected ? 'border-amber-400 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                          <span className={`text-xs font-semibold leading-tight ${selected ? 'text-amber-600' : 'text-gray-700'}`}>
                            {selected ? '✓ ' : ''}{item}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {selectedSpecialties.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <span className="text-amber-600 font-semibold text-sm">
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
                  className="flex-1 text-white rounded-2xl py-4 font-bold"
                  style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}
                >
                  המשך {selectedSpecialties.length === 0 ? '(דלג)' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Worker: Bio */}
          {step === 4 && role === 'worker' && (
            <div className="space-y-4 screen-enter">
              <h2 className="text-xl font-black text-gray-900">קצת עלייך</h2>
              <p className="text-gray-500 text-sm">כתב 2-3 משפטים שיעזרו למסעדות להכיר אותך</p>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="לדוגמה: שף עם 3 שנות ניסיון, מתמחה במטבח ים תיכוני. גמיש לשעות ומסור לעבודה."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none text-gray-900 text-sm resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="bg-gray-100 rounded-2xl py-4 px-5 text-gray-600">
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 text-white rounded-2xl py-4 font-bold disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#e8a020,#f0c050)' }}
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      שומר...
                    </div>
                  ) : '🚀 סיים ויצא לדרך!'}
                </button>
              </div>
            </div>
          )}
          {saveErr && <div className="mt-3 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5 text-center">{saveErr}</div>}
        </div>
      </div>
      </div>
    </div>
  );
};
