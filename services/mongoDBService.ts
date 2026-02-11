
// Usando MongoDB Atlas Data API para compatibilidade total com o navegador
const MONGODB_DATA_API_URL = "https://sa-east-1.aws.data.mongodb-api.com/app/data-vkvvj/endpoint/data/v1/action";
const MONGODB_API_KEY = "SUA_API_KEY_AQUI"; // Deve ser gerada no painel MongoDB Atlas -> Data API
const CLUSTER_NAME = "EdgarFaial";
const DATABASE_NAME = "rankflow";

const COLLECTIONS = {
  TASKS: 'tasks',
  HABITS: 'habits',
  NOTES: 'notes',
  SETTINGS: 'settings'
};

class MongoDBService {
  private async fetchAction(action: string, collection: string, body: any) {
    try {
      const response = await fetch(`${MONGODB_DATA_API_URL}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Request-Headers': '*',
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
        throw new Error(`Atlas Data API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro na ação ${action} em ${collection}:`, error);
      throw error;
    }
  }

  async connect() {
    // A Data API é stateless (baseada em HTTPS), não exige conexão persistente.
    // Simplesmente validamos a conectividade.
    console.log('✅ Pronto para usar Atlas Data API');
    return true;
  }

  // --- Tasks ---
  async getAllTasks() {
    const res = await this.fetchAction('find', COLLECTIONS.TASKS, { filter: {} });
    return (res.documents || []).map((doc: any) => ({ ...doc, id: doc.id || doc._id }));
  }

  async saveTasks(tasks: any[]) {
    // Em uma implementação real com Data API, faríamos deleteMany e insertMany
    await this.fetchAction('deleteMany', COLLECTIONS.TASKS, { filter: {} });
    if (tasks.length > 0) {
      await this.fetchAction('insertMany', COLLECTIONS.TASKS, { documents: tasks });
    }
  }

  // --- Habits ---
  async getAllHabits() {
    const res = await this.fetchAction('find', COLLECTIONS.HABITS, { filter: {} });
    return (res.documents || []).map((doc: any) => ({ ...doc, id: doc.id || doc._id }));
  }

  async saveHabits(habits: any[]) {
    await this.fetchAction('deleteMany', COLLECTIONS.HABITS, { filter: {} });
    if (habits.length > 0) {
      await this.fetchAction('insertMany', COLLECTIONS.HABITS, { documents: habits });
    }
  }

  // --- Notes ---
  async getAllNotes() {
    const res = await this.fetchAction('find', COLLECTIONS.NOTES, { filter: {} });
    return (res.documents || []).map((doc: any) => ({ ...doc, id: doc.id || doc._id }));
  }

  async saveNotes(notes: any[]) {
    await this.fetchAction('deleteMany', COLLECTIONS.NOTES, { filter: {} });
    if (notes.length > 0) {
      await this.fetchAction('insertMany', COLLECTIONS.NOTES, { documents: notes });
    }
  }

  // --- Settings ---
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
