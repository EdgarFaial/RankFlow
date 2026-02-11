import React from 'react';
import { RankingCriterion } from './types';

export const APP_NAME = "RankFlow";

export const RANKING_CONFIGS: { id: RankingCriterion; label: string; color: string }[] = [
  { id: 'priorityRank', label: 'Priority', color: 'bg-rose-500' },
  { id: 'difficultyRank', label: 'Difficulty', color: 'bg-amber-500' },
  { id: 'urgencyRank', label: 'Urgency', color: 'bg-indigo-500' },
];