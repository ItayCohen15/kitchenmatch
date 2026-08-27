import React from 'react';
import { Home, BarChart2, Wallet, User, Clock, GraduationCap } from 'lucide-react';

interface NavItem { id: string; label: string; icon: React.ReactNode; }
interface Props { mode: 'restaurant' | 'worker'; active: string; onNav: (id: string) => void; }

const RESTAURANT_TABS: NavItem[] = [
  { id: 'home',       label: 'בית',     icon: <Home size={20} /> },
  { id: 'stages',     label: 'סטאז׳',  icon: <GraduationCap size={20} /> },
  { id: 'analytics',  label: 'ניתוח',  icon: <BarChart2 size={20} /> },
  { id: 'wallet',     label: 'ארנק',   icon: <Wallet size={20} /> },
  { id: 'profile',    label: 'פרופיל', icon: <User size={20} /> },
];

const WORKER_TABS: NavItem[] = [
  { id: 'home',    label: 'משמרות',   icon: <Home size={20} /> },
  { id: 'stages',  label: 'סטאז׳',   icon: <GraduationCap size={20} /> },
  { id: 'wallet',  label: 'הכנסות',  icon: <Wallet size={20} /> },
  { id: 'history', label: 'היסטוריה', icon: <Clock size={20} /> },
  { id: 'profile', label: 'פרופיל',  icon: <User size={20} /> },
];

export const BottomNav: React.FC<Props> = ({ mode, active, onNav }) => {
  const tabs = mode === 'restaurant' ? RESTAURANT_TABS : WORKER_TABS;

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50" style={{ paddingBottom: 0 }}>
      <div className="max-w-md mx-auto px-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <div className="flex overflow-hidden rounded-2xl mb-2"
          style={{
            background: '#0d1420',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 6px 22px rgba(20,28,44,0.22)',
          }}>
          {tabs.map(tab => {
            const isActive = active === tab.id;
            return (
              <button key={tab.id} onClick={() => onNav(tab.id)}
                className="flex-1 flex flex-col items-center py-3 relative transition-colors duration-150">
                {/* Active background pill */}
                {isActive && (
                  <div className="absolute inset-1.5 rounded-xl"
                    style={{ background: 'rgba(232,160,32,0.14)' }} />
                )}
                <span className="relative z-10"
                  style={{ color: isActive ? '#e8a020' : 'rgba(255,255,255,0.42)' }}>
                  {tab.icon}
                </span>
                <span className="relative z-10 text-[10px] font-semibold mt-0.5 whitespace-nowrap"
                  style={{ color: isActive ? '#e8a020' : 'rgba(255,255,255,0.42)' }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
