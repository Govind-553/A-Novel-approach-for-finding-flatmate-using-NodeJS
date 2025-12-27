import path from 'path';
import { fileURLToPath } from 'url';
import Service from '../models/Service.js';
import Student from '../models/Student.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.join(__dirname, '../../frontend');

export const getMainPage = (req, res) => res.sendFile(path.join(frontendDir, 'index.html'));

export const getData = async (req, res) => {
     try {
        const [services, students] = await Promise.all([
             Service.find({}).select('business_Name contact_number email service price_chart_link'),
             Student.find({}).select('fULL_name year branch contact_number email profile_pic github linkedin instagram portfolio')
        ]);

        const profiles = students.map(user => {
            const profilePicBase64 = user.profile_pic ? `data:image/jpeg;base64,${user.profile_pic.toString('base64')}` : null;
            return {
                fULL_name: user.fULL_name,
                year: user.year,
                branch: user.branch,
                contact_number: user.contact_number,
                email: user.email,
                github: user.github,
                linkedin: user.linkedin,
                instagram: user.instagram,
                portfolio: user.portfolio,
                profile_pic: profilePicBase64
            };
        });
        
        res.status(200).json({ services, profiles });
    } catch (err) {
        res.status(500).send('Internal Server Error');
    }
};

export const getTeamPage = (req, res) => res.sendFile(path.join(frontendDir, 'teamProfile.html'));
export const getHomePage = (req, res) => res.sendFile(path.join(frontendDir, 'studentHome.html')); 
export const getLoginPage = (req, res) => res.sendFile(path.join(frontendDir, 'studentLogin.html'));
export const getRegistrationPage = (req, res) => res.sendFile(path.join(frontendDir, 'studentRegister.html'));

export const getServiceHomePage = (req, res) => res.sendFile(path.join(frontendDir, 'serviceHome.html'));
export const getServiceLoginPage = (req, res) => res.sendFile(path.join(frontendDir, 'serviceLogin.html'));
export const getServiceRegisterPage = (req, res) => res.sendFile(path.join(frontendDir, 'serviceRegister.html'));
export const getForgotPasswordPage = (req, res) => res.sendFile(path.join(frontendDir, 'forgotPassword.html'));
