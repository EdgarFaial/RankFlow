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

/**
 * Componente principal do aplicativo RankFlow
 * Gerencia tarefas, hábitos, notas, temas e integrações
 */
const App: React.FC = () => {
  // ============================================================================
  // HOOKS E ESTADOS
  // ============================================================================
  
  // Hook personalizado para operações com MongoDB
  const {
    isLoading: isMongoLoading,    // Estado de carregamento do MongoDB
    error: mongoError,             // Erros de conexão/operação
    isInitialized,                  // Se o MongoDB foi inicializado
    loadTasks,                      // Função para carregar tarefas
    saveTasks,                      // Função para salvar tarefas
    loadHabits,                     // Função para carregar hábitos
    saveHabits,                     // Função para salvar hábitos
    loadNotes,                      // Função para carregar notas
    saveNotes,                      // Função para salvar notas
    saveSettings                    // Função para salvar configurações
  } = useMongoDB();

  // ============================================================================
  // ESTADOS PRINCIPAIS DA APLICAÇÃO
  // ============================================================================
  
  // Dados principais
  const [tasks, setTasks] = useState<Task[]>([]);              // Lista de tarefas
  const [habits, setHabits] = useState<Habit[]>([]);           // Lista de hábitos
  const [notes, setNotes] = useState<Note[]>([]);              // Lista de notas
  
  // Configurações de visualização e ordenação
  const [activeCriterion, setActiveCriterion] = useState<RankingCriterion>('priorityRank'); // Critério ativo para ranqueamento
  const [view, setView] = useState<AppView>('tasks');           // Visualização atual (tarefas/hábitos/notas/dashboard/config)
  
  // ============================================================================
  // ESTADOS DE TEMA E PERSONALIZAÇÃO
  // ============================================================================
  
  // Tema (claro/escuro) - carrega do localStorage ou usa 'light' como padrão
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => (localStorage.getItem('rankflow_mode') as ThemeMode) || 'light');
  
  // Nome do tema visual - carrega do localStorage ou usa 'default'
  const [themeName, setThemeName] = useState<ThemeName>(() => (localStorage.getItem('rankflow_theme_name') as ThemeName) || 'default');
  
  // URL de imagem de fundo personalizada
  const [overrideBgUrl, setOverrideBgUrl] = useState(() => localStorage.getItem('rankflow_bg_override') || '');
  
  // ============================================================================
  // ESTADOS DE IA (ATUALMENTE DESATIVADOS)
  // ============================================================================
  
  const [isAiEnabled, setIsAiEnabled] = useState(false);        // Se IA está habilitada (sempre false por enquanto)
  const [isAIThinking, setIsAIThinking] = useState(false);      // Se IA está processando
  const [aiAudit, setAiAudit] = useState<{ summary: string; suggestions: {taskId: string, improvement: string}[] } | null>(null); // Resultados da auditoria IA

  // ============================================================================
  // ESTADOS DE INTEGRAÇÕES EXTERNAS
  // ============================================================================
  
  // Google Calendar
  const [isGCalConnected, setIsGCalConnected] = useState(() => localStorage.getItem('rankflow_gcal_connected') === 'true'); // Status da conexão
  const [isSyncing, setIsSyncing] = useState(false);            // Estado de sincronização

  // ============================================================================
  // ESTADOS DE UTILITÁRIOS
  // ============================================================================
  
  // Notificações
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('rankflow_notifications') === 'true'); // Permissão de notificações
  const [copySuccess, setCopySuccess] = useState(false);        // Feedback de cópia para área de transferência

  // ============================================================================
  // ESTADOS DE INTERFACE DO USUÁRIO
  // ============================================================================
  
  // Controle de modais
  const [isModalOpen, setIsModalOpen] = useState(false);        // Modal de nova tarefa
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false); // Modal de novo hábito
  const [isNoteInputVisible, setIsNoteInputVisible] = useState(false); // Input de nova nota
  
  // Estados de carregamento
  const [isLoading, setIsLoading] = useState(true);             // Carregamento inicial dos dados
  
  // ============================================================================
  // ESTADOS DE FORMULÁRIOS
  // ============================================================================
  
  // Formulário de tarefa
  const [newTitle, setNewTitle] = useState('');                 // Título da nova tarefa
  const [newDesc, setNewDesc] = useState('');                   // Descrição da nova tarefa
  const [newDueDate, setNewDueDate] = useState('');             // Data de vencimento
  const [useAiForThisTask, setUseAiForThisTask] = useState(false); // Usar IA para esta tarefa (não implementado)

  // Formulário de hábito
  const [habitTitle, setHabitTitle] = useState('');             // Título do novo hábito
  const [habitFreq, setHabitFreq] = useState<HabitFrequency>('daily'); // Frequência do hábito

  // Formulário de nota
  const [newNoteContent, setNewNoteContent] = useState('');     // Conteúdo da nova nota

  // Referências
  const fileInputRef = useRef<HTMLInputElement>(null);          // Referência para input de arquivo (importação)

  // ============================================================================
  // EFEITOS COLATERAIS (useEffect)
  // ============================================================================

  /**
   * Efeito: Carregar dados iniciais do MongoDB
   * Executado quando o MongoDB termina de carregar
   */
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true); // Ativa estado de carregamento
      try {
        // Carrega todos os dados em paralelo para melhor performance
        const [loadedTasks, loadedHabits, loadedNotes] = await Promise.all([
          loadTasks(),    // Carrega tarefas
          loadHabits(),   // Carrega hábitos
          loadNotes()     // Carrega notas
        ]);

        // Atualiza os estados com os dados carregados
        setTasks(loadedTasks);
        setHabits(loadedHabits);
        setNotes(loadedNotes);
      } catch (error) {
        console.error('Erro ao carregar dados:', error); // Log de erro
      } finally {
        setIsLoading(false); // Desativa carregamento independente do resultado
      }
    };

    // Só inicializa quando o MongoDB não estiver mais carregando
    if (!isMongoLoading) {
      initializeData();
    }
  }, [isMongoLoading, loadTasks, loadHabits, loadNotes]); // Dependências do efeito

  /**
   * Efeito: Salvar tarefas no MongoDB quando houver mudanças
   * Evita salvar durante carregamento inicial
   */
  useEffect(() => {
    if (!isLoading && !isMongoLoading) {
      saveTasks(tasks); // Persiste tarefas
    }
  }, [tasks, saveTasks, isLoading, isMongoLoading]);

  /**
   * Efeito: Salvar hábitos no MongoDB quando houver mudanças
   */
  useEffect(() => {
    if (!isLoading && !isMongoLoading) {
      saveHabits(habits); // Persiste hábitos
    }
  }, [habits, saveHabits, isLoading, isMongoLoading]);

  /**
   * Efeito: Salvar notas no MongoDB quando houver mudanças
   */
  useEffect(() => {
    if (!isLoading && !isMongoLoading) {
      saveNotes(notes); // Persiste notas
    }
  }, [notes, saveNotes, isLoading, isMongoLoading]);

  /**
   * Efeito: Salvar configurações e sincronizar com localStorage
   * Executado quando qualquer configuração muda
   */
  useEffect(() => {
    // Prepara objeto de configurações
    const settings = {
      mode: themeMode,
      theme_name: themeName,
      bg_override: overrideBgUrl,
      notifications: notificationsEnabled,
      ai_enabled: isAiEnabled,
      gcal_connected: isGCalConnected
    };
    
    // Salva no MongoDB
    saveSettings(settings);
    
    // Salva no localStorage para persistência entre sessões
    localStorage.setItem('rankflow_mode', themeMode);
    localStorage.setItem('rankflow_theme_name', themeName);
    localStorage.setItem('rankflow_bg_override', overrideBgUrl);
    localStorage.setItem('rankflow_notifications', notificationsEnabled.toString());
    localStorage.setItem('rankflow_ai_enabled', isAiEnabled.toString());
    localStorage.setItem('rankflow_gcal_connected', isGCalConnected.toString());
    
    // Aplica classe dark no HTML root para estilização global
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode, themeName, overrideBgUrl, notificationsEnabled, isAiEnabled, isGCalConnected, saveSettings]);

  /**
   * Efeito: Gerenciar notificações de tarefas próximas do vencimento
   * Verifica a cada minuto se há tarefas vencendo em até 24h
   */
  useEffect(() => {
    // Se notificações não estão habilitadas, não faz nada
    if (!notificationsEnabled) return;

    /**
     * Função que verifica prazos e dispara notificações
     */
    const checkDeadlines = () => {
      const now = Date.now(); // Timestamp atual
      
      // Filtra tarefas a fazer com data de vencimento e que ainda não foram notificadas
      const upcomingTasks = tasks.filter(t => 
        t.status === TaskStatus.TODO && 
        t.dueDate && 
        !t.lastNotified
      );

      // Para cada tarefa, verifica se está próxima do vencimento
      upcomingTasks.forEach(task => {
        // Converte data de vencimento para timestamp
        const dueDate = new Date(task.dueDate + 'T00:00:00').getTime();
        const diff = dueDate - now; // Diferença em ms
        const oneDay = 24 * 60 * 60 * 1000; // 24 horas em ms

        // Se falta menos de 24h e ainda não venceu
        if (diff > 0 && diff < oneDay) {
          // Dispara notificação do navegador
          new Notification("RankFlow: Tarefa Próxima!", {
            body: `Sua tarefa "${task.title}" vence em breve.`,
            icon: '/favicon.ico'
          });
          
          // Marca tarefa como notificada para não repetir
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, lastNotified: now } : t));
        }
      });
    };

    // Configura intervalo de verificação a cada minuto
    const interval = setInterval(checkDeadlines, 60000);
    
    // Cleanup: limpa intervalo quando componente desmonta ou dependências mudam
    return () => clearInterval(interval);
  }, [notificationsEnabled, tasks]); // Reexecuta se notificações ou tarefas mudarem

  // ============================================================================
  // MEMOIZAÇÕES (useMemo) PARA PERFORMANCE
  // ============================================================================

  /**
   * Memo: Tema atual combinado
   * Combina o tema base (nome + modo) com override de imagem de fundo
   */
  const theme = useMemo(() => {
    // Obtém configurações base do tema
    const base = THEME_MAP[themeName as keyof typeof THEME_MAP]?.[themeMode] || THEME_MAP.default[themeMode];
    // Retorna tema com possível override de imagem de fundo
    return { ...base, bgImage: overrideBgUrl || base.bgImage };
  }, [themeName, themeMode, overrideBgUrl]); // Recalcula quando essas dependências mudam

  /**
   * Memo: Tarefas ordenadas pelo critério ativo
   * Evita ordenar a cada renderização, só quando tarefas ou critério mudam
   */
  const sortedTasks = useMemo(() => 
    [...tasks].sort((a, b) => a[activeCriterion] - b[activeCriterion]), 
    [tasks, activeCriterion]
  );
  
  /**
   * Memo: Dados para gráfico de estatísticas de ranqueamento
   * Calcula média de cada critério para visualização
   */
  const statsData = useMemo(() => 
    RANKING_CONFIGS.map(c => ({
      name: c.label === 'Priority' ? 'Prioridade' : c.label === 'Difficulty' ? 'Dificuldade' : 'Urgência',
      avg: tasks.length === 0 ? 0 : tasks.reduce((a, b) => a + (b[c.id] || 0), 0) / tasks.length
    })), 
    [tasks]
  );
  
  /**
   * Memo: Distribuição de status das tarefas para gráfico de pizza
   */
  const statusDist = useMemo(() => [
    { name: 'A Fazer', value: tasks.filter(t => t.status === TaskStatus.TODO).length, fill: '#6366f1' },
    { name: 'Concluído', value: tasks.filter(t => t.status === TaskStatus.DONE).length, fill: '#10b981' }
  ], [tasks]);

  // ============================================================================
  // FUNÇÕES DE INTEGRAÇÃO COM GOOGLE CALENDAR
  // ============================================================================

  /**
   * Simula conexão com Google Calendar
   * Em produção, implementaria OAuth2 real
   */
  const connectGCal = () => {
    setIsSyncing(true); // Ativa estado de sincronização
    // Simula processo de autenticação
    setTimeout(() => {
      setIsGCalConnected(true); // Marca como conectado
      setIsSyncing(false);      // Desativa sincronização
      alert("RankFlow conectado ao Google Calendar com sucesso!"); // Feedback ao usuário
    }, 1500); // Delay de 1.5s para simular processo
  };

  /**
   * Simula sincronização de tarefas com Google Calendar
   */
  const syncToGCal = () => {
    if (!isGCalConnected) return; // Só sincroniza se conectado
    
    setIsSyncing(true); // Ativa estado de sincronização
    
    // Conta tarefas a fazer com data de vencimento
    const syncCount = tasks.filter(t => t.dueDate && t.status === TaskStatus.TODO).length;
    
    // Simula sincronização
    setTimeout(() => {
      setIsSyncing(false); // Desativa sincronização
      alert(`${syncCount} tarefas sincronizadas com seu Google Calendar.`); // Feedback
    }, 2000); // Delay de 2s
  };

  // ============================================================================
  // FUNÇÕES DE NOTIFICAÇÃO
  // ============================================================================

  /**
   * Solicita permissão para notificações do navegador
   */
  const requestNotificationPermission = async () => {
    // Verifica se o navegador suporta notificações
    if (!("Notification" in window)) return;
    
    // Solicita permissão
    const permission = await Notification.requestPermission();
    
    // Atualiza estado baseado na resposta
    setNotificationsEnabled(permission === "granted");
  };

  // ============================================================================
  // FUNÇÕES DE SINCRONIZAÇÃO E BACKUP
  // ============================================================================

  /**
   * Exporta todos os dados para arquivo JSON
   */
  const exportData = () => {
    // Prepara objeto com dados e configurações
    const data = { tasks, habits, notes, themeName, themeMode, overrideBgUrl };
    
    // Cria blob e URL para download
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Cria link temporário e simula clique
    const a = document.createElement('a');
    a.href = url;
    a.download = `rankflow_sync_${new Date().toISOString().split('T')[0]}.json`; // Nome com data
    a.click();
    
    // Limpa URL criada
    URL.revokeObjectURL(url);
  };

  /**
   * Importa dados de arquivo JSON
   */
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // Parse do JSON
        const data = JSON.parse(event.target?.result as string);
        
        // Atualiza estados com dados importados
        if (data.tasks) setTasks(data.tasks);
        if (data.habits) setHabits(data.habits);
        if (data.notes) setNotes(data.notes);
        if (data.themeName) setThemeName(data.themeName);
        if (data.themeMode) setThemeMode(data.themeMode);
        if (data.overrideBgUrl) setOverrideBgUrl(data.overrideBgUrl);
        
        alert("Dados sincronizados com sucesso!"); // Feedback
      } catch (err) {
        alert("Erro ao importar arquivo."); // Feedback de erro
      }
    };
    reader.readAsText(file); // Lê arquivo como texto
    
    // Limpa input para permitir re-importação do mesmo arquivo
    e.target.value = '';
  };

  /**
   * Gera código de sincronização (base64) e copia para área de transferência
   */
  const generateSyncCode = () => {
    // Prepara dados
    const data = { tasks, habits, notes };
    
    // Codifica em base64
    const code = btoa(JSON.stringify(data));
    
    // Copia para área de transferência
    navigator.clipboard.writeText(code);
    
    // Feedback visual
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000); // Reseta após 2s
  };

  // ============================================================================
  // HANDLERS DE TAREFAS
  // ============================================================================

  /**
   * Reseta formulário de nova tarefa
   */
  const resetForm = useCallback(() => {
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setUseAiForThisTask(false);
  }, []);

  /**
   * Adiciona nova tarefa
   */
  const addTask = useCallback(async () => {
    // Validação básica
    if (!newTitle.trim()) return;
    
    let description = newDesc;

    // Cria objeto de tarefa
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9), // ID único
      title: newTitle,
      description,
      priorityRank: tasks.length + 1, // Ranking inicial
      difficultyRank: tasks.length + 1,
      urgencyRank: tasks.length + 1,
      status: TaskStatus.TODO,
      createdAt: Date.now(),
      dueDate: newDueDate || undefined
    };
    
    // Adiciona tarefa à lista
    setTasks(prev => [...prev, newTask]);
    
    // Limpa formulário e fecha modal
    resetForm();
    setIsModalOpen(false);
  }, [newTitle, newDesc, newDueDate, tasks.length, resetForm]);

  /**
   * Alterna status da tarefa (TODO/DONE)
   */
  const toggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? {...t, status: t.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE} : t
    ));
  };

  // ============================================================================
  // HANDLERS DE HÁBITOS
  // ============================================================================

  /**
   * Adiciona novo hábito
   */
  const addHabit = () => {
    // Validação básica
    if (!habitTitle.trim()) return;
    
    // Cria objeto de hábito
    const newHabit: Habit = {
      id: Math.random().toString(36).substr(2, 9), // ID único
      title: habitTitle,
      frequency: habitFreq,
      completedDates: [], // Inicia sem conclusões
      createdAt: Date.now()
    };
    
    // Adiciona hábito à lista
    setHabits(prev => [...prev, newHabit]);
    
    // Limpa formulário e fecha modal
    setHabitTitle('');
    setIsHabitModalOpen(false);
  };

  /**
   * Alterna conclusão de hábito para o dia atual
   */
  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD
    
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const isCompleted = h.completedDates.includes(today);
        return {
          ...h,
          completedDates: isCompleted 
            ? h.completedDates.filter(d => d !== today) // Remove se já completo
            : [...h.completedDates, today] // Adiciona se não completo
        };
      }
      return h;
    }));
  };

  /**
   * Remove hábito
   */
  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // ============================================================================
  // HANDLERS DE NOTAS
  // ============================================================================

  /**
   * Adiciona nova nota
   */
  const addNote = () => {
    // Validação básica
    if (!newNoteContent.trim()) return;
    
    // Cria objeto de nota
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9), // ID único
      content: newNoteContent,
      createdAt: Date.now()
    };
    
    // Adiciona nota à lista (no início para mostrar as mais recentes primeiro)
    setNotes(prev => [newNote, ...prev]);
    
    // Limpa formulário
    setNewNoteContent('');
  };

  /**
   * Remove nota
   */
  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  /**
   * Converte nota em tarefa (preenche formulário de tarefa)
   */
  const transformNoteToTask = (note: Note) => {
    setNewTitle(note.content); // Usa conteúdo da nota como título
    setIsModalOpen(true); // Abre modal de tarefa
  };

  /**
   * Converte nota em hábito (preenche formulário de hábito)
   */
  const transformNoteToHabit = (note: Note) => {
    setHabitTitle(note.content); // Usa conteúdo da nota como título
    setIsHabitModalOpen(true); // Abre modal de hábito
  };

  // ============================================================================
  // HANDLERS DE IA (DESATIVADOS)
  // ============================================================================

  /**
   * Função de auditoria IA - atualmente desativada
   */
  const handleAudit = async () => {
    // Temporariamente desativado
    return;
  };

  // ============================================================================
  // HANDLERS DE REORDENAÇÃO
  // ============================================================================

  /**
   * Move tarefa para cima ou para baixo na ordenação atual
   */
  const moveTask = useCallback((taskId: string, direction: 'up' | 'down') => {
    setTasks(prev => {
      // Ordena tarefas pelo critério ativo
      const currentTasks = [...prev].sort((a, b) => a[activeCriterion] - b[activeCriterion]);
      
      // Encontra índice da tarefa
      const index = currentTasks.findIndex(t => t.id === taskId);
      if (index === -1) return prev;
      
      // Calcula índice alvo
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentTasks.length) return prev;
      
      // Troca os valores de ranking
      const taskA = { ...currentTasks[index] };
      const taskB = { ...currentTasks[targetIndex] };
      
      const tempRank = taskA[activeCriterion];
      taskA[activeCriterion] = taskB[activeCriterion];
      taskB[activeCriterion] = tempRank;
      
      // Atualiza estado com as tarefas modificadas
      return prev.map(t => t.id === taskA.id ? taskA : t.id === taskB.id ? taskB : t);
    });
  }, [activeCriterion]);

  // ============================================================================
  // DADOS ESTÁTICOS PARA INTERFACE
  // ============================================================================

  /**
   * Itens de navegação principal
   */
  const navItems = [
    { id: 'tasks', icon: ListOrdered, label: 'Tarefas' },
    { id: 'habits', icon: Repeat, label: 'Hábitos' },
    { id: 'notes', icon: StickyNote, label: 'Notas' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Status' },
    { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  /**
   * Lista de temas disponíveis
   */
  const themesList: {id: ThemeName, label: string, color: string}[] = [
    { id: 'default', label: 'Slate', color: 'bg-indigo-500' },
    { id: 'cyberpunk', label: 'Neon', color: 'bg-fuchsia-500' },
    { id: 'sololeveling', label: 'Monarch', color: 'bg-blue-600' },
    { id: 'japanese', label: 'Zen', color: 'bg-stone-500' }
  ];

  // ============================================================================
  // RENDERIZAÇÃO CONDICIONAL - TELA DE CARREGAMENTO
  // ============================================================================
  
  // Exibe tela de carregamento enquanto dados não estão prontos
  if (isLoading || isMongoLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          {/* Loader animado */}
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-indigo-500" />
          <h1 className="text-2xl font-black tracking-tighter mb-2">RankFlow</h1>
          <p className="text-slate-400">Conectando ao MongoDB...</p>
        </div>
      </div>
    );
  }

  // Verifica se há erro de MongoDB
  const showMongoErrorBanner = mongoError && !isMongoLoading;

  // ============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================================================
  
  return (
    // Container principal com tema dinâmico
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden ${theme.mainBg} transition-all duration-300 relative`}>
      
      {/* Banner de erro do MongoDB (se houver) */}
      {showMongoErrorBanner && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-600 text-white p-2 text-center text-sm font-bold">
          ⚠️ {mongoError} Os dados estão sendo salvos localmente por enquanto.
        </div>
      )}

      {/* Imagem de fundo do tema (se houver) */}
      {theme.bgImage && (
        <div className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${theme.bgImage})`, opacity: theme.bgOpacity ?? 0.1 }} />
      )}

      {/* ==========================================================================
          SIDEBAR - Navegação principal (visível apenas em desktop)
          ========================================================================== */}
      <aside className={`hidden md:flex flex-col w-72 ${theme.sidebarBg} text-white p-8 shrink-0 shadow-2xl z-20`}>
        {/* Logo e título */}
        <div className="flex items-center gap-3 mb-12">
          <div className={`${theme.accent} p-2.5 rounded-2xl shadow-lg`}><Sparkles size={28} /></div>
          <h1 className="text-2xl font-black tracking-tighter">RankFlow</h1>
        </div>
        
        {/* Menu de navegação */}
        <nav className="space-y-3 flex-1">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => { setView(item.id as AppView); setAiAudit(null); }}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${
                view === item.id 
                  ? theme.accent + ' shadow-lg text-white' // Item ativo
                  : 'text-slate-400 hover:bg-white/5 hover:text-white' // Item inativo
              }`}
            >
              <item.icon size={22} /> {item.label}
            </button>
          ))}
        </nav>

        {/* Footer da sidebar */}
        <div className="pt-8 border-t border-white/10 opacity-40 text-[10px] text-center font-black uppercase tracking-[0.2em]">
          FLOW RADICAL
        </div>
      </aside>

      {/* ==========================================================================
          CONTEÚDO PRINCIPAL
          ========================================================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative">
        
        {/* Cabeçalho com título e ações */}
        <header className={`${theme.headerBg} border-b ${theme.border} px-8 py-5 flex items-center justify-between z-10 backdrop-blur-md bg-opacity-80`}>
          <h2 className={`text-xl font-black ${theme.textPrimary} tracking-tight`}>
            {view === 'tasks' ? 'Otimizar Tarefas' : 
             view === 'habits' ? 'Hábitos' : 
             view === 'notes' ? 'Notas Rápidas' : 
             navItems.find(n => n.id === view)?.label}
          </h2>
          
          {/* Botões de ação baseados na visualização atual */}
          <div className="flex gap-3">
            {view === 'tasks' && (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className={`flex items-center gap-2 ${theme.accent} text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all`}
              >
                <Plus size={20} /> NOVA TAREFA
              </button>
            )}
            {view === 'habits' && (
              <button 
                onClick={() => setIsHabitModalOpen(true)} 
                className={`flex items-center gap-2 ${theme.accent} text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all`}
              >
                <Plus size={20} /> NOVO HÁBITO
              </button>
            )}
            {view === 'notes' && (
              <button 
                onClick={() => setIsNoteInputVisible(!isNoteInputVisible)} 
                className={`flex items-center gap-2 ${theme.accent} text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all`}
              >
                <Plus size={20} /> CRIAR NOTA
              </button>
            )}
          </div>
        </header>

        {/* ==========================================================================
            NAVEGAÇÃO MOBILE (inferior)
            ========================================================================== */}
        <div className={`md:hidden flex ${theme.headerBg} border-b ${theme.border} p-2`}>
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setView(item.id as AppView)}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl ${
                view === item.id ? theme.accent + ' text-white' : 'text-slate-500'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[9px] font-black uppercase mt-1">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ==========================================================================
            CONTEÚDO DINÂMICO POR VISUALIZAÇÃO
            ========================================================================== */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
          
          {/* ------------------------------------------------------------------------
              VISUALIZAÇÃO: TAREFAS
              ------------------------------------------------------------------------ */}
          {view === 'tasks' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
              
              {/* Cabeçalhos de ranqueamento (critérios) */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {RANKING_CONFIGS.map(config => (
                  <RankerHeader 
                    key={config.id} 
                    config={config} 
                    isActive={activeCriterion === config.id} 
                    onClick={() => setActiveCriterion(config.id)} 
                  />
                ))}
              </div>
              
              {/* Lista de tarefas */}
              <div className="grid grid-cols-1 gap-5">
                {sortedTasks.length === 0 ? (
                  // Estado vazio
                  <div className={`flex flex-col items-center justify-center py-32 text-slate-400 border-4 border-dashed ${theme.border} rounded-[3rem]`}>
                    <ListOrdered size={64} strokeWidth={1} className="mb-6 opacity-20" />
                    <p className="text-xl font-bold italic">Nada por aqui ainda.</p>
                  </div>
                ) : (
                  // Lista de tarefas com cartões
                  sortedTasks.map((task, idx) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      criterion={activeCriterion} 
                      onMove={moveTask} 
                      onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))} 
                      onToggleStatus={toggleStatus} 
                      isFirst={idx === 0} 
                      isLast={idx === sortedTasks.length - 1} 
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------
              VISUALIZAÇÃO: HÁBITOS
              ------------------------------------------------------------------------ */}
          {view === 'habits' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 gap-5">
                {habits.length === 0 ? (
                  // Estado vazio
                  <div className={`flex flex-col items-center justify-center py-32 text-slate-400 border-4 border-dashed ${theme.border} rounded-[3rem]`}>
                    <Award size={64} strokeWidth={1} className="mb-6 opacity-20" />
                    <p className="text-xl font-bold italic">Forje novos hábitos.</p>
                  </div>
                ) : (
                  // Lista de hábitos
                  habits.map(habit => 
                    <HabitCard 
                      key={habit.id} 
                      habit={habit} 
                      theme={theme} 
                      onToggle={toggleHabit} 
                      onDelete={deleteHabit} 
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------
              VISUALIZAÇÃO: NOTAS
              ------------------------------------------------------------------------ */}
          {view === 'notes' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              
              {/* Input para nova nota (aparece condicionalmente) */}
              {isNoteInputVisible && (
                <div className={`${theme.cardBg} p-8 rounded-[2.5rem] border ${theme.border} shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300`}>
                  <textarea 
                    placeholder="Anote algo rápido..." 
                    value={newNoteContent} 
                    onChange={e => setNewNoteContent(e.target.value)}
                    className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} h-32 resize-none font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} 
                  />
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setIsNoteInputVisible(false)} 
                      className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest ${theme.textSecondary}`}
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={addNote} 
                      className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest ${theme.accent} text-white shadow-lg hover:scale-105 active:scale-95 transition-all`}
                    >
                      Salvar Nota
                    </button>
                  </div>
                </div>
              )}

              {/* Grid de notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {notes.length === 0 ? (
                  // Estado vazio
                  <div className="col-span-full py-20 text-center opacity-30">
                    <StickyNote size={64} className="mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest">Sem notas salvas</p>
                  </div>
                ) : (
                  // Lista de notas
                  notes.map(note => (
                    <div 
                      key={note.id} 
                      className={`${theme.cardBg} p-6 rounded-3xl border ${theme.border} shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between h-48`}
                    >
                      {/* Conteúdo da nota */}
                      <p className={`text-sm ${theme.textPrimary} font-medium line-clamp-4 leading-relaxed`}>
                        {note.content}
                      </p>
                      
                      {/* Ações da nota */}
                      <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100 dark:border-white/5">
                        <div className="flex gap-1">
                          {/* Converter para tarefa */}
                          <button 
                            onClick={() => transformNoteToTask(note)} 
                            title="Converter para Tarefa" 
                            className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all"
                          >
                            <ListOrdered size={16} />
                          </button>
                          {/* Converter para hábito */}
                          <button 
                            onClick={() => transformNoteToHabit(note)} 
                            title="Converter para Hábito" 
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            <Repeat size={16} />
                          </button>
                        </div>
                        {/* Excluir nota */}
                        <button 
                          onClick={() => deleteNote(note.id)} 
                          className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------
              VISUALIZAÇÃO: DASHBOARD (ESTATÍSTICAS)
              ------------------------------------------------------------------------ */}
          {view === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
              
              {/* Cards de estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Tarefas Ativas', val: tasks.filter(t => t.status !== TaskStatus.DONE).length, color: 'text-indigo-500', icon: ListOrdered },
                  { label: 'Total Hábitos', val: habits.length, color: 'text-emerald-500', icon: Repeat },
                  { label: 'Notas Rápidas', val: notes.length, color: 'text-amber-500', icon: StickyNote },
                  { label: 'Concluídas', val: tasks.filter(t => t.status === TaskStatus.DONE).length, color: 'text-rose-500', icon: CheckCircle }
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    className={`${theme.cardBg} p-8 rounded-[2.5rem] border ${theme.border} shadow-xl backdrop-blur-md group hover:scale-105 transition-transform`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl bg-slate-100 dark:bg-white/5 ${stat.color}`}>
                        <stat.icon size={24}/>
                      </div>
                    </div>
                    <p className={`text-4xl font-black ${theme.textPrimary}`}>{stat.val}</p>
                    <p className={`text-xs font-black uppercase tracking-widest ${theme.textSecondary} mt-2`}>{stat.label}</p>
                  </div>
                ))}
              </div>
              
              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                
                {/* Gráfico de pizza - Distribuição de status */}
                <div className={`${theme.cardBg} p-10 rounded-[3rem] border ${theme.border} h-[400px] shadow-xl`}>
                  <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textPrimary} mb-8`}>Status</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={statusDist} 
                        innerRadius={80} 
                        outerRadius={120} 
                        paddingAngle={10} 
                        dataKey="value"
                      >
                        {statusDist.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Gráfico de barras - Médias dos rankings */}
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

          {/* ------------------------------------------------------------------------
              VISUALIZAÇÃO: CONFIGURAÇÕES
              ------------------------------------------------------------------------ */}
          {view === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-fade-in">
              
              {/* Seção: Aparência */}
              <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                <div className={`p-8 border-b ${theme.border} flex items-center justify-between`}>
                  <div>
                    <h3 className={`text-xl font-black ${theme.textPrimary} tracking-tighter`}>Aparência</h3>
                    <p className={`text-xs ${theme.textSecondary} font-medium`}>Customize seu workspace.</p>
                  </div>
                  {/* Botão de modo claro/escuro */}
                  <button 
                    onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} 
                    className={`p-3 rounded-2xl shadow-inner transition-all ${
                      themeMode === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-900/50 text-indigo-400'
                    }`}
                  >
                    {themeMode === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  {/* Seletores de tema */}
                  <div className="grid grid-cols-2 gap-3">
                    {themesList.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => setThemeName(t.id)} 
                        className={`p-4 rounded-3xl border-2 transition-all flex flex-col gap-2 items-center group ${
                          themeName === t.id 
                            ? 'border-indigo-500 bg-indigo-500/5' 
                            : 'border-transparent bg-slate-100/50 dark:bg-white/5'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${t.color} shadow-md group-hover:scale-110 transition-transform`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.textPrimary}`}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Input para URL de fundo personalizado */}
                  <div className="space-y-2">
                    <label className={`block text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} ml-2`}>
                      Fundo Customizado (URL)
                    </label>
                    <input 
                      type="text" 
                      value={overrideBgUrl} 
                      onChange={e => setOverrideBgUrl(e.target.value)} 
                      placeholder="https://..."
                      className={`w-full p-4 rounded-2xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} 
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Google Calendar */}
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
                    // Botão de conexão
                    <button 
                      onClick={connectGCal} 
                      disabled={isSyncing}
                      className={`w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:brightness-110 transition-all disabled:opacity-50`}
                    >
                      {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <ArrowRightLeft size={18} />}
                      Conectar Google Calendar
                    </button>
                  ) : (
                    // Controles quando conectado
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20">
                        <CheckCircle size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Conta Conectada</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={syncToGCal} 
                          disabled={isSyncing} 
                          className={`flex items-center justify-center gap-2 p-4 rounded-2xl bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest shadow-md hover:scale-105 transition-all`}
                        >
                          {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Repeat size={14} />} 
                          Sincronizar Agora
                        </button>
                        <button 
                          onClick={() => setIsGCalConnected(false)} 
                          className={`flex items-center justify-center gap-2 p-4 rounded-2xl border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/5 transition-all`}
                        >
                          <X size={14} /> Desconectar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Seção: Notificações */}
              <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                <div className={`p-8 border-b ${theme.border} flex items-center justify-between`}>
                  <div>
                    <h3 className={`text-xl font-black ${theme.textPrimary} tracking-tighter`}>Notificações</h3>
                    <p className={`text-xs ${theme.textSecondary} font-medium`}>Lembretes de prazos críticos.</p>
                  </div>
                  <button 
                    onClick={requestNotificationPermission} 
                    className={`p-3 rounded-2xl transition-all ${
                      notificationsEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 dark:bg-white/5'
                    }`}
                  >
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

              {/* Seção: Cloud & Sync */}
              <div className={`${theme.cardBg} border ${theme.border} rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md`}>
                <div className={`p-8 border-b ${theme.border}`}>
                  <h3 className={`text-xl font-black ${theme.textPrimary} tracking-tighter`}>Cloud & Sync</h3>
                  <p className={`text-xs ${theme.textSecondary} font-medium`}>Backup e sincronia entre dispositivos.</p>
                </div>
                <div className="p-8 space-y-6">
                  {/* Botões de importação/exportação */}
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={exportData} 
                      className={`flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500/20 transition-all`}
                    >
                      <Download size={18} /> Exportar
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className={`flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all`}
                    >
                      <Upload size={18} /> Importar
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImport} 
                      className="hidden" 
                      accept=".json" 
                    />
                  </div>
                  
                  {/* Código de sincronização */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={generateSyncCode} 
                      className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 ${theme.textPrimary} font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all`}
                    >
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

      {/* ==========================================================================
          MODAL DE NOVA TAREFA
          ========================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
          <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            
            {/* Cabeçalho do modal */}
            <div className={`p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-transparent`}>
              <h3 className={`text-3xl font-black ${theme.textPrimary} tracking-tighter`}>Nova Missão</h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }} 
                className="hover:rotate-90 transition-transform"
              >
                <X size={32}/>
              </button>
            </div>
            
            {/* Formulário */}
            <div className="p-10 space-y-6">
              <input 
                type="text" 
                placeholder="Título..." 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-lg font-bold outline-none focus:ring-4 focus:ring-indigo-500/20`} 
              />
              
              <textarea 
                placeholder="Descrição..." 
                value={newDesc} 
                onChange={e => setNewDesc(e.target.value)} 
                className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} h-40 resize-none font-medium outline-none focus:ring-4 focus:ring-indigo-500/20`} 
              />
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-2">Vencimento</label>
                <input 
                  type="date" 
                  value={newDueDate} 
                  onChange={e => setNewDueDate(e.target.value)} 
                  className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} font-bold outline-none`} 
                />
              </div>
            </div>
            
            {/* Ações */}
            <div className="p-10 bg-slate-50 dark:bg-black/20 flex gap-4">
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }} 
                className={`flex-1 p-6 font-black uppercase text-xs tracking-widest ${theme.textSecondary}`}
              >
                Cancelar
              </button>
              <button 
                onClick={addTask} 
                className={`flex-[2] p-6 ${theme.accent} text-white font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2`}
              >
                INICIAR FLOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL DE NOVO HÁBITO
          ========================================================================== */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
          <div className={`relative ${theme.cardBg} w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
            
            {/* Cabeçalho */}
            <div className={`p-10 border-b ${theme.border} flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent`}>
              <h3 className={`text-3xl font-black ${theme.textPrimary} tracking-tighter`}>Novo Hábito</h3>
              <button 
                onClick={() => { setIsHabitModalOpen(false); setHabitTitle(''); }} 
                className="hover:rotate-90 transition-transform"
              >
                <X size={32}/>
              </button>
            </div>
            
            {/* Formulário */}
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} ml-2`}>Rotina</label>
                <input 
                  type="text" 
                  placeholder="ex: Meditação 10min..." 
                  value={habitTitle} 
                  onChange={e => setHabitTitle(e.target.value)} 
                  className={`w-full p-6 rounded-3xl border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-lg font-bold outline-none focus:ring-4 focus:ring-emerald-500/20`} 
                />
              </div>
              
              <div className="space-y-3">
                <label className={`block text-xs font-black uppercase tracking-widest ${theme.textSecondary} ml-2`}>Frequência</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {id: 'daily', label: 'Diário'}, 
                    {id: 'weekly', label: 'Semanal'}, 
                    {id: 'weekdays', label: 'Dias úteis'}, 
                    {id: 'weekend', label: 'Fim de semana'}
                  ].map(f => (
                    <button 
                      key={f.id} 
                      onClick={() => setHabitFreq(f.id as HabitFrequency)} 
                      className={`p-4 rounded-2xl border-2 text-xs font-black uppercase tracking-tighter transition-all ${
                        habitFreq === f.id 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-inner' 
                          : theme.border + ' ' + theme.textSecondary
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Ações */}
            <div className="p-10 bg-slate-50 dark:bg-black/20 flex gap-4">
              <button 
                onClick={() => { setIsHabitModalOpen(false); setHabitTitle(''); }} 
                className={`flex-1 p-6 font-black uppercase text-xs tracking-widest ${theme.textSecondary}`}
              >
                Cancelar
              </button>
              <button 
                onClick={addHabit} 
                className={`flex-[2] p-6 bg-emerald-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all`}
              >
                SALVAR HÁBITO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;