
import React from 'react';
import { Flame, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Habit } from '../types';
import { ThemeConfig } from '../themes/theme';

interface HabitCardProps {
  habit: Habit;
  theme: ThemeConfig;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, theme, onToggle, onDelete }) => {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completedDates.includes(today);
  const streak = habit.completedDates.length;

  return (
    <div className={`${theme.cardBg} border ${theme.border} p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between group transition-all hover:scale-[1.01]`}>
      <div className="flex items-center gap-5">
        <button 
          onClick={() => onToggle(habit.id)}
          className={`shrink-0 transition-all transform active:scale-90 ${isCompletedToday ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-emerald-400'}`}
        >
          {isCompletedToday ? <CheckCircle2 size={32} /> : <Circle size={32} />}
        </button>
        
        <div>
          <h3 className={`text-xl font-black tracking-tight ${theme.textPrimary} ${isCompletedToday ? 'opacity-60' : ''}`}>
            {habit.title}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {habit.frequency}
            </span>
            <div className="flex items-center gap-1 text-orange-500">
              <Flame size={12} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">{streak} dias</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onDelete(habit.id)}
          className="p-3 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-2xl transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default HabitCard;
