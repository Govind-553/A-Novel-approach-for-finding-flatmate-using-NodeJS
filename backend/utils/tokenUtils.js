import jwt from 'jsonwebtoken';

export const generateToken = (id, email, userType) => {
    return jwt.sign({ id, email, userType }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
