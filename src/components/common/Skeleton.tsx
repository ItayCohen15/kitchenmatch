import React from 'react';

// שלד טעינה (shimmer) — מחליף ספינרים בתחושת מהירות נתפסת גבוהה יותר.
// ה-class .skeleton (ב-index.css) נותן את אנימציית ה-shimmer.

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div className={`skeleton ${className}`} style={style} />
);

// שורות טקסט מדומות (האחרונה קצרה — כמו פסקה אמיתית)
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-3" style={{ width: i === lines - 1 ? '55%' : '100%' }} />
    ))}
  </div>
);

// כרטיס מדומה התואם לכרטיסים הלבנים באפליקציה (אווטאר + טקסט + ערך)
export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 card-shadow">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5" style={{ width: '55%' }} />
        <Skeleton className="h-3" style={{ width: '35%' }} />
      </div>
      <Skeleton className="h-6 w-14" />
    </div>
  </div>
);

// רשימת כרטיסי-שלד
export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ count = 4, className = 'space-y-3' }) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);
