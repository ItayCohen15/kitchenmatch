import React, { useState } from 'react';
import { LayoutDashboard, Sparkles, Users as UsersIcon, Star, Briefcase, LogOut, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AdminScreen } from '../../types';
import { AdminDashboard } from './Dashboard';
import { AdminInsights } from './Insights';
import { AdminUsers } from './Users';
import { AdminRatings } from './Ratings';
import { AdminJobs } from './Jobs';
import { AssistantBot } from '../common/AssistantBot';

const TABS: { id: AdminScreen; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'דאשבורד', icon: <LayoutDashboard size={20} /> },
  { id: 'insights',  label: 'מנכ״ל',   icon: <Sparkles size={20} /> },
  { id: 'users',     label: 'משתמשים', icon: <UsersIcon size={20} /> },
  { id: 'ratings',   label: 'דירוגים', icon: <Star size={20} /> },
  { id: 'jobs',      label: 'משמרות',  icon: <Briefcase size={20} /> },
];

const TITLES: Record<AdminScreen, string> = {
  dashboard: 'סקירת מערכת',
  insights:  'תובנות מנכ״ל',
  users:     'משתמשים',
  ratings:   'כל הדירוגים',
  jobs:      'משמרות אחרונות',
};

export const AdminApp: React.FC = () => {
  const { resetToLanding } = useApp();
  const [screen, setScreen] = useState<AdminScreen>('dashboard');

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <AdminDashboard />;
      case 'insights':  return <AdminInsights />;
      case 'users':     return <AdminUsers />;
      case 'ratings':   return <AdminRatings />;
      case 'jobs':      return <AdminJobs />;
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#131626' }}>
      {/* Header */}
      <header className="px-4 flex items-center justify-between flex-shrink-0"
        style={{ background: '#131626', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: 'max(env(safe-area-inset-top), 12px)', paddingBottom: '12px' }}>
        <button onClick={resetToLanding} style={{ color: 'rgba(255,255,255,0.4)' }} title="יציאה">
          <LogOut size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-white">{TITLES[screen]}</span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: '#5354d3' }}>
            <ShieldCheck size={16} style={{ color: '#ffffff' }} />
          </div>
        </div>
        <div style={{ width: 18 }} />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4" style={{ paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' }}>
        {renderScreen()}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 right-0 left-0 z-50"
        style={{ background: 'transparent' }}>
        <div className="max-w-md mx-auto px-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
          <div className="flex overflow-hidden rounded-2xl mb-2"
            style={{ background: '#131626', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(20,28,44,0.10)' }}>
            {TABS.map(tab => {
              const isActive = screen === tab.id;
              return (
                <button key={tab.id} onClick={() => setScreen(tab.id)}
                  className="flex-1 flex flex-col items-center py-3 relative transition-all duration-200">
                  {isActive && (
                    <div className="absolute inset-1 rounded-xl"
                      style={{ background: 'rgba(83,84,211,0.12)', boxShadow: 'inset 0 0 0 1px rgba(83,84,211,0.15)' }} />
                  )}
                  <span className={`relative z-10 transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                    style={{ color: isActive ? '#5354d3' : 'rgba(255,255,255,0.3)' }}>
                    {tab.icon}
                  </span>
                  <span className="relative z-10 text-[10px] font-semibold mt-0.5 whitespace-nowrap"
                    style={{ color: isActive ? '#5354d3' : 'rgba(255,255,255,0.3)' }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* בוט התמיכה החכם — כפתור צף (ממקם את עצמו) */}
      <AssistantBot role="admin" />
    </div>
  );
};
