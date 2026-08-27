import React from 'react';

// מצב-ריק אחיד: אייקון/אימוג'י + כותרת + תת-כותרת + CTA אופציונלי.
// מחליף את מצבי-הריק המפוזרים בתחושה אחידה ומזמינה.

interface Props {
  emoji?: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export const EmptyState: React.FC<Props> = ({ emoji, icon, title, subtitle, action, className = '' }) => (
  <div className={`text-center py-12 px-6 ${className}`}>
    {emoji && <div className="text-5xl mb-3">{emoji}</div>}
    {icon && (
      <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-[#ecebfd] flex items-center justify-center text-[#5354d3]">
        {icon}
      </div>
    )}
    <div className="font-bold text-gray-700">{title}</div>
    {subtitle && <div className="text-gray-400 text-sm mt-1 leading-relaxed">{subtitle}</div>}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-bold active:scale-95 transition-transform"
        style={{ background: '#5354d3', color: '#ffffff' }}>
        {action.label}
      </button>
    )}
  </div>
);
