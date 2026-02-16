
import clientPromise from './mongodb.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const client = await clientPromise;
      const db = client.db('rankflow');
      const users = db.collection('users');
      
      const { email, name, avatar, type } = req.body;

      if (type === 'google' || type === 'login') {
        let user = await users.findOne({ email });
        
        if (!user) {
          const newUser = {
            id: Math.random().toString(36).substr(2, 9),
            email,
            name,
            avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            createdAt: Date.now()
          };
          await users.insertOne(newUser);
          user = newUser;
        }

        return res.status(200).json({ user });
      }

      return res.status(400).json({ error: 'Tipo de login inválido' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
