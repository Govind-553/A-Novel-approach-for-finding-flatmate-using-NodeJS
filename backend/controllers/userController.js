import Student from '../models/Student.js';
import Service from '../models/Service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.join(__dirname, '../../frontend');

// Login
export const loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;
        const student = await Student.findOne({ email: email.trim(), password: password.trim() });
        
        if (student) {
            res.cookie('email', email, { httpOnly: true });
            res.cookie('userType', 'student', { httpOnly: true });
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Register
export const registerStudent = async (req, res) => {
    try {
        const { fullName, email, password, address, contactNumber, Year, Branch, AboutYourself, foodType, roomType, pricingValue } = req.body;
        
        const amenities = Array.isArray(req.body.amenities) ? req.body.amenities.join(', ') : req.body.amenities || '';
        const landmark = Array.isArray(req.body.landmark) ? req.body.landmark.join(', ') : req.body.landmark || '';

        let profilePicData = null;
        if (req.file) {
             profilePicData = fs.readFileSync(req.file.path);
            
        }

        const newStudent = new Student({
            fULL_name: fullName,
            email,
            password,
            address,
            contact_number: contactNumber,
            year: Year,
            branch: Branch,
            about_yourself: AboutYourself,
            profile_pic: profilePicData,
            food_type: foodType,
            room_type: roomType,
            amenities,
            pricing_value: pricingValue,
            landmark
        });

        await newStudent.save();
        
        // Clean up uploaded file if we just wanted the buffer
        if (req.file) fs.unlink(req.file.path, () => {});

        res.status(200).send('Student registered successfully');

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).send('Error registering student');
    }
};

// Update Profile Image
export const updateProfileImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    try {
        
        const email = req.body.email || req.cookies.email; // Fallback to cookie if not in body
        if(!email) return res.status(400).json({success: false, message: "Email not found"});

        const imageData = fs.readFileSync(req.file.path);

        await Student.findOneAndUpdate({ email }, { profile_pic: imageData });
        
        // Cleanup temp file
        fs.unlink(req.file.path, () => {});
        
        res.send('Profile updated successfully.');
    } catch (error) {
        console.error('Update Image Error:', error);
        res.status(500).send('Error updating profile image');
    }
};

// Save Profile (Handles both image and text updates from /saveProfile)
export const saveProfileFields = async (req, res) => {
    const email = req.body.email || req.cookies.email;
    if (!email) return res.status(400).send('Email missing');

    // Handle Image Upload
    if (req.file) {
        try {
            const imageData = fs.readFileSync(req.file.path);
            await Student.findOneAndUpdate({ email }, { profile_pic: imageData });
            fs.unlink(req.file.path, () => {});
            return res.send('Profile updated successfully.');
        } catch (error) {
            console.error('Update Image Error:', error);
            return res.status(500).send('Error updating profile picture');
        }
    }

    // Handle Text Fields Update
    try {
        await Student.findOneAndUpdate({ email }, {
            fULL_name: req.body.fullName,
            password: req.body.password,
            address: req.body.address,
            contact_number: req.body.contactNumber,
            year: req.body.Year,
            branch: req.body.Branch,
            about_yourself: req.body.AboutYourself
        });
        res.send('Profile updated successfully.');
    } catch (error) {
         res.status(500).send('Error updating profile: ' + error.message);
    }
};

// Serve Profile Page
export const getProfilePage = async (req, res) => {
    const email = req.query.email || req.cookies.email;
    if (!email) return res.status(400).send('Missing email parameter');

    try {
        const user = await Student.findOne({ email });
        if (user) {
            const profilePagePath = path.join(frontendDir, 'studentProfile.html');
            fs.readFile(profilePagePath, 'utf8', (err, content) => {
                if (err) return res.status(500).send('Error loading profile page');

                let modifiedContent = content.replace('{{userData}}', JSON.stringify(user));
                
                if (user.profile_pic) {
                     const base64Image = user.profile_pic.toString('base64');
                     const src = `data:image/jpeg;base64,${base64Image}`; 
                     modifiedContent = modifiedContent.replace('{{profileImage}}', src);
                } else {
                     modifiedContent = modifiedContent.replace('{{profileImage}}', '/img/User.png');
                }
                
                res.status(200).send(modifiedContent);
            });
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching profile data');
    }
};

// Recommendations
export const getServiceRecommendations = async (req, res) => {
    const studentEmail = req.cookies.email;
    if (!studentEmail) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        const student = await Student.findOne({ email: studentEmail });
        if (!student) return res.status(500).json({ success: false, message: 'Error fetching cluster' });

        const cluster = student.cluster; 
        
        const [foodServices, laundryServices, brokerServices] = await Promise.all([
             Service.find({ service: 'food', cluster }).select('business_Name email contact_number food_type price_chart_link'),
             Service.find({ service: 'laundry', cluster }).select('business_Name email contact_number laundry_service price_chart_link'),
             Service.find({ service: 'broker', cluster }).select('business_Name email contact_number room_type amenities pricing_value landmark price_chart_link')
        ]);

        res.json({ success: true, foodServices, laundryServices, brokerServices });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error fetching recommendations' });
    }
};

export const getRoommateRecommendations = async (req, res) => {
    const email = req.cookies.email;
    if (!email) return res.status(401).json({ success: false });

    try {
        const student = await Student.findOne({ email });
        if (!student) return res.status(500).json({ success: false });

        const matchCluster = student.match_cluster;
        const roommates = await Student.find({ match_cluster: matchCluster, email: { $ne: email } })
            .select('fULL_name email contact_number food_type room_type amenities profile_pic');

        const formattedRoommates = roommates.map(user => {
             let profilePicData = 'default.jpg'; 
             if (user.profile_pic) {
                 profilePicData = `data:image/jpeg;base64,${user.profile_pic.toString('base64')}`;
             }
             return {
                 fULL_name: user.fULL_name, 
                 email: user.email,
                 contact_number: user.contact_number,
                 food_type: user.food_type,
                 room_type: user.room_type,
                 amenities: user.amenities,
                 profile_pic: profilePicData
             };
        });

        res.json({ success: true, roommates: formattedRoommates });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
