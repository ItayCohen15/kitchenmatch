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
  { id: 'chef',       label: '׳©׳£',    icon: 'נ‘¨ג€נ³', desc: '׳©׳£ ׳¨׳׳©׳™ / ׳¡׳•-׳©׳£' },
  { id: 'line_cook',  label: '׳˜׳‘׳—',   icon: 'נ³', desc: '׳˜׳‘׳— ׳§׳• / ׳¢׳•׳–׳¨ ׳©׳£' },
  { id: 'dishwasher', label: '׳׳“׳™׳—',  icon: 'נ«§', desc: '׳׳“׳™׳— / ׳¢׳•׳–׳¨ ׳׳˜׳‘׳—' },
];

const SPECIALTIES = [
  // ׳¡׳•׳’׳™ ׳׳¡׳¢׳“׳•׳×
  { id: '׳׳¡׳¢׳“׳× ׳©׳£ / ׳’׳•׳¨׳׳”',   icon: 'ג­', group: '׳¡׳•׳’ ׳׳¡׳¢׳“׳”' },
  { id: '׳‘׳™׳× ׳§׳₪׳”',             icon: 'ג˜•', group: '׳¡׳•׳’ ׳׳¡׳¢׳“׳”' },
  { id: '׳‘׳™׳¡׳˜׳¨׳• / ׳׳–׳•׳ ׳׳”׳™׳¨',  icon: 'נ”', group: '׳¡׳•׳’ ׳׳¡׳¢׳“׳”' },
  { id: '׳§׳™׳™׳˜׳¨׳™׳ ׳’ / ׳׳™׳¨׳•׳¢׳™׳',  icon: 'נ‰', group: '׳¡׳•׳’ ׳׳¡׳¢׳“׳”' },
  // ׳׳˜׳‘׳—׳™׳
  { id: '׳™׳ ׳×׳™׳›׳•׳ ׳™',           icon: 'נ', group: '׳׳˜׳‘׳—' },
  { id: '׳׳™׳˜׳׳§׳™ / ׳₪׳¡׳˜׳”',       icon: 'נ', group: '׳׳˜׳‘׳—' },
  { id: '׳™׳₪׳ ׳™ / ׳¡׳•׳©׳™',         icon: 'נ£', group: '׳׳˜׳‘׳—' },
  { id: '׳׳¡׳™׳™׳×׳™',              icon: 'נ¥¢', group: '׳׳˜׳‘׳—' },
  { id: '׳׳–׳¨׳— ׳×׳™׳›׳•׳ ׳™ / ׳¢׳¨׳‘׳™',  icon: 'נ§†', group: '׳׳˜׳‘׳—' },
  { id: '׳¦׳¨׳₪׳×׳™ / ׳׳™׳¨׳•׳₪׳׳™',     icon: 'נ¥', group: '׳׳˜׳‘׳—' },
  { id: '׳׳§׳¡׳™׳§׳ ׳™ / ׳׳˜׳™׳ ׳™',     icon: 'נ®', group: '׳׳˜׳‘׳—' },
  { id: '׳׳׳¨׳™׳§׳׳™',             icon: 'נ–', group: '׳׳˜׳‘׳—' },
  // ׳”׳×׳׳—׳•׳™׳•׳×
  { id: '׳‘׳©׳¨׳™׳ / ׳’׳¨׳™׳',        icon: 'נ¥©', group: '׳”׳×׳׳—׳•׳×' },
  { id: '׳“׳’׳™׳ / ׳₪׳™׳¨׳•׳× ׳™׳',     icon: 'נ', group: '׳”׳×׳׳—׳•׳×' },
  { id: '׳׳¨׳•׳—׳•׳× ׳‘׳•׳§׳¨ / ׳‘׳¨׳ ׳¥׳³', icon: 'נ¥', group: '׳”׳×׳׳—׳•׳×' },
  { id: '׳₪׳™׳¦׳”',                icon: 'נ•', group: '׳”׳×׳׳—׳•׳×' },
  { id: '׳§׳™׳ ׳•׳—׳™׳ / ׳§׳•׳ ׳“׳™׳˜׳•׳¨׳™׳”', icon: 'נ°', group: '׳”׳×׳׳—׳•׳×' },
  { id: '׳¦׳׳—׳•׳ ׳™ / ׳˜׳‘׳¢׳•׳ ׳™',     icon: 'נ¥—', group: '׳”׳×׳׳—׳•׳×' },
  { id: '׳׳—׳׳™׳ / ׳׳׳₪׳™׳',       icon: 'נ¥–', group: '׳”׳×׳׳—׳•׳×' },
  { id: '׳§׳•׳§׳˜׳™׳™׳׳™׳ / ׳‘׳¨',      icon: 'נ¹', group: '׳”׳×׳׳—׳•׳×' },
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
        // ׳”׳©׳×׳׳© ׳‘׳₪׳¨׳•׳₪׳™׳ ׳׳”׳©׳¨׳× ׳׳ ׳§׳™׳™׳
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
      // ׳׳׳©׳™׳ ׳’׳ ׳‘׳©׳’׳™׳׳”
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
          <h1 className="text-2xl font-black text-white">׳‘׳¨׳•׳ ׳”׳‘׳!</h1>
          <p className="text-amber-100 text-sm mt-1">׳‘׳•׳ ׳ ׳’׳“׳™׳¨ ׳׳× ׳”׳₪׳¨׳•׳₪׳™׳ ׳©׳׳</p>
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

          {/* Step 1 ג€” Name + City */}
          {step === 1 && (
            <div className="space-y-4 screen-enter">
              <h2 className="text-xl font-black text-gray-900">
                {role === 'worker' ? '׳₪׳¨׳˜׳™׳ ׳׳™׳©׳™׳™׳' : '׳₪׳¨׳˜׳™ ׳”׳׳¡׳¢׳“׳”'}
              </h2>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">
                  {role === 'worker' ? '׳©׳ ׳׳׳' : '׳©׳ ׳”׳׳¡׳¢׳“׳”'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === 'worker' ? '׳™׳©׳¨׳׳ ׳™׳©׳¨׳׳׳™' : '׳׳¡׳¢׳“׳× ׳”׳’׳'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none text-gray-900 font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">׳¢׳™׳¨</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="׳”׳§׳׳“ ׳¢׳™׳¨..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none text-gray-900 font-medium mb-2"
                />
                <div className="flex gap-2 flex-wrap">
                  {['׳×׳ ׳׳‘׳™׳‘', '׳™׳¨׳•׳©׳׳™׳', '׳—׳™׳₪׳”', '׳¨׳׳©׳•׳ ׳׳¦׳™׳•׳', '׳₪׳×׳— ׳×׳§׳•׳•׳”', '׳ ׳×׳ ׳™׳”', '׳׳©׳“׳•׳“', '׳‘׳׳¨ ׳©׳‘׳¢', '׳¨׳׳× ׳’׳', '׳—׳•׳׳•׳', '׳‘׳× ׳™׳', '׳׳•׳“', '׳¨׳׳׳”'].map(c => (
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
                <label className="text-sm font-semibold text-gray-600 mb-1.5 block">נ“ ׳׳¡׳₪׳¨ ׳˜׳׳₪׳•׳</label>
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
                  <label className="text-sm font-semibold text-gray-600 mb-1.5 block">׳›׳×׳•׳‘׳× ׳”׳׳¡׳¢׳“׳”</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      placeholder="׳©׳ ׳”׳¨׳—׳•׳‘"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={streetNumber}
                      onChange={e => setStreetNumber(e.target.value)}
                      placeholder="׳׳¡׳³"
                      className="w-20 border border-gray-200 rounded-xl px-3 py-3 text-right focus:border-amber-400 outline-none"
                    />
                  </div>
                  {street && streetNumber && (
                    <div className="mt-1.5 text-xs text-green-600 font-semibold flex items-center gap-1">
                      נ“ {street} {streetNumber}, {city}
                    </div>
                  )}
                </div>
              )}
              <button
                disabled={!name || !city}
                onClick={() => role === 'restaurant' && totalSteps === 2 ? setStep(2) : setStep(2)}
                className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-40 mt-2"
              >
                ׳”׳׳©׳
              </button>
            </div>
          )}

          {/* Step 2 ג€” Worker: Role + Rate | Restaurant: Cuisine */}
          {step === 2 && (
            <div className="space-y-4 screen-enter">
              {role === 'worker' ? (
                <>
                  <h2 className="text-xl font-black text-gray-900">׳×׳₪׳§׳™׳“ ׳•׳©׳›׳¨</h2>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">׳×׳₪׳§׳™׳“ ׳¨׳׳©׳™</label>
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
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">׳©׳›׳¨ ׳׳‘׳•׳§׳© ׳׳©׳¢׳” (ג‚×)</label>
                    <div className="flex gap-2">
                      {[45, 55, 65, 75, 90].map(v => (
                        <button
                          key={v}
                          onClick={() => setHourlyRate(String(v))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                            hourlyRate === String(v) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          ג‚×{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">׳©׳ ׳•׳× ׳ ׳™׳¡׳™׳•׳</label>
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
                  <h2 className="text-xl font-black text-gray-900">׳¡׳•׳’ ׳”׳׳˜׳‘׳— ׳©׳׳</h2>
                  <p className="text-gray-500 text-sm">׳‘׳—׳¨ ׳”׳›׳ ׳©׳׳×׳׳™׳ ג€” ׳׳₪׳©׳¨ ׳׳‘׳—׳•׳¨ ׳›׳׳”</p>

                  {[
                    { group: '׳¡׳•׳’ ׳”׳׳¡׳’׳¨׳×', items: [
                      { id: '׳׳¡׳¢׳“׳× ׳©׳£',    icon: 'ג­', desc: '׳’׳•׳¨׳׳” / ׳₪׳™׳™׳ ׳“׳™׳™׳ ׳™׳ ׳’' },
                      { id: '׳‘׳™׳× ׳§׳₪׳”',     icon: 'ג˜•', desc: '׳§׳₪׳”, ׳׳¨׳•׳—׳•׳× ׳‘׳•׳§׳¨, ׳׳ ׳•׳× ׳§׳׳•׳×' },
                      { id: '׳‘׳™׳¡׳˜׳¨׳•',      icon: 'נ½ן¸', desc: '׳׳¡׳¢׳“׳” ׳§׳–׳³׳•׳׳, ׳×׳₪׳¨׳™׳˜ ׳§׳‘׳•׳¢' },
                      { id: '׳‘׳¨ / ׳₪׳׳‘',    icon: 'נ÷', desc: '׳׳׳›׳•׳”׳•׳, ׳׳•׳›׳ ׳׳׳•׳•׳”' },
                      { id: '׳§׳™׳™׳˜׳¨׳™׳ ׳’',   icon: 'נ‰', desc: '׳׳™׳¨׳•׳¢׳™׳, ׳—׳×׳•׳ ׳•׳×, ׳•׳¢׳™׳“׳•׳×' },
                      { id: '׳׳–׳•׳ ׳׳”׳™׳¨',   icon: 'נ”', desc: '׳₪׳׳¡׳˜ ׳₪׳•׳“, ׳׳©׳׳•׳—׳™׳' },
                    ]},
                    { group: '׳¡׳’׳ ׳•׳ ׳׳˜׳‘׳—', items: [
                      { id: '׳™׳ ׳×׳™׳›׳•׳ ׳™',     icon: 'נ', desc: '׳™׳©׳¨׳׳׳™, ׳™׳•׳•׳ ׳™, ׳׳‘׳ ׳•׳ ׳™' },
                      { id: '׳׳™׳˜׳׳§׳™',        icon: 'נ', desc: '׳₪׳¡׳˜׳”, ׳¨׳™׳–׳•׳˜׳•, ׳₪׳™׳¦׳”' },
                      { id: '׳™׳₪׳ ׳™ / ׳¡׳•׳©׳™',   icon: 'נ£', desc: '׳¡׳•׳©׳™, ׳¨׳׳׳, ׳˜׳₪׳ ׳™׳׳§׳™' },
                      { id: '׳׳¡׳™׳™׳×׳™',        icon: 'נ¥¢', desc: '׳×׳׳™׳׳ ׳“׳™, ׳¡׳™׳ ׳™, ׳•׳™׳™׳˜׳ ׳׳׳™' },
                      { id: '׳׳–׳¨׳— ׳×׳™׳›׳•׳ ׳™',   icon: 'נ§†', desc: '׳׳‘׳ ׳•׳ ׳™, ׳˜׳•׳¨׳§׳™, ׳׳¨׳•׳§׳׳™' },
                      { id: '׳‘׳©׳¨׳™׳ / ׳’׳¨׳™׳',  icon: 'נ¥©', desc: '׳¡׳˜׳™׳™׳§׳™׳, ׳©׳™׳₪׳•׳“׳™׳, BBQ' },
                      { id: '׳“׳’׳™׳ / ׳™׳',     icon: 'נ', desc: '׳₪׳™׳¨׳•׳× ׳™׳, ׳“׳’׳™׳ ׳˜׳¨׳™׳™׳' },
                      { id: '׳¦׳׳—׳•׳ ׳™ / ׳˜׳‘׳¢׳•׳ ׳™', icon: 'נ¥—', desc: '׳×׳₪׳¨׳™׳˜ plant-based' },
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
                                {sel && <span className="text-white text-xs">ג“</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {selectedCuisines.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <span className="text-amber-600 font-semibold text-sm">ג“ ׳‘׳—׳¨׳× {selectedCuisines.length} ׳¡׳’׳ ׳•׳ ׳•׳×</span>
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
                  {role === 'restaurant' ? (saving ? '׳©׳•׳׳¨...' : '׳¡׳™׳™׳ ׳”׳’׳“׳¨׳”') : '׳”׳׳©׳'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 ג€” Worker: Specialties */}
          {step === 3 && role === 'worker' && (
            <div className="space-y-3 screen-enter">
              <h2 className="text-xl font-black text-gray-900">׳‘׳׳” ׳׳×׳” ׳׳×׳׳—׳”?</h2>
              <p className="text-gray-500 text-sm">׳‘׳—׳¨ ׳”׳›׳ ׳©׳¨׳׳•׳•׳ ׳˜׳™ ג€” ׳›׳›׳” ׳™׳•׳₪׳™׳¢׳• ׳׳ ׳”׳׳©׳׳¨׳•׳× ׳”׳ ׳›׳•׳ ׳•׳×</p>

              {/* ׳§׳‘׳•׳¦׳× ׳¡׳•׳’ ׳׳¡׳¢׳“׳” */}
              <div>
                <div className="text-xs font-bold text-gray-400 mb-2 mr-1">׳¡׳•׳’ ׳׳¡׳¢׳“׳”</div>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.filter(s => s.group === '׳¡׳•׳’ ׳׳¡׳¢׳“׳”').map(s => {
                    const selected = selectedSpecialties.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => toggleSpecialty(s.id)}
                        className={`p-2.5 rounded-xl border-2 flex items-center gap-2 text-right transition-all ${selected ? 'border-orange-500 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                        <span className="text-lg">{s.icon}</span>
                        <span className={`text-xs font-semibold flex-1 leading-tight ${selected ? 'text-amber-600' : 'text-gray-700'}`}>{s.id}</span>
                        {selected && <span className="text-amber-500 text-xs">ג“</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ׳§׳‘׳•׳¦׳× ׳׳˜׳‘׳— */}
              <div>
                <div className="text-xs font-bold text-gray-400 mb-2 mr-1">׳¡׳•׳’ ׳׳˜׳‘׳—</div>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.filter(s => s.group === '׳׳˜׳‘׳—').map(s => {
                    const selected = selectedSpecialties.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => toggleSpecialty(s.id)}
                        className={`p-2.5 rounded-xl border-2 flex items-center gap-2 text-right transition-all ${selected ? 'border-orange-500 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                        <span className="text-lg">{s.icon}</span>
                        <span className={`text-xs font-semibold flex-1 leading-tight ${selected ? 'text-amber-600' : 'text-gray-700'}`}>{s.id}</span>
                        {selected && <span className="text-amber-500 text-xs">ג“</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ׳§׳‘׳•׳¦׳× ׳”׳×׳׳—׳•׳× */}
              <div>
                <div className="text-xs font-bold text-gray-400 mb-2 mr-1">׳”׳×׳׳—׳•׳× ׳¡׳₪׳¦׳™׳₪׳™׳×</div>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.filter(s => s.group === '׳”׳×׳׳—׳•׳×').map(s => {
                    const selected = selectedSpecialties.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => toggleSpecialty(s.id)}
                        className={`p-2.5 rounded-xl border-2 flex items-center gap-2 text-right transition-all ${selected ? 'border-orange-500 bg-amber-50' : 'border-gray-100 bg-white'}`}>
                        <span className="text-lg">{s.icon}</span>
                        <span className={`text-xs font-semibold flex-1 leading-tight ${selected ? 'text-amber-600' : 'text-gray-700'}`}>{s.id}</span>
                        {selected && <span className="text-amber-500 text-xs">ג“</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedSpecialties.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 text-center sticky bottom-0">
                  <span className="text-amber-600 font-semibold text-sm">
                    ג“ ׳‘׳—׳¨׳× {selectedSpecialties.length} ׳”׳×׳׳—׳•׳™׳•׳×
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
                  ׳”׳׳©׳ {selectedSpecialties.length === 0 ? '(׳“׳׳’)' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 ג€” Worker: Bio */}
          {step === 4 && role === 'worker' && (
            <div className="space-y-4 screen-enter">
              <h2 className="text-xl font-black text-gray-900">׳§׳¦׳× ׳¢׳׳™׳™׳</h2>
              <p className="text-gray-500 text-sm">׳›׳×׳‘ 2-3 ׳׳©׳₪׳˜׳™׳ ׳©׳™׳¢׳–׳¨׳• ׳׳׳¡׳¢׳“׳•׳× ׳׳”׳›׳™׳¨ ׳׳•׳×׳</p>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="׳׳“׳•׳’׳׳”: ׳©׳£ ׳¢׳ 3 ׳©׳ ׳•׳× ׳ ׳™׳¡׳™׳•׳, ׳׳×׳׳—׳” ׳‘׳׳˜׳‘׳— ׳™׳ ׳×׳™׳›׳•׳ ׳™. ׳’׳׳™׳© ׳׳©׳¢׳•׳× ׳•׳׳¡׳•׳¨ ׳׳¢׳‘׳•׳“׳”."
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
                      ׳©׳•׳׳¨...
                    </div>
                  ) : 'נ€ ׳¡׳™׳™׳ ׳•׳™׳¦׳ ׳׳“׳¨׳!'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

