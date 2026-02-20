
export enum TaskStatus {
  TODO = 'todo',
  DONE = 'done'
}

export type RankingCriterion = 'priorityRank' | 'difficultyRank' | 'urgencyRank';

export type AppView = 'tasks' | 'habits' | 'notes' | 'calendar' | 'dashboard' | 'settings';

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekend';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isGuest?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priorityRank: number;
  difficultyRank: number;
  urgencyRank: number;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  dueDate?: string;
  lastNotified?: number;
  googleEventId?: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: HabitFrequency;
  completedDates: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
