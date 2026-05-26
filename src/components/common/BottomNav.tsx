import React from 'react';
import { Home, BarChart2, Wallet, User, PlusCircle, Clock } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  mode: 'restaurant' | 'worker';
  active: string;
  onNav: (id: string) => void;
}

const RESTAURANT_TABS: NavItem[] = [
  { id: 'home',      label: 'בית',    icon: <Home size={20} /> },
  { id: 'create_job',label: 'משמרת', icon: <PlusCircle size={20} /> },
  { id: 'analytics', label: 'ניתוח', icon: <BarChart2 size={20} /> },
  { id: 'wallet',    label: 'ארנק',  icon: <Wallet size={20} /> },
  { id: 'profile',   label: 'פרופיל',icon: <User size={20} /> },
];

const WORKER_TABS: NavItem[] = [
  { id: 'home',    label: 'משמרות',  icon: <Home size={20} /> },
  { id: 'wallet',  label: 'הכנסות',  icon: <Wallet size={20} /> },
  { id: 'history', label: 'היסטוריה', icon: <Clock size={20} /> },
  { id: 'profile', label: 'פרופיל',  icon: <User size={20} /> },
];

export const BottomNav: React.FC<Props> = ({ mode, active, onNav }) => {
  const tabs = mode === 'restaurant' ? RESTAURANT_TABS : WORKER_TABS;

  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-100 z-50 safe-bottom">
      <div className="max-w-md mx-auto flex">
        {tabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNav(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                isActive ? 'text-amber-500' : 'text-gray-400'
              }`}
            >
              <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
