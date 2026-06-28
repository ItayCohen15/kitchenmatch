import React from 'react';

// גבול-שגיאה גלובלי — תופס קריסות render כך שהמסך לא נשאר לבן.
// (משלים את ReloadOnChunkError ב-App.tsx, שמטפל ספציפית בכשל טעינת chunk.)

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err: any) {
    // נקודת חיבור עתידית ל-Sentry/לוג שרת. בינתיים — קונסול בלבד.
    try { console.error('UI crash:', err); } catch { /* ignore */ }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center" style={{ height: '100dvh' }}>
          <div className="text-4xl">😕</div>
          <p className="text-gray-700 font-bold">משהו השתבש</p>
          <p className="text-gray-400 text-sm">אירעה תקלה לא צפויה. נסה לרענן את האפליקציה.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-1 bg-amber-500 text-white rounded-2xl px-6 py-3 font-bold text-sm active:scale-95 transition-transform">
            רענן עכשיו
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
