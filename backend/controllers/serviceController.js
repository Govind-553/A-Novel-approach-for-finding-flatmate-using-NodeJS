import Service from '../models/Service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateToken } from '../utils/tokenUtils.js';
import { hashPassword, comparePassword } from '../utils/passwordUtils.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import Chat from '../models/Chat.js';
import { sendVacancyEmail } from '../utils/emailService.js';
import { broadcastToStudents } from '../utils/socketHandler.js';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.join(__dirname, '../../frontend');
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Login Service
export const loginService = async (req, res) => {
    const { email, password } = req.body;
    try {
        const service = await Service.findOne({ email: email.trim() });
        
        if (service) {
            let isMatch = false;
            if (service.password.startsWith('$2b$') || service.password.startsWith('$2a$')) {
                isMatch = await comparePassword(password.trim(), service.password);
            } else {
                isMatch = service.password === password.trim();
                if (isMatch) {
                    service.password = await hashPassword(password.trim());
                    await service.save();
                }
            }

            if (isMatch) {
                // Generate JWT
                const token = generateToken(service._id, service.email, 'provider');
                
                res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'None', secure: true });
                res.cookie('email', email, { httpOnly: true, sameSite: 'None', secure: true });
                res.cookie('userType', 'provider', { httpOnly: false, sameSite: 'None', secure: true });

                res.json({ success: true, token });
            } else {
                res.json({ success: false, message: 'Invalid credentials' });
            }
        } else {
             res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Register Service (Session)
export const registerServiceSession = async (req, res) => {
    try {
        const serviceType = req.body.service;
        
        const hashedPassword = await hashPassword(req.body.password);

        const sessionData = {
            businessName: req.body.businessName,
            email: req.body.email,
            password: hashedPassword,
            address: req.body.address,
            contactNumber: req.body.contactNumber,
            service: serviceType,
            priceChartLink: req.body.priceChartLink,
            foodType: serviceType === 'Food' ? req.body.foodType : '',
            laundryType: serviceType === 'Laundry' ? req.body['laundryType[]'] : '',
            roomType: serviceType === 'Broker' ? req.body['roomType[]'] : '',
            amenities: serviceType === 'Broker' ? req.body['amenities[]'] : '',
            roomAvailability: serviceType === 'Broker' ? req.body.roomAvailability : '',
            pricingValue: serviceType === 'Broker' ? req.body.pricingValue : '',
            landmark: serviceType === 'Broker' ? req.body['landmark[]'] : ''
        };

        const sessionFileName = `${Date.now()}_session.json`;
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        
        fs.writeFileSync(path.join(uploadDir, sessionFileName), JSON.stringify(sessionData, null, 2));

        res.json({ success: true, sessionFileName });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

export const verifyServiceEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const service = await Service.findOne({ email: email.trim() });
        if (service) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Email not found' });
        }
    } catch (error) {
         res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const resetServicePassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const hashed = await hashPassword(newPassword.trim());
        await Service.findOneAndUpdate({ email: email.trim() }, { password: hashed });
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateServiceProfile = async (req, res) => {
    const email = (req.body.email || req.cookies.email || '').trim(); 
    if (!email) return res.status(400).send('Email missing');

    const serviceType = req.body.service;
    let extraFields = {};
    if (req.body.extra_fields) {
        try {
            extraFields = JSON.parse(req.body.extra_fields);
        } catch (e) {
            console.error(e);
        }
    }
    const updateData = {
        business_Name: req.body.businessName,
        contact_number: req.body.contactNumber,
        address: req.body.address,
        service: serviceType,
        price_chart_link: req.body.priceChartLink
    };

    if (req.body.password && req.body.password.trim() !== '') {
        updateData.password = await hashPassword(req.body.password.trim());
    }

    if (serviceType === 'Food') {
        updateData.food_type = extraFields.food_type;
    } else if (serviceType === 'Laundry') {
        updateData.laundry_service = extraFields.laundry_service;
    } else if (serviceType === 'Broker') {
        const join = (val) => Array.isArray(val) ? val.join(',') : val;
        
        updateData.room_type = join(extraFields.room_type);
        updateData.amenities = join(extraFields.amenities);
        updateData.pricing_value = extraFields.pricing_value;
        updateData.landmark = join(extraFields.landmark);
        updateData.availability = extraFields.availability;
    }

    try {
        const currentService = await Service.findOne({ email });

        const updatedService = await Service.findOneAndUpdate({ email }, updateData, { new: true });
        
        // --- Vacancy Trigger Logic ---
        const currentExtras = currentService.service === 'Broker' && currentService.room_type ? currentService : {};
        const oldAvailability = currentService.availability || '';
        const newAvailability = extraFields.availability;

        if (serviceType === 'Broker' && newAvailability === 'Available' && oldAvailability !== 'Available') {
            console.log('Vacancy detected (Status changed to Available), running matching logic...');
            
            // Criteria to match
            const servicePrice = extraFields.pricing_value; 
            const serviceAmenities = extraFields.amenities; 
            const serviceLandmark = extraFields.landmark; 
            const serviceRoomType = extraFields.room_type; 

            // Fetch students - Ideally use more precise DB query if schema allows
            const students = await Student.find({});
            console.log(`Checking ${students.length} students for match against:`, { servicePrice, serviceRoomType, serviceLandmark });

            for (const student of students) {
                // 1. Price Match
                const priceMatch = !student.pricing_value || student.pricing_value.includes(servicePrice);
                
                // 2. Room Type Match
                 const studentRoomTypes = Array.isArray(student.room_type) ? student.room_type : (student.room_type || '').split(',');
                 const serviceRoomTypes = Array.isArray(serviceRoomType) ? serviceRoomType : (serviceRoomType || '').split(',');
                 const typeMatch = studentRoomTypes.some(t => serviceRoomTypes.includes(t.trim()));

                 // 3. Landmark Match (Location)
                 const studentLocations = Array.isArray(student.landmark) ? student.landmark : (student.landmark || '').split(',');
                 const serviceLocations = Array.isArray(serviceLandmark) ? serviceLandmark : (serviceLandmark || '').split(',');
                 const locationMatch = studentLocations.some(l => serviceLocations.includes(l.trim()));

                 console.log(`Student ${student.email}: PriceMatch=${priceMatch} (${student.pricing_value}), TypeMatch=${typeMatch} (${studentRoomTypes}), LocMatch=${locationMatch} (${studentLocations})`);

                 // 4. Amenities Match (Bonus) - skipping strict amenities match for broader results unless required.
                
                 if (priceMatch && typeMatch && locationMatch) {
                     console.log(`Match found: ${student.email}`);

                     // A. Create Notification
                     const notif = new Notification({
                         recipientId: student._id,
                         payload: {
                             providerName: updatedService.business_Name,
                             contactNumber: updatedService.contact_number,
                             email: updatedService.email,
                             chatId: null // will fill after creating chat
                         }
                     });
                     
                     // B. Create/Find Chat
                     let chat = await Chat.findOne({ studentId: student._id, serviceId: updatedService._id });
                     if (!chat) {
                         chat = new Chat({
                             studentId: student._id,
                             serviceId: updatedService._id
                         });
                         await chat.save();
                     }
                     
                     notif.payload.chatId = chat._id;
                     await notif.save();

                     // C. Broadcast Real-time
                     broadcastToStudents([student._id.toString()], {
                         type: 'NOTIFICATION',
                         notification: notif
                     });

                     // D. Send Email
                     const emailName = student.fULL_name || 'Student';
                     console.log(`Sending email to ${student.email}. Name: ${student.fULL_name} -> Used: ${emailName}`);
                     
                     await sendVacancyEmail(student.email, emailName, updatedService.business_Name, {
                         contact: updatedService.contact_number,
                         address: updatedService.address,
                         price: servicePrice,
                         amenities: serviceAmenities
                     });
                 }
            }
        }
        
        // Trigger Service Clustering
        try {
            await axios.post('https://flatmate-python-backend.onrender.com/cluster/services?sync=true');
        } catch (clusterErr) {
            console.error("Service Clustering Error:", clusterErr.message);
        }

        res.send('Profile updated successfully');
    } catch (err) {
        console.error('[updateServiceProfile] Database error:', err);
        res.status(500).send('Database error: ' + err.message);
    }
};

export const getServiceProfile = async (req, res) => {
    const email = req.query.email || req.cookies.email;
    
    // If JSON format requested, enforce strict auth
    if (!email && req.query.format === 'json') {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
    
    try {
        const service = email ? await Service.findOne({ email }) : null;
        if (email && !service) return res.status(404).send('Service provider not found');

        let data = null;

        if (service) {
            let extraFields = {};
            if (service.service === 'Food') {
                extraFields.food_type = service.food_type || '';
            } else if (service.service === 'Laundry') {
                extraFields.laundry_service = service.laundry_service || '';
            } else if (service.service === 'Broker') {
                extraFields.room_type = (service.room_type || '').split(',').map(v => v.trim());
                extraFields.amenities = (service.amenities || '').split(',').map(v => v.trim());
                extraFields.pricing_value = service.pricing_value || '';
                extraFields.landmark = (service.landmark || '').split(',').map(v => v.trim());
                extraFields.availability = service.availability || '';
            }

            data = {
                businessName: service.business_Name || '',
                email: service.email || '',
                address: service.address || '',
                contactNumber: service.contact_number || '',
                service: service.service || '',
                password: '', 
                priceChartLink: service.price_chart_link || '',
                extraFields: JSON.stringify(extraFields)
            };
        }

        const profilePath = path.join(frontendDir, 'serviceProfile.html');
        fs.readFile(profilePath, 'utf8', (err, html) => {
             if (err) {
                 console.error(err);
                 return res.status(500).send('Error loading profile page');
             }
             
             if (req.query.format === 'json') {
                 return res.json({ success: true, serviceData: data });
             }

             let filledHtml = html;
             
             if (data) {
                 for (const key in data) {
                     const regex = new RegExp(`{{${key}}}`, 'g');
                     filledHtml = filledHtml.replace(regex, data[key]);
                 }
             } else {
                 const keys = ['businessName', 'email', 'address', 'contactNumber', 'service', 'priceChartLink', 'extraFields'];
                 keys.forEach(key => {
                     const regex = new RegExp(`{{${key}}}`, 'g');
                     filledHtml = filledHtml.replace(regex, '');
                 });
             }

             res.send(filledHtml);
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching data');
    }
};
