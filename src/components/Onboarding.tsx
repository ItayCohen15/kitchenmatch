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
  { id: 'chef',       label: 'שף',        icon: '👨‍🍳', desc: 'שף ראשי / סו-שף' },
  { id: 'line_cook',  label: 'טבח',       icon: '🍳', desc: 'טבח קו / עוזר שף' },
  { id: 'dishwasher', label: 'מדיח',      icon: '🫧', desc: 'מדיח / עוזר מטבח' },
];

const CITIES = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'רמת גן', 'פתח תקווה', 'נתניה', 'אשדוד', 'ראשון לציון', 'רחובות', 'חולון', 'בת ים', 'לוד', 'רמלה', 'אחר'];

export const Onboarding: React.FC<Props> = ({ role, userId, profileId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [hourlyRate, setHourlyRate] = useState('60');
  const [yearsExp, setYearsExp] = useState('1');
  const [bio, setBio] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const totalSteps = role === 'worker' ? 3 : 2;

  const handleComplete = async () => {
    setSaving(true);
    try {
      let updatedProfile: any = { Id: profileId, Name: name, City: city };

      if (role === 'worker') {
        await api.updateWorker(profileId, {
          name, city,
          role: workerRole,
          hourlyRate: parseFloat(hourlyRate),
          bio,
          yearsExp: parseInt(yearsExp),
        });
        updatedProfile = {
          ...updatedProfile,
          Role: workerRole,
          HourlyRate: parseFloat(hourlyRate),
          Bio: bio,
          YearsExp: parseInt(yearsExp),
          Level: 'bronze',
          Rating: 0,
          CompletedShifts: 0,
          ReliabilityScore: 100,
          NoShows: 0,
          IsAvailable: true,
        };
      } else {
        await api.updateRestaurant(profileId, { name, city, cuisineType, address });
        updatedProfile = { ...updatedProfile, CuisineType: cuisineType, Address: address, WalletBalance: 0 };
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
          <p className="text-orange-100 text-sm mt-1">בוא נגדיר את הפרופיל שלך</p>
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none text-gray-900 font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">עיר</label>
                <div className="grid grid-cols-3 gap-2">
                  {CITIES.slice(0, 9).map(c => (
                    <button
                      key={c}
                      onClick={() => setCity(c)}
                      className={`py-2 px-3 rounded-xl text-sm font-semibold transition-colors ${
                        city === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {role === 'restaurant' && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1.5 block">כתובת</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="רחוב ומספר"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none"
                  />
                </div>
              )}
              <button
                disabled={!name || !city}
                onClick={() => role === 'restaurant' && totalSteps === 2 ? setStep(2) : setStep(2)}
                className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-40 mt-2"
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
                            workerRole === r.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100'
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
                            hourlyRate === String(v) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
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
                            yearsExp === v.replace('+', '') ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
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
                  <h2 className="text-xl font-black text-gray-900">סוג המטבח</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {['ים תיכוני', 'איטלקי', 'יפני / סושי', 'בשרים', 'שף / גורמה', 'קפה ובוקר', 'פיצה', 'מזרח תיכון', 'ממזרח', 'אחר'].map(c => (
                      <button
                        key={c}
                        onClick={() => setCuisineType(c)}
                        className={`py-3 px-4 rounded-xl text-sm font-semibold transition-colors text-right ${
                          cuisineType === c ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="bg-gray-100 rounded-2xl py-4 px-5 text-gray-600">
                  <ChevronRight size={20} />
                </button>
                <button
                  disabled={role === 'worker' ? !workerRole : !cuisineType}
                  onClick={() => role === 'worker' ? setStep(3) : handleComplete()}
                  className="flex-1 bg-orange-500 text-white rounded-2xl py-4 font-bold disabled:opacity-40"
                >
                  {role === 'restaurant' ? (saving ? 'שומר...' : 'סיים הגדרה') : 'המשך'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Worker: Bio */}
          {step === 3 && role === 'worker' && (
            <div className="space-y-4 screen-enter">
              <h2 className="text-xl font-black text-gray-900">קצת עלייך</h2>
              <p className="text-gray-500 text-sm">כתב 2-3 משפטים שיעזרו למסעדות להכיר אותך</p>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="לדוגמה: שף עם 3 שנות ניסיון, מתמחה במטבח ים תיכוני. גמיש לשעות ומסור לעבודה."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none text-gray-900 text-sm resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="bg-gray-100 rounded-2xl py-4 px-5 text-gray-600">
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 bg-orange-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50"
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
