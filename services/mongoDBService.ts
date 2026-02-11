
// MongoDB Atlas Data API Configuration
const MONGODB_DATA_API_URL = "https://sa-east-1.aws.data.mongodb-api.com/app/data-vkvvj/endpoint/data/v1/action";
// NOTA: Esta chave parece ser uma senha de banco de dados. 
// A Data API requer uma 'API Key' gerada em App Services -> Data API no Atlas.
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

  private isConfigured(): boolean {
    // Verifica se a chave foi alterada do placeholder e tem um tamanho mínimo
    return MONGODB_API_KEY !== "SUA_API_KEY_AQUI" && MONGODB_API_KEY.length > 5;
  }

  private async fetchAction(action: string, collection: string, body: any) {
    if (!this.isConfigured() || !this.online) {
      throw new Error('OFFLINE');
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
      // Se falhar por rede (CORS ou sem internet), marca como offline para evitar novas tentativas pesadas
      if (error instanceof TypeError) {
        this.online = false;
      }
      throw error;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.isConfigured()) return false;
    
    try {
      // Tenta uma operação leve de leitura para testar a rota e o CORS
      await this.fetchAction('findOne', COLLECTIONS.SETTINGS, { filter: { _id: 'health_check' } });
      this.online = true;
      return true;
    } catch (e) {
      this.online = false;
      return false;
    }
  }

  // --- Operações Silenciosas ---
  
  async getAllTasks() {
    const res = await this.fetchAction('find', COLLECTIONS.TASKS, { filter: {} });
    return (res.documents || []).map((doc: any) => ({ 
      ...doc, 
      id: doc.id || doc._id?.toString() || Math.random().toString(36).substr(2, 9) 
    }));
  }

  async saveTasks(tasks: any[]) {
    await this.fetchAction('deleteMany', COLLECTIONS.TASKS, { filter: {} });
    if (tasks.length > 0) {
      const sanitized = tasks.map(({ id, ...rest }) => ({ ...rest, id }));
      await this.fetchAction('insertMany', COLLECTIONS.TASKS, { documents: sanitized });
    }
  }

  async getAllHabits() {
    const res = await this.fetchAction('find', COLLECTIONS.HABITS, { filter: {} });
    return (res.documents || []).map((doc: any) => ({ 
      ...doc, 
      id: doc.id || doc._id?.toString() || Math.random().toString(36).substr(2, 9) 
    }));
  }

  async saveHabits(habits: any[]) {
    await this.fetchAction('deleteMany', COLLECTIONS.HABITS, { filter: {} });
    if (habits.length > 0) {
      const sanitized = habits.map(({ id, ...rest }) => ({ ...rest, id }));
      await this.fetchAction('insertMany', COLLECTIONS.HABITS, { documents: sanitized });
    }
  }

  async getAllNotes() {
    const res = await this.fetchAction('find', COLLECTIONS.NOTES, { filter: {} });
    return (res.documents || []).map((doc: any) => ({ 
      ...doc, 
      id: doc.id || doc._id?.toString() || Math.random().toString(36).substr(2, 9) 
    }));
  }

  async saveNotes(notes: any[]) {
    await this.fetchAction('deleteMany', COLLECTIONS.NOTES, { filter: {} });
    if (notes.length > 0) {
      const sanitized = notes.map(({ id, ...rest }) => ({ ...rest, id }));
      await this.fetchAction('insertMany', COLLECTIONS.NOTES, { documents: sanitized });
    }
  }

  async getAllSettings() {
    const res = await this.fetchAction('findOne', COLLECTIONS.SETTINGS, { filter: { _id: 'user_settings' } });
    return res.document || null;
  }

  async saveSettings(settings: any) {
    await this.fetchAction('updateOne', COLLECTIONS.SETTINGS, {
      filter: { _id: 'user_settings' },
      update: { $set: { ...settings, updatedAt: new Date().toISOString() } },
      upsert: true
    });
  }
}

export const mongoDB = new MongoDBService();
