import Service from '../models/Service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.join(__dirname, '../../frontend');
const uploadDir = path.join(frontendDir, 'public/uploads');

// Login Service
export const loginService = async (req, res) => {
    const { email, password } = req.body;
    try {
        const service = await Service.findOne({ email: email.trim(), password: password.trim() });
        if (service) {
            res.cookie('email', email, { httpOnly: true });
            res.cookie('userType', 'provider', { httpOnly: true });
            res.json({ success: true });
        } else {
             res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Register Service (Initial step before payment)
export const registerServiceSession = (req, res) => {
    
    try {
        const serviceType = req.body.service;
        
        const sessionData = {
            businessName: req.body.businessName,
            email: req.body.email,
            password: req.body.password,
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

        const subscriptionPath = path.join(frontendDir, 'subscriptionPage.html');
        // Check if file exists to handle errors gracefully? 
        if (fs.existsSync(subscriptionPath)) {
            let html = fs.readFileSync(subscriptionPath, 'utf8');
            html = html.replace('{{sessionFileName}}', sessionFileName); 
            res.send(html);
        } else {
             res.status(500).send('Subscription page not found');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

// Update Service Profile
export const updateServiceProfile = async (req, res) => {
    const email = (req.body.email || req.cookies.email || '').trim(); // Body parser or cookie
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
        password: req.body.password,
        contact_number: req.body.contactNumber,
        address: req.body.address,
        service: serviceType,
        price_chart_link: req.body.priceChartLink
    };

    if (serviceType === 'Food') {
        updateData.food_type = extraFields.food_type;
    } else if (serviceType === 'Laundry') {
        updateData.laundry_service = extraFields.laundry_service;
    } else if (serviceType === 'Broker') {
        // Handle array fields being joined
        const join = (val) => Array.isArray(val) ? val.join(',') : val;
        
        updateData.room_type = join(extraFields.room_type);
        updateData.amenities = join(extraFields.amenities);
        updateData.pricing_value = extraFields.pricing_value;
        updateData.landmark = join(extraFields.landmark);
        updateData.availability = extraFields.availability;
    }

    try {
        await Service.findOneAndUpdate({ email }, updateData);
        res.send('Profile updated successfully');
    } catch (err) {
        console.error('[updateServiceProfile] Database error:', err);
        res.status(500).send('Database error: ' + err.message);
    }
};

// Get Service Profile Data (HTML render)
export const getServiceProfile = async (req, res) => {
    const email = req.query.email || req.cookies.email;
    if (!email) return res.status(400).send('Missing email');

    try {
        const service = await Service.findOne({ email });
        if (!service) return res.status(404).send('Service provider not found');

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

        const data = {
            businessName: service.business_Name || '',
            email: service.email || '',
            address: service.address || '',
            contactNumber: service.contact_number || '',
            service: service.service || '',
            password: service.password || '',
            priceChartLink: service.price_chart_link || '',
            extraFields: JSON.stringify(extraFields)
        };

        const profilePath = path.join(frontendDir, 'serviceProfile.html');
        fs.readFile(profilePath, 'utf8', (err, html) => {
             if (err) {
                 console.error(err);
                 return res.status(500).send('Error loading profile page');
             }
             
             let filledHtml = html;
             for (const key in data) {
                 // Replace {{key}} string
                 const regex = new RegExp(`{{${key}}}`, 'g');
                 filledHtml = filledHtml.replace(regex, data[key]);
             }
             res.send(filledHtml);
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching data');
    }
};
