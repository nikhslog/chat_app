// lib/mongodb.js
import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri);
    clientPromise = client.connect();
}

export async function connectToDatabase() {
    try {
        const client = await clientPromise;
        const db = client.db('chat-app');
        
        // Create collections if they don't exist
        if (!(await db.listCollections({ name: 'messages' }).hasNext())) {
            await db.createCollection('messages');
        }
        if (!(await db.listCollections({ name: 'users' }).hasNext())) {
            await db.createCollection('users');
        }

        return db;
    } catch (error) {
        console.error('Failed to connect to database:', error);
        throw error;
    }
}

// Optional: Create indexes for better performance
export async function createIndexes() {
    try {
        const db = await connectToDatabase();
        
        await db.collection('messages').createIndex({ timestamp: 1 });
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        
        console.log('Indexes created successfully');
    } catch (error) {
        console.error('Failed to create indexes:', error);
        throw error;
    }
}