import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

// באנר "אין חיבור" — מופיע אוטומטית כשהמכשיר עובר לאופליין, נעלם בחזרה.
// ממוקם מעל הכל (z-100), מיושר לעמודת האפליקציה (max-w-sm), עם safe-area.

export const OfflineBanner: React.FC = () => {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' && navigator.onLine === false
  );

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 z-[100] flex justify-center px-4 pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}>
      <div className="w-full max-w-sm">
        <div className="toast-in flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-white text-sm font-semibold shadow-xl"
          style={{ background: '#475569' }}>
          <WifiOff size={15} /> אין חיבור לאינטרנט
        </div>
      </div>
    </div>
  );
};
