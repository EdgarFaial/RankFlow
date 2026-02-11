import React from 'react';
import { Task, RankingCriterion } from '../types';
import { ChevronUp, ChevronDown, Trash2, CheckCircle2, Circle, Calendar } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  criterion: RankingCriterion;
  onMove: (taskId: string, direction: 'up' | 'down') => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  criterion, 
  onMove, 
  onDelete, 
  onToggleStatus,
  isFirst,
  isLast 
}) => {
  const rankValue = task[criterion];

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <button 
            disabled={isFirst}
            onClick={() => onMove(task.id, 'up')}
            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${isFirst ? 'text-slate-200 dark:text-slate-800' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
          >
            <ChevronUp size={20} />
          </button>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700">
            #{rankValue}
          </span>
          <button 
            disabled={isLast}
            onClick={() => onMove(task.id, 'down')}
            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${isLast ? 'text-slate-200 dark:text-slate-800' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
          >
            <ChevronDown size={20} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className={`font-semibold text-slate-900 dark:text-slate-100 truncate ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
                {task.title}
              </h3>
              {task.dueDate && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <Calendar size={12} />
                  <span>Vencimento: {new Date(task.dueDate + 'T00:00:00').toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => onToggleStatus(task.id)}
              className={`${task.status === 'done' ? 'text-green-500' : 'text-slate-300 dark:text-slate-700 hover:text-indigo-500'}`}
            >
              {task.status === 'done' ? <CheckCircle2 size={22} /> : <Circle size={22} />}
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 mt-1 italic">
            {task.description || "Nenhuma descrição fornecida."}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-medium">
                P: {task.priorityRank}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium">
                D: {task.difficultyRank}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium">
                U: {task.urgencyRank}
              </span>
            </div>
            
            <button 
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;