
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priorityRank: number; // 1 is highest
  difficultyRank: number; // 1 is hardest
  urgencyRank: number; // 1 is most urgent
  status: TaskStatus;
  createdAt: number;
  dueDate?: string; // ISO string YYYY-MM-DD
}

export type RankingCriterion = 'priorityRank' | 'difficultyRank' | 'urgencyRank';

export interface RankingConfig {
  id: RankingCriterion;
  label: string;
  color: string;
}

export type AppView = 'tasks' | 'habits' | 'dashboard' | 'calendar' | 'settings';

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekend';

export interface Habit {
  id: string;
  title: string;
  frequency: HabitFrequency;
  completedDates: string[]; // Array of ISO strings YYYY-MM-DD
  createdAt: number;
}
