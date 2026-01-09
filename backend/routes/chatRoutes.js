import express from 'express';
import { getChats, getMessages, clearChat, endChat, deleteChats } from '../controllers/chatController.js';

const router = express.Router();

router.get('/api/chats', getChats);
router.get('/api/chats/:chatId/messages', getMessages);
router.post('/api/chats/:chatId/clear', clearChat);
router.post('/api/chats/:chatId/end', endChat);
router.post('/api/chats/delete', deleteChats);

export default router;
