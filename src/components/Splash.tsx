import React, { useEffect, useState } from 'react';

export const Splash: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1400);
    const t2 = setTimeout(() => onDone(), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className={`fixed inset-0 bg-orange-500 flex flex-col items-center justify-center z-50 transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-700/30"
          style={{ animation: 'splashPop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <span style={{ fontSize: 52 }}>🍳</span>
        </div>
        <div className="text-white text-center">
          <div className="font-black text-3xl tracking-tight">KitchenMatch</div>
          <div className="text-orange-100 text-sm mt-1">חיבור מיידי עם שפים</div>
        </div>
      </div>
      <style>{`
        @keyframes splashPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
};
