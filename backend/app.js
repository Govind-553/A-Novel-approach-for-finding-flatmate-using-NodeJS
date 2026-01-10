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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
    origin: ['https://flatmate-node-backend.onrender.com', 'https://flatmate-connect.vercel.app', 'http://localhost:3000', 'https://flatmate-python-backend.onrender.com'],
    credentials: true,
}));
// Connect to MongoDB
connectDB();

// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static Files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Routes
app.use('/', pageRoutes);      // Pages and Data
app.use('/', userRoutes);      // User API
app.use('/', serviceRoutes);   // Service API
app.use('/', paymentRoutes);   // Payment API
app.use('/', chatRoutes);
app.use('/', notificationRoutes);

// Start Server
import http from 'http';
import { initSocket } from './utils/socketHandler.js';

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}/`);
});
