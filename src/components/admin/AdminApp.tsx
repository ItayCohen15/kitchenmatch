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
    <div className="flex flex-col h-full" style={{ background: '#0a0f1a' }}>
      {/* Header */}
      <header className="px-4 flex items-center justify-between flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #080c14 0%, #0f1829 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: 'max(env(safe-area-inset-top), 12px)', paddingBottom: '12px' }}>
        <button onClick={resetToLanding} style={{ color: 'rgba(255,255,255,0.4)' }} title="יציאה">
          <LogOut size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-black text-base text-white">{TITLES[screen]}</span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#e8a020,#f5c842)', boxShadow: '0 2px 8px rgba(232,160,32,0.4)' }}>
            <ShieldCheck size={16} className="text-white" />
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
        style={{ background: 'linear-gradient(to top, #080c14 0%, transparent 100%)' }}>
        <div className="max-w-md mx-auto px-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
          <div className="flex overflow-hidden rounded-2xl mb-2"
            style={{ background: 'rgba(10,14,24,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 -2px 30px rgba(0,0,0,0.5)' }}>
            {TABS.map(tab => {
              const isActive = screen === tab.id;
              return (
                <button key={tab.id} onClick={() => setScreen(tab.id)}
                  className="flex-1 flex flex-col items-center py-3 relative transition-all duration-200">
                  {isActive && (
                    <div className="absolute inset-1 rounded-xl"
                      style={{ background: 'rgba(232,160,32,0.12)', boxShadow: 'inset 0 0 0 1px rgba(232,160,32,0.15)' }} />
                  )}
                  <span className={`relative z-10 transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                    style={{ color: isActive ? '#e8a020' : 'rgba(255,255,255,0.3)' }}>
                    {tab.icon}
                  </span>
                  <span className="relative z-10 text-[10px] font-semibold mt-0.5 whitespace-nowrap"
                    style={{ color: isActive ? '#e8a020' : 'rgba(255,255,255,0.3)' }}>
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
