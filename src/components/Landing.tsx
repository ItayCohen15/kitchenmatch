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
            <span className="text-xs font-bold text-amber-800">ג“</span>
          </div>
        </div>

        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
          KitchenMatch
        </h1>
        <p className="text-amber-100 text-lg font-medium mb-2">
          ׳—׳™׳‘׳•׳¨ ׳׳™׳™׳“׳™ ׳¢׳ ׳©׳₪׳™׳
        </p>
        <p className="text-orange-200 text-sm max-w-xs leading-relaxed">
          ׳׳¦׳ ׳׳× ׳”׳©׳£ ׳”׳ ׳›׳•׳ ׳‘׳“׳™׳•׳§ ׳›׳©׳׳×׳” ׳¦׳¨׳™׳ ׳׳•׳×׳• ג€” ׳×׳•׳ ׳“׳§׳•׳×.
        </p>

        {/* Stats row */}
        <div className="flex gap-8 mt-10 mb-2">
          {[
            { value: '2,400+', label: '׳©׳₪׳™׳ ׳₪׳¢׳™׳׳™׳' },
            { value: '580+',   label: '׳׳¡׳¢׳“׳•׳×' },
            { value: '4.8ג˜…',   label: '׳“׳™׳¨׳•׳’ ׳׳׳•׳¦׳¢' },
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
        <p className="text-center text-amber-100 text-sm font-medium mb-4">
          ׳‘׳—׳¨ ׳׳™׳ ׳׳×׳” ׳¨׳•׳¦׳” ׳׳”׳×׳—׳‘׳¨
        </p>

        <button
          onClick={() => setUserRole('restaurant')}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-xl active:scale-98 transition-transform"
        >
          <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Store size={28} className="text-amber-500" />
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900 text-base">׳׳ ׳™ ׳׳¡׳¢׳“׳”</div>
            <div className="text-gray-500 text-sm">׳׳—׳₪׳© ׳©׳₪׳™׳ ׳•׳¢׳•׳‘׳“׳™ ׳׳˜׳‘׳—</div>
          </div>
          <div className="mr-auto text-gray-300 text-xl">ג€¹</div>
        </button>

        <button
          onClick={() => setUserRole('worker')}
          className="w-full bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl p-4 flex items-center gap-4 active:scale-98 transition-transform"
        >
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ChefHat size={28} className="text-white" />
          </div>
          <div className="text-right">
            <div className="font-bold text-white text-base">׳׳ ׳™ ׳©׳£ / ׳˜׳‘׳—</div>
            <div className="text-amber-100 text-sm">׳׳—׳₪׳© ׳׳©׳׳¨׳•׳× ׳₪׳ ׳•׳™׳•׳×</div>
          </div>
          <div className="mr-auto text-white/50 text-xl">ג€¹</div>
        </button>

        <p className="text-center text-orange-200/70 text-xs pt-2">
          ׳›׳ ׳™׳¡׳” = ׳”׳¡׳›׳׳” ׳׳×׳ ׳׳™ ׳”׳©׳™׳¨׳•׳× ׳•׳׳“׳™׳ ׳™׳•׳× ׳”׳₪׳¨׳˜׳™׳•׳×
        </p>
      </div>
    </div>
  );
};

