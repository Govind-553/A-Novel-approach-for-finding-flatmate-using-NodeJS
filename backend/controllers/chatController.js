import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { verifyToken } from '../utils/tokenUtils.js';

// Get all chats for a user
export const getChats = async (req, res) => {
    try {
        let { userId, userType } = req.query; 

        // Auto-detect from token if missing
        if (!userId && req.cookies.token) {
            try {
                const decoded = verifyToken(req.cookies.token);
                userId = decoded.id;
                if (!userType) userType = req.cookies.userType || decoded.userType; 
            } catch (e) {
                console.error('Token verification failed', e);
            }
        }

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        let query = {};
        if (userType === 'student') query.studentId = userId;
        else query.serviceId = userId;

        const chats = await Chat.find(query)
            .populate('studentId', 'fULL_name email contact_number profile_pic')
            .populate('serviceId', 'business_Name email contact_number')
            .sort({ createdAt: -1 });

        // Process chats to handle profile images
        const processedChats = chats.map(chat => {
            const chatObj = chat.toObject();
            if (chatObj.studentId && chatObj.studentId.profile_pic) {
                const base64Image = chatObj.studentId.profile_pic.toString('base64');
                chatObj.studentId.profile_pic = `data:image/jpeg;base64,${base64Image}`;
            }
            return chatObj;
        });

        res.json({ success: true, chats: processedChats });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get messages for a specific chat
export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        let userId;

        // Try to get user from token to mark messages as read
        if (req.cookies.token) {
            try {
                const decoded = verifyToken(req.cookies.token);
                userId = decoded.id;
            } catch (e) {}
        }
        
        // Mark as read if user is identified
        if (userId) {
            await Message.updateMany(
                { chatId, sender: { $ne: req.cookies.userType }, isRead: false }, // Simplification: sender != myRole
                { isRead: true, readAt: new Date() }
            );
        }

        const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
        const chat = await Chat.findById(chatId)
            .populate('studentId', 'fULL_name profile_pic')
            .populate('serviceId', 'business_Name profile_pic');

        let chatData = chat.toObject();
        
        // Process images for both
        if (chatData.studentId && chatData.studentId.profile_pic) {
            chatData.studentId.profile_pic = `data:image/jpeg;base64,${chatData.studentId.profile_pic.toString('base64')}`;
        }
        // Service might not have profile_pic in this schema? Let's check model if needed, but assuming standard fallback if missing.
        
        res.json({ success: true, messages, chat: chatData });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const clearChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        await Message.deleteMany({ chatId });
        res.json({ success: true, message: 'Chat cleared' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const endChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        await Chat.findByIdAndUpdate(chatId, { status: 'ended' });
        res.json({ success: true, message: 'Chat ended' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
