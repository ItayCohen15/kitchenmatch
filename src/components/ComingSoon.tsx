import React from 'react';

// דף החזקה זמני — מוצג למבקרים לא-מחוברים במקום מסך הפתיחה,
// עד שנסיים לעדכן את דף הנחיתה. גישה לאפליקציה: stafflyil.com/?enter=1
export const ComingSoon: React.FC = () => (
  <div
    className="h-full w-full flex flex-col items-center justify-center text-center px-8"
    style={{ background: 'linear-gradient(160deg,#080c14 0%,#0f1829 55%,#0a1020 100%)' }}
  >
    <div
      className="w-20 h-20 rounded-2xl overflow-hidden mb-6"
      style={{ boxShadow: '0 8px 40px rgba(232,160,32,0.35)' }}
    >
      <img src="/logo.svg" alt="Staffly" className="w-full h-full object-cover" />
    </div>

    <h1 className="text-4xl font-black mb-4 tracking-tight">
      <span style={{ color: '#ffffff' }}>Staff</span>
      <span style={{ color: '#e8a020' }}>ly</span>
    </h1>

    <div
      className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-5"
      style={{ background: 'rgba(232,160,32,0.12)', color: '#f0c050', border: '1px solid rgba(232,160,32,0.3)' }}
    >
      בקרוב
    </div>

    <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#8899bb' }}>
      פלטפורמה לחיבור מסעדות, ברים ובתי קפה עם עובדי משמרות — עולה לאוויר בקרוב.
    </p>
  </div>
);
