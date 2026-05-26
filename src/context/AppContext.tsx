import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserRole, RestaurantScreen, WorkerScreen, Job, Message } from '../types';
import { INITIAL_CHAT } from '../data/mockData';

// מסכים שלא כדאי לשחזר (חד-פעמיים)
const NO_RESTORE_SCREENS = ['end_shift'];

interface AppState {
  userRole: UserRole;
  restaurantScreen: RestaurantScreen;
  workerScreen: WorkerScreen;
  activeJob: Job | null;
  chatMessages: Message[];
  shiftStartTime: Date | null;
  isEmergencyMode: boolean;
  workerSelectedJobId: string | null;
  selectedJobData: any | null;
  userProfile: any | null;
}

interface AppContextValue extends AppState {
  setUserRole: (role: UserRole) => void;
  navToRestaurant: (screen: RestaurantScreen) => void;
  navToWorker: (screen: WorkerScreen) => void;
  setActiveJob: (job: Job | null) => void;
  sendMessage: (text: string, isOwn: boolean) => void;
  startShift: () => void;
  setEmergencyMode: (v: boolean) => void;
  selectWorkerJob: (jobId: string, jobData?: any) => void;
  getSelectedJob: () => any;
  resetToLanding: () => void;
  setUserProfile: (profile: any) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>(null);

  // שחזור מסך אחרון
  const [restaurantScreen, setRestaurantScreen] = useState<RestaurantScreen>(() => {
    try {
      const s = localStorage.getItem('km_screen');
      const r = localStorage.getItem('km_role');
      if (s && r === 'restaurant' && !NO_RESTORE_SCREENS.includes(s)) return s as RestaurantScreen;
    } catch {}
    return 'home';
  });

  const [workerScreen, setWorkerScreen] = useState<WorkerScreen>(() => {
    try {
      const s = localStorage.getItem('km_screen');
      const r = localStorage.getItem('km_role');
      if (s && r === 'worker' && !NO_RESTORE_SCREENS.includes(s)) return s as WorkerScreen;
    } catch {}
    return 'home';
  });

  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>(INITIAL_CHAT);

  // שחזור זמן התחלת משמרת
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(() => {
    try {
      const t = localStorage.getItem('km_shift_start');
      return t ? new Date(t) : null;
    } catch { return null; }
  });

  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [workerSelectedJobId, setWorkerSelectedJobId] = useState<string | null>(null);

  // שחזור נתוני משמרת פעילה
  const [selectedJobData, setSelectedJobData] = useState<any | null>(() => {
    try { return JSON.parse(localStorage.getItem('km_job') || 'null'); } catch { return null; }
  });

  const [userProfile, setUserProfile] = useState<any | null>(() => {
    try { return JSON.parse(localStorage.getItem('km_profile') || 'null'); } catch { return null; }
  });

  const navToRestaurant = useCallback((screen: RestaurantScreen) => {
    setRestaurantScreen(screen);
    localStorage.setItem('km_screen', screen);
  }, []);

  const navToWorker = useCallback((screen: WorkerScreen) => {
    setWorkerScreen(screen);
    localStorage.setItem('km_screen', screen);
  }, []);

  const sendMessage = useCallback((text: string, isOwn: boolean) => {
    const newMsg: Message = {
      id: `m${Date.now()}`,
      senderId: isOwn ? 'rest1' : 'w2',
      senderName: isOwn ? 'מסעדת הגן' : 'דניאל',
      text,
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      isOwn,
    };
    setChatMessages(prev => [...prev, newMsg]);
  }, []);

  const startShift = useCallback(() => {
    const now = new Date();
    setShiftStartTime(now);
    localStorage.setItem('km_shift_start', now.toISOString());
  }, []);

  const selectWorkerJob = useCallback((jobId: string, jobData?: any) => {
    setWorkerSelectedJobId(jobId);
    if (jobData) {
      setSelectedJobData(jobData);
      localStorage.setItem('km_job', JSON.stringify(jobData));
    }
  }, []);

  const getSelectedJob = useCallback(() => {
    return selectedJobData;
  }, [selectedJobData]);

  const resetToLanding = useCallback(() => {
    setUserRole(null);
    setRestaurantScreen('home');
    setWorkerScreen('home');
    setActiveJob(null);
    setShiftStartTime(null);
    setIsEmergencyMode(false);
    setWorkerSelectedJobId(null);
    setSelectedJobData(null);
    setChatMessages(INITIAL_CHAT);
    localStorage.removeItem('km_token');
    localStorage.removeItem('km_role');
    localStorage.removeItem('km_profile');
    localStorage.removeItem('km_screen');
    localStorage.removeItem('km_job');
    localStorage.removeItem('km_shift_start');
  }, []);

  return (
    <AppContext.Provider value={{
      userRole, restaurantScreen, workerScreen, activeJob, chatMessages,
      shiftStartTime, isEmergencyMode, workerSelectedJobId, selectedJobData, userProfile,
      setUserRole, navToRestaurant, navToWorker, setActiveJob,
      sendMessage, startShift, setEmergencyMode: setIsEmergencyMode,
      selectWorkerJob, getSelectedJob, resetToLanding, setUserProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
