import Student from '../models/Student.js';
import Service from '../models/Service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateToken } from '../utils/tokenUtils.js';
import { hashPassword, comparePassword } from '../utils/passwordUtils.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.join(__dirname, '../../frontend');

// Login
export const loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;
        const student = await Student.findOne({ email: email.trim() });
        
        if (!student) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }
        
        let isMatch = false;
        // Handle legacy and hashed passwords
        if (student.password.startsWith('$2b$') || student.password.startsWith('$2a$')) {
            isMatch = await comparePassword(password.trim(), student.password);
        } else {
            isMatch = student.password === password.trim();
            if (isMatch) {
                student.password = await hashPassword(password.trim());
                await student.save();
            }
        }

        if (isMatch) {
            // Generate JWT
            const token = generateToken(student._id, student.email, 'student');
            
            res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'None', secure: true });
            res.cookie('email', email, { httpOnly: true, sameSite: 'None', secure: true });
            res.cookie('userType', 'student', { httpOnly: false, sameSite: 'None', secure: true });

            res.json({ success: true, token });
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
        const { fullName, email, password, address, contactNumber, gender, Year, Branch, AboutYourself, foodType, roomType, pricingValue } = req.body;
        
        const amenities = Array.isArray(req.body.amenities) ? req.body.amenities.join(', ') : req.body.amenities || '';
        const landmark = Array.isArray(req.body.landmark) ? req.body.landmark.join(', ') : req.body.landmark || '';

        let profilePicData = null;
        if (req.file) {
             profilePicData = fs.readFileSync(req.file.path);
        }

        const hashedPassword = await hashPassword(password);

        const newStudent = new Student({
            fULL_name: fullName,
            email,
            password: hashedPassword,
            address,
            contact_number: contactNumber,
            gender,
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

        const savedStudent = await newStudent.save();
        
        // Auto-Login
        const token = generateToken(savedStudent._id, savedStudent.email, 'student');
        res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'None', secure: true });
        res.cookie('email', email, { httpOnly: true, sameSite: 'None', secure: true });
        res.cookie('userType', 'student', { httpOnly: false, sameSite: 'None', secure: true });

        if (req.file) fs.unlink(req.file.path, () => {});

        res.status(200).json({ success: true, message: 'Student registered successfully' });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).send('Error registering student');
    }
};

// Verify Email
export const verifyStudentEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const student = await Student.findOne({ email: email.trim() });
        if (student) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Email not found' });
        }
    } catch (error) {
         res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Reset Password
export const resetStudentPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const hashed = await hashPassword(newPassword.trim());
        await Student.findOneAndUpdate({ email: email.trim() }, { password: hashed });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


export const updateProfileImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    try {
        const email = req.body.email || req.cookies.email;
        if(!email) return res.status(400).json({success: false, message: "Email not found"});

        const imageData = fs.readFileSync(req.file.path);
        await Student.findOneAndUpdate({ email }, { profile_pic: imageData });
        fs.unlink(req.file.path, () => {});
        res.send('Profile updated successfully.');
    } catch (error) {
        console.error('Update Image Error:', error);
        res.status(500).send('Error updating profile image');
    }
};

export const saveProfileFields = async (req, res) => {
    const email = req.body.email || req.cookies.email;
    if (!email) return res.status(400).send('Email missing');
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
    try {
        const updateData = {
            fULL_name: req.body.fullName,
            address: req.body.address,
            contact_number: req.body.contactNumber,
            gender: req.body.gender,
            year: req.body.Year,
            branch: req.body.Branch,
            about_yourself: req.body.AboutYourself,
            github: req.body.github,
            linkedin: req.body.linkedin,
            instagram: req.body.instagram,
            portfolio: req.body.portfolio,
            food_type: req.body.foodType,
            room_type: (req.body.room_type || req.body.roomType) ? (Array.isArray(req.body.room_type || req.body.roomType) ? (req.body.room_type || req.body.roomType).join(',') : (req.body.room_type || req.body.roomType)) : undefined,
            amenities: req.body.amenities ? (Array.isArray(req.body.amenities) ? req.body.amenities.join(',') : req.body.amenities) : undefined,
            pricing_value: req.body.pricingValue,
            landmark: req.body.landmark ? (Array.isArray(req.body.landmark) ? req.body.landmark.join(',') : req.body.landmark) : undefined
        };
        if (req.body.password && req.body.password.trim() !== '') {
             updateData.password = await hashPassword(req.body.password.trim());
        }

        await Student.findOneAndUpdate({ email }, updateData);

        // Trigger Clustering
        try {
            await axios.post('https://flatmate-python-backend.onrender.com/cluster/students?sync=true');
        } catch (clusterErr) {
            console.error("Clustering Error:", clusterErr.message);
        }

        res.send('Profile updated successfully.');
    } catch (error) {
         res.status(500).send('Error updating profile: ' + error.message);
    }
};

export const getProfilePage = async (req, res) => {
    const email = req.query.email || req.cookies.email;
    if (!email) return res.status(400).send('Missing email parameter');
    try {
        const user = await Student.findOne({ email });
        if (user) {
            const profilePagePath = path.join(frontendDir, 'studentProfile.html');
            fs.readFile(profilePagePath, 'utf8', (err, content) => {
                if (err) return res.status(500).send('Error loading profile page');
                
                // Convert to plain object to modify properties safely
                const userObj = user.toObject();

                // FIX: Check original Mongoose document `user.profile_pic` for buffer content
                if (user.profile_pic) {
                    const base64Image = user.profile_pic.toString('base64');
                    userObj.profile_pic = `data:image/jpeg;base64,${base64Image}`;
                    console.log("[getProfilePage] Profile Pic processed successfully");
                } else {
                    userObj.profile_pic = null;
                }

                if (req.query.format === 'json') {
                    return res.json({ success: true, userData: userObj });
                }

                let modifiedContent = content.replace('{{userData}}', JSON.stringify(userObj));
                modifiedContent = modifiedContent.replace('{{profileImage}}', userObj.profile_pic || '/img/User.png');
                
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



export const getServiceRecommendations = async (req, res) => {
    const studentEmail = req.cookies.email;
    if (!studentEmail) return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const student = await Student.findOne({ email: studentEmail });
        if (!student) return res.status(500).json({ success: false, message: 'Student not found' });
        
        // Proxy to FastAPI
        const response = await axios.get(`https://flatmate-python-backend.onrender.com/recommend/services/${student._id}`);
        const data = response.data;
        
        res.json({ 
            success: true, 
            foodServices: data.Food || [], 
            laundryServices: data.Laundry || [], 
            brokerServices: data.Broker || [] 
        });
    } catch (err) {
        console.error("FastAPI Service Error:", err.message);
        res.status(500).json({ success: false, message: 'Error fetching recommendations from microservice' });
    }
};

export const getRoommateRecommendations = async (req, res) => {
    const email = req.cookies.email;
    if (!email) return res.status(401).json({ success: false });
    try {
        const student = await Student.findOne({ email });
        if (!student) return res.status(500).json({ success: false, message: "Student not found" });

        // Proxy to FastAPI
        const response = await axios.get(`https://flatmate-python-backend.onrender.com/recommend/roommates/${student._id}`);
        const data = response.data;

        // map matches to frontend format (if needed, but FastAPI returns clean list)
        // Frontend expects: { success: true, roommates: [...] }
        // Each roommate needs: fULL_name, email, contact_number, food_type, room_type, amenities, profile_pic
        
        const formattedRoommates = data.matches.map(user => {
            let profilePicData = '/img/User.png'; // Default
            if (user.profile_pic) {
                 // Check if it looks like base64 or buffer. new app.py cleans it up, logic/student_logic.py removed it ("del m['profile_pic']") to avoid JSON errors?
                 // Wait, if Python removes it, we can't show it!
                 // The Python logic `if 'profile_pic' in m: del m['profile_pic']` removes it. 
                 // So we need to re-fetch here OR update Python to return it as base64 string.
                 // Retrying fetch here is safer for large data.
            }
            return {
                fULL_name: user.fULL_name,
                email: user.email,
                contact_number: user.contact_number,
                food_type: user.food_type,
                room_type: user.room_type,
                amenities: user.amenities,
                // placeholder if Python didn't send it. 
                // We'll fix Python later if needed, but for now let's use a placeholder or handle it in Frontend if missing
                profile_pic: '/img/User.png'
            }; 
        });

        // Actually, to get images, we might want to query Mongo here for the IDs returned by Python?
        // Or just let the Python side send ID and we fetch details.
        // For efficiency, let's fetch details here based on IDs from Python.
        
        const matchIds = data.matches.map(m => m._id);
        const completeMatches = await Student.find({ _id: { $in: matchIds } }).select('fULL_name email contact_number food_type room_type amenities profile_pic');
        
        const finalRoommates = completeMatches.map(user => {
             let profilePicData = '/img/User.png'; 
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

        res.json({ success: true, roommates: finalRoommates });

    } catch (err) {
        console.error("FastAPI Roommate Error:", err.message);
        res.status(500).json({ success: false });
    }
};

export const logoutStudent = (req, res) => {
    res.clearCookie('token');
    res.clearCookie('email');
    res.clearCookie('userType');
    res.json({ success: true, message: 'Logged out successfully' });
};
