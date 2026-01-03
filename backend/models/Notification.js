import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId, // Usually Student ID
        required: true
    },
    type: {
        type: String, // 'vacancy_alert'
        default: 'vacancy_alert'
    },
    payload: {
        type: Object, // Stores details like providerName, contact, chatId
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
