const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- TEMP: Log environment variable ---
console.log("🔍 Checking MONGODB_URI...");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Exists" : "Undefined");

// --- CORS setup ---
const allowedOrigins = [
    'http://localhost:3000',
    'https://tution-mangement-system.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) return callback(null, true);
        console.error(`CORS blocked request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

// --- Vercel-safe MongoDB connection ---
const dbUri = process.env.MONGODB_URI;

async function connectDB() {
    if (!dbUri) {
        console.error('❌ MONGODB_URI is undefined! Please set it in Vercel environment variables.');
        return;
    }

    try {
        console.log("⏳ Attempting MongoDB connection...");
        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully!');
    } catch (err) {
        console.error('❌ MongoDB connection FAILED!');
        console.error('Full error:', err);
    }
}

// Call connection
connectDB();

// --- API routes ---
app.use('/api/students', require('./routes/students'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/locations', require('./routes/locations'));

// --- Health check ---
app.get('/', (req, res) => {
    res.json({
        status: 'Online',
        message: 'Tuition API is running!',
        dbConnected: mongoose.connection.readyState === 1
    });
});

// --- Server listen (for local dev) ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;