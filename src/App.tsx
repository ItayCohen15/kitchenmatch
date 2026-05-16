import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Landing } from './components/Landing';
import { Auth } from './components/Auth';
import { RestaurantApp } from './components/restaurant/RestaurantApp';
import { WorkerApp } from './components/worker/WorkerApp';

const AppContent: React.FC = () => {
  const { userRole, setUserRole, setUserProfile } = useApp();
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('km_token');
    const savedRole = localStorage.getItem('km_role');
    const savedProfile = localStorage.getItem('km_profile');
    if (savedToken && savedRole) {
      setToken(savedToken);
      setUserRole(savedRole as 'restaurant' | 'worker');
      if (savedProfile) {
        try { setUserProfile(JSON.parse(savedProfile)); } catch {}
      }
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = (newToken: string, role: string, profile: any) => {
    setToken(newToken);
    setUserRole(role as 'restaurant' | 'worker');
    if (profile) {
      setUserProfile(profile);
      localStorage.setItem('km_profile', JSON.stringify(profile));
    }
  };

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center">
      <div className="w-full max-w-sm min-h-screen bg-white relative overflow-hidden shadow-2xl flex flex-col"
        style={{ minHeight: '100svh' }}>
        {!token && !userRole && <Auth onLogin={handleLogin} />}
        {!token && !userRole && false && <Landing />}
        {token && userRole === 'restaurant' && <RestaurantApp />}
        {token && userRole === 'worker' && <WorkerApp />}
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
