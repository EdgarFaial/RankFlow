
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, LayoutDashboard, ListOrdered, Sparkles, BrainCircuit, 
  X, MessageSquare, Loader2, Calendar as CalendarIcon, 
  Settings as SettingsIcon, Moon, Sun, ChevronLeft, ChevronRight,
  Info, Palette, Upload, Image as ImageIcon, CheckCircle, Repeat,
  AlertCircle, TrendingUp, Award
} from 'lucide-react';
import { Task, TaskStatus, RankingCriterion, AppView, Habit, HabitFrequency } from './types';
import { ThemeMode, ThemeName, THEME_MAP, ThemeColors } from './theme';
import { RANKING_CONFIGS } from './constants';
import TaskCard from './TaskCard';
import HabitCard from './HabitCard';
import RankerHeader from './RankerHeader';
import { getTaskBreakdown, getRankingAudit } from './geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const App: React.FC = () => {
  // --- Core State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeCriterion, setActiveCriterion] = useState<RankingCriterion>('priorityRank');
  const [view, setView] = useState<AppView>('tasks');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem('rankflow_mode') as ThemeMode) || 'light');
  const [themeName, setThemeName] = useState<ThemeName>(() => (localStorage.getItem('rankflow_theme_name') as ThemeName) || 'default');
  const [customTheme, setCustomTheme] = useState<Record<ThemeMode, ThemeColors> | null>(() => {
    const saved = localStorage.getItem('rankflow_custom_theme');
    return saved ? JSON.parse(saved) : null;
  });
  const [overrideBgUrl, setOverrideBgUrl] = useState(() => localStorage.getItem('rankflow_bg_override') || '');
  const [isAiEnabled, setIsAiEnabled] = useState(() => localStorage.getItem('rankflow_ai_enabled') !== 'false');

  // --- UI & AI State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiAudit, setAiAudit] = useState<{ summary: string; suggestions: {taskId: string, improvement: string}[] } | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Forms
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [useAiForThisTask, setUseAiForThisTask] = useState(true);

  const [habitTitle, setHabitTitle] = useState('');
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily');

  // Theme Memo
  const theme = useMemo(() => {
    let base: ThemeColors;
    if (themeName === 'custom' && customTheme) {
      base = customTheme[themeMode];
    } else {
      base = THEME_MAP[themeName as keyof typeof THEME_MAP][themeMode];
    }
    return { ...base, bgImage: overrideBgUrl || base.bgImage };
  }, [themeName, themeMode, customTheme, overrideBgUrl]);

  // Storage Effects
  useEffect(() => {
    const savedTasks = localStorage.getItem('rankflow_tasks');
    if (savedTasks) try { setTasks(JSON.parse(savedTasks)); } catch (e) { console.error(e); }
    const savedHabits = localStorage.getItem('rankflow_habits');
    if (savedHabits) try { setHabits(JSON.parse(savedHabits)); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { localStorage.setItem('rankflow_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('rankflow_habits', JSON.stringify(habits)); }, [habits]);
  useEffect(() => {
    localStorage.setItem('rankflow_mode', themeMode);
    localStorage.setItem('rankflow_theme_name', themeName);
    localStorage.setItem('rankflow_bg_override', overrideBgUrl);
    if (customTheme) localStorage.setItem('rankflow_custom_theme', JSON.stringify(customTheme));
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode, themeName, overrideBgUrl, customTheme]);

  // Handlers
  const resetForm = useCallback(() => {
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setUseAiForThisTask(isAiEnabled);
  }, [isAiEnabled]);

  const addTask = useCallback(async () => {
    if (!newTitle.trim()) return;
    let description = newDesc;
    if (isAiEnabled && useAiForThisTask) {
      setIsAIThinking(true);
      const breakdown = await getTaskBreakdown(newTitle, newDesc);
      setIsAIThinking(false);
      if (breakdown) {
        description += `\n\n💡 AI Breakdown:\n${breakdown.subtasks.map((s: string) => `• ${s}`).join('\n')}\n\n🧠 Dica IA: ${breakdown.reasoning}`;
      }
    }
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      description,
      priorityRank: tasks.length + 1,
      difficultyRank: tasks.length + 1,
      urgencyRank: tasks.length + 1,
      status: TaskStatus.TODO,
      createdAt: Date.now(),
      dueDate: newDueDate || undefined
    };
    setTasks(prev => [...prev, newTask]);
    resetForm();
    setIsModalOpen(false);
  }, [newTitle, newDesc, newDueDate, tasks.length, isAiEnabled, useAiForThisTask, resetForm]);

  const toggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? {...t, status: t.status === 'done' ? TaskStatus.TODO : TaskStatus.DONE} : t));
  };

  const addHabit = () => {
    if (!habitTitle.trim()) return;
    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9),
      title: habitTitle,
      frequency: habitFreq,
      completedDates: [],
      createdAt: Date.now()
    };
    setHabits(prev => [...prev, newHabit]);
    setHabitTitle('');
    setIsHabitModalOpen(false);
  };

  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const alreadyDone = h.completedDates.includes(today);
        const newDates = alreadyDone 
          ? h.completedDates.filter(d => d !== today)
          : [...h.completedDates, today];
        return { ...h, completedDates: newDates };
      }
      return h;
    }));
  };

  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  const deleteHabit = (id: string) => setHabits(prev => prev.filter(h => h.id !== id));

  const updateRank = (taskId: string, criterion: RankingCriterion, newRank: number) => {
    setTasks(prev => {
      const updated = [...prev];
      const target = updated.find(t => t.id === taskId);
      if (!target) return prev;
      const oldRank = target[criterion];
      updated.forEach(t => {
        if (t.id === taskId) {
          t[criterion] = newRank;
        } else if (oldRank < newRank) {
          if (t[criterion] > oldRank && t[criterion] <= newRank) t[criterion]--;
        } else {
          if (t[criterion] >= newRank && t[criterion] < oldRank) t[criterion]++;
        }
      });
      return updated;
    });
  };

  const runAiAudit = async () => {
    setIsAIThinking(true);
    const result = await getRankingAudit(tasks, activeCriterion);
    setIsAIThinking(false);
    if (result) setAiAudit(result);
  };

  // Filter & Sort
  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => a[activeCriterion] - b[activeCriterion]), [tasks, activeCriterion]);

  const calendarRange = useMemo(() => {
    const start = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const end = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [calendarDate]);

  const statsData = useMemo(() => [
    {name: 'Prioridade', avg: tasks.length ? tasks.reduce((acc, t) => acc + t.priorityRank, 0) / tasks.length : 0},
    {name: 'Urgência', avg: tasks.length ? tasks.reduce((acc, t) => acc + t.urgencyRank, 0) / tasks.length : 0},
    {name: 'Dificuldade', avg: tasks.length ? tasks.reduce((acc, t) => acc + t.difficultyRank, 0) / tasks.length : 0}
  ], [tasks]);

  const statusDist = useMemo(() => {
    const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    return [
      {name: 'A fazer', value: todo, fill: '#6366f1'},
      {name: 'Em andamento', value: inProgress, fill: '#f59e0b'},
      {name: 'Concluído', value: done, fill: '#10b981'}
    ];
  }, [tasks]);

  const themesList = [
    { id: 'default' as ThemeName, label: 'Padrão', color: 'bg-indigo-500' },
    { id: 'cyberpunk' as ThemeName, label: 'Cyberpunk', color: 'bg-gradient-to-br from-cyan-400 to-fuchsia-500' },
    { id: 'sololeveling' as ThemeName, label: 'Solo Leveling', color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { id: 'japanese' as ThemeName, label: 'Japonês', color: 'bg-gradient-to-br from-red-600 to-orange-500' }
  ];

  return (
    <div className={`min-h-screen ${theme.mainBg} flex transition-all duration-500 ${theme.bgImage ? 'relative' : ''}`}>
      {theme.bgImage && (
        <div className="fixed inset-0 z-0 opacity-20" style={{backgroundImage: `url(${theme.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center'}} />
      )}
      
      <aside className={`${theme.sidebarBg} w-80 p-10 flex flex-col gap-8 relative z-10 border-r ${theme.border} shadow-2xl`}>
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <TrendingUp size={32} className="text-white" strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent tracking-tighter">RankFlow</h1>
        </div>

        <nav className="flex flex-col gap-4">
          {[
            {id: 'tasks', icon: LayoutDashboard, label: 'Tarefas'},
            {id: 'habits', icon: Repeat, label: 'Hábitos'},
            {id: 'calendar', icon: CalendarIcon, label: 'Calendário'},
            {id: 'analytics', icon: Award, label: 'Analíticas'},
            {id: 'settings', icon: SettingsIcon, label: 'Configurações'}
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id as AppView)} 
              className={`flex items-center gap-4 px-8 py-5 rounded-[2rem] text-lg font-black uppercase tracking-wider transition-all ${view === item.id ? 'bg-white/10 text-white shadow-inner' : 'text-white/40 hover:bg-white/5 hover:text-white/60'}`}>
              <item.icon size={24} strokeWidth={2.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-8 bg-white/5 rounded-[2rem] backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit size={24} className="text-indigo-400" />
            <span className="text-sm font-black uppercase tracking-widest text-white/60">Assistente IA</span>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isAiEnabled} onChange={e => {
              setIsAiEnabled(e.target.checked);
              localStorage.setItem('rankflow_ai_enabled', String(e.target.checked));
            }} className="w-6 h-6 accent-indigo-500" />
            <span className="text-sm font-bold text-white">Habilitado</span>
          </label>
        </div>
      </aside>

      <main className="flex-1 relative z-10 overflow-auto">
        <div className="max-w-7xl mx-auto p-12">
          {view === 'tasks' && (
            <div className="space-y-12">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className={`text-6xl font-black ${theme.textPrimary} tracking-tighter mb-3`}>Suas Tarefas</h2>
                  <p className={`text-lg ${theme.textSecondary} font-medium`}>Organize, priorize e conquiste seus objetivos</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} 
                  className={`${theme.accent} text-white px-10 py-6 rounded-[2rem] flex items-center gap-4 font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all`}>
                  <Plus size={24} strokeWidth={3} />
                  Nova Tarefa
                </button>
              </div>

              <RankerHeader 
                criterion={activeCriterion} 
                onCriterionChange={setActiveCriterion}
                onAiAudit={runAiAudit}
                isAiThinking={isAIThinking}
                theme={theme}
              />

              {aiAudit && (
                <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] p-10 shadow-2xl animate-in fade-in duration-500`}>
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[1.5rem] flex items-center justify-center shadow-xl">
                        <Sparkles size={28} className="text-white" />
                      </div>
                      <div>
                        <h3 className={`text-2xl font-black ${theme.textPrimary} tracking-tight`}>Auditoria da IA</h3>
                        <p className={`text-sm ${theme.textSecondary} font-medium`}>Insights sobre sua organização</p>
                      </div>
                    </div>
                    <button onClick={() => setAiAudit(null)} className="hover:rotate-90 transition-transform">
                      <X size={24} className={theme.textSecondary} />
                    </button>
                  </div>
                  <p className={`${theme.textPrimary} text-lg leading-relaxed font-medium mb-6`}>{aiAudit.summary}</p>
                  {aiAudit.suggestions.length > 0 && (
                    <div className="space-y-4">
                      <h4 className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`}>Sugestões</h4>
                      {aiAudit.suggestions.map((sug, idx) => (
                        <div key={idx} className="flex gap-4 p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                          <AlertCircle size={20} className="text-indigo-500 flex-shrink-0 mt-1" />
                          <p className={`${theme.textPrimary} font-medium`}>{sug.improvement}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-6">
                {sortedTasks.map(task => (
                  <TaskCard 
                    key={task.id}
                    task={task}
                    activeCriterion={activeCriterion}
                    onToggleStatus={toggleStatus}
                    onDelete={deleteTask}
                    onRankChange={updateRank}
                    theme={theme}
                  />
                ))}
                {tasks.length === 0 && (
                  <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] p-20 text-center shadow-xl`}>
                    <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ListOrdered size={48} className="text-indigo-500" />
                    </div>
                    <h3 className={`text-2xl font-black ${theme.textPrimary} mb-3`}>Nenhuma tarefa ainda</h3>
                    <p className={`${theme.textSecondary} font-medium`}>Clique em "Nova Tarefa" para começar sua jornada produtiva</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'habits' && (
            <div className="space-y-12">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className={`text-6xl font-black ${theme.textPrimary} tracking-tighter mb-3`}>Hábitos</h2>
                  <p className={`text-lg ${theme.textSecondary} font-medium`}>Construa rotinas poderosas, um dia de cada vez</p>
                </div>
                <button onClick={() => setIsHabitModalOpen(true)} 
                  className={`bg-emerald-500 text-white px-10 py-6 rounded-[2rem] flex items-center gap-4 font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all`}>
                  <Plus size={24} strokeWidth={3} />
                  Novo Hábito
                </button>
              </div>

              <div className="grid gap-6">
                {habits.map(habit => (
                  <HabitCard 
                    key={habit.id}
                    habit={habit}
                    onToggle={toggleHabit}
                    onDelete={deleteHabit}
                    theme={theme}
                  />
                ))}
                {habits.length === 0 && (
                  <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] p-20 text-center shadow-xl`}>
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Repeat size={48} className="text-emerald-500" />
                    </div>
                    <h3 className={`text-2xl font-black ${theme.textPrimary} mb-3`}>Nenhum hábito criado</h3>
                    <p className={`${theme.textSecondary} font-medium`}>Comece a construir hábitos que transformam sua vida</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'calendar' && (
            <div className="space-y-12">
              <div>
                <h2 className={`text-6xl font-black ${theme.textPrimary} tracking-tighter mb-3`}>Calendário</h2>
                <p className={`text-lg ${theme.textSecondary} font-medium`}>Visualize suas tarefas e hábitos no tempo</p>
              </div>

              <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] p-10 shadow-2xl`}>
                <div className="flex items-center justify-between mb-10">
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))} 
                    className={`p-4 rounded-2xl ${theme.textSecondary} hover:bg-black/5 dark:hover:bg-white/5 transition-all`}>
                    <ChevronLeft size={24} />
                  </button>
                  <h3 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>
                    {calendarDate.toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}
                  </h3>
                  <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))} 
                    className={`p-4 rounded-2xl ${theme.textSecondary} hover:bg-black/5 dark:hover:bg-white/5 transition-all`}>
                    <ChevronRight size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-4">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className={`text-center text-xs font-black uppercase tracking-widest ${theme.textSecondary} pb-4`}>
                      {day}
                    </div>
                  ))}
                  {calendarRange.map((day, i) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
                    const dayHabits = habits.filter(h => h.completedDates.includes(dateStr));
                    return (
                      <div key={i} className={`aspect-square p-4 rounded-2xl border ${theme.border} ${theme.cardBg} hover:shadow-lg transition-all cursor-pointer`}>
                        <div className={`text-sm font-bold ${theme.textPrimary} mb-2`}>{day.getDate()}</div>
                        <div className="space-y-1">
                          {dayTasks.length > 0 && <div className="w-2 h-2 bg-indigo-500 rounded-full" />}
                          {dayHabits.length > 0 && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {view === 'analytics' && (
            <div className="space-y-12">
               <div>
                <h2 className={`text-6xl font-black ${theme.textPrimary} tracking-tighter mb-3`}>Analíticas</h2>
                <p className={`text-lg ${theme.textSecondary} font-medium`}>Métricas e insights sobre sua produtividade</p>
               </div>

               <div className="grid grid-cols-3 gap-8">
                  <div className={`${theme.cardBg} p-10 rounded-[3rem] border ${theme.border} shadow-xl`}>
                     <div className="flex items-center justify-between mb-4">
                       <span className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`}>Total de Tarefas</span>
                       <LayoutDashboard size={24} className="text-indigo-500" />
                     </div>
                     <p className={`text-5xl font-black ${theme.textPrimary}`}>{tasks.length}</p>
                  </div>
                  <div className={`${theme.cardBg} p-10 rounded-[3rem] border ${theme.border} shadow-xl`}>
                     <div className="flex items-center justify-between mb-4">
                       <span className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`}>Concluídas</span>
                       <CheckCircle size={24} className="text-emerald-500" />
                     </div>
                     <p className={`text-5xl font-black ${theme.textPrimary}`}>{tasks.filter(t => t.status === TaskStatus.DONE).length}</p>
                  </div>
                  <div className={`${theme.cardBg} p-10 rounded-[3rem] border ${theme.border} shadow-xl`}>
                     <div className="flex items-center justify-between mb-4">
                       <span className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`}>Taxa de Conclusão</span>
                       <Award size={24} className="text-amber-500" />
                     </div>
                     <p className={`text-5xl font-black ${theme.textPrimary}`}>
                       {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100) : 0}%
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div className={`${theme.cardBg} p-10 rounded-[3rem] border ${theme.border} h-[400px] shadow-xl`}>
                    <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textPrimary} mb-8`}>Distribuição de Tarefas</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDist} innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value">
                           {statusDist.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`${theme.cardBg} p-10 rounded-[3rem] border ${theme.border} h-[400px] shadow-xl`}>
                    <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textPrimary} mb-8`}>Impacto das Rankings</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" fontSize={10} fontWeight="bold" />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="avg" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-10">
               <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                  <div className={`p-10 border-b ${theme.border} flex items-center justify-between`}>
                     <div>
                       <h3 className={`text-2xl font-black ${theme.textPrimary} tracking-tighter`}>Aparência</h3>
                       <p className={`text-sm ${theme.textSecondary} font-medium`}>Molde o RankFlow ao seu estilo.</p>
                     </div>
                     <button onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} 
                       className={`p-4 rounded-[1.5rem] shadow-inner transition-all ${themeMode === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-900/50 text-indigo-400'}`}>
                       {themeMode === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                     </button>
                  </div>
                  <div className="p-10 space-y-10">
                     <div className="grid grid-cols-2 gap-4">
                        {themesList.map(t => (
                          <button key={t.id} onClick={() => setThemeName(t.id)} 
                            className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col gap-4 items-center group ${themeName === t.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-transparent bg-slate-100/50 dark:bg-white/5'}`}>
                            <div className={`w-12 h-12 rounded-full ${t.color} shadow-lg group-hover:scale-110 transition-transform`} />
                            <span className={`text-xs font-black uppercase tracking-widest ${theme.textPrimary}`}>{t.label}</span>
                          </button>
                        ))}
                     </div>
                     
                     <div className="space-y-4">
                        <label className={`block text-xs font-black uppercase tracking-[0.2em] ${theme.textSecondary}`}>URL de Imagem de Fundo</label>
                        <div className="flex gap-3">
                          <input type="text" value={overrideBgUrl} onChange={e => setOverrideBgUrl(e.target.value)} placeholder="https://..."
                            className={`flex-1 p-4 rounded-2xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} />
                          {overrideBgUrl && <button onClick={() => setOverrideBgUrl('')} className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl"><X size={20}/></button>}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
          <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            <div className={`p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent`}>
              <h3 className={`text-3xl font-black ${theme.textPrimary} tracking-tighter`}>Nova Tarefa</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={32}/></button>
            </div>
            <div className="p-10 space-y-6">
              <input type="text" placeholder="Título da missão..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-lg font-bold outline-none`} />
              <textarea placeholder="Explique os detalhes..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} h-40 resize-none font-medium`} />
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-2">Data Limite (Opcional)</label>
                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} font-bold`} />
              </div>
              <div className="flex items-center gap-3 p-4 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                <input type="checkbox" id="ai" checked={useAiForThisTask} onChange={e => setUseAiForThisTask(e.target.checked)} className="w-5 h-5 accent-indigo-500" />
                <label htmlFor="ai" className="text-sm font-black uppercase text-indigo-500 cursor-pointer">Usar IA para detalhar tarefa</label>
              </div>
            </div>
            <div className="p-10 bg-slate-50 dark:bg-black/20 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className={`flex-1 p-6 font-black uppercase text-xs tracking-widest ${theme.textSecondary}`}>Cancelar</button>
              <button onClick={addTask} className={`flex-[2] p-6 ${theme.accent} text-white font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all`}>CRIAÇÃO IMEDIATA</button>
            </div>
          </div>
        </div>
      )}

      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
           <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            <div className={`p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent`}>
              <h3 className={`text-3xl font-black ${theme.textPrimary} tracking-tighter`}>Novo Hábito</h3>
              <button onClick={() => setIsHabitModalOpen(false)} className="hover:rotate-90 transition-transform"><X size={32}/></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} ml-2`}>O que você quer repetir?</label>
                <input type="text" placeholder="Ex: Meditar por 10 min..." value={habitTitle} onChange={e => setHabitTitle(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-lg font-bold outline-none`} />
              </div>
              <div className="space-y-3">
                <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} ml-2`}>Frequência de Execução</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {id: 'daily', label: 'Diário'}, {id: 'weekly', label: 'Semanal'}, 
                    {id: 'weekdays', label: 'Dias úteis'}, {id: 'weekend', label: 'Fim de semana'}
                  ].map(f => (
                    <button key={f.id} onClick={() => setHabitFreq(f.id as HabitFrequency)} 
                      className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-tighter transition-all ${habitFreq === f.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-inner' : theme.border + ' ' + theme.textSecondary}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-10 bg-slate-50 dark:bg-black/20 flex gap-4">
              <button onClick={() => setIsHabitModalOpen(false)} className={`flex-1 p-6 font-black uppercase text-xs tracking-widest ${theme.textSecondary}`}>Cancelar</button>
              <button onClick={addHabit} className={`flex-[2] p-6 bg-emerald-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all`}>FORJAR HÁBITO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
