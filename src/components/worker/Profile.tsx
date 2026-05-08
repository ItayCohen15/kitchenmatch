import React, { useState } from 'react';
import { Edit3, Star, Shield, TrendingUp, Award } from 'lucide-react';
import { CURRENT_WORKER, LEVEL_LABELS, LEVEL_COLORS, ROLE_LABELS } from '../../data/mockData';
import { StarRating } from '../common/StarRating';

const LEVEL_NEXT: Record<string, { next: string; progress: number; shiftsNeeded: number }> = {
  bronze: { next: 'כסף',  progress: 65, shiftsNeeded: 35  },
  silver: { next: 'זהב',  progress: 78, shiftsNeeded: 22  },
  gold:   { next: 'פרו',  progress: 52, shiftsNeeded: 57  },
  pro:    { next: 'Pro',  progress: 100, shiftsNeeded: 0  },
};

export const WorkerProfile: React.FC = () => {
  const w = CURRENT_WORKER;
  const [available, setAvailable] = useState(w.isAvailable);
  const levelInfo = LEVEL_NEXT[w.level];

  return (
    <div className="screen-enter space-y-4">
      {/* Profile header */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl"
            style={{ backgroundColor: w.avatarColor }}
          >
            {w.initials}
          </div>
          <div className="flex-1">
            <div className="font-black text-xl">{w.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[w.level]}`}>
                {LEVEL_LABELS[w.level]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                <Star size={12} className="fill-yellow-400" />
                {w.rating}
              </span>
              <span className="text-gray-400 text-sm">({w.reviewCount} ביקורות)</span>
            </div>
          </div>
          <button className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
            <Edit3 size={16} />
          </button>
        </div>

        {/* Availability toggle */}
        <div className={`flex items-center justify-between rounded-xl p-3 ${available ? 'bg-green-500/20' : 'bg-white/10'}`}>
          <span className={`font-semibold text-sm ${available ? 'text-green-300' : 'text-gray-400'}`}>
            {available ? '● זמין לעבודה' : '○ לא זמין כרגע'}
          </span>
          <button
            onClick={() => setAvailable(a => !a)}
            className={`w-12 h-6 rounded-full transition-colors ${available ? 'bg-green-500' : 'bg-gray-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow mx-0.5 transition-transform ${available ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'משמרות', value: w.completedShifts, icon: '✅' },
          { label: 'אמינות', value: `${w.reliabilityScore}%`, icon: '🛡️' },
          { label: 'ניסיון', value: `${w.yearsExp} שנ׳`, icon: '⭐' },
          { label: 'ביטולים', value: w.noShows, icon: '❌' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 card-shadow text-center">
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="font-black text-gray-900 text-sm">{s.value}</div>
            <div className="text-gray-400 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Level progress */}
      {w.level !== 'pro' && (
        <div className="bg-white rounded-2xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <Award size={18} className="text-yellow-500" />
            <h3 className="font-bold text-gray-800">התקדמות לרמה הבאה</h3>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className={`font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[w.level]}`}>{LEVEL_LABELS[w.level]}</span>
            <span className="text-gray-500">עוד {levelInfo.shiftsNeeded} משמרות → {levelInfo.next}</span>
          </div>
          <div className="bg-gray-100 rounded-full h-3">
            <div
              className="h-3 bg-gradient-to-l from-yellow-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 text-center">{levelInfo.progress}% מהדרך לרמה הבאה</div>
        </div>
      )}

      {/* Skills */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">כישורים</h3>
          <button className="text-orange-500 text-sm font-semibold">ערוך</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {w.skills.map(s => (
            <span key={s} className="bg-orange-50 text-orange-600 rounded-full px-3 py-1.5 text-sm font-medium">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-3">
          <div className="text-sm text-gray-500 mb-1">תפקידים</div>
          <div className="flex gap-2">
            {w.roles.map(r => (
              <span key={r} className="bg-blue-50 text-blue-600 rounded-full px-3 py-1.5 text-sm font-medium">
                {ROLE_LABELS[r]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-800">אודותי</h3>
          <button className="text-orange-500 text-sm font-semibold">ערוך</button>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{w.bio}</p>
      </div>

      {/* Reviews */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">ביקורות אחרונות</h3>
        <div className="space-y-2">
          {w.reviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-4 card-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800 text-sm">{r.fromName}</span>
                <StarRating value={r.score} readonly size={14} />
              </div>
              <p className="text-gray-600 text-sm">{r.comment}</p>
              <div className="text-gray-400 text-xs mt-1">{r.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
