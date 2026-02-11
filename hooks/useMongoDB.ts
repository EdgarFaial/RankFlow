
import { useState, useEffect, useCallback } from 'react';
import { mongoDB } from '../services/mongoDBService';
import { Task, Habit, Note } from '../types';

export const useMongoDB = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMongoDB = async () => {
      try {
        setIsLoading(true);
        const connected = await mongoDB.connect();
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
  }, []);

  const loadTasks = useCallback(async (): Promise<Task[]> => {
    if (isInitialized) {
      try {
        const cloudTasks = await mongoDB.getAllTasks();
        if (cloudTasks) return cloudTasks;
      } catch (err) {}
    }
    return JSON.parse(localStorage.getItem('rankflow_tasks') || '[]');
  }, [isInitialized]);

  const saveTasks = useCallback(async (tasks: Task[]) => {
    localStorage.setItem('rankflow_tasks', JSON.stringify(tasks));
    if (isInitialized) {
      try { await mongoDB.saveTasks(tasks); } catch (err) {}
    }
  }, [isInitialized]);

  const loadHabits = useCallback(async (): Promise<Habit[]> => {
    if (isInitialized) {
      try {
        const cloudHabits = await mongoDB.getAllHabits();
        if (cloudHabits) return cloudHabits;
      } catch (err) {}
    }
    return JSON.parse(localStorage.getItem('rankflow_habits') || '[]');
  }, [isInitialized]);

  const saveHabits = useCallback(async (habits: Habit[]) => {
    localStorage.setItem('rankflow_habits', JSON.stringify(habits));
    if (isInitialized) {
      try { await mongoDB.saveHabits(habits); } catch (err) {}
    }
  }, [isInitialized]);

  const loadNotes = useCallback(async (): Promise<Note[]> => {
    if (isInitialized) {
      try {
        const cloudNotes = await mongoDB.getAllNotes();
        if (cloudNotes) return cloudNotes;
      } catch (err) {}
    }
    return JSON.parse(localStorage.getItem('rankflow_notes') || '[]');
  }, [isInitialized]);

  const saveNotes = useCallback(async (notes: Note[]) => {
    localStorage.setItem('rankflow_notes', JSON.stringify(notes));
    if (isInitialized) {
      try { await mongoDB.saveNotes(notes); } catch (err) {}
    }
  }, [isInitialized]);

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
