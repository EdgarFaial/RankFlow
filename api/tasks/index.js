
import clientPromise from '../mongodb.js';

export default async function handler(req, res) {
  const allowedOrigins = ['https://rank-flow-eta.vercel.app', 'http://localhost:3000'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://rank-flow-eta.vercel.app');
  }
  
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
        return {
          ...rest,
          id: rest.id || _id.toString()
        };
      });
      return res.status(200).json({ documents: mapped });
    }

    if (req.method === 'POST') {
      const tasks = Array.isArray(req.body) ? req.body : [];
      await collection.deleteMany({});
      if (tasks.length > 0) {
        const sanitized = tasks.map(({ _id, ...rest }) => ({
          ...rest,
          // Garante que o campo id exista para ser usado como referência
          id: rest.id || (Math.random().toString(36).substr(2, 9))
        }));
        await collection.insertMany(sanitized);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('SERVER_ERROR_TASKS:', error);
    return res.status(500).json({ 
      error: 'Erro Interno do Servidor', 
      message: error.message,
      check: 'Verifique se a senha na URI está correta e se o IP 0.0.0.0/0 está liberado no Atlas.' 
    });
  }
}
