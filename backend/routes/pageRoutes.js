import express from 'express';
import { 
    getMainPage, getData, getTeamPage, getHomePage, getLoginPage, 
    getRegistrationPage, getServiceHomePage, getServiceLoginPage, getServiceRegisterPage,
    getForgotPasswordPage, checkAuthStatus, getWelcomePage, getSelectionPage 
} from '../controllers/pageController.js';

const router = express.Router();

// General Pages
router.get('/', getMainPage);
router.get('/index.html', getMainPage);
router.get('/data', getData);
router.get('/team', getTeamPage);
router.get('/homepage', getHomePage);
router.get('/loginpage', getLoginPage);
router.get('/registrationpage', getRegistrationPage);

// Service Pages
router.get('/servicehomepage', getServiceHomePage);
router.get('/servicelogin', getServiceLoginPage);
router.get('/serviceregister', getServiceRegisterPage);

// Forgot Password
router.get('/forgotPassword.html', getForgotPasswordPage);

// Onboarding Pages
router.get('/welcome.html', getWelcomePage);
router.get('/selection.html', getSelectionPage);

// Check Auth Status
router.get('/check-auth', checkAuthStatus);

export default router;
