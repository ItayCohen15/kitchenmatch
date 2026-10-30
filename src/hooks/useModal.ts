import { useEffect, useRef } from 'react';

// נגישות מודל משותפת: Escape לסגירה, נעילת גלילת-רקע, ו-focus-trap (Tab מעגלי +
// פוקוס ראשוני לתוך המודל, והשבה לפוקוס הקודם בסגירה). מחזיר ref שמוצמד לפאנל
// המודל. onClose נשמר ב-ref כך שה-effect רץ פעם אחת בלבד (ולא מאפס פוקוס בכל רינדור).
export function useModal<T extends HTMLElement = HTMLDivElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const FOCUSABLE =
      'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const panel = ref.current;
    const prevOverflow = document.body.style.overflow;
    const prevActive = document.activeElement as HTMLElement | null;

    // נעילת גלילת הרקע כל עוד המודל פתוח
    document.body.style.overflow = 'hidden';

    // פוקוס ראשוני לתוך המודל (לקורא-מסך/מקלדת)
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key === 'Tab' && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
          .filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, []);

  return ref;
}
