import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ArrowLeft, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { VerifyEmail } from './VerifyEmail';

interface Props {
  onLogin: (token: string, role: string, profile: any, isNew?: boolean) => void;
  onShowLegal?: (page: 'privacy' | 'terms') => void;
}

// ── ספקי OAuth — נטענים רק אם הוגדר Client ID בזמן הבנייה (VITE_*).
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID  = (import.meta as any).env?.VITE_APPLE_CLIENT_ID  || '';

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
  const [view, setView] = useState<'entry' | 'email'>('entry'); // entry = כניסה (קבוע), email = טופס הרשמה (נגלל)
  const [role, setRole] = useState<'restaurant' | 'worker'>('restaurant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [confirmPass, setConfirmPass] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingVerify, setPendingVerify] = useState<{userId:number,email:string,data:any}|null>(null);
  const [refCode, setRefCode] = useState('');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('ref');
      if (fromUrl) localStorage.setItem('km_ref', fromUrl.trim().toUpperCase().slice(0, 16));
      setRefCode((localStorage.getItem('km_ref') || '').slice(0, 16));
    } catch { /* ignore */ }
  }, []);

  const passLenOk = password.length >= 8;
  const passUpperOk = /[A-Z]/.test(password);
  const passDigitOk = /[0-9]/.test(password);

  const finishSession = (data: any, isNew: boolean) => {
    localStorage.setItem('km_token', data.token);
    localStorage.setItem('km_role', data.role);
    if (data.profile) localStorage.setItem('km_profile', JSON.stringify(data.profile));
    if (isNew) localStorage.removeItem('km_onboarding');
    onLogin(data.token, data.role, data.profile, isNew);
  };

  // Google Sign-In — כפתור מרונדר של Google (renderButton) במקום One Tap:
  // אמין, נפתח כחלון בחירת חשבון, ועובד גם בגלישה פרטית וגם כשלא מחוברים ל-Google.
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const gisInited = useRef(false);
  const roleRef = useRef(role);       roleRef.current = role;
  const refCodeRef = useRef(refCode); refCodeRef.current = refCode;

  useEffect(() => {
    if (view !== 'entry' || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    (async () => {
      try {
        await loadScript('https://accounts.google.com/gsi/client');
        const g = (window as any).google;
        if (cancelled || !g?.accounts?.id || !googleBtnRef.current) return;
        if (!gisInited.current) {
          g.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (resp: any) => {
              try {
                setLoading(true);
                const consentAcceptedAt = new Date().toISOString();
                const data = await api.oauthGoogle(resp.credential, roleRef.current, refCodeRef.current || undefined, consentAcceptedAt);
                localStorage.removeItem('km_ref');
                finishSession(data, !!data.isNew);
              } catch (e: any) {
                setNotice(e.message || 'שגיאת התחברות עם Google');
              } finally { setLoading(false); }
            },
          });
          gisInited.current = true;
        }
        googleBtnRef.current.innerHTML = '';
        g.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard', theme: 'outline', size: 'large',
          text: 'continue_with', shape: 'pill', logo_alignment: 'center', locale: 'he',
        });
      } catch { /* טעינת GIS נכשלה — נשאר fallback שקט */ }
    })();
    return () => { cancelled = true; };
  }, [view]);

  const doAuth = async (authMode: 'login' | 'register') => {
    if (!email || !password) return setError('נא למלא אימייל וסיסמא');
    if (authMode === 'register' && (!passLenOk || !passUpperOk || !passDigitOk)) {
      return setError('הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה באנגלית (A-Z) וספרה');
    }
    if (authMode === 'register' && password !== confirmPass) {
      return setError('הסיסמאות אינן תואמות');
    }
    if (authMode === 'register' && !consent) {
      return setError('יש לאשר את תנאי השימוש ומדיניות הפרטיות כדי להירשם');
    }
    setLoading(true);
    setError('');
    try {
      let data;
      if (authMode === 'login') {
        data = await api.login(email, password);
      } else {
        const consentAcceptedAt = new Date().toISOString();
        try { localStorage.setItem('km_consent_at', consentAcceptedAt); } catch { /* ignore */ }
        data = await api.register(email, password, role, '', '', refCode || undefined, consentAcceptedAt);
        localStorage.removeItem('km_ref');
      }
      const isNew = authMode === 'register';
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

  const handleApple = () => {
    setNotice(''); setError('');
    if (!APPLE_CLIENT_ID) { setNotice('התחברות עם Apple תופעל בקרוב'); return; }
    setNotice('התחברות עם Apple תופעל בקרוב');
  };

  const openRegister = () => { setView('email'); setError(''); setNotice(''); try { window.scrollTo(0, 0); } catch {} };
  const backToEntry  = () => { setView('entry'); setError(''); setNotice(''); };

  if (pendingVerify) {
    return (
      <VerifyEmail
        userId={pendingVerify.userId}
        email={pendingVerify.email}
        onVerified={(session) => {
          const isNew = !!pendingVerify.data?.isNew;
          finishSession(session, isNew);
        }}
      />
    );
  }

  return (
    <div className={`auth-mi ${view === 'email' ? 'compact' : ''}`}>
      {/* ---------- HERO (full illustration) ---------- */}
      <div className="ami-hero2">
        <div className="ami-safe" />
        <img className="ami-heroimg" src="/hero-login.jpg"
          alt="Staffly — Find your shift. Fill your team." />
      </div>

      {/* ---------- CARD ---------- */}
      <div className="ami-card">
        {view === 'entry' ? (
          <>
            {/* אימייל + סיסמה — כניסה ישירה (מסך קבוע, בלי גרירה) */}
            <div className="ami-field">
              <input id="ami-entry-email" type="email" inputMode="email" autoComplete="email"
                autoCapitalize="none" enterKeyHint="next" placeholder=" "
                value={email} onChange={e => setEmail(e.target.value)} />
              <label htmlFor="ami-entry-email">אימייל</label>
            </div>

            <div className="ami-field pw">
              <input id="ami-entry-pass" type={showPass ? 'text' : 'password'} placeholder=" "
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password" enterKeyHint="go"
                onKeyDown={e => { if (e.key === 'Enter') doAuth('login'); }} />
              <label htmlFor="ami-entry-pass">סיסמה</label>
              <button type="button" className="ami-eye" onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'הסתר סיסמה' : 'הצג סיסמה'}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <div className="ami-err">{error}</div>}

            <button className="ami-primary" onClick={() => doAuth('login')} disabled={loading}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> טוען...</>
              ) : (
                <>המשך <ArrowLeft size={17} /></>
              )}
            </button>

            <div className="ami-divider" />

            <button className="ami-oauth apple" onClick={handleApple} disabled={loading}>
              <span className="ic"><AppleIcon /></span>
              המשך עם Apple
            </button>
            {GOOGLE_CLIENT_ID ? (
              <div ref={googleBtnRef} className="ami-oauth-g" style={{ display: 'flex', justifyContent: 'center' }} />
            ) : (
              <button className="ami-oauth" onClick={() => setNotice('התחברות עם Google תופעל בקרוב')} disabled={loading}>
                <span className="ic"><GoogleIcon /></span>
                המשך עם Google
              </button>
            )}

            <div className="ami-divider" />

            <button className="ami-reg" onClick={openRegister}>
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
          /* ---------- REGISTER FORM (נגלל) ---------- */
          <>
            <button className="ami-back" onClick={backToEntry}>
              <ChevronRight size={17} /> חזרה
            </button>

            <div className="ami-formtitle">הרשמה ל-Staffly</div>

            <div className="ami-rolelab">אני מצטרף/ת בתור</div>
            <div className="ami-roles">
              <button type="button" className={`ami-role ${role === 'restaurant' ? 'on' : ''}`}
                onClick={() => setRole('restaurant')}>מסעדה / עסק</button>
              <button type="button" className={`ami-role ${role === 'worker' ? 'on' : ''}`}
                onClick={() => setRole('worker')}>עובד</button>
            </div>

            <div className="ami-field">
              <input id="ami-email" type="email" inputMode="email" autoComplete="email"
                autoCapitalize="none" enterKeyHint="next" placeholder=" "
                value={email} onChange={e => setEmail(e.target.value)} />
              <label htmlFor="ami-email">אימייל</label>
            </div>

            <div className="ami-field pw">
              <input id="ami-pass" type={showPass ? 'text' : 'password'} placeholder=" "
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="new-password" enterKeyHint="next" />
              <label htmlFor="ami-pass">סיסמה</label>
              <button type="button" className="ami-eye" onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'הסתר סיסמה' : 'הצג סיסמה'}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="ami-field pw">
              <input id="ami-pass2" type={showConfirm ? 'text' : 'password'} placeholder=" "
                value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                autoComplete="new-password" enterKeyHint="go"
                onKeyDown={e => { if (e.key === 'Enter') doAuth('register'); }} />
              <label htmlFor="ami-pass2">אימות סיסמה</label>
              <button type="button" className="ami-eye" onClick={() => setShowConfirm(s => !s)}
                aria-label={showConfirm ? 'הסתר סיסמה' : 'הצג סיסמה'}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="ami-hints">
              <span className={`ami-hint ${passLenOk ? 'ok' : ''}`}>{passLenOk ? '✓' : '•'} 8+ תווים</span>
              <span className={`ami-hint ${passUpperOk ? 'ok' : ''}`}>{passUpperOk ? '✓' : '•'} אות גדולה A-Z</span>
              <span className={`ami-hint ${passDigitOk ? 'ok' : ''}`}>{passDigitOk ? '✓' : '•'} ספרה</span>
            </div>

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

            {error && <div className="ami-err">{error}</div>}

            <button className="ami-submit" onClick={() => doAuth('register')} disabled={loading}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> טוען...</>
              ) : (
                <>הרשמה <span className="go"><ArrowLeft size={15} /></span></>
              )}
            </button>

            <div className="ami-switch">
              כבר יש לך חשבון?{' '}
              <button type="button" onClick={backToEntry}>כניסה</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
