import React from 'react';
import { Home, BarChart2, Wallet, User, PlusCircle, Clock } from 'lucide-react';

interface NavItem { id: string; label: string; icon: React.ReactNode; }
interface Props { mode: 'restaurant' | 'worker'; active: string; onNav: (id: string) => void; }

const RESTAURANT_TABS: NavItem[] = [
  { id: 'home',       label: 'בית',     icon: <Home size={21} /> },
  { id: 'create_job', label: 'משמרת',  icon: <PlusCircle size={21} /> },
  { id: 'analytics',  label: 'ניתוח',  icon: <BarChart2 size={21} /> },
  { id: 'wallet',     label: 'ארנק',   icon: <Wallet size={21} /> },
  { id: 'profile',    label: 'פרופיל', icon: <User size={21} /> },
];

const WORKER_TABS: NavItem[] = [
  { id: 'home',    label: 'משמרות',   icon: <Home size={21} /> },
  { id: 'wallet',  label: 'הכנסות',  icon: <Wallet size={21} /> },
  { id: 'history', label: 'היסטוריה', icon: <Clock size={21} /> },
  { id: 'profile', label: 'פרופיל',  icon: <User size={21} /> },
];

export const BottomNav: React.FC<Props> = ({ mode, active, onNav }) => {
  const tabs = mode === 'restaurant' ? RESTAURANT_TABS : WORKER_TABS;

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-md mx-auto px-3 pb-2">
        <div className="glass rounded-2xl shadow-xl flex overflow-hidden"
          style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.08)' }}>
          {tabs.map(tab => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNav(tab.id)}
                className="flex-1 flex flex-col items-center py-2.5 relative transition-all duration-200"
              >
                {isActive && (
                  <div className="absolute inset-1 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(232,160,32,0.15), rgba(240,192,80,0.1))' }} />
                )}
                <span className={`relative z-10 transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                  style={{ color: isActive ? '#e8a020' : '#94a3b8' }}>
                  {tab.icon}
                </span>
                <span className="relative z-10 text-[10px] font-semibold mt-0.5 transition-colors"
                  style={{ color: isActive ? '#e8a020' : '#94a3b8' }}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-1 w-1 h-1 rounded-full" style={{ background: '#e8a020' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
