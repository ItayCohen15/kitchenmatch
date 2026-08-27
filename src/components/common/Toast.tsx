import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { haptic } from '../../utils/haptics';

// מערכת toast גלובלית (transient). שימוש מכל מקום — גם מחוץ לקומפוננטות:
//   import { toast } from '../common/Toast';
//   toast.success('נשמר!'); toast.error('משהו נכשל');
// ToastHost מותקן פעם אחת ב-App.tsx ומאזין ל-bus.

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; type: ToastType; message: string; }
type Listener = (t: ToastItem) => void;

let listeners: Listener[] = [];
let counter = 0;

function emit(type: ToastType, message: string) {
  if (!message) return;
  const item: ToastItem = { id: ++counter, type, message };
  listeners.forEach(l => { try { l(item); } catch { /* ignore */ } });
}

export const toast = {
  success: (m: string) => emit('success', m),
  error:   (m: string) => emit('error', m),
  info:    (m: string) => emit('info', m),
};

const STYLE: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: '#059669', icon: <CheckCircle2 size={18} /> },
  error:   { bg: '#dc2626', icon: <AlertTriangle size={18} /> },
  info:    { bg: '#1b1e38', icon: <Info size={18} /> },
};

export const ToastHost: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const l: Listener = (t) => {
      haptic(t.type === 'error' ? 'error' : t.type === 'success' ? 'success' : 'light');
      setItems(prev => [...prev.slice(-2), t]); // עד 3 בו-זמנית
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), 3500);
    };
    listeners.push(l);
    return () => { listeners = listeners.filter(x => x !== l); };
  }, []);

  if (!items.length) return null;

  return (
    <div className="fixed inset-x-0 z-[100] flex justify-center px-4 pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}>
      <div className="w-full max-w-sm flex flex-col gap-2">
        {items.map(t => (
          <div key={t.id}
            className="toast-in pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 text-white shadow-2xl"
            style={{ background: STYLE[t.type].bg }}>
            <span className="flex-shrink-0">{STYLE[t.type].icon}</span>
            <span className="text-sm font-semibold flex-1 leading-snug">{t.message}</span>
            <button onClick={() => setItems(prev => prev.filter(x => x.id !== t.id))}
              className="flex-shrink-0 opacity-70 active:opacity-100">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
