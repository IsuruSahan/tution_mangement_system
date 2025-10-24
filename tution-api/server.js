const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Make sure cors is required
require('dotenv').config(); // Load environment variables from .env file

const app = express();
// Use port from environment variable (provided by Vercel) or default to 5000 locally
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',                              // For local testing
    'https://tution-mangement-system-kjf5.vercel.app' // <<< YOUR DEPLOYED FRONTEND URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl) OR from allowed origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`CORS blocked request from origin: ${origin}`); // Log blocked origins
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Optional: allows cookies/authorization headers if needed later
}));
// --- END CORS Configuration ---

// --- Standard Middleware ---
app.use(express.json()); // Allow the server to parse JSON request bodies

// --- Database Connection ---
const dbUri = process.env.MONGODB_URI; // Read connection string from environment variable
if (!dbUri) {
    console.error('CRITICAL ERROR: MONGODB_URI environment variable is not defined.');
    process.exit(1); // Stop the server if the database connection string is missing
}

mongoose.connect(dbUri)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
         console.error('MongoDB connection error:', err);
         // Consider exiting if the initial connection fails: process.exit(1);
     });

// --- API Routes ---
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const locationRoutes = require('./routes/locations');

// Mount the routes
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/locations', locationRoutes);

// --- Simple Root Route (for health check) ---
app.get('/', (req, res) => {
    res.status(200).send('Tuition API is running!'); // Send a 200 OK status
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});