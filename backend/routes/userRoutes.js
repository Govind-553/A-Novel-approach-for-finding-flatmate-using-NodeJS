import express from 'express';
import { 
    loginStudent, registerStudent, updateProfileImage, saveProfileFields, 
    getProfilePage, getServiceRecommendations, getRoommateRecommendations 
} from '../controllers/userController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/login', loginStudent);
// Register handles profile image upload
router.post('/register-user', upload.single('profileImage'), registerStudent);
// Update image handles profilePic upload
router.post('/updateProfileImage', upload.single('profilePic'), updateProfileImage); 


// Use 'profileImage' for multer middleware for register-user.
router.post('/saveProfile', upload.single('profileImage'), saveProfileFields); 
router.post('/saveProfileFields', upload.none(), saveProfileFields); 

// Student Profile Page
router.get('/studentprofile', getProfilePage);

export default router;
