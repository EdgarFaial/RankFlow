
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, LayoutDashboard, ListOrdered, Sparkles, BrainCircuit, 
  X, MessageSquare, Loader2, Calendar as CalendarIcon, 
  Settings as SettingsIcon, Moon, Sun, ChevronLeft, ChevronRight,
  Info, Palette, Upload, Image as ImageIcon, CheckCircle, Repeat,
  AlertCircle, TrendingUp, Award
} from 'lucide-react';
import { Task, TaskStatus, RankingCriterion, AppView, Habit, HabitFrequency } from './types';
import { ThemeMode, ThemeName, THEME_MAP, ThemeColors } from './themes/theme';
import { RANKING_CONFIGS } from './constants';
import TaskCard from './components/TaskCard';
import HabitCard from './components/HabitCard';
import RankerHeader from './components/RankerHeader';
import { getTaskBreakdown, getRankingAudit } from './services/geminiService';
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

  // Fix: Added toggleHabit function to mark/unmark habit completion for today
  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const isCompleted = h.completedDates.includes(today);
        return {
          ...h,
          completedDates: isCompleted 
            ? h.completedDates.filter(d => d !== today)
            : [...h.completedDates, today]
        };
      }
      return h;
    }));
  };

  // Fix: Added deleteHabit function to remove a habit from the state
  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const handleAudit = async () => {
    if (!isAiEnabled || tasks.length === 0) return;
    setIsAIThinking(true);
    const audit = await getRankingAudit(tasks);
    setAiAudit(audit);
    setIsAIThinking(false);
  };

  const moveTask = useCallback((taskId: string, direction: 'up' | 'down') => {
    setTasks(prev => {
      const currentTasks = [...prev].sort((a, b) => a[activeCriterion] - b[activeCriterion]);
      const index = currentTasks.findIndex(t => t.id === taskId);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentTasks.length) return prev;
      const taskA = { ...currentTasks[index] };
      const taskB = { ...currentTasks[targetIndex] };
      const tempRank = taskA[activeCriterion];
      taskA[activeCriterion] = taskB[activeCriterion];
      taskB[activeCriterion] = tempRank;
      return prev.map(t => t.id === taskA.id ? taskA : t.id === taskB.id ? taskB : t);
    });
  }, [activeCriterion]);

  // Data Memos
  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => a[activeCriterion] - b[activeCriterion]), [tasks, activeCriterion]);
  const statsData = useMemo(() => RANKING_CONFIGS.map(c => ({
    name: c.label === 'Priority' ? 'Prioridade' : c.label === 'Difficulty' ? 'Dificuldade' : 'Urgência',
    avg: tasks.reduce((a, b) => a + (b[c.id] || 0), 0) / (tasks.length || 1)
  })), [tasks]);
  
  const statusDist = useMemo(() => [
    { name: 'A fazer', value: tasks.filter(t => t.status === 'todo').length, fill: '#6366f1' },
    { name: 'Feito', value: tasks.filter(t => t.status === 'done').length, fill: '#10b981' }
  ], [tasks]);

  const navItems = [
    { id: 'tasks', icon: ListOrdered, label: 'Tarefas' },
    { id: 'habits', icon: Repeat, label: 'Hábitos' },
    { id: 'calendar', icon: CalendarIcon, label: 'Calendário' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  const themesList: {id: ThemeName, label: string, color: string}[] = [
    { id: 'default', label: 'Padrão', color: 'bg-indigo-500' },
    { id: 'cyberpunk', label: 'Neon', color: 'bg-fuchsia-500' },
    { id: 'sololeveling', label: 'Monarch', color: 'bg-blue-600' },
    { id: 'japanese', label: 'Zen', color: 'bg-red-700' },
    ...(customTheme ? [{ id: 'custom' as ThemeName, label: 'Custom', color: 'bg-emerald-500' }] : [])
  ];

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden ${theme.mainBg} transition-all duration-300 relative`}>
      {theme.bgImage && (
        <div className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${theme.bgImage})`, opacity: theme.bgOpacity ?? 0.1 }} />
      )}

      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col w-72 ${theme.sidebarBg} text-white p-8 shrink-0 shadow-2xl z-20`}>
        <div className="flex items-center gap-3 mb-12">
          <div className={`${theme.accent} p-2.5 rounded-2xl shadow-lg`}><Sparkles size={28} /></div>
          <h1 className="text-2xl font-black tracking-tighter">RankFlow</h1>
        </div>
        <nav className="space-y-3 flex-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setView(item.id as AppView); setAiAudit(null); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${view === item.id ? theme.accent + ' shadow-lg text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={22} /> {item.label}
            </button>
          ))}
        </nav>
        
        {isAiEnabled && view === 'tasks' && tasks.length > 0 && (
          <button onClick={handleAudit} disabled={isAIThinking}
            className="mb-6 w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all font-black uppercase text-xs tracking-widest disabled:opacity-50">
            {isAIThinking ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />} Audit IA
          </button>
        )}

        <div className="pt-8 border-t border-white/10 opacity-40 text-[10px] text-center font-black uppercase tracking-[0.2em]">
          PRODUTIVIDADE RADICAL
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative">
        <header className={`${theme.headerBg} border-b ${theme.border} px-8 py-5 flex items-center justify-between z-10 backdrop-blur-md bg-opacity-80`}>
          <h2 className={`text-xl font-black ${theme.textPrimary} tracking-tight`}>
            {view === 'tasks' ? 'Organizar Tarefas' : view === 'habits' ? 'Meus Hábitos' : navItems.find(n => n.id === view)?.label}
          </h2>
          <div className="flex gap-3">
            {view === 'tasks' && (
              <button onClick={() => setIsModalOpen(true)} className={`flex items-center gap-2 ${theme.accent} text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all`}>
                <Plus size={20} /> NOVA TAREFA
              </button>
            )}
            {view === 'habits' && (
              <button onClick={() => setIsHabitModalOpen(true)} className={`flex items-center gap-2 ${theme.accent} text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all`}>
                <Plus size={20} /> NOVO HÁBITO
              </button>
            )}
          </div>
        </header>

        {/* Audit Panel */}
        {aiAudit && view === 'tasks' && (
          <div className="mx-8 mt-6 p-6 rounded-3xl bg-indigo-600 text-white shadow-2xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={120} /></div>
             <button onClick={() => setAiAudit(null)} className="absolute top-4 right-4 hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
             <div className="flex items-center gap-3 mb-4">
                <BrainCircuit size={24} />
                <h3 className="text-lg font-black uppercase tracking-wider">Sugestões da Inteligência Artificial</h3>
             </div>
             <p className="text-indigo-100 mb-6 font-medium leading-relaxed">{aiAudit.summary}</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiAudit.suggestions.map((s, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 flex gap-3 items-start">
                    <TrendingUp size={18} className="shrink-0 mt-1" />
                    <span className="text-sm font-bold">{s.improvement}</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Mobile Nav */}
        <div className={`md:hidden flex ${theme.headerBg} border-b ${theme.border} p-2`}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id as AppView)}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl ${view === item.id ? theme.accent + ' text-white' : 'text-slate-500'}`}>
              <item.icon size={20} />
              <span className="text-[9px] font-black uppercase mt-1">{item.label}</span>
            </button>
          ))}
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
          {view === 'tasks' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {RANKING_CONFIGS.map(config => (
                  <RankerHeader key={config.id} config={config} isActive={activeCriterion === config.id} onClick={() => setActiveCriterion(config.id)} />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-5">
                {sortedTasks.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-32 text-slate-400 border-4 border-dashed ${theme.border} rounded-[3rem]`}>
                    <ListOrdered size={64} strokeWidth={1} className="mb-6 opacity-20" />
                    <p className="text-xl font-bold italic">Sua lista está vazia. Comece a criar!</p>
                  </div>
                ) : (
                  sortedTasks.map((task, idx) => (
                    <TaskCard key={task.id} task={task} criterion={activeCriterion} onMove={moveTask} onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))} onToggleStatus={toggleStatus} isFirst={idx === 0} isLast={idx === sortedTasks.length - 1} />
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'habits' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-1 gap-5">
                {habits.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-32 text-slate-400 border-4 border-dashed ${theme.border} rounded-[3rem]`}>
                    <Award size={64} strokeWidth={1} className="mb-6 opacity-20" />
                    <p className="text-xl font-bold italic">Nenhum hábito rastreado. Mude sua rotina!</p>
                  </div>
                ) : (
                  habits.map(habit => <HabitCard key={habit.id} habit={habit} theme={theme} onToggle={toggleHabit} onDelete={deleteHabit} />)
                )}
              </div>
            </div>
          )}

          {view === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-10">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Tarefas Ativas', val: tasks.filter(t => t.status !== 'done').length, color: 'text-indigo-500', icon: ListOrdered },
                    { label: 'Hábitos Ativos', val: habits.length, color: 'text-emerald-500', icon: Repeat },
                    { label: 'Consistência', val: habits.length > 0 ? `${Math.round((habits.reduce((a, b) => a + b.completedDates.length, 0) / (habits.length * 30)) * 100)}%` : '0%', color: 'text-amber-500', icon: TrendingUp },
                    { label: 'Finalizadas', val: tasks.filter(t => t.status === 'done').length, color: 'text-rose-500', icon: CheckCircle }
                  ].map((stat, i) => (
                    <div key={i} className={`${theme.cardBg} p-8 rounded-[2.5rem] border ${theme.border} shadow-xl backdrop-blur-md group hover:scale-105 transition-transform`}>
                       <div className="flex justify-between items-start mb-4">
                         <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-white/5 ${stat.color}`}><stat.icon size={24}/></div>
                       </div>
                       <p className={`text-4xl font-black ${theme.textPrimary}`}>{stat.val}</p>
                       <p className={`text-xs font-black uppercase tracking-widest ${theme.textSecondary} mt-2`}>{stat.label}</p>
                    </div>
                  ))}
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  <div className="p-10 border-b ${theme.border} flex items-center justify-between">
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

      {/* Modals are kept similar but with traduced labels and stylized buttons */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
          <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            <div className="p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent">
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

      {/* Habit Modal - Similar translation/polish */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
           <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            <div className="p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent">
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
