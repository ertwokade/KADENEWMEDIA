import { MongoClient } from 'mongodb';

let client = null;
let clientPromise = null;

function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined. Please set it in Vercel Environment Variables.');
  }

  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDb() {
  const connectedClient = await getClientPromise();
  return connectedClient.db('kademedia');
}

export default getClientPromise;
