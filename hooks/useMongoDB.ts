
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
        await mongoDB.connect();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError('Atlas Data API indisponível. Usando localStorage.');
        console.warn('MongoDB Init: Usando persistência local.');
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMongoDB();
  }, []);

  const loadTasks = useCallback(async (): Promise<Task[]> => {
    if (!isInitialized) return JSON.parse(localStorage.getItem('rankflow_tasks') || '[]');
    try {
      return await mongoDB.getAllTasks();
    } catch (err) {
      return JSON.parse(localStorage.getItem('rankflow_tasks') || '[]');
    }
  }, [isInitialized]);

  const saveTasks = useCallback(async (tasks: Task[]) => {
    localStorage.setItem('rankflow_tasks', JSON.stringify(tasks));
    if (isInitialized) {
      try {
        await mongoDB.saveTasks(tasks);
      } catch (err) {
        console.error('Sync Error (Tasks):', err);
      }
    }
  }, [isInitialized]);

  const loadHabits = useCallback(async (): Promise<Habit[]> => {
    if (!isInitialized) return JSON.parse(localStorage.getItem('rankflow_habits') || '[]');
    try {
      return await mongoDB.getAllHabits();
    } catch (err) {
      return JSON.parse(localStorage.getItem('rankflow_habits') || '[]');
    }
  }, [isInitialized]);

  const saveHabits = useCallback(async (habits: Habit[]) => {
    localStorage.setItem('rankflow_habits', JSON.stringify(habits));
    if (isInitialized) {
      try {
        await mongoDB.saveHabits(habits);
      } catch (err) {
        console.error('Sync Error (Habits):', err);
      }
    }
  }, [isInitialized]);

  const loadNotes = useCallback(async (): Promise<Note[]> => {
    if (!isInitialized) return JSON.parse(localStorage.getItem('rankflow_notes') || '[]');
    try {
      return await mongoDB.getAllNotes();
    } catch (err) {
      return JSON.parse(localStorage.getItem('rankflow_notes') || '[]');
    }
  }, [isInitialized]);

  const saveNotes = useCallback(async (notes: Note[]) => {
    localStorage.setItem('rankflow_notes', JSON.stringify(notes));
    if (isInitialized) {
      try {
        await mongoDB.saveNotes(notes);
      } catch (err) {
        console.error('Sync Error (Notes):', err);
      }
    }
  }, [isInitialized]);

  const saveSettings = useCallback(async (settings: any) => {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(`rankflow_${key}`, JSON.stringify(value));
    });
    if (isInitialized) {
      try {
        await mongoDB.saveSettings(settings);
      } catch (err) {
        console.error('Sync Error (Settings):', err);
      }
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
