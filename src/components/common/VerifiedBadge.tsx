import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface Props {
  /** האם העובד מאומת — אישור ידני של הנהלה או KYC מאושר אצל הסליקה */
  isVerified?: boolean | number;
  size?: 'sm' | 'md';
}

/** תג "מאומת" — סימן אמון לעובד שזהותו אושרה. נגזר בשרת משני מקורות. */
export const VerifiedBadge: React.FC<Props> = ({ isVerified, size = 'md' }) => {
  if (!isVerified) return null;
  const sm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-white ${
        sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
      }`}
      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
    >
      <BadgeCheck size={sm ? 9 : 12} />
      מאומת
    </span>
  );
};
