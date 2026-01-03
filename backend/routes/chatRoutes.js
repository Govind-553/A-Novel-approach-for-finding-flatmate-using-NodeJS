import express from 'express';
import { getChats, getMessages, clearChat, endChat } from '../controllers/chatController.js';

const router = express.Router();

router.get('/api/chats', getChats);
router.get('/api/chats/:chatId/messages', getMessages);
router.post('/api/chats/:chatId/clear', clearChat);
router.post('/api/chats/:chatId/end', endChat);

export default router;
