// כתובת ה-API: בענן מגדירים VITE_API_URL ב-Vercel; אחרת נפילה למקומי/ngrok
const BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://deprive-shakable-fog.ngrok-free.dev');

const getToken = () => localStorage.getItem('km_token') || '';

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
  'ngrok-skip-browser-warning': 'true'
});

const handleResponse = async (res: Response) => {
  // נסה לפענח JSON; אם הגוף אינו JSON (למשל שגיאת שרת/גודל) — תן הודעה ברורה
  let data: any = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; }
  catch {
    if (res.status === 413) throw new Error('הקובץ גדול מדי');
    throw new Error(`שגיאת שרת (${res.status})`);
  }
  if (!res.ok) {
    const msg = data?.error || `שגיאת שרת (${res.status})`;
    // טוקן פג/לא תקין — נקה והחזר למסך כניסה (לא חל על "סיסמא שגויה" בכניסה)
    if (res.status === 401 && (msg === 'טוקן לא תקין' || msg === 'נדרש אימות')) {
      ['km_token', 'km_role', 'km_profile', 'km_onboarding', 'km_screen', 'km_job']
        .forEach(k => localStorage.removeItem(k));
      location.reload();
    }
    throw new Error(msg);
  }
  return data;
};

export const api = {

  // ========== AUTH ==========
  register: (email: string, password: string, role: string, name: string, city: string) =>
    fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password, role, name, city })
    }).then(handleResponse),

  login: (email: string, password: string) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password })
    }).then(handleResponse),

  // ========== JOBS ==========
  getJobs: () =>
    fetch(`${BASE}/jobs`, { headers: headers() }).then(handleResponse),

  getRestaurantJobs: (restaurantId: number) =>
    fetch(`${BASE}/jobs/restaurant/${restaurantId}`, { headers: headers() }).then(handleResponse),

  createJob: (job: object) =>
    fetch(`${BASE}/jobs`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(job)
    }).then(handleResponse),

  applyToJob: (jobId: number, workerId: number) =>
    fetch(`${BASE}/jobs/${jobId}/apply`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ workerId })
    }).then(handleResponse),

  approveWorker: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/approve`, {
      method: 'PUT',
      headers: headers()
    }).then(handleResponse),

  rejectWorker: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/reject`, {
      method: 'PUT',
      headers: headers()
    }).then(handleResponse),

  getPendingApplications: (restaurantId: number) =>
    fetch(`${BASE}/jobs/restaurant/${restaurantId}/pending`, { headers: headers() }).then(handleResponse),

  workerEndShift: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/worker-end`, {
      method: 'PUT', headers: headers()
    }).then(handleResponse),

  restaurantEndShift: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/restaurant-end`, {
      method: 'PUT', headers: headers()
    }).then(handleResponse),

  getEndStatus: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/end-status`, { headers: headers(), cache: 'no-store' }).then(handleResponse),

  getWorkerHistory: (workerId: number) =>
    fetch(`${BASE}/jobs/worker/${workerId}`, { headers: headers() }).then(handleResponse),

  getStartStatus: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/start-status`, { headers: headers(), cache: 'no-store' }).then(handleResponse),

  initiateStart: (jobId: number, side: 'worker' | 'restaurant') =>
    fetch(`${BASE}/jobs/${jobId}/initiate-start`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({ side })
    }).then(handleResponse),

  confirmStart: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/confirm-start`, {
      method: 'PUT', headers: headers()
    }).then(handleResponse),

  completeJob: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/complete`, {
      method: 'PUT',
      headers: headers()
    }).then(handleResponse),

  cancelJob: (jobId: number, reason?: string, cancelledBy?: 'worker' | 'restaurant') =>
    fetch(`${BASE}/jobs/${jobId}/cancel`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ reason, cancelledBy })
    }).then(handleResponse),

  withdrawApplication: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/withdraw`, {
      method: 'PUT',
      headers: headers()
    }).then(handleResponse),

  // ========== WORKERS ==========
  getWorkers: (role?: string, city?: string) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (city) params.append('city', city);
    return fetch(`${BASE}/workers?${params}`, { headers: headers() }).then(handleResponse);
  },

  updateAvailability: (workerId: number, isAvailable: boolean) =>
    fetch(`${BASE}/workers/${workerId}/availability`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ isAvailable })
    }).then(handleResponse),

  getWorker: (workerId: number) =>
    fetch(`${BASE}/workers/${workerId}`, { headers: headers() }).then(handleResponse),

  // גלריה
  getGallery: (workerId: number) =>
    fetch(`${BASE}/workers/${workerId}/gallery`, { headers: headers() }).then(handleResponse),

  addGalleryImage: (workerId: number, imageData: string, caption?: string) =>
    fetch(`${BASE}/workers/${workerId}/gallery`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ imageData, caption })
    }).then(handleResponse),

  deleteGalleryImage: (workerId: number, imageId: number) =>
    fetch(`${BASE}/workers/${workerId}/gallery/${imageId}`, {
      method: 'DELETE', headers: headers()
    }).then(handleResponse),

  // קורות חיים
  saveCv: (workerId: number, cvData: string, cvName: string) =>
    fetch(`${BASE}/workers/${workerId}/cv`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({ cvData, cvName })
    }).then(handleResponse),

  deleteCv: (workerId: number) =>
    fetch(`${BASE}/workers/${workerId}/cv`, {
      method: 'DELETE', headers: headers()
    }).then(handleResponse),

  updateWorker: (workerId: number, data: object) =>
    fetch(`${BASE}/workers/${workerId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  // ========== RESTAURANTS ==========
  getRestaurant: (restaurantId: number) =>
    fetch(`${BASE}/restaurants/${restaurantId}`, { headers: headers() }).then(handleResponse),

  updateRestaurant: (restaurantId: number, data: object) =>
    fetch(`${BASE}/restaurants/${restaurantId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  // ========== RATINGS ==========
  getNotifications: () =>
    fetch(`${BASE}/push/notifications`, { headers: headers() }).then(handleResponse),

  markNotificationsRead: () =>
    fetch(`${BASE}/push/notifications/read-all`, { method: 'PUT', headers: headers() }).then(handleResponse),

  getRestaurantAnalytics: (restaurantId: number) =>
    fetch(`${BASE}/restaurants/${restaurantId}/analytics`, { headers: headers() }).then(handleResponse),

  getRestaurantRatings: (restaurantId: number) =>
    fetch(`${BASE}/ratings/restaurant/${restaurantId}`, { headers: headers() }).then(handleResponse),

  // ========== MESSAGES ==========
  getMessages: (jobId: number) =>
    fetch(`${BASE}/messages/${jobId}`, { headers: headers() }).then(handleResponse),

  sendMessage: (jobId: number, text: string, senderName: string, senderRole: string) =>
    fetch(`${BASE}/messages/${jobId}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ text, senderName, senderRole })
    }).then(handleResponse),

  sendRating: (
    jobId: number, fromUserId: number, toUserId: number, score: number, comment: string,
    toRole: 'worker' | 'restaurant' = 'worker',
    extra?: { wouldHireAgain?: string; skillsAsClaimed?: string; concernNote?: string }
  ) =>
    fetch(`${BASE}/ratings`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ jobId, fromUserId, toUserId, score, comment, toRole, ...(extra || {}) })
    }).then(handleResponse),

  // ========== STAGES / PARTNERSHIPS ==========
  createStage: (stage: object) =>
    fetch(`${BASE}/jobs/stage`, { method: 'POST', headers: headers(), body: JSON.stringify(stage) }).then(handleResponse),

  getStages: () =>
    fetch(`${BASE}/jobs/stages`, { headers: headers() }).then(handleResponse),

  keepWorker: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/keep`, { method: 'PUT', headers: headers() }).then(handleResponse),

  getPartners: (restaurantId: number) =>
    fetch(`${BASE}/jobs/restaurant/${restaurantId}/partners`, { headers: headers() }).then(handleResponse),

  createDirectShift: (shift: object) =>
    fetch(`${BASE}/jobs/direct`, { method: 'POST', headers: headers(), body: JSON.stringify(shift) }).then(handleResponse),

  getWorkerOffers: (workerId: number) =>
    fetch(`${BASE}/jobs/worker/${workerId}/offers`, { headers: headers() }).then(handleResponse),

  acceptOffer: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/accept-offer`, { method: 'PUT', headers: headers() }).then(handleResponse),

  // לוז סטאז' + משוב
  createStageShift: (shift: object) =>
    fetch(`${BASE}/jobs/stage-shift`, { method: 'POST', headers: headers(), body: JSON.stringify(shift) }).then(handleResponse),

  getStageShifts: (stageId: number) =>
    fetch(`${BASE}/jobs/stage/${stageId}/shifts`, { headers: headers() }).then(handleResponse),

  saveStageFeedback: (jobId: number, data: object) =>
    fetch(`${BASE}/jobs/${jobId}/stage-feedback`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),

  editStageShift: (jobId: number, data: object) =>
    fetch(`${BASE}/jobs/${jobId}/edit-stage-shift`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(handleResponse),

  cancelStage: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/cancel-stage`, { method: 'PUT', headers: headers() }).then(handleResponse),

  // ממוצעי שכר פלטפורמיים לפי תפקיד (השוואת "אני מול השוק")
  getRateBenchmark: () =>
    fetch(`${BASE}/workers/benchmark/rates`, { headers: headers() }).then(handleResponse),

  // רשימת השיחות שלי (וואטסאפ-סטייל)
  getThreads: (role: 'worker' | 'restaurant', profileId: number) =>
    fetch(`${BASE}/messages/threads/${role}/${profileId}`, { headers: headers(), cache: 'no-store' }).then(handleResponse),

  // ========== ADMIN (מנהל-על) ==========
  adminOverview: () =>
    fetch(`${BASE}/admin/overview`, { headers: headers(), cache: 'no-store' }).then(handleResponse),
  adminWorkers: () =>
    fetch(`${BASE}/admin/workers`, { headers: headers(), cache: 'no-store' }).then(handleResponse),
  adminRestaurants: () =>
    fetch(`${BASE}/admin/restaurants`, { headers: headers(), cache: 'no-store' }).then(handleResponse),
  adminRatings: () =>
    fetch(`${BASE}/admin/ratings`, { headers: headers(), cache: 'no-store' }).then(handleResponse),
  adminJobs: () =>
    fetch(`${BASE}/admin/jobs`, { headers: headers(), cache: 'no-store' }).then(handleResponse),
  adminInsights: () =>
    fetch(`${BASE}/admin/insights`, { headers: headers(), cache: 'no-store' }).then(handleResponse),
  adminPresence: () =>
    fetch(`${BASE}/admin/presence`, { headers: headers(), cache: 'no-store' }).then(handleResponse),
  adminAiAnalysis: () =>
    fetch(`${BASE}/admin/ai-analysis`, { method: 'POST', headers: headers() }).then(handleResponse),
};

// ── מעקב "נקרא" לצ'אטים (מקומי) ──
export const chatSeen = {
  get(): Record<string, number> {
    try { return JSON.parse(localStorage.getItem('km_chat_seen') || '{}'); } catch { return {}; }
  },
  mark(jobId: number, lastMsgId: number) {
    try {
      const m = chatSeen.get();
      if ((m[jobId] || 0) < lastMsgId) { m[jobId] = lastMsgId; localStorage.setItem('km_chat_seen', JSON.stringify(m)); }
    } catch {}
  },
  isUnread(jobId: number, lastMsgId?: number | null, lastSenderRole?: string, myRole?: string): boolean {
    if (!lastMsgId || !lastSenderRole || lastSenderRole === myRole) return false;
    return (chatSeen.get()[jobId] || 0) < lastMsgId;
  },
};
