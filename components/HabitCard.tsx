
import React from 'react';
import { Habit } from '../types';
import { CheckCircle2, Circle, Flame, Trash2, CalendarDays } from 'lucide-react';
import { ThemeColors } from '../themes/theme';

interface HabitCardProps {
  habit: Habit;
  theme: ThemeColors;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, theme, onToggle, onDelete }) => {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completedDates.includes(today);

  const calculateStreak = () => {
    if (habit.completedDates.length === 0) return 0;
    
    const sortedDates = [...new Set(habit.completedDates)].sort().reverse();
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    // If not completed today, start checking from yesterday
    if (!isCompletedToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (const dateStr of sortedDates) {
      const d = new Date(dateStr + 'T00:00:00');
      const diffDays = Math.floor((checkDate.getTime() - d.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays === 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (diffDays > 0) {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();
  const freqLabels: Record<string, string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    weekdays: 'Dias úteis',
    weekend: 'Fim de semana'
  };

  return (
    <div className={`${theme.cardBg} border ${theme.border} rounded-3xl p-5 flex items-center justify-between group transition-all hover:shadow-xl hover:-translate-y-1 backdrop-blur-md bg-opacity-80`}>
      <div className="flex items-center gap-5">
        <button 
          onClick={() => onToggle(habit.id)}
          className={`transition-all duration-300 transform active:scale-75 ${isCompletedToday ? 'text-emerald-500 scale-110' : theme.textSecondary + ' hover:text-indigo-500'}`}
        >
          {isCompletedToday ? <CheckCircle2 size={32} /> : <Circle size={32} strokeWidth={1.5} />}
        </button>
        <div>
          <h4 className={`text-lg font-black ${theme.textPrimary} ${isCompletedToday ? 'opacity-40 line-through' : ''} transition-all`}>
            {habit.title}
          </h4>
          <div className="flex items-center gap-4 mt-1.5">
            <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-lg ${theme.accent} text-white shadow-sm`}>
              {freqLabels[habit.frequency] || habit.frequency}
            </span>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-orange-500 font-black text-sm animate-pulse">
                <Flame size={14} fill="currentColor" />
                <span>{streak} {streak === 1 ? 'dia' : 'dias'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-xl bg-slate-100 dark:bg-white/5 ${theme.textSecondary} opacity-0 group-hover:opacity-100 transition-opacity`}>
          <CalendarDays size={16} />
        </div>
        <button 
          onClick={() => onDelete(habit.id)}
          className="p-2.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all duration-300"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default HabitCard;
