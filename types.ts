
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  themeColor?: string;
  communityId?: string;
  joinedCommunities?: string[];
  isOnline?: boolean;
  lastSeen?: string;
  routineAchievementCount?: number;
  lastViewedPsychReportId?: string;
  lastViewedRelReportId?: string;
  lastViewedDiaryId?: string;
  lastViewedTransactionId?: string;
  lastViewedRoutineId?: string;
  lastViewedActivityId?: string;
  hiddenTabs?: string[];
  navOrder?: string[];
  navDividers?: string[]; // Array of tab IDs that should have a separator after them
  bankName?: string;
  accountNumber?: string;
  kakaoPayLink?: string;
  introText?: string;
  profileImageUrl?: string;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  amount?: number;
  message: string;
  adminReply?: string;
  createdAt: string;
  isMonthly?: boolean;
}

export type ToastType = 'SUCCESS' | 'ERROR' | 'INFO';

export interface Category {
  id: string;
  name: string;
  group: string;
  type: TransactionType;
  budgetLimit: number;
  individualLimits?: Record<string, number>;
  color: string;
  iconId: string;
  communityId?: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export type StickerType = 
  | 'WELL_DONE' | 'OKAY' | 'THUMBS_UP' | 'LOVE' | 'SHOUT' | 'ANGRY' 
  | 'LAUGH' | 'CRY' | 'SURPRISE' | 'PARTY' | 'SICK' | 'SLEEPY' 
  | 'STAR' | 'WINK' | 'HEART_EYES' | 'COOL' | 'CALM' | 'THINK';

export interface DiarySticker {
  id: string;
  userId: string;
  type: StickerType;
  x: number;
  y: number;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  date: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  userId: string;
  date: string;
  description: string;
  photoUrl?: string;
  location?: GeoLocation;
  likes?: string[];
  dislikes?: string[];
  comments?: Comment[];
  createdAt?: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  userId: string;
  text: string;
  reactions: string[];
  stickers?: DiarySticker[];
  comments?: Comment[];
  title?: string;
  photoUrl?: string;
  location?: GeoLocation;
  isPrivate?: boolean;
  createdAt?: string;
}

export interface ScheduleEntry {
  id: string;
  userId: string;
  date: string;
  time?: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  category: 'PRIVATE' | 'SHARED' | 'IMPORTANT';
  createdAt?: string;
}

export interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  userId: string;
  dayOfMonth: number;
  lastProcessedMonth?: string;
}

export interface BudgetStatus {
  categoryId: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'EXCEEDED';
  individualStatus?: Record<string, { spent: number; limit: number; percentage: number }>;
}

// --- NEW LIFESTYLE TYPES ---

export interface ShoppingItem {
  id: string;
  text: string;
  isBought: boolean;
  addedByUserId: string;
}

export interface EssentialItem {
  id: string;
  text: string;
  isStocked: boolean;
  addedByUserId: string;
}

export interface ActionPlan {
  title: string;
  description: string;
}

export interface AssetAllocation {
  category: string;
  percentage: number;
}

export interface AssetAnalysis {
  netWorth: number;
  healthScore: number;
  reducibleExpenses: number;
  additionalInvestment: number;
  recommendedAllocation: AssetAllocation[];
  actionPlans: ActionPlan[];
  aiAdvice: string;
}

export interface CounselingRecord {
  id: string;
  userId: string;
  date: string;
  diaryId?: string;
  diaryText: string;
  aiAdvice: string;
  createdAt: string;
}

// --- NEW LIFE ROUTINE TYPES ---

export type RoutineStatus = 'STABLE' | 'CAUTION' | 'RECOVERY' | 'BURNOUT';

export interface RoutineTask {
  id: string;
  title: string;
  description: string;
  type: 'READING' | 'DIARY' | 'MEDITATION' | 'WALKING' | 'RUNNING' | 'BREAKFAST' | 'WAKEUP' | 'LEARNING' | 'OTHER';
  isCompleted: boolean;
}

export interface RoutineDay {
  date: string; // YYYY-MM-DD
  tasks: RoutineTask[];
}

export interface LifeRoutine {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: RoutineStatus;
  diagnosis: string; // AI's assessment summary
  score: number; // Mental health score (0-100)
  days: RoutineDay[];
  createdAt: string;
}

export interface EmotionalPoint {
  date: string;
  score: number;
  emotion: string;
}

export interface PsychologicalReport {
  id: string;
  userId: string;
  communityId: string;
  startDate: string;
  endDate: string;
  summary: string;
  mentalTrend: string;
  directionality: string;
  emotionalShift: EmotionalPoint[];
  positiveTriggers: string[];
  negativeTriggers: string[];
  createdAt: string;
}

export interface RelationshipReport {
  id: string;
  communityId: string;
  summary: string;
  synergyAnalysis: string;
  positiveTriggers: string[];
  recommendations: string[];
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  tags?: string[];
  likes?: string[];
  viewCount?: number;
  comments?: Comment[];
  createdAt: string;
  authorId: string;
  authorName: string;
  communityId: string;
}

export interface AssetSurvey {
  step1: {
    savings: number;
    stocks: number;
    realEstate: number;
    debt: number;
  };
  step2: {
    irregularExpenses: number;
  };
  step3: {
    riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
    experience: string;
    targetReturn: number;
  };
  step4: {
    goal: string;
    targetAmount: number;
    period: number;
  };
  status: 'IDLE' | 'STEP1' | 'STEP2' | 'STEP3' | 'STEP4' | 'ANALYSIS' | 'COMPLETED';
}

