import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Service from '../models/Service.js';
import { generateToken } from '../utils/tokenUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, 
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Safe upload directory function
const getUploadDir = () => {
    const dir = path.join(__dirname, '../uploads'); 
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
};

export const createCheckoutSession = async (req, res) => {
    const { sessionFileName, amount, planName } = req.body;
    
    if (!sessionFileName) {
        return res.status(400).send('Session file name is missing');
    }

    // Validate Amount (Security Check)
    const validAmounts = [299, 799, 1499, 2999];
    const amountInRupees = parseInt(amount);

    if (!validAmounts.includes(amountInRupees)) {
        return res.status(400).send('Invalid plan amount selected');
    }
    
    const sessionFilePath = path.join(getUploadDir(), sessionFileName);
    
    if (!fs.existsSync(sessionFilePath)) {
         return res.status(404).send('Session data not found. Please register again.');
    }

    fs.readFile(sessionFilePath, 'utf-8', async (err, data) => {
        if (err) {
            return res.status(500).send(`Error reading session data: ${err.message}`);
        }
        const sessionData = JSON.parse(data);
        
        sessionData.selectedPlan = { name: planName, amount: amountInRupees };

        try {
            const order = await instance.orders.create({
                amount: amountInRupees * 100, // Convert to paise
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
        if (!fs.existsSync(orderFilePath)) {
            throw new Error('Order session file not found');
        }

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
            landmark: sessionData.landmark || null,
        });

        const savedService = await newService.save();

        // Auto-Login
        const token = generateToken(savedService._id, savedService.email, 'provider');
        res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        res.cookie('email', savedService.email, { httpOnly: true });
        res.cookie('userType', 'provider', { httpOnly: false });

        // Redirect using client-side replacement to fix Back button history
        res.send(`
            <script>
                window.location.replace('/servicelogin?registration=success');
            </script>
        `);
    } catch (error) {
        console.error('Payment Completion Error:', error);
        res.status(500).send(`Error completing payment: ${error.message}`);
    }
};

export const cancelPayment = (req, res) => {
    res.redirect('/'); 
};
