import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { UserRole } from './types';
import { AppProvider, useApp } from './context/AppContext';
import { usePush } from './hooks/usePush';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { api } from './api';

// טעינה עצלה — כל תפקיד מוריד רק את הקוד שלו (כולל גרפים כבדים)
const RestaurantApp = lazy(() => import('./components/restaurant/RestaurantApp').then(m => ({ default: m.RestaurantApp })));
const WorkerApp = lazy(() => import('./components/worker/WorkerApp').then(m => ({ default: m.WorkerApp })));
const AdminApp = lazy(() => import('./components/admin/AdminApp').then(m => ({ default: m.AdminApp })));

// רשת ביטחון: אם נטענה גרסה ישנה שהקבצים שלה כבר לא קיימים (נפוץ בכניסה מהתראת PUSH),
// טעינת המסך נכשלת והמסך נשאר לבן — נטען מחדש פעם אחת אוטומטית כדי לקבל את הגרסה העדכנית.
class ReloadOnChunkError extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    try {
      if (!sessionStorage.getItem('km_chunk_reload')) {
        sessionStorage.setItem('km_chunk_reload', '1');
        window.location.reload();
      }
    } catch { window.location.reload(); }
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center" style={{ height: '100dvh' }}>
          <div className="text-3xl">🔄</div>
          <p className="text-gray-600 font-semibold text-sm">יש גרסה חדשה — טוען מחדש...</p>
          <button onClick={() => { try { sessionStorage.removeItem('km_chunk_reload'); } catch {} window.location.reload(); }}
            className="bg-amber-500 text-white rounded-2xl px-6 py-3 font-bold text-sm">רענן עכשיו</button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Splash } from './components/Splash';
import { Landing } from './components/Landing';
import { VerifyEmail } from './components/VerifyEmail';
// ── רובד גימור UX: גבול-שגיאה גלובלי, toasts, באנר אופליין ──
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastHost } from './components/common/Toast';
import { OfflineBanner } from './components/common/OfflineBanner';

// ניווט חכם לפי סטטוס משמרת
// אילו משמרות מצדיקות קפיצה אוטומטית בכניסה — סטאז' מנוהל בטאב הסטאז', לא חוטף את המסך
function autoNavigable(j: any): boolean {
  if (j.JobType === 'stage') return false;                                   // קונטיינר סטאז' (3 שבועות)
  if (j.JobType === 'stage_shift' && j.Status === 'confirmed') return false; // משמרת סטאז' מתוכננת — נכנסים מהלוז
  if (j.JobType === 'direct' && j.Status === 'pending_approval') return false; // הצעה ישירה — מאשרים בטאב הסטאז'
  return ['confirmed','active','pending_completion','pending_approval'].includes(j.Status);
}

async function resolveScreen(role: string, profile: any,
  navToWorker: Function, navToRestaurant: Function,
  selectWorkerJob: Function, startShift: Function) {
  try {
    if (role === 'worker' && profile?.Id) {
      const jobs = await api.getWorkerHistory(profile.Id);
      const active = Array.isArray(jobs) ? jobs.find(autoNavigable) : null;

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
      const active = Array.isArray(jobs) ? jobs.find(autoNavigable) : null;

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
  // מזהה משמרת מלחיצה על התראת PUSH (מה-URL או מהודעת ה-service worker)
  const [pendingJobId, setPendingJobId] = useState<string | null>(() => {
    try { return new URLSearchParams(window.location.search).get('job'); } catch { return null; }
  });
  // מזהה צ'אט מלחיצה על התראת הודעה
  const [pendingChatId, setPendingChatId] = useState<string | null>(() => {
    try { return new URLSearchParams(window.location.search).get('chat'); } catch { return null; }
  });

  // הגרסה נטענה בהצלחה — אפס את מנגנון הריענון האוטומטי
  useEffect(() => { try { sessionStorage.removeItem('km_chunk_reload'); } catch {} }, []);

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
      setUserRole(savedRole as UserRole);
      let profile = null;
      if (savedProfile) {
        try { profile = JSON.parse(savedProfile); setUserProfile(profile); } catch {}
      }
      if (savedRole === 'admin') {
        // מנהל-על — אין onboarding ואין ניווט חכם של משמרות
      } else if (!onboardingDone) {
        setNeedsOnboarding(true);
      } else {
        const params = new URLSearchParams(window.location.search);
        if (!params.get('job') && !params.get('chat')) {
          // בדוק סטטוס משמרת ונווט בהתאם (אלא אם הגענו דרך התראת PUSH למשמרת/צ'אט ספציפיים)
          resolveScreen(savedRole, profile, navToWorker, navToRestaurant, selectWorkerJob, startShift);
        }
      }
    }
    setAuthChecked(true);
  }, []);

  // כשuserRole מתאפס (logout) — חזור ל-Landing
  useEffect(() => {
    if (authChecked && !userRole) {
      setToken(null);
      setShowLanding(true);
      setNeedsOnboarding(false);
      setPendingProfile(null);
    }
  }, [userRole, authChecked]);

  // לחיצה על התראת PUSH כשהאפליקציה כבר פתוחה — קבל מזהה משמרת מה-service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'open-job' && e.data.jobId) setPendingJobId(String(e.data.jobId));
      if (e.data?.type === 'open-chat' && e.data.jobId) setPendingChatId(String(e.data.jobId));
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  // יש משמרת ממתינה מ-PUSH והאפליקציה מוכנה — פתח אותה אצל העובד
  useEffect(() => {
    if (!pendingJobId || !token || !userRole || needsOnboarding) return;
    const jid = pendingJobId;
    setPendingJobId(null);
    try { window.history.replaceState({}, '', window.location.pathname); } catch {}
    if (userRole !== 'worker') return;
    (async () => {
      try {
        const jobs = await api.getJobs();
        const job = Array.isArray(jobs) ? jobs.find((j: any) => String(j.Id) === String(jid)) : null;
        if (job) { selectWorkerJob(String(job.Id), job); navToWorker('job_details'); }
        else navToWorker('home'); // המשמרת כבר נתפסה/הוסרה — הצג לפחות את הבית
      } catch { navToWorker('home'); }
    })();
  }, [pendingJobId, token, userRole, needsOnboarding, selectWorkerJob, navToWorker]);

  // התראת הודעה נלחצה — פתח את מסך הצ'אטים על השיחה הנכונה
  useEffect(() => {
    if (!pendingChatId || !token || !userRole || needsOnboarding) return;
    const cid = pendingChatId;
    setPendingChatId(null);
    try { window.history.replaceState({}, '', window.location.pathname); } catch {}
    try { localStorage.setItem('km_open_chat', cid); } catch {}
    if (userRole === 'worker') navToWorker('chats' as any);
    else navToRestaurant('chats' as any);
  }, [pendingChatId, token, userRole, needsOnboarding, navToWorker, navToRestaurant]);

  const handleLogin = (newToken: string, role: string, profile: any, isNew?: boolean) => {
    setToken(newToken);
    setUserRole(role as UserRole);
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
      // נווט חכם גם אחרי login (מנהל-על אין לו משמרות — נכנס ישר לדאשבורד)
      if (role === 'worker' || role === 'restaurant') {
        resolveScreen(role, profile, navToWorker, navToRestaurant, selectWorkerJob, startShift);
      }
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
      <div className="w-full max-w-sm relative flex flex-col" style={{ height:'100dvh', background:'#f0f2f7', boxShadow:'0 0 80px rgba(232,160,32,0.15), 0 0 0 1px rgba(232,160,32,0.08)' }}>
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
        {showApp && (
          <ReloadOnChunkError>
            <Suspense fallback={
              <div className="flex items-center justify-center" style={{ height: '100dvh' }}>
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              {userRole === 'restaurant' && <RestaurantApp />}
              {userRole === 'worker'     && <WorkerApp />}
              {userRole === 'admin'      && <AdminApp />}
            </Suspense>
          </ReloadOnChunkError>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppProvider>
      <AppContent />
      {/* שכבות-על גלובליות (fixed) — ממקמות את עצמן, מעל כל המסכים */}
      <ToastHost />
      <OfflineBanner />
    </AppProvider>
  </ErrorBoundary>
);

export default App;
