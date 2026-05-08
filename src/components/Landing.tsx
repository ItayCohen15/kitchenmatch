import React from 'react';
import { ChefHat, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Landing: React.FC = () => {
  const { setUserRole } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 flex flex-col items-center justify-between p-6">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center pt-8">
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
            <ChefHat size={48} className="text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-amber-800">✓</span>
          </div>
        </div>

        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
          KitchenMatch
        </h1>
        <p className="text-orange-100 text-lg font-medium mb-2">
          חיבור מיידי עם שפים
        </p>
        <p className="text-orange-200 text-sm max-w-xs leading-relaxed">
          מצא את השף הנכון בדיוק כשאתה צריך אותו — תוך דקות.
        </p>

        {/* Stats row */}
        <div className="flex gap-8 mt-10 mb-2">
          {[
            { value: '2,400+', label: 'שפים פעילים' },
            { value: '580+',   label: 'מסעדות' },
            { value: '4.8★',   label: 'דירוג ממוצע' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-white text-xl font-black">{s.value}</div>
              <div className="text-orange-200 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role selection */}
      <div className="w-full max-w-sm space-y-3 pb-8">
        <p className="text-center text-orange-100 text-sm font-medium mb-4">
          בחר איך אתה רוצה להתחבר
        </p>

        <button
          onClick={() => setUserRole('restaurant')}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-xl active:scale-98 transition-transform"
        >
          <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Store size={28} className="text-orange-500" />
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900 text-base">אני מסעדה</div>
            <div className="text-gray-500 text-sm">מחפש שפים ועובדי מטבח</div>
          </div>
          <div className="mr-auto text-gray-300 text-xl">‹</div>
        </button>

        <button
          onClick={() => setUserRole('worker')}
          className="w-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 flex items-center gap-4 active:scale-98 transition-transform"
        >
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ChefHat size={28} className="text-white" />
          </div>
          <div className="text-right">
            <div className="font-bold text-white text-base">אני שף / טבח</div>
            <div className="text-orange-100 text-sm">מחפש משמרות פנויות</div>
          </div>
          <div className="mr-auto text-white/50 text-xl">‹</div>
        </button>

        <p className="text-center text-orange-200/70 text-xs pt-2">
          כניסה = הסכמה לתנאי השירות ומדיניות הפרטיות
        </p>
      </div>
    </div>
  );
};
