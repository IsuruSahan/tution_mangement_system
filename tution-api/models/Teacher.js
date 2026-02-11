const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    // Split the name into two parts
    firstName: { 
        type: String, 
        required: true,
        trim: true 
    },
    lastName: { 
        type: String, 
        required: true,
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    instituteName: { 
        type: String, 
        required: true,
        trim: true 
    },
    // New field for the teacher's base city/location
    location: { 
        type: String, 
        required: true,
        trim: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Teacher', teacherSchema);