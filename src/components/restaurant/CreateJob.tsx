import React, { useState } from 'react';
import { ChevronRight, Zap, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import type { JobRole, ExperienceLevel } from '../../types';

const ROLES: { id: JobRole; label: string; icon: string; desc: string }[] = [
  { id: 'chef',       label: '׳©׳£',      icon: 'נ‘¨ג€נ³', desc: '׳©׳£ ׳¨׳׳©׳™ / ׳¡׳•-׳©׳£' },
  { id: 'line_cook',  label: '׳˜׳‘׳—',     icon: 'נ³', desc: '׳˜׳‘׳— ׳§׳• / ׳¢׳•׳–׳¨ ׳©׳£' },
  { id: 'dishwasher', label: '׳׳“׳™׳—',    icon: 'נ«§', desc: '׳׳“׳™׳— ׳›׳׳™׳ / ׳¢׳•׳–׳¨ ׳׳˜׳‘׳—' },
];

const EXPERIENCE: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'entry',  label: '׳׳×׳—׳™׳',   desc: '׳¢׳“ ׳©׳ ׳×׳™׳™׳ ׳ ׳™׳¡׳™׳•׳' },
  { id: 'mid',    label: '׳‘׳™׳ ׳•׳ ׳™',  desc: '2ג€“5 ׳©׳ ׳•׳× ׳ ׳™׳¡׳™׳•׳' },
  { id: 'senior', label: '׳׳ ׳•׳¡׳”',   desc: '5+ ׳©׳ ׳•׳× ׳ ׳™׳¡׳™׳•׳' },
];

export const CreateJob: React.FC = () => {
  const { navToRestaurant, setEmergencyMode, userProfile } = useApp();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<JobRole | null>(null);
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [wage, setWage] = useState('75');
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [emergency, setEmergency] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  const totalHours = (() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(1);
  })();

  const totalPay = (parseFloat(totalHours) * parseFloat(wage || '0')).toFixed(0);

  const handlePublish = async () => {
    if (!userProfile?.Id) {
      setPublishError('׳©׳’׳™׳׳”: ׳₪׳¨׳•׳₪׳™׳ ׳׳¡׳¢׳“׳” ׳׳ ׳ ׳׳¦׳. ׳ ׳¡׳” ׳׳”׳×׳ ׳×׳§ ׳•׳׳”׳×׳—׳‘׳¨ ׳׳—׳“׳©.');
      return;
    }
    setPublishing(true);
    setPublishError('');
    setEmergencyMode(emergency);
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startDate = new Date(`${shiftDate}T${startTime}:00`);
      const endDate   = new Date(`${shiftDate}T${endTime}:00`);
      if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);

      await api.createJob({
        restaurantId: userProfile.Id,
        role: role || 'chef',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        hourlyRate: parseFloat(wage),
        isEmergency: emergency,
        description: instructions,
      });

      setTimeout(() => {
        navToRestaurant('worker_matching');
      }, 800);
    } catch (e: any) {
      setPublishing(false);
      setPublishError(e.message || '׳©׳’׳™׳׳” ׳‘׳₪׳¨׳¡׳•׳ ׳”׳׳©׳׳¨׳×. ׳ ׳¡׳” ׳©׳•׳‘.');
    }
  };

  const stepTitles = ['׳×׳₪׳§׳™׳“', '׳©׳¢׳•׳×', '׳×׳’׳׳•׳', '׳₪׳¨׳¡׳•׳'];

  return (
    <div className="screen-enter">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {stepTitles.map((t, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full mb-1 transition-colors ${i + 1 <= step ? 'bg-amber-500' : 'bg-gray-200'}`} />
            <div className={`text-xs text-center font-medium ${i + 1 === step ? 'text-amber-500' : 'text-gray-400'}`}>{t}</div>
          </div>
        ))}
      </div>

      {/* Step 1 ג€“ Role */}
      {step === 1 && (
        <div className="space-y-3 screen-enter">
          <h2 className="text-xl font-black text-gray-900">׳׳™׳–׳” ׳×׳₪׳§׳™׳“ ׳¦׳¨׳™׳?</h2>
          <p className="text-gray-500 text-sm">׳‘׳—׳¨ ׳׳× ׳”׳×׳₪׳§׳™׳“ ׳”׳ ׳“׳¨׳© ׳׳¡׳¨׳•׳•׳™׳¡</p>
          <div className="space-y-3 mt-4">
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                  role === r.id
                    ? 'border-orange-500 bg-amber-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <span className="text-3xl">{r.icon}</span>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{r.label}</div>
                  <div className="text-gray-500 text-sm">{r.desc}</div>
                </div>
                <div className={`mr-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  role === r.id ? 'border-orange-500 bg-amber-500' : 'border-gray-300'
                }`}>
                  {role === r.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
          <button
            disabled={!role}
            onClick={() => setStep(2)}
            className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg mt-4 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 transition-transform"
          >
            ׳”׳׳©׳
          </button>
        </div>
      )}

      {/* Step 2 ג€“ Times */}
      {step === 2 && (
        <div className="space-y-4 screen-enter">
          <h2 className="text-xl font-black text-gray-900">׳׳×׳™ ׳”׳׳©׳׳¨׳×?</h2>
          <p className="text-gray-500 text-sm">׳”׳’׳“׳¨ ׳©׳¢׳•׳× ׳”׳×׳—׳׳” ׳•׳¡׳™׳•׳</p>

          <div className="bg-white rounded-2xl p-5 card-shadow space-y-4">
            {/* ׳×׳׳¨׳™׳ */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">נ“… ׳×׳׳¨׳™׳ ׳”׳׳©׳׳¨׳×</label>
              <input
                type="date"
                value={shiftDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setShiftDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl py-3 px-4 text-gray-900 font-semibold"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">׳©׳¢׳× ׳”׳×׳—׳׳”</label>
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
              <label className="text-sm font-semibold text-gray-700 mb-2 block">׳©׳¢׳× ׳¡׳™׳•׳</label>
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
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <span className="text-amber-600 font-bold text-lg">{totalHours} ׳©׳¢׳•׳×</span>
              <span className="text-gray-500 text-sm"> ֲ· ׳¡׳”׳´׳› ׳׳©׳׳¨׳×</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-shrink-0 bg-gray-100 rounded-2xl py-4 px-5 font-bold text-gray-600">
              <ChevronRight size={20} />
            </button>
            <button onClick={() => setStep(3)} className="flex-1 bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg active:scale-98 transition-transform">
              ׳”׳׳©׳
            </button>
          </div>
        </div>
      )}

      {/* Step 3 ג€“ Wage + Experience */}
      {step === 3 && (
        <div className="space-y-4 screen-enter">
          <h2 className="text-xl font-black text-gray-900">׳×׳’׳׳•׳ ׳•׳¨׳׳× ׳ ׳™׳¡׳™׳•׳</h2>

          <div className="bg-white rounded-2xl p-5 card-shadow">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">׳©׳›׳¨ ׳׳©׳¢׳” (ג‚×)</label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">ג‚×</span>
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
                    wage === String(v) ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  ג‚×{v}
                </button>
              ))}
            </div>
            {wage && (
              <div className="mt-3 bg-green-50 rounded-xl p-3 text-center">
                <span className="text-green-700 font-bold">ג‚×{totalPay}</span>
                <span className="text-gray-500 text-sm"> ׳¡׳”׳´׳› ({totalHours} ׳©׳³ ֳ— ג‚×{wage})</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 card-shadow">
            <label className="text-sm font-semibold text-gray-700 mb-3 block">׳¨׳׳× ׳ ׳™׳¡׳™׳•׳ ׳ ׳“׳¨׳©׳×</label>
            <div className="space-y-2">
              {EXPERIENCE.map(e => (
                <button
                  key={e.id}
                  onClick={() => setExperience(e.id)}
                  className={`w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                    experience === e.id ? 'border-orange-500 bg-amber-50' : 'border-gray-100'
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
              className="flex-1 bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40 active:scale-98 transition-transform"
            >
              ׳”׳׳©׳
            </button>
          </div>
        </div>
      )}

      {/* Step 4 ג€“ Summary + Publish */}
      {step === 4 && (
        <div className="space-y-4 screen-enter">
          <h2 className="text-xl font-black text-gray-900">׳¡׳™׳›׳•׳ ׳•׳₪׳¨׳¡׳•׳</h2>

          <div className="bg-white rounded-2xl p-5 card-shadow space-y-4">
            {[
              { label: '׳×׳₪׳§׳™׳“', value: ROLES.find(r => r.id === role)?.label },
              { label: '׳×׳׳¨׳™׳', value: new Date(shiftDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) },
              { label: '׳©׳¢׳•׳×', value: `${startTime} ג€“ ${endTime} (${totalHours} ׳©׳³)` },
              { label: '׳©׳›׳¨ ׳׳©׳¢׳”', value: `ג‚×${wage}` },
              { label: '׳¡׳”׳´׳›', value: `ג‚×${totalPay}` },
              { label: '׳ ׳™׳¡׳™׳•׳', value: EXPERIENCE.find(e => e.id === experience)?.label },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-500 text-sm">{r.label}</span>
                <span className="font-semibold text-gray-900">{r.value}</span>
              </div>
            ))}

            <div className="bg-amber-50 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">׳¢׳׳׳” ׳©׳׳ (6.5%)</span>
                <span className="font-bold text-amber-600">+ג‚×{(parseFloat(totalPay) * 0.065).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-orange-100 pt-1.5">
                <span className="text-gray-700">׳¡׳”׳´׳› ׳×׳©׳׳</span>
                <span className="text-amber-600">ג‚×{(parseFloat(totalPay) * 1.065).toFixed(0)}</span>
              </div>
              <p className="text-gray-400 text-xs text-center pt-1">
                ׳”׳¢׳•׳‘׳“ ׳™׳©׳׳ 6.5% ׳ ׳•׳¡׳£ ׳׳¦׳™׳“׳•
              </p>
            </div>
          </div>

          {/* ׳”׳•׳¨׳׳•׳× ׳”׳’׳¢׳” */}
          <div className="bg-white rounded-2xl p-4 card-shadow">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              נ“ ׳”׳•׳¨׳׳•׳× ׳”׳’׳¢׳” ׳׳¢׳•׳‘׳“ <span className="text-gray-400 font-normal">(׳׳•׳₪׳¦׳™׳•׳ ׳׳™)</span>
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder={'׳׳“׳•׳’׳׳”: ׳›׳ ׳™׳¡׳” ׳׳׳—׳•׳¨׳™ ׳”׳‘׳ ׳™׳™׳, ׳§׳•׳׳” 2, ׳׳‘׳§׳© ׳׳× ׳“׳ ׳™ ׳‘׳׳˜׳‘׳—'}
              rows={3}
              maxLength={300}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-sm focus:border-amber-400 outline-none resize-none text-gray-900"
            />
            {instructions && (
              <div className="text-xs text-gray-400 text-left mt-1">{instructions.length}/300</div>
            )}
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
              <div className="font-bold">׳׳¦׳‘ ׳—׳™׳¨׳•׳ נ¨</div>
              <div className={`text-sm ${emergency ? 'text-red-100' : 'text-gray-500'}`}>
                ׳¢׳•׳‘׳“ ׳×׳•׳ 30 ׳“׳§׳³ ג€“ ׳“׳—׳™׳₪׳•׳× ׳’׳‘׳•׳”׳” ׳׳¢׳•׳‘׳“׳™׳ ׳§׳¨׳•׳‘׳™׳
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${emergency ? 'bg-white/30' : 'bg-gray-200'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${emergency ? '-translate-x-6' : ''}`} />
            </div>
          </button>

          {publishError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-center font-medium">
              ג ן¸ {publishError}
            </div>
          )}

          {publishing ? (
            <div className="bg-amber-500 rounded-2xl py-5 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white font-bold text-lg">׳׳—׳₪׳© ׳¢׳•׳‘׳“׳™׳...</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-shrink-0 bg-gray-100 rounded-2xl py-4 px-5 font-bold text-gray-600">
                <ChevronRight size={20} />
              </button>
              <button
                onClick={handlePublish}
                className="flex-1 bg-amber-500 text-white rounded-2xl py-4 font-bold text-lg active:scale-98 transition-transform shadow-lg shadow-amber-200"
              >
                {emergency ? 'נ¨ ׳₪׳¨׳¡׳ ׳—׳™׳¨׳•׳' : '׳₪׳¨׳¡׳ ׳׳©׳׳¨׳×'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

