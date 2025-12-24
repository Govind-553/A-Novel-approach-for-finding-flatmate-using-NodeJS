import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Service from '../models/Service.js';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, 
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const getUploadDir = () => path.join(__dirname, '../../frontend/public/uploads/');

export const createCheckoutSession = async (req, res) => {
    const { sessionFileName } = req.body;
    if (!sessionFileName) {
        return res.status(400).send('Session file name is missing');
    }
    const sessionFilePath = path.join(getUploadDir(), sessionFileName);
    
    fs.readFile(sessionFilePath, 'utf-8', async (err, data) => {
        if (err) {
            return res.status(500).send(`Error reading session data: ${err.message}`);
        }
        const sessionData = JSON.parse(data);
        try {
            const order = await instance.orders.create({
                amount: 299 * 100, // ₹299
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            });

            const orderFilePath = path.join(getUploadDir(), `${order.id}.json`);
            fs.writeFileSync(orderFilePath, JSON.stringify(sessionData));
            res.json({
                key: process.env.RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                orderId: order.id
            });
        } catch (error) {
            res.status(500).send(`Error creating order: ${error.message}`);
        }
    });
};

export const completePayment = async (req, res) => {
    const { payment_id, order_id } = req.query;

    if (!payment_id || !order_id) {
        return res.status(400).send('Invalid payment details');
    }
    const orderFilePath = path.join(getUploadDir(), `${order_id}.json`);
    
    try {
        const sessionData = JSON.parse(fs.readFileSync(orderFilePath));
        
        const newService = new Service({
            business_Name: sessionData.businessName,
            email: sessionData.email,
            password: sessionData.password,
            address: sessionData.address,
            contact_number: sessionData.contactNumber,
            service: sessionData.service,
            price_chart_link: sessionData.priceChartLink,
            food_type: sessionData.foodType || null,
            laundry_service: sessionData.laundryType || null,
            room_type: sessionData.roomType || null,
            amenities: sessionData.amenities || null,
            availability: sessionData.roomAvailability || null,
            pricing_value: sessionData.pricingValue || null,
            landmark: sessionData.landmark || null
        });

        await newService.save();

        res.redirect('/servicelogin?registration=success');
    } catch (error) {
        console.error('Payment Completion Error:', error);
        res.status(500).send('Error completing payment');
    }
};

export const cancelPayment = (req, res) => {
    res.redirect('/'); // Redirect to home page
};
