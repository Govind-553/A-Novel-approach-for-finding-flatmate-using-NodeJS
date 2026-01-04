import { verifyToken } from '../utils/tokenUtils.js';

// Protect Routes
export const protect = async (req, res, next) => {
    let token;

    if (req.cookies.token) {
        token = req.cookies.token;
    }
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    try {
        const decoded = verifyToken(token);
        
        req.user = decoded; // { id, email, userType }
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};
