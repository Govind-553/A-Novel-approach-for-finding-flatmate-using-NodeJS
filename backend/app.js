require('dotenv').config();
const pool = require('./database'); 
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const cookieparser = require('cookie-parser');
const express = require('express');
const app = express();
const Razorpay = require('razorpay');

// Middleware setup
app.use(cookieparser());
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, '../frontend/views')); 
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

// Initialize Razorpay instance
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, 
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Route to render the main page with both services and profiles data
app.get('/mainpage', (req, res) => {
    const servicesQuery = 'SELECT business_Name, contact_number, email, service, price_chart_link FROM services';
    const profilesQuery = 'SELECT full_name, year, branch, contact_number, email, profile_pic FROM STUDENTS';

    Promise.all([
        new Promise((resolve, reject) => {
            pool.query(servicesQuery, (err, results) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        }),
        new Promise((resolve, reject) => {
            pool.query(profilesQuery, (err, results) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    // Map and format profile data
                    const profiles = results.map(user => {
                        const profilePicBase64 = user.profile_pic ? `data:image/jpeg;base64,${user.profile_pic.toString('base64')}` : null;

                        return {
                            full_name: user.full_name,
                            year: user.year,
                            branch: user.branch,
                            contact_number: user.contact_number,
                            email: user.email,
                            profile_pic: profilePicBase64  
                        };
                    });
                    resolve(profiles);
                }
            });
        })
    ])
    .then(([services, profiles]) => {
        // Render the index.ejs file with both services and profiles data
        res.render('mainpage', { services, profiles });
    })
    .catch(err => {
        console.error('Error fetching data:', err);
        res.status(500).send('Internal Server Error');
    });
});
// Server teamprofiles page
app.get('/teampage', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/teampage', 'index.html'));
});
// Serve homepage
app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/homepage', 'index.html'));
});

// Serve login page
app.get('/loginpage', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/loginpage', 'index.html'));
});

// Serve registration page
app.get('/registrationpage', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/registrationpage', 'index.html'));
});

app.get('/data', (req, res) => {
    const servicesQuery = 'SELECT business_Name, contact_number, email, service, price_chart_link FROM services';
    const profilesQuery = 'SELECT full_name, year, branch, contact_number, email, profile_pic FROM STUDENTS';

    Promise.all([
        new Promise((resolve, reject) => {
            pool.query(servicesQuery, (err, results) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        }),
        new Promise((resolve, reject) => {
            pool.query(profilesQuery, (err, results) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    const profiles = results.map(user => {
                        const profilePicBase64 = user.profile_pic ? `data:image/jpeg;base64,${user.profile_pic.toString('base64')}` : null;
                        return {
                            full_name: user.full_name,
                            year: user.year,
                            branch: user.branch,
                            contact_number: user.contact_number,
                            email: user.email,
                            profile_pic: profilePicBase64
                        };
                    });
                    resolve(profiles);
                }
            });
        })
    ])
    .then(([services, profiles]) => {
        res.status(200).json({ services, profiles });
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Internal Server Error');
    });
});

// Route for profile page
app.get('/profilepage', (req, res) => {

    const email = req.query.email || req.cookies.email; 

    if (!email) {
        return res.status(400).send('Missing email parameter');
    }

    const query = 'SELECT * FROM STUDENTS WHERE email = ?';
    pool.query(query, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching profile data');
        }
        if (result.length > 0) {
            // Profile exists
            const user = result[0];
            fs.readFile(path.join(__dirname, '../frontend/profilepage', 'index.html'), 'utf8', (err, content) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error loading profile page');
                }

                let modifiedContent = content.replace('{{userData}}', JSON.stringify(user));

                const profileImage = user.profile_pic;  

                if (!profileImage) {
                    console.error('Profile image is missing or null');
                    return res.status(500).send('Profile image is missing');
                }

                const detectImageType = (buffer) => {
                    const jpgMagicNumber = [0xff, 0xd8, 0xff];
                    const pngMagicNumber = [0x89, 0x50, 0x4e, 0x47];

                    if (buffer.slice(0, 3).equals(Buffer.from(jpgMagicNumber))) {
                        return 'jpeg';
                    } else if (buffer.slice(0, 4).equals(Buffer.from(pngMagicNumber))) {
                        return 'png';
                    } else {
                        return null;  
                    }
                };

                // Detect the image type from the binary data
                const imageType = detectImageType(profileImage);

                if (!imageType) {
                    console.error('Unsupported or unknown image type');
                    return res.status(500).send('Unsupported or unknown image type');
                }

                let contentType;
                switch (imageType) {  
                    case 'jpeg':
                        contentType = 'image/jpeg';
                        break;
                    case 'png':
                        contentType = 'image/png';
                        break;
                    default:
                        console.error('Unsupported image type:', imageType);
                        return res.status(500).send('Unsupported image type');
                }

                // Convert the binary image data to Base64
                const base64Image = Buffer.from(profileImage, 'binary').toString('base64');
                const profileImageSrc = `data:${contentType};base64,${base64Image}`;

                modifiedContent = modifiedContent.replace('{{profileImage}}', profileImageSrc);

                return res.status(200).send(modifiedContent);
            });
        } else {
            return res.status(404).send('User not found');
        }
    });
});

// Login Route for Students
app.post('/login', (req, res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    const query = 'SELECT * FROM STUDENTS WHERE email = ? AND password = ?';
    pool.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('SQL Query Error:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        if (results.length > 0) {
            res.cookie('email', email, { httpOnly: true });
            res.cookie('userType', 'student', { httpOnly: true }); 
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// route for register functionality
app.post('/register-user', (req, res) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../frontend/public', 'uploads');
    form.keepExtensions = true;

    if (!fs.existsSync(form.uploadDir)) {
        fs.mkdirSync(form.uploadDir);
    }

    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Form parsing error:', err);
            return res.status(500).send('Error parsing form data');
        }

        // Handle multiple selections by joining arrays with commas
        const amenities = Array.isArray(fields.amenities) ? fields.amenities.join(', ') : fields.amenities || '';
        const landmark = Array.isArray(fields.landmark) ? fields.landmark.join(', ') : fields.landmark || '';

        // Process profile image if uploaded
        let profilePicData = null;
        if (files.profileImage && files.profileImage[0] && files.profileImage[0].size > 0) {
            if (files.profileImage[0].size > 5000000) { 
                console.error('Image size exceeds limit:', files.profileImage[0].size);
                return res.status(400).send('Image size exceeds 5MB limit');
            }
            var oldPath = files.profileImage[0].filepath; 
            var newFileName = Date.now() + '_' + files.profileImage[0].originalFilename;  
            var newPath = path.join(form.uploadDir, newFileName);

            // Move the file to the final location
            fs.rename(oldPath, newPath, (error) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('Internal Server Error');
                }

                // Read the image file and store its binary data
                fs.readFile(newPath, (err, data) => {
                    if (err) {
                        console.error('Error reading image file:', err);
                        return res.status(500).send('Internal Server Error');
                    }
                    profilePicData = data;
                    saveToDatabase();
                });
            });
        } else {
            saveToDatabase();
        }
        function saveToDatabase() {
            const query = `
                INSERT INTO STUDENTS (
                    full_name, email, password, address, contact_number, year, branch, 
                    about_yourself, profile_pic, food_type, room_type, amenities, 
                    pricing_value, landmark
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            pool.query(query, [
                fields.fullName || '',
                fields.email || '',
                fields.password || '',
                fields.address || '',
                fields.contactNumber || '',
                fields.Year || '',
                fields.Branch || '',
                fields.AboutYourself || '',
                profilePicData, 
                fields.foodType || '',
                fields.roomType || '',
                amenities,
                fields.pricingValue || '',
                landmark
            ], (err, result) => {
                if (err) {
                    console.error('Database insertion error:', err);
                    return res.status(500).send('Error registering student');
                }
                res.status(200).send('Student registered successfully');
            });
        }
    });
});

//Save profile functionality 
app.post('/saveProfile', (req, res) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../frontend/public', 'uploads');
    form.keepExtensions = true;

    if (!fs.existsSync(form.uploadDir)) {
        fs.mkdirSync(form.uploadDir, { recursive: true });
    }

    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(500).send('Error parsing form data');
        }

        const processImageUpload = () => {
            return new Promise((resolve, reject) => {
                if (files.profileImage && files.profileImage.size > 0) {
                    if (files.profileImage.size > 5000000) {
                        return reject('Image size exceeds 5MB limit');
                    }

                    const oldPath = files.profileImage.filepath;
                    const fileExtension = path.extname(files.profileImage.originalFilename);
                    const newFileName = Date.now() + '_' + files.profileImage.originalFilename;
                    const newPath = path.join(form.uploadDir, newFileName);

                    fs.rename(oldPath, newPath, (err) => {
                        if (err) {
                            return reject('Error moving uploaded file');
                        }

                        fs.readFile(newPath, (err, data) => {
                            if (err) {
                                return reject('Error reading image file');
                            }
                            resolve({ imagePath: newPath, imageData: data });
                        });
                    });
                } else {
                    resolve({ imagePath: null, imageData: null });
                }
            });
        };

        processImageUpload()
            .then(({ imagePath, imageData }) => {
                const updateQuery = `
                    UPDATE STUDENTS 
                    SET 
                        full_name = ?, 
                        email = ?, 
                        password = ?, 
                        address = ?, 
                        contact_number = ?, 
                        year = ?, 
                        branch = ?, 
                        about_yourself = ?, 
                        profile_pic = ? 
                    WHERE email = ?
                `;

                pool.query(updateQuery, [
                    fields.fullName,
                    fields.email,
                    fields.password,
                    fields.address,
                    fields.contactNumber,
                    fields.Year,
                    fields.Branch,
                    fields.AboutYourself,
                    imageData,
                    fields.email
                ], (err, result) => {
                    if (err) {
                        return res.status(500).send('Error updating profile');
                    }

                    res.send('Profile updated successfully.');
                });
            })
            .catch((error) => {
                res.status(400).send(error);
            });
    });
});

//-----------------------Services routes-----------------------//

// Serve homepage
app.get('/servicehomepage', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/servicehomepage', 'index.html'));
});

// Serve login page
app.get('/servicelogin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/servicelogin', 'login.html'));
});

// Serve registration page
app.get('/serviceregister', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/serviceregister', 'register.html'));
});

//Route for profile page of services 
app.get('/serviceprofile', (req, res) => {
    const email = req.query.email || req.cookies.email;

    if (!email) {
        return res.status(400).send('Missing email parameter');
    }

    const query = 'SELECT * FROM services WHERE email = ?';
    pool.query(query, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching profile data');
        }

        if (result.length > 0) {
            const service = result[0];

            fs.readFile(path.join(__dirname, '../frontend/serviceprofile', 'profile.html'), 'utf8', (err, content) => {
                if (err) {
                    return res.status(500).send('Error loading service profile page');
                }

                // Replace placeholders in the HTML content
                const modifiedContent = content
                    .replace('{{businessName}}', service.business_Name)
                    .replace('{{email}}', service.email)
                    .replace('{{address}}', service.address)
                    .replace('{{contactNumber}}', service.contact_number)
                    .replace('{{service}}', service.service)
                    .replace('{{password}}', service.password)
                    .replace('{{priceChartLink}}', service.price_chart_link);

                return res.status(200).send(modifiedContent);
            });
        } else {
            return res.status(404).send('Service provider not found');
        }
    });
});

// Login Route for Service Providers
app.post('/login-service', (req, res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    const query = 'SELECT * FROM services WHERE email = ? AND password = ?';
    pool.query(query, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
        if (results.length > 0) {
            res.cookie('email', email, { httpOnly: true });
            res.cookie('userType', 'provider', { httpOnly: true });
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    });
})

// ✅ Route for Service Registration
app.post('/register', (req, res) => {
    const form = new formidable.IncomingForm({
        multiples: true,
        keepExtensions: true
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error processing form:', err);
            return res.status(500).send('Error processing form');
        }

        try {
            console.log('Raw fields:', fields);

            const processField = (field) => {
                if (Array.isArray(field) && field.length > 0) {
                    return field.join(', ');
                }
                return field || '';
            };

            const service = processField(fields.service);
            const foodType = service === 'Food' ? processField(fields.foodType) : '';
            const laundryType = service === 'Laundry' ? processField(fields.laundryType) : '';
            const roomType = service === 'Broker' ? processField(fields.roomType) : '';
            const amenities = service === 'Broker' ? processField(fields.amenities) : '';
            const pricingValue = service === 'Broker' ? processField(fields.pricingValue) : '';
            const landmark = service === 'Broker' ? processField(fields.landmark) : '';

            const sessionData = {
                businessName: processField(fields.businessName),
                email: processField(fields.email),
                password: processField(fields.password),
                address: processField(fields.address),
                contactNumber: processField(fields.contactNumber),
                service: service,
                priceChartLink: processField(fields.priceChartLink),
                foodType: foodType,
                laundryType: laundryType,
                roomType: roomType,
                amenities: amenities,
                pricingValue: pricingValue,
                landmark: landmark
            };

            console.log('Session data:', sessionData);

            const sessionFileName = `${Date.now()}_session.json`;
            const sessionFilePath = path.join(__dirname, '../frontend/public/uploads/', sessionFileName);
            fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2));

            res.render('index', { sessionFileName });
        } catch (error) {
            console.error('Error saving session data:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});
// ✅ Create Checkout Session
app.post('/create-checkout-session', async (req, res) => {
    const { sessionFileName } = req.body;
    if (!sessionFileName) {
        return res.status(400).send('Session file name is missing');
    }
    const sessionFilePath = path.resolve(__dirname, '../frontend/public/uploads/', sessionFileName);
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

            const orderFilePath = path.resolve(__dirname, '../frontend/public/uploads/', `${order.id}.json`);
            fs.writeFileSync(orderFilePath, JSON.stringify(sessionData));
            res.json({
                key: process.env.RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                orderId: order.id
            });
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            res.status(500).send(`Error creating order: ${error.message}`);
        }
    });
});

// ✅ Payment Completion Route
app.get('/complete', async (req, res) => {
    const { payment_id, order_id } = req.query;

    if (!payment_id || !order_id) {
        return res.status(400).send('Invalid payment details');
    }
    const orderFilePath = path.resolve(__dirname, '../frontend/public/uploads/', `${order_id}.json`);
    try {
        const sessionData = JSON.parse(fs.readFileSync(orderFilePath));

        // Log session data before database insertion
        console.log('Data to insert into DB:', sessionData);

        const query = `
            INSERT INTO services (
                business_name, email, password, address, contact_number, service, 
                price_chart_link, food_type, laundry_service, room_type, amenities, 
                pricing_value, landmark
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        pool.query(query, [
            sessionData.businessName,
            sessionData.email,
            sessionData.password,
            sessionData.address,
            sessionData.contactNumber,
            sessionData.service,
            sessionData.priceChartLink,
            sessionData.foodType || null,
            sessionData.laundryType || null,
            sessionData.roomType || null,
            sessionData.amenities || null,
            sessionData.pricingValue || null,
            sessionData.landmark || null
        ], (err, result) => {
            if (err) {
                console.error('Database insertion error:', err);
                return res.status(500).send('Error registering business');
            }
            res.render('success', {
                message: 'Your payment was successful, and your business has been registered.',
                redirectUrl: '/servicelogin'
            });
        });
    } catch (error) {
        console.error('Error completing payment:', error);
        res.status(500).send('Error completing payment');
    }
});

// Payment cancellation
app.get('/cancel', (req, res) => {
    res.redirect('http://localhost:3000/mainpage');
});

// update the service profile
app.post('/profile-update', (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).send('Error processing form');
        }
        const email = fields.email; 
        if (!email) {
            return res.status(400).send('Email is required');
        }

        const query = `
            UPDATE services
            SET business_Name = ?, 
                password = ?,
                contact_number = ?,
                address = ?,
                service = ?,
                price_chart_link = ?
            WHERE email = ?
        `;

        // Execute the query with updated data
        pool.query(
            query, 
            [
                fields.businessName,
                fields.password,
                fields.contactNumber,
                fields.address,
                fields.service,
                fields.priceChartLink,
                email
            ],
            (err, result) => {
                if (err) {
                    console.error('Error updating profile:', err);
                    return res.status(500).send('Error updating profile');
                }

                return res.send('Profile updated successfully'); 
            }
        );
    });
});

// Start the Express server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000/mainpage');
});