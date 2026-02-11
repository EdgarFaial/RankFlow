
import React from 'react';
import { ChevronUp, ChevronDown, Trash2, CheckCircle, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Task, TaskStatus, RankingCriterion } from '../types';

interface TaskCardProps {
  task: Task;
  criterion: RankingCriterion;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, criterion, onMove, onDelete, onToggleStatus, isFirst, isLast }) => {
  const isDone = task.status === TaskStatus.DONE;
  
  const getRankLabel = () => {
    if (criterion === 'priorityRank') return { label: 'Prioridade', icon: AlertTriangle, color: 'text-rose-500' };
    if (criterion === 'difficultyRank') return { label: 'Esforço', icon: Clock, color: 'text-amber-500' };
    return { label: 'Urgência', icon: Clock, color: 'text-indigo-500' };
  };

  const info = getRankLabel();

  return (
    <div className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] transition-all hover:shadow-2xl flex items-center gap-6 ${isDone ? 'opacity-50 grayscale' : ''}`}>
      <button onClick={() => onToggleStatus(task.id)} className="shrink-0 transition-transform active:scale-90">
        {isDone ? <CheckCircle className="text-emerald-500" size={32} /> : <Circle className="text-slate-300 dark:text-slate-700" size={32} />}
      </button>

      <div className="flex-1 min-w-0">
        <h3 className={`text-xl font-black tracking-tight truncate mb-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {task.title}
        </h3>
        <div className="flex items-center gap-4">
          <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${info.color}`}>
             <info.icon size={12} /> {info.label} #{task[criterion]}
          </span>
          {task.dueDate && (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isDone && (
          <div className="flex flex-col gap-1">
            <button 
              disabled={isFirst} 
              onClick={() => onMove(task.id, 'up')}
              className={`p-2 rounded-xl transition-colors ${isFirst ? 'text-slate-200 dark:text-slate-800' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-500'}`}
            >
              <ChevronUp size={20} />
            </button>
            <button 
              disabled={isLast} 
              onClick={() => onMove(task.id, 'down')}
              className={`p-2 rounded-xl transition-colors ${isLast ? 'text-slate-200 dark:text-slate-800' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-indigo-500'}`}
            >
              <ChevronDown size={20} />
            </button>
          </div>
        )}
        
        <button 
          onClick={() => onDelete(task.id)}
          className="p-3 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-2xl transition-all ml-2"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
