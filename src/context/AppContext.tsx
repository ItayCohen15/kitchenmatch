import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserRole, RestaurantScreen, WorkerScreen, Job } from '../types';
import { api } from '../api';

// מסכים שלא משוחזרים אחרי ריענון/כניסה — תלויים במשמרת נבחרת; נכנסים אליהם מחדש דרך הבית/הלוז
const NO_RESTORE_SCREENS = ['end_shift', 'live_tracking', 'navigation', 'worker_matching', 'job_details'];

interface AppState {
  userRole: UserRole;
  restaurantScreen: RestaurantScreen;
  workerScreen: WorkerScreen;
  activeJob: Job | null;
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
  startShift: () => void;
  setEmergencyMode: (v: boolean) => void;
  selectWorkerJob: (jobId: string, jobData?: any) => void;
  getSelectedJob: () => any;
  resetToLanding: () => void;
  setUserProfile: (profile: any) => void;
  refreshProfile: () => Promise<void>;
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

  // רענן את פרופיל המשתמש מהשרת (סטטיסטיקות, רמה, ארנק) — שלא יישאר תקוע על נתון ישן
  const refreshProfile = useCallback(async () => {
    if (!userProfile?.Id || !userRole) return;
    try {
      const fresh = userRole === 'worker'
        ? await api.getWorker(userProfile.Id)
        : userRole === 'restaurant'
          ? await api.getRestaurant(userProfile.Id)
          : null;
      if (fresh?.Id) {
        setUserProfile(fresh);
        localStorage.setItem('km_profile', JSON.stringify(fresh));
      }
    } catch { /* רענון לא קריטי */ }
  }, [userProfile?.Id, userRole]);

  const resetToLanding = useCallback(() => {
    setUserRole(null);
    setRestaurantScreen('home');
    setWorkerScreen('home');
    setActiveJob(null);
    setShiftStartTime(null);
    setIsEmergencyMode(false);
    setWorkerSelectedJobId(null);
    setSelectedJobData(null);
    localStorage.removeItem('km_token');
    localStorage.removeItem('km_role');
    localStorage.removeItem('km_profile');
    localStorage.removeItem('km_screen');
    localStorage.removeItem('km_job');
    localStorage.removeItem('km_shift_start');
  }, []);

  return (
    <AppContext.Provider value={{
      userRole, restaurantScreen, workerScreen, activeJob,
      shiftStartTime, isEmergencyMode, workerSelectedJobId, selectedJobData, userProfile,
      setUserRole, navToRestaurant, navToWorker, setActiveJob,
      startShift, setEmergencyMode: setIsEmergencyMode,
      selectWorkerJob, getSelectedJob, resetToLanding, setUserProfile, refreshProfile,
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
