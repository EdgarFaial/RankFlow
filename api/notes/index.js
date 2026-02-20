
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
    const collection = db.collection('notes');

    if (req.method === 'GET') {
      const documents = await collection.find({ userEmail }).toArray();
      return res.status(200).json({ documents });
    }

    if (req.method === 'POST') {
      const notes = Array.isArray(req.body) ? req.body : [];
      if (notes.length === 0) return res.status(200).json({ success: true });

      const bulkOps = notes.map(note => ({
        updateOne: {
          filter: { id: note.id, userEmail },
          update: { $set: { ...note, userEmail } },
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
