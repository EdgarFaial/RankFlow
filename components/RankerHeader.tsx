
import React from 'react';
import { RankingCriterion } from '../types';

interface RankerHeaderProps {
  config: { id: RankingCriterion; label: string; color: string };
  isActive: boolean;
  onClick: () => void;
}

const RankerHeader: React.FC<RankerHeaderProps> = ({ config, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 
        ${isActive 
          ? `${config.color} border-transparent text-white shadow-lg scale-105` 
          : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-500/30'
        }`}
    >
      {config.label === 'priorityRank' ? 'Prioridade' : config.label === 'difficultyRank' ? 'Dificuldade' : 'Urgência'}
    </button>
  );
};

export default RankerHeader;
