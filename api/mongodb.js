
import { MongoClient } from 'mongodb';

const options = {
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

function getSafeUri() {
  let uri = process.env.MONGODB_URI;
  if (!uri) return null;
  // Limpeza agressiva de espaços e placeholders
  return uri.trim().replace(/<|>/g, '');
}

const uri = getSafeUri();

if (!uri) {
  // Em vez de dar throw, criamos uma promise que rejeita para que o handler trate
  clientPromise = Promise.reject(new Error('MONGODB_URI_MISSING: Verifique as variáveis de ambiente na Vercel.'));
} else {
  try {
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
  } catch (e) {
    clientPromise = Promise.reject(e);
  }
}

export default clientPromise;
