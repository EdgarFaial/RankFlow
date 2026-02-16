
import { useState, useEffect, useCallback } from 'react';
import { mongoDB } from '../services/mongoDBService';
import { Task, Habit, Note, User } from '../types';

export const useMongoDB = (user: User | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMongoDB = async () => {
      if (!user?.email) return;
      try {
        setIsLoading(true);
        const connected = await mongoDB.connect(user.email);
        if (connected) {
          setIsInitialized(true);
          setError(null);
        } else {
          setIsInitialized(false);
          setError('Modo Local Ativo');
        }
      } catch (err) {
        setIsInitialized(false);
        setError('Persistência Local');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMongoDB();
  }, [user]);

  const loadTasks = useCallback(async (): Promise<Task[]> => {
    if (isInitialized && user?.email) {
      try {
        const cloudTasks = await mongoDB.getAllTasks(user.email);
        if (cloudTasks) return cloudTasks;
      } catch (err) {}
    }
    return JSON.parse(localStorage.getItem('rankflow_tasks') || '[]');
  }, [isInitialized, user]);

  const saveTasks = useCallback(async (tasks: Task[]) => {
    localStorage.setItem('rankflow_tasks', JSON.stringify(tasks));
    if (isInitialized && user?.email) {
      try { await mongoDB.saveTasks(tasks, user.email); } catch (err) {}
    }
  }, [isInitialized, user]);

  const loadHabits = useCallback(async (): Promise<Habit[]> => {
    if (isInitialized && user?.email) {
      try {
        const cloudHabits = await mongoDB.getAllHabits(user.email);
        if (cloudHabits) return cloudHabits;
      } catch (err) {}
    }
    return JSON.parse(localStorage.getItem('rankflow_habits') || '[]');
  }, [isInitialized, user]);

  const saveHabits = useCallback(async (habits: Habit[]) => {
    localStorage.setItem('rankflow_habits', JSON.stringify(habits));
    if (isInitialized && user?.email) {
      try { await mongoDB.saveHabits(habits, user.email); } catch (err) {}
    }
  }, [isInitialized, user]);

  const loadNotes = useCallback(async (): Promise<Note[]> => {
    if (isInitialized && user?.email) {
      try {
        const cloudNotes = await mongoDB.getAllNotes(user.email);
        if (cloudNotes) return cloudNotes;
      } catch (err) {}
    }
    return JSON.parse(localStorage.getItem('rankflow_notes') || '[]');
  }, [isInitialized, user]);

  const saveNotes = useCallback(async (notes: Note[]) => {
    localStorage.setItem('rankflow_notes', JSON.stringify(notes));
    if (isInitialized && user?.email) {
      try { await mongoDB.saveNotes(notes, user.email); } catch (err) {}
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
    isInitialized,
    loadTasks,
    saveTasks,
    loadHabits,
    saveHabits,
    loadNotes,
    saveNotes,
    saveSettings
  };
};
