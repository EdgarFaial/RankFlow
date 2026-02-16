
import clientPromise from '../mongodb.js';

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = ['https://rank-flow-eta.vercel.app', 'http://localhost:3000', 'http://localhost:5173'];
  
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  else res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const client = await clientPromise;
    const db = client.db('rankflow');
    const collection = db.collection('notes');

    if (req.method === 'GET') {
      const docs = await collection.find({}).toArray();
      const mapped = docs.map(({_id, ...rest}) => ({...rest, id: rest.id || _id.toString()}));
      return res.status(200).json({ documents: mapped });
    }

    if (req.method === 'POST') {
      await collection.deleteMany({});
      const notes = Array.isArray(req.body) ? req.body : [];
      if (notes.length > 0) {
        const sanitized = notes.map(({ _id, ...rest }) => ({
          ...rest,
          id: rest.id || (Math.random().toString(36).substr(2, 9))
        }));
        await collection.insertMany(sanitized);
      }
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('NOTES_ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
}
