
import clientPromise from '../mongodb.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const client = await clientPromise;
    const db = client.db('rankflow');
    const collection = db.collection('notes');

    if (req.method === 'GET') {
      const documents = await collection.find({}).toArray();
      const mapped = documents.map(doc => ({ ...doc, id: doc.id || doc._id.toString() }));
      return res.status(200).json({ documents: mapped });
    }

    if (req.method === 'POST') {
      await collection.deleteMany({});
      if (req.body && req.body.length > 0) {
        await collection.insertMany(req.body);
      }
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
