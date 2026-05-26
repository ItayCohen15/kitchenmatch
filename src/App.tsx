import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { usePush } from './hooks/usePush';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { RestaurantApp } from './components/restaurant/RestaurantApp';
import { WorkerApp } from './components/worker/WorkerApp';
import { api } from './api';
import { Splash } from './components/Splash';
import { Landing } from './components/Landing';
import { VerifyEmail } from './components/VerifyEmail';

// ניווט חכם לפי סטטוס משמרת
async function resolveScreen(role: string, profile: any,
  navToWorker: Function, navToRestaurant: Function,
  selectWorkerJob: Function, startShift: Function) {
  try {
    if (role === 'worker' && profile?.Id) {
      const jobs = await api.getWorkerHistory(profile.Id);
      const active = Array.isArray(jobs)
        ? jobs.find((j: any) => ['confirmed','active','pending_completion','pending_approval'].includes(j.Status))
        : null;

      if (active) {
        selectWorkerJob(String(active.Id), active);
        localStorage.setItem('km_job', JSON.stringify(active));

        if (active.Status === 'confirmed') {
          localStorage.setItem('km_screen', 'navigation');
          navToWorker('navigation');
        } else if (active.Status === 'active') {
          startShift();
          localStorage.setItem('km_screen', 'active_shift');
          navToWorker('active_shift');
        } else if (active.Status === 'pending_completion') {
          localStorage.setItem('km_screen', 'active_shift');
          navToWorker('active_shift');
        } else if (active.Status === 'pending_approval') {
          localStorage.setItem('km_screen', 'job_details');
          navToWorker('job_details');
        }
        return; // ניהלנו — סיימנו
      }
    }

    if (role === 'restaurant' && profile?.Id) {
      const jobs = await api.getRestaurantJobs(profile.Id);
      const active = Array.isArray(jobs)
        ? jobs.find((j: any) => ['confirmed','active','pending_completion','pending_approval'].includes(j.Status))
        : null;

      if (active) {
        selectWorkerJob(String(active.Id), active);
        localStorage.setItem('km_job', JSON.stringify(active));

        if (active.Status === 'pending_approval') {
          localStorage.setItem('km_screen', 'worker_matching');
          navToRestaurant('worker_matching');
        } else if (active.Status === 'confirmed') {
          localStorage.setItem('km_screen', 'live_tracking');
          navToRestaurant('live_tracking');
        } else if (active.Status === 'active') {
          startShift();
          localStorage.setItem('km_screen', 'active_shift');
          navToRestaurant('active_shift');
        } else if (active.Status === 'pending_completion') {
          localStorage.setItem('km_screen', 'active_shift');
          navToRestaurant('active_shift');
        }
        return;
      }
    }

    // אין משמרת פעילה — חזור לבית
    const savedScreen = localStorage.getItem('km_screen');
    const safeScreens = ['home','wallet','analytics','history','profile'];
    if (savedScreen && safeScreens.includes(savedScreen)) {
      if (role === 'worker') navToWorker(savedScreen as any);
      else navToRestaurant(savedScreen as any);
    } else {
      if (role === 'worker') navToWorker('home');
      else navToRestaurant('home');
    }
  } catch {
    // fallback — בית
    if (role === 'worker') navToWorker('home');
    else navToRestaurant('home');
  }
}

const AppContent: React.FC = () => {
  const { userRole, setUserRole, setUserProfile, userProfile,
          navToWorker, navToRestaurant, selectWorkerJob, startShift } = useApp();
  usePush(userProfile?.UserId || userProfile?.userId);
  const [showSplash, setShowSplash] = useState(true);
  const [showLanding, setShowLanding] = useState(false);
  const [verifyData, setVerifyData] = useState<{userId:number,email:string}|null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<any>(null);

  useEffect(() => {
    const savedToken   = localStorage.getItem('km_token');
    const savedRole    = localStorage.getItem('km_role');
    const savedProfile = localStorage.getItem('km_profile');
    const onboardingDone = localStorage.getItem('km_onboarding');

    if (!savedToken) {
      setShowLanding(true);
    }
    if (savedToken && savedRole) {
      setToken(savedToken);
      setUserRole(savedRole as 'restaurant' | 'worker');
      let profile = null;
      if (savedProfile) {
        try { profile = JSON.parse(savedProfile); setUserProfile(profile); } catch {}
      }
      if (!onboardingDone) {
        setNeedsOnboarding(true);
      } else {
        // בדוק סטטוס משמרת ונווט בהתאם
        resolveScreen(savedRole, profile, navToWorker, navToRestaurant, selectWorkerJob, startShift);
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = (newToken: string, role: string, profile: any, isNew?: boolean) => {
    setToken(newToken);
    setUserRole(role as 'restaurant' | 'worker');
    setPendingProfile(profile);
    localStorage.setItem('km_token', newToken);
    localStorage.setItem('km_role', role);
    if (profile) localStorage.setItem('km_profile', JSON.stringify(profile));
    if (isNew) {
      setNeedsOnboarding(true);
    } else {
      if (profile) {
        setUserProfile(profile);
        localStorage.setItem('km_profile', JSON.stringify(profile));
      }
      localStorage.setItem('km_onboarding', 'done');
      // נווט חכם גם אחרי login
      resolveScreen(role, profile, navToWorker, navToRestaurant, selectWorkerJob, startShift);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setShowLanding(true);
    setVerifyData(null);
    setNeedsOnboarding(false);
    setPendingProfile(null);
  };

  const handleOnboardingComplete = (updatedProfile: any) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('km_profile', JSON.stringify(updatedProfile));
    localStorage.setItem('km_onboarding', 'done');
    setNeedsOnboarding(false);
  };

  if (!authChecked) return null;

  const showOnboarding = token && userRole && needsOnboarding;
  const showApp = token && userRole && !needsOnboarding;

  return (
    <div className="bg-gray-50 flex items-start justify-center" style={{ height: '100dvh', overflow: 'hidden' }}>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      <div className="w-full max-w-sm bg-gray-50 relative flex flex-col" style={{ height: '100dvh', boxShadow: '0 0 60px rgba(232,160,32,0.1)' }}>
        {!token && showLanding && <Landing onStart={() => setShowLanding(false)} />}
        {!token && !showLanding && <Auth onLogin={handleLogin} />}
        {showOnboarding && (() => {
          // קרא profileId מ-pendingProfile או מ-localStorage
          const savedProf = (() => { try { return JSON.parse(localStorage.getItem('km_profile') || 'null'); } catch { return null; } })();
          const prof = pendingProfile || savedProf;
          return (
            <Onboarding
              role={userRole as 'restaurant' | 'worker'}
              userId={prof?.UserId || prof?.userId || 1}
              profileId={prof?.Id || prof?.id || 1}
              onComplete={handleOnboardingComplete}
            />
          );
        })()}
        {showApp && userRole === 'restaurant' && <RestaurantApp />}
        {showApp && userRole === 'worker'     && <WorkerApp />}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
