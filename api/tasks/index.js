
import clientPromise from '../mongodb.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const client = await clientPromise;
    const db = client.db('rankflow');
    const collection = db.collection('tasks');

    if (req.method === 'GET') {
      const documents = await collection.find({}).toArray();
      const mapped = documents.map(doc => {
        const { _id, ...rest } = doc;
        return { ...rest, id: rest.id || _id.toString() };
      });
      return res.status(200).json({ documents: mapped });
    }

    if (req.method === 'POST') {
      const tasks = Array.isArray(req.body) ? req.body : [];
      await collection.deleteMany({});
      if (tasks.length > 0) {
        const sanitized = tasks.map(({ _id, ...rest }) => ({
          ...rest,
          id: rest.id || (Math.random().toString(36).substr(2, 9))
        }));
        await collection.insertMany(sanitized);
      }
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('TASK_API_ERROR:', error);
    return res.status(500).json({ 
      error: 'SERVER_ERROR', 
      message: error.message,
      code: error.code || 'N/A',
      detail: 'Isso geralmente significa erro de senha na MONGODB_URI ou IP não liberado no Atlas (0.0.0.0/0).'
    });
  }
}
