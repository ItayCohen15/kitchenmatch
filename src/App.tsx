import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Landing } from './components/Landing';
import { RestaurantApp } from './components/restaurant/RestaurantApp';
import { WorkerApp } from './components/worker/WorkerApp';

const AppContent: React.FC = () => {
  const { userRole } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center">
      {/* Phone frame on large screens */}
      <div className="w-full max-w-sm min-h-screen bg-white relative overflow-hidden shadow-2xl flex flex-col"
        style={{ minHeight: '100svh' }}>
        {!userRole && <Landing />}
        {userRole === 'restaurant' && <RestaurantApp />}
        {userRole === 'worker' && <WorkerApp />}
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
