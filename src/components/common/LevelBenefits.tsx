import React, { useState } from 'react';
import { Check, Lock, ChevronDown, Gift } from 'lucide-react';
import { LEVELS, levelFromShifts } from '../../utils/levels';

interface Props {
  completedShifts: number;
}

export const LevelBenefits: React.FC<Props> = ({ completedShifts }) => {
  const current = levelFromShifts(completedShifts);
  const currentIdx = LEVELS.findIndex(l => l.key === current.key);
  const [expanded, setExpanded] = useState<string | null>(current.key);

  return (
    <div className="bg-white rounded-2xl p-4 card-shadow">
      <div className="flex items-center gap-2 mb-3">
        <Gift size={18} className="text-amber-500" />
        <h3 className="font-bold text-gray-800">הטבות הרמות</h3>
      </div>

      <div className="space-y-2">
        {LEVELS.map((l, idx) => {
          const reached  = completedShifts >= l.min;
          const isCurrent = l.key === current.key;
          const isOpen   = expanded === l.key;

          return (
            <div key={l.key}
              className="rounded-xl overflow-hidden border transition-all"
              style={{
                borderColor: isCurrent ? 'transparent' : '#f1f5f9',
                background: isCurrent ? 'rgba(232,160,32,0.06)' : 'white',
                boxShadow: isCurrent ? '0 0 0 2px rgba(232,160,32,0.35)' : 'none',
              }}>

              {/* כותרת רמה */}
              <button onClick={() => setExpanded(isOpen ? null : l.key)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: reached ? l.gradient : '#f1f5f9' }}>
                  {reached ? <Check size={14} className="text-green-500" /> : <Lock size={14} className="text-gray-400" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${reached ? 'text-gray-900' : 'text-gray-400'}`}>{l.label}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                        style={{ background: l.gradient }}>הרמה שלך</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{l.min}+ משמרות · עמלה {(l.commission*100).toFixed(1)}%</div>
                </div>
                <ChevronDown size={16}
                  className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* רשימת הטבות */}
              {isOpen && (
                <div className="px-3 pb-3 pt-0.5 space-y-1.5">
                  {l.perks.map(perk => (
                    <div key={perk} className="flex items-start gap-2 text-xs">
                      <Check size={13}
                        className={`flex-shrink-0 mt-0.5 ${reached ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className={reached ? 'text-gray-700' : 'text-gray-400'}>{perk}</span>
                    </div>
                  ))}
                  {idx > currentIdx && (
                    <div className="text-[11px] text-amber-600 font-semibold mt-1.5 pt-1.5 border-t border-gray-100 flex items-center gap-1">
                      <Lock size={11} /> נפתח ב-{l.min} משמרות (עוד {Math.max(l.min - completedShifts, 0)})
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
