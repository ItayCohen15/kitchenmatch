import React, { useState, useRef } from 'react';
import { CheckCircle } from 'lucide-react';

const BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://deprive-shakable-fog.ngrok-free.dev');

interface Props {
  userId: number;
  email: string;
  onVerified: () => void;
}

export const VerifyEmail: React.FC<Props> = ({ userId, email, onVerified }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    setError('');
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (!val && i > 0) inputs.current[i - 1]?.focus();
    // אוטו-שלח כשמלא
    if (val && i === 5) {
      const full = [...next].join('');
      if (full.length === 6) handleVerify(full);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(''));
      handleVerify(text);
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const c = fullCode || code.join('');
    if (c.length !== 6) { setError('הכנס 6 ספרות'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ userId, code: c }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'קוד שגוי'); setLoading(false); return; }
      onVerified();
    } catch {
      setError('שגיאה בחיבור, נסה שוב');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    try {
      await fetch(`${BASE}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ userId, email }),
      });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0d1420 0%, #1a2744 100%)', paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>

      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(232,160,32,0.15)', border: '2px solid rgba(232,160,32,0.3)' }}>
            <span style={{ fontSize: 40 }}>📧</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">אמת את האימייל שלך</h1>
          <p className="text-gray-400 text-sm">
            שלחנו קוד של 6 ספרות ל:
            <br />
            <span className="text-white font-semibold">{email}</span>
          </p>
        </div>

        {/* Code inputs */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl mb-4">
          <div className="flex gap-2 justify-center mb-5" dir="ltr" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoFocus={i === 0}
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => { if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i-1]?.focus(); }}
                className="w-12 h-14 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all"
                style={{
                  borderColor: digit ? '#e8a020' : '#e5e7eb',
                  background: digit ? 'rgba(232,160,32,0.05)' : '#f9fafb',
                  color: '#0d1420',
                }}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5 text-center mb-4">
              {error}
            </div>
          )}

          <button
            onClick={() => handleVerify()}
            disabled={loading || code.join('').length !== 6}
            className="w-full text-white font-black text-base rounded-2xl py-4 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #e8a020, #f0c050)', boxShadow: '0 4px 20px rgba(232,160,32,0.3)' }}>
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                מאמת...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={18} /> אמת חשבון
              </div>
            )}
          </button>
        </div>

        {/* Resend */}
        <div className="text-center">
          {resent ? (
            <p className="text-green-400 text-sm font-semibold">✅ קוד חדש נשלח!</p>
          ) : (
            <p className="text-gray-500 text-sm">
              לא קיבלת?{' '}
              <button onClick={handleResend} className="font-bold" style={{ color: '#e8a020' }}>
                שלח שוב
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          בדוק גם בתיקיית הספאם
        </p>
      </div>
    </div>
  );
};
