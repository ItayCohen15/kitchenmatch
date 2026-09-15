import React, { useState, useEffect } from 'react';
import { Bell, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../common/BottomNav';
import { api, chatSeen } from '../../api';
import { WorkerHome } from './Home';
import { JobDetails } from './JobDetails';
import { WorkerNavigation } from './Navigation';
import { WorkerActiveShift } from './ActiveShift';
import { WorkerEndShift } from './EndShift';
import { WorkerWallet } from './Wallet';
import { WorkerProfile } from './Profile';
import { WorkerHistory } from './History';
import { WorkerStages } from './Stages';
import { ReferralScreen } from '../common/ReferralScreen';
import { ChatsScreen } from '../common/ChatsScreen';
import { AssistantBot } from '../common/AssistantBot';
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
  stages:        "סטאז'",
  chats:         "הצ'אטים שלי",
  referral:      'חבר מביא חבר',
};

const NAV_TABS: WorkerScreen[] = ['home', 'stages', 'chats', 'wallet', 'history', 'profile'];

export const WorkerApp: React.FC = () => {
  const { workerScreen, navToWorker, userProfile } = useApp();
  const name = userProfile?.Name || 'עובד';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const [chatUnread, setChatUnread] = useState(0);

  // מונה הודעות צ'אט שלא נקראו (מוצג למעלה משמאל)
  useEffect(() => {
    if (!userProfile?.Id) return;
    const load = () => api.getThreads('worker', userProfile.Id)
      .then((d: any) => {
        const list = Array.isArray(d) ? d : [];
        setChatUnread(list.filter((t: any) => chatSeen.isUnread(t)).length);
      })
      .catch(() => {});
    load();
    const iv = setInterval(load, 12000);
    return () => clearInterval(iv);
  }, [userProfile?.Id]);

  const showNav = NAV_TABS.includes(workerScreen);
  const showBack = !NAV_TABS.includes(workerScreen);

  const handleNavTab = (id: string) => navToWorker(id as WorkerScreen);

  const handleBack = () => {
    const backMap: Partial<Record<WorkerScreen, WorkerScreen>> = {
      job_details:  'home',
      navigation:   'job_details',
      active_shift: 'navigation',
      end_shift:    'active_shift',
      stages:       'home',
      referral:     'profile',
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
      case 'stages':       return <WorkerStages />;
      case 'referral':     return <ReferralScreen />;
      case 'chats':        return <ChatsScreen role="worker" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="relative px-4 flex items-center justify-between flex-shrink-0"
        style={{ background:'#131a2e', borderBottom:'1px solid rgba(255,255,255,0.06)', paddingTop:'max(env(safe-area-inset-top), 12px)', paddingBottom:'12px' }}>
        {showBack ? (
          <>
            <button onClick={handleBack} className="w-10 h-10 grid place-items-center text-2xl -mr-2" style={{color:'rgba(255,255,255,0.7)'}}>‹</button>
            <span className="absolute left-1/2 -translate-x-1/2 font-bold text-base text-white">{SCREEN_TITLES[workerScreen]}</span>
            <div className="w-10" />
          </>
        ) : (
          <>
            {/* אווטאר פרופיל — ימין */}
            <button onClick={() => navToWorker('profile')} className="flex items-center gap-1" style={{ color:'rgba(255,255,255,0.5)' }}>
              <div className="w-9 h-9 rounded-full grid place-items-center text-xs font-bold" style={{ background:'#5354d3', color:'#fff' }}>{initials}</div>
              <ChevronLeft size={16} />
            </button>
            {/* לוגו — מרכז */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <img src="/logo.svg" alt="Staffly" className="w-8 h-8 rounded-lg" />
              <span className="text-white font-extrabold text-lg tracking-tight">Staffly</span>
            </div>
            {/* פעמון (צ'אטים/התראות) — שמאל */}
            <button onClick={() => navToWorker('chats')} className="relative w-10 h-10 rounded-xl grid place-items-center"
              style={{ background:'rgba(255,255,255,0.06)', color:'#c8cce0' }} title="הצ'אטים שלי">
              <Bell size={20} />
              {chatUnread > 0 && (
                <span className="absolute rounded-full" style={{ top: 9, right: 11, width: 9, height: 9, background:'#ef4444', border:'2px solid #131a2e' }} />
              )}
            </button>
          </>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4" style={{ paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' }}>
        {renderScreen()}
      </main>

      {showNav && (
        <BottomNav
          mode="worker"
          active={workerScreen}
          onNav={handleNavTab}
        />
      )}

      {/* בוט התמיכה החכם — כפתור צף (ממקם את עצמו) */}
      <AssistantBot role="worker" />
    </div>
  );
};
