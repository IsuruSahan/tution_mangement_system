const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 🔥 TEMP DEBUG LOG: check env
console.log("🔍 process.env.MONGODB_URI:", process.env.MONGODB_URI);

// --- Improved CORS Configuration ---
const allowedOrigins = [
    'http://localhost:3000',
    'https://tution-mangement-system.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Postman / mobile apps

        if (allowedOrigins.includes(origin)) return callback(null, true);

        if (origin.includes('.vercel.app')) return callback(null, true);

        console.error(`CORS blocked request from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- Middleware ---
app.use(express.json());

// --- Database Connection ---
const dbUri = process.env.MONGODB_URI;

if (!dbUri) {
    console.error('❌ CRITICAL ERROR: MONGODB_URI is not defined!');
} else {
    console.log("✅ Attempting DB connection...");
    mongoose.connect(dbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));
}

// --- API Routes ---
// Replace these with your actual route files
app.use('/api/students', require('./routes/students'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/locations', require('./routes/locations'));

// --- Health Check & DB Status ---
app.get('/', (req, res) => {
    res.json({
        status: 'Online',
        message: 'Tuition API is running!',
        dbConnected: mongoose.connection.readyState === 1 ? true : false
    });
});

// --- Check ENV variable route ---
app.get('/check-env', (req, res) => {
    res.json({
        MONGODB_URI: process.env.MONGODB_URI ? "✅ Loaded" : "❌ Missing"
    });
});

// --- Start Server (for local dev) ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app; // Required for Vercel