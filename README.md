# 🏠 Flatmate - Find Your Perfect Roommate & Services

**A novel approach for finding flatmates using NodeJS & Machine Learning.**

![Flatmate Banner](frontend/public/img/Aboutus.jpg)

## 🚀 Overview
**Flatmate** is a comprehensive platform designed to solve the accommodation and daily needs of college students. It connects students with compatible roommates using **Machine Learning clustering algorithms** and provides easy access to essential services like food tiffins, laundry, and brokers.

**Live Demo:** **[https://flatmate-connect.vercel.app](https://flatmate-connect.vercel.app/)**

---

## ✨ Features

### 👨‍🎓 For Students
- **Smart Roommate Matching:** Uses **K-Means Clustering** to find roommates with similar habits, budgets, and preferences.
- **Service Recommendations:** Personalized suggestions for Food, Laundry, and Broker services based on location and budget.
- **Real-time Chat:** Chat instantly with potential service providers.
- **Notifications:** Get alerts when a service provider has a vacancy or when you get a new match.
- **Secure Profile:** Verified profiles to ensure safety.

### 🏪 For Service Providers
- **Business Profile:** Manage your service listings (Food, Laundry, Rent).
- **Vacancy Alerts:** Notify students instantly when you have a vacancy or new offer.
- **Smart Targeting:** Your services are recommended to students who actually need them.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5, CSS3, JavaScript (Vanilla)**
- **Vercel** for Deployment
- **Socket.io Client** for Chat

### Backend (Node.js)
- **Node.js & Express.js**
- **MongoDB** (Database)
- **Socket.io** (Real-time Communication)
- **JWT** (Authentication)
- **Razorpay** (Payment Integration - *Coming Soon*)

### ML Microservices (Python)
- **Python 3.10**
- **FastAPI**
- **Scikit-Learn** (K-Means Clustering)
- **Pandas & NumPy** (Data Processing)

---

## 🏗️ Project Structure
```
📂 A-Novel-approach-for-finding-flatmate-using-NodeJS
├── 📂 backend/          # Node.js Express Server
├── 📂 frontend/         # Static Frontend Files (HTML/CSS/JS)
├── 📂 ml_modules/       # Python FastAPI ML Services
└── 📜 README.md         # Project Documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14+)
- Python (v3.10+)
- MongoDB (Atlas or Local)

### 1️⃣ Backend Setup (Node.js)
```bash
cd backend
npm install
# Create a .env file with generated keys
npm start
```

### 2️⃣ ML Service Setup (Python)
```bash
cd ml_modules
pip install -r requirements.txt
uvicorn app:app --reload
```

### 3️⃣ Frontend Setup
This is a static frontend. You can run it using **Live Server** or serve it via the Backend.
```bash
# Served automatically by Backend on http://localhost:3000
```

---

## 🔑 Environment Variables (.env)
Create a `.env` file in the `backend/` directory:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

---

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License
This project is licensed under the MIT License.

---

## 📹 Video Description: 
https://github.com/user-attachments/assets/5b385898-88a4-4673-b812-2e1841dee133

---
Made with ❤️ by **Team QuadCoders X DevSpire**
