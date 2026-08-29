import React, { useState, useEffect } from 'react';
import { ChefHat, Store, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
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
  const [confirmPass, setConfirmPass] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (mode === 'register' && password !== confirmPass) {
      return setError('הסיסמאות אינן תואמות');
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
    <div className="auth-mi">
      <div className="ami-wrap">
        {/* Brand */}
        <div className="ami-brand">
          <img src="/logo.svg" alt="Staffly" className="ami-logo" />
          <span className="ami-word">Staffly</span>
        </div>

        {/* Hero */}
        <div className="ami-hero">
          <h1>המשמרת הבאה שלך<br /><b>מתחילה כאן.</b></h1>
          <p className="ami-motto" dir="ltr">Find your shift. Fill your team.</p>
        </div>

        {/* Segmented control — כניסה / הרשמה */}
        <div className="ami-seg">
          <button type="button" className={mode === 'login' ? 'on' : ''}
            onClick={() => { setMode('login'); setError(''); }}>כניסה</button>
          <button type="button" className={mode === 'register' ? 'on' : ''}
            onClick={() => { setMode('register'); setError(''); }}>הרשמה</button>
        </div>

        {/* Form */}
        <div className="ami-form">
          {mode === 'register' && (
            <>
              <div className="ami-rolelab">אני מצטרף/ת בתור</div>
              <div className="ami-roles">
                <button type="button" className={`ami-role ${role === 'restaurant' ? 'on' : ''}`}
                  onClick={() => setRole('restaurant')}>
                  <Store size={15} /> מסעדה
                </button>
                <button type="button" className={`ami-role ${role === 'worker' ? 'on' : ''}`}
                  onClick={() => setRole('worker')}>
                  <ChefHat size={15} /> עובד
                </button>
              </div>
            </>
          )}

          <div className="ami-field">
            <input id="ami-email" type="email" inputMode="email" autoComplete="email"
              autoCapitalize="none" enterKeyHint="next" placeholder=" "
              value={email} onChange={e => setEmail(e.target.value)} />
            <label htmlFor="ami-email">אימייל</label>
          </div>

          <div className="ami-field pw">
            <input id="ami-pass" type={showPass ? 'text' : 'password'} placeholder=" "
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              enterKeyHint="go" onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }} />
            <label htmlFor="ami-pass">סיסמה</label>
            <button type="button" className="ami-eye" onClick={() => setShowPass(s => !s)}
              aria-label={showPass ? 'הסתר סיסמה' : 'הצג סיסמה'}>
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* אימות סיסמה — הרשמה בלבד */}
          {mode === 'register' && (
            <div className="ami-field pw">
              <input id="ami-pass2" type={showConfirm ? 'text' : 'password'} placeholder=" "
                value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                autoComplete="new-password" enterKeyHint="go"
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }} />
              <label htmlFor="ami-pass2">אימות סיסמה</label>
              <button type="button" className="ami-eye" onClick={() => setShowConfirm(s => !s)}
                aria-label={showConfirm ? 'הסתר סיסמה' : 'הצג סיסמה'}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {/* דרישות סיסמה — חיווי חי בהרשמה */}
          {mode === 'register' && (
            <div className="ami-hints">
              <span className={`ami-hint ${passLenOk ? 'ok' : ''}`}>{passLenOk ? '✓' : '•'} 8+ תווים</span>
              <span className={`ami-hint ${passUpperOk ? 'ok' : ''}`}>{passUpperOk ? '✓' : '•'} אות גדולה A-Z</span>
              <span className={`ami-hint ${passDigitOk ? 'ok' : ''}`}>{passDigitOk ? '✓' : '•'} ספרה</span>
            </div>
          )}

          {error && <div className="ami-err">{error}</div>}

          <button className="ami-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                טוען...
              </>
            ) : (
              <>{mode === 'login' ? 'כניסה' : 'הרשמה'} <span className="go"><ArrowLeft size={15} /></span></>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="ami-foot">
          <div className="ami-trust">
            <ShieldCheck size={12} /> מאובטח בהצפנה <span className="sep" /> ללא עמלת הרשמה
          </div>
          <div className="ami-switch">
            {mode === 'login' ? 'אין לך חשבון? ' : 'כבר יש לך חשבון? '}
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'הרשמה' : 'כניסה'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
