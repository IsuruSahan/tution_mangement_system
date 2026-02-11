const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000', 
    'https://tution-mangement-system-kjf5.vercel.app' 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true 
}));

// --- Standard Middleware ---
app.use(express.json()); 

// --- Database Connection ---
const dbUri = process.env.MONGODB_URI;
if (!dbUri) {
    console.error('CRITICAL ERROR: MONGODB_URI environment variable is not defined.');
    process.exit(1); 
}

mongoose.connect(dbUri)
    .then(() => console.log('✅ MongoDB Multi-Tenant Cluster connected.'))
    .catch(err => {
         console.error('❌ MongoDB connection error:', err);
    });

// --- IMPORT NEW AND EXISTING ROUTES ---
const authRoutes = require('./routes/auth'); // New Auth Feature
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const locationRoutes = require('./routes/locations');

// --- MOUNT THE ROUTES ---
// Public Routes
app.use('/api/auth', authRoutes);

// Protected Routes (Authentication logic is inside these files)
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/locations', locationRoutes);

// --- Simple Root Route ---
app.get('/', (req, res) => {
    res.status(200).send('Tuition Multi-Tenant API is running!'); 
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on port: ${PORT}`);
    // Safety check for the new security feature
    if (!process.env.JWT_SECRET) {
        console.warn('⚠️ WARNING: JWT_SECRET is not defined in .env! Authentication will fail.');
    } else {
        console.log('🔒 Security: JWT_SECRET is loaded.');
    }
});