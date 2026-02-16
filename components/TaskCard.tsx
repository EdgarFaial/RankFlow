
import React from 'react';
import { 
  ChevronUp, ChevronDown, Trash2, CheckCircle, Circle, 
  Clock, AlertTriangle, Zap, Calendar, GripVertical 
} from 'lucide-react';
import { Task, TaskStatus, RankingCriterion } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

interface TaskCardProps {
  task: Task;
  criterion: RankingCriterion;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, criterion, onDelete, onToggleStatus }) => {
  const isDone = task.status === TaskStatus.DONE;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const getRankLabel = () => {
    if (criterion === 'priorityRank') return { label: 'Prioridade', icon: AlertTriangle, color: 'text-rose-500' };
    if (criterion === 'difficultyRank') return { label: 'Esforço', icon: Zap, color: 'text-amber-500' };
    return { label: 'Urgência', icon: Clock, color: 'text-indigo-500' };
  };

  const info = getRankLabel();

  return (
    /* @ts-ignore */
    <motion.div 
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.6 : 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-shadow flex items-center gap-4 ${isDone ? 'opacity-50 grayscale' : ''}`}
    >
      {/* Alça de Arraste */}
      {!isDone && (
        <div 
          {...attributes} 
          {...listeners} 
          className="drag-handle p-2 text-slate-300 dark:text-slate-700 hover:text-slate-500 transition-colors"
        >
          <GripVertical size={20} />
        </div>
      )}

      <button 
        onClick={() => onToggleStatus(task.id)} 
        className="shrink-0 transition-transform active:scale-90"
      >
        {isDone ? <CheckCircle className="text-emerald-500" size={30} /> : <Circle className="text-slate-300 dark:text-slate-700" size={30} />}
      </button>

      <div className="flex-1 min-w-0">
        <h3 className={`text-lg font-black tracking-tight truncate mb-0.5 ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {task.title}
        </h3>
        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${info.color}`}>
             <info.icon size={10} /> {info.label} #{task[criterion]}
          </span>
          {task.dueDate && (
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onDelete(task.id)}
          className="p-3 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-2xl transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default TaskCard;
