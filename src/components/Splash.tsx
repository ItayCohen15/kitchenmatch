import React, { useEffect, useState } from 'react';

export const Splash: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1600);
    const t2 = setTimeout(() => onDone(), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(135deg, #0d1420 0%, #1a2744 100%)' }}
    >
      <div className="flex flex-col items-center gap-5">
        <div
          className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl"
          style={{ animation: 'splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 20px 60px rgba(232,160,32,0.35)' }}
        >
          <img src="/logo.png" alt="KitchenMatch" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <div className="font-black text-3xl tracking-tight">
            <span className="text-white">Kitchen</span>
            <span style={{ color: '#e8a020' }}>Match</span>
          </div>
          <div className="text-sm mt-1" style={{ color: '#8899bb' }}>המשמרת הבאה שלך מתחילה כאן</div>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: '#e8a020', opacity: 0.4, animation: `dotPulse 1.2s ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes splashPop {
          from { transform: scale(0.4) rotate(-5deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes dotPulse {
          0%,100% { opacity:0.3; transform:scale(1); }
          50% { opacity:1; transform:scale(1.4); }
        }
      `}</style>
    </div>
  );
};
