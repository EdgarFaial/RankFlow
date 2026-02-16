
import { Task, Habit, Note } from '../types';

class MongoDBService {
  private online: boolean = true;

  private async fetchApi(endpoint: string, method: string = 'GET', body?: any, userEmail?: string) {
    if (!userEmail) throw new Error("Usuário não identificado");

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
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

  async connect(userEmail: string): Promise<boolean> {
    try {
      await this.fetchApi('tasks', 'GET', undefined, userEmail);
      return true;
    } catch (e) {
      return false;
    }
  }

  async getAllTasks(userEmail: string): Promise<Task[] | null> {
    try {
      const res = await this.fetchApi('tasks', 'GET', undefined, userEmail);
      return res.documents || [];
    } catch { 
      return null; 
    }
  }

  async saveTasks(tasks: Task[], userEmail: string) {
    try {
      await this.fetchApi('tasks', 'POST', tasks, userEmail);
    } catch { }
  }

  async getAllHabits(userEmail: string): Promise<Habit[] | null> {
    try {
      const res = await this.fetchApi('habits', 'GET', undefined, userEmail);
      return res.documents || [];
    } catch { return null; }
  }

  async saveHabits(habits: Habit[], userEmail: string) {
    try {
      await this.fetchApi('habits', 'POST', habits, userEmail);
    } catch { }
  }

  async getAllNotes(userEmail: string): Promise<Note[] | null> {
    try {
      const res = await this.fetchApi('notes', 'GET', undefined, userEmail);
      return res.documents || [];
    } catch { return null; }
  }

  async saveNotes(notes: Note[], userEmail: string) {
    try {
      await this.fetchApi('notes', 'POST', notes, userEmail);
    } catch { }
  }

  async saveSettings(settings: any) {
    console.debug("Configurações locais salvas.", settings);
  }
}

export const mongoDB = new MongoDBService();
