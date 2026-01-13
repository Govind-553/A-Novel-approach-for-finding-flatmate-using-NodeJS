import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/mongoDB.js';
import cors from 'cors';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import http from 'http';
import { initSocket } from './utils/socketHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS Configuration
app.use(
    cors({
        origin: [
            'https://flatmate-node-backend.onrender.com',
            'https://flatmate-connect.vercel.app',
            'http://localhost:3000',
            'https://flatmate-python-backend.onrender.com'
        ],
        credentials: true,
    })
);

// Connect to Database
connectDB();

// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve Static Files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'node-backend',
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.use('/', pageRoutes);
app.use('/', userRoutes);
app.use('/', serviceRoutes);
app.use('/', paymentRoutes);
app.use('/', chatRoutes);
app.use('/', notificationRoutes);

// Start Server with Socket.io
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}/`);
});
