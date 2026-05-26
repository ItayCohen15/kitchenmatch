import React, { useState } from 'react';
import { ChevronRight, ChefHat, Store } from 'lucide-react';
import { api } from '../api';

interface Props {
  role: 'restaurant' | 'worker';
  userId: number;
  profileId: number;
  onComplete: (profile: any) => void;
}

const WORKER_ROLES = [
  { id: 'chef',       label: 'שף',    icon: '👨‍🍳', desc: 'שף ראשי / סו-שף' },
  { id: 'line_cook',  label: 'טבח',   icon: '🍳', desc: 'טבח קו / עוזר שף' },
  { id: 'dishwasher', label: 'מדיח',  icon: '🫧', desc: 'מדיח / עוזר מטבח' },
];

const SPECIALTIES = [
  // סוגי מסעדות
  { id: 'מסעדת שף / גורמה',   icon: '⭐', group: 'סוג מסעדה' },
  { id: 'בית קפה',             icon: '☕', group: 'סוג מסעדה' },
  { id: 'ביסטרו / מזון מהיר',  icon: '🍔', group: 'סוג מסעדה' },
  { id: 'קייטרינג / אירועים',  icon: '🎉', group: 'סוג מסעדה' },
  // מטבחים
  { id: 'ים תיכוני',           icon: '🌊', group: 'מטבח' },
  { id: 'איטלקי / פסטה',       icon: '🍝', group: 'מטבח' },
  { id: 'יפני / סושי',         icon: '🍣', group: 'מטבח' },
  { id: 'אסייתי',              icon: '🥢', group: 'מטבח' },
  { id: 'מזרח תיכוני / ערבי',  icon: '🧆', group: 'מטבח' },
  { id: 'צרפתי / אירופאי',     icon: '🥐', group: 'מטבח' },
  { id: 'מקסיקני / לטיני',     icon: '🌮', group: 'מטבח' },
  { id: 'אמריקאי',             icon: '🍖', group: 'מטבח' },
  // התמחויות
  { id: 'בשרים / גריל',        icon: '🥩', group: 'התמחות' },
  { id: 'דגים / פירות ים',     icon: '🐟', group: 'התמחות' },
  { id: 'ארוחות בוקר / ברנץ׳', icon: '🥚', group: 'התמחות' },
  { id: 'פיצה',                icon: '🍕', group: 'התמחות' },
  { id: 'קינוחים / קונדיטוריה', icon: '🍰', group: 'התמחות' },
  { id: 'צמחוני / טבעוני',     icon: '🥗', group: 'התמחות' },
  { id: 'לחמים / מאפים',       icon: '🥖', group: 'התמחות' },
  { id: 'קוקטיילים / בר',      icon: '🍹', group: 'התמחות' },
];

export const Onboarding: React.FC<Props> = ({ role, userId, profileId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState('60');
  const [yearsExp, setYearsExp] = useState('1');
  const [bio, setBio] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

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
    try {
      let updatedProfile: any = { Id: profileId, Name: name, City: city };

      if (role === 'worker') {
        const res = await api.updateWorker(profileId, {
          name, city, role: workerRole,
          hourlyRate: parseFloat(hourlyRate), bio,
          yearsExp: parseInt(yearsExp),
          skills: selectedSpecialties.join(','),
          phone,
        });
        // השתמש בפרופיל מהשרת אם קיים
        updatedProfile = res?.profile || {
          ...updatedProfile,
          Skills: selectedSpecialties.join(','), Role: workerRole,
          HourlyRate: parseFloat(hourlyRate), Bio: bio,
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
    } catch (e) {
      // ממשיך גם בשגיאה
      onComplete({ Id: profileId, Name: name, City: city });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-amber-600 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            {role === 'worker' ? <ChefHat size={36} className="text-white" /> : <Store size={36} className="text-white" />}
          </div>
          <h1 className="text-2xl font-black text-white">ברוך הבא!</h1>
          <p className="text-amber-100 text-sm mt-1">בוא נגדיר את הפרופיל שלך</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${i + 1 <= step ? 'bg-white' : 'bg-white/30'}`}
            />
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
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="הקלד עיר..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none text-gray-900 font-medium mb-2"
                />
                <div className="flex gap-2 flex-wrap">
                  {['תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה', 'נתניה', 'אשדוד', 'באר שבע', 'רמת גן', 'חולון', 'בת ים', 'לוד', 'רמלה'].map(c => (
                    <button
                      key={c}
                      onClick={() => setCity(c)}
                      className={`py-1.5 px-3 rounded-full text-xs font-semibold transition-colors ${
                        city === c ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
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
                    <input
                      type="text"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      placeholder="שם הרחוב"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none"
                    />
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
                className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-40 mt-2"
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
                  <h2 className="text-xl font-black text-gray-900">תפקיד ושכר</h2>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">תפקיד ראשי</label>
                    <div className="space-y-2">
                      {WORKER_ROLES.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setWorkerRole(r.id)}
                          className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 text-right transition-all ${
                            workerRole === r.id ? 'border-orange-500 bg-amber-50' : 'border-gray-100'
                          }`}
                        >
                          <span className="text-2xl">{r.icon}</span>
                          <div>
                            <div className="font-bold text-gray-900">{r.label}</div>
                            <div className="text-gray-500 text-xs">{r.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">שכר מבוקש לשעה (₪)</label>
                    <div className="flex gap-2">
                      {[45, 55, 65, 75, 90].map(v => (
                        <button
                          key={v}
                          onClick={() => setHourlyRate(String(v))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            hourlyRate === String(v) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          ₪{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">שנות ניסיון</label>
                    <div className="flex gap-2">
                      {['1', '2', '3', '5', '8+'].map(v => (
                        <button
                          key={v}
                          onClick={() => setYearsExp(v.replace('+', ''))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            yearsExp === v.replace('+', '') ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
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
                              className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 text-right transition-all ${sel ? 'border-orange-500 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                              <span className="text-2xl flex-shrink-0">{item.icon}</span>
                              <div className="flex-1">
                                <div className={`font-bold text-sm ${sel ? 'text-orange-700' : 'text-gray-900'}`}>{item.id}</div>
                                <div className="text-gray-400 text-xs">{item.desc}</div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'border-orange-500 bg-amber-500' : 'border-gray-300'}`}>
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
                  disabled={role === 'worker' ? !workerRole : selectedCuisines.length === 0}
                  onClick={() => role === 'worker' ? setStep(3) : handleComplete()}
                  className="flex-1 bg-amber-500 text-white rounded-2xl py-4 font-bold disabled:opacity-40"
                >
                  {role === 'restaurant' ? (saving ? 'שומר...' : 'סיים הגדרה') : 'המשך'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Worker: Specialties */}
          {step === 3 && role === 'worker' && (
            <div className="space-y-3 screen-enter">
              <h2 className="text-xl font-black text-gray-900">במה אתה מתמחה?</h2>
              <p className="text-gray-500 text-sm">בחר הכל שרלוונטי — ככה יופיעו לך המשמרות הנכונות</p>

              {/* קבוצת סוג מסעדה */}
              <div>
                <div className="text-xs font-bold text-gray-400 mb-2 mr-1">סוג מסעדה</div>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.filter(s => s.group === 'סוג מסעדה').map(s => {
                    const selected = selectedSpecialties.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => toggleSpecialty(s.id)}
                        className={`p-2.5 rounded-xl border-2 flex items-center gap-2 text-right transition-all ${selected ? 'border-orange-500 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                        <span className="text-lg">{s.icon}</span>
                        <span className={`text-xs font-semibold flex-1 leading-tight ${selected ? 'text-amber-600' : 'text-gray-700'}`}>{s.id}</span>
                        {selected && <span className="text-amber-500 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* קבוצת מטבח */}
              <div>
                <div className="text-xs font-bold text-gray-400 mb-2 mr-1">סוג מטבח</div>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.filter(s => s.group === 'מטבח').map(s => {
                    const selected = selectedSpecialties.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => toggleSpecialty(s.id)}
                        className={`p-2.5 rounded-xl border-2 flex items-center gap-2 text-right transition-all ${selected ? 'border-orange-500 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                        <span className="text-lg">{s.icon}</span>
                        <span className={`text-xs font-semibold flex-1 leading-tight ${selected ? 'text-amber-600' : 'text-gray-700'}`}>{s.id}</span>
                        {selected && <span className="text-amber-500 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* קבוצת התמחות */}
              <div>
                <div className="text-xs font-bold text-gray-400 mb-2 mr-1">התמחות ספציפית</div>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.filter(s => s.group === 'התמחות').map(s => {
                    const selected = selectedSpecialties.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => toggleSpecialty(s.id)}
                        className={`p-2.5 rounded-xl border-2 flex items-center gap-2 text-right transition-all ${selected ? 'border-orange-500 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                        <span className="text-lg">{s.icon}</span>
                        <span className={`text-xs font-semibold flex-1 leading-tight ${selected ? 'text-amber-600' : 'text-gray-700'}`}>{s.id}</span>
                        {selected && <span className="text-amber-500 text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedSpecialties.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 text-center sticky bottom-0">
                  <span className="text-amber-600 font-semibold text-sm">
                    ✓ בחרת {selectedSpecialties.length} התמחויות
                  </span>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="bg-gray-100 rounded-2xl py-4 px-5 text-gray-600">
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-amber-500 text-white rounded-2xl py-4 font-bold"
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
                  className="flex-1 bg-amber-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
};
