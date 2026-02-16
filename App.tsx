import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, LayoutDashboard, ListOrdered, Sparkles, BrainCircuit, 
  X, Loader2, Calendar as CalendarIcon, 
  Settings as SettingsIcon, Moon, Sun, Repeat,
  TrendingUp, Award, CheckCircle, Download, Upload, Bell, BellOff, Copy, Check,
  StickyNote, ArrowRightLeft, Trash2, Calendar, LogIn, LogOut, User as UserIcon, Mail, Shield, CloudOff
} from 'lucide-react';
import { Task, TaskStatus, RankingCriterion, AppView, Habit, HabitFrequency, Note, User } from './types';
import { ThemeMode, ThemeName, THEME_MAP } from './themes/theme';
import { RANKING_CONFIGS } from './constants';
import TaskCard from './components/TaskCard';
import HabitCard from './components/HabitCard';
import RankerHeader from './components/RankerHeader';
import AdBanner from './components/AdBanner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useMongoDB } from './hooks/useMongoDB';
import { authService } from './services/authService';

const themesList: { id: ThemeName; label: string; color: string }[] = [
  { id: 'default', label: 'Essencial', color: 'bg-indigo-500' },
  { id: 'neon', label: 'Neon', color: 'bg-fuchsia-500' },
  { id: 'ascending', label: 'Ascending', color: 'bg-blue-600' },
  { id: 'zen', label: 'Zen', color: 'bg-[#d64933]' },
];

const App: React.FC = () => {
  // Estados de Autenticação
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rankflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('rankflow_is_guest') === 'true');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');

  const {
    isLoading: isMongoLoading,
    isInitialized: isCloudActive,
    loadTasks,
    saveTasks,
    loadHabits,
    saveHabits,
    loadNotes,
    saveNotes,
    saveSettings
  } = useMongoDB(user);

  // Estados principais
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeCriterion, setActiveCriterion] = useState<RankingCriterion>('priorityRank');
  const [view, setView] = useState<AppView>('tasks');
  const [showOfflineNotice, setShowOfflineNotice] = useState(true);
  
  // Tema - Inicia com o padrão do dispositivo se não houver preferência salva
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('rankflow_mode');
    if (saved) return saved as ThemeMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [themeName, setThemeName] = useState<ThemeName>(() => (localStorage.getItem('rankflow_theme_name') as ThemeName) || 'default');
  const [overrideBgUrl, setOverrideBgUrl] = useState(() => localStorage.getItem('rankflow_bg_override') || '');
  
  // Integrações
  const [isGCalConnected, setIsGCalConnected] = useState(() => localStorage.getItem('rankflow_gcal_connected') === 'true');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('rankflow_notifications') === 'true');

  // Modais e UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isNoteInputVisible, setIsNoteInputVisible] = useState(false);
  const [isLocalDataLoading, setIsLocalDataLoading] = useState(true);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [habitTitle, setHabitTitle] = useState('');
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily');
  const [newNoteContent, setNewNoteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers de Autenticação
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginName) return;
    setAuthLoading(true);
    try {
      const loggedUser = await authService.login(loginEmail, loginName);
      setUser(loggedUser);
      setIsGuest(false);
      localStorage.setItem('rankflow_user', JSON.stringify(loggedUser));
      localStorage.removeItem('rankflow_is_guest');
    } catch (err) {
      alert('Erro ao entrar. Tente novamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestMode = () => {
    setIsGuest(true);
    setUser(null);
    localStorage.setItem('rankflow_is_guest', 'true');
    localStorage.removeItem('rankflow_user');
  };

  const handleLogout = () => {
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('rankflow_user');
    localStorage.removeItem('rankflow_is_guest');
    setTasks([]);
    setHabits([]);
    setNotes([]);
    setView('tasks');
  };

  // Inicialização de dados (Nuvem ou Local)
  useEffect(() => {
    const initializeData = async () => {
      if (!user && !isGuest) return;
      
      setIsLocalDataLoading(true);
      try {
        const [loadedTasks, loadedHabits, loadedNotes] = await Promise.all([
          loadTasks(),
          loadHabits(),
          loadNotes()
        ]);
        setTasks(loadedTasks || []);
        setHabits(loadedHabits || []);
        setNotes(loadedNotes || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLocalDataLoading(false);
      }
    };

    if (!isMongoLoading && (user || isGuest)) {
      initializeData();
    }
  }, [isMongoLoading, loadTasks, loadHabits, loadNotes, user, isGuest]);

  // Sincronização automática
  useEffect(() => {
    if (!isLocalDataLoading && !isMongoLoading && (user || isGuest)) {
      saveTasks(tasks);
    }
  }, [tasks, saveTasks, isLocalDataLoading, isMongoLoading, user, isGuest]);

  useEffect(() => {
    if (!isLocalDataLoading && !isMongoLoading && (user || isGuest)) {
      saveHabits(habits);
    }
  }, [habits, saveHabits, isLocalDataLoading, isMongoLoading, user, isGuest]);

  useEffect(() => {
    if (!isLocalDataLoading && !isMongoLoading && (user || isGuest)) {
      saveNotes(notes);
    }
  }, [notes, saveNotes, isLocalDataLoading, isMongoLoading, user, isGuest]);

  useEffect(() => {
    const settings = {
      mode: themeMode,
      theme_name: themeName,
      bg_override: overrideBgUrl,
      notifications: notificationsEnabled,
      gcal_connected: isGCalConnected
    };
    saveSettings(settings);
    localStorage.setItem('rankflow_mode', themeMode);
    localStorage.setItem('rankflow_theme_name', themeName);
    localStorage.setItem('rankflow_bg_override', overrideBgUrl);
    localStorage.setItem('rankflow_notifications', notificationsEnabled.toString());
    localStorage.setItem('rankflow_gcal_connected', isGCalConnected.toString());
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode, themeName, overrideBgUrl, notificationsEnabled, isGCalConnected, saveSettings]);

  const theme = useMemo(() => {
    const base = THEME_MAP[themeName as keyof typeof THEME_MAP]?.[themeMode] || THEME_MAP.default[themeMode];
    return { ...base, bgImage: overrideBgUrl || base.bgImage };
  }, [themeName, themeMode, overrideBgUrl]);

  const sortedTasks = useMemo(() => {
    const result = [...tasks];
    
    // Lógica especial para Urgência: Prazos mais próximos no topo
    if (activeCriterion === 'urgencyRank') {
      return result.sort((a, b) => {
        const hasDateA = !!a.dueDate;
        const hasDateB = !!b.dueDate;

        if (hasDateA && !hasDateB) return -1;
        if (!hasDateA && hasDateB) return 1;

        if (hasDateA && hasDateB) {
          const timeA = new Date(a.dueDate!).getTime();
          const timeB = new Date(b.dueDate!).getTime();
          if (timeA !== timeB) return timeA - timeB;
        }

        return a.urgencyRank - b.urgencyRank;
      });
    }

    // Ordenação padrão para os outros critérios
    return result.sort((a, b) => a[activeCriterion] - b[activeCriterion]);
  }, [tasks, activeCriterion]);
  
  const statsData = useMemo(() => 
    RANKING_CONFIGS.map(c => ({
      name: c.label === 'priorityRank' ? 'Prioridade' : c.label === 'difficultyRank' ? 'Esforço' : 'Urgência',
      avg: tasks.length === 0 ? 0 : tasks.reduce((a, b) => a + (b[c.id] || 0), 0) / tasks.length
    })), 
    [tasks]
  );
  
  const statusDist = useMemo(() => [
    { name: 'A Fazer', value: tasks.filter(t => t.status === TaskStatus.TODO).length, fill: '#6366f1' },
    { name: 'Concluído', value: tasks.filter(t => t.status === TaskStatus.DONE).length, fill: '#10b981' }
  ], [tasks]);

  const exportData = () => {
    const data = { tasks, habits, notes, themeName, themeMode, overrideBgUrl };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rankflow_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        alert("Backup restaurado!");
      } catch (err) {
        alert("Erro na importação.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addTask = useCallback(async () => {
    if (!newTitle.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      description: newDesc,
      priorityRank: tasks.length + 1,
      difficultyRank: tasks.length + 1,
      urgencyRank: tasks.length + 1,
      status: TaskStatus.TODO,
      createdAt: Date.now(),
      dueDate: newDueDate || undefined
    };
    setTasks(prev => [...prev, newTask]);
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setIsModalOpen(false);
  }, [newTitle, newDesc, newDueDate, tasks.length]);

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
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completedDates: h.completedDates.includes(today) ? h.completedDates.filter(d => d !== today) : [...h.completedDates, today] } : h));
  };

  const deleteHabit = (id: string) => setHabits(prev => prev.filter(h => h.id !== id));

  const addNote = () => {
    if (!newNoteContent.trim()) return;
    const newNote: Note = { id: Math.random().toString(36).substr(2, 9), content: newNoteContent, createdAt: Date.now() };
    setNotes(prev => [newNote, ...prev]);
    setNewNoteContent('');
  };

  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const moveTask = useCallback((taskId: string, direction: 'up' | 'down') => {
    setTasks(prev => {
      const currentTasks = [...prev].sort((a, b) => a[activeCriterion] - b[activeCriterion]);
      const index = currentTasks.findIndex(t => t.id === taskId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= currentTasks.length) return prev;
      const taskA = { ...currentTasks[index] };
      const taskB = { ...currentTasks[targetIndex] };
      const tempRank = taskA[activeCriterion];
      taskA[activeCriterion] = taskB[activeCriterion];
      taskB[activeCriterion] = tempRank;
      return prev.map(t => t.id === taskA.id ? taskA : t.id === taskB.id ? taskB : t);
    });
  }, [activeCriterion]);

  // Tela de Login / Modo Guest
  if (!user && !isGuest) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme.mainBg} overflow-hidden transition-all duration-300 relative`}>
        {theme.bgImage && (
          <div className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${theme.bgImage})`, opacity: theme.bgOpacity ?? 0.1 }} />
        )}
        <div className={`w-full max-w-md ${theme.cardBg} p-10 rounded-[3rem] shadow-2xl border ${theme.border} z-10 animate-in zoom-in duration-300 backdrop-blur-md`}>
          <div className="text-center mb-8">
            <div className={`w-20 h-20 ${theme.accent} rounded-3xl mx-auto flex items-center justify-center text-white shadow-lg mb-6`}>
              <Sparkles size={40} />
            </div>
            <h1 className={`text-4xl font-black tracking-tighter ${theme.textPrimary}`}>RankFlow</h1>
            <p className={`text-sm ${theme.textSecondary} mt-2 font-medium`}>O seu espaço produtivo isolado.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} ml-3`}>Seu Nome</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={loginName}
                  onChange={e => setLoginName(e.target.value)}
                  placeholder="Ex: Edgar Faial"
                  className={`w-full pl-12 pr-6 py-4 rounded-2xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} ml-3`}>Seu E-mail</label>
              <div className="relative">
                <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className={`w-full pl-12 pr-6 py-4 rounded-2xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold`}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={authLoading}
              className={`w-full py-5 ${theme.accent} text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
            >
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
              Entrar no RankFlow
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className={`flex-1 h-[1px] ${theme.border} opacity-20`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>ou</span>
            <div className={`flex-1 h-[1px] ${theme.border} opacity-20`} />
          </div>

          <button 
            onClick={handleGuestMode}
            className={`w-full py-4 border-2 border-dashed ${theme.border} ${theme.textSecondary} font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-3`}
          >
            <Shield size={16} />
            Permanecer Desconectado
          </button>
        </div>
      </div>
    );
  }

  // Splash screen apenas se estiver tentando carregar dados da nuvem
  if (user && isMongoLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-indigo-500" />
          <h1 className="text-2xl font-black tracking-tighter mb-2">RankFlow</h1>
          <p className="text-slate-400">Carregando seu workspace pessoal...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'tasks', icon: ListOrdered, label: 'Tarefas' },
    { id: 'habits', icon: Repeat, label: 'Hábitos' },
    { id: 'notes', icon: StickyNote, label: 'Notas' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Status' },
    { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <div className={`flex flex-col md:flex-row h-screen max-h-screen overflow-hidden ${theme.mainBg} transition-all duration-300 relative`}>
      {theme.bgImage && (
        <div className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${theme.bgImage})`, opacity: theme.bgOpacity ?? 0.1 }} />
      )}

      <aside className={`hidden md:flex flex-col w-72 ${theme.sidebarBg} text-white p-8 shrink-0 shadow-2xl z-20`}>
        <div className="flex items-center gap-3 mb-12">
          <div className={`${theme.accent} p-2.5 rounded-2xl shadow-lg`}><Sparkles size={28} /></div>
          <h1 className="text-2xl font-black tracking-tighter">RankFlow</h1>
        </div>
        
        <nav className="space-y-3 flex-1 overflow-y-auto pr-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id as AppView)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${
                view === item.id ? theme.accent + ' shadow-lg text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={22} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 mb-4 px-2">
           <div className="flex items-center gap-3 text-slate-400 px-3 py-2">
             <UserIcon size={20} />
             <p className="text-sm font-bold truncate">
               {user ? user.name : 'Convidado'}
             </p>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden z-10 relative">
        <header className={`${theme.headerBg} border-b ${theme.border} px-8 py-5 flex items-center justify-between z-10 backdrop-blur-md bg-opacity-80`}>
          <div className="flex items-center gap-4">
            <h2 className={`text-xl font-black ${theme.textPrimary} tracking-tight`}>
              {view === 'tasks' ? 'Otimizar Tarefas' : 
               view === 'habits' ? 'Hábitos' : 
               view === 'notes' ? 'Notas Rápidas' : 
               navItems.find(n => n.id === view)?.label}
            </h2>
            {(!isCloudActive && showOfflineNotice) && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20" title="Modo Offline - Salvando apenas localmente">
                <CloudOff size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Offline</span>
                <button 
                  onClick={() => setShowOfflineNotice(false)}
                  className="ml-1 p-0.5 hover:bg-amber-500/20 rounded-full transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
          
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

        <div className={`md:hidden flex ${theme.headerBg} border-b ${theme.border} p-2 shrink-0`}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id as AppView)}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl ${view === item.id ? theme.accent + ' text-white' : 'text-slate-500'}`}>
              <item.icon size={20} />
              <span className="text-[9px] font-black uppercase mt-1">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 min-h-0">
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
                  <>
                    {sortedTasks.map((task, idx) => (
                      <TaskCard key={task.id} task={task} criterion={activeCriterion} onMove={moveTask} onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))} onToggleStatus={toggleStatus} isFirst={idx === 0} isLast={idx === sortedTasks.length - 1} />
                    ))}
                    <AdBanner />
                  </>
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
                  <>
                    {habits.map(habit => <HabitCard key={habit.id} habit={habit} theme={theme} onToggle={toggleHabit} onDelete={deleteHabit} />)}
                    <AdBanner />
                  </>
                )}
              </div>
            </div>
          )}

          {view === 'notes' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              {isNoteInputVisible && (
                <div className={`${theme.cardBg} p-8 rounded-[2.5rem] border ${theme.border} shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300`}>
                  <textarea placeholder="Anote algo rápido..." value={newNoteContent} onChange={e => setNewNoteContent(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} h-32 resize-none font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} />
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
                  <>
                    {notes.map(note => (
                      <div key={note.id} className={`${theme.cardBg} p-6 rounded-3xl border ${theme.border} shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between h-48`}>
                        <p className={`text-sm ${theme.textPrimary} font-medium line-clamp-4 leading-relaxed`}>{note.content}</p>
                        <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100 dark:border-white/5">
                          <div className="flex gap-1">
                            <button onClick={() => { setNewTitle(note.content); setIsModalOpen(true); }} className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all"><ListOrdered size={16} /></button>
                            <button onClick={() => { setHabitTitle(note.content); setIsHabitModalOpen(true); }} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><Repeat size={16} /></button>
                          </div>
                          <button onClick={() => deleteNote(note.id)} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                    <div className="col-span-full">
                      <AdBanner />
                    </div>
                  </>
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
              <AdBanner />
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
                  <button onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} className={`p-3 rounded-2xl shadow-inner transition-all ${themeMode === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-900/50 text-indigo-400'}`}>
                    {themeMode === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {themesList.map(t => (
                      <button key={t.id} onClick={() => setThemeName(t.id)} className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-2 items-center group ${themeName === t.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-transparent bg-slate-100/50 dark:bg-white/5'}`}>
                        <div className={`w-8 h-8 rounded-full ${t.color} shadow-md group-hover:scale-110 transition-transform`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textPrimary}`}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} ml-2`}>Fundo Customizado (URL)</label>
                    <input type="text" value={overrideBgUrl} onChange={e => setOverrideBgUrl(e.target.value)} placeholder="https://..." className={`w-full p-4 rounded-2xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} />
                  </div>
                </div>
              </div>

              <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                <div className={`p-8 border-b ${theme.border} flex items-center justify-between`}>
                  <div>
                    <h3 className={`text-xl font-black ${theme.textPrimary} tracking-tighter`}>Gestão de Dados</h3>
                    <p className={`text-xs ${theme.textSecondary} font-medium`}>Controle seus backups e sessão.</p>
                  </div>
                  <div className={`p-3 rounded-2xl ${isCloudActive ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                    {isCloudActive ? <Shield size={20} /> : <CloudOff size={20} />}
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={exportData} className={`flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500/20 transition-all`}>
                      <Download size={18} /> Exportar
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className={`flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all`}>
                      <Upload size={18} /> Importar
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                  </div>
                  <button onClick={handleLogout} className={`w-full flex items-center justify-center gap-3 p-5 rounded-3xl border-2 border-rose-500/20 text-rose-500 font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all`}>
                    <LogOut size={18} /> Sair da Conta
                  </button>
                </div>
              </div>
              <AdBanner />
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
          <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            <div className={`p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent`}>
              <h3 className={`text-3xl font-black ${theme.textPrimary} tracking-tighter`}>Nova Missão</h3>
              <button onClick={() => { setIsModalOpen(false); }} className="hover:rotate-90 transition-transform"><X size={32}/></button>
            </div>
            <div className="p-10 space-y-6">
              <input type="text" placeholder="Título..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-lg font-bold outline-none focus:ring-4 focus:ring-indigo-500/20`} />
              <textarea placeholder="Descrição..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} h-40 resize-none font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} />
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-2">Vencimento</label>
                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} font-bold outline-none`} />
              </div>
            </div>
            <div className="p-10 bg-slate-50 dark:bg-black/20 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className={`flex-1 p-6 font-black uppercase text-xs tracking-widest ${theme.textSecondary}`}>Cancelar</button>
              <button onClick={addTask} className={`flex-[2] p-6 ${theme.accent} text-white font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2`}>INICIAR FLOW</button>
            </div>
          </div>
        </div>
      )}

      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
          <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            <div className={`p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent`}>
              <h3 className={`text-3xl font-black ${theme.textPrimary} tracking-tighter`}>Novo Hábito</h3>
              <button onClick={() => { setIsHabitModalOpen(false); }} className="hover:rotate-90 transition-transform"><X size={32}/></button>
            </div>
            <div className="p-10 space-y-8">
              <input type="text" placeholder="ex: Meditação 10min..." value={habitTitle} onChange={e => setHabitTitle(e.target.value)} className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-lg font-bold outline-none focus:ring-4 focus:ring-emerald-500/20`} />
              <div className="grid grid-cols-2 gap-3">
                {['daily', 'weekly', 'weekdays', 'weekend'].map(f => (
                  <button key={f} onClick={() => setHabitFreq(f as HabitFrequency)} className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-tighter transition-all ${habitFreq === f ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : theme.border + ' ' + theme.textSecondary}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="p-10 bg-slate-50 dark:bg-black/20 flex gap-4">
              <button onClick={() => setIsHabitModalOpen(false)} className={`flex-1 p-6 font-black uppercase text-xs tracking-widest ${theme.textSecondary}`}>Cancelar</button>
              <button onClick={addHabit} className={`flex-[2] p-6 bg-emerald-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all`}>SALVAR HÁBITO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;