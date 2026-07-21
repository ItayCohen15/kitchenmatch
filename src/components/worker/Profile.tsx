import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Star, Award, LogOut, Phone, Check, X, FileText, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api';
import { ROLE_LABELS, WORKER_ROLES } from '../../utils/roles';
import { levelFromShifts, nextLevelProgress } from '../../utils/levels';
import { LevelBenefits } from '../common/LevelBenefits';
import { WorkerGallery } from '../common/WorkerGallery';
import { GradBadge } from '../common/GradBadge';
import { fileToDataUrl } from '../../utils/image';
import { DeleteAccountModal } from '../common/DeleteAccountModal';

export const WorkerProfile: React.FC = () => {
  const { userProfile, resetToLanding, setUserProfile, refreshProfile } = useApp();
  // רענן נתוני פרופיל (משמרות/רמה) מהשרת בכניסה למסך
  useEffect(() => { refreshProfile(); }, [refreshProfile]);
  const completedForLevel = userProfile?.CompletedShifts || 0;
  // הרמה נקבעת לפי מספר המשמרות (מקור אמת אחיד), עם נפילה לערך מהשרת
  const currentLevel = levelFromShifts(completedForLevel);
  const level = currentLevel.key || userProfile?.Level || 'bronze';
  const prog = nextLevelProgress(completedForLevel);
  const [available, setAvailable] = useState(userProfile?.IsAvailable !== false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState(userProfile?.Phone || '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(userProfile?.Name || '');
  const [editCity, setEditCity] = useState(userProfile?.City || '');
  const [editRole, setEditRole] = useState(userProfile?.Role || 'line_cook');
  const [editBio, setEditBio] = useState(userProfile?.Bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showDelete, setShowDelete] = useState(false); // מודל מחיקת חשבון
  const name = userProfile?.Name || 'שם לא ידוע';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const rating = userProfile?.Rating || 0;
  const completedShifts = userProfile?.CompletedShifts || 0;
  const reliabilityScore = userProfile?.ReliabilityScore || 100;
  const yearsExp = userProfile?.YearsExp || 0;
  const noShows = userProfile?.NoShows || 0;
  const bio = userProfile?.Bio || '';

  // קורות חיים
  const [cvName, setCvName] = useState(userProfile?.CvName || '');
  const [cvUploading, setCvUploading] = useState(false);
  const [cvError, setCvError] = useState('');
  const cvRef = useRef<HTMLInputElement>(null);
  const cvData = userProfile?.CvData || '';

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.Id) return;
    if (file.size > 3 * 1024 * 1024) { setCvError('הקובץ גדול מדי (מקס 3MB)'); return; }
    setCvUploading(true); setCvError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      await api.saveCv(userProfile.Id, dataUrl, file.name);
      const updated = { ...userProfile, CvData: dataUrl, CvName: file.name };
      setUserProfile(updated);
      localStorage.setItem('km_profile', JSON.stringify(updated));
      setCvName(file.name);
    } catch (err: any) {
      setCvError(err.message || 'שגיאה בהעלאה');
    }
    setCvUploading(false);
    if (cvRef.current) cvRef.current.value = '';
  };

  const handleCvDelete = async () => {
    if (!userProfile?.Id) return;
    await api.deleteCv(userProfile.Id).catch(() => {});
    const updated = { ...userProfile, CvData: null, CvName: null };
    setUserProfile(updated);
    localStorage.setItem('km_profile', JSON.stringify(updated));
    setCvName('');
  };

  // פתיחת קו"ח בבטחה — מאמת data-URI מורשה בלבד ומרנדר דרך .src (לא הזרקת HTML)
  const CV_RE = /^data:(application\/pdf|image\/(png|jpe?g|webp|gif));base64,[A-Za-z0-9+/=]+$/;
  const openCv = () => {
    if (!cvData || !CV_RE.test(cvData)) { alert('קובץ קורות החיים אינו תקין'); return; }
    const w = window.open('');
    if (!w) return;
    const isPdf = cvData.startsWith('data:application/pdf');
    const el = w.document.createElement(isPdf ? 'iframe' : 'img');
    el.setAttribute('src', cvData);
    el.style.cssText = isPdf ? 'width:100%;height:100vh;border:0' : 'max-width:100%';
    const body = w.document.body || w.document.documentElement;
    body.style.margin = '0';
    body.appendChild(el);
  };

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
        hourlyRate: userProfile?.HourlyRate || 0,
        bio: editBio, yearsExp: userProfile?.YearsExp || 0,
        skills: userProfile?.Skills || '', phone,
      });
      const updated = res?.profile || { ...userProfile, Name: editName, City: editCity, Role: editRole, Bio: editBio };
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
        ].map(f => (
          <div key={f.label}>
            <label className="text-sm font-semibold text-gray-600 mb-1.5 block">{f.label}</label>
            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none" />
          </div>
        ))}
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">תפקיד</label>
          <select value={editRole} onChange={e => setEditRole(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none bg-white">
            {/* נגזר מ-WORKER_ROLES — רשימה קשיחה כאן שכחה תפקידים חדשים */}
            {WORKER_ROLES.map(r => (
              <option key={r.key} value={r.key}>{r.emoji} {r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">קצת עליי</label>
          <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3}
            placeholder="ניסיון, התמחויות, מה אני מביא למטבח..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:border-amber-400 outline-none resize-none" />
        </div>
      </div>
      <button onClick={handleSaveProfile} disabled={savingProfile || !editName}
        className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 shadow-lg shadow-amber-200">
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
          <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center font-black text-2xl">
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-black text-xl">{name}</div>
            <div className="text-gray-400 text-xs mt-0.5">{userProfile?.City || ''} · {ROLE_LABELS[userProfile?.Role] || userProfile?.Role || ''}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: currentLevel.gradient, color: 'white' }}>
                {currentLevel.emoji} {currentLevel.label}
              </span>
              <GradBadge isTrainee={userProfile?.IsTrainee} school={userProfile?.SchoolName} course={userProfile?.CourseType} size="sm" />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                <Star size={12} className="fill-yellow-400" />
                {rating > 0 ? rating.toFixed(1) : '—'}
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
            aria-pressed={available}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${available ? 'bg-green-500' : 'bg-gray-600'}`}
          >
            <span
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
              style={{ left: available ? 2 : 26 }}
            />
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
            <button onClick={() => setEditingPhone(true)} className="text-amber-500 text-sm font-semibold">ערוך</button>
          )}
        </div>
        {editingPhone ? (
          <div className="flex gap-2 mt-2">
            <input type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="05X-XXXXXXX"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-right text-sm focus:border-amber-400 outline-none" />
            <button onClick={handleSavePhone} disabled={savingPhone}
              className="bg-amber-500 text-white rounded-xl px-3 py-2.5">
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

      {/* גלריית עבודות */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📸</span>
          <h3 className="font-bold text-gray-800">גלריית העבודות שלי</h3>
        </div>
        {userProfile?.Id && <WorkerGallery workerId={userProfile.Id} editable />}
      </div>

      {/* קורות חיים */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-blue-500" />
          <h3 className="font-bold text-gray-800">קורות חיים</h3>
          <span className="text-xs text-gray-400">(אופציונלי)</span>
        </div>

        {cvError && <div className="bg-red-50 text-red-600 rounded-xl p-2.5 text-sm text-center mb-2">{cvError}</div>}

        {cvData ? (
          <div className="flex items-center gap-2">
            <button onClick={openCv}
              className="flex-1 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-blue-700 text-sm font-semibold">
              <FileText size={15} />
              <span className="truncate">{cvName || 'קורות חיים'}</span>
            </button>
            <button onClick={handleCvDelete}
              className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center flex-shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ) : (
          <button onClick={() => cvRef.current?.click()} disabled={cvUploading}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-gray-500 text-sm font-semibold active:bg-gray-50">
            {cvUploading
              ? <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              : <><Upload size={16} /> העלה קו"ח (PDF או תמונה)</>}
          </button>
        )}
        <input ref={cvRef} type="file" accept="application/pdf,image/*" onChange={handleCvUpload} className="hidden" />
        <p className="text-xs text-gray-400 mt-2">המסעדה תוכל לעיין בקו"ח שלך בעת בחינת מועמדותך</p>
      </div>

      {/* Level progress */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Award size={18} className="text-yellow-500" />
          <h3 className="font-bold text-gray-800">הרמה שלי</h3>
        </div>

        {/* badge רמה נוכחית + עמלה */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 font-black px-3 py-1.5 rounded-xl text-sm"
            style={{ background: currentLevel.gradient, color: 'white' }}>
            {currentLevel.emoji} {currentLevel.label}
          </span>
          <div className="text-left">
            <div className="text-xs text-gray-400">עמלת העובד שלך</div>
            <div className="font-black text-green-600 text-sm">{(currentLevel.commission * 100).toFixed(1)}%</div>
          </div>
        </div>

        {prog.next ? (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">{completedForLevel} משמרות</span>
              <span className="text-gray-500">
                עוד <strong className="text-gray-800">{prog.shiftsNeeded}</strong> → {prog.next.emoji} {prog.next.label}
              </span>
            </div>
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="h-3 rounded-full transition-all"
                style={{ width: `${prog.progress}%`, background: currentLevel.gradient }} />
            </div>
            <div className="text-xs text-gray-400 mt-1 text-center">{prog.progress}% מהדרך לרמה הבאה</div>
          </>
        ) : (
          <div className="text-center text-sm font-bold py-1" style={{ color:'#6366f1' }}>
            💎 הגעת לרמה הגבוהה ביותר!
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          ככל שתעלה ברמה — העמלה יורדת והחשיפה שלך למסעדות גדלה (עדיפות בתוצאות החיפוש).
        </p>
      </div>

      {/* הטבות מפורטות לכל הרמות */}
      <LevelBenefits completedShifts={completedForLevel} />

      {/* Bio */}
      {bio && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800">אודותי</h3>
            <button className="text-amber-500 text-sm font-semibold">ערוך</button>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{bio}</p>
        </div>
      )}

      {/* Info card */}
      <div className="bg-amber-50 border border-orange-100 rounded-2xl p-4">
        <h3 className="font-bold text-amber-800 mb-2 text-sm">📋 הפרופיל שלך</h3>
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

      {/* אזור מסוכן — מחיקת חשבון */}
      <button
        onClick={() => setShowDelete(true)}
        className="w-full text-red-500 rounded-2xl py-3 font-semibold text-sm flex items-center justify-center gap-2 active:bg-red-50 transition-colors"
      >
        <Trash2 size={15} />
        מחיקת החשבון שלי
      </button>

      {showDelete && (
        <DeleteAccountModal
          onClose={() => setShowDelete(false)}
          onDeleted={() => {
            try { localStorage.clear(); } catch { /* ignore */ }
            resetToLanding();
          }}
        />
      )}
    </div>
  );
};
