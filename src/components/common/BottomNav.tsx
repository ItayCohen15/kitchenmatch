import React from 'react';
import { Home, BarChart2, Wallet, User, Clock, GraduationCap } from 'lucide-react';

interface NavItem { id: string; label: string; icon: React.ReactNode; }
interface Props { mode: 'restaurant' | 'worker'; active: string; onNav: (id: string) => void; }

const RESTAURANT_TABS: NavItem[] = [
  { id: 'home',       label: 'בית',     icon: <Home size={22} /> },
  { id: 'stages',     label: 'סטאז׳',  icon: <GraduationCap size={22} /> },
  { id: 'analytics',  label: 'ניתוח',  icon: <BarChart2 size={22} /> },
  { id: 'wallet',     label: 'ארנק',   icon: <Wallet size={22} /> },
  { id: 'profile',    label: 'פרופיל', icon: <User size={22} /> },
];

const WORKER_TABS: NavItem[] = [
  { id: 'home',    label: 'בית',      icon: <Home size={22} /> },
  { id: 'history', label: 'היסטוריה', icon: <Clock size={22} /> },
  { id: 'wallet',  label: 'הכנסות',  icon: <Wallet size={22} /> },
  { id: 'stages',  label: 'סטאז׳',   icon: <GraduationCap size={22} /> },
  { id: 'profile', label: 'פרופיל',  icon: <User size={22} /> },
];

export const BottomNav: React.FC<Props> = ({ mode, active, onNav }) => {
  const tabs = mode === 'restaurant' ? RESTAURANT_TABS : WORKER_TABS;

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex" style={{
          background: '#131a2e',
          boxShadow: '0 -6px 22px rgba(0,0,0,0.22)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        }}>
          {tabs.map(tab => {
            const isActive = active === tab.id;
            const color = isActive ? '#7b7cf0' : 'rgba(255,255,255,0.42)';
            return (
              <button key={tab.id} onClick={() => onNav(tab.id)}
                className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-1.5 relative transition-colors duration-150">
                {isActive && <span className="absolute rounded-full" style={{ top: 0, width: 26, height: 3, background: '#7b7cf0' }} />}
                <span style={{ color }}>{tab.icon}</span>
                <span className="text-[10.5px] font-bold whitespace-nowrap" style={{ color }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
