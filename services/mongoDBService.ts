
/**
 * MongoDB Atlas Data API Service
 * 
 * NOTA DE SEGURANÇA: A chave abaixo parece ser uma senha. 
 * Recomenda-se usar uma 'API Key' gerada em App Services -> Data API.
 * 
 * RESOLUÇÃO DE CORS (Vercel):
 * No painel do MongoDB Atlas, acesse App Services -> Data API -> Settings 
 * e adicione 'https://quest-rank.vercel.app' em 'Allowed Origins'.
 */

const MONGODB_DATA_API_URL = "https://sa-east-1.aws.data.mongodb-api.com/app/data-vkvvj/endpoint/data/v1/action";
const MONGODB_API_KEY: string = "o7ePZQ5IUmvnTjLg"; 
const CLUSTER_NAME = "EdgarFaial";
const DATABASE_NAME = "rankflow";

const COLLECTIONS = {
  TASKS: 'tasks',
  HABITS: 'habits',
  NOTES: 'notes',
  SETTINGS: 'settings'
};

class MongoDBService {
  private online: boolean = true;
  private networkErrorDetected: boolean = false;

  private isConfigured(): boolean {
    return MONGODB_API_KEY !== "SUA_API_KEY_AQUI" && MONGODB_API_KEY.length > 5;
  }

  private async fetchAction(action: string, collection: string, body: any) {
    if (!this.isConfigured() || !this.online || this.networkErrorDetected) {
      throw new Error('OFFLINE_OR_CORS');
    }

    try {
      const response = await fetch(`${MONGODB_DATA_API_URL}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': MONGODB_API_KEY,
        },
        body: JSON.stringify({
          dataSource: CLUSTER_NAME,
          database: DATABASE_NAME,
          collection: collection,
          ...body
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Se falhar por erro de tipo (TypeError), geralmente é CORS ou rede bloqueada
      if (error instanceof TypeError) {
        this.networkErrorDetected = true;
        this.online = false;
      }
      throw error;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    
    try {
      // Teste silencioso de conexão (Health Check)
      await this.fetchAction('findOne', COLLECTIONS.SETTINGS, { filter: { _id: 'health_check' } });
      this.online = true;
      this.networkErrorDetected = false;
      return true;
    } catch (e) {
      this.online = false;
      return false;
    }
  }

  // --- Métodos de sincronia com tratamento silencioso de erros ---

  async getAllTasks() {
    try {
      const res = await this.fetchAction('find', COLLECTIONS.TASKS, { filter: {} });
      return (res.documents || []).map((doc: any) => ({ 
        ...doc, 
        id: doc.id || doc._id?.toString() || Math.random().toString(36).substr(2, 9) 
      }));
    } catch { return null; }
  }

  async saveTasks(tasks: any[]) {
    try {
      await this.fetchAction('deleteMany', COLLECTIONS.TASKS, { filter: {} });
      if (tasks.length > 0) {
        const sanitized = tasks.map(({ id, ...rest }) => ({ ...rest, id }));
        await this.fetchAction('insertMany', COLLECTIONS.TASKS, { documents: sanitized });
      }
    } catch { /* Fail silently */ }
  }

  async getAllHabits() {
    try {
      const res = await this.fetchAction('find', COLLECTIONS.HABITS, { filter: {} });
      return (res.documents || []).map((doc: any) => ({ 
        ...doc, 
        id: doc.id || doc._id?.toString() || Math.random().toString(36).substr(2, 9) 
      }));
    } catch { return null; }
  }

  async saveHabits(habits: any[]) {
    try {
      await this.fetchAction('deleteMany', COLLECTIONS.HABITS, { filter: {} });
      if (habits.length > 0) {
        const sanitized = habits.map(({ id, ...rest }) => ({ ...rest, id }));
        await this.fetchAction('insertMany', COLLECTIONS.HABITS, { documents: sanitized });
      }
    } catch { /* Fail silently */ }
  }

  async getAllNotes() {
    try {
      const res = await this.fetchAction('find', COLLECTIONS.NOTES, { filter: {} });
      return (res.documents || []).map((doc: any) => ({ 
        ...doc, 
        id: doc.id || doc._id?.toString() || Math.random().toString(36).substr(2, 9) 
      }));
    } catch { return null; }
  }

  async saveNotes(notes: any[]) {
    try {
      await this.fetchAction('deleteMany', COLLECTIONS.NOTES, { filter: {} });
      if (notes.length > 0) {
        const sanitized = notes.map(({ id, ...rest }) => ({ ...rest, id }));
        await this.fetchAction('insertMany', COLLECTIONS.NOTES, { documents: sanitized });
      }
    } catch { /* Fail silently */ }
  }

  async getAllSettings() {
    try {
      const res = await this.fetchAction('findOne', COLLECTIONS.SETTINGS, { filter: { _id: 'user_settings' } });
      return res.document || null;
    } catch { return null; }
  }

  async saveSettings(settings: any) {
    try {
      await this.fetchAction('updateOne', COLLECTIONS.SETTINGS, {
        filter: { _id: 'user_settings' },
        update: { $set: { ...settings, updatedAt: new Date().toISOString() } },
        upsert: true
      });
    } catch { /* Fail silently */ }
  }
}

export const mongoDB = new MongoDBService();
