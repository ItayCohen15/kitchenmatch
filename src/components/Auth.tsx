import React, { useState, useEffect } from 'react';
import { ChefHat, Store, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';
import { VerifyEmail } from './VerifyEmail';

interface Props {
  onLogin: (token: string, role: string, profile: any, isNew?: boolean) => void;
}

export const Auth: React.FC<Props> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'restaurant' | 'worker'>('restaurant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerify, setPendingVerify] = useState<{userId:number,email:string,data:any}|null>(null);
  const [refCode, setRefCode] = useState('');

  // "חבר מביא חבר" — לכידת קוד ההפניה מה-URL (?ref=CODE) ושמירתו עד ההרשמה
  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('ref');
      if (fromUrl) localStorage.setItem('km_ref', fromUrl.trim().toUpperCase().slice(0, 16));
      setRefCode((localStorage.getItem('km_ref') || '').slice(0, 16));
    } catch { /* ignore */ }
  }, []);

  // חייב להישאר תואם למדיניות בשרת (routes/auth.js)
  const passLenOk = password.length >= 8;
  const passUpperOk = /[A-Z]/.test(password);
  const passDigitOk = /[0-9]/.test(password);

  const handleSubmit = async () => {
    if (!email || !password) return setError('נא למלא אימייל וסיסמא');
    if (mode === 'register' && (!passLenOk || !passUpperOk || !passDigitOk)) {
      return setError('הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה באנגלית (A-Z) וספרה');
    }
    setLoading(true);
    setError('');
    try {
      let data;
      if (mode === 'login') {
        data = await api.login(email, password);
      } else {
        data = await api.register(email, password, role, '', '', refCode || undefined);
        localStorage.removeItem('km_ref'); // ההפניה שויכה בשרת — חד-פעמי
      }
      const isNew = mode === 'register';
      // חשבון שטרם אומת — ברישום *וגם* בכניסה. אין טוקן עד שהמייל אומת,
      // ולכן חייבים לעבור דרך מסך האימות (ראה routes/auth.js).
      if (data.needsVerification) {
        setPendingVerify({ userId: data.userId, email, data: { isNew } });
        setLoading(false);
        return;
      }
      localStorage.setItem('km_token', data.token);
      localStorage.setItem('km_role', data.role);
      if (data.profile) localStorage.setItem('km_profile', JSON.stringify(data.profile));
      if (isNew) localStorage.removeItem('km_onboarding');
      onLogin(data.token, data.role, data.profile, isNew);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerify) {
    return (
      <VerifyEmail
        userId={pendingVerify.userId}
        email={pendingVerify.email}
        onVerified={(session) => {
          // הסשן מגיע מתשובת /auth/verify — לא מהרישום
          const isNew = !!pendingVerify.data?.isNew;
          localStorage.setItem('km_token', session.token);
          localStorage.setItem('km_role', session.role);
          if (session.profile) localStorage.setItem('km_profile', JSON.stringify(session.profile));
          if (isNew) localStorage.removeItem('km_onboarding');
          onLogin(session.token, session.role, session.profile, isNew);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0d1420 0%, #1a2744 100%)', paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto mb-4" style={{ boxShadow: '0 8px 32px rgba(232,160,32,0.3)' }}>
            <img src="/logo.svg" alt="Staffly" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black">
            <span className="text-white">Staff</span><span style={{ color: '#e8a020' }}>ly</span>
          </h1>
          <p className="text-sm mt-1" dir="ltr" style={{ color: '#8899bb' }}>Find your shift. Fill your team.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m as any); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  mode === m ? 'bg-white text-gray-900 shadow' : 'text-gray-400'
                }`}
              >
                {m === 'login' ? 'כניסה' : 'הרשמה'}
              </button>
            ))}
          </div>

          {/* Role selector (only register) */}
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                onClick={() => setRole('restaurant')}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  role === 'restaurant' ? 'border-orange-500 bg-amber-50' : 'border-gray-100'
                }`}
              >
                <Store size={20} className={`mx-auto mb-1 ${role === 'restaurant' ? 'text-amber-500' : 'text-gray-400'}`} />
                <div className="text-xs font-bold text-gray-700">מסעדה</div>
              </button>
              <button
                onClick={() => setRole('worker')}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  role === 'worker' ? 'border-orange-500 bg-amber-50' : 'border-gray-100'
                }`}
              >
                <ChefHat size={20} className={`mx-auto mb-1 ${role === 'worker' ? 'text-amber-500' : 'text-gray-400'}`} />
                <div className="text-xs font-bold text-gray-700">עובד</div>
              </button>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            {mode === 'register' && (
              <p className="text-xs text-gray-400 text-center bg-gray-50 rounded-xl p-2">
                לאחר ההרשמה נשלים את פרטי הפרופיל שלך
              </p>
            )}
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              enterKeyHint="next"
              placeholder="אימייל"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
            />
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="סיסמא"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                enterKeyHint="go"
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-4 pl-12 text-right text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 active:text-gray-600"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* דרישות סיסמה — חיווי חי בהרשמה */}
            {mode === 'register' && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
                <span className={`text-[11px] font-semibold ${passLenOk ? 'text-green-600' : 'text-gray-400'}`}>
                  {passLenOk ? '✓' : '•'} לפחות 8 תווים
                </span>
                <span className={`text-[11px] font-semibold ${passUpperOk ? 'text-green-600' : 'text-gray-400'}`}>
                  {passUpperOk ? '✓' : '•'} אות גדולה (A-Z)
                </span>
                <span className={`text-[11px] font-semibold ${passDigitOk ? 'text-green-600' : 'text-gray-400'}`}>
                  {passDigitOk ? '✓' : '•'} ספרה
                </span>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-amber-500 text-white rounded-2xl py-4 font-bold text-base mt-5 disabled:opacity-50 active:scale-98 transition-transform"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                טוען...
              </div>
            ) : mode === 'login' ? 'כניסה' : 'הרשמה'}
          </button>
        </div>
      </div>
    </div>
  );
};
