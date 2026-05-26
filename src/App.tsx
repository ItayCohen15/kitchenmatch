import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { usePush } from './hooks/usePush';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { RestaurantApp } from './components/restaurant/RestaurantApp';
import { WorkerApp } from './components/worker/WorkerApp';

const AppContent: React.FC = () => {
  const { userRole, setUserRole, setUserProfile, userProfile } = useApp();
  usePush(userProfile?.UserId || userProfile?.userId);
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<any>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('km_token');
    const savedRole = localStorage.getItem('km_role');
    const savedProfile = localStorage.getItem('km_profile');
    const onboardingDone = localStorage.getItem('km_onboarding');
    if (savedToken && savedRole) {
      setToken(savedToken);
      setUserRole(savedRole as 'restaurant' | 'worker');
      if (savedProfile) {
        try { setUserProfile(JSON.parse(savedProfile)); } catch {}
      }
      if (!onboardingDone) setNeedsOnboarding(true);
      // שמור role ב-localStorage לשחזור מסך
      localStorage.setItem('km_role', savedRole);
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = (newToken: string, role: string, profile: any, isNew?: boolean) => {
    setToken(newToken);
    setUserRole(role as 'restaurant' | 'worker');
    setPendingProfile(profile);
    localStorage.setItem('km_token', newToken);
    localStorage.setItem('km_role', role);
    if (isNew) {
      setNeedsOnboarding(true);
    } else {
      if (profile) {
        setUserProfile(profile);
        localStorage.setItem('km_profile', JSON.stringify(profile));
      }
      localStorage.setItem('km_onboarding', 'done');
    }
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
      <div className="w-full max-w-sm bg-white relative shadow-2xl flex flex-col" style={{ height: '100dvh' }}>
        {!token && <Auth onLogin={handleLogin} />}
        {showOnboarding && (
          <Onboarding
            role={userRole as 'restaurant' | 'worker'}
            userId={pendingProfile?.UserId || 1}
            profileId={pendingProfile?.Id || 1}
            onComplete={handleOnboardingComplete}
          />
        )}
        {showApp && userRole === 'restaurant' && <RestaurantApp />}
        {showApp && userRole === 'worker' && <WorkerApp />}
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
