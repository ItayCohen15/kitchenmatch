const BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://deprive-shakable-fog.ngrok-free.dev';

const getToken = () => localStorage.getItem('km_token') || '';

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
  'ngrok-skip-browser-warning': 'true'
});

const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'שגיאה בשרת');
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

  acceptJob: (jobId: number, workerId: number) =>
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
    fetch(`${BASE}/jobs/${jobId}/end-status`, { headers: headers() }).then(handleResponse),

  getShiftsToConfirm: (restaurantId: number) =>
    fetch(`${BASE}/jobs/restaurant/${restaurantId}/to-confirm`, { headers: headers() }).then(handleResponse),

  getWorkerHistory: (workerId: number) =>
    fetch(`${BASE}/jobs/worker/${workerId}`, { headers: headers() }).then(handleResponse),

  getStartStatus: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/start-status`, { headers: headers() }).then(handleResponse),

  initiateStart: (jobId: number, side: 'worker' | 'restaurant') =>
    fetch(`${BASE}/jobs/${jobId}/initiate-start`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({ side })
    }).then(handleResponse),

  confirmStart: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/confirm-start`, {
      method: 'PUT', headers: headers()
    }).then(handleResponse),

  startJob: (jobId: number) =>
    fetch(`${BASE}/jobs/${jobId}/start`, {
      method: 'PUT',
      headers: headers()
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

  getWorkerEarnings: (workerId: number) =>
    fetch(`${BASE}/workers/${workerId}/earnings`, { headers: headers() }).then(handleResponse),

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

  sendRating: (jobId: number, fromUserId: number, toUserId: number, score: number, comment: string) =>
    fetch(`${BASE}/ratings`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ jobId, fromUserId, toUserId, score, comment })
    }).then(handleResponse),
};
