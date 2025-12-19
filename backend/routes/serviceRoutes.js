import express from 'express';
import { 
    loginService, registerServiceSession, updateServiceProfile, getServiceProfile 
} from '../controllers/serviceController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/login-service', loginService);
router.post('/register', upload.none(), registerServiceSession); // No file in first step, but use multer for parsing body
router.post('/profile-update', upload.none(), updateServiceProfile); 
router.get('/serviceprofile', getServiceProfile);

export default router;
