
export enum TaskStatus {
  TODO = 'todo',
  DONE = 'done'
}

export type RankingCriterion = 'priorityRank' | 'difficultyRank' | 'urgencyRank';

export type AppView = 'tasks' | 'habits' | 'notes' | 'calendar' | 'dashboard' | 'settings';

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekend';

export interface Task {
  id: string;
  title: string;
  description: string;
  priorityRank: number;
  difficultyRank: number;
  urgencyRank: number;
  status: TaskStatus;
  createdAt: number;
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
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
}

export interface TaskBreakdown {
  subtasks: string[];
  reasoning: string;
}

export interface RankingAudit {
  summary: string;
  suggestions: { taskId: string; improvement: string }[];
}
