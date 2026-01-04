import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    status: {
        type: String, // 'active', 'ended', 'archived'
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Visibility Flags
    studentDeleted: { type: Boolean, default: false },
    providerDeleted: { type: Boolean, default: false },
    studentClearedAt: { type: Date, default: null },
    providerClearedAt: { type: Date, default: null }
});

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
