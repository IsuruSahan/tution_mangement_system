const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Make sure cors is required
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',                     // For local testing
    'https://tution-mangement-system-8emn.vercel.app' // YOUR DEPLOYED FRONTEND URL - CHECK THIS CAREFULLY!
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin OR from allowed origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`CORS blocked request from origin: ${origin}`); // Log blocked origins
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Optional, but good practice
}));
// --- END CORS Configuration ---

app.use(express.json());

// --- Database Connection ---
const dbUri = process.env.MONGODB_URI;
if (!dbUri) {
    console.error('Error: MONGODB_URI is not defined.');
    process.exit(1);
}
mongoose.connect(dbUri)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const locationRoutes = require('./routes/locations');

app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/locations', locationRoutes);

// --- Simple Root Route ---
app.get('/', (req, res) => {
    res.send('Tuition API is running!');
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});