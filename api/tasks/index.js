
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
    const collection = db.collection('tasks');

    if (req.method === 'GET') {
      const documents = await collection.find({ userEmail }).toArray();
      return res.status(200).json({ documents });
    }

    if (req.method === 'POST') {
      const tasks = Array.isArray(req.body) ? req.body : [];
      if (tasks.length === 0) return res.status(200).json({ success: true, message: 'No info to update' });

      // Em vez de deleteMany, usamos um merge/upsert seguro para evitar sobrescritas destrutivas
      const bulkOps = tasks.map(task => ({
        updateOne: {
          filter: { id: task.id, userEmail },
          update: { $set: { ...task, userEmail } },
          upsert: true
        }
      }));

      // Também removemos apenas se explicitamente não estiverem na lista recebida E se a lista não for parcial
      // Mas para satisfazer "nada pode sobrescrever nada", vamos apenas garantir o UPSERT.
      // Se um item foi removido, o cliente deve gerenciar o estado final ou enviarmos um flag 'deleted'.
      // Como o objetivo é EVITAR deleção acidental entre dispositivos, mantemos todos e o cliente filtra por ID.
      
      await collection.bulkWrite(bulkOps);
      
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
