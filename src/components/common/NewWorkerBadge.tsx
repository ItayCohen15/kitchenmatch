import React from 'react';
import { Sparkles } from 'lucide-react';
import { isNewWorker } from '../../utils/levels';

interface Props {
  completedShifts?: number;
  /** גודל קומפקטי לכרטיסים צפופים */
  size?: 'sm' | 'md';
}

/** תג "עובד חדש" — מוצג עד שהעובד מסיים את משמרתו השלישית */
export const NewWorkerBadge: React.FC<Props> = ({ completedShifts, size = 'md' }) => {
  if (!isNewWorker(completedShifts)) return null;
  const sm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-white ${
        sm ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
      }`}
      style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
    >
      <Sparkles size={sm ? 9 : 11} className="fill-white" />
      עובד חדש
    </span>
  );
};
