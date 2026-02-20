
import clientPromise from '../mongodb.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-email');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const userEmail = req.headers['x-user-email'];
  if (!userEmail) return res.status(401).json({ error: 'USUARIO_NAO_IDENTIFICADO' });

  try {
    const client = await clientPromise;
    const db = client.db('rankflow');
    const collection = db.collection('habits');

    if (req.method === 'GET') {
      const documents = await collection.find({ userEmail }).toArray();
      return res.status(200).json({ documents });
    }

    if (req.method === 'POST') {
      const habits = Array.isArray(req.body) ? req.body : [];
      if (habits.length === 0) return res.status(200).json({ success: true });

      const bulkOps = habits.map(habit => ({
        updateOne: {
          filter: { id: habit.id, userEmail },
          update: { $set: { ...habit, userEmail } },
          upsert: true
        }
      }));

      await collection.bulkWrite(bulkOps);
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
