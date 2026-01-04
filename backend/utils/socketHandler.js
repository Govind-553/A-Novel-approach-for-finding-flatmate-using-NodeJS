import { WebSocketServer } from 'ws';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { parse } from 'cookie';
import { verifyToken } from '../utils/tokenUtils.js';

let wss;
const clients = new Map(); // Map userId -> Set of connections
const activeUsers = new Map(); // Map chatId -> Set of userIds

export const initSocket = (server) => {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        console.log('New WebSocket Connection');

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                if (data.type === 'REGISTER') {
                    
                    let userId = null;
                    // Attempt to get user from cookie if not provided
                    if(req.headers.cookie) {
                         const cookies = parse(req.headers.cookie);
                         if(cookies.token) {
                             try {
                                 const decoded = verifyToken(cookies.token);
                                 userId = decoded.id; 
                                 ws.userType = decoded.userType;
                             } catch(e) { console.error('Socket token verification failed:', e.message); }
                         }
                    } else if(data.userId) { 
                        userId = data.userId;
                    }

                    if (userId) {
                        ws.userId = userId;
                        // Track connection for direct messaging
                        if (!clients.has(userId)) clients.set(userId, new Set());
                        clients.get(userId).add(ws);

                        // Track active users in chat room for read receipts
                        if (data.chatId) {
                            ws.chatId = data.chatId;
                            if (!activeUsers.has(data.chatId)) activeUsers.set(data.chatId, new Set());
                            activeUsers.get(data.chatId).add(userId);

                            // Mark messages as read since user just joined/opened this chat
                            try {
                                await Message.updateMany(
                                    { chatId: data.chatId, sender: { $ne: ws.userType }, isRead: false },
                                    { isRead: true, readAt: new Date() }
                                );
                                // Notify others in this chat that messages are read
                                wss.clients.forEach(client => {
                                    if (client !== ws && client.readyState === 1 && client.chatId === data.chatId) {
                                        client.send(JSON.stringify({ type: 'MESSAGES_READ', chatId: data.chatId }));
                                    }
                                });
                            } catch (e) { console.error("Error marking read:", e); }
                        }
                        console.log(`User registered: ${userId}`);
                    } else {
                        console.log('Socket registration failed: No userId found');
                    }
                } else if (data.type === 'MESSAGE') {
                    const { chatId, content, sender } = data;
                    if (!chatId || !sender) {
                        console.error('Socket Message Error: Missing chatId or sender', data);
                        return;
                    }

                    // Check if recipient is active in this room
                    let isRead = false;
                    const roomUsers = activeUsers.get(chatId);
                    if (roomUsers && roomUsers.size > 1) { 
                         isRead = true;
                    }

                    const newMessage = new Message({ 
                        chatId, 
                        sender, 
                        content,
                        isRead,
                        readAt: isRead ? new Date() : null
                    });
                    
                    await newMessage.save();

                    // Reactivate chat for both if it was deleted/hidden
                    await Chat.findByIdAndUpdate(chatId, {
                        studentDeleted: false,
                        providerDeleted: false
                    });
                    
                    const payload = {
                        content,
                        sender,
                        timestamp: newMessage.timestamp,
                        isRead: newMessage.isRead,
                        readAt: newMessage.readAt
                    };

                    // Broadcast to everyone in this chat
                    wss.clients.forEach(client => {
                        if (client.readyState === 1 && client.chatId === chatId) {
                            client.send(JSON.stringify({ type: 'MESSAGE', payload }));
                        }
                    });
                } else if (data.type === 'DELETE_MESSAGE') {
                    const { messageId, chatId } = data;
                    try {
                        const msg = await Message.findById(messageId);
                        if (msg && msg.sender === ws.userType) {
                            await Message.findByIdAndDelete(messageId);
                            
                            // Broadcast deletion
                            wss.clients.forEach(client => {
                                if (client.readyState === 1 && client.chatId === chatId) {
                                    client.send(JSON.stringify({ type: 'MESSAGE_DELETED', messageId }));
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Error deleting message:', e);
                    }
                }
            } catch (err) {
                console.error('Socket error:', err);
            }
        });

        ws.on('close', () => {
            if (ws.userId && clients.has(ws.userId)) {
                clients.get(ws.userId).delete(ws);
                if (clients.get(ws.userId).size === 0) clients.delete(ws.userId);
            }
            if (ws.chatId && ws.userId && activeUsers.has(ws.chatId)) {
                activeUsers.get(ws.chatId).delete(ws.userId);
                if (activeUsers.get(ws.chatId).size === 0) activeUsers.delete(ws.chatId);
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
