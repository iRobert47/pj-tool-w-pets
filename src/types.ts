export type ViewTab =
  | 'today-schedule'
  | 'project-board'
  | 'quick-log'
  | 'pet-sanctuary'
  | 'pomodoro'
  | 'export-studio'
  | 'prd';

export interface ScheduleItem {
  id: string;
  time: string;
  project: string;
  title: string;
  description: string;
  category: '設計' | '會議紀錄' | '研發' | '行銷' | '日常';
  completed: boolean;
  fedCan: boolean;
  canRewardNote?: string;
  durationEst?: string;
  statusLabel?: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  status: '進行中' | '即將截止' | '接近完工' | '已封存';
  progress: number;
  latestMemo: string;
  latestMemoTime: string;
  noteCount: number;
  fishRewards: number;
  members: string[];
  dueDate?: string;
  isUrgent?: boolean;
  meetingTime?: string;
  previewImage?: string;
  badge?: string;
  updatedTime?: string;
  startDate?: string;
  phaseDesc?: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  title: string;
  level: number;
  hunger: number; // 0-100%
  intimacy: number; // 0-500
  companionDays: number;
  mood: string;
  avatarUrl: string;
  standingUrl?: string;
  sleepingUrl?: string;
  eatingUrl?: string;
  perk: string;
  unlocked: boolean;
  unlockProgress?: {
    current: number;
    target: number;
    unit: string;
    remainingText: string;
  };
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  achieved: boolean;
  progressPercent?: number;
  current?: number;
  target?: number;
}

export interface QuickNote {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  content: string;
  category: '靈感筆記' | '任務進度' | '會議紀錄' | '問題追蹤';
  timeSpent: number; // hours
  progressShift: number; // percent
  snack: 'tuna' | 'chicken' | 'beef';
  createdAt: string;
}

export interface PomodoroState {
  mode: 25 | 50 | 15;
  timeLeft: number; // seconds
  isRunning: boolean;
  selectedNoise: 'purr' | 'rain' | 'cafe' | 'fire' | 'none';
  volume: number;
  completedPomodoros: number;
  taskId: string;
  taskTitle: string;
}
