import React, { useState } from 'react';
import { ChefHat, Store, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';

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

  const handleSubmit = async () => {
    if (!email || !password) return setError('׳ ׳ ׳׳׳׳ ׳׳™׳׳™׳™׳ ׳•׳¡׳™׳¡׳׳');
    setLoading(true);
    setError('');
    try {
      let data;
      if (mode === 'login') {
        data = await api.login(email, password);
      } else {
        data = await api.register(email, password, role, '', '');
      }
      localStorage.setItem('km_token', data.token);
      localStorage.setItem('km_role', data.role);
      if (data.profile) localStorage.setItem('km_profile', JSON.stringify(data.profile));
      const isNew = mode === 'register';
      if (isNew) localStorage.removeItem('km_onboarding');
      onLogin(data.token, data.role, data.profile, isNew);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0d1420 0%, #1a2744 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto mb-4 shadow-xl" style={{ boxShadow: '0 8px 32px rgba(232,160,32,0.3)' }}>
            <img src="/logo.png" alt="KitchenMatch" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black">
            <span className="text-white">Kitchen</span><span style={{ color: '#e8a020' }}>Match</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8899bb' }}>׳”׳׳©׳׳¨׳× ׳”׳‘׳׳” ׳©׳׳ ׳׳×׳—׳™׳׳” ׳›׳׳</p>
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
                {m === 'login' ? '׳›׳ ׳™׳¡׳”' : '׳”׳¨׳©׳׳”'}
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
                <div className="text-xs font-bold text-gray-700">׳׳¡׳¢׳“׳”</div>
              </button>
              <button
                onClick={() => setRole('worker')}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  role === 'worker' ? 'border-orange-500 bg-amber-50' : 'border-gray-100'
                }`}
              >
                <ChefHat size={20} className={`mx-auto mb-1 ${role === 'worker' ? 'text-amber-500' : 'text-gray-400'}`} />
                <div className="text-xs font-bold text-gray-700">׳¢׳•׳‘׳“</div>
              </button>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            {mode === 'register' && (
              <p className="text-xs text-gray-400 text-center bg-gray-50 rounded-xl p-2">
                נ“‹ ׳׳׳—׳¨ ׳”׳”׳¨׳©׳׳” ׳ ׳©׳׳™׳ ׳׳× ׳₪׳¨׳˜׳™ ׳”׳₪׳¨׳•׳₪׳™׳ ׳©׳׳
              </p>
            )}
            <input
              type="email"
              placeholder="׳׳™׳׳™׳™׳"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-sm focus:border-amber-400 outline-none"
            />
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="׳¡׳™׳¡׳׳"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-4 pl-10 text-right text-sm focus:border-amber-400 outline-none"
              />
              <button
                onClick={() => setShowPass(s => !s)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
                ׳˜׳•׳¢׳...
              </div>
            ) : mode === 'login' ? '׳›׳ ׳™׳¡׳”' : '׳”׳¨׳©׳׳”'}
          </button>
        </div>
      </div>
    </div>
  );
};

