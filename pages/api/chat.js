// pages/api/chat.js

import clientPromise from '../../lib/mongodb'
export default async function handler(req, res) {
    try {
        const db = await connectToDatabase();
        const chatCollection = db.collection('messages');

        switch (req.method) {
            case 'GET':
                const messages = await chatCollection
                    .find({})
                    .sort({ timestamp: 1 })
                    .limit(100)  // Limit to last 100 messages
                    .toArray();
                return res.json(messages);

            case 'POST':
                const { sender, text } = req.body;
                if (!sender || !text) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                const newMessage = {
                    sender,
                    text,
                    timestamp: new Date()
                };

                await chatCollection.insertOne(newMessage);
                return res.json(newMessage);

            default:
                res.setHeader('Allow', ['GET', 'POST']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database operation failed' });
    }
}