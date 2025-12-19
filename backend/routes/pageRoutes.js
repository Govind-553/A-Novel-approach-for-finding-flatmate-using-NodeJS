import express from 'express';
import { 
    getMainPage, getData, getTeamPage, getHomePage, getLoginPage, 
    getRegistrationPage, getServiceHomePage, getServiceLoginPage, getServiceRegisterPage 
} from '../controllers/pageController.js';

const router = express.Router();

// General Pages
router.get('/', getMainPage);
router.get('/data', getData);
router.get('/team', getTeamPage);
router.get('/homepage', getHomePage);
router.get('/loginpage', getLoginPage);
router.get('/registrationpage', getRegistrationPage);

// Service Pages
router.get('/servicehomepage', getServiceHomePage);
router.get('/servicelogin', getServiceLoginPage);
router.get('/serviceregister', getServiceRegisterPage);

export default router;
