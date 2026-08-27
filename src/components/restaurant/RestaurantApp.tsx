import React, { useState, useEffect } from 'react';
import { LogOut, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../common/BottomNav';
import { api, chatSeen } from '../../api';
import { RestaurantHome } from './Home';
import { CreateJob } from './CreateJob';
import { WorkerMatching } from './WorkerMatching';
import { LiveTracking } from './Tracking';
import { ActiveShift } from './ActiveShift';
import { RestaurantEndShift } from './EndShift';
import { RestaurantWallet } from './Wallet';
import { RestaurantAnalytics } from './Analytics';
import { RestaurantProfile } from './Profile';
import { RestaurantStages } from './Stages';
import { StageSchedule } from './StageSchedule';
import { StageAddShift } from './StageAddShift';
import { TalentBrowse } from './TalentBrowse';
import { ReferralScreen } from '../common/ReferralScreen';
import { ChatsScreen } from '../common/ChatsScreen';
import { AssistantBot } from '../common/AssistantBot';
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
  stages:          "סטאז'רים",
  talent:          'טאלנט',
  chats:           "הצ'אטים שלי",
  stage_schedule:  "לוז הסטאז'",
  stage_add_shift: 'קביעת משמרת',
  referral:        'חבר מביא חבר',
};

const NAV_TABS: RestaurantScreen[] = ['home', 'create_job', 'stages', 'chats', 'analytics', 'wallet', 'profile', 'stage_schedule', 'stage_add_shift'];

export const RestaurantApp: React.FC = () => {
  const { restaurantScreen, navToRestaurant, resetToLanding, userProfile } = useApp();
  const initials = (userProfile?.Name || 'מ').slice(0, 2);
  const [chatUnread, setChatUnread] = useState(0);

  // מונה הודעות צ'אט שלא נקראו (מוצג למעלה משמאל)
  useEffect(() => {
    if (!userProfile?.Id) return;
    const load = () => api.getThreads('restaurant', userProfile.Id)
      .then((d: any) => {
        const list = Array.isArray(d) ? d : [];
        setChatUnread(list.filter((t: any) => chatSeen.isUnread(t)).length);
      })
      .catch(() => {});
    load();
    const iv = setInterval(load, 12000);
    return () => clearInterval(iv);
  }, [userProfile?.Id]);

  const showNav = NAV_TABS.includes(restaurantScreen);
  // ⚠️ אין להסתיר את הסרגל העליון במסך משמרת פעילה: הוא גם לא ב-NAV_TABS,
  // כך שבלי הסרגל אין ממנו *שום* יציאה — והמסעדה נתקעת (למשל כשהגבייה
  // נכשלת ואי אפשר להגיע לארנק כדי לטעון). המשמרת נשארת פעילה בשרת.
  const showTopBar = true;

  // מסכים פנימיים — חץ חזרה במקום כפתור היציאה
  const BACK_MAP: Partial<Record<RestaurantScreen, RestaurantScreen>> = {
    create_job:      'home',
    worker_matching: 'home',
    live_tracking:   'home',
    active_shift:    'home',
    talent:          'home',
    chats:           'home',
    stage_schedule:  'stages',
    stage_add_shift: 'stage_schedule',
    referral:        'profile',
  };
  const backTo = BACK_MAP[restaurantScreen];

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
      case 'stages':          return <RestaurantStages />;
      case 'talent':          return <TalentBrowse />;
      case 'chats':           return <ChatsScreen role="restaurant" />;
      case 'stage_schedule':  return <StageSchedule />;
      case 'stage_add_shift': return <StageAddShift />;
      case 'referral':        return <ReferralScreen />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {showTopBar && (
        <header className="px-4 flex items-center justify-between flex-shrink-0"
          style={{ background:'#0d1420', borderBottom:'1px solid rgba(255,255,255,0.07)', paddingTop:'max(env(safe-area-inset-top), 12px)', paddingBottom:'12px' }}>
          <div className="flex items-center gap-2">
            {backTo ? (
              <button onClick={() => navToRestaurant(backTo)} className="font-bold text-xl leading-none" style={{color:'rgba(255,255,255,0.6)'}} title="חזרה">
                ‹
              </button>
            ) : (
              <button onClick={resetToLanding} style={{color:'rgba(255,255,255,0.4)'}}>
                <LogOut size={18} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-white">{SCREEN_TITLES[restaurantScreen]}</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background:'#e8a020', color:'#241803' }}>
              {initials}
            </div>
          </div>
          <button className="relative" style={{color:'rgba(255,255,255,0.5)'}} onClick={() => navToRestaurant('chats')} title="הצ'אטים שלי">
            <MessageCircle size={20} />
            {chatUnread > 0 && (
              <div className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-white font-bold"
                style={{ fontSize: 9, background: '#ef4444' }}>
                {chatUnread > 9 ? '9+' : chatUnread}
              </div>
            )}
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto px-4 pt-4" style={{ paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' }}>
        {renderScreen()}
      </main>

      {showNav && (
        <BottomNav
          mode="restaurant"
          active={restaurantScreen}
          onNav={handleNavTab}
        />
      )}

      {/* בוט התמיכה החכם — כפתור צף (ממקם את עצמו) */}
      <AssistantBot role="restaurant" />
    </div>
  );
};
