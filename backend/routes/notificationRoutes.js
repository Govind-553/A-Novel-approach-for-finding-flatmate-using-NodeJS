import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

import jwt from 'jsonwebtoken';

router.get('/api/notifications', async (req, res) => {
    try {
        let userId = req.query.userId;
        
        // Try to get from token if not in query
        if (!userId && req.cookies.token) {
            try {
                const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
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

export default router;
