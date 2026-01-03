import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import jwt from 'jsonwebtoken';

// Get all chats for a user
export const getChats = async (req, res) => {
    try {
        let { userId, userType } = req.query; 

        // Auto-detect from token if missing
        if (!userId && req.cookies.token) {
            try {
                const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
                userId = decoded.id;
                if (!userType) userType = req.cookies.userType || decoded.role; 
            } catch (e) {
                console.error('Token verification failed', e);
            }
        }

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        
        let query = {};
        if (userType === 'student') query.studentId = userId;
        else query.serviceId = userId;

        const chats = await Chat.find(query)
            .populate('studentId', 'name email contactNumber')
            .populate('serviceId', 'business_Name email contact_number')
            .sort({ createdAt: -1 });

        res.json({ success: true, chats });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get messages for a specific chat
export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
        res.json({ success: true, messages });
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
