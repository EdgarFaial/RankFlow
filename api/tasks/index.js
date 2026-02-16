
import clientPromise from '../mongodb.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await clientPromise;
    const db = client.db('rankflow');
    const collection = db.collection('tasks');

    if (req.method === 'GET') {
      const documents = await collection.find({}).toArray();
      // Converte _id para id para compatibilidade com o frontend
      const mapped = documents.map(doc => ({
        ...doc,
        id: doc.id || doc._id.toString()
      }));
      return res.status(200).json({ documents: mapped });
    }

    if (req.method === 'POST') {
      const tasks = req.body;
      // Operação atômica: remove tudo e insere os novos (como solicitado pelo fluxo atual)
      await collection.deleteMany({});
      if (tasks && tasks.length > 0) {
        // Removemos o campo id para deixar o MongoDB gerenciar o _id se necessário, 
        // ou mantemos o id customizado no corpo do documento
        await collection.insertMany(tasks);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
