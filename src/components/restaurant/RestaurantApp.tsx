import React, { useState, useEffect } from 'react';
import { ChefHat, LogOut, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../common/BottomNav';
import { NotificationPanel } from '../common/NotificationPanel';
import { api } from '../../api';
import { RestaurantHome } from './Home';
import { CreateJob } from './CreateJob';
import { WorkerMatching } from './WorkerMatching';
import { LiveTracking } from './Tracking';
import { ActiveShift } from './ActiveShift';
import { RestaurantEndShift } from './EndShift';
import { RestaurantWallet } from './Wallet';
import { RestaurantAnalytics } from './Analytics';
import { RestaurantProfile } from './Profile';
import type { RestaurantScreen } from '../../types';

const SCREEN_TITLES: Record<RestaurantScreen, string> = {
  home:            'ראשי',
  create_job:      'פרסום משמרת',
  worker_matching: 'התאמת עובדים',
  live_tracking:   'מעקב חי',
  active_shift:    'משמרת פעילה',
  end_shift:       'סיום משמרת',
  wallet:          'ארנק',
  analytics:       'ניתוח',
  profile:         'הפרופיל שלי',
};

const NAV_TABS: RestaurantScreen[] = ['home', 'create_job', 'analytics', 'wallet', 'profile'];

export const RestaurantApp: React.FC = () => {
  const { restaurantScreen, navToRestaurant, resetToLanding, userProfile } = useApp();
  const initials = (userProfile?.Name || 'מ').slice(0, 2);
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

  const showNav = NAV_TABS.includes(restaurantScreen);
  const showTopBar = !['active_shift'].includes(restaurantScreen);

  const handleNavTab = (id: string) => {
    navToRestaurant(id as RestaurantScreen);
  };

  const renderScreen = () => {
    switch (restaurantScreen) {
      case 'home':            return <RestaurantHome />;
      case 'create_job':      return <CreateJob />;
      case 'worker_matching': return <WorkerMatching />;
      case 'live_tracking':   return <LiveTracking />;
      case 'active_shift':    return <ActiveShift />;
      case 'end_shift':       return <RestaurantEndShift />;
      case 'wallet':          return <RestaurantWallet />;
      case 'analytics':       return <RestaurantAnalytics />;
      case 'profile':         return <RestaurantProfile />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {showTopBar && (
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={resetToLanding} className="text-gray-400 hover:text-gray-600">
              <LogOut size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-gray-900 text-base">{SCREEN_TITLES[restaurantScreen]}</span>
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
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
        </header>
      )}

      {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {renderScreen()}
      </main>

      {showNav && (
        <BottomNav
          mode="restaurant"
          active={restaurantScreen}
          onNav={handleNavTab}
        />
      )}
    </div>
  );
};
