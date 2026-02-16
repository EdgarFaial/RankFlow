
/**
 * MongoDB Service atualizado para usar Serverless Functions (Backend na Vercel)
 * Centraliza o tratamento de dados no backend para evitar problemas de CORS e Driver.
 */

import { Task, Habit, Note } from '../types';

class MongoDBService {
  private online: boolean = true;

  private async fetchApi(endpoint: string, method: string = 'GET', body?: any) {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API_ERROR_${response.status}`);
      }

      this.online = true;
      return await response.json();
    } catch (error) {
      console.warn(`Erro na API (${endpoint}):`, error);
      this.online = false;
      throw error;
    }
  }

  async connect(): Promise<boolean> {
    try {
      await this.fetchApi('tasks');
      return true;
    } catch (e) {
      return false;
    }
  }

  async getAllTasks(): Promise<Task[] | null> {
    try {
      const res = await this.fetchApi('tasks');
      return res.documents || [];
    } catch { 
      return null; 
    }
  }

  async saveTasks(tasks: Task[]) {
    try {
      await this.fetchApi('tasks', 'POST', tasks);
    } catch { }
  }

  async getAllHabits(): Promise<Habit[] | null> {
    try {
      const res = await this.fetchApi('habits');
      return res.documents || [];
    } catch { return null; }
  }

  async saveHabits(habits: Habit[]) {
    try {
      await this.fetchApi('habits', 'POST', habits);
    } catch { }
  }

  async getAllNotes(): Promise<Note[] | null> {
    try {
      const res = await this.fetchApi('notes');
      return res.documents || [];
    } catch { return null; }
  }

  async saveNotes(notes: Note[]) {
    try {
      await this.fetchApi('notes', 'POST', notes);
    } catch { }
  }

  async saveSettings(settings: any) {
    // Sincronização de preferências pode ser implementada aqui
    console.debug("Configurações locais prontas para nuvem.", settings);
  }
}

export const mongoDB = new MongoDBService();
