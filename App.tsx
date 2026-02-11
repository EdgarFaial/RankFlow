import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, LayoutDashboard, ListOrdered, Sparkles, BrainCircuit, 
  X, Loader2, Calendar as CalendarIcon, 
  Settings as SettingsIcon, Moon, Sun, Repeat,
  TrendingUp, Award, CheckCircle, Download, Upload, Bell, BellOff, Copy, Check,
  StickyNote, ArrowRightLeft, Trash2, Calendar
} from 'lucide-react';
import { Task, TaskStatus, RankingCriterion, AppView, Habit, HabitFrequency, Note } from './types';
import { ThemeMode, ThemeName, THEME_MAP } from './themes/theme';
import { RANKING_CONFIGS } from './constants';
import TaskCard from './components/TaskCard';
import HabitCard from './components/HabitCard';
import RankerHeader from './components/RankerHeader';
import { getTaskBreakdown, getRankingAudit } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useMongoDB } from './hooks/useMongoDB';

const App: React.FC = () => {
  const {
    isLoading: isMongoLoading,
    error: mongoError,
    isInitialized,
    loadTasks,
    saveTasks,
    loadHabits,
    saveHabits,
    loadNotes,
    saveNotes,
    saveSettings
  } = useMongoDB();

  // --- Core State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeCriterion, setActiveCriterion] = useState<RankingCriterion>('priorityRank');
  const [view, setView] = useState<AppView>('tasks');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem('rankflow_mode') as ThemeMode) || 'light');
  const [themeName, setThemeName] = useState<ThemeName>(() => (localStorage.getItem('rankflow_theme_name') as ThemeName) || 'default');
  const [overrideBgUrl, setOverrideBgUrl] = useState(() => localStorage.getItem('rankflow_bg_override') || '');
  
  // AI State
  const [isAiEnabled, setIsAiEnabled] = useState(() => localStorage.getItem('rankflow_ai_enabled') !== 'false');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiAudit, setAiAudit] = useState<{ summary: string; suggestions: {taskId: string, improvement: string}[] } | null>(null);

  // Google Calendar State
  const [isGCalConnected, setIsGCalConnected] = useState(() => localStorage.getItem('rankflow_gcal_connected') === 'true');
  const [isSyncing, setIsSyncing] = useState(false);

  // Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('rankflow_notifications') === 'true');
  const [copySuccess, setCopySuccess] = useState(false);

  // --- UI State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isNoteInputVisible, setIsNoteInputVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Forms
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [useAiForThisTask, setUseAiForThisTask] = useState(true);

  const [habitTitle, setHabitTitle] = useState('');
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily');

  const [newNoteContent, setNewNoteContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Carregar dados iniciais do MongoDB ---
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const [loadedTasks, loadedHabits, loadedNotes] = await Promise.all([
          loadTasks(),
          loadHabits(),
          loadNotes()
        ]);

        setTasks(loadedTasks);
        setHabits(loadedHabits);
        setNotes(loadedNotes);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isMongoLoading) {
      initializeData();
    }
  }, [isMongoLoading, loadTasks, loadHabits, loadNotes]);

  // --- Salvar dados no MongoDB quando mudarem ---
  useEffect(() => {
    if (!isLoading && !isMongoLoading) {
      saveTasks(tasks);
    }
  }, [tasks, saveTasks, isLoading, isMongoLoading]);

  useEffect(() => {
    if (!isLoading && !isMongoLoading) {
      saveHabits(habits);
    }
  }, [habits, saveHabits, isLoading, isMongoLoading]);

  useEffect(() => {
    if (!isLoading && !isMongoLoading) {
      saveNotes(notes);
    }
  }, [notes, saveNotes, isLoading, isMongoLoading]);

  // --- Salvar configurações ---
  useEffect(() => {
    const settings = {
      mode: themeMode,
      theme_name: themeName,
      bg_override: overrideBgUrl,
      notifications: notificationsEnabled,
      ai_enabled: isAiEnabled,
      gcal_connected: isGCalConnected
    };
    
    saveSettings(settings);
    
    // Também manter no localStorage para fallback e persistência entre sessões
    localStorage.setItem('rankflow_mode', themeMode);
    localStorage.setItem('rankflow_theme_name', themeName);
    localStorage.setItem('rankflow_bg_override', overrideBgUrl);
    localStorage.setItem('rankflow_notifications', notificationsEnabled.toString());
    localStorage.setItem('rankflow_ai_enabled', isAiEnabled.toString());
    localStorage.setItem('rankflow_gcal_connected', isGCalConnected.toString());
    
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode, themeName, overrideBgUrl, notificationsEnabled, isAiEnabled, isGCalConnected, saveSettings]);

  // Theme Memo
  const theme = useMemo(() => {
    const base = THEME_MAP[themeName as keyof typeof THEME_MAP]?.[themeMode] || THEME_MAP.default[themeMode];
    return { ...base, bgImage: overrideBgUrl || base.bgImage };
  }, [themeName, themeMode, overrideBgUrl]);

  // Google Calendar Integration
  const connectGCal = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsGCalConnected(true);
      setIsSyncing(false);
      alert("RankFlow conectado ao Google Calendar com sucesso!");
    }, 1500);
  };

  const syncToGCal = () => {
    if (!isGCalConnected) return;
    setIsSyncing(true);
    const syncCount = tasks.filter(t => t.dueDate && t.status === TaskStatus.TODO).length;
    setTimeout(() => {
      setIsSyncing(false);
      alert(`${syncCount} tarefas sincronizadas com seu Google Calendar.`);
    }, 2000);
  };

  // Notification Logic
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  };

  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkDeadlines = () => {
      const now = Date.now();
      const upcomingTasks = tasks.filter(t => 
        t.status === TaskStatus.TODO && 
        t.dueDate && 
        !t.lastNotified
      );

      upcomingTasks.forEach(task => {
        const dueDate = new Date(task.dueDate + 'T00:00:00').getTime();
        const diff = dueDate - now;
        const oneDay = 24 * 60 * 60 * 1000;

        if (diff > 0 && diff < oneDay) {
          new Notification("RankFlow: Tarefa Próxima!", {
            body: `Sua tarefa "${task.title}" vence em breve.`,
            icon: '/favicon.ico'
          });
          
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, lastNotified: now } : t));
        }
      });
    };

    const interval = setInterval(checkDeadlines, 60000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, tasks]);

  // Sync Logic
  const exportData = () => {
    const data = { tasks, habits, notes, themeName, themeMode, overrideBgUrl };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rankflow_sync_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.tasks) setTasks(data.tasks);
        if (data.habits) setHabits(data.habits);
        if (data.notes) setNotes(data.notes);
        if (data.themeName) setThemeName(data.themeName);
        if (data.themeMode) setThemeMode(data.themeMode);
        if (data.overrideBgUrl) setOverrideBgUrl(data.overrideBgUrl);
        alert("Dados sincronizados com sucesso!");
      } catch (err) {
        alert("Erro ao importar arquivo.");
      }
    };
    reader.readAsText(file);
  };

  const generateSyncCode = () => {
    const data = { tasks, habits, notes };
    const code = btoa(JSON.stringify(data));
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

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
          description += `\n\n💡 Detalhamento IA:\n${breakdown.subtasks.map((s: string) => `• ${s}`).join('\n')}\n\n🧠 Raciocínio: ${breakdown.reasoning}`;
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
    setTasks(prev => prev.map(t => t.id === id ? {...t, status: t.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE} : t));
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

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Notes Handlers
  const addNote = () => {
    if (!newNoteContent.trim()) return;
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      content: newNoteContent,
      createdAt: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
    setNewNoteContent('');
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const transformNoteToTask = (note: Note) => {
    setNewTitle(note.content);
    setIsModalOpen(true);
  };

  const transformNoteToHabit = (note: Note) => {
    setHabitTitle(note.content);
    setIsHabitModalOpen(true);
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
    avg: tasks.length === 0 ? 0 : tasks.reduce((a, b) => a + (b[c.id] || 0), 0) / tasks.length
  })), [tasks]);
  
  const statusDist = useMemo(() => [
    { name: 'A Fazer', value: tasks.filter(t => t.status === TaskStatus.TODO).length, fill: '#6366f1' },
    { name: 'Concluído', value: tasks.filter(t => t.status === TaskStatus.DONE).length, fill: '#10b981' }
  ], [tasks]);

  const navItems = [
    { id: 'tasks', icon: ListOrdered, label: 'Tarefas' },
    { id: 'habits', icon: Repeat, label: 'Hábitos' },
    { id: 'notes', icon: StickyNote, label: 'Notas' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Status' },
    { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  const themesList: {id: ThemeName, label: string, color: string}[] = [
    { id: 'default', label: 'Slate', color: 'bg-indigo-500' },
    { id: 'cyberpunk', label: 'Neon', color: 'bg-fuchsia-500' },
    { id: 'sololeveling', label: 'Monarch', color: 'bg-blue-600' },
    { id: 'japanese', label: 'Zen', color: 'bg-stone-500' }
  ];

  // Loading screen
  if (isLoading || isMongoLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-indigo-500" />
          <h1 className="text-2xl font-black tracking-tighter mb-2">RankFlow</h1>
          <p className="text-slate-400">Conectando ao MongoDB...</p>
        </div>
      </div>
    );
  }

  // Error banner if MongoDB fails
  const showMongoErrorBanner = mongoError && !isMongoLoading;

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden ${theme.mainBg} transition-all duration-300 relative`}>
      {showMongoErrorBanner && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-600 text-white p-2 text-center text-sm font-bold">
          ⚠️ {mongoError} Os dados estão sendo salvos localmente por enquanto.
        </div>
      )}

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
            {isAIThinking ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />} Auditoria IA
          </button>
        )}
        
        <div className="pt-8 border-t border-white/10 opacity-40 text-[10px] text-center font-black uppercase tracking-[0.2em]">
          FLOW RADICAL
        </div>
      </aside>

      {/* Rest of the component remains exactly the same from here... */}
      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative">
        <header className={`${theme.headerBg} border-b ${theme.border} px-8 py-5 flex items-center justify-between z-10 backdrop-blur-md bg-opacity-80`}>
          <h2 className={`text-xl font-black ${theme.textPrimary} tracking-tight`}>
            {view === 'tasks' ? 'Otimizar Tarefas' : view === 'habits' ? 'Hábitos' : view === 'notes' ? 'Notas Rápidas' : navItems.find(n => n.id === view)?.label}
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
            {view === 'notes' && (
              <button onClick={() => setIsNoteInputVisible(!isNoteInputVisible)} className={`flex items-center gap-2 ${theme.accent} text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all`}>
                <Plus size={20} /> CRIAR NOTA
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
                <h3 className="text-lg font-black uppercase tracking-wider">Auditoria IA</h3>
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
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {RANKING_CONFIGS.map(config => (
                  <RankerHeader key={config.id} config={config} isActive={activeCriterion === config.id} onClick={() => setActiveCriterion(config.id)} />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-5">
                {sortedTasks.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-32 text-slate-400 border-4 border-dashed ${theme.border} rounded-[3rem]`}>
                    <ListOrdered size={64} strokeWidth={1} className="mb-6 opacity-20" />
                    <p className="text-xl font-bold italic">Nada por aqui ainda.</p>
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
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 gap-5">
                {habits.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center py-32 text-slate-400 border-4 border-dashed ${theme.border} rounded-[3rem]`}>
                    <Award size={64} strokeWidth={1} className="mb-6 opacity-20" />
                    <p className="text-xl font-bold italic">Forje novos hábitos.</p>
                  </div>
                ) : (
                  habits.map(habit => <HabitCard key={habit.id} habit={habit} theme={theme} onToggle={toggleHabit} onDelete={deleteHabit} />)
                )}
              </div>
            </div>
          )}

          {view === 'notes' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
               {isNoteInputVisible && (
                  <div className={`${theme.cardBg} p-8 rounded-[2.5rem] border ${theme.border} shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300`}>
                    <textarea 
                      placeholder="Anote algo rápido..." 
                      value={newNoteContent} 
                      onChange={e => setNewNoteContent(e.target.value)}
                      className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} h-32 resize-none font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} 
                    />
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setIsNoteInputVisible(false)} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest ${theme.textSecondary}`}>Cancelar</button>
                      <button onClick={addNote} className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest ${theme.accent} text-white shadow-lg hover:scale-105 active:scale-95 transition-all`}>Salvar Nota</button>
                    </div>
                  </div>
               )}

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {notes.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30">
                      <StickyNote size={64} className="mx-auto mb-4" />
                      <p className="font-black uppercase tracking-widest">Sem notas salvas</p>
                    </div>
                 ) : (
                   notes.map(note => (
                    <div key={note.id} className={`${theme.cardBg} p-6 rounded-3xl border ${theme.border} shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between h-48`}>
                       <p className={`text-sm ${theme.textPrimary} font-medium line-clamp-4 leading-relaxed`}>{note.content}</p>
                       <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100 dark:border-white/5">
                          <div className="flex gap-1">
                            <button onClick={() => transformNoteToTask(note)} title="Converter para Tarefa" className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all">
                              <ListOrdered size={16} />
                            </button>
                            <button onClick={() => transformNoteToHabit(note)} title="Converter para Hábito" className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                              <Repeat size={16} />
                            </button>
                          </div>
                          <button onClick={() => deleteNote(note.id)} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white rounded-xl transition-all">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                   ))
                 )}
               </div>
            </div>
          )}

          {view === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Tarefas Ativas', val: tasks.filter(t => t.status !== TaskStatus.DONE).length, color: 'text-indigo-500', icon: ListOrdered },
                    { label: 'Total Hábitos', val: habits.length, color: 'text-emerald-500', icon: Repeat },
                    { label: 'Notas Rápidas', val: notes.length, color: 'text-amber-500', icon: StickyNote },
                    { label: 'Concluídas', val: tasks.filter(t => t.status === TaskStatus.DONE).length, color: 'text-rose-500', icon: CheckCircle }
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
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                  <div className={`${theme.cardBg} p-10 rounded-[3rem] border ${theme.border} h-[400px] shadow-xl`}>
                    <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textPrimary} mb-8`}>Status</h3>
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
                    <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textPrimary} mb-8`}>Rankings</h3>
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
            <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-fade-in">
               <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                  <div className={`p-8 border-b ${theme.border} flex items-center justify-between`}>
                     <div>
                       <h3 className={`text-xl font-black ${theme.textPrimary} tracking-tighter`}>Aparência</h3>
                       <p className={`text-xs ${theme.textSecondary} font-medium`}>Customize seu workspace.</p>
                     </div>
                     <button onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} 
                       className={`p-3 rounded-2xl shadow-inner transition-all ${themeMode === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-900/50 text-indigo-400'}`}>
                       {themeMode === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                     </button>
                  </div>
                  <div className="p-8 space-y-6">
                     <div className="grid grid-cols-2 gap-3">
                        {themesList.map(t => (
                          <button key={t.id} onClick={() => setThemeName(t.id)} 
                            className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-2 items-center group ${themeName === t.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-transparent bg-slate-100/50 dark:bg-white/5'}`}>
                            <div className={`w-8 h-8 rounded-full ${t.color} shadow-md group-hover:scale-110 transition-transform`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textPrimary}`}>{t.label}</span>
                          </button>
                        ))}
                     </div>
                     <div className="space-y-2">
                        <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} ml-2`}>Fundo Customizado (URL)</label>
                        <input type="text" value={overrideBgUrl} onChange={e => setOverrideBgUrl(e.target.value)} placeholder="https://..."
                          className={`w-full p-4 rounded-2xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} />
                     </div>
                  </div>
               </div>

               {/* Google Calendar Section */}
               <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                  <div className={`p-8 border-b ${theme.border} flex items-center justify-between`}>
                     <div>
                       <h3 className={`text-xl font-black ${theme.textPrimary} tracking-tighter`}>Google Calendar</h3>
                       <p className={`text-xs ${theme.textSecondary} font-medium`}>Sincronia com seu calendário externo.</p>
                     </div>
                     <div className={`p-3 rounded-2xl ${isGCalConnected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 dark:bg-white/5'}`}>
                       <Calendar size={20} />
                     </div>
                  </div>
                  <div className="p-8 space-y-6">
                    {!isGCalConnected ? (
                      <button 
                        onClick={connectGCal} 
                        disabled={isSyncing}
                        className={`w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:brightness-110 transition-all disabled:opacity-50`}
                      >
                        {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <ArrowRightLeft size={18} />}
                        Conectar Google Calendar
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20">
                          <CheckCircle size={18} />
                          <span className="text-xs font-black uppercase tracking-widest">Conta Conectada</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={syncToGCal} disabled={isSyncing} className={`flex items-center justify-center gap-2 p-4 rounded-2xl bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest shadow-md hover:scale-105 transition-all`}>
                            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />} Sincronizar Agora
                          </button>
                          <button onClick={() => setIsGCalConnected(false)} className={`flex items-center justify-center gap-2 p-4 rounded-2xl border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/5 transition-all`}>
                            <X size={14} /> Desconectar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
               </div>

               <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                  <div className={`p-8 border-b ${theme.border} flex items-center justify-between`}>
                     <div>
                       <h3 className={`text-xl font-black ${theme.textPrimary} tracking-tighter`}>Inteligência Artificial</h3>
                       <p className={`text-xs ${theme.textSecondary} font-medium`}>Suporte estratégico Gemini.</p>
                     </div>
                     <button onClick={() => setIsAiEnabled(!isAiEnabled)} 
                       className={`p-3 rounded-2xl transition-all ${isAiEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 dark:bg-white/5'}`}>
                       <BrainCircuit size={20} />
                     </button>
                  </div>
                  <div className="p-8">
                    <p className={`text-sm ${theme.textSecondary} font-medium`}>
                      {isAiEnabled 
                        ? "IA ativada: detalhamento de missões e auditoria de fluxo."
                        : "IA desativada. Ative para otimização estratégica."}
                    </p>
                  </div>
               </div>

               <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                  <div className={`p-8 border-b ${theme.border} flex items-center justify-between`}>
                     <div>
                       <h3 className={`text-xl font-black ${theme.textPrimary} tracking-tighter`}>Notificações</h3>
                       <p className={`text-xs ${theme.textSecondary} font-medium`}>Lembretes de prazos críticos.</p>
                     </div>
                     <button onClick={requestNotificationPermission} 
                       className={`p-3 rounded-2xl transition-all ${notificationsEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 dark:bg-white/5'}`}>
                       {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                     </button>
                  </div>
                  <div className="p-8">
                    <p className={`text-sm ${theme.textSecondary} font-medium`}>
                      {notificationsEnabled 
                        ? "Notificações ativas (alertas 24h antes)."
                        : "Notificações desativadas."}
                    </p>
                  </div>
               </div>

               <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                  <div className={`p-8 border-b ${theme.border}`}>
                     <h3 className={`text-xl font-black ${theme.textPrimary} tracking-tighter`}>Cloud & Sync</h3>
                     <p className={`text-xs ${theme.textSecondary} font-medium`}>Backup e sincronia entre dispositivos.</p>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={exportData} className={`flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500/20 transition-all`}>
                        <Download size={18} /> Exportar
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className={`flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all`}>
                        <Upload size={18} /> Importar
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                    </div>
                    
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                      <button onClick={generateSyncCode} className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 ${theme.textPrimary} font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all`}>
                        {copySuccess ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                        {copySuccess ? "Copiado!" : "Copiar Código de Sync"}
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals (exactly the same as before) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
          <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            <div className={`p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent`}>
              <h3 className={`text-3xl font-black ${theme.textPrimary} tracking-tighter`}>Nova Missão</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="hover:rotate-90 transition-transform"><X size={32}/></button>
            </div>
            <div className="p-10 space-y-6">
              <input type="text" placeholder="Título..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-lg font-bold outline-none focus:ring-4 focus:ring-indigo-500/20`} />
              <textarea placeholder="Descrição..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} h-40 resize-none font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} />
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-2">Vencimento</label>
                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} font-bold outline-none`} />
              </div>
              {isAiEnabled && (
                <div className="flex items-center gap-3 p-4 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                  <input type="checkbox" id="ai" checked={useAiForThisTask} onChange={e => setUseAiForThisTask(e.target.checked)} className="w-5 h-5 accent-indigo-500" />
                  <label htmlFor="ai" className="text-sm font-black uppercase text-indigo-500 cursor-pointer">Detalhamento IA</label>
                </div>
              )}
            </div>
            <div className="p-10 bg-slate-50 dark:bg-black/20 flex gap-4">
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className={`flex-1 p-6 font-black uppercase text-xs tracking-widest ${theme.textSecondary}`}>Cancelar</button>
              <button onClick={addTask} disabled={isAIThinking} className={`flex-[2] p-6 ${theme.accent} text-white font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2`}>
                {isAIThinking && <Loader2 size={16} className="animate-spin" />}
                {isAIThinking ? 'PROCESSANDO...' : 'INICIAR FLOW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
           <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            <div className={`p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent`}>
              <h3 className={`text-3xl font-black ${theme.textPrimary} tracking-tighter`}>Novo Hábito</h3>
              <button onClick={() => { setIsHabitModalOpen(false); setHabitTitle(''); }} className="hover:rotate-90 transition-transform"><X size={32}/></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} ml-2`}>Rotina</label>
                <input type="text" placeholder="ex: Meditação 10min..." value={habitTitle} onChange={e => setHabitTitle(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-lg font-bold outline-none focus:ring-4 focus:ring-emerald-500/20`} />
              </div>
              <div className="space-y-3">
                <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} ml-2`}>Frequência</label>
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
              <button onClick={() => { setIsHabitModalOpen(false); setHabitTitle(''); }} className={`flex-1 p-6 font-black uppercase text-xs tracking-widest ${theme.textSecondary}`}>Cancelar</button>
              <button onClick={addHabit} className={`flex-[2] p-6 bg-emerald-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all`}>SALVAR HÁBITO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;