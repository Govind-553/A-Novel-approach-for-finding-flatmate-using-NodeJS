import { WebSocketServer } from 'ws';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

let wss;
const clients = new Map(); // Map userId -> Set of connections

export const initSocket = (server) => {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        console.log('New WebSocket Connection');

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                if (data.type === 'REGISTER') {
                    
                    let userId = null;
                    console.log('Registering socket. Headers cookie:', req.headers.cookie);
                    
                    // Attempt to get user from cookie if not provided
                    if(req.headers.cookie) {
                         const cookies = parse(req.headers.cookie);
                         if(cookies.token) {
                             try {
                                 const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
                                 userId = decoded.id; 
                                 console.log('Socket token verified. UserId:', userId);
                             } catch(e) {
                                 console.error('Socket token verification failed:', e.message);
                             }
                         } else {
                             console.log('No token in cookie');
                         }
                    } else if(data.userId) { // Fallback if passed directly
                        userId = data.userId;
                    }

                    if (userId) {
                        ws.userId = userId;
                        if (!clients.has(userId)) {
                            clients.set(userId, new Set());
                        }
                        clients.get(userId).add(ws);
                        console.log(`User registered: ${userId}`);
                    } else {
                        console.log('Socket registration failed: No userId found');
                    }
                } else if (data.type === 'MESSAGE') {
                    if (!data.chatId || !data.sender) {
                        console.error('Socket Message Error: Missing chatId or sender', data);
                        return;
                    }

                    const { chatId, content, sender, timestamp } = data;
                    
                    // Save to DB
                    const newMessage = new Message({
                        chatId,
                        sender: sender, // 'student' or 'provider'
                        content,
                        timestamp: new Date()
                    });
                    await newMessage.save();

                    // Find Recipient
                    const chat = await Chat.findById(chatId);
                    if(chat) {

                        let recipientId;
                        if(sender === 'student') recipientId = chat.serviceId.toString();
                        else recipientId = chat.studentId.toString();

                        sendToUser(recipientId, {
                            type: 'MESSAGE',
                            payload: newMessage
                        });
                    }
                }
            } catch (err) {
                console.error('Socket error:', err);
            }
        });

        ws.on('close', () => {
            if (ws.userId && clients.has(ws.userId)) {
                clients.get(ws.userId).delete(ws);
                if (clients.get(ws.userId).size === 0) {
                    clients.delete(ws.userId);
                }
            }
        });
    });
};

export const sendToUser = (userId, data) => {
    if (clients.has(userId)) {
        clients.get(userId).forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(JSON.stringify(data));
            }
        });
    }
};

// Broadcast to students matching criteria (User IDs must be collected beforehand)
export const broadcastToStudents = (studentIds, data) => {
    studentIds.forEach(id => {
        sendToUser(id, data);
    });
};
