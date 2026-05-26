import React, { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../common/BottomNav';
import { NotificationPanel } from '../common/NotificationPanel';
import { api } from '../../api';
import { WorkerHome } from './Home';
import { JobDetails } from './JobDetails';
import { WorkerNavigation } from './Navigation';
import { WorkerActiveShift } from './ActiveShift';
import { WorkerEndShift } from './EndShift';
import { WorkerWallet } from './Wallet';
import { WorkerProfile } from './Profile';
import { WorkerHistory } from './History';
import type { WorkerScreen } from '../../types';

const SCREEN_TITLES: Record<WorkerScreen, string> = {
  home:          'משמרות',
  job_details:   'פרטי משמרת',
  navigation:    'ניווט',
  active_shift:  'משמרת פעילה',
  end_shift:     'סיים משמרת',
  wallet:        'הכנסות',
  profile:       'הפרופיל שלי',
  history:       'ההיסטוריה שלי',
};

const NAV_TABS: WorkerScreen[] = ['home', 'wallet', 'history', 'profile'];

export const WorkerApp: React.FC = () => {
  const { workerScreen, navToWorker, resetToLanding, userProfile } = useApp();
  const name = userProfile?.Name || 'עובד';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = () => api.getNotifications()
      .then((data: any[]) => setUnreadCount(data.filter((n: any) => !n.IsRead).length))
      .catch(() => {});
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  const showNav = NAV_TABS.includes(workerScreen);
  const showBack = !NAV_TABS.includes(workerScreen);

  const handleNavTab = (id: string) => navToWorker(id as WorkerScreen);

  const handleBack = () => {
    const backMap: Partial<Record<WorkerScreen, WorkerScreen>> = {
      job_details:  'home',
      navigation:   'job_details',
      active_shift: 'navigation',
      end_shift:    'active_shift',
    };
    const dest = backMap[workerScreen];
    if (dest) navToWorker(dest);
  };

  const renderScreen = () => {
    switch (workerScreen) {
      case 'home':         return <WorkerHome />;
      case 'job_details':  return <JobDetails />;
      case 'navigation':   return <WorkerNavigation />;
      case 'active_shift': return <WorkerActiveShift />;
      case 'end_shift':    return <WorkerEndShift />;
      case 'wallet':       return <WorkerWallet />;
      case 'history':      return <WorkerHistory />;
      case 'profile':      return <WorkerProfile />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button onClick={handleBack} className="text-gray-500 font-bold text-lg">›</button>
          ) : (
            <button onClick={resetToLanding} className="text-gray-400 hover:text-gray-600">
              <LogOut size={18} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-gray-900 text-base">{SCREEN_TITLES[workerScreen]}</span>
          <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </div>
        <button className="relative text-gray-500" onClick={() => { setShowNotifs(true); setUnreadCount(0); }}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-white font-bold"
              style={{ fontSize: 9, background: '#e8a020' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
        {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {renderScreen()}
      </main>

      {showNav && (
        <BottomNav
          mode="worker"
          active={workerScreen}
          onNav={handleNavTab}
        />
      )}
    </div>
  );
};
