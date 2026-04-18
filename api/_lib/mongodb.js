import { MongoClient, ServerApiVersion } from 'mongodb';

let client = null;
let clientPromise = null;

function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI ortam değişkeni tanımlı değil. Vercel Dashboard > Settings > Environment Variables kısmından ayarlayın.');
  }

  if (!clientPromise) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
      connectTimeoutMS: 10000,
      socketTimeoutMS: 15000,
    });

    clientPromise = client.connect().catch((err) => {
      // Bağlantı başarısız olursa cache temizle — sonraki denemede tekrar bağlansın
      console.error('❌ MongoDB bağlantı hatası:', err.message);
      client = null;
      clientPromise = null;
      throw err;
    });
  }

  return clientPromise;
}

export async function getDb() {
  const connectedClient = await getClientPromise();
  return connectedClient.db('kademedia');
}

export function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
}

export default getClientPromise;

