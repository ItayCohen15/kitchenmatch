import React, { useState } from 'react';
import { Edit3, Star, Award, LogOut, Phone, Check, X, ChevronRight } from 'lucide-react';
import { LEVEL_LABELS, LEVEL_COLORS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS } from '../../data/mockData';

const LEVEL_NEXT: Record<string, { next: string; progress: number; shiftsNeeded: number }> = {
  bronze: { next: 'כסף',  progress: 65, shiftsNeeded: 35 },
  silver: { next: 'זהב',  progress: 78, shiftsNeeded: 22 },
  gold:   { next: 'פרו',  progress: 52, shiftsNeeded: 57 },
  pro:    { next: 'Pro',  progress: 100, shiftsNeeded: 0 },
};

export const WorkerProfile: React.FC = () => {
  const { userProfile, resetToLanding, setUserProfile } = useApp();
  const level = userProfile?.Level || 'bronze';
  const levelInfo = LEVEL_NEXT[level] || LEVEL_NEXT.bronze;
  const [available, setAvailable] = useState(userProfile?.IsAvailable !== false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState(userProfile?.Phone || '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userProfile?.Name || '');
  const [editCity, setEditCity] = useState(userProfile?.City || '');
  const [editRole, setEditRole] = useState(userProfile?.Role || 'line_cook');
  const [editRate, setEditRate] = useState(String(userProfile?.HourlyRate || ''));
  const [editBio, setEditBio] = useState(userProfile?.Bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const name = userProfile?.Name || 'שם לא ידוע';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const rating = userProfile?.Rating || 0;
  const completedShifts = userProfile?.CompletedShifts || 0;
  const reliabilityScore = userProfile?.ReliabilityScore || 100;
  const yearsExp = userProfile?.YearsExp || 0;
  const noShows = userProfile?.NoShows || 0;
  const bio = userProfile?.Bio || '';

  const handleAvailability = async (val: boolean) => {
    setAvailable(val);
    if (userProfile?.Id) {
      await api.updateAvailability(userProfile.Id, val).catch(() => {});
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.Id) return;
    setSavingProfile(true);
    try {
      const res = await api.updateWorker(userProfile.Id, {
        name: editName, city: editCity, role: editRole,
        hourlyRate: parseFloat(editRate) || 0,
        bio: editBio, yearsExp: userProfile?.YearsExp || 0,
        skills: userProfile?.Skills || '', phone,
      });
      const updated = res?.profile || { ...userProfile, Name: editName, City: editCity, Role: editRole, HourlyRate: parseFloat(editRate), Bio: editBio };
      setUserProfile(updated);
      localStorage.setItem('km_profile', JSON.stringify(updated));
      setEditingProfile(false);
    } catch {}
    setSavingProfile(false);
  };

  const handleSavePhone = async () => {
    if (!userProfile?.Id) return;
    setSavingPhone(true);
    try {
      const res = await api.updateWorker(userProfile.Id, {
        name: userProfile.Name, city: userProfile.City,
        role: userProfile.Role, hourlyRate: userProfile.HourlyRate,
        bio: userProfile.Bio, yearsExp: userProfile.YearsExp,
        skills: userProfile.Skills, phone,
      });
      const updated = res?.profile || { ...userProfile, Phone: phone };
      setUserProfile(updated);
      localStorage.setItem('km_profile', JSON.stringify(updated));
      setEditingPhone(false);
    } catch {}
    setSavingPhone(false);
  };

  if (editingProfile) return (
    <div className="screen-enter space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">עריכת פרופיל</h2>
        <button onClick={() => setEditingProfile(false)} className="text-gray-400 text-sm">ביטול</button>
      </div>
      <div className="bg-white rounded-2xl p-4 card-shadow space-y-4">
        {[
          { label: 'שם מלא', val: editName, set: setEditName, ph: 'שם מלא', type: 'text' },
          { label: 'עיר', val: editCity, set: setEditCity, ph: 'עיר', type: 'text' },
          { label: '📞 טלפון', val: phone, set: setPhone, ph: '05X-XXXXXXX', type: 'tel' },
          { label: 'תעריף שעתי (₪)', val: editRate, set: setEditRate, ph: '75', type: 'number' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">{f.label}</label>
            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none" />
          </div>
        ))}
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">תפקיד</label>
          <select value={editRole} onChange={e => setEditRole(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none bg-white">
            <option value="chef">שף</option>
            <option value="line_cook">טבח</option>
            <option value="dishwasher">מדיח</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">קצת עליי</label>
          <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3}
            placeholder="ניסיון, התמחויות, מה אני מביא למטבח..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-orange-400 outline-none resize-none" />
        </div>
      </div>
      <button onClick={handleSaveProfile} disabled={savingProfile || !editName}
        className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 shadow-lg shadow-orange-200">
        {savingProfile
          ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />שומר...</div>
          : '✅ שמור שינויים'}
      </button>
    </div>
  );

  return (
    <div className="screen-enter space-y-4">
      {/* Profile header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center font-black text-2xl">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-black text-xl">{name}</div>
            <div className="text-gray-400 text-xs mt-0.5">{userProfile?.City || ''} · {ROLE_LABELS[userProfile?.Role] || userProfile?.Role || ''}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[level] || 'text-gray-500 bg-gray-100'}`}>
                {LEVEL_LABELS[level] || level}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                <Star size={12} className="fill-yellow-400" />
                {rating > 0 ? rating.toFixed(1) : 'חדש'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditingProfile(true)}
              className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center" title="ערוך פרופיל">
              <Edit3 size={15} />
            </button>
            <button onClick={resetToLanding}
              className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center" title="התנתק">
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Availability toggle */}
        <div className={`flex items-center justify-between rounded-xl p-3 ${available ? 'bg-green-500/20' : 'bg-white/10'}`}>
          <span className={`font-semibold text-sm ${available ? 'text-green-300' : 'text-gray-400'}`}>
            {available ? '● זמין לעבודה' : '○ לא זמין כרגע'}
          </span>
          <button
            onClick={() => handleAvailability(!available)}
            className={`w-12 h-6 rounded-full transition-colors ${available ? 'bg-green-500' : 'bg-gray-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow mx-0.5 transition-transform ${available ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'משמרות', value: completedShifts, icon: '✅' },
          { label: 'אמינות', value: `${reliabilityScore}%`, icon: '🛡️' },
          { label: 'ניסיון', value: `${yearsExp} שנ׳`, icon: '⭐' },
          { label: 'ביטולים', value: noShows, icon: '❌' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 card-shadow text-center">
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="font-black text-gray-900 text-sm">{s.value}</div>
            <div className="text-gray-400 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* טלפון */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 text-sm">📞 מספר טלפון</h3>
          {!editingPhone && (
            <button onClick={() => setEditingPhone(true)} className="text-orange-500 text-sm font-semibold">ערוך</button>
          )}
        </div>
        {editingPhone ? (
          <div className="flex gap-2 mt-2">
            <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="05X-XXXXXXX"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-right text-sm focus:border-orange-400 outline-none" />
            <button onClick={handleSavePhone} disabled={savingPhone}
              className="bg-orange-500 text-white rounded-xl px-3 py-2.5">
              {savingPhone ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
            </button>
            <button onClick={() => setEditingPhone(false)} className="bg-gray-100 text-gray-500 rounded-xl px-3 py-2.5">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <Phone size={14} className="text-gray-400" />
            <span className={phone ? 'text-gray-900 font-semibold' : 'text-gray-400 text-sm'}>
              {phone || 'לא הוזן — הוסף מספר'}
            </span>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">המסעדה תוכל להתקשר אליך לאחר אישור המשמרת</p>
      </div>

      {/* Level progress */}
      {level !== 'pro' && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <Award size={18} className="text-yellow-500" />
            <h3 className="font-bold text-gray-800">התקדמות לרמה הבאה</h3>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className={`font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[level] || ''}`}>{LEVEL_LABELS[level] || level}</span>
            <span className="text-gray-500">עוד {levelInfo.shiftsNeeded} משמרות → {levelInfo.next}</span>
          </div>
          <div className="bg-gray-100 rounded-full h-3">
            <div className="h-3 bg-gradient-to-l from-yellow-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${levelInfo.progress}%` }} />
          </div>
          <div className="text-xs text-gray-400 mt-1 text-center">{levelInfo.progress}% מהדרך לרמה הבאה</div>
        </div>
      )}

      {/* Bio */}
      {bio && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800">אודותי</h3>
            <button className="text-orange-500 text-sm font-semibold">ערוך</button>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{bio}</p>
        </div>
      )}

      {/* Info card */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
        <h3 className="font-bold text-orange-800 mb-2 text-sm">📋 הפרופיל שלך</h3>
        <p className="text-orange-700 text-xs leading-relaxed">
          ככל שתשלים יותר משמרות ותקבל דירוגים טובים — כך תעלה ברמה ותקבל עדיפות בשיבוצים.
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={resetToLanding}
        className="w-full bg-gray-100 text-gray-600 rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        התנתק
      </button>
    </div>
  );
};
