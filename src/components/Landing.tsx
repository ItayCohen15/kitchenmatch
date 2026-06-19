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


  return (
    <div className="h-full overflow-y-auto" style={{ background: '#f0f2f7' }}>

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-10 pb-8"
        style={{ background: 'linear-gradient(160deg, #0d1420 0%, #1a2744 60%, #162040 100%)' }}>
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: '#e8a020', transform: 'translate(-40%, -40%)' }} />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-5"
          style={{ background: '#e8a020', transform: 'translate(30%, 30%)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 relative" style={{ marginTop: 'env(safe-area-inset-top)' }}>
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
            <img src="/logo.svg" alt="Staffly" className="w-full h-full object-cover" />
          </div>
          <div className="font-black text-xl">
            <span className="text-white">Staff</span>
            <span style={{ color: '#e8a020' }}>ly</span>
          </div>
        </div>

        {/* Headline */}
        <div className="relative mb-6">
          <h1 className="text-3xl font-black text-white leading-tight mb-3" dir="ltr">
            Find your shift.
            <br />
            <span style={{ color: '#e8a020' }}>Fill your team.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            הפלטפורמה שמחברת מסעדות עם עובדי מטבח מקצועיים — בזמן אמת, בלחיצת כפתור.
          </p>
        </div>

        <button onClick={onStart}
          className="w-full text-white font-black text-lg rounded-2xl py-4 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #e8a020, #f0c050)', boxShadow: '0 6px 24px rgba(232,160,32,0.4)' }}>
          התחל עכשיו — בחינם
          <ChevronLeft size={20} />
        </button>
        <p className="text-center text-gray-500 text-xs mt-2">ללא כרטיס אשראי · תוך דקה</p>
      </div>

      {/* Content */}
      <div className="px-5 py-6">

        {/* Role tabs */}
        <div className="flex bg-white rounded-2xl p-1 card-shadow mb-5">
          {[
            { id: 'restaurant', label: '🍽️ אני מסעדה' },
            { id: 'worker',     label: '👨‍🍳 אני עובד' },
          ].map(r => (
            <button key={r.id} onClick={() => setActiveRole(r.id as any)}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                background: activeRole === r.id ? 'linear-gradient(135deg,#0d1420,#1a2744)' : 'transparent',
                color: activeRole === r.id ? '#fff' : '#94a3b8',
              }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {features[activeRole].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 card-shadow flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: 'linear-gradient(135deg, #e8a020, #f0c050)' }}>
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
        <div className="rounded-2xl p-5 mb-5 text-white"
          style={{ background: 'linear-gradient(135deg,#0d1420,#1a2744)' }}>
          <h3 className="font-black text-base mb-4" style={{ color: '#e8a020' }}>⚡ איך זה עובד?</h3>
          <div className="space-y-3">
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
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                  style={{ background: 'rgba(232,160,32,0.2)', color: '#e8a020' }}>
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
          className="w-full text-white font-black text-base rounded-2xl py-4 mb-3"
          style={{ background: 'linear-gradient(135deg,#0d1420,#1a2744)', boxShadow: '0 4px 20px rgba(13,20,32,0.3)' }}>
          הצטרף עכשיו — בחינם 🚀
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
