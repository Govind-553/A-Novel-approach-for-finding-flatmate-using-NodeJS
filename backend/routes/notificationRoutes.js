import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

import { verifyToken } from '../utils/tokenUtils.js';

    // Get unread notification count
    router.get('/api/notifications/unread-count', async (req, res) => {
        try {
            let userId = req.query.userId;
            
            // Try to get from token if not in query
            if (!userId && req.cookies.token) {
                try {
                    const decoded = verifyToken(req.cookies.token);
                    userId = decoded.id;
                } catch (e) {
                }
            }
    
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            
            const count = await Notification.countDocuments({ recipientId: userId, isRead: false });
    
            res.json({ success: true, count });
        } catch (err) {
            console.error('Error fetching unread count:', err);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    });

    // Mark all notifications as read
    router.post('/api/notifications/mark-read', async (req, res) => {
        try {
            let userId = req.body.userId;
            
             // Try to get from token if not in body
             if (!userId && req.cookies.token) {
                try {
                    const decoded = verifyToken(req.cookies.token);
                    userId = decoded.id;
                } catch (e) {
                }
            }

            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
            res.json({ success: true, message: 'Notifications marked as read' });

        } catch (err) {
            console.error('Error marking notifications as read:', err);
             res.status(500).json({ success: false, message: 'Server Error' });
        }
    });

    router.get('/api/notifications', async (req, res) => {
    try {
        let userId = req.query.userId;
        
        // Try to get from token if not in query
        if (!userId && req.cookies.token) {
            try {
                const decoded = verifyToken(req.cookies.token);
                userId = decoded.id;
            } catch (e) {
                console.error('Token verification failed', e);
            }
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const notifications = await Notification.find({ recipientId: userId }) 
                                                .sort({ createdAt: -1 });

        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Delete Notification
router.delete('/api/notifications/:id', async (req, res) => {
    try {
        const result = await Notification.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, message: 'Notification deleted' });
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

export default router;
