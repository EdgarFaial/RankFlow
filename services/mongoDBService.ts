
/**
 * MongoDB Service atualizado para usar Serverless Functions (Backend na Vercel)
 * Isso resolve definitivamente os problemas de CORS.
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
        throw new Error(`API_ERROR_${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro na API (${endpoint}):`, error);
      this.online = false;
      throw error;
    }
  }

  async connect(): Promise<boolean> {
    try {
      // Tenta um GET simples em tasks para verificar a saúde da API/Conexão
      await this.fetchApi('tasks');
      this.online = true;
      return true;
    } catch (e) {
      this.online = false;
      return false;
    }
  }

  async getAllTasks(): Promise<Task[] | null> {
    try {
      const res = await this.fetchApi('tasks');
      return res.documents || [];
    } catch (e) { 
      return null; 
    }
  }

  async saveTasks(tasks: Task[]) {
    if (!this.online) return;
    try {
      // Remove campos indesejados antes de enviar se necessário
      const sanitized = tasks.map(({ lastNotified, ...rest }) => ({ ...rest }));
      await this.fetchApi('tasks', 'POST', sanitized);
    } catch (e) { 
      console.error("Erro ao salvar tarefas:", e);
    }
  }

  async getAllHabits(): Promise<Habit[] | null> {
    try {
      const res = await this.fetchApi('habits');
      return res.documents || [];
    } catch { return null; }
  }

  async saveHabits(habits: Habit[]) {
    if (!this.online) return;
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
    if (!this.online) return;
    try {
      await this.fetchApi('notes', 'POST', notes);
    } catch { }
  }

  async saveSettings(settings: any) {
    // Para simplificar, as configurações podem ser salvas em uma coleção dedicada via endpoint genérico ou específico
    // Por enquanto, as configurações principais já estão sendo persistidas no localStorage via App.tsx
    console.log("Sincronizando configurações com a nuvem...", settings);
  }
}

export const mongoDB = new MongoDBService();
