
import { useState, useEffect, useCallback } from 'react';
import { mongoDB } from '../services/mongoDBService';
import { Task, Habit, Note, User } from '../types';

export const useMongoDB = (user: User | null) => {
  const [isLoading, setIsLoading] = useState(false); // Inicia como false para não travar se não houver user
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMongoDB = async () => {
      // Se não houver usuário ou for convidado, não tenta conexão cloud
      if (!user?.email || user?.isGuest) {
        setIsInitialized(false);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const connected = await mongoDB.connect(user.email);
        if (connected) {
          setIsInitialized(true);
          setError(null);
        } else {
          setIsInitialized(false);
          setError('Modo Offline: Usando armazenamento local');
        }
      } catch (err) {
        setIsInitialized(false);
        setError('Conexão falhou: Dados salvos localmente');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMongoDB();
  }, [user]);

  const loadTasks = useCallback(async (): Promise<Task[]> => {
    const localData = JSON.parse(localStorage.getItem('rankflow_tasks') || '[]');
    if (isInitialized && user?.email) {
      try {
        const cloudTasks = await mongoDB.getAllTasks(user.email);
        if (cloudTasks) return cloudTasks;
      } catch (err) {
        console.warn("Falha ao carregar tarefas da nuvem, usando local.");
      }
    }
    return localData;
  }, [isInitialized, user]);

  const saveTasks = useCallback(async (tasks: Task[]) => {
    // Salva sempre localmente primeiro (Offline-first)
    localStorage.setItem('rankflow_tasks', JSON.stringify(tasks));
    if (isInitialized && user?.email) {
      try { 
        await mongoDB.saveTasks(tasks, user.email); 
      } catch (err) {
        console.warn("Falha ao sincronizar tarefas com a nuvem.");
      }
    }
  }, [isInitialized, user]);

  const loadHabits = useCallback(async (): Promise<Habit[]> => {
    const localData = JSON.parse(localStorage.getItem('rankflow_habits') || '[]');
    if (isInitialized && user?.email) {
      try {
        const cloudHabits = await mongoDB.getAllHabits(user.email);
        if (cloudHabits) return cloudHabits;
      } catch (err) {
        console.warn("Falha ao carregar hábitos da nuvem, usando local.");
      }
    }
    return localData;
  }, [isInitialized, user]);

  const saveHabits = useCallback(async (habits: Habit[]) => {
    localStorage.setItem('rankflow_habits', JSON.stringify(habits));
    if (isInitialized && user?.email) {
      try { 
        await mongoDB.saveHabits(habits, user.email); 
      } catch (err) {
        console.warn("Falha ao sincronizar hábitos com a nuvem.");
      }
    }
  }, [isInitialized, user]);

  const loadNotes = useCallback(async (): Promise<Note[]> => {
    const localData = JSON.parse(localStorage.getItem('rankflow_notes') || '[]');
    if (isInitialized && user?.email) {
      try {
        const cloudNotes = await mongoDB.getAllNotes(user.email);
        if (cloudNotes) return cloudNotes;
      } catch (err) {
        console.warn("Falha ao carregar notas da nuvem, usando local.");
      }
    }
    return localData;
  }, [isInitialized, user]);

  const saveNotes = useCallback(async (notes: Note[]) => {
    localStorage.setItem('rankflow_notes', JSON.stringify(notes));
    if (isInitialized && user?.email) {
      try { 
        await mongoDB.saveNotes(notes, user.email); 
      } catch (err) {
        console.warn("Falha ao sincronizar notas com a nuvem.");
      }
    }
  }, [isInitialized, user]);

  const saveSettings = useCallback(async (settings: any) => {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(`rankflow_${key}`, typeof value === 'string' ? value : JSON.stringify(value));
    });
    if (isInitialized) {
      try { await mongoDB.saveSettings(settings); } catch (err) {}
    }
  }, [isInitialized]);

  return {
    isLoading,
    error,
    isInitialized, // Indica se a sincronização cloud está ativa
    loadTasks,
    saveTasks,
    loadHabits,
    saveHabits,
    loadNotes,
    saveNotes,
    saveSettings
  };
};
