import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_PASSWORD
    }
});

export const sendVacancyEmail = async (studentEmail, studentName, providerName, serviceDetails) => {
    const mailOptions = {
        from: `"Flatmate Availability Alert" <${process.env.APP_EMAIL}>`,
        to: studentEmail,
        subject: `New Room Vacancy match for you!`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hello ${studentName},</h2>
                <p>Good news! We found a new room vacancy that matches your preferences.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${providerName}</h3>
                    <p><strong>Contact:</strong> ${serviceDetails.contact}</p>
                    <p><strong>Address:</strong> ${serviceDetails.address}</p>
                    <p><strong>Price:</strong> ${serviceDetails.price}</p>
                    <p><strong>Amenities:</strong> ${serviceDetails.amenities}</p>
                </div>
                <p>Log in to your account to view more details and chat with the provider.</p>
                <a href="http://localhost:3000/studentlogin.html" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Now</a>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Vacancy email sent to ${studentEmail}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
