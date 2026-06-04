export type UserRole = 'restaurant' | 'worker' | null;
export type JobRole = 'line_cook' | 'prep_cook' | 'cleaner' | 'bartender' | 'waiter' | 'chef' | 'dishwasher';
export type WorkerLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'pro';
export type ShiftStatus = 'searching' | 'matched' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type ExperienceLevel = 'any' | 'entry' | 'mid' | 'senior';
export type RestaurantScreen =
  | 'home' | 'create_job' | 'worker_matching' | 'live_tracking'
  | 'active_shift' | 'end_shift' | 'wallet' | 'analytics' | 'profile';
export type WorkerScreen =
  | 'home' | 'job_details' | 'navigation' | 'active_shift' | 'history'
  | 'end_shift' | 'wallet' | 'profile';

export interface Worker {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  roles: JobRole[];
  level: WorkerLevel;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  yearsExp: number;
  reliabilityScore: number;
  skills: string[];
  hourlyRate: number;
  city: string;
  isAvailable: boolean;
  completedShifts: number;
  noShows: number;
  totalEarnings: number;
  pendingEarnings: number;
  bio: string;
  reviews: Review[];
}

export interface Restaurant {
  id: string;
  name: string;
  initials: string;
  logoColor: string;
  rating: number;
  city: string;
  cuisineType: string;
  address: string;
  totalShifts: number;
  walletBalance: number;
  monthlySpend: number;
  pendingPayments: number;
}

export interface Job {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantCity: string;
  restaurantAddress: string;
  role: JobRole;
  date: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  experienceRequired: ExperienceLevel;
  isEmergency: boolean;
  status: ShiftStatus;
  assignedWorkerId?: string;
  description: string;
  requiredSkills: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isOwn: boolean;
}

export interface Review {
  id: string;
  fromName: string;
  score: number;
  comment: string;
  date: string;
}

export interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'bonus' | 'penalty' | 'payment';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending';
}

export interface AnalyticsData {
  month: string;
  spend: number;
  shifts: number;
}
