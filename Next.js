// First, create a new Next.js project structure:

// pages/api/chat.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    
    const client = await MongoClient.connect(uri);
    const db = client.db('chat-app');
    cachedDb = db;
    return db;
}

export default async function handler(req, res) {
    if (!uri) {
        return res.status(500).json({ error: 'Missing MONGODB_URI environment variable' });
    }

    try {
        const db = await connectToDatabase();
        const chatCollection = db.collection('messages');

        switch (req.method) {
            case 'GET':
                const messages = await chatCollection
                    .find({})
                    .sort({ timestamp: 1 })
                    .toArray();
                res.json(messages);
                break;

            case 'POST':
                const { sender, text } = req.body;
                const newMessage = {
                    sender,
                    text,
                    timestamp: new Date()
                };
                await chatCollection.insertOne(newMessage);
                res.json(newMessage);
                break;

            default:
                res.setHeader('Allow', ['GET', 'POST']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database operation failed' });
    }
}

// pages/api/users.js
export default async function handler(req, res) {
    if (!uri) {
        return res.status(500).json({ error: 'Missing MONGODB_URI environment variable' });
    }

    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        switch (req.method) {
            case 'GET':
                const users = await usersCollection.find({}).toArray();
                res.json(users);
                break;

            case 'POST':
                const { username } = req.body;
                const existingUser = await usersCollection.findOne({ username });
                
                if (existingUser) {
                    res.status(400).json({ error: 'Username already taken' });
                    return;
                }

                await usersCollection.insertOne({
                    username,
                    joinedAt: new Date()
                });
                res.json({ username, success: true });
                break;

            case 'DELETE':
                const { username: userToDelete } = req.body;
                await usersCollection.deleteOne({ username: userToDelete });
                res.json({ success: true });
                break;

            default:
                res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database operation failed' });
    }
}