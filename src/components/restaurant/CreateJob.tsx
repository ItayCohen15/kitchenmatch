import React, { useState } from 'react';
import { ChevronRight, Zap, ChefHat, Clock, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { JobRole, ExperienceLevel } from '../../types';

const ROLES: { id: JobRole; label: string; icon: string; desc: string }[] = [
  { id: 'chef',       label: 'שף',      icon: '👨‍🍳', desc: 'שף ראשי / סו-שף' },
  { id: 'line_cook',  label: 'טבח',     icon: '🍳', desc: 'טבח קו / עוזר שף' },
  { id: 'dishwasher', label: 'מדיח',    icon: '🫧', desc: 'מדיח כלים / עוזר מטבח' },
];

const EXPERIENCE: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'entry',  label: 'מתחיל',   desc: 'עד שנתיים ניסיון' },
  { id: 'mid',    label: 'בינוני',  desc: '2–5 שנות ניסיון' },
  { id: 'senior', label: 'מנוסה',   desc: '5+ שנות ניסיון' },
];

export const CreateJob: React.FC = () => {
  const { navToRestaurant, setEmergencyMode } = useApp();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<JobRole | null>(null);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [wage, setWage] = useState('75');
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [emergency, setEmergency] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const totalHours = (() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(1);
  })();

  const totalPay = (parseFloat(totalHours) * parseFloat(wage || '0')).toFixed(0);

  const handlePublish = () => {
    setPublishing(true);
    setEmergencyMode(emergency);
    setTimeout(() => {
      navToRestaurant('worker_matching');
    }, 1800);
  };

  const stepTitles = ['תפקיד', 'שעות', 'תגמול', 'פרסום'];

  return (
    <div className="screen-enter">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {stepTitles.map((t, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full mb-1 transition-colors ${i + 1 <= step ? 'bg-orange-500' : 'bg-gray-200'}`} />
            <div className={`text-xs text-center font-medium ${i + 1 === step ? 'text-orange-500' : 'text-gray-400'}`}>{t}</div>
          </div>
        ))}
      </div>

      {/* Step 1 – Role */}
      {step === 1 && (
        <div className="space-y-3 screen-enter">
          <h2 className="text-xl font-black text-gray-900">איזה תפקיד צריך?</h2>
          <p className="text-gray-500 text-sm">בחר את התפקיד הנדרש לסרוויס</p>
          <div className="space-y-3 mt-4">
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                  role === r.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <span className="text-3xl">{r.icon}</span>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{r.label}</div>
                  <div className="text-gray-500 text-sm">{r.desc}</div>
                </div>
                <div className={`mr-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  role === r.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                }`}>
                  {role === r.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
          <button
            disabled={!role}
            onClick={() => setStep(2)}
            className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-lg mt-4 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 transition-transform"
          >
            המשך
          </button>
        </div>
      )}

      {/* Step 2 – Times */}
      {step === 2 && (
        <div className="space-y-4 screen-enter">
          <h2 className="text-xl font-black text-gray-900">מתי המשמרת?</h2>
          <p className="text-gray-500 text-sm">הגדר שעות התחלה וסיום</p>

          <div className="bg-white rounded-2xl p-5 card-shadow space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">שעת התחלה</label>
              <div className="relative">
                <Clock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 pr-10 pl-4 text-gray-900 font-semibold text-right"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">שעת סיום</label>
              <div className="relative">
                <Clock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-3 pr-10 pl-4 text-gray-900 font-semibold text-right"
                />
              </div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <span className="text-orange-600 font-bold text-lg">{totalHours} שעות</span>
              <span className="text-gray-500 text-sm"> · סה״כ משמרת</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-shrink-0 bg-gray-100 rounded-2xl py-4 px-5 font-bold text-gray-600">
              <ChevronRight size={20} />
            </button>
            <button onClick={() => setStep(3)} className="flex-1 bg-orange-500 text-white rounded-2xl py-4 font-bold text-lg active:scale-98 transition-transform">
              המשך
            </button>
          </div>
        </div>
      )}

      {/* Step 3 – Wage + Experience */}
      {step === 3 && (
        <div className="space-y-4 screen-enter">
          <h2 className="text-xl font-black text-gray-900">תגמול ורמת ניסיון</h2>

          <div className="bg-white rounded-2xl p-5 card-shadow">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">שכר לשעה (₪)</label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₪</span>
              <input
                type="number"
                value={wage}
                onChange={e => setWage(e.target.value)}
                className="w-full border border-gray-200 rounded-xl py-3 pr-10 pl-4 text-gray-900 font-black text-2xl text-right"
                min={30}
                max={300}
              />
            </div>
            <div className="flex gap-2 mt-3">
              {[55, 70, 85, 100].map(v => (
                <button
                  key={v}
                  onClick={() => setWage(String(v))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    wage === String(v) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  ₪{v}
                </button>
              ))}
            </div>
            {wage && (
              <div className="mt-3 bg-green-50 rounded-xl p-3 text-center">
                <span className="text-green-700 font-bold">₪{totalPay}</span>
                <span className="text-gray-500 text-sm"> סה״כ ({totalHours} ש׳ × ₪{wage})</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 card-shadow">
            <label className="text-sm font-semibold text-gray-700 mb-3 block">רמת ניסיון נדרשת</label>
            <div className="space-y-2">
              {EXPERIENCE.map(e => (
                <button
                  key={e.id}
                  onClick={() => setExperience(e.id)}
                  className={`w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                    experience === e.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100'
                  }`}
                >
                  <span className="font-semibold text-gray-800">{e.label}</span>
                  <span className="text-gray-500 text-sm">{e.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-shrink-0 bg-gray-100 rounded-2xl py-4 px-5 font-bold text-gray-600">
              <ChevronRight size={20} />
            </button>
            <button
              disabled={!experience}
              onClick={() => setStep(4)}
              className="flex-1 bg-orange-500 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40 active:scale-98 transition-transform"
            >
              המשך
            </button>
          </div>
        </div>
      )}

      {/* Step 4 – Summary + Publish */}
      {step === 4 && (
        <div className="space-y-4 screen-enter">
          <h2 className="text-xl font-black text-gray-900">סיכום ופרסום</h2>

          <div className="bg-white rounded-2xl p-5 card-shadow space-y-4">
            {[
              { label: 'תפקיד', value: ROLES.find(r => r.id === role)?.label },
              { label: 'שעות', value: `${startTime} – ${endTime} (${totalHours} ש׳)` },
              { label: 'שכר לשעה', value: `₪${wage}` },
              { label: 'סה״כ', value: `₪${totalPay}` },
              { label: 'ניסיון', value: EXPERIENCE.find(e => e.id === experience)?.label },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-500 text-sm">{r.label}</span>
                <span className="font-semibold text-gray-900">{r.value}</span>
              </div>
            ))}

            <div className="bg-gray-50 rounded-xl p-3 text-center text-sm text-gray-500">
              עמלת פלטפורמה: <span className="font-bold text-gray-700">₪{(parseFloat(totalPay) * 0.12).toFixed(0)}</span> (12%)
            </div>
          </div>

          {/* Emergency toggle */}
          <button
            onClick={() => setEmergency(e => !e)}
            className={`w-full rounded-2xl p-4 flex items-center gap-3 border-2 transition-all ${
              emergency
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
          >
            <Zap size={22} className={emergency ? 'fill-white text-white' : 'text-red-500'} />
            <div className="text-right flex-1">
              <div className="font-bold">מצב חירום 🚨</div>
              <div className={`text-sm ${emergency ? 'text-red-100' : 'text-gray-500'}`}>
                עובד תוך 30 דק׳ – דחיפות גבוהה לעובדים קרובים
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${emergency ? 'bg-white/30' : 'bg-gray-200'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${emergency ? '-translate-x-6' : ''}`} />
            </div>
          </button>

          {publishing ? (
            <div className="bg-orange-500 rounded-2xl py-5 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white font-bold text-lg">מחפש עובדים...</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-shrink-0 bg-gray-100 rounded-2xl py-4 px-5 font-bold text-gray-600">
                <ChevronRight size={20} />
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 bg-orange-500 text-white rounded-2xl py-4 font-bold text-lg active:scale-98 transition-transform shadow-lg shadow-orange-200"
              >
                {emergency ? '🚨 פרסם חירום' : 'פרסם משמרת'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
