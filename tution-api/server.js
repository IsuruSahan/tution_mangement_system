const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Improved CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',
    'https://tution-mangement-system.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // 1. Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        // 2. Allow if origin is in our hardcoded list
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // 3. Allow ANY Vercel preview/deployment URL from your project
        // This fixes the "kjf5-2fpt6lafc..." error you saw in the logs
        if (origin.includes('.vercel.app')) {
            return callback(null, true);
        }

        // 4. Otherwise, block the request
        console.error(`CORS blocked request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- Standard Middleware ---
app.use(express.json());

// --- Database Connection ---
const dbUri = process.env.MONGODB_URI;

if (!dbUri) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables.');
    // Don't exit(1) on Vercel as it might prevent the logs from showing up correctly
} else {
    mongoose.connect(dbUri)
        .then(() => console.log('✅ MongoDB connected successfully.'))
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message);
        });
}

// --- API Routes ---
// Note: Ensure these files exist in your /routes folder
app.use('/api/students', require('./routes/students'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/locations', require('./routes/locations'));

// --- Root Route / Health Check ---
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'Online', 
        message: 'Tuition API is running!',
        dbConnected: mongoose.connection.readyState === 1
    });
});

// --- Start the Server ---
// For Vercel, app.listen is mostly for local dev; Vercel handles the execution context.
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port: ${PORT}`);
});

module.exports = app; // Required for Vercel functions to export the app