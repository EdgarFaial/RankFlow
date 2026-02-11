import { MongoClient, Db, ServerApiVersion } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://EdgarFaial:o7ePZQ5IUmvnTjLg@edgarfaial.lvom6kh.mongodb.net/?appName=EdgarFaial';
const DB_NAME = 'rankflow';
const COLLECTIONS = {
  TASKS: 'tasks',
  HABITS: 'habits',
  NOTES: 'notes',
  SETTINGS: 'settings'
};

class MongoDBService {
  private client: MongoClient;
  private db: Db | null = null;
  private isConnected = false;
  private connectionPromise: Promise<Db> | null = null;

  constructor() {
    this.client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  }

  async connect(): Promise<Db> {
    if (this.db && this.isConnected) {
      return this.db;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        await this.client.connect();
        this.db = this.client.db(DB_NAME);
        this.isConnected = true;
        console.log('✅ Conectado ao MongoDB com sucesso!');
        return this.db;
      } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        this.isConnected = false;
        this.connectionPromise = null;
        throw error;
      }
    })();

    return this.connectionPromise;
  }

  async getCollection(collectionName: string) {
    const db = await this.connect();
    return db.collection(collectionName);
  }

  // --- Tasks ---
  async getAllTasks() {
    try {
      const collection = await this.getCollection(COLLECTIONS.TASKS);
      const tasks = await collection.find({}).toArray();
      return tasks.map(task => ({ ...task, id: task._id.toString() }));
    } catch (error) {
      console.error('Erro ao buscar tasks:', error);
      return [];
    }
  }

  async saveTasks(tasks: any[]) {
    try {
      const collection = await this.getCollection(COLLECTIONS.TASKS);
      await collection.deleteMany({});
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map(({ id, ...rest }) => rest);
        await collection.insertMany(tasksToInsert);
      }
      console.log('✅ Tasks salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar tasks:', error);
      throw error;
    }
  }

  // --- Habits ---
  async getAllHabits() {
    try {
      const collection = await this.getCollection(COLLECTIONS.HABITS);
      const habits = await collection.find({}).toArray();
      return habits.map(habit => ({ ...habit, id: habit._id.toString() }));
    } catch (error) {
      console.error('Erro ao buscar habits:', error);
      return [];
    }
  }

  async saveHabits(habits: any[]) {
    try {
      const collection = await this.getCollection(COLLECTIONS.HABITS);
      await collection.deleteMany({});
      if (habits.length > 0) {
        const habitsToInsert = habits.map(({ id, ...rest }) => rest);
        await collection.insertMany(habitsToInsert);
      }
      console.log('✅ Habits salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar habits:', error);
      throw error;
    }
  }

  // --- Notes ---
  async getAllNotes() {
    try {
      const collection = await this.getCollection(COLLECTIONS.NOTES);
      const notes = await collection.find({}).toArray();
      return notes.map(note => ({ ...note, id: note._id.toString() }));
    } catch (error) {
      console.error('Erro ao buscar notes:', error);
      return [];
    }
  }

  async saveNotes(notes: any[]) {
    try {
      const collection = await this.getCollection(COLLECTIONS.NOTES);
      await collection.deleteMany({});
      if (notes.length > 0) {
        const notesToInsert = notes.map(({ id, ...rest }) => rest);
        await collection.insertMany(notesToInsert);
      }
      console.log('✅ Notes salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar notes:', error);
      throw error;
    }
  }

  // --- Settings ---
  async getAllSettings() {
    try {
      const collection = await this.getCollection(COLLECTIONS.SETTINGS);
      const settings = await collection.findOne({ _id: 'user_settings' });
      return settings || null;
    } catch (error) {
      console.error('Erro ao buscar settings:', error);
      return null;
    }
  }

  async saveSettings(settings: any) {
    try {
      const collection = await this.getCollection(COLLECTIONS.SETTINGS);
      await collection.updateOne(
        { _id: 'user_settings' },
        { $set: { ...settings, updatedAt: new Date() } },
        { upsert: true }
      );
      console.log('✅ Settings salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar settings:', error);
      throw error;
    }
  }

  // --- Sync Status ---
  async getSyncStatus() {
    try {
      const [tasks, habits, notes, settings] = await Promise.all([
        this.getAllTasks(),
        this.getAllHabits(),
        this.getAllNotes(),
        this.getAllSettings()
      ]);
      return { tasks, habits, notes, settings };
    } catch (error) {
      console.error('Erro ao buscar status de sync:', error);
      throw error;
    }
  }
}

// Singleton instance
export const mongoDB = new MongoDBService();