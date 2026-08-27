import React from 'react';
import { GraduationCap } from 'lucide-react';

interface Props {
  /** האם העובד סומן כסטודנט/בוגר */
  isTrainee?: boolean | number;
  school?: string;
  course?: string;
  size?: 'sm' | 'md';
}

/** תג "בוגר/ית בית ספר" — לתוכנית הכניסה למקצוע (טאלנט טרי) */
export const GradBadge: React.FC<Props> = ({ isTrainee, school, course, size = 'md' }) => {
  if (!isTrainee) return null;
  const sm = size === 'sm';
  const label = school
    ? `בוגר/ית ${school}`
    : course
      ? `בוגר/ית קורס ${course}`
      : 'בוגר/ית קורס';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-white ${
        sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
      }`}
      style={{ background: '#9a5ba6' }}
    >
      <GraduationCap size={sm ? 9 : 12} />
      {label}
    </span>
  );
};
