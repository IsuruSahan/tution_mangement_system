const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Make sure cors is required
require('dotenv').config(); // Loads the variables from your .env file

// Create the express app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---

// --- THIS IS THE FIX ---
// Configure CORS to only allow your deployed frontend and localhost
const allowedOrigins = [
    'http://localhost:3000', // For local testing
    'https://tution-mangement-system-8emn.vercel.app' // Your deployed frontend URL
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests) OR from allowed origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`CORS blocked request from origin: ${origin}`); // Log blocked origins
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // If you might use cookies/sessions later
}));
// --- END OF FIX ---

app.use(express.json()); // Allows the server to accept JSON data in requests

// --- Database Connection ---
// Use MONGODB_URI from .env file (assuming it's named MONGODB_URI there)
const dbUri = process.env.MONGODB_URI; // Get URI from environment variable
if (!dbUri) {
    console.error('Error: MONGODB_URI is not defined in the .env file.');
    process.exit(1); // Stop the server if DB URI is missing
}
mongoose.connect(dbUri)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---
// Import the route files
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const locationRoutes = require('./routes/locations');

// Tell express to use these routes
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
// Corrected: Only use attendanceRoutes once
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/locations', locationRoutes);

// --- Simple Root Route (Optional: good for checking if API is live) ---
app.get('/', (req, res) => {
    res.send('Tuition API is running!');
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});