
import { MongoClient } from 'mongodb';

let uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Erro: MONGODB_URI não definida no ambiente da Vercel.');
}

/**
 * Lógica de auto-correção:
 * Remove os caracteres < e > que costumam vir no exemplo do MongoDB Atlas 
 * e que os usuários as vezes esquecem de remover.
 */
if (uri.includes('<') || uri.includes('>')) {
  console.warn('RankFlow: Detectados caracteres < ou > na MONGODB_URI. Tentando limpar...');
  uri = uri.replace(/</g, '').replace(/>/g, '');
}

const options = {
  maxPoolSize: 1, // Mantém baixo para evitar estourar limites em serverless
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
