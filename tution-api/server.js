const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Make sure cors is required
require('dotenv').config();

// --- ADD DEBUG LOGS HERE ---
console.log('--- Environment Variables Loaded ---');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT Variable:', process.env.PORT); // Check if PORT from .env is loaded (if you have one)
console.log('---------------------------------');
// --- END DEBUG LOGS ---

const app = express();
// Use process.env.PORT if defined, otherwise default to 5000
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',                     // For local testing
    'https://tution-mangement-system-8emn.vercel.app' // YOUR DEPLOYED FRONTEND URL
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
// --- END CORS Configuration ---

app.use(express.json());

// --- Database Connection ---
const dbUri = process.env.MONGODB_URI; // This reads the variable logged above
if (!dbUri) {
    console.error('Error: MONGODB_URI is not defined in process.env.'); // More specific error
    process.exit(1); // Exit if DB connection string is missing
}

// Attempt connection only if dbUri is defined
mongoose.connect(dbUri)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
         console.error('MongoDB connection error:', err);
         // Optionally exit if connection fails critically on start
         // process.exit(1);
     });

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