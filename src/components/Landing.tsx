import React, { useState } from 'react';
import { ChevronLeft, Star, Zap, Shield, Clock } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export const Landing: React.FC<Props> = ({ onStart }) => {
  const [activeRole, setActiveRole] = useState<'restaurant' | 'worker'>('restaurant');

  const features = {
    restaurant: [
      { icon: <Zap size={18} />, title: 'עובד תוך 30 דקות', desc: 'פרסם משמרת ותקבל עובד מוסמך במהירות שיא' },
      { icon: <Shield size={18} />, title: 'עובדים מאומתים', desc: 'כל עובד עבר אימות — דירוגים, ניסיון, אמינות' },
      { icon: <Clock size={18} />, title: 'תשלום אוטומטי', desc: 'ללא מזומן, ללא שיקים — הכל דיגיטלי ומאובטח' },
    ],
    worker: [
      { icon: <Clock size={18} />, title: 'גמישות מלאה', desc: 'בחר משמרות בזמן הפנוי שלך — בלי התחייבות' },
      { icon: <Shield size={18} />, title: 'תשלום מובטח', desc: 'הכסף מועבר אוטומטית אחרי כל משמרת' },
      { icon: <Star size={18} />, title: 'בנה מוניטין', desc: 'צבור דירוגים וקבל עדיפות במשמרות הטובות' },
    ],
  };

  const roles = [
    { id: 'restaurant', emoji: '🍽️', label: 'אני מסעדה', sub: 'דרושים עובדים' },
    { id: 'worker',     emoji: '🧑‍🍳', label: 'אני עובד',  sub: 'מחפש משמרות' },
  ];

  const chips = ['✓ עובדים מאומתים', '⚡ תוך 30 דקות', '🔒 תשלום מאובטח'];

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#f0f2f7' }}>

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-9 pb-9"
        style={{ background: 'radial-gradient(125% 85% at 82% 0%, #22335c 0%, #1a2744 45%, #0d1420 100%)' }}>
        {/* glow blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,160,32,0.20), transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,160,32,0.10), transparent 70%)', transform: 'translate(-30%,30%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 relative" style={{ marginTop: 'env(safe-area-inset-top)' }}>
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ boxShadow: '0 10px 30px rgba(232,160,32,0.40)' }}>
            <img src="/logo.svg" alt="Staffly" className="w-full h-full object-cover" />
          </div>
          <div className="font-black text-3xl tracking-tight leading-none">
            <span className="text-white">Staff</span><span style={{ color: '#e8a020' }}>ly</span>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-full mb-4 relative"
          style={{ background: 'rgba(232,160,32,0.12)', border: '1px solid rgba(232,160,32,0.28)' }}>
          <span className="text-xs font-bold" style={{ color: '#f0c050' }}>⚡ משמרות אקסטרה — בזמן אמת</span>
        </div>

        {/* Headline */}
        <div className="relative mb-5">
          <h1 className="text-4xl font-black text-white mb-3" dir="ltr" style={{ lineHeight: 1.08 }}>
            Find your shift.
            <br />
            <span style={{ color: '#e8a020' }}>Fill your team.</span>
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            הפלטפורמה שמחברת מסעדות, ברים ובתי קפה עם עובדי הסעדה מקצועיים — בזמן אמת, בלחיצת כפתור.
          </p>
        </div>

        {/* Trust chips */}
        <div className="flex flex-wrap gap-2 mb-6 relative">
          {chips.map((c, i) => (
            <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#cdd7ea', border: '1px solid rgba(255,255,255,0.10)' }}>
              {c}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onStart}
          className="w-full text-white font-black text-lg rounded-2xl py-4 flex items-center justify-center gap-2 relative transition-transform active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #e8a020, #f0c050)', boxShadow: '0 8px 30px rgba(232,160,32,0.45)' }}>
          התחל עכשיו — בחינם
          <ChevronLeft size={20} />
        </button>
        <p className="text-center text-gray-400 text-xs mt-2.5 relative">ללא כרטיס אשראי · נרשמים תוך דקה</p>
      </div>

      {/* Content */}
      <div className="px-5 py-6">

        {/* Role selector */}
        <div className="text-center mb-3">
          <span className="text-gray-500 text-xs font-bold">למי Staffly מתאים?</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {roles.map(r => {
            const sel = activeRole === r.id;
            return (
              <button key={r.id} onClick={() => setActiveRole(r.id as any)}
                className="rounded-2xl p-4 text-center transition-all active:scale-[0.98]"
                style={{
                  background: sel ? 'linear-gradient(135deg,#0d1420,#1a2744)' : '#fff',
                  border: sel ? '2px solid #e8a020' : '2px solid transparent',
                  boxShadow: sel ? '0 8px 24px rgba(232,160,32,0.25)' : '0 2px 10px rgba(13,20,32,0.06)',
                }}>
                <div className="text-3xl mb-1.5">{r.emoji}</div>
                <div className="font-black text-sm" style={{ color: sel ? '#fff' : '#0d1420' }}>{r.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: sel ? '#e8a020' : '#94a3b8' }}>{r.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {features[activeRole].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 card-shadow flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: 'linear-gradient(135deg, #e8a020, #f0c050)', boxShadow: '0 4px 12px rgba(232,160,32,0.3)' }}>
                {f.icon}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">{f.title}</div>
                <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-2xl p-5 mb-6 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0d1420,#1a2744)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(232,160,32,0.13), transparent 70%)', transform: 'translate(30%,-30%)' }} />
          <h3 className="font-black text-base mb-4 relative" style={{ color: '#e8a020' }}>⚡ איך זה עובד?</h3>
          <div className="space-y-3.5 relative">
            {(activeRole === 'restaurant' ? [
              { n:'1', t:'פרסם משמרת', d:'בחר תפקיד, שעות ושכר' },
              { n:'2', t:'קבל מועמדים', d:'עובדים מוסמכים יגישו מועמדות' },
              { n:'3', t:'אשר עובד', d:'בחר ואשר — העובד בדרך' },
              { n:'4', t:'משמרת ותשלום', d:'מעקב חי + תשלום אוטומטי' },
            ] : [
              { n:'1', t:'הגדר פרופיל', d:'תפקיד, ניסיון ותעריף' },
              { n:'2', t:'גלה משמרות', d:'הזדמנויות קרובות אליך' },
              { n:'3', t:'הגש מועמדות', d:'בלחיצה אחת — תוך שניות' },
              { n:'4', t:'עבוד ותרוויח', d:'תשלום ישיר אחרי כל משמרת' },
            ]).map(s => (
              <div key={s.n} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: 'rgba(232,160,32,0.18)', color: '#e8a020', border: '1px solid rgba(232,160,32,0.30)' }}>
                  {s.n}
                </div>
                <div>
                  <span className="font-semibold text-white text-sm">{s.t}</span>
                  <span className="text-gray-400 text-xs mr-2"> — {s.d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <button onClick={onStart}
          className="w-full text-white font-black text-base rounded-2xl py-4 mb-3 transition-transform active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #e8a020, #f0c050)', boxShadow: '0 8px 28px rgba(232,160,32,0.4)' }}>
          {activeRole === 'restaurant' ? 'פרסם משמרת ראשונה — בחינם 🚀' : 'מצא משמרת ראשונה — בחינם 🚀'}
        </button>

        <p className="text-center text-gray-400 text-xs pb-8">
          כבר יש לך חשבון?{' '}
          <button onClick={onStart} className="font-bold" style={{ color: '#e8a020' }}>
            כנס כאן
          </button>
        </p>
      </div>
    </div>
  );
};
