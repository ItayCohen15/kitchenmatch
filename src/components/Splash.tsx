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
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', background: '#0d1420' }}
    >
      <div className="flex flex-col items-center gap-5">
        <div
          className="w-28 h-28 rounded-3xl overflow-hidden"
          style={{ animation: 'splashPop 0.5s cubic-bezier(0.22,1,0.36,1)', boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }}
        >
          <img src="/logo.svg" alt="Staffly" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <div className="font-extrabold text-3xl tracking-tight">
            <span className="text-white">Staff</span>
            <span style={{ color: '#e8a020' }}>ly</span>
          </div>
          <div className="text-sm mt-1.5" dir="ltr" style={{ color: '#8a97ad' }}>Find your shift. Fill your team.</div>
        </div>
        <div className="flex gap-1.5 mt-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#e8a020', opacity: 0.4, animation: `dotPulse 1.2s ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes splashPop {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        @keyframes dotPulse {
          0%,100% { opacity:0.3; transform:scale(1); }
          50%     { opacity:1;   transform:scale(1.35); }
        }
      `}</style>
    </div>
  );
};
