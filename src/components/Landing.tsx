import React, { useState } from 'react';
import { ChevronLeft, Star, Zap, Shield, Clock, Store, ChefHat, Check, Lock } from 'lucide-react';

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
    { id: 'restaurant', Icon: Store,   label: 'אני מסעדה', sub: 'דרושים עובדים' },
    { id: 'worker',     Icon: ChefHat, label: 'אני עובד',  sub: 'מחפש משמרות' },
  ];

  const chips = [
    { Icon: Check,  text: 'עובדים מאומתים' },
    { Icon: Zap,    text: 'תוך 30 דקות' },
    { Icon: Lock,   text: 'תשלום מאובטח' },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#f4f5f9' }}>

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-9 pb-9"
        style={{ background: '#1b1e38' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 relative" style={{ marginTop: 'env(safe-area-inset-top)' }}>
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ boxShadow: '0 4px 16px rgba(20,28,44,0.10)' }}>
            <img src="/logo.svg" alt="Staffly" className="w-full h-full object-cover" />
          </div>
          <div className="font-bold text-3xl tracking-tight leading-none">
            <span className="text-white">Staff</span><span style={{ color: '#5354d3' }}>ly</span>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-full mb-4 relative"
          style={{ background: 'rgba(83,84,211,0.12)', border: '1px solid rgba(83,84,211,0.28)' }}>
          <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: '#7b7cee' }}><Zap size={12} /> משמרות אקסטרה — בזמן אמת</span>
        </div>

        {/* Headline */}
        <div className="relative mb-5">
          <h1 className="text-4xl font-bold text-white mb-3" dir="ltr" style={{ lineHeight: 1.08 }}>
            Find your shift.
            <br />
            <span style={{ color: '#5354d3' }}>Fill your team.</span>
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            הפלטפורמה שמחברת מסעדות, ברים ובתי קפה עם עובדי הסעדה מקצועיים — בזמן אמת, בלחיצת כפתור.
          </p>
        </div>

        {/* Trust chips */}
        <div className="flex flex-wrap gap-2 mb-6 relative">
          {chips.map((c, i) => (
            <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#cdd7ea', border: '1px solid rgba(255,255,255,0.10)' }}>
              <c.Icon size={12} style={{ color: '#7b7cee' }} /> {c.text}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onStart}
          className="w-full font-bold text-lg rounded-2xl py-4 flex items-center justify-center gap-2 relative transition-transform active:scale-[0.98]"
          style={{ background: '#5354d3', color: '#ffffff' }}>
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
                  background: sel ? '#1b1e38' : '#fff',
                  border: sel ? '2px solid #5354d3' : '2px solid transparent',
                  boxShadow: sel ? '0 4px 16px rgba(20,28,44,0.10)' : '0 2px 10px rgba(19,22,38,0.06)',
                }}>
                <div className="mb-1.5 flex justify-center"><r.Icon size={26} style={{ color: sel ? '#5354d3' : '#131626' }} /></div>
                <div className="font-bold text-sm" style={{ color: sel ? '#fff' : '#131626' }}>{r.label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: sel ? '#5354d3' : '#94a3b8' }}>{r.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {features[activeRole].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 card-shadow flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#5354d3', color: '#ffffff' }}>
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
          style={{ background: '#1b1e38' }}>
          <h3 className="font-bold text-base mb-4 relative" style={{ color: '#5354d3' }}>איך זה עובד?</h3>
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'rgba(83,84,211,0.18)', color: '#5354d3', border: '1px solid rgba(83,84,211,0.30)' }}>
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
          className="w-full font-bold text-base rounded-2xl py-4 mb-3 transition-transform active:scale-[0.98]"
          style={{ background: '#5354d3', color: '#ffffff' }}>
          {activeRole === 'restaurant' ? 'פרסם משמרת ראשונה — בחינם' : 'מצא משמרת ראשונה — בחינם'}
        </button>

        <p className="text-center text-gray-400 text-xs pb-8">
          כבר יש לך חשבון?{' '}
          <button onClick={onStart} className="font-bold" style={{ color: '#5354d3' }}>
            כנס כאן
          </button>
        </p>
      </div>
    </div>
  );
};
