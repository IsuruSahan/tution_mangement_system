const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Loads the variables from your .env file

// Create the express app
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); // Allows your React app to talk to this API
app.use(express.json()); // Allows the server to accept JSON data in requests

// --- Database Connection ---
// This uses the MONGO_URI from your .env file
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---
// Import the route files we just created
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const locationRoutes = require('./routes/locations');

// Tell express to use these routes
// Any URL starting with /api/students will go to studentRoutes
app.use('/api/students', studentRoutes); 
// Any URL starting with /api/payments will go to paymentRoutes
app.use('/api/payments', paymentRoutes);
// Any URL starting with /api/attendance will go to attendanceRoutes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/locations', locationRoutes);

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});