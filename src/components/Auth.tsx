import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { VerifyEmail } from './VerifyEmail';

interface Props {
  onLogin: (token: string, role: string, profile: any, isNew?: boolean) => void;
  onShowLegal?: (page: 'privacy' | 'terms') => void;
}

// ── ספקי OAuth — נטענים רק אם הוגדר Client ID בזמן הבנייה (VITE_*).
//    כל עוד לא הוגדר — הכפתורים קיימים אך מציגים "בקרוב" (אין כפתור שבור בהשקה).
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID  = (import.meta as any).env?.VITE_APPLE_CLIENT_ID  || '';

// ── אייקוני מותג (לוגו Google/Apple אינם ב-lucide) ──
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </svg>
);
const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
    <path d="M16.365 1.43c0 1.14-.417 2.2-1.11 3.02-.83.99-2.2 1.76-3.36 1.67-.14-1.11.42-2.28 1.09-3.02.75-.85 2.06-1.5 3.19-1.55.03.09.19.71.19.88zM20.9 17.02c-.55 1.27-.81 1.84-1.52 2.96-1 1.57-2.4 3.52-4.14 3.53-1.55.02-1.95-1.01-4.05-1-2.1.01-2.54 1.02-4.09 1-1.74-.02-3.07-1.78-4.07-3.35C-.13 16.9-.4 11.2 1.58 8.17c1.02-1.55 2.63-2.53 4.08-2.53 1.48 0 2.41 1.02 3.63 1.02 1.19 0 1.91-1.02 3.63-1.02 1.29 0 2.66.7 3.64 1.92-3.2 1.75-2.68 6.32.34 7.46z"/>
  </svg>
);
// טעינת סקריפט חיצוני פעם אחת (ל-Google Identity Services)
const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) return resolve();
  const s = document.createElement('script');
  s.src = src; s.async = true; s.defer = true;
  s.onload = () => resolve();
  s.onerror = () => reject(new Error('script-load'));
  document.head.appendChild(s);
});

export const Auth: React.FC<Props> = ({ onLogin, onShowLegal }) => {
  const [view, setView] = useState<'entry' | 'email'>('entry');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'restaurant' | 'worker'>('restaurant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [confirmPass, setConfirmPass] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(''); // הודעות "בקרוב" / מידע במסך הכניסה
  const [pendingVerify, setPendingVerify] = useState<{userId:number,email:string,data:any}|null>(null);
  const [refCode, setRefCode] = useState('');
  const [consent, setConsent] = useState(false); // אישור תנאי שימוש + מדיניות פרטיות (חובה בהרשמה)

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

  // הנפקת סשן משותפת (login / register / OAuth) — כותבת ל-localStorage ומעבירה ל-App
  const finishSession = (data: any, isNew: boolean) => {
    localStorage.setItem('km_token', data.token);
    localStorage.setItem('km_role', data.role);
    if (data.profile) localStorage.setItem('km_profile', JSON.stringify(data.profile));
    if (isNew) localStorage.removeItem('km_onboarding');
    onLogin(data.token, data.role, data.profile, isNew);
  };

  const handleSubmit = async () => {
    if (!email || !password) return setError('נא למלא אימייל וסיסמא');
    if (mode === 'register' && (!passLenOk || !passUpperOk || !passDigitOk)) {
      return setError('הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה באנגלית (A-Z) וספרה');
    }
    if (mode === 'register' && password !== confirmPass) {
      return setError('הסיסמאות אינן תואמות');
    }
    // אישור תנאי שימוש + מדיניות פרטיות — חובה בהרשמה. חוסם את השליחה עד לסימון.
    if (mode === 'register' && !consent) {
      return setError('יש לאשר את תנאי השימוש ומדיניות הפרטיות כדי להירשם');
    }
    setLoading(true);
    setError('');
    try {
      let data;
      if (mode === 'login') {
        data = await api.login(email, password);
      } else {
        // חותמת אישור ההסכמה — נשלחת לשרת ונשמרת גם מקומית
        const consentAcceptedAt = new Date().toISOString();
        try { localStorage.setItem('km_consent_at', consentAcceptedAt); } catch { /* ignore */ }
        data = await api.register(email, password, role, '', '', refCode || undefined, consentAcceptedAt);
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
      finishSession(data, isNew);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── התחברות עם Google (מופעלת רק אם הוגדר VITE_GOOGLE_CLIENT_ID) ──
  const handleGoogle = async () => {
    setNotice(''); setError('');
    if (!GOOGLE_CLIENT_ID) { setNotice('התחברות עם Google תופעל בקרוב'); return; }
    try {
      await loadScript('https://accounts.google.com/gsi/client');
      const g = (window as any).google;
      if (!g?.accounts?.id) { setNotice('לא ניתן לטעון את Google כרגע'); return; }
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: any) => {
          try {
            setLoading(true);
            const consentAcceptedAt = new Date().toISOString();
            const data = await api.oauthGoogle(resp.credential, role, refCode || undefined, consentAcceptedAt);
            localStorage.removeItem('km_ref');
            finishSession(data, !!data.isNew);
          } catch (e: any) {
            setNotice(e.message || 'שגיאת התחברות עם Google');
          } finally { setLoading(false); }
        },
      });
      g.accounts.id.prompt();
    } catch {
      setNotice('לא ניתן לטעון את Google כרגע');
    }
  };

  // ── התחברות עם Apple — תשתית מוכנה; תופעל כשיוגדרו אישורי Apple Developer ──
  const handleApple = () => {
    setNotice(''); setError('');
    if (!APPLE_CLIENT_ID) { setNotice('התחברות עם Apple תופעל בקרוב'); return; }
    // ה-flow המלא של Apple יושלם עם הגדרת ה-Services ID והדומיין המאומת
    setNotice('התחברות עם Apple תופעל בקרוב');
  };

  const openEmail = (m: 'login' | 'register') => {
    setMode(m); setView('email'); setError(''); setNotice('');
  };

  // כניסה ראשית במייל (אין שירות SMS) — ממשיך לשלב הסיסמה עם המייל שהוקלד
  const handleEmailContinue = () => {
    setError(''); setNotice('');
    if (!email.trim()) { setNotice('נא להזין כתובת אימייל'); return; }
    openEmail('login');
  };

  if (pendingVerify) {
    return (
      <VerifyEmail
        userId={pendingVerify.userId}
        email={pendingVerify.email}
        onVerified={(session) => {
          // הסשן מגיע מתשובת /auth/verify — לא מהרישום
          const isNew = !!pendingVerify.data?.isNew;
          finishSession(session, isNew);
        }}
      />
    );
  }

  return (
    <div className={`auth-mi ${view === 'email' ? 'compact' : ''}`}>
      {/* ---------- HERO (the real illustration) ---------- */}
      <div className="ami-hero2">
        <div className="ami-safe" />
        <img className="ami-heroimg" src="/hero-login.jpg"
          alt="Staffly — Find your shift. Fill your team." />
      </div>

      {/* ---------- CARD ---------- */}
      <div className="ami-card">
        {view === 'entry' ? (
          <>
            {/* אימייל — הכניסה הראשית (אין שירות SMS) */}
            <div className="ami-field">
              <input id="ami-entry-email" type="email" inputMode="email" autoComplete="email"
                autoCapitalize="none" enterKeyHint="next" placeholder=" "
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleEmailContinue(); }} />
              <label htmlFor="ami-entry-email">אימייל</label>
            </div>

            <button className="ami-primary" onClick={handleEmailContinue}>
              המשך <ArrowLeft size={17} />
            </button>

            <div className="ami-divider" />

            <button className="ami-oauth apple" onClick={handleApple} disabled={loading}>
              <span className="ic"><AppleIcon /></span>
              המשך עם Apple
            </button>
            <button className="ami-oauth" onClick={handleGoogle} disabled={loading}>
              <span className="ic"><GoogleIcon /></span>
              המשך עם Google
            </button>

            <div className="ami-divider" />

            <button className="ami-reg" onClick={() => openEmail('register')}>
              הירשם <ArrowLeft size={17} />
            </button>

            {notice && <div className="ami-notice">{notice}</div>}

            <div className="ami-legal">
              בהמשך אתה מאשר את{' '}
              <button type="button" onClick={() => onShowLegal?.('terms')}>תנאי השימוש</button>
              {' '}ואת{' '}
              <button type="button" onClick={() => onShowLegal?.('privacy')}>מדיניות הפרטיות</button>
            </div>
          </>
        ) : (
          /* ---------- EMAIL FORM ---------- */
          <div className="ami-form">
            <button className="ami-back" onClick={() => { setView('entry'); setError(''); }}>
              <ChevronRight size={17} /> חזרה
            </button>

            <div className="ami-formtitle">{mode === 'login' ? 'כניסה עם אימייל' : 'הרשמה ל-Staffly'}</div>

            {mode === 'register' && (
              <>
                <div className="ami-rolelab">אני מצטרף/ת בתור</div>
                <div className="ami-roles">
                  <button type="button" className={`ami-role ${role === 'restaurant' ? 'on' : ''}`}
                    onClick={() => setRole('restaurant')}>
                    מסעדה / עסק
                  </button>
                  <button type="button" className={`ami-role ${role === 'worker' ? 'on' : ''}`}
                    onClick={() => setRole('worker')}>
                    עובד
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

            {/* אישור תנאי שימוש + מדיניות פרטיות — חובה בהרשמה */}
            {mode === 'register' && (
              <div className="ami-consent">
                <input id="ami-consent" type="checkbox" checked={consent}
                  onChange={e => setConsent(e.target.checked)} />
                <label htmlFor="ami-consent">
                  אני מאשר/ת את{' '}
                  <button type="button" onClick={e => { e.preventDefault(); onShowLegal?.('terms'); }}>תנאי השימוש</button>
                  {' '}ואת{' '}
                  <button type="button" onClick={e => { e.preventDefault(); onShowLegal?.('privacy'); }}>מדיניות הפרטיות</button>
                </label>
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

            <div className="ami-switch">
              {mode === 'login' ? 'אין לך חשבון? ' : 'כבר יש לך חשבון? '}
              <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
                {mode === 'login' ? 'הרשמה' : 'כניסה'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
