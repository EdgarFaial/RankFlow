import React from 'react';
import { RankingCriterion } from '../types';

interface RankerHeaderProps {
  config: { id: RankingCriterion; label: string; color: string };
  isActive: boolean;
  onClick: () => void;
}

const RankerHeader: React.FC<RankerHeaderProps> = ({ config, isActive, onClick }) => {
  const labelMap: Record<string, string> = {
    'Priority': 'Prioridade',
    'Difficulty': 'Dificuldade',
    'Urgency': 'Urgência'
  };

  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border-2 ${
        isActive 
          ? `${config.color} text-white border-transparent shadow-lg scale-105` 
          : 'bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:border-indigo-400 border-slate-200 dark:border-slate-800 backdrop-blur-sm'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : config.color}`} />
      {labelMap[config.label] || config.label}
    </button>
  );
};

export default RankerHeader;