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
        if (userType === 'student') {
            query.studentId = userId;
            query.studentDeleted = { $ne: true }; // Hide if deleted by student
        } else {
            query.serviceId = userId;
            query.providerDeleted = { $ne: true }; // Hide if deleted by provider
        }

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

        const chat = await Chat.findById(chatId)
            .populate('studentId', 'fULL_name profile_pic')
            .populate('serviceId', 'business_Name profile_pic');

        if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

        // Determine clear time for the requester
        let clearTime = null;
        if (req.cookies.userType === 'student') {
            clearTime = chat.studentClearedAt;
        } else if (req.cookies.userType === 'provider') {
            clearTime = chat.providerClearedAt;
        }

        // Mark as read if user is identified
        if (userId) {
            await Message.updateMany(
                { chatId, sender: { $ne: req.cookies.userType }, isRead: false }, // Simplification: sender != myRole
                { isRead: true, readAt: new Date() }
            );
        }

        // Fetch messages newer than clearTime
        const msgQuery = { chatId };
        if (clearTime) {
            msgQuery.timestamp = { $gt: clearTime };
        }

        const messages = await Message.find(msgQuery).sort({ timestamp: 1 });
        
        let chatData = chat.toObject();
        
        // Process images for both
        if (chatData.studentId && chatData.studentId.profile_pic) {
            chatData.studentId.profile_pic = `data:image/jpeg;base64,${chatData.studentId.profile_pic.toString('base64')}`;
        }
        
        res.json({ success: true, messages, chat: chatData });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const clearChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userType = req.cookies.userType;
        
        const update = {};
        if (userType === 'student') update.studentClearedAt = new Date();
        else if (userType === 'provider') update.providerClearedAt = new Date();

        await Chat.findByIdAndUpdate(chatId, update);
        res.json({ success: true, message: 'Chat cleared (hidden for user)' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const endChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userType = req.cookies.userType;

        const update = {};
        if (userType === 'student') {
            update.studentDeleted = true;
        } 
        
        if (Object.keys(update).length > 0) {
             await Chat.findByIdAndUpdate(chatId, update);
        }
       
        res.json({ success: true, message: 'Chat session closed' });
   } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deleteChats = async (req, res) => {
    try {
        const { chatIds } = req.body;
        if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No chats selected' });
        }
        
        const userType = req.cookies.userType;
        const update = {};
        if (userType === 'student') update.studentDeleted = true;
        else if (userType === 'provider') update.providerDeleted = true;
        else return res.status(400).json({ success: false, message: 'Invalid User Type' });

        await Chat.updateMany(
            { _id: { $in: chatIds } },
            { $set: update }
        );

        res.json({ success: true, message: 'Selected chats deleted' });
    } catch (err) {
        console.error('Delete Chats Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
